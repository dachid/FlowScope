import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateBookmarkDto, UpdateBookmarkDto } from './bookmarks.controller';

@Injectable()
export class BookmarksService {
  constructor(private prisma: PrismaService) {}

  async getUserBookmarks(userId: string) {
    console.log(`[BookmarksService] Fetching bookmarks for user: ${userId}`);
    
    try {
      const bookmarks = await this.prisma.bookmark.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      console.log(`[BookmarksService] Found ${bookmarks.length} bookmarks for user ${userId}`);
      return bookmarks;
    } catch (error) {
      console.error('[BookmarksService] Error fetching bookmarks:', error);
      throw error;
    }
  }

  async createBookmark(data: CreateBookmarkDto) {
    console.log('[BookmarksService] Creating bookmark:', data);
    
    try {
      // Check if bookmark already exists for this user and trace
      const existingBookmark = await this.prisma.bookmark.findFirst({
        where: {
          userId: data.userId,
          traceId: data.traceId,
        },
      });

      if (existingBookmark) {
        console.log('[BookmarksService] Bookmark already exists, returning existing one');
        return existingBookmark;
      }

      const bookmark = await this.prisma.bookmark.create({
        data: {
          userId: data.userId,
          traceId: data.traceId,
          title: data.title,
          description: data.description,
          tags: data.tags ? JSON.stringify(data.tags) : null,
          color: data.color,
        },
      });

      console.log('[BookmarksService] Created bookmark:', bookmark);
      return bookmark;
    } catch (error) {
      console.error('[BookmarksService] Error creating bookmark:', error);
      throw error;
    }
  }

  async updateBookmark(id: string, data: UpdateBookmarkDto) {
    console.log(`[BookmarksService] Updating bookmark ${id}:`, data);
    
    try {
      const bookmark = await this.prisma.bookmark.update({
        where: { id },
        data: {
          title: data.title,
          description: data.description,
          tags: data.tags ? JSON.stringify(data.tags) : undefined,
          color: data.color,
          updatedAt: new Date(),
        },
      });

      console.log('[BookmarksService] Updated bookmark:', bookmark);
      return bookmark;
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Bookmark with ID ${id} not found`);
      }
      console.error('[BookmarksService] Error updating bookmark:', error);
      throw error;
    }
  }

  async deleteBookmark(id: string) {
    console.log(`[BookmarksService] Deleting bookmark: ${id}`);
    
    try {
      await this.prisma.bookmark.delete({
        where: { id },
      });

      console.log(`[BookmarksService] Deleted bookmark: ${id}`);
      return { success: true };
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Bookmark with ID ${id} not found`);
      }
      console.error('[BookmarksService] Error deleting bookmark:', error);
      throw error;
    }
  }

  async getBookmarkByTrace(userId: string, traceId: string) {
    console.log(`[BookmarksService] Getting bookmark for user ${userId} and trace ${traceId}`);
    
    try {
      const bookmark = await this.prisma.bookmark.findFirst({
        where: {
          userId,
          traceId,
        },
      });

      if (bookmark) {
        console.log('[BookmarksService] Found bookmark:', bookmark);
      } else {
        console.log('[BookmarksService] No bookmark found for this trace');
      }

      return bookmark;
    } catch (error) {
      console.error('[BookmarksService] Error fetching bookmark by trace:', error);
      throw error;
    }
  }

  async searchBookmarks(userId: string, query?: string, tags?: string[]) {
    console.log(`[BookmarksService] Searching bookmarks for user ${userId}, query: ${query}, tags: ${tags}`);
    
    try {
      const where: any = { userId };

      if (query) {
        where.OR = [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ];
      }

      if (tags && tags.length > 0) {
        // For JSON search, we need to check if any of the tags exist in the JSON array
        where.AND = tags.map(tag => ({
          tags: {
            contains: tag,
          },
        }));
      }

      const bookmarks = await this.prisma.bookmark.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });

      console.log(`[BookmarksService] Found ${bookmarks.length} bookmarks matching search criteria`);
      return bookmarks;
    } catch (error) {
      console.error('[BookmarksService] Error searching bookmarks:', error);
      throw error;
    }
  }
}
