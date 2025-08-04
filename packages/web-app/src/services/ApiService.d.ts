import type { Session, TraceData } from '@flowscope/shared';
declare class ApiService {
    private makeRequest;
    initializeDemoData(): Promise<void>;
    getAllSessions(): Promise<Session[]>;
    getSession(sessionId: string): Promise<Session>;
    getSessionTraces(sessionId: string): Promise<TraceData[]>;
    createSession(session: Partial<Session>): Promise<Session>;
    updateSession(sessionId: string, updates: Partial<Session>): Promise<Session>;
    deleteSession(sessionId: string): Promise<void>;
    addTrace(sessionId: string, trace: Partial<TraceData>): Promise<TraceData>;
    addTraces(sessionId: string, traces: Partial<TraceData>[]): Promise<TraceData[]>;
    healthCheck(): Promise<{
        status: string;
        timestamp: string;
    }>;
    getSessions(): Promise<Session[]>;
}
declare const _default: ApiService;
export default _default;
