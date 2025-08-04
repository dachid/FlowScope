import * as vscode from 'vscode';
import { FlowScopeApiClient } from '../services/apiClient';

export class CodeLensProvider implements vscode.CodeLensProvider {
    private _onDidChangeCodeLenses: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
    public readonly onDidChangeCodeLenses: vscode.Event<void> = this._onDidChangeCodeLenses.event;

    constructor(private apiClient: FlowScopeApiClient) {}

    public provideCodeLenses(document: vscode.TextDocument, token: vscode.CancellationToken): vscode.ProviderResult<vscode.CodeLens[]> {
        const codeLenses: vscode.CodeLens[] = [];
        
        // Simple pattern matching for common LLM framework patterns
        const text = document.getText();
        const lines = text.split('\n');
        
        lines.forEach((line, index) => {
            // Look for LangChain patterns
            if (line.includes('LLMChain') || line.includes('chain.run') || line.includes('chain.invoke')) {
                const range = new vscode.Range(index, 0, index, line.length);
                
                codeLenses.push(new vscode.CodeLens(range, {
                    title: "🔍 Debug with FlowScope",
                    command: "flowscope.startTracing",
                    arguments: [document.uri, index]
                }));
                
                codeLenses.push(new vscode.CodeLens(range, {
                    title: "📝 Create Prompt Version",
                    command: "flowscope.createPromptVersion",
                    arguments: [document.uri, index]
                }));
            }
            
            // Look for LlamaIndex patterns
            if (line.includes('GPTSimpleVectorIndex') || line.includes('query_engine') || line.includes('.query(')) {
                const range = new vscode.Range(index, 0, index, line.length);
                
                codeLenses.push(new vscode.CodeLens(range, {
                    title: "🔍 Debug with FlowScope",
                    command: "flowscope.startTracing",
                    arguments: [document.uri, index]
                }));
            }
            
            // Look for OpenAI API calls
            if (line.includes('openai.') || line.includes('ChatCompletion.create') || line.includes('client.chat.completions.create')) {
                const range = new vscode.Range(index, 0, index, line.length);
                
                codeLenses.push(new vscode.CodeLens(range, {
                    title: "🔍 Debug with FlowScope",
                    command: "flowscope.startTracing",
                    arguments: [document.uri, index]
                }));
            }
        });
        
        return codeLenses;
    }

    public refresh(): void {
        this._onDidChangeCodeLenses.fire();
    }
}
