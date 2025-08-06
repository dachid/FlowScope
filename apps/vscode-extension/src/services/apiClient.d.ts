import { TraceData } from '../types';
export interface TracingSession {
    workspacePath: string;
    timestamp: number;
}
export interface PromptVersion {
    name: string;
    content: string;
    filePath: string;
    lineNumber: number;
}
export interface Bookmark {
    traceId: string;
    description: string;
    timestamp: number;
}
export declare class FlowScopeApiClient {
    private httpClient;
    private wsClient;
    private serverUrl;
    private tracesUpdateCallbacks;
    connect(serverUrl: string): Promise<void>;
    private initializeWebSocket;
    startTracingSession(session: TracingSession): Promise<string>;
    stopTracingSession(sessionId: string): Promise<void>;
    getTraces(): Promise<TraceData[]>;
    getTrace(traceId: string): Promise<TraceData | null>;
    createPromptVersion(prompt: PromptVersion): Promise<string>;
    getPromptVersions(): Promise<any[]>;
    addBookmark(bookmark: Bookmark): Promise<string>;
    removeBookmark(bookmarkId: string): Promise<void>;
    getBookmarks(): Promise<any[]>;
    onTracesUpdated(callback: (traces: TraceData[]) => void): void;
    private notifyTracesUpdated;
    disconnect(): void;
}
