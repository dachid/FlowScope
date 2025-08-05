import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

export interface UserPreferences {
  id?: string;
  userId: string;
  theme: 'light' | 'dark' | 'auto';
  rightPanelTab: 'details' | 'inspector' | 'bookmarks' | 'comments';
  rightPanelCollapsed: boolean;
  sidebarCollapsed: boolean;
  autoOpenPanelOnNodeClick: boolean;
  defaultSessionView: 'grid' | 'list';
  tracePageSize: number;
  enableNotifications: boolean;
  autoSave: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

@Injectable()
export class UserPreferencesService {
  constructor(private prisma: PrismaService) {}

  async getUserPreferences(userId: string): Promise<UserPreferences | null> {
    console.log(`[UserPreferencesService] Getting preferences for user: ${userId}`);
    
    try {
      const preferences = await this.prisma.userPreferences.findUnique({
        where: { userId },
      });

      if (!preferences) {
        console.log(`[UserPreferencesService] No preferences found for user ${userId}, creating defaults`);
        return this.createDefaultPreferences(userId);
      }

      return {
        id: preferences.id,
        userId: preferences.userId,
        theme: preferences.theme as 'light' | 'dark' | 'auto',
        rightPanelTab: preferences.rightPanelTab as 'details' | 'inspector' | 'bookmarks' | 'comments',
        rightPanelCollapsed: preferences.rightPanelCollapsed,
        sidebarCollapsed: preferences.sidebarCollapsed,
        autoOpenPanelOnNodeClick: preferences.autoOpenPanelOnNodeClick,
        defaultSessionView: preferences.defaultSessionView as 'grid' | 'list',
        tracePageSize: preferences.tracePageSize,
        enableNotifications: preferences.enableNotifications,
        autoSave: preferences.autoSave,
        createdAt: preferences.createdAt,
        updatedAt: preferences.updatedAt,
      };
    } catch (error) {
      console.error(`[UserPreferencesService] Error getting preferences for user ${userId}:`, error);
      throw error;
    }
  }

  async updateUserPreferences(userId: string, updates: Partial<UserPreferences>): Promise<UserPreferences> {
    console.log(`[UserPreferencesService] Updating preferences for user ${userId}:`, updates);
    
    try {
      // First ensure the user exists, create if not
      await this.ensureUserExists(userId);
      
      const updatedPreferences = await this.prisma.userPreferences.upsert({
        where: { userId },
        update: {
          theme: updates.theme,
          rightPanelTab: updates.rightPanelTab,
          rightPanelCollapsed: updates.rightPanelCollapsed,
          sidebarCollapsed: updates.sidebarCollapsed,
          autoOpenPanelOnNodeClick: updates.autoOpenPanelOnNodeClick,
          defaultSessionView: updates.defaultSessionView,
          tracePageSize: updates.tracePageSize,
          enableNotifications: updates.enableNotifications,
          autoSave: updates.autoSave,
          updatedAt: new Date(),
        },
        create: {
          userId,
          theme: updates.theme || 'auto',
          rightPanelTab: updates.rightPanelTab || 'details',
          rightPanelCollapsed: updates.rightPanelCollapsed ?? false,
          sidebarCollapsed: updates.sidebarCollapsed ?? false,
          autoOpenPanelOnNodeClick: updates.autoOpenPanelOnNodeClick ?? true,
          defaultSessionView: updates.defaultSessionView || 'grid',
          tracePageSize: updates.tracePageSize || 25,
          enableNotifications: updates.enableNotifications ?? true,
          autoSave: updates.autoSave ?? true,
        },
      });

      return {
        id: updatedPreferences.id,
        userId: updatedPreferences.userId,
        theme: updatedPreferences.theme as 'light' | 'dark' | 'auto',
        rightPanelTab: updatedPreferences.rightPanelTab as 'details' | 'inspector' | 'bookmarks' | 'comments',
        rightPanelCollapsed: updatedPreferences.rightPanelCollapsed,
        sidebarCollapsed: updatedPreferences.sidebarCollapsed,
        autoOpenPanelOnNodeClick: updatedPreferences.autoOpenPanelOnNodeClick,
        defaultSessionView: updatedPreferences.defaultSessionView as 'grid' | 'list',
        tracePageSize: updatedPreferences.tracePageSize,
        enableNotifications: updatedPreferences.enableNotifications,
        autoSave: updatedPreferences.autoSave,
        createdAt: updatedPreferences.createdAt,
        updatedAt: updatedPreferences.updatedAt,
      };
    } catch (error) {
      console.error(`[UserPreferencesService] Error updating preferences for user ${userId}:`, error);
      throw error;
    }
  }

  private async createDefaultPreferences(userId: string): Promise<UserPreferences> {
    const defaultPrefs: Partial<UserPreferences> = {
      theme: 'auto',
      rightPanelTab: 'details',
      rightPanelCollapsed: false,
      sidebarCollapsed: false,
      autoOpenPanelOnNodeClick: true,
      defaultSessionView: 'grid',
      tracePageSize: 25,
      enableNotifications: true,
      autoSave: true,
    };

    return this.updateUserPreferences(userId, defaultPrefs);
  }

  private async ensureUserExists(userId: string): Promise<void> {
    try {
      const existingUser = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!existingUser) {
        console.log(`[UserPreferencesService] Creating user ${userId} for preferences`);
        await this.prisma.user.create({
          data: {
            id: userId,
            email: `${userId}@flowscope.demo`,
            username: userId,
            name: `User ${userId}`,
            passwordHash: 'demo-hash', // This would be properly hashed in a real app
            role: 'developer',
          },
        });
      }
    } catch (error) {
      console.error(`[UserPreferencesService] Error ensuring user exists:`, error);
      throw error;
    }
  }
}
