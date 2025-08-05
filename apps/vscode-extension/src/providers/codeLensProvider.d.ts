import * as vscode from 'vscode';
import { FlowScopeApiClient } from '../services/apiClient';
export declare class CodeLensProvider implements vscode.CodeLensProvider {
    private apiClient;
    private _onDidChangeCodeLenses;
    readonly onDidChangeCodeLenses: vscode.Event<void>;
    constructor(apiClient: FlowScopeApiClient);
    provideCodeLenses(document: vscode.TextDocument, token: vscode.CancellationToken): vscode.ProviderResult<vscode.CodeLens[]>;
    refresh(): void;
}
