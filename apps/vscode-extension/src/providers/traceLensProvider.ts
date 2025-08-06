import * as vscode from 'vscode';
import { FlowScopeApiClient, TraceData } from '../types';

export class TraceLensProvider implements vscode.CodeLensProvider {
  private _onDidChangeCodeLenses: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
  readonly onDidChangeCodeLenses: vscode.Event<void> = this._onDidChangeCodeLenses.event;

  private traces: Map<string, TraceData[]> = new Map();
  private isEnabled = true;

  constructor(private apiClient: FlowScopeApiClient) {
    // Listen for configuration changes
    vscode.workspace.onDidChangeConfiguration(e => {
      if (e.affectsConfiguration('flowscope.enableCodeLens')) {
        this.isEnabled = vscode.workspace.getConfiguration('flowscope').get('enableCodeLens', true);
        this._onDidChangeCodeLenses.fire();
      }
    });

    this.isEnabled = vscode.workspace.getConfiguration('flowscope').get('enableCodeLens', true);
  }

  /**
   * Provide CodeLens for performance metrics
   */
  provideCodeLenses(document: vscode.TextDocument, token: vscode.CancellationToken): vscode.CodeLens[] {
    if (!this.isEnabled) {
      return [];
    }

    const filePath = document.uri.fsPath;
    const fileTraces = this.traces.get(filePath) || [];
    
    if (fileTraces.length === 0) {
      return [];
    }

    const codeLenses: vscode.CodeLens[] = [];

    // Group traces by line number
    const tracesByLine = this.groupTracesByLine(fileTraces, document);

    for (const [lineNumber, traces] of tracesByLine) {
      if (lineNumber < 0 || lineNumber >= document.lineCount) {
        continue;
      }

      const range = new vscode.Range(lineNumber, 0, lineNumber, 0);
      
      // Calculate aggregate metrics
      const metrics = this.calculateMetrics(traces);
      
      // Create main metrics CodeLens
      const metricsLens = new vscode.CodeLens(range, {
        title: this.formatMetricsTitle(metrics),
        command: 'flowscope.showTraceDetails',
        arguments: [traces, document.uri, lineNumber]
      });

      codeLenses.push(metricsLens);

      // Add additional actions if there are multiple traces
      if (traces.length > 1) {
        const actionsRange = new vscode.Range(lineNumber, 0, lineNumber, 0);
        
        const actionsLens = new vscode.CodeLens(actionsRange, {
          title: '🔍 Analyze',
          command: 'flowscope.analyzeTraces',
          arguments: [traces]
        });

        codeLenses.push(actionsLens);
      }

      // Add error-specific lens if there are errors
      const errorTraces = traces.filter(t => t.status === 'error');
      if (errorTraces.length > 0) {
        const errorRange = new vscode.Range(lineNumber, 0, lineNumber, 0);
        
        const errorLens = new vscode.CodeLens(errorRange, {
          title: `❌ ${errorTraces.length} error${errorTraces.length > 1 ? 's' : ''}`,
          command: 'flowscope.showTraceErrors',
          arguments: [errorTraces]
        });

        codeLenses.push(errorLens);
      }
    }

    return codeLenses;
  }

  /**
   * Group traces by line number
   */
  private groupTracesByLine(traces: TraceData[], document: vscode.TextDocument): Map<number, TraceData[]> {
    const tracesByLine = new Map<number, TraceData[]>();

    for (const trace of traces) {
      let lineNumber = -1;

      // Try to get line number from trace source location
      if (trace.sourceLocation?.line !== undefined) {
        lineNumber = trace.sourceLocation.line - 1; // Convert to 0-based
      } else if (trace.metadata?.lineNumber !== undefined) {
        lineNumber = typeof trace.metadata.lineNumber === 'number' 
          ? trace.metadata.lineNumber 
          : parseInt(trace.metadata.lineNumber) - 1;
      } else {
        // Try to infer line number from operation name or data
        lineNumber = this.inferLineNumber(trace, document);
      }

      if (lineNumber >= 0 && lineNumber < document.lineCount) {
        if (!tracesByLine.has(lineNumber)) {
          tracesByLine.set(lineNumber, []);
        }
        tracesByLine.get(lineNumber)!.push(trace);
      }
    }

    return tracesByLine;
  }

  /**
   * Try to infer line number from trace content
   */
  private inferLineNumber(trace: TraceData, document: vscode.TextDocument): number {
    // Look for function names or patterns in the trace that match code
    const searchTerms = [
      trace.operation,
      trace.data?.function_name,
      trace.data?.method_name,
      trace.data?.class_name
    ].filter(Boolean);

    for (const term of searchTerms) {
      if (typeof term === 'string') {
        for (let i = 0; i < document.lineCount; i++) {
          const line = document.lineAt(i);
          if (line.text.includes(term)) {
            return i;
          }
        }
      }
    }

    return -1;
  }

  /**
   * Calculate performance metrics from traces
   */
  private calculateMetrics(traces: TraceData[]): {
    avgDuration: number;
    successRate: number;
    errorRate: number;
    totalTraces: number;
    minDuration: number;
    maxDuration: number;
  } {
    const durations = traces
      .filter(t => t.duration !== undefined)
      .map(t => t.duration!);

    const successTraces = traces.filter(t => t.status === 'success').length;
    const errorTraces = traces.filter(t => t.status === 'error').length;

    return {
      avgDuration: durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0,
      successRate: traces.length > 0 ? (successTraces / traces.length) * 100 : 0,
      errorRate: traces.length > 0 ? (errorTraces / traces.length) * 100 : 0,
      totalTraces: traces.length,
      minDuration: durations.length > 0 ? Math.min(...durations) : 0,
      maxDuration: durations.length > 0 ? Math.max(...durations) : 0
    };
  }

  /**
   * Format metrics title for CodeLens
   */
  private formatMetricsTitle(metrics: any): string {
    const parts = [];

    // Duration info
    if (metrics.avgDuration > 0) {
      const duration = this.formatDuration(metrics.avgDuration);
      parts.push(`⚡ ${duration} avg`);
    }

    // Success rate
    if (metrics.totalTraces > 0) {
      if (metrics.successRate === 100) {
        parts.push(`✅ ${metrics.successRate.toFixed(0)}%`);
      } else if (metrics.errorRate > 0) {
        parts.push(`❌ ${metrics.errorRate.toFixed(0)}% errors`);
      } else {
        parts.push(`🟡 ${metrics.successRate.toFixed(0)}% success`);
      }
    }

    // Trace count
    parts.push(`📊 ${metrics.totalTraces} trace${metrics.totalTraces > 1 ? 's' : ''}`);

    // Min/Max duration if there's variance
    if (metrics.minDuration !== metrics.maxDuration && metrics.totalTraces > 1) {
      const min = this.formatDuration(metrics.minDuration);
      const max = this.formatDuration(metrics.maxDuration);
      parts.push(`(${min}-${max})`);
    }

    return parts.join(' | ');
  }

  /**
   * Format duration in human readable format
   */
  private formatDuration(ms: number): string {
    if (ms < 1) {
      return `${(ms * 1000).toFixed(0)}μs`;
    } else if (ms < 1000) {
      return `${ms.toFixed(0)}ms`;
    } else if (ms < 60000) {
      return `${(ms / 1000).toFixed(1)}s`;
    } else {
      const minutes = Math.floor(ms / 60000);
      const seconds = ((ms % 60000) / 1000).toFixed(0);
      return `${minutes}m ${seconds}s`;
    }
  }

  /**
   * Update traces for a specific file
   */
  updateTraces(filePath: string, traces: TraceData[]): void {
    this.traces.set(filePath, traces);
    this._onDidChangeCodeLenses.fire();
  }

  /**
   * Add a single trace
   */
  addTrace(filePath: string, trace: TraceData): void {
    if (!this.traces.has(filePath)) {
      this.traces.set(filePath, []);
    }
    
    const fileTraces = this.traces.get(filePath)!;
    fileTraces.push(trace);
    
    // Keep only recent traces (last 100)
    if (fileTraces.length > 100) {
      fileTraces.splice(0, fileTraces.length - 100);
    }
    
    this._onDidChangeCodeLenses.fire();
  }

  /**
   * Clear traces for a file
   */
  clearTraces(filePath?: string): void {
    if (filePath) {
      this.traces.delete(filePath);
    } else {
      this.traces.clear();
    }
    this._onDidChangeCodeLenses.fire();
  }

  /**
   * Get traces for a file
   */
  getTraces(filePath: string): TraceData[] {
    return this.traces.get(filePath) || [];
  }

  /**
   * Refresh code lenses
   */
  refresh(): void {
    this._onDidChangeCodeLenses.fire();
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    this.traces.clear();
  }
}
