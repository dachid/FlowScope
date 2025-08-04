import type { Session, TraceData } from '@flowscope/shared';
export declare class ApiService {
    private static makeRequest;
    static initializeDemoData(): Promise<{
        sessions: Session[];
        traces: {
            [sessionId: string]: TraceData[];
        };
    }>;
    static createSession(data: {
        name?: string;
        userId?: string;
        projectId?: string;
        metadata?: any;
    }): Promise<Session>;
    static getAllSessions(userId?: string): Promise<Session[]>;
    static getSession(id: string): Promise<Session | null>;
    static updateSession(id: string, data: Partial<Session>): Promise<Session>;
    static deleteSession(id: string): Promise<void>;
    static addTrace(sessionId: string, trace: Omit<TraceData, 'id'>): Promise<TraceData>;
    static addMultipleTraces(sessionId: string, traces: Omit<TraceData, 'id'>[]): Promise<TraceData[]>;
    static getSessionTraces(sessionId: string): Promise<TraceData[]>;
    static healthCheck(): Promise<{
        status: string;
        service: string;
    }>;
}
