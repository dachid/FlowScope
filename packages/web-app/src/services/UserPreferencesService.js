"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class UserPreferencesService {
    constructor() {
        // In-memory cache for preferences
        this.preferencesCache = null;
    }
    async getUserPreferences(userId = UserPreferencesService.DEFAULT_USER_ID) {
        console.log(`[UserPreferencesService] Getting preferences for user: ${userId}`);
        try {
            // Try to get from API first
            const response = await fetch(`http://localhost:3001/api/user-preferences/${userId}`);
            if (response.ok) {
                const preferences = await response.json();
                console.log('[UserPreferencesService] Loaded preferences from API:', preferences);
                this.preferencesCache = preferences;
                return preferences;
            }
        }
        catch (error) {
            console.log('[UserPreferencesService] API call failed, falling back to localStorage:', error);
        }
        // Fallback to localStorage
        const stored = localStorage.getItem(UserPreferencesService.STORAGE_KEY);
        if (stored) {
            try {
                const preferences = JSON.parse(stored);
                console.log('[UserPreferencesService] Loaded preferences from localStorage:', preferences);
                this.preferencesCache = preferences;
                return preferences;
            }
            catch (error) {
                console.error('[UserPreferencesService] Error parsing stored preferences:', error);
            }
        }
        // Return defaults
        const defaultPreferences = {
            userId,
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
        console.log('[UserPreferencesService] Using default preferences:', defaultPreferences);
        this.preferencesCache = defaultPreferences;
        return defaultPreferences;
    }
    async updateUserPreferences(updates, userId = UserPreferencesService.DEFAULT_USER_ID) {
        console.log(`[UserPreferencesService] Updating preferences for user ${userId}:`, updates);
        // Get current preferences
        const current = await this.getUserPreferences(userId);
        const updated = { ...current, ...updates, userId };
        try {
            // Try to update via API
            const response = await fetch(`http://localhost:3001/api/user-preferences/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updates),
            });
            if (response.ok) {
                const preferences = await response.json();
                console.log('[UserPreferencesService] Updated preferences via API:', preferences);
                this.preferencesCache = preferences;
                // Also update localStorage as backup
                localStorage.setItem(UserPreferencesService.STORAGE_KEY, JSON.stringify(preferences));
                return preferences;
            }
        }
        catch (error) {
            console.log('[UserPreferencesService] API update failed, updating localStorage only:', error);
        }
        // Fallback to localStorage only
        this.preferencesCache = updated;
        localStorage.setItem(UserPreferencesService.STORAGE_KEY, JSON.stringify(updated));
        console.log('[UserPreferencesService] Updated preferences in localStorage:', updated);
        return updated;
    }
    // Get cached preferences without API call
    getCachedPreferences() {
        return this.preferencesCache;
    }
    // Real-time sync method
    subscribeToPreferencesChanges(callback) {
        // Listen for storage changes from other tabs
        const handleStorageChange = (event) => {
            if (event.key === UserPreferencesService.STORAGE_KEY && event.newValue) {
                try {
                    const preferences = JSON.parse(event.newValue);
                    this.preferencesCache = preferences;
                    callback(preferences);
                }
                catch (error) {
                    console.error('[UserPreferencesService] Error parsing storage change:', error);
                }
            }
        };
        window.addEventListener('storage', handleStorageChange);
        // Return unsubscribe function
        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }
}
UserPreferencesService.STORAGE_KEY = 'flowscope_user_preferences';
UserPreferencesService.DEFAULT_USER_ID = 'anonymous-user'; // For anonymous usage
// Export singleton instance
exports.default = new UserPreferencesService();
