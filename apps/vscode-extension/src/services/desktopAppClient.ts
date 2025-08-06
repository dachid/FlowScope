import * as vscode from 'vscode';
import axios, { AxiosInstance } from 'axios';
import * as WebSocket from 'ws';
import { TraceData, HealthResponse, FlowScopeApiClient } from '../types';

export class DesktopAppClient implements FlowScopeApiClient {
  private baseUrl: string;
  private httpClient: AxiosInstance;
  private websocket: WebSocket.WebSocket | null = null;
  private _isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 2000;
  private tracesUpdateCallbacks: ((traces: TraceData[]) => void)[] = [];
  private connectionChangedCallback?: (isConnected: boolean) => void;

  constructor(baseUrl?: string) {
    const config = vscode.workspace.getConfiguration('flowscope');
    this.baseUrl = baseUrl || config.get<string>('serverUrl') || 'http://localhost:31847';
    
    this.httpClient = axios.create({
      baseURL: this.baseUrl,
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Check if desktop app is available
   */
  async health(): Promise<HealthResponse> {
    try {
      const response = await this.httpClient.get('/health');
      this._isConnected = true;
      return response.data;
    } catch (error) {
      this._isConnected = false;
      throw new Error(`Desktop app not available: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Connect to desktop app
   */
  async connect(): Promise<boolean> {
    try {
      await this.health();
      this.connectWebSocket();
      this._isConnected = true;
      this.connectionChangedCallback?.(true);
      return true;
    } catch (error) {
      this._isConnected = false;
      this.connectionChangedCallback?.(false);
      return false;
    }
  }

  /**
   * Disconnect from desktop app
   */
  async disconnect(): Promise<void> {
    this._isConnected = false;
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
    this.connectionChangedCallback?.(false);
  }

  /**
   * Check if connected
   */
  get isConnected(): boolean {
    return this._isConnected;
  }

  /**
   * Register callback for connection changes
   */
  onConnectionChanged(callback: (isConnected: boolean) => void): void {
    this.connectionChangedCallback = callback;
  }

  /**
   * Open traces view in desktop app
   */
  async openTracesView(): Promise<void> {
    try {
      await this.httpClient.post('/api/ui/open', { view: 'traces' });
    } catch (error) {
      console.warn('Failed to open traces view:', error);
    }
  }

  /**
   * Show trace details in desktop app
   */
  async showTraceDetails(traceId: string): Promise<void> {
    try {
      await this.httpClient.post('/api/ui/open', { view: 'trace', traceId });
    } catch (error) {
      console.warn('Failed to show trace details:', error);
    }
  }

  /**
   * Show line traces in desktop app
   */
  async showLineTraces(filePath: string, lineNumber: number, traces: any[]): Promise<void> {
    try {
      await this.httpClient.post('/api/ui/open', { 
        view: 'lineTraces', 
        filePath, 
        lineNumber, 
        traces 
      });
    } catch (error) {
      console.warn('Failed to show line traces:', error);
    }
  }

  /**
   * Set workspace in desktop app
   */
  async setWorkspace(workspacePath: string): Promise<void> {
    try {
      await this.httpClient.post('/api/workspace', { path: workspacePath });
    } catch (error) {
      console.warn('Failed to set workspace:', error);
    }
  }

  /**
   * Get recent traces from desktop app
   */
  async getRecentTraces(): Promise<TraceData[]> {
    try {
      const response = await this.httpClient.get('/api/traces?limit=50');
      return response.data.traces || [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Get metrics from desktop app
   */
  async getMetrics(): Promise<any> {
    try {
      const response = await this.httpClient.get('/api/metrics');
      return response.data;
    } catch (error) {
      return null;
    }
  }

  /**
   * Make a generic request to desktop app
   */
  async request(path: string, method: string = 'GET', data?: any): Promise<any> {
    try {
      const response = await this.httpClient.request({
        url: path,
        method: method as any,
        data
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Send trace to desktop app
   */
  async addTrace(trace: TraceData): Promise<void> {
    try {
      await this.httpClient.post('/api/traces', trace);
    } catch (error) {
      console.error('Failed to send trace to desktop app:', error);
      throw error;
    }
  }

  /**
   * Update trace in desktop app
   */
  async updateTrace(traceId: string, updates: Partial<TraceData>): Promise<void> {
    try {
      await this.httpClient.put(`/api/traces/${traceId}`, updates);
    } catch (error) {
      console.error('Failed to update trace in desktop app:', error);
      throw error;
    }
  }

  /**
   * Request desktop app to focus on specific trace
   */
  async focusTrace(traceId: string): Promise<void> {
    try {
      await this.httpClient.post(`/api/focus/${traceId}`);
    } catch (error) {
      console.error('Failed to focus trace in desktop app:', error);
      // Don't throw - this is not critical
    }
  }

  /**
   * Get traces from desktop app
   */
  async getTraces(sessionId?: string, limit = 100, offset = 0): Promise<TraceData[]> {
    try {
      const url = sessionId 
        ? `/api/sessions/${sessionId}/traces?limit=${limit}&offset=${offset}`
        : `/api/traces?limit=${limit}&offset=${offset}`;
      
      const response = await this.httpClient.get(url);
      return response.data.data || [];
    } catch (error) {
      console.error('Failed to get traces from desktop app:', error);
      return [];
    }
  }

  /**
   * Get single trace from desktop app
   */
  async getTrace(traceId: string): Promise<TraceData | null> {
    try {
      const response = await this.httpClient.get(`/api/traces/${traceId}`);
      return response.data.data || response.data;
    } catch (error) {
      console.error('Failed to get trace from desktop app:', error);
      return null;
    }
  }

  /**
   * Create a new session in desktop app
   */
  async createSession(name: string, workspacePath?: string): Promise<string> {
    try {
      const sessionData = {
        name,
        workspace_path: workspacePath,
        start_time: Date.now(),
        status: 'active'
      };

      const response = await this.httpClient.post('/api/sessions', sessionData);
      return response.data.data.id;
    } catch (error) {
      console.error('Failed to create session in desktop app:', error);
      throw error;
    }
  }

  /**
   * Check if desktop app is connected
   */
  isDesktopAppConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Open desktop app (attempt to launch)
   */
  async openDesktopApp(): Promise<void> {
    try {
      // Try to bring desktop app to foreground via API
      await this.httpClient.post('/api/focus');
    } catch (error) {
      // If API call fails, try to launch desktop app
      console.log('Desktop app not running, attempting to launch...');
      
      // Show message to user about installing/launching desktop app
      const action = await vscode.window.showWarningMessage(
        'FlowScope Desktop App is not running. Please launch the desktop app for full visualization features.',
        'Install Desktop App',
        'Try Again'
      );

      if (action === 'Install Desktop App') {
        await this.promptDesktopAppInstall();
      } else if (action === 'Try Again') {
        // Retry connection
        await this.health();
      }
    }
  }

  /**
   * Prompt user to install desktop app
   */
  async promptDesktopAppInstall(): Promise<void> {
    const action = await vscode.window.showInformationMessage(
      'FlowScope Desktop App provides rich visualization and advanced debugging features. Would you like to download it?',
      'Download Now',
      'Learn More',
      'Not Now'
    );

    if (action === 'Download Now') {
      vscode.env.openExternal(vscode.Uri.parse('https://github.com/dachid/FlowScope/releases'));
    } else if (action === 'Learn More') {
      vscode.env.openExternal(vscode.Uri.parse('https://github.com/dachid/FlowScope'));
    }
  }

  /**
   * WebSocket connection for real-time communication
   */
  private connectWebSocket(): void {
    try {
      const wsUrl = this.baseUrl.replace('http', 'ws') + '/ws';
      this.websocket = new WebSocket.WebSocket(wsUrl);

      if (this.websocket) {
        this.websocket.on('open', () => {
          console.log('WebSocket connected to desktop app');
          this.reconnectAttempts = 0;
        });

        this.websocket.on('message', (data: WebSocket.RawData) => {
          try {
            const message = JSON.parse(data.toString());
            this.handleDesktopAppMessage(message);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        });

        this.websocket.on('close', () => {
          console.log('WebSocket disconnected from desktop app');
          this.websocket = null;
          this.scheduleReconnect();
        });

        this.websocket.on('error', (error: Error) => {
          console.log('WebSocket connection failed:', error.message);
          this.websocket = null;
        });
      }

    } catch (error) {
      console.log('WebSocket setup failed, using HTTP only');
    }
  }

  /**
   * Subscribe to trace updates
   */
  onTracesUpdated(callback: (traces: TraceData[]) => void): void {
    this.tracesUpdateCallbacks.push(callback);
  }

  /**
   * Notify all subscribers about trace updates
   */
  private notifyTracesUpdated(traces: TraceData[]): void {
    this.tracesUpdateCallbacks.forEach(callback => {
      try {
        callback(traces);
      } catch (error) {
        console.error('Error in traces update callback:', error);
      }
    });
  }

  /**
   * Handle messages from desktop app
   */
  private handleDesktopAppMessage(message: any): void {
    switch (message.type) {
      case 'jump_to_code':
        this.jumpToCode(message.data.file, message.data.line);
        break;
      case 'highlight_code':
        this.highlightCode(message.data.file, message.data.range);
        break;
      case 'trace:new':
        // Refresh trace views
        vscode.commands.executeCommand('flowscope.refreshTraces');
        // Notify subscribers about trace updates
        this.getTraces().then(traces => {
          this.notifyTracesUpdated(traces);
        });
        break;
      default:
        console.log('Unknown message type from desktop app:', message.type);
    }
  }

  /**
   * Jump to specific code location
   */
  private async jumpToCode(file: string, line: number): Promise<void> {
    try {
      const uri = vscode.Uri.file(file);
      const document = await vscode.workspace.openTextDocument(uri);
      const editor = await vscode.window.showTextDocument(document);
      
      const position = new vscode.Position(line - 1, 0);
      editor.selection = new vscode.Selection(position, position);
      editor.revealRange(new vscode.Range(position, position));
    } catch (error) {
      console.error('Failed to jump to code:', error);
    }
  }

  /**
   * Highlight code range
   */
  private async highlightCode(file: string, range: { start: number; end: number }): Promise<void> {
    try {
      const uri = vscode.Uri.file(file);
      const document = await vscode.workspace.openTextDocument(uri);
      const editor = await vscode.window.showTextDocument(document);
      
      const startPos = new vscode.Position(range.start - 1, 0);
      const endPos = new vscode.Position(range.end - 1, 0);
      editor.selection = new vscode.Selection(startPos, endPos);
      editor.revealRange(new vscode.Range(startPos, endPos));
    } catch (error) {
      console.error('Failed to highlight code:', error);
    }
  }

  /**
   * Schedule WebSocket reconnection
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        console.log(`Attempting to reconnect WebSocket (attempt ${this.reconnectAttempts})`);
        this.connectWebSocket();
      }, this.reconnectDelay * this.reconnectAttempts);
    }
  }

  /**
   * Get bookmarks from desktop app
   */
  async getBookmarks(): Promise<any[]> {
    try {
      const response = await this.httpClient.get('/api/bookmarks');
      return response.data.data || response.data || [];
    } catch (error) {
      console.error('Failed to get bookmarks from desktop app:', error);
      return [];
    }
  }

  /**
   * Get prompt versions from desktop app
   */
  async getPromptVersions(): Promise<any[]> {
    try {
      const response = await this.httpClient.get('/api/prompts/versions');
      return response.data.data || response.data || [];
    } catch (error) {
      console.error('Failed to get prompt versions from desktop app:', error);
      return [];
    }
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
  }
}
