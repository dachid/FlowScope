import { Controller, Get, Put, Body, Param, Post } from '@nestjs/common';
import { UserPreferencesService, UserPreferences } from './user-preferences.service';

@Controller('user-preferences')
export class UserPreferencesController {
  constructor(private readonly userPreferencesService: UserPreferencesService) {}

  @Get(':userId')
  async getUserPreferences(@Param('userId') userId: string): Promise<UserPreferences | null> {
    return this.userPreferencesService.getUserPreferences(userId);
  }

  @Put(':userId')
  async updateUserPreferences(
    @Param('userId') userId: string,
    @Body() updates: Partial<UserPreferences>
  ): Promise<UserPreferences> {
    return this.userPreferencesService.updateUserPreferences(userId, updates);
  }
}

@Controller('bookmarks')
export class BookmarksController {
  constructor(private readonly userPreferencesService: UserPreferencesService) {}

  @Get(':userId')
  async getUserBookmarks(@Param('userId') userId: string) {
    // We'll implement this in the service
    return { bookmarks: [] }; // Placeholder
  }

  @Post(':userId/:traceId')
  async addBookmark(
    @Param('userId') userId: string,
    @Param('traceId') traceId: string,
    @Body() bookmark: { title: string; description?: string; tags?: string[]; color?: string }
  ) {
    // We'll implement this in the service
    return { success: true }; // Placeholder
  }
}
