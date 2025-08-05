"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodeLensProvider = void 0;
const vscode = __importStar(require("vscode"));
class CodeLensProvider {
    constructor(apiClient) {
        this.apiClient = apiClient;
        this._onDidChangeCodeLenses = new vscode.EventEmitter();
        this.onDidChangeCodeLenses = this._onDidChangeCodeLenses.event;
    }
    provideCodeLenses(document, token) {
        const codeLenses = [];
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
    refresh() {
        this._onDidChangeCodeLenses.fire();
    }
}
exports.CodeLensProvider = CodeLensProvider;
