import type { CreateBookmarkRequest, UpdateBookmarkRequest } from '../services/BookmarksService';
import type { Bookmark } from '../services/UserPreferencesService';
export declare function useBookmarks(userId?: string): {
    bookmarks: Bookmark[];
    isLoading: boolean;
    error: string | null;
    createBookmark: (data: Omit<CreateBookmarkRequest, "userId">) => Promise<Bookmark>;
    updateBookmark: (id: string, data: UpdateBookmarkRequest) => Promise<Bookmark>;
    deleteBookmark: (id: string) => Promise<void>;
    isBookmarked: (traceId: string) => boolean;
    getBookmarkByTrace: (traceId: string) => Bookmark | undefined;
    searchBookmarks: (query?: string, tags?: string[]) => Promise<Bookmark[]>;
    getBookmarksByTags: (tags: string[]) => Bookmark[];
    getAllTags: () => string[];
};
export default useBookmarks;
