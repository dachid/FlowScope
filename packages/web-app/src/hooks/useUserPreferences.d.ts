import type { UserPreferences } from '../services/UserPreferencesService';
export declare function useUserPreferences(): {
    preferences: UserPreferences | null;
    isLoading: boolean;
    error: string | null;
    updatePreferences: (updates: Partial<UserPreferences>) => Promise<void>;
    setTheme: (theme: "light" | "dark" | "auto") => void;
    setRightPanelTab: (rightPanelTab: "details" | "inspector" | "bookmarks" | "comments") => void;
    setRightPanelCollapsed: (rightPanelCollapsed: boolean) => void;
    setSidebarCollapsed: (sidebarCollapsed: boolean) => void;
    setAutoOpenPanelOnNodeClick: (autoOpenPanelOnNodeClick: boolean) => void;
    setDefaultSessionView: (defaultSessionView: "grid" | "list") => void;
    setTracePageSize: (tracePageSize: number) => void;
    toggleNotifications: () => void;
    toggleAutoSave: () => void;
};
export default useUserPreferences;
