import { PrismaService } from '../database/prisma.service';
interface SessionGroup {
    [key: string]: any[];
}
export declare class DebugService {
    private prisma;
    constructor(prisma: PrismaService);
    getDatabaseSessions(): Promise<{
        total: number;
        groups: SessionGroup;
        sessions: {
            name: string | null;
            id: string;
            startTime: Date;
            status: string;
        }[];
    }>;
    cleanupDuplicateSessions(): Promise<{
        deleted: number;
        remaining: number;
    }>;
}
export {};
