import { PrismaService } from '../database/prisma.service';
export interface UserPreferences {
    id?: string;
    userId: string;
    theme: 'light' | 'dark' | 'auto';
    rightPanelTab: 'details' | 'inspector' | 'bookmarks' | 'comments';
    rightPanelCollapsed: boolean;
    sidebarCollapsed: boolean;
    autoOpenPanelOnNodeClick: boolean;
    defaultSessionView: 'grid' | 'list';
    tracePageSize: number;
    enableNotifications: boolean;
    autoSave: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}
export declare class UserPreferencesService {
    private prisma;
    constructor(prisma: PrismaService);
    getUserPreferences(userId: string): Promise<UserPreferences | null>;
    updateUserPreferences(userId: string, updates: Partial<UserPreferences>): Promise<UserPreferences>;
    private createDefaultPreferences;
    private ensureUserExists;
}
