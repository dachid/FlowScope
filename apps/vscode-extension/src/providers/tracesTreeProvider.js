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
exports.TracesTreeDataProvider = exports.TraceTreeItem = void 0;
const vscode = __importStar(require("vscode"));
class TraceTreeItem extends vscode.TreeItem {
    constructor(trace, collapsibleState) {
        super(trace.type, collapsibleState);
        this.trace = trace;
        this.collapsibleState = collapsibleState;
        this.id = trace.id;
        this.description = new Date(trace.timestamp).toLocaleString();
        this.tooltip = `${trace.type} - ${this.description}`;
        this.contextValue = 'trace';
        // Set icon based on trace type
        switch (trace.type) {
            case 'prompt':
                this.iconPath = new vscode.ThemeIcon('comment');
                break;
            case 'response':
                this.iconPath = new vscode.ThemeIcon('reply');
                break;
            case 'function_call':
                this.iconPath = new vscode.ThemeIcon('symbol-function');
                break;
            case 'error':
                this.iconPath = new vscode.ThemeIcon('error');
                break;
            default:
                this.iconPath = new vscode.ThemeIcon('circle-filled');
        }
        // Command to select trace when clicked
        this.command = {
            command: 'flowscope.selectTrace',
            title: 'Select Trace',
            arguments: [trace.id]
        };
    }
}
exports.TraceTreeItem = TraceTreeItem;
class TracesTreeDataProvider {
    constructor(apiClient) {
        this.apiClient = apiClient;
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.traces = [];
        this.loadTraces();
        // Subscribe to trace updates
        this.apiClient.onTracesUpdated((traces) => {
            this.traces = traces;
            this.refresh();
        });
    }
    refresh() {
        this._onDidChangeTreeData.fire();
    }
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        if (!element) {
            // Return root level traces
            return Promise.resolve(this.traces.map(trace => new TraceTreeItem(trace, vscode.TreeItemCollapsibleState.None)));
        }
        // For now, traces don't have children
        // In the future, this could show nested operations or related traces
        return Promise.resolve([]);
    }
    async loadTraces() {
        try {
            this.traces = await this.apiClient.getTraces();
            this.refresh();
        }
        catch (error) {
            console.error('Failed to load traces:', error);
            // Show empty state or error message
            this.traces = [];
            this.refresh();
        }
    }
}
exports.TracesTreeDataProvider = TracesTreeDataProvider;
