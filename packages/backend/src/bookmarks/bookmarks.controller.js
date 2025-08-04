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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookmarksController = void 0;
const common_1 = require("@nestjs/common");
const bookmarks_service_1 = require("./bookmarks.service");
let BookmarksController = class BookmarksController {
    constructor(bookmarksService) {
        this.bookmarksService = bookmarksService;
    }
    async getUserBookmarks(userId) {
        console.log(`[BookmarksController] Getting bookmarks for user: ${userId}`);
        return this.bookmarksService.getUserBookmarks(userId);
    }
    async createBookmark(createBookmarkDto) {
        console.log('[BookmarksController] Creating bookmark:', createBookmarkDto);
        return this.bookmarksService.createBookmark(createBookmarkDto);
    }
    async updateBookmark(id, updateBookmarkDto) {
        console.log(`[BookmarksController] Updating bookmark ${id}:`, updateBookmarkDto);
        return this.bookmarksService.updateBookmark(id, updateBookmarkDto);
    }
    async deleteBookmark(id) {
        console.log(`[BookmarksController] Deleting bookmark: ${id}`);
        return this.bookmarksService.deleteBookmark(id);
    }
    async getBookmarkByTrace(userId, traceId) {
        console.log(`[BookmarksController] Getting bookmark for user ${userId} and trace ${traceId}`);
        return this.bookmarksService.getBookmarkByTrace(userId, traceId);
    }
    async searchBookmarks(userId, query, tags) {
        console.log(`[BookmarksController] Searching bookmarks for user ${userId} with query: ${query}, tags: ${tags}`);
        const tagArray = tags ? tags.split(',') : undefined;
        return this.bookmarksService.searchBookmarks(userId, query, tagArray);
    }
};
exports.BookmarksController = BookmarksController;
__decorate([
    (0, common_1.Get)(':userId'),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BookmarksController.prototype, "getUserBookmarks", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BookmarksController.prototype, "createBookmark", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], BookmarksController.prototype, "updateBookmark", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BookmarksController.prototype, "deleteBookmark", null);
__decorate([
    (0, common_1.Get)(':userId/by-trace/:traceId'),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Param)('traceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], BookmarksController.prototype, "getBookmarkByTrace", null);
__decorate([
    (0, common_1.Get)(':userId/search'),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Query)('q')),
    __param(2, (0, common_1.Query)('tags')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], BookmarksController.prototype, "searchBookmarks", null);
exports.BookmarksController = BookmarksController = __decorate([
    (0, common_1.Controller)('api/bookmarks'),
    __metadata("design:paramtypes", [bookmarks_service_1.BookmarksService])
], BookmarksController);
