import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { DesktopAppClient } from './desktopAppClient';
import { TraceData } from '../types';

export class TraceCaptureService implements vscode.Disposable {
  private isCapturing = false;
  private fileWatcher: vscode.FileSystemWatcher | null = null;
  private httpEndpoint: any = null;
  private capturedTraces: TraceData[] = [];
  private disposables: vscode.Disposable[] = [];
  private traceCapturedCallback?: (traces: TraceData[]) => void;
  private tracingStatusCallback?: (isActive: boolean) => void;

  constructor(private desktopAppClient: DesktopAppClient) {
    // Initialize the service
    this.setupEnvironmentVariables();
  }

  /**
   * Start capturing traces from the workspace
   */
  async startCapture(workspacePath?: string): Promise<boolean> {
    try {
      if (this.isCapturing) {
        return true;
      }

      console.log('Starting trace capture...');
      this.isCapturing = true;

      // Set up environment variables for SDKs
      this.setupEnvironmentVariables(workspacePath);

      // Start file watching for trace files
      if (workspacePath) {
        this.startFileWatching(workspacePath);
      }

      // Start HTTP endpoint for receiving traces
      await this.startHttpEndpoint();

      // Notify status change
      if (this.tracingStatusCallback) {
        this.tracingStatusCallback(true);
      }

      // Try to connect to desktop app if available
      if (this.desktopAppClient && !this.desktopAppClient.isConnected) {
        try {
          await this.desktopAppClient.connect();
        } catch (error) {
          console.warn('Desktop app not available, using fallback mode');
        }
      }

      console.log('Trace capture started successfully');
      return true;

    } catch (error) {
      console.error('Failed to start trace capture:', error);
      this.isCapturing = false;
      return false;
    }
  }

  /**
   * Stop capturing traces
   */
  async stopCapture(): Promise<void> {
    try {
      if (!this.isCapturing) {
        return;
      }

      console.log('Stopping trace capture...');
      this.isCapturing = false;

      // Stop file watching
      this.stopFileWatching();

      // Stop HTTP endpoint
      this.stopHttpEndpoint();

      // Clear environment variables
      delete process.env.FLOWSCOPE_ENABLED;
      delete process.env.FLOWSCOPE_MODE;
      delete process.env.FLOWSCOPE_API_ENDPOINT;

      // Notify status change
      if (this.tracingStatusCallback) {
        this.tracingStatusCallback(false);
      }

      console.log('Trace capture stopped');

    } catch (error) {
      console.error('Error stopping trace capture:', error);
    }
  }

  /**
   * Check if currently capturing traces
   */
  isCapturingTraces(): boolean {
    return this.isCapturing;
  }

  /**
   * Get all captured traces
   */
  async getTraces(): Promise<TraceData[]> {
    if (this.desktopAppClient.isConnected) {
      try {
        return await this.desktopAppClient.getTraces();
      } catch (error) {
        console.warn('Failed to get traces from desktop app:', error);
      }
    }
    
    return this.capturedTraces;
  }

  /**
   * Get traces synchronously (local only)
   */
  getTracesSync(): TraceData[] {
    return [...this.capturedTraces];
  }

  /**
   * Get traces for specific file and line
   */
  async getTracesForLine(filePath: string, lineNumber: number): Promise<TraceData[]> {
    const allTraces = await this.getTraces();
    return allTraces.filter(trace =>
      trace.sourceLocation?.file === filePath && trace.sourceLocation?.line === lineNumber
    );
  }

  /**
   * Clear all captured traces
   */
  async clearTraces(): Promise<void> {
    this.capturedTraces = [];
    
    // Also clear traces in desktop app if connected
    if (this.desktopAppClient.isConnected) {
      try {
        // Desktop app should have a clear traces endpoint
        await this.desktopAppClient.request('/api/traces', 'DELETE');
      } catch (error) {
        console.warn('Failed to clear traces in desktop app:', error);
      }
    }
  }

  /**
   * Export traces to file
   */
  async exportTraces(filePath: string, format: string): Promise<void> {
    const traces = await this.getTraces();
    
    let content: string;
    
    switch (format.toLowerCase()) {
      case 'json':
        content = JSON.stringify(traces, null, 2);
        break;
      case 'csv':
        content = this.tracesToCsv(traces);
        break;
      case 'otlp':
        content = this.tracesToOtlp(traces);
        break;
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }

    await fs.promises.writeFile(filePath, content, 'utf8');
  }

  /**
   * Register callback for trace captured events
   */
  onTraceCaptured(callback: (traces: TraceData[]) => void): void {
    this.traceCapturedCallback = callback;
  }

  /**
   * Register callback for tracing status changes
   */
  onTracingStatusChanged(callback: (isActive: boolean) => void): void {
    this.tracingStatusCallback = callback;
  }

  /**
   * Refresh configuration from VS Code settings
   */
  refreshConfiguration(): void {
    // Reload configuration
    const config = vscode.workspace.getConfiguration('flowscope');
    
    // Update environment variables
    this.setupEnvironmentVariables();
  }

  /**
   * Set up environment variables for SDK integration
   */
  private setupEnvironmentVariables(workspacePath?: string): void {
    // Core FlowScope environment variables
    process.env.FLOWSCOPE_ENABLED = 'true';
    process.env.FLOWSCOPE_MODE = 'vscode';
    process.env.FLOWSCOPE_API_ENDPOINT = 'http://localhost:31847';
    
    if (workspacePath) {
      process.env.FLOWSCOPE_WORKSPACE = workspacePath;
    }

    // Load additional settings from VS Code configuration
    const config = vscode.workspace.getConfiguration('flowscope');
    
    if (config.get('traces.captureStdout')) {
      process.env.FLOWSCOPE_CAPTURE_STDOUT = 'true';
    }
    
    // Add more environment variables as needed
  }

  /**
   * Start watching for trace files in the workspace
   */
  private startFileWatching(workspacePath: string): void {
    // Watch for various trace file patterns
    const patterns = [
      '**/*.flowscope.json',
      '**/.flowscope/traces/*.json',
      '**/.traces/*.json'
    ];

    this.fileWatcher = vscode.workspace.createFileSystemWatcher(
      new vscode.RelativePattern(workspacePath, `{${patterns.join(',')}}`)
    );

    this.disposables.push(
      this.fileWatcher.onDidCreate(uri => this.handleTraceFile(uri)),
      this.fileWatcher.onDidChange(uri => this.handleTraceFile(uri))
    );
  }

  /**
   * Stop file watching
   */
  private stopFileWatching(): void {
    if (this.fileWatcher) {
      this.fileWatcher.dispose();
      this.fileWatcher = null;
    }
  }

  /**
   * Start HTTP endpoint for receiving traces
   */
  private async startHttpEndpoint(): Promise<void> {
    try {
      const http = require('http');

      this.httpEndpoint = http.createServer((req: any, res: any) => {
        if (req.method === 'POST' && req.url === '/traces') {
          let body = '';
          req.on('data', (chunk: any) => {
            body += chunk.toString();
          });
          req.on('end', () => {
            try {
              const trace = JSON.parse(body);
              this.handleTraceData(trace);
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: true }));
            } catch (error) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Invalid JSON' }));
            }
          });
        } else {
          res.writeHead(404);
          res.end();
        }
      });

      this.httpEndpoint.listen(31848, 'localhost'); // Use different port than desktop app
      console.log('HTTP endpoint started on port 31848');

    } catch (error) {
      console.error('Failed to start HTTP endpoint:', error);
    }
  }

  /**
   * Stop HTTP endpoint
   */
  private stopHttpEndpoint(): void {
    if (this.httpEndpoint) {
      this.httpEndpoint.close();
      this.httpEndpoint = null;
    }
  }

  /**
   * Handle trace files found in the workspace
   */
  private async handleTraceFile(uri: vscode.Uri): Promise<void> {
    try {
      const content = await fs.promises.readFile(uri.fsPath, 'utf8');
      const traces = JSON.parse(content);

      if (Array.isArray(traces)) {
        traces.forEach(trace => this.handleTraceData(trace));
      } else {
        this.handleTraceData(traces);
      }
    } catch (error) {
      console.error('Failed to process trace file:', uri.fsPath, error);
    }
  }

  /**
   * Process incoming trace data
   */
  private handleTraceData(trace: any): void {
    // Convert to our TraceData format
    const traceData: TraceData = {
      id: trace.id || this.generateTraceId(),
      sessionId: trace.sessionId,
      parentId: trace.parentId,
      operation: trace.operation || 'Unknown Operation',
      language: trace.language || 'unknown',
      framework: trace.framework || 'unknown',
      startTime: trace.startTime || Date.now(),
      endTime: trace.endTime,
      duration: trace.duration,
      data: trace.data || {},
      metadata: trace.metadata || {},
      status: trace.status || 'success',
      error: trace.error,
      workspacePath: trace.workspacePath,
      sourceLocation: trace.sourceLocation
    };

    this.capturedTraces.push(traceData);

    // Limit memory usage by keeping only recent traces
    if (this.capturedTraces.length > 1000) {
      this.capturedTraces = this.capturedTraces.slice(-500);
    }

    // Notify callbacks
    if (this.traceCapturedCallback) {
      this.traceCapturedCallback([traceData]);
    }
  }

  /**
   * Generate a unique trace ID
   */
  private generateTraceId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  /**
   * Convert traces to CSV format
   */
  private tracesToCsv(traces: TraceData[]): string {
    const headers = [
      'ID', 'Operation', 'Duration', 'Timestamp', 'Status', 'File', 'Line', 'Error'
    ];
    
    const rows = traces.map(trace => [
      trace.id,
      trace.operation || '',
      trace.duration?.toString() || '',
      trace.startTime ? new Date(trace.startTime).toISOString() : '',
      trace.status || '',
      trace.sourceLocation?.file || '',
      trace.sourceLocation?.line?.toString() || '',
      trace.error || '',
    ]);

    return [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
  }

  /**
   * Convert traces to OTLP format
   */
  private tracesToOtlp(traces: TraceData[]): string {
    const otlpData = {
      resourceSpans: [{
        resource: {
          attributes: [
            { key: 'service.name', value: { stringValue: 'flowscope-vscode' } }
          ]
        },
        instrumentationLibrarySpans: [{
          instrumentationLibrary: {
            name: 'flowscope',
            version: '1.0.0'
          },
          spans: traces.map(trace => ({
            traceId: this.stringToBytes(trace.id),
            spanId: this.stringToBytes(trace.id.substring(0, 16)),
            name: trace.operation || 'LLM Operation',
            kind: 'SPAN_KIND_INTERNAL',
            startTimeUnixNano: String((trace.startTime || 0) * 1000000),
            endTimeUnixNano: String(((trace.startTime || 0) + (trace.duration || 0)) * 1000000),
            attributes: Object.entries(trace.metadata || {}).map(([key, value]) => ({
              key,
              value: { stringValue: String(value) }
            })),
            status: {
              code: trace.error ? 'STATUS_CODE_ERROR' : 'STATUS_CODE_OK',
              message: trace.error || ''
            }
          }))
        }]
      }]
    };

    return JSON.stringify(otlpData, null, 2);
  }

  /**
   * Convert string to bytes for OTLP format
   */
  private stringToBytes(str: string): string {
    return Buffer.from(str).toString('base64');
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    this.stopCapture();
    this.disposables.forEach(d => d.dispose());
  }
}
