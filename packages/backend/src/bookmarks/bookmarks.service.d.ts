import { PrismaService } from '../prisma/prisma.service';
import type { CreateBookmarkDto, UpdateBookmarkDto } from './bookmarks.controller';
export declare class BookmarksService {
    private prisma;
    constructor(prisma: PrismaService);
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
    createBookmark(data: CreateBookmarkDto): Promise<{
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
    updateBookmark(id: string, data: UpdateBookmarkDto): Promise<{
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
    searchBookmarks(userId: string, query?: string, tags?: string[]): Promise<{
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
