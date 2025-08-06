import * as vscode from 'vscode';
import { FlowScopeApiClient } from '../types';

export class DecorationProvider {
    private decorationType: vscode.TextEditorDecorationType;
    private currentDecorations: vscode.DecorationOptions[] = [];

    constructor(private apiClient: FlowScopeApiClient) {
        // Create decoration type for highlighting traced code
        this.decorationType = vscode.window.createTextEditorDecorationType({
            backgroundColor: 'rgba(0, 255, 0, 0.1)',
            border: '1px solid rgba(0, 255, 0, 0.3)',
            borderRadius: '3px',
            isWholeLine: false,
            overviewRulerColor: 'rgba(0, 255, 0, 0.5)',
            overviewRulerLane: vscode.OverviewRulerLane.Right
        });
    }

    public updateDecorations(traceId: string): void {
        const activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor) {
            return;
        }

        // Clear existing decorations
        this.clearDecorations();

        // Get trace data and create decorations
        this.apiClient.getTrace(traceId).then(trace => {
            if (trace && trace.sourceLocation?.line !== undefined) {
                const line = activeEditor.document.lineAt(trace.sourceLocation.line - 1); // Convert to 0-based
                const decoration: vscode.DecorationOptions = {
                    range: line.range,
                    hoverMessage: `FlowScope Trace: ${trace.operation}\nTimestamp: ${new Date(trace.startTime).toLocaleString()}\nStatus: ${trace.status}\nData: ${JSON.stringify(trace.data, null, 2)}`
                };

                this.currentDecorations = [decoration];
                activeEditor.setDecorations(this.decorationType, this.currentDecorations);
            }
        }).catch(error => {
            console.error('Failed to get trace for decoration:', error);
        });
    }

    public updateForEditor(editor: vscode.TextEditor): void {
        // Update decorations when switching editors
        // This could show persistent highlights for previously traced code
        
        // For now, just clear decorations when switching editors
        this.clearDecorations();
    }

    public clearDecorations(): void {
        const activeEditor = vscode.window.activeTextEditor;
        if (activeEditor) {
            activeEditor.setDecorations(this.decorationType, []);
        }
        this.currentDecorations = [];
    }

    public dispose(): void {
        this.decorationType.dispose();
    }
}
