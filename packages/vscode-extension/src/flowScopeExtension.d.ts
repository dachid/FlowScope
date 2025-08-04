import * as vscode from 'vscode';
import { TraceData } from '@flowscope/shared';
export declare class FlowScopeExtension {
    private context;
    private apiClient;
    private isTracing;
    private currentTraceId;
    private outputChannel;
    constructor(context: vscode.ExtensionContext);
    private initializeConnection;
    openDebugger(): Promise<void>;
    startTracing(): Promise<void>;
    stopTracing(): Promise<void>;
    selectTrace(traceId: string): Promise<void>;
    exportTrace(trace: TraceData): Promise<void>;
    createPromptVersion(): Promise<void>;
    addBookmark(traceId: string): Promise<void>;
    removeBookmark(bookmarkId: string): Promise<void>;
    private highlightTraceInEditor;
    private updateStatusBar;
    private getDebuggerWebviewContent;
    dispose(): void;
}
