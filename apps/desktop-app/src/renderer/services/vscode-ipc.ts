import { ipcRenderer } from 'electron';

export interface VSCodeInstallation {
  isInstalled: boolean;
  version?: string;
  executablePath?: string;
  userDataDir?: string;
}

export interface VSCodeExtension {
  isInstalled: boolean;
  version?: string;
  extensionPath?: string;
}

export interface VSCodeIntegrationStatus {
  vscodeInstalled: boolean;
  extensionInstalled: boolean;
  companionRunning: boolean;
  workspaceConnected: boolean;
  lastSync?: Date;
  connectionStatus: 'connected' | 'disconnected' | 'connecting' | 'error';
}

export interface VSCodeConfig {
  autoInstallExtension: boolean;
  enableCompanionMode: boolean;
  syncOnTraceSelect: boolean;
  highlightActiveTrace: boolean;
  autoOpenFiles: boolean;
  maxConcurrentFiles: number;
  webSocketPort: number;
}

export class VSCodeIPC {
  private static instance: VSCodeIPC;

  static getInstance(): VSCodeIPC {
    if (!VSCodeIPC.instance) {
      VSCodeIPC.instance = new VSCodeIPC();
    }
    return VSCodeIPC.instance;
  }

  // VS Code Installation
  async checkVSCodeInstallation(): Promise<VSCodeInstallation> {
    return await ipcRenderer.invoke('vscode:checkInstallation');
  }

  // Extension Management
  async checkExtension(): Promise<VSCodeExtension> {
    return await ipcRenderer.invoke('vscode:checkExtension');
  }

  async installExtension(): Promise<boolean> {
    return await ipcRenderer.invoke('vscode:installExtension');
  }

  // Integration Status
  async getIntegrationStatus(): Promise<VSCodeIntegrationStatus | null> {
    return await ipcRenderer.invoke('vscode:getIntegrationStatus');
  }

  // Configuration
  async updateConfig(config: Partial<VSCodeConfig>): Promise<boolean> {
    return await ipcRenderer.invoke('vscode:updateConfig', config);
  }

  // Code Navigation
  async jumpToCode(
    traceId: string,
    filePath: string,
    line?: number,
    column?: number
  ): Promise<boolean> {
    return await ipcRenderer.invoke('vscode:jumpToCode', traceId, filePath, line, column);
  }

  // Trace Synchronization
  async syncTrace(
    traceId: string,
    action: 'focus' | 'highlight' | 'annotate' | 'clear',
    data?: any
  ): Promise<boolean> {
    return await ipcRenderer.invoke('vscode:syncTrace', traceId, action, data);
  }

  // Integration Actions
  async refresh(): Promise<boolean> {
    return await ipcRenderer.invoke('vscode:refresh');
  }

  async showSettings(): Promise<void> {
    return await ipcRenderer.invoke('vscode:showSettings');
  }

  // Event Listeners
  onIntegrationStatusChanged(callback: (status: VSCodeIntegrationStatus) => void): () => void {
    const handler = (_: any, status: VSCodeIntegrationStatus) => callback(status);
    ipcRenderer.on('vscode:statusChanged', handler);
    return () => ipcRenderer.removeListener('vscode:statusChanged', handler);
  }

  onExtensionInstalled(callback: (success: boolean) => void): () => void {
    const handler = (_: any, success: boolean) => callback(success);
    ipcRenderer.on('vscode:extensionInstalled', handler);
    return () => ipcRenderer.removeListener('vscode:extensionInstalled', handler);
  }

  onJumpToCodeRequested(callback: (data: { traceId: string; filePath: string; line?: number; column?: number }) => void): () => void {
    const handler = (_: any, data: any) => callback(data);
    ipcRenderer.on('vscode:jumpToCodeRequested', handler);
    return () => ipcRenderer.removeListener('vscode:jumpToCodeRequested', handler);
  }
}

export const vscodeIPC = VSCodeIPC.getInstance();
