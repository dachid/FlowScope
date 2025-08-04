import { useState, useEffect, useCallback } from 'react';
import BookmarksService from '../services/BookmarksService';
import type { CreateBookmarkRequest, UpdateBookmarkRequest } from '../services/BookmarksService';
import type { Bookmark } from '../services/UserPreferencesService';

export function useBookmarks(userId: string = 'anonymous-user') {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load bookmarks on hook initialization
  useEffect(() => {
    const loadBookmarks = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const userBookmarks = await BookmarksService.getUserBookmarks(userId);
        setBookmarks(userBookmarks);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load bookmarks');
        console.error('[useBookmarks] Error loading bookmarks:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadBookmarks();

    // Subscribe to real-time changes from other tabs
    const unsubscribe = BookmarksService.subscribeToBookmarksChanges((newBookmarks: Bookmark[]) => {
      console.log('[useBookmarks] Received bookmarks update from another tab:', newBookmarks.length);
      setBookmarks(newBookmarks);
    });

    return unsubscribe;
  }, [userId]);

  // Create bookmark
  const createBookmark = useCallback(async (data: Omit<CreateBookmarkRequest, 'userId'>) => {
    try {
      setError(null);
      const bookmark = await BookmarksService.createBookmark({ ...data, userId });
      setBookmarks(prev => [bookmark, ...prev]);
      console.log('[useBookmarks] Bookmark created:', bookmark);
      return bookmark;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create bookmark');
      console.error('[useBookmarks] Error creating bookmark:', err);
      throw err;
    }
  }, [userId]);

  // Update bookmark
  const updateBookmark = useCallback(async (id: string, data: UpdateBookmarkRequest) => {
    try {
      setError(null);
      const updatedBookmark = await BookmarksService.updateBookmark(id, data);
      setBookmarks(prev => prev.map(b => b.id === id ? updatedBookmark : b));
      console.log('[useBookmarks] Bookmark updated:', updatedBookmark);
      return updatedBookmark;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update bookmark');
      console.error('[useBookmarks] Error updating bookmark:', err);
      throw err;
    }
  }, []);

  // Delete bookmark
  const deleteBookmark = useCallback(async (id: string) => {
    try {
      setError(null);
      await BookmarksService.deleteBookmark(id);
      setBookmarks(prev => prev.filter(b => b.id !== id));
      console.log('[useBookmarks] Bookmark deleted:', id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete bookmark');
      console.error('[useBookmarks] Error deleting bookmark:', err);
      throw err;
    }
  }, []);

  // Check if trace is bookmarked
  const isBookmarked = useCallback((traceId: string) => {
    return bookmarks.some(b => b.traceId === traceId);
  }, [bookmarks]);

  // Get bookmark by trace ID
  const getBookmarkByTrace = useCallback((traceId: string) => {
    return bookmarks.find(b => b.traceId === traceId);
  }, [bookmarks]);

  // Search bookmarks
  const searchBookmarks = useCallback(async (query?: string, tags?: string[]) => {
    try {
      setError(null);
      const results = await BookmarksService.searchBookmarks(userId, query, tags);
      console.log('[useBookmarks] Search results:', results.length);
      return results;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search bookmarks');
      console.error('[useBookmarks] Error searching bookmarks:', err);
      return [];
    }
  }, [userId]);

  // Get bookmarks by tags
  const getBookmarksByTags = useCallback((tags: string[]) => {
    return bookmarks.filter(bookmark => {
      const bookmarkTags = bookmark.tags || [];
      return tags.every(tag => bookmarkTags.includes(tag));
    });
  }, [bookmarks]);

  // Get all unique tags
  const getAllTags = useCallback(() => {
    const allTags = new Set<string>();
    bookmarks.forEach(bookmark => {
      (bookmark.tags || []).forEach((tag: string) => allTags.add(tag));
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

export default useBookmarks;
