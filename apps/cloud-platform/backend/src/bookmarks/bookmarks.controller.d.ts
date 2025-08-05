import { BookmarksService } from './bookmarks.service';
export interface CreateBookmarkDto {
    userId: string;
    traceId: string;
    title: string;
    description?: string;
    tags?: string[];
    color?: string;
}
export interface UpdateBookmarkDto {
    title?: string;
    description?: string;
    tags?: string[];
    color?: string;
}
export declare class BookmarksController {
    private readonly bookmarksService;
    constructor(bookmarksService: BookmarksService);
    getUserBookmarks(userId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tags: string | null;
        userId: string;
        description: string | null;
        color: string | null;
        traceId: string;
        title: string;
    }[]>;
    createBookmark(createBookmarkDto: CreateBookmarkDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tags: string | null;
        userId: string;
        description: string | null;
        color: string | null;
        traceId: string;
        title: string;
    }>;
    updateBookmark(id: string, updateBookmarkDto: UpdateBookmarkDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tags: string | null;
        userId: string;
        description: string | null;
        color: string | null;
        traceId: string;
        title: string;
    }>;
    deleteBookmark(id: string): Promise<{
        success: boolean;
    }>;
    getBookmarkByTrace(userId: string, traceId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tags: string | null;
        userId: string;
        description: string | null;
        color: string | null;
        traceId: string;
        title: string;
    } | null>;
    searchBookmarks(userId: string, query: string, tags?: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tags: string | null;
        userId: string;
        description: string | null;
        color: string | null;
        traceId: string;
        title: string;
    }[]>;
}
