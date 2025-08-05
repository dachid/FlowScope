"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookmarksService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let BookmarksService = class BookmarksService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getUserBookmarks(userId) {
        console.log(`[BookmarksService] Fetching bookmarks for user: ${userId}`);
        try {
            const bookmarks = await this.prisma.bookmark.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
            });
            console.log(`[BookmarksService] Found ${bookmarks.length} bookmarks for user ${userId}`);
            return bookmarks;
        }
        catch (error) {
            console.error('[BookmarksService] Error fetching bookmarks:', error);
            throw error;
        }
    }
    async createBookmark(data) {
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
        }
        catch (error) {
            console.error('[BookmarksService] Error creating bookmark:', error);
            throw error;
        }
    }
    async updateBookmark(id, data) {
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
        }
        catch (error) {
            if (error.code === 'P2025') {
                throw new common_1.NotFoundException(`Bookmark with ID ${id} not found`);
            }
            console.error('[BookmarksService] Error updating bookmark:', error);
            throw error;
        }
    }
    async deleteBookmark(id) {
        console.log(`[BookmarksService] Deleting bookmark: ${id}`);
        try {
            await this.prisma.bookmark.delete({
                where: { id },
            });
            console.log(`[BookmarksService] Deleted bookmark: ${id}`);
            return { success: true };
        }
        catch (error) {
            if (error.code === 'P2025') {
                throw new common_1.NotFoundException(`Bookmark with ID ${id} not found`);
            }
            console.error('[BookmarksService] Error deleting bookmark:', error);
            throw error;
        }
    }
    async getBookmarkByTrace(userId, traceId) {
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
            }
            else {
                console.log('[BookmarksService] No bookmark found for this trace');
            }
            return bookmark;
        }
        catch (error) {
            console.error('[BookmarksService] Error fetching bookmark by trace:', error);
            throw error;
        }
    }
    async searchBookmarks(userId, query, tags) {
        console.log(`[BookmarksService] Searching bookmarks for user ${userId}, query: ${query}, tags: ${tags}`);
        try {
            const where = { userId };
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
        }
        catch (error) {
            console.error('[BookmarksService] Error searching bookmarks:', error);
            throw error;
        }
    }
};
exports.BookmarksService = BookmarksService;
exports.BookmarksService = BookmarksService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BookmarksService);
