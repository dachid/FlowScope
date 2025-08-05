import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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

export const useBookmarkStore = create<BookmarkStore>()(
  persist(
    (set, get) => ({
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

        const newBookmark: Bookmark = {
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
          bookmarks: bookmarks.map(bookmark =>
            bookmark.id === bookmarkId
              ? { ...bookmark, ...updates }
              : bookmark
          )
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
        return bookmarks.filter(bookmark =>
          bookmark.name.toLowerCase().includes(searchLower) ||
          bookmark.description?.toLowerCase().includes(searchLower) ||
          bookmark.tags.some(tag => tag.toLowerCase().includes(searchLower)) ||
          bookmark.traceData.preview.toLowerCase().includes(searchLower)
        );
      },

      getBookmarksByTag: (tag) => {
        const { bookmarks } = get();
        return bookmarks.filter(bookmark => bookmark.tags.includes(tag));
      },

      clearBookmarks: () => set({ bookmarks: [] })
    }),
    {
      name: 'flowscope-bookmarks'
    }
  )
);
