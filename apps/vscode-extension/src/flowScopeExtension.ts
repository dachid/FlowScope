import * as vscode from 'vscode';
import { FlowScopeApiClient } from './services/apiClient';
import { TraceData } from '@flowscope/shared';

export class FlowScopeExtension {
    private apiClient: FlowScopeApiClient;
    private isTracing: boolean = false;
    private currentTraceId: string | null = null;
    private outputChannel: vscode.OutputChannel;

    constructor(private context: vscode.ExtensionContext) {
        this.apiClient = new FlowScopeApiClient();
        this.outputChannel = vscode.window.createOutputChannel('FlowScope');
        
        // Initialize connection to FlowScope backend
        this.initializeConnection();
    }

    private async initializeConnection() {
        try {
            const config = vscode.workspace.getConfiguration('flowscope');
            const serverUrl = config.get<string>('serverUrl') || 'http://localhost:3001';
            
            await this.apiClient.connect(serverUrl);
            this.outputChannel.appendLine(`Connected to FlowScope server at ${serverUrl}`);
            
            vscode.window.showInformationMessage('FlowScope: Connected to backend server');
        } catch (error) {
            this.outputChannel.appendLine(`Failed to connect to FlowScope server: ${error}`);
            vscode.window.showWarningMessage(
                'FlowScope: Could not connect to backend server. Please ensure the FlowScope backend is running.'
            );
        }
    }

    async openDebugger() {
        // Create and show the main debugger webview panel
        const panel = vscode.window.createWebviewPanel(
            'flowscopeDebugger',
            'FlowScope Debugger',
            vscode.ViewColumn.Beside,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [this.context.extensionUri]
            }
        );

        // Set the webview content
        panel.webview.html = this.getDebuggerWebviewContent(panel.webview);

        // Handle messages from the webview
        panel.webview.onDidReceiveMessage(
            async (message) => {
                switch (message.command) {
                    case 'selectTrace':
                        await this.selectTrace(message.traceId);
                        break;
                    case 'exportTrace':
                        await this.exportTrace(message.trace);
                        break;
                    case 'startTracing':
                        await this.startTracing();
                        break;
                    case 'stopTracing':
                        await this.stopTracing();
                        break;
                }
            },
            undefined,
            this.context.subscriptions
        );

        // Update webview when traces change
        this.apiClient.onTracesUpdated((traces) => {
            panel.webview.postMessage({
                command: 'updateTraces',
                traces: traces
            });
        });
    }

    async startTracing(): Promise<void> {
        if (this.isTracing) {
            return;
        }

        try {
            // Get the active workspace folder
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (!workspaceFolder) {
                vscode.window.showErrorMessage('No workspace folder found. Please open a project folder.');
                return;
            }

            // Start a new tracing session
            const sessionId = await this.apiClient.startTracingSession({
                workspacePath: workspaceFolder.uri.fsPath,
                timestamp: Date.now()
            });

            this.isTracing = true;
            this.currentTraceId = sessionId;

            this.outputChannel.appendLine(`Started tracing session: ${sessionId}`);
            vscode.window.showInformationMessage('FlowScope: Tracing started');

            // Update status bar
            this.updateStatusBar();

        } catch (error) {
            this.outputChannel.appendLine(`Failed to start tracing: ${error}`);
            vscode.window.showErrorMessage('Failed to start FlowScope tracing');
        }
    }

    async stopTracing(): Promise<void> {
        if (!this.isTracing || !this.currentTraceId) {
            return;
        }

        try {
            await this.apiClient.stopTracingSession(this.currentTraceId);
            
            this.isTracing = false;
            this.outputChannel.appendLine(`Stopped tracing session: ${this.currentTraceId}`);
            this.currentTraceId = null;

            vscode.window.showInformationMessage('FlowScope: Tracing stopped');
            
            // Update status bar
            this.updateStatusBar();

        } catch (error) {
            this.outputChannel.appendLine(`Failed to stop tracing: ${error}`);
            vscode.window.showErrorMessage('Failed to stop FlowScope tracing');
        }
    }

    async selectTrace(traceId: string): Promise<void> {
        try {
            const trace = await this.apiClient.getTrace(traceId);
            if (trace) {
                // Show trace details in the output channel
                this.outputChannel.appendLine(`Selected trace: ${traceId}`);
                this.outputChannel.appendLine(JSON.stringify(trace, null, 2));
                
                // Update decorations in the editor
                this.highlightTraceInEditor(trace);
            }
        } catch (error) {
            this.outputChannel.appendLine(`Failed to select trace: ${error}`);
        }
    }

    async exportTrace(trace: TraceData): Promise<void> {
        try {
            const uri = await vscode.window.showSaveDialog({
                defaultUri: vscode.Uri.file(`trace-${trace.id}.json`),
                filters: {
                    'JSON Files': ['json'],
                    'All Files': ['*']
                }
            });

            if (uri) {
                const content = JSON.stringify(trace, null, 2);
                await vscode.workspace.fs.writeFile(uri, Buffer.from(content, 'utf8'));
                
                vscode.window.showInformationMessage(`Trace exported to ${uri.fsPath}`);
                this.outputChannel.appendLine(`Exported trace to: ${uri.fsPath}`);
            }
        } catch (error) {
            this.outputChannel.appendLine(`Failed to export trace: ${error}`);
            vscode.window.showErrorMessage('Failed to export trace');
        }
    }

    async createPromptVersion(): Promise<void> {
        const activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor) {
            vscode.window.showErrorMessage('No active editor found');
            return;
        }

        const selectedText = activeEditor.document.getText(activeEditor.selection);
        if (!selectedText) {
            vscode.window.showErrorMessage('Please select text to create a prompt version');
            return;
        }

        try {
            const promptName = await vscode.window.showInputBox({
                prompt: 'Enter prompt name',
                placeHolder: 'e.g., summarization-prompt'
            });

            if (promptName) {
                await this.apiClient.createPromptVersion({
                    name: promptName,
                    content: selectedText,
                    filePath: activeEditor.document.uri.fsPath,
                    lineNumber: activeEditor.selection.start.line
                });

                vscode.window.showInformationMessage(`Prompt version created: ${promptName}`);
                this.outputChannel.appendLine(`Created prompt version: ${promptName}`);
            }
        } catch (error) {
            this.outputChannel.appendLine(`Failed to create prompt version: ${error}`);
            vscode.window.showErrorMessage('Failed to create prompt version');
        }
    }

    async addBookmark(traceId: string): Promise<void> {
        try {
            const description = await vscode.window.showInputBox({
                prompt: 'Enter bookmark description (optional)',
                placeHolder: 'Important trace for debugging...'
            });

            await this.apiClient.addBookmark({
                traceId,
                description: description || '',
                timestamp: Date.now()
            });

            vscode.window.showInformationMessage('Bookmark added');
            this.outputChannel.appendLine(`Added bookmark for trace: ${traceId}`);
        } catch (error) {
            this.outputChannel.appendLine(`Failed to add bookmark: ${error}`);
            vscode.window.showErrorMessage('Failed to add bookmark');
        }
    }

    async removeBookmark(bookmarkId: string): Promise<void> {
        try {
            await this.apiClient.removeBookmark(bookmarkId);
            vscode.window.showInformationMessage('Bookmark removed');
            this.outputChannel.appendLine(`Removed bookmark: ${bookmarkId}`);
        } catch (error) {
            this.outputChannel.appendLine(`Failed to remove bookmark: ${error}`);
            vscode.window.showErrorMessage('Failed to remove bookmark');
        }
    }

    private highlightTraceInEditor(trace: TraceData): void {
        const activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor) {
            return;
        }

        // Create decoration type for highlighting
        const decorationType = vscode.window.createTextEditorDecorationType({
            backgroundColor: 'rgba(255, 255, 0, 0.2)',
            border: '1px solid yellow',
            borderRadius: '3px'
        });

        // Find the relevant lines in the editor (simplified logic)
        const decorations: vscode.DecorationOptions[] = [];
        
        // This is a simplified example - in practice, you'd need more sophisticated
        // logic to map trace data to editor positions
        if (trace.metadata?.lineNumber !== undefined && typeof trace.metadata.lineNumber === 'number') {
            const line = activeEditor.document.lineAt(trace.metadata.lineNumber);
            decorations.push({
                range: line.range,
                hoverMessage: `FlowScope Trace: ${trace.type}\nTimestamp: ${new Date(trace.timestamp).toLocaleString()}`
            });
        }

        activeEditor.setDecorations(decorationType, decorations);

        // Clear decorations after 5 seconds
        setTimeout(() => {
            decorationType.dispose();
        }, 5000);
    }

    private updateStatusBar(): void {
        // Create or update status bar item
        const statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Left,
            100
        );

        if (this.isTracing) {
            statusBarItem.text = "$(debug-alt) FlowScope: Tracing";
            statusBarItem.color = '#00ff00';
            statusBarItem.command = 'flowscope.stopTracing';
            statusBarItem.tooltip = 'Click to stop tracing';
        } else {
            statusBarItem.text = "$(debug-alt) FlowScope: Ready";
            statusBarItem.color = undefined;
            statusBarItem.command = 'flowscope.startTracing';
            statusBarItem.tooltip = 'Click to start tracing';
        }

        statusBarItem.show();
        this.context.subscriptions.push(statusBarItem);
    }

    private getDebuggerWebviewContent(webview: vscode.Webview): string {
        // This would typically load the React app built for the web
        // For now, we'll provide a basic HTML interface
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>FlowScope Debugger</title>
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                        margin: 0;
                        padding: 20px;
                        background-color: var(--vscode-editor-background);
                        color: var(--vscode-editor-foreground);
                    }
                    .header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 20px;
                        padding-bottom: 10px;
                        border-bottom: 1px solid var(--vscode-panel-border);
                    }
                    .button {
                        background-color: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                        border: none;
                        padding: 8px 16px;
                        border-radius: 4px;
                        cursor: pointer;
                        margin-left: 8px;
                    }
                    .button:hover {
                        background-color: var(--vscode-button-hoverBackground);
                    }
                    .traces-container {
                        display: grid;
                        gap: 16px;
                    }
                    .trace-item {
                        padding: 16px;
                        border: 1px solid var(--vscode-panel-border);
                        border-radius: 8px;
                        background-color: var(--vscode-panel-background);
                    }
                    .trace-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 8px;
                    }
                    .trace-type {
                        font-weight: bold;
                        text-transform: capitalize;
                    }
                    .trace-timestamp {
                        color: var(--vscode-descriptionForeground);
                        font-size: 0.9em;
                    }
                    .trace-content {
                        background-color: var(--vscode-textCodeBlock-background);
                        padding: 12px;
                        border-radius: 4px;
                        font-family: 'Courier New', monospace;
                        font-size: 0.9em;
                        white-space: pre-wrap;
                        word-break: break-all;
                    }
                    .loading {
                        text-align: center;
                        color: var(--vscode-descriptionForeground);
                        font-style: italic;
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h2>FlowScope Debugger</h2>
                    <div>
                        <button class="button" onclick="startTracing()">Start Tracing</button>
                        <button class="button" onclick="stopTracing()">Stop Tracing</button>
                        <button class="button" onclick="refreshTraces()">Refresh</button>
                    </div>
                </div>
                
                <div id="traces-container" class="traces-container">
                    <div class="loading">Loading traces...</div>
                </div>

                <script>
                    const vscode = acquireVsCodeApi();
                    
                    function startTracing() {
                        vscode.postMessage({ command: 'startTracing' });
                    }
                    
                    function stopTracing() {
                        vscode.postMessage({ command: 'stopTracing' });
                    }
                    
                    function refreshTraces() {
                        // Request traces from extension
                        vscode.postMessage({ command: 'refreshTraces' });
                    }
                    
                    function selectTrace(traceId) {
                        vscode.postMessage({ command: 'selectTrace', traceId: traceId });
                    }
                    
                    function exportTrace(trace) {
                        vscode.postMessage({ command: 'exportTrace', trace: trace });
                    }
                    
                    // Listen for messages from the extension
                    window.addEventListener('message', event => {
                        const message = event.data;
                        
                        switch (message.command) {
                            case 'updateTraces':
                                updateTracesDisplay(message.traces);
                                break;
                        }
                    });
                    
                    function updateTracesDisplay(traces) {
                        const container = document.getElementById('traces-container');
                        
                        if (!traces || traces.length === 0) {
                            container.innerHTML = '<div class="loading">No traces available</div>';
                            return;
                        }
                        
                        container.innerHTML = traces.map(trace => \`
                            <div class="trace-item">
                                <div class="trace-header">
                                    <span class="trace-type">\${trace.type}</span>
                                    <span class="trace-timestamp">\${new Date(trace.timestamp).toLocaleString()}</span>
                                </div>
                                <div class="trace-content">\${JSON.stringify(trace.data, null, 2)}</div>
                                <div style="margin-top: 12px;">
                                    <button class="button" onclick="selectTrace('\${trace.id}')">Select</button>
                                    <button class="button" onclick="exportTrace(\${JSON.stringify(trace).replace(/"/g, '&quot;')})">Export</button>
                                </div>
                            </div>
                        \`).join('');
                    }
                    
                    // Initial load
                    refreshTraces();
                </script>
            </body>
            </html>
        `;
    }

    dispose(): void {
        this.outputChannel.dispose();
        this.apiClient.disconnect();
    }
}
