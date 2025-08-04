import * as vscode from 'vscode';
import { FlowScopeApiClient } from '../services/apiClient';
export declare class DecorationProvider {
    private apiClient;
    private decorationType;
    private currentDecorations;
    constructor(apiClient: FlowScopeApiClient);
    updateDecorations(traceId: string): void;
    updateForEditor(editor: vscode.TextEditor): void;
    clearDecorations(): void;
    dispose(): void;
}
