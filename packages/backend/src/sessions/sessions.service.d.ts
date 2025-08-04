import { PrismaService } from '../database/prisma.service';
import type { Session, TraceData } from '@flowscope/shared';
export declare class SessionsService {
    private prisma;
    constructor(prisma: PrismaService);
    createSession(data: {
        name?: string;
        userId?: string;
        projectId?: string;
        metadata?: any;
    }): Promise<Session>;
    getAllSessions(userId?: string): Promise<Session[]>;
    getSession(id: string): Promise<Session | null>;
    updateSession(id: string, data: Partial<Session>): Promise<Session>;
    deleteSession(id: string): Promise<void>;
    addTrace(sessionId: string, trace: Omit<TraceData, 'id'>): Promise<TraceData>;
    getSessionTraces(sessionId: string): Promise<TraceData[]>;
    addMultipleTraces(sessionId: string, traces: Omit<TraceData, 'id'>[]): Promise<TraceData[]>;
}
