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

class BookmarksService {
  private static readonly DEFAULT_USER_ID = 'anonymous-user';
  private static readonly STORAGE_KEY = 'flowscope_bookmarks';

  async getUserBookmarks(userId: string = BookmarksService.DEFAULT_USER_ID): Promise<Bookmark[]> {
    console.log(`[BookmarksService] Getting bookmarks for user: ${userId}`);
    
    try {
      const response = await fetch(`http://localhost:3001/api/bookmarks/${userId}`);
      
      if (response.ok) {
        const bookmarks = await response.json();
        console.log('[BookmarksService] Loaded bookmarks from API:', bookmarks.length);
        
        const parsedBookmarks = bookmarks.map((bookmark: any) => ({
          ...bookmark,
          tags: bookmark.tags ? JSON.parse(bookmark.tags) : [],
          createdAt: new Date(bookmark.createdAt),
          updatedAt: new Date(bookmark.updatedAt),
        }));
        
        localStorage.setItem(BookmarksService.STORAGE_KEY, JSON.stringify(parsedBookmarks));
        return parsedBookmarks;
      }
    } catch (error) {
      console.log('[BookmarksService] API call failed, falling back to localStorage:', error);
    }

    const cached = localStorage.getItem(BookmarksService.STORAGE_KEY);
    if (cached) {
      try {
        const bookmarks = JSON.parse(cached);
        console.log('[BookmarksService] Loaded bookmarks from localStorage:', bookmarks.length);
        return bookmarks;
      } catch (error) {
        console.error('[BookmarksService] Error parsing cached bookmarks:', error);
      }
    }

    console.log('[BookmarksService] No bookmarks found, returning empty array');
    return [];
  }

  async createBookmark(data: CreateBookmarkRequest): Promise<Bookmark> {
    console.log('[BookmarksService] Creating bookmark:', data);
    
    try {
      const response = await fetch('http://localhost:3001/api/bookmarks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const bookmark = await response.json();
        console.log('[BookmarksService] Created bookmark via API:', bookmark);
        
        const parsedBookmark = {
          ...bookmark,
          tags: bookmark.tags ? JSON.parse(bookmark.tags) : [],
          createdAt: new Date(bookmark.createdAt),
          updatedAt: new Date(bookmark.updatedAt),
        };
        
        return parsedBookmark;
      }
    } catch (error) {
      console.log('[BookmarksService] API call failed, saving to localStorage:', error);
    }

    const bookmark: Bookmark = {
      id: `bookmark-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...data,
      tags: data.tags || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const bookmarks = await this.getUserBookmarks(data.userId);
    bookmarks.unshift(bookmark);
    localStorage.setItem(BookmarksService.STORAGE_KEY, JSON.stringify(bookmarks));

    console.log('[BookmarksService] Created bookmark locally:', bookmark);
    return bookmark;
  }

  async deleteBookmark(id: string): Promise<void> {
    console.log(`[BookmarksService] Deleting bookmark: ${id}`);
    
    try {
      const response = await fetch(`http://localhost:3001/api/bookmarks/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        console.log('[BookmarksService] Deleted bookmark via API');
        return;
      }
    } catch (error) {
      console.log('[BookmarksService] API call failed, deleting from localStorage:', error);
    }

    const bookmarks = await this.getUserBookmarks();
    const filteredBookmarks = bookmarks.filter(b => b.id !== id);
    
    localStorage.setItem(BookmarksService.STORAGE_KEY, JSON.stringify(filteredBookmarks));
    console.log('[BookmarksService] Deleted bookmark locally');
  }

  async updateBookmark(id: string, data: UpdateBookmarkRequest): Promise<Bookmark> {
    console.log(`[BookmarksService] Updating bookmark ${id}:`, data);
    
    try {
      const response = await fetch(`http://localhost:3001/api/bookmarks/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const bookmark = await response.json();
        console.log('[BookmarksService] Updated bookmark via API:', bookmark);
        
        const parsedBookmark = {
          ...bookmark,
          tags: bookmark.tags ? JSON.parse(bookmark.tags) : [],
          createdAt: new Date(bookmark.createdAt),
          updatedAt: new Date(bookmark.updatedAt),
        };
        
        return parsedBookmark;
      }
    } catch (error) {
      console.log('[BookmarksService] API call failed, updating localStorage:', error);
    }

    const bookmarks = await this.getUserBookmarks();
    const index = bookmarks.findIndex(b => b.id === id);
    
    if (index === -1) {
      throw new Error(`Bookmark with ID ${id} not found`);
    }

    const updatedBookmark = {
      ...bookmarks[index],
      ...data,
      updatedAt: new Date(),
    };

    bookmarks[index] = updatedBookmark;
    localStorage.setItem(BookmarksService.STORAGE_KEY, JSON.stringify(bookmarks));

    console.log('[BookmarksService] Updated bookmark locally:', updatedBookmark);
    return updatedBookmark;
  }

  async searchBookmarks(
    userId: string,
    query?: string,
    tags?: string[]
  ): Promise<Bookmark[]> {
    console.log(`[BookmarksService] Searching bookmarks for user ${userId}, query: ${query}, tags: ${tags}`);
    
    try {
      const searchParams = new URLSearchParams();
      if (query) searchParams.append('q', query);
      if (tags && tags.length > 0) searchParams.append('tags', tags.join(','));
      
      const url = `http://localhost:3001/api/bookmarks/${userId}/search?${searchParams.toString()}`;
      const response = await fetch(url);
      
      if (response.ok) {
        const bookmarks = await response.json();
        console.log('[BookmarksService] Found bookmarks via API:', bookmarks.length);
        
        return bookmarks.map((bookmark: any) => ({
          ...bookmark,
          tags: bookmark.tags ? JSON.parse(bookmark.tags) : [],
          createdAt: new Date(bookmark.createdAt),
          updatedAt: new Date(bookmark.updatedAt),
        }));
      }
    } catch (error) {
      console.log('[BookmarksService] API call failed, searching localStorage:', error);
    }

    const bookmarks = await this.getUserBookmarks(userId);
    
    return bookmarks.filter(bookmark => {
      if (query) {
        const searchText = `${bookmark.title} ${bookmark.description || ''}`.toLowerCase();
        if (!searchText.includes(query.toLowerCase())) {
          return false;
        }
      }
      
      if (tags && tags.length > 0) {
        const bookmarkTags = bookmark.tags || [];
        if (!tags.every(tag => bookmarkTags.includes(tag))) {
          return false;
        }
      }
      
      return true;
    });
  }

  subscribeToBookmarksChanges(callback: (bookmarks: Bookmark[]) => void): () => void {
    const handleStorageChange = async (event: StorageEvent) => {
      if (event.key === BookmarksService.STORAGE_KEY && event.newValue) {
        try {
          const bookmarks = JSON.parse(event.newValue);
          console.log('[BookmarksService] Received bookmarks change from another tab');
          callback(bookmarks);
        } catch (error) {
          console.error('[BookmarksService] Error parsing storage change:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }
}

export default new BookmarksService();