import * as vscode from 'vscode';
import { FlowScopeApiClient, TraceData } from '../types';

export class FallbackUIProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'flowscopeFallback';
  private _view?: vscode.WebviewView;
  private traces: TraceData[] = [];

  constructor(
    private readonly _extensionUri: vscode.Uri,
    private apiClient: FlowScopeApiClient
  ) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri]
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    // Handle messages from the webview
    webviewView.webview.onDidReceiveMessage(async (data) => {
      switch (data.type) {
        case 'startTracing':
          await this.startTracing();
          break;
        case 'stopTracing':
          await this.stopTracing();
          break;
        case 'clearTraces':
          await this.clearTraces();
          break;
        case 'exportTraces':
          await this.exportTraces();
          break;
        case 'refreshTraces':
          await this.refreshTraces();
          break;
        case 'showTraceDetails':
          await this.showTraceDetails(data.traceId);
          break;
        case 'installDesktopApp':
          await this.installDesktopApp();
          break;
      }
    });

    // Initial load
    this.refreshTraces();

    // Auto-refresh every 5 seconds while tracing
    setInterval(() => {
      // Check if tracing is active via configuration or other means
      this.refreshTraces();
    }, 5000);
  }

  /**
   * Update the traces display
   */
  public updateTraces(traces: TraceData[]): void {
    this.traces = traces;
    if (this._view) {
      this._view.webview.postMessage({
        type: 'updateTraces',
        traces: this.formatTracesForDisplay(traces)
      });
    }
  }

  /**
   * Update tracing status
   */
  public updateTracingStatus(isActive: boolean): void {
    if (this._view) {
      this._view.webview.postMessage({
        type: 'updateStatus',
        isTracing: isActive
      });
    }
  }

  /**
   * Update desktop app connection status
   */
  public updateDesktopAppStatus(isConnected: boolean): void {
    if (this._view) {
      this._view.webview.postMessage({
        type: 'updateDesktopApp',
        isConnected
      });
    }
  }

  private async startTracing(): Promise<void> {
    try {
      await vscode.commands.executeCommand('flowscope.startTracing');
    } catch (error) {
      console.error('Failed to start tracing:', error);
    }
  }

  private async stopTracing(): Promise<void> {
    try {
      await vscode.commands.executeCommand('flowscope.stopTracing');
    } catch (error) {
      console.error('Failed to stop tracing:', error);
    }
  }

  private async clearTraces(): Promise<void> {
    try {
      await vscode.commands.executeCommand('flowscope.clearTraces');
      this.traces = [];
      this.updateTraces([]);
    } catch (error) {
      console.error('Failed to clear traces:', error);
    }
  }

  private async exportTraces(): Promise<void> {
    try {
      await vscode.commands.executeCommand('flowscope.exportTraces');
    } catch (error) {
      console.error('Failed to export traces:', error);
    }
  }

  private async refreshTraces(): Promise<void> {
    try {
      const traces = await this.apiClient.getTraces();
      this.updateTraces(traces);
    } catch (error) {
      console.error('Failed to refresh traces:', error);
    }
  }

  private async showTraceDetails(traceId: string): Promise<void> {
    try {
      await vscode.commands.executeCommand('flowscope.showTraceDetails', traceId);
    } catch (error) {
      console.error('Failed to show trace details:', error);
    }
  }

  private async installDesktopApp(): Promise<void> {
    try {
      await vscode.commands.executeCommand('flowscope.installDesktopApp');
    } catch (error) {
      console.error('Failed to show desktop app installation:', error);
    }
  }

  private formatTracesForDisplay(traces: TraceData[]): any[] {
    return traces.map(trace => ({
      id: trace.id,
      operation: trace.operation || 'Unknown Operation',
      duration: this.formatDuration(trace.duration),
      timestamp: new Date(trace.startTime || Date.now()).toLocaleTimeString(),
      status: trace.status || 'completed',
      fileName: this.extractFileName(trace.sourceLocation?.file),
      lineNumber: trace.sourceLocation?.line,
      error: trace.error,
      llmProvider: trace.metadata?.llm_provider,
      model: trace.metadata?.model,
      tokens: trace.metadata?.tokens,
      cost: trace.metadata?.cost
    }));
  }

  private formatDuration(duration: number | undefined): string {
    if (!duration) return 'N/A';
    
    if (duration < 1000) {
      return `${Math.round(duration)}ms`;
    } else if (duration < 60000) {
      return `${(duration / 1000).toFixed(1)}s`;
    } else {
      const minutes = Math.floor(duration / 60000);
      const seconds = Math.floor((duration % 60000) / 1000);
      return `${minutes}m ${seconds}s`;
    }
  }

  private extractFileName(filePath: string | undefined): string {
    if (!filePath) return 'Unknown';
    return filePath.split(/[/\\]/).pop() || 'Unknown';
  }

  private _getHtmlForWebview(webview: vscode.Webview): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FlowScope</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            margin: 0;
            padding: 16px;
        }

        .header {
            display: flex;
            align-items: center;
            margin-bottom: 16px;
            padding-bottom: 12px;
            border-bottom: 1px solid var(--vscode-panel-border);
        }

        .logo {
            font-size: 18px;
            font-weight: bold;
            margin-right: 8px;
        }

        .status {
            margin-left: auto;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
        }

        .status.tracing {
            background-color: var(--vscode-statusBarItem-warningBackground);
            color: var(--vscode-statusBarItem-warningForeground);
        }

        .status.stopped {
            background-color: var(--vscode-statusBarItem-errorBackground);
            color: var(--vscode-statusBarItem-errorForeground);
        }

        .controls {
            display: flex;
            gap: 8px;
            margin-bottom: 16px;
            flex-wrap: wrap;
        }

        .btn {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 6px 12px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            min-width: 60px;
        }

        .btn:hover {
            background-color: var(--vscode-button-hoverBackground);
        }

        .btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        .btn.secondary {
            background-color: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
        }

        .btn.secondary:hover {
            background-color: var(--vscode-button-secondaryHoverBackground);
        }

        .desktop-app-notice {
            background-color: var(--vscode-textCodeBlock-background);
            padding: 12px;
            border-radius: 4px;
            margin-bottom: 16px;
            border-left: 4px solid var(--vscode-textLink-foreground);
        }

        .desktop-app-notice h4 {
            margin: 0 0 8px 0;
            color: var(--vscode-textLink-foreground);
        }

        .desktop-app-notice p {
            margin: 0 0 8px 0;
            font-size: 12px;
            line-height: 1.4;
        }

        .traces-container {
            max-height: 400px;
            overflow-y: auto;
        }

        .trace-item {
            background-color: var(--vscode-list-hoverBackground);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
            padding: 12px;
            margin-bottom: 8px;
            cursor: pointer;
            transition: background-color 0.2s;
        }

        .trace-item:hover {
            background-color: var(--vscode-list-activeSelectionBackground);
        }

        .trace-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
        }

        .trace-operation {
            font-weight: bold;
            font-size: 14px;
        }

        .trace-duration {
            color: var(--vscode-descriptionForeground);
            font-size: 12px;
        }

        .trace-meta {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
            font-size: 11px;
            color: var(--vscode-descriptionForeground);
        }

        .trace-location {
            grid-column: 1 / -1;
            font-family: var(--vscode-editor-font-family);
            background-color: var(--vscode-textCodeBlock-background);
            padding: 4px 6px;
            border-radius: 2px;
        }

        .trace-error {
            grid-column: 1 / -1;
            color: var(--vscode-errorForeground);
            background-color: var(--vscode-inputValidation-errorBackground);
            padding: 4px 6px;
            border-radius: 2px;
        }

        .no-traces {
            text-align: center;
            color: var(--vscode-descriptionForeground);
            padding: 32px;
            font-style: italic;
        }

        .loading {
            text-align: center;
            color: var(--vscode-descriptionForeground);
            padding: 16px;
        }

        .stats {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 8px;
            margin-bottom: 16px;
            font-size: 12px;
        }

        .stat-item {
            text-align: center;
            padding: 8px;
            background-color: var(--vscode-badge-background);
            color: var(--vscode-badge-foreground);
            border-radius: 4px;
        }

        .stat-value {
            font-weight: bold;
            font-size: 16px;
            display: block;
        }

        .hidden {
            display: none;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">🔍 FlowScope</div>
        <div class="status stopped" id="status">Stopped</div>
    </div>

    <div class="desktop-app-notice" id="desktopAppNotice">
        <h4>📱 Enhanced Experience Available</h4>
        <p>Install the FlowScope Desktop App for rich visualizations, advanced analytics, and enhanced debugging features.</p>
        <button class="btn secondary" onclick="installDesktopApp()">Install Desktop App</button>
    </div>

    <div class="controls">
        <button class="btn" id="startStopBtn" onclick="toggleTracing()">Start Tracing</button>
        <button class="btn secondary" onclick="refreshTraces()">Refresh</button>
        <button class="btn secondary" onclick="clearTraces()">Clear</button>
        <button class="btn secondary" onclick="exportTraces()">Export</button>
    </div>

    <div class="stats hidden" id="stats">
        <div class="stat-item">
            <span class="stat-value" id="totalTraces">0</span>
            <span>Total Traces</span>
        </div>
        <div class="stat-item">
            <span class="stat-value" id="avgDuration">0ms</span>
            <span>Avg Duration</span>
        </div>
        <div class="stat-item">
            <span class="stat-value" id="errorCount">0</span>
            <span>Errors</span>
        </div>
    </div>

    <div class="traces-container">
        <div class="loading" id="loading">Loading traces...</div>
        <div class="no-traces hidden" id="noTraces">
            No traces available.<br>
            <span style="font-size: 11px;">Start tracing and run your code to see traces appear here.</span>
        </div>
        <div id="tracesList"></div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        let isTracing = false;
        let isDesktopAppConnected = false;
        let traces = [];

        // Message handler
        window.addEventListener('message', event => {
            const message = event.data;
            
            switch (message.type) {
                case 'updateTraces':
                    updateTracesDisplay(message.traces);
                    break;
                case 'updateStatus':
                    updateTracingStatus(message.isTracing);
                    break;
                case 'updateDesktopApp':
                    updateDesktopAppStatus(message.isConnected);
                    break;
            }
        });

        function updateTracesDisplay(newTraces) {
            traces = newTraces;
            const tracesList = document.getElementById('tracesList');
            const noTraces = document.getElementById('noTraces');
            const loading = document.getElementById('loading');
            const stats = document.getElementById('stats');

            loading.classList.add('hidden');

            if (traces.length === 0) {
                noTraces.classList.remove('hidden');
                tracesList.innerHTML = '';
                stats.classList.add('hidden');
                return;
            }

            noTraces.classList.add('hidden');
            stats.classList.remove('hidden');

            // Update statistics
            updateStatistics();

            // Render traces
            tracesList.innerHTML = traces.map(trace => 
                \`<div class="trace-item" onclick="showTraceDetails('\${trace.id}')">
                    <div class="trace-header">
                        <div class="trace-operation">\${trace.operation}</div>
                        <div class="trace-duration">\${trace.duration}</div>
                    </div>
                    <div class="trace-meta">
                        <div>📅 \${trace.timestamp}</div>
                        <div>📊 \${trace.status}</div>
                        \${trace.llmProvider ? \`<div>🤖 \${trace.llmProvider}</div>\` : ''}
                        \${trace.model ? \`<div>🧠 \${trace.model}</div>\` : ''}
                        \${trace.tokens ? \`<div>🎯 \${trace.tokens} tokens</div>\` : ''}
                        \${trace.cost ? \`<div>💰 $\${trace.cost}</div>\` : ''}
                        <div class="trace-location">📄 \${trace.fileName}:\${trace.lineNumber}</div>
                        \${trace.error ? \`<div class="trace-error">❌ \${trace.error}</div>\` : ''}
                    </div>
                </div>\`
            ).join('');
        }

        function updateStatistics() {
            const totalTraces = traces.length;
            const totalDuration = traces.reduce((sum, trace) => {
                const duration = parseFloat(trace.duration.replace(/[ms]/g, ''));
                return sum + (isNaN(duration) ? 0 : duration);
            }, 0);
            const avgDuration = totalTraces > 0 ? Math.round(totalDuration / totalTraces) : 0;
            const errorCount = traces.filter(trace => trace.error).length;

            document.getElementById('totalTraces').textContent = totalTraces;
            document.getElementById('avgDuration').textContent = avgDuration + 'ms';
            document.getElementById('errorCount').textContent = errorCount;
        }

        function updateTracingStatus(active) {
            isTracing = active;
            const status = document.getElementById('status');
            const startStopBtn = document.getElementById('startStopBtn');

            if (active) {
                status.textContent = 'Tracing Active';
                status.className = 'status tracing';
                startStopBtn.textContent = 'Stop Tracing';
            } else {
                status.textContent = 'Stopped';
                status.className = 'status stopped';
                startStopBtn.textContent = 'Start Tracing';
            }
        }

        function updateDesktopAppStatus(connected) {
            isDesktopAppConnected = connected;
            const notice = document.getElementById('desktopAppNotice');
            
            if (connected) {
                notice.classList.add('hidden');
            } else {
                notice.classList.remove('hidden');
            }
        }

        function toggleTracing() {
            if (isTracing) {
                vscode.postMessage({ type: 'stopTracing' });
            } else {
                vscode.postMessage({ type: 'startTracing' });
            }
        }

        function refreshTraces() {
            document.getElementById('loading').classList.remove('hidden');
            document.getElementById('noTraces').classList.add('hidden');
            vscode.postMessage({ type: 'refreshTraces' });
        }

        function clearTraces() {
            vscode.postMessage({ type: 'clearTraces' });
        }

        function exportTraces() {
            vscode.postMessage({ type: 'exportTraces' });
        }

        function showTraceDetails(traceId) {
            vscode.postMessage({ type: 'showTraceDetails', traceId });
        }

        function installDesktopApp() {
            vscode.postMessage({ type: 'installDesktopApp' });
        }

        // Initial load
        refreshTraces();
    </script>
</body>
</html>`;
  }
}

/**
 * Status Bar Provider for FlowScope
 */
export class StatusBarProvider {
  private statusBarItem: vscode.StatusBarItem;

  constructor() {
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      100
    );
    this.statusBarItem.command = 'flowscope.togglePanel';
    this.updateStatus('stopped', false);
    this.statusBarItem.show();
  }

  /**
   * Update status bar display
   */
  updateStatus(tracingStatus: 'tracing' | 'stopped', desktopAppConnected: boolean): void {
    const icon = tracingStatus === 'tracing' ? '$(record)' : '$(circle-outline)';
    const connectionIcon = desktopAppConnected ? '$(check)' : '$(x)';
    
    this.statusBarItem.text = `${icon} FlowScope ${connectionIcon}`;
    
    if (tracingStatus === 'tracing') {
      this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
      this.statusBarItem.tooltip = 'FlowScope is actively tracing. Click to view traces.';
    } else {
      this.statusBarItem.backgroundColor = undefined;
      this.statusBarItem.tooltip = 'FlowScope tracing stopped. Click to start tracing.';
    }
  }

  /**
   * Dispose status bar item
   */
  dispose(): void {
    this.statusBarItem.dispose();
  }
}

/**
 * Quick Pick Provider for FlowScope commands
 */
export class QuickPickProvider {
  static async showMainMenu(): Promise<void> {
    const options = [
      {
        label: '$(play) Start Tracing',
        description: 'Begin capturing LLM operation traces',
        command: 'flowscope.startTracing'
      },
      {
        label: '$(stop) Stop Tracing',
        description: 'Stop capturing traces',
        command: 'flowscope.stopTracing'
      },
      {
        label: '$(eye) View Traces',
        description: 'Open traces viewer',
        command: 'flowscope.viewTraces'
      },
      {
        label: '$(desktop-download) Install Desktop App',
        description: 'Get the full FlowScope experience',
        command: 'flowscope.installDesktopApp'
      },
      {
        label: '$(gear) Setup Workspace',
        description: 'Configure FlowScope for your project',
        command: 'flowscope.setupWorkspace'
      },
      {
        label: '$(package) Install SDK',
        description: 'Install FlowScope SDK for your framework',
        command: 'flowscope.installSDK'
      },
      {
        label: '$(graph) Analyze Performance',
        description: 'View performance analytics',
        command: 'flowscope.analyzePerformance'
      },
      {
        label: '$(export) Export Traces',
        description: 'Export traces to file',
        command: 'flowscope.exportTraces'
      },
      {
        label: '$(settings) Settings',
        description: 'Open FlowScope settings',
        command: 'flowscope.showSettings'
      }
    ];

    const selected = await vscode.window.showQuickPick(options, {
      placeHolder: 'Choose a FlowScope action'
    });

    if (selected) {
      vscode.commands.executeCommand(selected.command);
    }
  }
}

/**
 * Notification Manager for FlowScope
 */
export class NotificationManager {
  private static instance: NotificationManager;
  private notifications: Map<string, vscode.StatusBarItem> = new Map();

  static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }

  /**
   * Show trace captured notification
   */
  showTraceCaptured(traceCount: number): void {
    const message = `FlowScope captured ${traceCount} trace${traceCount !== 1 ? 's' : ''}`;
    
    vscode.window.showInformationMessage(
      message,
      'View Traces',
      'Continue Tracing'
    ).then(action => {
      if (action === 'View Traces') {
        vscode.commands.executeCommand('flowscope.viewTraces');
      }
    });
  }

  /**
   * Show error notification
   */
  showError(message: string, actions?: string[]): void {
    if (actions) {
      vscode.window.showErrorMessage(message, ...actions).then(action => {
        if (action === 'Install Desktop App') {
          vscode.commands.executeCommand('flowscope.installDesktopApp');
        } else if (action === 'View Setup Guide') {
          vscode.commands.executeCommand('flowscope.setupWorkspace');
        }
      });
    } else {
      vscode.window.showErrorMessage(message);
    }
  }

  /**
   * Show warning notification
   */
  showWarning(message: string, actions?: string[]): void {
    if (actions) {
      vscode.window.showWarningMessage(message, ...actions).then(action => {
        // Handle actions
      });
    } else {
      vscode.window.showWarningMessage(message);
    }
  }

  /**
   * Show success notification
   */
  showSuccess(message: string, actions?: string[]): void {
    if (actions) {
      vscode.window.showInformationMessage(message, ...actions).then(action => {
        // Handle actions
      });
    } else {
      vscode.window.showInformationMessage(message);
    }
  }

  /**
   * Show persistent notification in status bar
   */
  showPersistentNotification(id: string, message: string, priority: number = 0): void {
    let item = this.notifications.get(id);
    
    if (!item) {
      item = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Right,
        priority
      );
      this.notifications.set(id, item);
    }

    item.text = message;
    item.show();

    // Auto-hide after 10 seconds
    setTimeout(() => {
      this.hidePersistentNotification(id);
    }, 10000);
  }

  /**
   * Hide persistent notification
   */
  hidePersistentNotification(id: string): void {
    const item = this.notifications.get(id);
    if (item) {
      item.hide();
      item.dispose();
      this.notifications.delete(id);
    }
  }

  /**
   * Dispose all notifications
   */
  dispose(): void {
    this.notifications.forEach(item => {
      item.dispose();
    });
    this.notifications.clear();
  }
}
