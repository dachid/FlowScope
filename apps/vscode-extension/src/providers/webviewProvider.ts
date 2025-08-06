import * as vscode from 'vscode';
import { FlowScopeApiClient } from '../types';

export class FlowScopeWebviewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'flowscope.debugger';

    private _view?: vscode.WebviewView;

    constructor(
        private readonly _extensionUri: vscode.Uri,
        private readonly apiClient: FlowScopeApiClient
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

        // Handle messages from webview
        webviewView.webview.onDidReceiveMessage(
            async (data) => {
                switch (data.type) {
                    case 'getTraces':
                        try {
                            const traces = await this.apiClient.getTraces();
                            webviewView.webview.postMessage({
                                type: 'traces',
                                traces: traces
                            });
                        } catch (error) {
                            console.error('Failed to get traces:', error);
                        }
                        break;
                }
            }
        );
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>FlowScope</title>
                <style>
                    body {
                        padding: 10px;
                        color: var(--vscode-foreground);
                        background-color: var(--vscode-editor-background);
                        font-family: var(--vscode-font-family);
                    }
                    .trace-item {
                        padding: 8px;
                        margin: 4px 0;
                        border: 1px solid var(--vscode-panel-border);
                        border-radius: 4px;
                        cursor: pointer;
                    }
                    .trace-item:hover {
                        background-color: var(--vscode-list-hoverBackground);
                    }
                </style>
            </head>
            <body>
                <h3>FlowScope Traces</h3>
                <div id="traces-container">
                    Loading traces...
                </div>

                <script>
                    const vscode = acquireVsCodeApi();
                    
                    // Request traces on load
                    vscode.postMessage({ type: 'getTraces' });
                    
                    // Listen for messages from extension
                    window.addEventListener('message', event => {
                        const message = event.data;
                        
                        if (message.type === 'traces') {
                            displayTraces(message.traces);
                        }
                    });
                    
                    function displayTraces(traces) {
                        const container = document.getElementById('traces-container');
                        
                        if (!traces || traces.length === 0) {
                            container.innerHTML = '<p>No traces available</p>';
                            return;
                        }
                        
                        container.innerHTML = traces.map(trace => 
                            \`<div class="trace-item" onclick="selectTrace('\${trace.id}')">
                                <strong>\${trace.type}</strong><br>
                                <small>\${new Date(trace.timestamp).toLocaleString()}</small>
                            </div>\`
                        ).join('');
                    }
                    
                    function selectTrace(traceId) {
                        vscode.postMessage({ type: 'selectTrace', traceId: traceId });
                    }
                </script>
            </body>
            </html>`;
    }
}
