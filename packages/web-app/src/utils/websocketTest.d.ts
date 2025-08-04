import type { TraceData } from '@flowscope/shared';
declare class WebSocketTestClient {
    private socket;
    private readonly url;
    connect(): Promise<void>;
    joinSession(sessionId: string): void;
    sendTrace(trace: TraceData): void;
    disconnect(): void;
}
declare function runWebSocketTest(): Promise<void>;
export { WebSocketTestClient, runWebSocketTest };
