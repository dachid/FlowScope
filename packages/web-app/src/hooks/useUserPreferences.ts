import { useState, useEffect, useCallback } from 'react';
import UserPreferencesService from '../services/UserPreferencesService';
import type { UserPreferences } from '../services/UserPreferencesService';

export function useUserPreferences() {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load preferences on hook initialization
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const prefs = await UserPreferencesService.getUserPreferences();
        setPreferences(prefs);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load preferences');
        console.error('[useUserPreferences] Error loading preferences:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadPreferences();

    // Subscribe to real-time changes from other tabs
    const unsubscribe = UserPreferencesService.subscribeToPreferencesChanges((newPreferences) => {
      console.log('[useUserPreferences] Received preferences update from another tab:', newPreferences);
      setPreferences(newPreferences);
    });

    return unsubscribe;
  }, []);

  // Update preferences
  const updatePreferences = useCallback(async (updates: Partial<UserPreferences>) => {
    try {
      setError(null);
      const updatedPrefs = await UserPreferencesService.updateUserPreferences(updates);
      setPreferences(updatedPrefs);
      console.log('[useUserPreferences] Preferences updated:', updatedPrefs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update preferences');
      console.error('[useUserPreferences] Error updating preferences:', err);
    }
  }, []);

  // Helper functions for common preference updates
  const setTheme = useCallback((theme: 'light' | 'dark' | 'auto') => {
    updatePreferences({ theme });
  }, [updatePreferences]);

  const setRightPanelTab = useCallback((rightPanelTab: 'details' | 'inspector' | 'bookmarks' | 'comments') => {
    updatePreferences({ rightPanelTab });
  }, [updatePreferences]);

  const setRightPanelCollapsed = useCallback((rightPanelCollapsed: boolean) => {
    updatePreferences({ rightPanelCollapsed });
  }, [updatePreferences]);

  const setSidebarCollapsed = useCallback((sidebarCollapsed: boolean) => {
    updatePreferences({ sidebarCollapsed });
  }, [updatePreferences]);

  const setAutoOpenPanelOnNodeClick = useCallback((autoOpenPanelOnNodeClick: boolean) => {
    updatePreferences({ autoOpenPanelOnNodeClick });
  }, [updatePreferences]);

  const setDefaultSessionView = useCallback((defaultSessionView: 'grid' | 'list') => {
    updatePreferences({ defaultSessionView });
  }, [updatePreferences]);

  const setTracePageSize = useCallback((tracePageSize: number) => {
    updatePreferences({ tracePageSize });
  }, [updatePreferences]);

  const toggleNotifications = useCallback(() => {
    if (preferences) {
      updatePreferences({ enableNotifications: !preferences.enableNotifications });
    }
  }, [preferences, updatePreferences]);

  const toggleAutoSave = useCallback(() => {
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

export default useUserPreferences;
