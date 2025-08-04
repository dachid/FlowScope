"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useBookmarks = useBookmarks;
const react_1 = require("react");
const BookmarksService_1 = __importDefault(require("../services/BookmarksService"));
function useBookmarks(userId = 'anonymous-user') {
    const [bookmarks, setBookmarks] = (0, react_1.useState)([]);
    const [isLoading, setIsLoading] = (0, react_1.useState)(true);
    const [error, setError] = (0, react_1.useState)(null);
    // Load bookmarks on hook initialization
    (0, react_1.useEffect)(() => {
        const loadBookmarks = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const userBookmarks = await BookmarksService_1.default.getUserBookmarks(userId);
                setBookmarks(userBookmarks);
            }
            catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load bookmarks');
                console.error('[useBookmarks] Error loading bookmarks:', err);
            }
            finally {
                setIsLoading(false);
            }
        };
        loadBookmarks();
        // Subscribe to real-time changes from other tabs
        const unsubscribe = BookmarksService_1.default.subscribeToBookmarksChanges((newBookmarks) => {
            console.log('[useBookmarks] Received bookmarks update from another tab:', newBookmarks.length);
            setBookmarks(newBookmarks);
        });
        return unsubscribe;
    }, [userId]);
    // Create bookmark
    const createBookmark = (0, react_1.useCallback)(async (data) => {
        try {
            setError(null);
            const bookmark = await BookmarksService_1.default.createBookmark({ ...data, userId });
            setBookmarks(prev => [bookmark, ...prev]);
            console.log('[useBookmarks] Bookmark created:', bookmark);
            return bookmark;
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create bookmark');
            console.error('[useBookmarks] Error creating bookmark:', err);
            throw err;
        }
    }, [userId]);
    // Update bookmark
    const updateBookmark = (0, react_1.useCallback)(async (id, data) => {
        try {
            setError(null);
            const updatedBookmark = await BookmarksService_1.default.updateBookmark(id, data);
            setBookmarks(prev => prev.map(b => b.id === id ? updatedBookmark : b));
            console.log('[useBookmarks] Bookmark updated:', updatedBookmark);
            return updatedBookmark;
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update bookmark');
            console.error('[useBookmarks] Error updating bookmark:', err);
            throw err;
        }
    }, []);
    // Delete bookmark
    const deleteBookmark = (0, react_1.useCallback)(async (id) => {
        try {
            setError(null);
            await BookmarksService_1.default.deleteBookmark(id);
            setBookmarks(prev => prev.filter(b => b.id !== id));
            console.log('[useBookmarks] Bookmark deleted:', id);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete bookmark');
            console.error('[useBookmarks] Error deleting bookmark:', err);
            throw err;
        }
    }, []);
    // Check if trace is bookmarked
    const isBookmarked = (0, react_1.useCallback)((traceId) => {
        return bookmarks.some(b => b.traceId === traceId);
    }, [bookmarks]);
    // Get bookmark by trace ID
    const getBookmarkByTrace = (0, react_1.useCallback)((traceId) => {
        return bookmarks.find(b => b.traceId === traceId);
    }, [bookmarks]);
    // Search bookmarks
    const searchBookmarks = (0, react_1.useCallback)(async (query, tags) => {
        try {
            setError(null);
            const results = await BookmarksService_1.default.searchBookmarks(userId, query, tags);
            console.log('[useBookmarks] Search results:', results.length);
            return results;
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to search bookmarks');
            console.error('[useBookmarks] Error searching bookmarks:', err);
            return [];
        }
    }, [userId]);
    // Get bookmarks by tags
    const getBookmarksByTags = (0, react_1.useCallback)((tags) => {
        return bookmarks.filter(bookmark => {
            const bookmarkTags = bookmark.tags || [];
            return tags.every(tag => bookmarkTags.includes(tag));
        });
    }, [bookmarks]);
    // Get all unique tags
    const getAllTags = (0, react_1.useCallback)(() => {
        const allTags = new Set();
        bookmarks.forEach(bookmark => {
            (bookmark.tags || []).forEach((tag) => allTags.add(tag));
        });
        return Array.from(allTags).sort();
    }, [bookmarks]);
    return {
        bookmarks,
        isLoading,
        error,
        createBookmark,
        updateBookmark,
        deleteBookmark,
        isBookmarked,
        getBookmarkByTrace,
        searchBookmarks,
        getBookmarksByTags,
        getAllTags,
    };
}
exports.default = useBookmarks;
