import { DebugWebSocketGateway } from '../websocket/websocket.gateway';
import type { TraceData, UniversalTraceData } from '../types';
export declare class WebSocketService {
    private readonly websocketGateway;
    constructor(websocketGateway: DebugWebSocketGateway);
    /**
     * Broadcast a legacy trace event to all connected clients in a session
     */
    broadcastTrace(trace: TraceData): Promise<void>;
    /**
     * Broadcast a universal trace event to all connected clients in a session
     */
    broadcastUniversalTrace(trace: UniversalTraceData): Promise<void>;
    /**
     * Broadcast a session update to all connected clients
     */
    broadcastSessionUpdate(sessionId: string, update: any): Promise<void>;
    /**
     * Broadcast trace batch processing results
     */
    broadcastTraceBatchResult(result: {
        batchId: string;
        processedCount: number;
        failedCount: number;
        successfulTraceIds: string[];
    }): Promise<void>;
    /**
     * Broadcast session processing results
     */
    broadcastSessionResult(result: {
        sessionId: string;
        processedCount: number;
        failedCount: number;
        traceIds: string[];
    }): Promise<void>;
    /**
     * Get session statistics (connected clients, etc.)
     */
    getSessionStats(sessionId: string): {
        sessionId: string;
        connectedClients: number;
        clients: {
            id: string;
            userId: string | undefined;
            connectedAt: number;
        }[];
    };
    /**
     * Send trace events in batches for better performance
     */
    broadcastTraceBatch(traces: TraceData[]): Promise<void>;
}
