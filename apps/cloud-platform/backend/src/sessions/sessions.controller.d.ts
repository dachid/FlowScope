import { SessionsService } from './sessions.service';
import { DebugService } from '../debug/debug.service';
import type { Session, TraceData } from '../types';
export declare class SessionsController {
    private sessionsService;
    private debugService;
    constructor(sessionsService: SessionsService, debugService: DebugService);
    createSession(createSessionDto: {
        name?: string;
        userId?: string;
        projectId?: string;
        metadata?: any;
    }): Promise<Session>;
    getAllSessions(userId?: string): Promise<Session[]>;
    getSession(id: string): Promise<Session | null>;
    updateSession(id: string, updateSessionDto: Partial<Session>): Promise<Session>;
    deleteSession(id: string): Promise<void>;
    getDatabaseSessions(): Promise<{
        total: number;
        groups: {
            [name: string]: Session[];
        };
        duplicates: [string, Session[]][];
    }>;
    cleanupDuplicateSessions(): Promise<{
        deleted: number;
        remaining: number;
    }>;
    addTrace(sessionId: string, trace: Omit<TraceData, 'id'>): Promise<TraceData>;
    addMultipleTraces(sessionId: string, traces: Omit<TraceData, 'id'>[]): Promise<TraceData[]>;
    getSessionTraces(sessionId: string): Promise<TraceData[]>;
}
