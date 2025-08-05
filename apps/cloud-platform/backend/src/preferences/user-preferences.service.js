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
exports.UserPreferencesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../database/prisma.service");
let UserPreferencesService = class UserPreferencesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getUserPreferences(userId) {
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
                theme: preferences.theme,
                rightPanelTab: preferences.rightPanelTab,
                rightPanelCollapsed: preferences.rightPanelCollapsed,
                sidebarCollapsed: preferences.sidebarCollapsed,
                autoOpenPanelOnNodeClick: preferences.autoOpenPanelOnNodeClick,
                defaultSessionView: preferences.defaultSessionView,
                tracePageSize: preferences.tracePageSize,
                enableNotifications: preferences.enableNotifications,
                autoSave: preferences.autoSave,
                createdAt: preferences.createdAt,
                updatedAt: preferences.updatedAt,
            };
        }
        catch (error) {
            console.error(`[UserPreferencesService] Error getting preferences for user ${userId}:`, error);
            throw error;
        }
    }
    async updateUserPreferences(userId, updates) {
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
                theme: updatedPreferences.theme,
                rightPanelTab: updatedPreferences.rightPanelTab,
                rightPanelCollapsed: updatedPreferences.rightPanelCollapsed,
                sidebarCollapsed: updatedPreferences.sidebarCollapsed,
                autoOpenPanelOnNodeClick: updatedPreferences.autoOpenPanelOnNodeClick,
                defaultSessionView: updatedPreferences.defaultSessionView,
                tracePageSize: updatedPreferences.tracePageSize,
                enableNotifications: updatedPreferences.enableNotifications,
                autoSave: updatedPreferences.autoSave,
                createdAt: updatedPreferences.createdAt,
                updatedAt: updatedPreferences.updatedAt,
            };
        }
        catch (error) {
            console.error(`[UserPreferencesService] Error updating preferences for user ${userId}:`, error);
            throw error;
        }
    }
    async createDefaultPreferences(userId) {
        const defaultPrefs = {
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
    async ensureUserExists(userId) {
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
        }
        catch (error) {
            console.error(`[UserPreferencesService] Error ensuring user exists:`, error);
            throw error;
        }
    }
};
exports.UserPreferencesService = UserPreferencesService;
exports.UserPreferencesService = UserPreferencesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UserPreferencesService);
