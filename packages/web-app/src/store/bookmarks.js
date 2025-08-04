"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useBookmarkStore = void 0;
const zustand_1 = require("zustand");
const middleware_1 = require("zustand/middleware");
exports.useBookmarkStore = (0, zustand_1.create)()((0, middleware_1.persist)((set, get) => ({
    bookmarks: [],
    addBookmark: (traceId, trace, name, description, tags = []) => {
        const { bookmarks } = get();
        // Check if already bookmarked
        if (bookmarks.some(b => b.traceId === traceId)) {
            return;
        }
        const preview = typeof trace.data === 'string'
            ? trace.data.slice(0, 100) + (trace.data.length > 100 ? '...' : '')
            : JSON.stringify(trace.data).slice(0, 100) + '...';
        const newBookmark = {
            id: `bookmark-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            traceId,
            sessionId: trace.sessionId,
            name: name || `${trace.type} - ${new Date(trace.timestamp).toLocaleString()}`,
            description,
            tags,
            createdAt: Date.now(),
            traceData: {
                type: trace.type,
                timestamp: trace.timestamp,
                preview
            }
        };
        set({ bookmarks: [...bookmarks, newBookmark] });
    },
    removeBookmark: (bookmarkId) => {
        const { bookmarks } = get();
        set({ bookmarks: bookmarks.filter(b => b.id !== bookmarkId) });
    },
    updateBookmark: (bookmarkId, updates) => {
        const { bookmarks } = get();
        set({
            bookmarks: bookmarks.map(bookmark => bookmark.id === bookmarkId
                ? { ...bookmark, ...updates }
                : bookmark)
        });
    },
    getBookmarksBySession: (sessionId) => {
        const { bookmarks } = get();
        return bookmarks.filter(b => b.sessionId === sessionId);
    },
    isBookmarked: (traceId) => {
        const { bookmarks } = get();
        return bookmarks.some(b => b.traceId === traceId);
    },
    getBookmarkByTraceId: (traceId) => {
        const { bookmarks } = get();
        return bookmarks.find(b => b.traceId === traceId);
    },
    searchBookmarks: (query) => {
        const { bookmarks } = get();
        const searchLower = query.toLowerCase();
        return bookmarks.filter(bookmark => bookmark.name.toLowerCase().includes(searchLower) ||
            bookmark.description?.toLowerCase().includes(searchLower) ||
            bookmark.tags.some(tag => tag.toLowerCase().includes(searchLower)) ||
            bookmark.traceData.preview.toLowerCase().includes(searchLower));
    },
    getBookmarksByTag: (tag) => {
        const { bookmarks } = get();
        return bookmarks.filter(bookmark => bookmark.tags.includes(tag));
    },
    clearBookmarks: () => set({ bookmarks: [] })
}), {
    name: 'flowscope-bookmarks'
}));
