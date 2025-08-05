import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import type { TraceData } from '@flowscope/shared';
export declare class DebugWebSocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
    server: Server;
    private readonly logger;
    private connectedClients;
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    handleJoinSession(data: {
        sessionId: string;
        userId?: string;
    }, client: Socket): void;
    handleLeaveSession(data: {
        sessionId: string;
    }, client: Socket): void;
    handleTraceEvent(trace: TraceData, client: Socket): void;
    handleRequestSessionState(data: {
        sessionId: string;
    }, client: Socket): void;
    broadcastTrace(trace: TraceData): void;
    broadcastSessionUpdate(sessionId: string, update: any): void;
    getSessionStats(sessionId: string): {
        sessionId: string;
        connectedClients: number;
        clients: {
            id: string;
            userId: string | undefined;
            connectedAt: number;
        }[];
    };
}
