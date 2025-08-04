import { Socket } from 'socket.io-client';
import type { TraceData } from '@flowscope/shared';
interface UseWebSocketOptions {
    url?: string;
    autoConnect?: boolean;
}
interface WebSocketStatus {
    connected: boolean;
    connecting: boolean;
    error: string | null;
    lastPing?: number;
}
interface ServerToClientEvents {
    connected: (data: {
        clientId: string;
        timestamp: number;
    }) => void;
    session_joined: (data: {
        sessionId: string;
        timestamp: number;
    }) => void;
    new_trace: (trace: TraceData) => void;
    session_state: (data: {
        sessionId: string;
        traces: TraceData[];
        timestamp: number;
    }) => void;
    session_update: (update: any) => void;
    error: (error: {
        message: string;
    }) => void;
}
interface ClientToServerEvents {
    join_session: (data: {
        sessionId: string;
        userId?: string;
    }) => void;
    leave_session: (data: {
        sessionId: string;
    }) => void;
    trace_event: (trace: TraceData) => void;
    request_session_state: (data: {
        sessionId: string;
    }) => void;
}
export declare const useWebSocket: (options?: UseWebSocketOptions) => {
    status: WebSocketStatus;
    connect: () => void;
    disconnect: () => void;
    joinSession: (sessionId: string, userId?: string) => void;
    leaveSession: (sessionId: string) => void;
    sendTrace: (trace: TraceData) => void;
    requestSessionState: (sessionId: string) => void;
    socket: Socket<ServerToClientEvents, ClientToServerEvents> | null;
};
export {};
