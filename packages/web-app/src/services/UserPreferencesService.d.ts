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
export interface Bookmark {
    id: string;
    userId: string;
    traceId: string;
    title: string;
    description?: string;
    tags?: string[];
    color?: string;
    createdAt: Date;
    updatedAt: Date;
}
declare class UserPreferencesService {
    private static readonly STORAGE_KEY;
    private static readonly DEFAULT_USER_ID;
    private preferencesCache;
    getUserPreferences(userId?: string): Promise<UserPreferences>;
    updateUserPreferences(updates: Partial<UserPreferences>, userId?: string): Promise<UserPreferences>;
    getCachedPreferences(): UserPreferences | null;
    subscribeToPreferencesChanges(callback: (preferences: UserPreferences) => void): () => void;
}
declare const _default: UserPreferencesService;
export default _default;
