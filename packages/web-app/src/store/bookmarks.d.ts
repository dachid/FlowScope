interface Bookmark {
    id: string;
    traceId: string;
    sessionId: string;
    name: string;
    description?: string;
    tags: string[];
    createdAt: number;
    traceData: {
        type: string;
        timestamp: number;
        preview: string;
    };
}
interface BookmarkStore {
    bookmarks: Bookmark[];
    addBookmark: (traceId: string, trace: any, name?: string, description?: string, tags?: string[]) => void;
    removeBookmark: (bookmarkId: string) => void;
    updateBookmark: (bookmarkId: string, updates: Partial<Bookmark>) => void;
    getBookmarksBySession: (sessionId: string) => Bookmark[];
    isBookmarked: (traceId: string) => boolean;
    getBookmarkByTraceId: (traceId: string) => Bookmark | undefined;
    searchBookmarks: (query: string) => Bookmark[];
    getBookmarksByTag: (tag: string) => Bookmark[];
    clearBookmarks: () => void;
}
export declare const useBookmarkStore: import("zustand").UseBoundStore<Omit<import("zustand").StoreApi<BookmarkStore>, "persist"> & {
    persist: {
        setOptions: (options: Partial<import("zustand/middleware").PersistOptions<BookmarkStore, BookmarkStore>>) => void;
        clearStorage: () => void;
        rehydrate: () => Promise<void> | void;
        hasHydrated: () => boolean;
        onHydrate: (fn: (state: BookmarkStore) => void) => () => void;
        onFinishHydration: (fn: (state: BookmarkStore) => void) => () => void;
        getOptions: () => Partial<import("zustand/middleware").PersistOptions<BookmarkStore, BookmarkStore>>;
    };
}>;
export {};
