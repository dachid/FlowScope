import { VSCodeDetectionService, VSCodeInfo, ExtensionInfo } from './VSCodeDetectionService';
import { CompanionModeAPI } from './CompanionModeAPI';
import { BrowserWindow, app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';

export interface IntegrationStatus {
  vscodeDetected: boolean;
  extensionInstalled: boolean;
  companionConnected: boolean;
  autoInstallEnabled: boolean;
  lastCheckTime: number;
}

export interface IntegrationConfig {
  autoInstallExtension: boolean;
  autoOpenDesktop: boolean;
  checkInterval: number; // minutes
  enableJumpToCode: boolean;
  enableTraceSync: boolean;
}

export class VSCodeIntegrationManager {
  private static instance: VSCodeIntegrationManager;
  private vscodeService: VSCodeDetectionService;
  private companionAPI: CompanionModeAPI | null = null;
  private mainWindow: BrowserWindow;
  private config: IntegrationConfig;
  private status: IntegrationStatus;
  private checkTimer: NodeJS.Timeout | null = null;

  private constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
    this.vscodeService = VSCodeDetectionService.getInstance();
    
    this.config = this.loadConfig();
    this.status = {
      vscodeDetected: false,
      extensionInstalled: false,
      companionConnected: false,
      autoInstallEnabled: this.config.autoInstallExtension,
      lastCheckTime: 0,
    };
  }

  static getInstance(mainWindow?: BrowserWindow): VSCodeIntegrationManager {
    if (!VSCodeIntegrationManager.instance && mainWindow) {
      VSCodeIntegrationManager.instance = new VSCodeIntegrationManager(mainWindow);
    }
    return VSCodeIntegrationManager.instance;
  }

  /**
   * Initialize the integration manager
   */
  async initialize(companionAPI: CompanionModeAPI): Promise<void> {
    this.companionAPI = companionAPI;
    
    console.log('Initializing VS Code integration...');
    
    // Perform initial check
    await this.performIntegrationCheck();
    
    // Start periodic checking if enabled
    if (this.config.checkInterval > 0) {
      this.startPeriodicCheck();
    }

    // Listen for app events
    app.on('browser-window-focus', () => {
      this.performIntegrationCheck();
    });

    console.log('VS Code integration initialized');
  }

  /**
   * Perform comprehensive integration check
   */
  async performIntegrationCheck(): Promise<IntegrationStatus> {
    console.log('Performing VS Code integration check...');
    
    try {
      // Check VS Code installation
      const vscodeInfo = await this.vscodeService.detectVSCode();
      this.status.vscodeDetected = vscodeInfo.isInstalled;

      if (vscodeInfo.isInstalled) {
        // Check extension installation
        const extensionInfo = await this.vscodeService.checkExtensionInstalled();
        this.status.extensionInstalled = extensionInfo.isInstalled;

        // Auto-install extension if enabled and not installed
        if (!extensionInfo.isInstalled && this.config.autoInstallExtension) {
          await this.autoInstallExtension();
        }

        // Check companion connection
        if (this.companionAPI) {
          this.status.companionConnected = this.companionAPI.isExtensionReady();
        }
      }

      this.status.lastCheckTime = Date.now();
      
      // Notify renderer about status update
      this.notifyRenderer('integration:status-updated', this.status);
      
      return this.status;
    } catch (error) {
      console.error('Error during integration check:', error);
      return this.status;
    }
  }

  /**
   * Auto-install VS Code extension with user consent
   */
  async autoInstallExtension(): Promise<boolean> {
    try {
      const userChoice = await this.vscodeService.promptForExtensionInstall();
      
      switch (userChoice) {
        case 'install':
          console.log('User approved extension installation');
          const success = await this.vscodeService.installExtension();
          
          if (success) {
            this.status.extensionInstalled = true;
            this.notifyRenderer('integration:extension-installed', { success: true });
            
            // Show success notification
            this.showNotification('FlowScope VS Code extension installed successfully!', 'success');
            return true;
          } else {
            // Extension installation failed (likely not available in marketplace)
            this.showNotification('VS Code extension not yet available in marketplace. Desktop app works independently!', 'info');
            return false;
          }

        case 'skip':
          console.log('User skipped extension installation');
          return false;

        case 'never':
          console.log('User chose to never ask again');
          this.config.autoInstallExtension = false;
          this.saveConfig();
          return false;

        default:
          return false;
      }
    } catch (error) {
      console.error('Error during auto-installation:', error);
      this.showNotification('Error installing extension: ' + error, 'error');
      return false;
    }
  }

  /**
   * Manual installation trigger
   */
  async installExtension(): Promise<boolean> {
    const success = await this.vscodeService.installExtension();
    
    if (success) {
      this.status.extensionInstalled = true;
      this.notifyRenderer('integration:extension-installed', { success: true });
      this.showNotification('FlowScope VS Code extension installed successfully!', 'success');
    } else {
      this.showNotification('Failed to install FlowScope extension. Please check VS Code installation.', 'error');
    }
    
    return success;
  }

  /**
   * Jump to code from trace
   */
  async jumpToCode(traceId: string, filePath: string, line?: number, column?: number): Promise<boolean> {
    if (!this.config.enableJumpToCode) {
      console.log('Jump to code is disabled');
      return false;
    }

    if (!this.status.vscodeDetected) {
      this.showNotification('VS Code not detected. Please install VS Code first.', 'warning');
      return false;
    }

    try {
      let success = false;

      // Try companion API first if available
      if (this.companionAPI && this.status.companionConnected) {
        success = await this.companionAPI.jumpToCode(filePath, line, column, traceId);
      }

      // Fallback to direct VS Code opening
      if (!success) {
        success = await this.vscodeService.openFileInVSCode(filePath, line, column);
      }

      if (success) {
        this.notifyRenderer('integration:jumped-to-code', { traceId, filePath, line, column });
        console.log(`Jumped to code: ${filePath}:${line || 1}`);
      } else {
        this.showNotification('Failed to open file in VS Code', 'error');
      }

      return success;
    } catch (error) {
      console.error('Error jumping to code:', error);
      this.showNotification('Error opening file: ' + error, 'error');
      return false;
    }
  }

  /**
   * Sync trace data with VS Code extension
   */
  async syncTrace(traceId: string, action: 'highlight' | 'focus' | 'annotate' | 'clear', data?: any): Promise<boolean> {
    if (!this.config.enableTraceSync) {
      return false;
    }

    if (!this.companionAPI || !this.status.companionConnected) {
      console.log('Companion API not connected, cannot sync trace');
      return false;
    }

    try {
      await this.companionAPI.syncTrace(traceId, action, data);
      console.log(`Synced trace ${traceId} with action: ${action}`);
      return true;
    } catch (error) {
      console.error('Error syncing trace:', error);
      return false;
    }
  }

  /**
   * Update integration configuration
   */
  updateConfig(updates: Partial<IntegrationConfig>): void {
    this.config = { ...this.config, ...updates };
    this.saveConfig();
    
    // Restart periodic check if interval changed
    if (updates.checkInterval !== undefined) {
      this.stopPeriodicCheck();
      if (this.config.checkInterval > 0) {
        this.startPeriodicCheck();
      }
    }

    this.notifyRenderer('integration:config-updated', this.config);
  }

  /**
   * Get current integration status
   */
  getStatus(): IntegrationStatus {
    return { ...this.status };
  }

  /**
   * Get current configuration
   */
  getConfig(): IntegrationConfig {
    return { ...this.config };
  }

  /**
   * Force refresh of all integration data
   */
  async refresh(): Promise<void> {
    this.vscodeService.clearCache();
    await this.performIntegrationCheck();
  }

  /**
   * Start periodic integration checking
   */
  private startPeriodicCheck(): void {
    if (this.checkTimer) {
      clearInterval(this.checkTimer);
    }

    this.checkTimer = setInterval(() => {
      this.performIntegrationCheck();
    }, this.config.checkInterval * 60 * 1000); // Convert minutes to milliseconds
  }

  /**
   * Stop periodic checking
   */
  private stopPeriodicCheck(): void {
    if (this.checkTimer) {
      clearInterval(this.checkTimer);
      this.checkTimer = null;
    }
  }

  /**
   * Load configuration from storage
   */
  private loadConfig(): IntegrationConfig {
    const defaultConfig: IntegrationConfig = {
      autoInstallExtension: true,
      autoOpenDesktop: true,
      checkInterval: 5, // minutes
      enableJumpToCode: true,
      enableTraceSync: true,
    };

    try {
      const configPath = path.join(app.getPath('userData'), 'integration-config.json');
      if (fs.existsSync(configPath)) {
        const configData = fs.readFileSync(configPath, 'utf8');
        return { ...defaultConfig, ...JSON.parse(configData) };
      }
    } catch (error) {
      console.error('Error loading integration config:', error);
    }

    return defaultConfig;
  }

  /**
   * Save configuration to storage
   */
  private saveConfig(): void {
    try {
      const configPath = path.join(app.getPath('userData'), 'integration-config.json');
      fs.writeFileSync(configPath, JSON.stringify(this.config, null, 2));
    } catch (error) {
      console.error('Error saving integration config:', error);
    }
  }

  /**
   * Show notification to user
   */
  private showNotification(message: string, type: 'info' | 'success' | 'warning' | 'error'): void {
    this.notifyRenderer('integration:notification', { message, type, timestamp: Date.now() });
  }

  /**
   * Notify renderer process
   */
  private notifyRenderer(event: string, data: any): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send(event, data);
    }
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.stopPeriodicCheck();
    if (this.companionAPI) {
      this.companionAPI.cleanup();
    }
  }
}

export default VSCodeIntegrationManager;
