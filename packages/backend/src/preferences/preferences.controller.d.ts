import { UserPreferencesService, UserPreferences } from './user-preferences.service';
export declare class UserPreferencesController {
    private readonly userPreferencesService;
    constructor(userPreferencesService: UserPreferencesService);
    getUserPreferences(userId: string): Promise<UserPreferences | null>;
    updateUserPreferences(userId: string, updates: Partial<UserPreferences>): Promise<UserPreferences>;
}
export declare class BookmarksController {
    private readonly userPreferencesService;
    constructor(userPreferencesService: UserPreferencesService);
    getUserBookmarks(userId: string): Promise<{
        bookmarks: never[];
    }>;
    addBookmark(userId: string, traceId: string, bookmark: {
        title: string;
        description?: string;
        tags?: string[];
        color?: string;
    }): Promise<{
        success: boolean;
    }>;
}
