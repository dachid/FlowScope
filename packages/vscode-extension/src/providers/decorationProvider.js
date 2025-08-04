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
exports.DecorationProvider = void 0;
const vscode = __importStar(require("vscode"));
class DecorationProvider {
    constructor(apiClient) {
        this.apiClient = apiClient;
        this.currentDecorations = [];
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
    updateDecorations(traceId) {
        const activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor) {
            return;
        }
        // Clear existing decorations
        this.clearDecorations();
        // Get trace data and create decorations
        this.apiClient.getTrace(traceId).then(trace => {
            if (trace && trace.metadata?.lineNumber !== undefined && typeof trace.metadata.lineNumber === 'number') {
                const line = activeEditor.document.lineAt(trace.metadata.lineNumber);
                const decoration = {
                    range: line.range,
                    hoverMessage: `FlowScope Trace: ${trace.type}\nTimestamp: ${new Date(trace.timestamp).toLocaleString()}\nData: ${JSON.stringify(trace.data, null, 2)}`
                };
                this.currentDecorations = [decoration];
                activeEditor.setDecorations(this.decorationType, this.currentDecorations);
            }
        }).catch(error => {
            console.error('Failed to get trace for decoration:', error);
        });
    }
    updateForEditor(editor) {
        // Update decorations when switching editors
        // This could show persistent highlights for previously traced code
        // For now, just clear decorations when switching editors
        this.clearDecorations();
    }
    clearDecorations() {
        const activeEditor = vscode.window.activeTextEditor;
        if (activeEditor) {
            activeEditor.setDecorations(this.decorationType, []);
        }
        this.currentDecorations = [];
    }
    dispose() {
        this.decorationType.dispose();
    }
}
exports.DecorationProvider = DecorationProvider;
