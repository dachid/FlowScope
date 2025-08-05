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
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const flowScopeExtension_1 = require("./flowScopeExtension");
const tracesTreeProvider_1 = require("./providers/tracesTreeProvider");
const promptsTreeProvider_1 = require("./providers/promptsTreeProvider");
const bookmarksTreeProvider_1 = require("./providers/bookmarksTreeProvider");
const webviewProvider_1 = require("./providers/webviewProvider");
const codeLensProvider_1 = require("./providers/codeLensProvider");
const decorationProvider_1 = require("./providers/decorationProvider");
const apiClient_1 = require("./services/apiClient");
let extension;
function activate(context) {
    console.log('FlowScope extension is being activated');
    // Initialize the main extension instance
    extension = new flowScopeExtension_1.FlowScopeExtension(context);
    // Initialize API client
    const apiClient = new apiClient_1.FlowScopeApiClient();
    // Initialize tree data providers
    const tracesProvider = new tracesTreeProvider_1.TracesTreeDataProvider(apiClient);
    const promptsProvider = new promptsTreeProvider_1.PromptsTreeDataProvider(apiClient);
    const bookmarksProvider = new bookmarksTreeProvider_1.BookmarksTreeDataProvider(apiClient);
    // Register tree views
    const tracesTreeView = vscode.window.createTreeView('flowscope.traces', {
        treeDataProvider: tracesProvider,
        showCollapseAll: true
    });
    const promptsTreeView = vscode.window.createTreeView('flowscope.prompts', {
        treeDataProvider: promptsProvider,
        showCollapseAll: true
    });
    const bookmarksTreeView = vscode.window.createTreeView('flowscope.bookmarks', {
        treeDataProvider: bookmarksProvider,
        showCollapseAll: true
    });
    // Initialize webview provider for the main debugger interface
    const webviewProvider = new webviewProvider_1.FlowScopeWebviewProvider(context.extensionUri, apiClient);
    // Register webview provider
    context.subscriptions.push(vscode.window.registerWebviewViewProvider('flowscope.debugger', webviewProvider));
    // Initialize CodeLens provider
    const codeLensProvider = new codeLensProvider_1.CodeLensProvider(apiClient);
    context.subscriptions.push(vscode.languages.registerCodeLensProvider([
        { scheme: 'file', language: 'python' },
        { scheme: 'file', language: 'typescript' },
        { scheme: 'file', language: 'javascript' }
    ], codeLensProvider));
    // Initialize decoration provider for inline hints
    const decorationProvider = new decorationProvider_1.DecorationProvider(apiClient);
    // Register commands
    const commands = [
        vscode.commands.registerCommand('flowscope.openDebugger', () => {
            extension.openDebugger();
        }),
        vscode.commands.registerCommand('flowscope.startTracing', async () => {
            await extension.startTracing();
            vscode.commands.executeCommand('setContext', 'flowscope.tracing', true);
            tracesProvider.refresh();
        }),
        vscode.commands.registerCommand('flowscope.stopTracing', async () => {
            await extension.stopTracing();
            vscode.commands.executeCommand('setContext', 'flowscope.tracing', false);
            tracesProvider.refresh();
        }),
        vscode.commands.registerCommand('flowscope.refreshTraces', () => {
            tracesProvider.refresh();
        }),
        vscode.commands.registerCommand('flowscope.exportTrace', (traceItem) => {
            extension.exportTrace(traceItem);
        }),
        vscode.commands.registerCommand('flowscope.selectTrace', (traceId) => {
            extension.selectTrace(traceId);
            decorationProvider.updateDecorations(traceId);
        }),
        vscode.commands.registerCommand('flowscope.createPromptVersion', async () => {
            await extension.createPromptVersion();
            promptsProvider.refresh();
        }),
        vscode.commands.registerCommand('flowscope.addBookmark', (traceId) => {
            extension.addBookmark(traceId);
            bookmarksProvider.refresh();
        }),
        vscode.commands.registerCommand('flowscope.removeBookmark', (bookmarkId) => {
            extension.removeBookmark(bookmarkId);
            bookmarksProvider.refresh();
        })
    ];
    // Add all subscriptions to context
    context.subscriptions.push(...commands);
    context.subscriptions.push(tracesTreeView, promptsTreeView, bookmarksTreeView);
    // Set extension as enabled
    vscode.commands.executeCommand('setContext', 'flowscope.enabled', true);
    // Auto-start tracing if configured
    const config = vscode.workspace.getConfiguration('flowscope');
    if (config.get('autoTrace')) {
        extension.startTracing();
    }
    // Listen for active editor changes to update decorations
    context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor((editor) => {
        if (editor) {
            decorationProvider.updateForEditor(editor);
        }
    }));
    console.log('FlowScope extension activated successfully');
}
function deactivate() {
    if (extension) {
        extension.dispose();
    }
    console.log('FlowScope extension deactivated');
}
