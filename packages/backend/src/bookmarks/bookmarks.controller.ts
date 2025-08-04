import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
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

@Controller('api/bookmarks')
export class BookmarksController {
  constructor(private readonly bookmarksService: BookmarksService) {}

  @Get(':userId')
  async getUserBookmarks(@Param('userId') userId: string) {
    console.log(`[BookmarksController] Getting bookmarks for user: ${userId}`);
    return this.bookmarksService.getUserBookmarks(userId);
  }

  @Post()
  async createBookmark(@Body() createBookmarkDto: CreateBookmarkDto) {
    console.log('[BookmarksController] Creating bookmark:', createBookmarkDto);
    return this.bookmarksService.createBookmark(createBookmarkDto);
  }

  @Put(':id')
  async updateBookmark(
    @Param('id') id: string,
    @Body() updateBookmarkDto: UpdateBookmarkDto,
  ) {
    console.log(`[BookmarksController] Updating bookmark ${id}:`, updateBookmarkDto);
    return this.bookmarksService.updateBookmark(id, updateBookmarkDto);
  }

  @Delete(':id')
  async deleteBookmark(@Param('id') id: string) {
    console.log(`[BookmarksController] Deleting bookmark: ${id}`);
    return this.bookmarksService.deleteBookmark(id);
  }

  @Get(':userId/by-trace/:traceId')
  async getBookmarkByTrace(
    @Param('userId') userId: string,
    @Param('traceId') traceId: string,
  ) {
    console.log(`[BookmarksController] Getting bookmark for user ${userId} and trace ${traceId}`);
    return this.bookmarksService.getBookmarkByTrace(userId, traceId);
  }

  @Get(':userId/search')
  async searchBookmarks(
    @Param('userId') userId: string,
    @Query('q') query: string,
    @Query('tags') tags?: string,
  ) {
    console.log(`[BookmarksController] Searching bookmarks for user ${userId} with query: ${query}, tags: ${tags}`);
    const tagArray = tags ? tags.split(',') : undefined;
    return this.bookmarksService.searchBookmarks(userId, query, tagArray);
  }
}
