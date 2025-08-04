"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useUserPreferences = useUserPreferences;
const react_1 = require("react");
const UserPreferencesService_1 = __importDefault(require("../services/UserPreferencesService"));
function useUserPreferences() {
    const [preferences, setPreferences] = (0, react_1.useState)(null);
    const [isLoading, setIsLoading] = (0, react_1.useState)(true);
    const [error, setError] = (0, react_1.useState)(null);
    // Load preferences on hook initialization
    (0, react_1.useEffect)(() => {
        const loadPreferences = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const prefs = await UserPreferencesService_1.default.getUserPreferences();
                setPreferences(prefs);
            }
            catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load preferences');
                console.error('[useUserPreferences] Error loading preferences:', err);
            }
            finally {
                setIsLoading(false);
            }
        };
        loadPreferences();
        // Subscribe to real-time changes from other tabs
        const unsubscribe = UserPreferencesService_1.default.subscribeToPreferencesChanges((newPreferences) => {
            console.log('[useUserPreferences] Received preferences update from another tab:', newPreferences);
            setPreferences(newPreferences);
        });
        return unsubscribe;
    }, []);
    // Update preferences
    const updatePreferences = (0, react_1.useCallback)(async (updates) => {
        try {
            setError(null);
            const updatedPrefs = await UserPreferencesService_1.default.updateUserPreferences(updates);
            setPreferences(updatedPrefs);
            console.log('[useUserPreferences] Preferences updated:', updatedPrefs);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update preferences');
            console.error('[useUserPreferences] Error updating preferences:', err);
        }
    }, []);
    // Helper functions for common preference updates
    const setTheme = (0, react_1.useCallback)((theme) => {
        updatePreferences({ theme });
    }, [updatePreferences]);
    const setRightPanelTab = (0, react_1.useCallback)((rightPanelTab) => {
        updatePreferences({ rightPanelTab });
    }, [updatePreferences]);
    const setRightPanelCollapsed = (0, react_1.useCallback)((rightPanelCollapsed) => {
        updatePreferences({ rightPanelCollapsed });
    }, [updatePreferences]);
    const setSidebarCollapsed = (0, react_1.useCallback)((sidebarCollapsed) => {
        updatePreferences({ sidebarCollapsed });
    }, [updatePreferences]);
    const setAutoOpenPanelOnNodeClick = (0, react_1.useCallback)((autoOpenPanelOnNodeClick) => {
        updatePreferences({ autoOpenPanelOnNodeClick });
    }, [updatePreferences]);
    const setDefaultSessionView = (0, react_1.useCallback)((defaultSessionView) => {
        updatePreferences({ defaultSessionView });
    }, [updatePreferences]);
    const setTracePageSize = (0, react_1.useCallback)((tracePageSize) => {
        updatePreferences({ tracePageSize });
    }, [updatePreferences]);
    const toggleNotifications = (0, react_1.useCallback)(() => {
        if (preferences) {
            updatePreferences({ enableNotifications: !preferences.enableNotifications });
        }
    }, [preferences, updatePreferences]);
    const toggleAutoSave = (0, react_1.useCallback)(() => {
        if (preferences) {
            updatePreferences({ autoSave: !preferences.autoSave });
        }
    }, [preferences, updatePreferences]);
    return {
        preferences,
        isLoading,
        error,
        updatePreferences,
        // Helper setters
        setTheme,
        setRightPanelTab,
        setRightPanelCollapsed,
        setSidebarCollapsed,
        setAutoOpenPanelOnNodeClick,
        setDefaultSessionView,
        setTracePageSize,
        toggleNotifications,
        toggleAutoSave,
    };
}
exports.default = useUserPreferences;
