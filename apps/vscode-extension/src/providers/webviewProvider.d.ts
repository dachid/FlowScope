import * as vscode from 'vscode';
import { FlowScopeApiClient } from '../services/apiClient';
export declare class FlowScopeWebviewProvider implements vscode.WebviewViewProvider {
    private readonly _extensionUri;
    private readonly apiClient;
    static readonly viewType = "flowscope.debugger";
    private _view?;
    constructor(_extensionUri: vscode.Uri, apiClient: FlowScopeApiClient);
    resolveWebviewView(webviewView: vscode.WebviewView, context: vscode.WebviewViewResolveContext, _token: vscode.CancellationToken): void;
    private _getHtmlForWebview;
}
