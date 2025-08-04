import type { Bookmark } from './UserPreferencesService';
export interface CreateBookmarkRequest {
    userId: string;
    traceId: string;
    title: string;
    description?: string;
    tags?: string[];
    color?: string;
}
export interface UpdateBookmarkRequest {
    title?: string;
    description?: string;
    tags?: string[];
    color?: string;
}
declare class BookmarksService {
    private static readonly DEFAULT_USER_ID;
    private static readonly STORAGE_KEY;
    getUserBookmarks(userId?: string): Promise<Bookmark[]>;
    createBookmark(data: CreateBookmarkRequest): Promise<Bookmark>;
    deleteBookmark(id: string): Promise<void>;
    updateBookmark(id: string, data: UpdateBookmarkRequest): Promise<Bookmark>;
    searchBookmarks(userId: string, query?: string, tags?: string[]): Promise<Bookmark[]>;
    subscribeToBookmarksChanges(callback: (bookmarks: Bookmark[]) => void): () => void;
}
declare const _default: BookmarksService;
export default _default;
