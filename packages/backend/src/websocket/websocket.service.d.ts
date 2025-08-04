import { DebugWebSocketGateway } from '../websocket/websocket.gateway';
import type { TraceData } from '@flowscope/shared';
export declare class WebSocketService {
    private readonly websocketGateway;
    constructor(websocketGateway: DebugWebSocketGateway);
    /**
     * Broadcast a trace event to all connected clients in a session
     */
    broadcastTrace(trace: TraceData): Promise<void>;
    /**
     * Broadcast a session update to all connected clients
     */
    broadcastSessionUpdate(sessionId: string, update: any): Promise<void>;
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
