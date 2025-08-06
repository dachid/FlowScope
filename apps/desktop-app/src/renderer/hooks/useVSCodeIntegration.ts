import { useState, useEffect, useCallback } from 'react';
import { vscodeIPC, VSCodeIntegrationStatus, VSCodeConfig } from '../services/vscode-ipc';

export interface UseVSCodeIntegrationReturn {
  // Status
  status: VSCodeIntegrationStatus | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  checkInstallation: () => Promise<void>;
  installExtension: () => Promise<boolean>;
  refresh: () => Promise<void>;
  updateConfig: (config: Partial<VSCodeConfig>) => Promise<void>;
  jumpToCode: (traceId: string, filePath: string, line?: number, column?: number) => Promise<boolean>;
  syncTrace: (traceId: string, action: 'focus' | 'highlight' | 'annotate' | 'clear', data?: any) => Promise<boolean>;
  
  // Computed
  isFullyIntegrated: boolean;
  canJumpToCode: boolean;
  needsSetup: boolean;
}

export function useVSCodeIntegration(): UseVSCodeIntegrationReturn {
  const [status, setStatus] = useState<VSCodeIntegrationStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load initial status
  const loadStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const currentStatus = await vscodeIPC.getIntegrationStatus();
      setStatus(currentStatus);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load VS Code integration status');
      console.error('Error loading VS Code status:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check VS Code installation
  const checkInstallation = useCallback(async () => {
    try {
      setError(null);
      const installation = await vscodeIPC.checkVSCodeInstallation();
      const extension = await vscodeIPC.checkExtension();
      
      // Update status based on checks
      setStatus(prev => ({
        ...prev,
        vscodeInstalled: installation.isInstalled,
        extensionInstalled: extension.isInstalled,
        connectionStatus: installation.isInstalled && extension.isInstalled ? 'connected' : 'disconnected'
      } as VSCodeIntegrationStatus));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check VS Code installation');
      console.error('Error checking VS Code installation:', err);
    }
  }, []);

  // Install VS Code extension
  const installExtension = useCallback(async (): Promise<boolean> => {
    try {
      setError(null);
      const success = await vscodeIPC.installExtension();
      if (success) {
        await loadStatus(); // Refresh status after installation
      }
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to install VS Code extension');
      console.error('Error installing extension:', err);
      return false;
    }
  }, [loadStatus]);

  // Refresh integration status
  const refresh = useCallback(async () => {
    try {
      setError(null);
      await vscodeIPC.refresh();
      await loadStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh VS Code integration');
      console.error('Error refreshing integration:', err);
    }
  }, [loadStatus]);

  // Update configuration
  const updateConfig = useCallback(async (config: Partial<VSCodeConfig>) => {
    try {
      setError(null);
      await vscodeIPC.updateConfig(config);
      await loadStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update VS Code configuration');
      console.error('Error updating config:', err);
    }
  }, [loadStatus]);

  // Jump to code in VS Code
  const jumpToCode = useCallback(async (
    traceId: string,
    filePath: string,
    line?: number,
    column?: number
  ): Promise<boolean> => {
    try {
      setError(null);
      return await vscodeIPC.jumpToCode(traceId, filePath, line, column);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to jump to code in VS Code');
      console.error('Error jumping to code:', err);
      return false;
    }
  }, []);

  // Sync trace with VS Code
  const syncTrace = useCallback(async (
    traceId: string,
    action: 'focus' | 'highlight' | 'annotate' | 'clear',
    data?: any
  ): Promise<boolean> => {
    try {
      setError(null);
      return await vscodeIPC.syncTrace(traceId, action, data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sync trace with VS Code');
      console.error('Error syncing trace:', err);
      return false;
    }
  }, []);

  // Set up event listeners
  useEffect(() => {
    const unsubscribeStatus = vscodeIPC.onIntegrationStatusChanged((newStatus) => {
      setStatus(newStatus);
    });

    const unsubscribeInstall = vscodeIPC.onExtensionInstalled((success) => {
      if (success) {
        loadStatus();
      }
    });

    return () => {
      unsubscribeStatus();
      unsubscribeInstall();
    };
  }, [loadStatus]);

  // Load initial status on mount
  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  // Computed values
  const isFullyIntegrated = Boolean(
    status?.vscodeInstalled && 
    status?.extensionInstalled && 
    status?.companionRunning &&
    status?.connectionStatus === 'connected'
  );

  const canJumpToCode = Boolean(
    status?.vscodeInstalled && 
    status?.extensionInstalled &&
    status?.connectionStatus === 'connected'
  );

  const needsSetup = Boolean(
    !status?.vscodeInstalled || 
    !status?.extensionInstalled ||
    status?.connectionStatus === 'disconnected'
  );

  return {
    // Status
    status,
    isLoading,
    error,
    
    // Actions
    checkInstallation,
    installExtension,
    refresh,
    updateConfig,
    jumpToCode,
    syncTrace,
    
    // Computed
    isFullyIntegrated,
    canJumpToCode,
    needsSetup
  };
}
