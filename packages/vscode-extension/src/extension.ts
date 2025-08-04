import * as vscode from 'vscode';
import { FlowScopeExtension } from './flowScopeExtension';
import { TracesTreeDataProvider } from './providers/tracesTreeProvider';
import { PromptsTreeDataProvider } from './providers/promptsTreeProvider';
import { BookmarksTreeDataProvider } from './providers/bookmarksTreeProvider';
import { FlowScopeWebviewProvider } from './providers/webviewProvider';
import { CodeLensProvider } from './providers/codeLensProvider';
import { DecorationProvider } from './providers/decorationProvider';
import { FlowScopeApiClient } from './services/apiClient';

let extension: FlowScopeExtension;

export function activate(context: vscode.ExtensionContext) {
    console.log('FlowScope extension is being activated');

    // Initialize the main extension instance
    extension = new FlowScopeExtension(context);

    // Initialize API client
    const apiClient = new FlowScopeApiClient();

    // Initialize tree data providers
    const tracesProvider = new TracesTreeDataProvider(apiClient);
    const promptsProvider = new PromptsTreeDataProvider(apiClient);
    const bookmarksProvider = new BookmarksTreeDataProvider(apiClient);

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
    const webviewProvider = new FlowScopeWebviewProvider(context.extensionUri, apiClient);
    
    // Register webview provider
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider('flowscope.debugger', webviewProvider)
    );

    // Initialize CodeLens provider
    const codeLensProvider = new CodeLensProvider(apiClient);
    context.subscriptions.push(
        vscode.languages.registerCodeLensProvider(
            [
                { scheme: 'file', language: 'python' },
                { scheme: 'file', language: 'typescript' },
                { scheme: 'file', language: 'javascript' }
            ],
            codeLensProvider
        )
    );

    // Initialize decoration provider for inline hints
    const decorationProvider = new DecorationProvider(apiClient);

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

        vscode.commands.registerCommand('flowscope.selectTrace', (traceId: string) => {
            extension.selectTrace(traceId);
            decorationProvider.updateDecorations(traceId);
        }),

        vscode.commands.registerCommand('flowscope.createPromptVersion', async () => {
            await extension.createPromptVersion();
            promptsProvider.refresh();
        }),

        vscode.commands.registerCommand('flowscope.addBookmark', (traceId: string) => {
            extension.addBookmark(traceId);
            bookmarksProvider.refresh();
        }),

        vscode.commands.registerCommand('flowscope.removeBookmark', (bookmarkId: string) => {
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
    context.subscriptions.push(
        vscode.window.onDidChangeActiveTextEditor((editor) => {
            if (editor) {
                decorationProvider.updateForEditor(editor);
            }
        })
    );

    console.log('FlowScope extension activated successfully');
}

export function deactivate() {
    if (extension) {
        extension.dispose();
    }
    console.log('FlowScope extension deactivated');
}
