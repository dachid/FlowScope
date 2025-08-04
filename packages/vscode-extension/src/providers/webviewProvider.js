"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FlowScopeWebviewProvider = void 0;
class FlowScopeWebviewProvider {
    constructor(_extensionUri, apiClient) {
        this._extensionUri = _extensionUri;
        this.apiClient = apiClient;
    }
    resolveWebviewView(webviewView, context, _token) {
        this._view = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };
        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
        // Handle messages from webview
        webviewView.webview.onDidReceiveMessage(async (data) => {
            switch (data.type) {
                case 'getTraces':
                    try {
                        const traces = await this.apiClient.getTraces();
                        webviewView.webview.postMessage({
                            type: 'traces',
                            traces: traces
                        });
                    }
                    catch (error) {
                        console.error('Failed to get traces:', error);
                    }
                    break;
            }
        });
    }
    _getHtmlForWebview(webview) {
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
exports.FlowScopeWebviewProvider = FlowScopeWebviewProvider;
FlowScopeWebviewProvider.viewType = 'flowscope.debugger';
