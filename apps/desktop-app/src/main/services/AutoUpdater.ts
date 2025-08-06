import { autoUpdater } from 'electron-updater';
import { app, dialog, BrowserWindow } from 'electron';
import log from 'electron-log';

export interface UpdateInfo {
  version: string;
  releaseDate: string;
  releaseNotes?: string;
  downloadSize?: number;
}

export interface UpdateProgress {
  bytesPerSecond: number;
  percent: number;
  transferred: number;
  total: number;
}

export class AutoUpdater {
  private mainWindow: BrowserWindow | null = null;
  private updateCheckInterval: NodeJS.Timeout | null = null;
  private isUpdateAvailable = false;
  private isDownloading = false;

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
    this.setupAutoUpdater();
  }

  private setupAutoUpdater(): void {
    // Configure auto-updater
    autoUpdater.logger = log;
    autoUpdater.autoDownload = false; // We'll handle download manually
    autoUpdater.autoInstallOnAppQuit = true;

    // Set update feed URL for GitHub releases
    if (app.isPackaged) {
      autoUpdater.setFeedURL({
        provider: 'github',
        owner: 'dachid',
        repo: 'FlowScope',
        private: false
      });
    }

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    // Update available
    autoUpdater.on('update-available', async (info) => {
      log.info('Update available:', info);
      this.isUpdateAvailable = true;
      
      this.notifyRenderer('update:available', {
        version: info.version,
        releaseDate: info.releaseDate,
        releaseNotes: info.releaseNotes,
        downloadSize: info.files?.[0]?.size
      });

      await this.promptUserForUpdate(info);
    });

    // No update available
    autoUpdater.on('update-not-available', (info) => {
      log.info('Update not available:', info);
      this.notifyRenderer('update:not-available', info);
    });

    // Error occurred
    autoUpdater.on('error', (error) => {
      log.error('Auto-updater error:', error);
      this.notifyRenderer('update:error', error.message);
    });

    // Download progress
    autoUpdater.on('download-progress', (progress) => {
      log.info(`Download progress: ${progress.percent}%`);
      this.notifyRenderer('update:download-progress', progress);
    });

    // Update downloaded
    autoUpdater.on('update-downloaded', async (info) => {
      log.info('Update downloaded:', info);
      this.isDownloading = false;
      
      this.notifyRenderer('update:downloaded', info);
      await this.promptUserForInstallation(info);
    });
  }

  async checkForUpdates(silent = true): Promise<void> {
    if (!app.isPackaged) {
      log.info('Skipping update check in development mode');
      return;
    }

    try {
      log.info('Checking for updates...');
      if (!silent) {
        this.notifyRenderer('update:checking');
      }
      
      await autoUpdater.checkForUpdates();
    } catch (error) {
      log.error('Error checking for updates:', error);
      if (!silent) {
        this.notifyRenderer('update:error', error instanceof Error ? error.message : 'Unknown error');
      }
    }
  }

  async downloadUpdate(): Promise<void> {
    if (!this.isUpdateAvailable || this.isDownloading) {
      return;
    }

    try {
      log.info('Starting update download...');
      this.isDownloading = true;
      this.notifyRenderer('update:download-started');
      
      await autoUpdater.downloadUpdate();
    } catch (error) {
      log.error('Error downloading update:', error);
      this.isDownloading = false;
      this.notifyRenderer('update:error', error instanceof Error ? error.message : 'Download failed');
    }
  }

  async installUpdate(): Promise<void> {
    try {
      log.info('Installing update and restarting...');
      autoUpdater.quitAndInstall();
    } catch (error) {
      log.error('Error installing update:', error);
      this.notifyRenderer('update:error', error instanceof Error ? error.message : 'Installation failed');
    }
  }

  private async promptUserForUpdate(info: any): Promise<void> {
    if (!this.mainWindow) return;

    const result = await dialog.showMessageBox(this.mainWindow, {
      type: 'info',
      buttons: ['Download Now', 'Download Later', 'Skip This Version'],
      defaultId: 0,
      title: 'FlowScope Update Available',
      message: `Version ${info.version} is available`,
      detail: `Current version: ${app.getVersion()}\nNew version: ${info.version}\n\nWould you like to download the update now?`
    });

    switch (result.response) {
      case 0: // Download Now
        await this.downloadUpdate();
        break;
      case 1: // Download Later
        this.scheduleUpdateReminder();
        break;
      case 2: // Skip This Version
        log.info(`User chose to skip version ${info.version}`);
        break;
    }
  }

  private async promptUserForInstallation(info: any): Promise<void> {
    if (!this.mainWindow) return;

    const result = await dialog.showMessageBox(this.mainWindow, {
      type: 'info',
      buttons: ['Restart Now', 'Restart Later'],
      defaultId: 0,
      title: 'Update Ready to Install',
      message: `FlowScope ${info.version} has been downloaded and is ready to install`,
      detail: 'The application will restart to complete the installation. Any unsaved work will be preserved.'
    });

    if (result.response === 0) {
      await this.installUpdate();
    } else {
      log.info('User chose to restart later');
      this.notifyRenderer('update:install-later');
    }
  }

  private scheduleUpdateReminder(): void {
    // Remind user about update in 24 hours
    if (this.updateCheckInterval) {
      clearTimeout(this.updateCheckInterval);
    }

    this.updateCheckInterval = setTimeout(() => {
      this.checkForUpdates(false);
    }, 24 * 60 * 60 * 1000); // 24 hours
  }

  startPeriodicCheck(): void {
    // Check for updates every 6 hours
    if (this.updateCheckInterval) {
      clearInterval(this.updateCheckInterval);
    }

    this.updateCheckInterval = setInterval(() => {
      this.checkForUpdates(true);
    }, 6 * 60 * 60 * 1000); // 6 hours

    // Initial check
    setTimeout(() => {
      this.checkForUpdates(true);
    }, 10000); // Check 10 seconds after startup
  }

  stopPeriodicCheck(): void {
    if (this.updateCheckInterval) {
      clearInterval(this.updateCheckInterval);
      this.updateCheckInterval = null;
    }
  }

  private notifyRenderer(event: string, data?: any): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('auto-updater', { event, data });
    }
  }

  getStatus(): {
    isUpdateAvailable: boolean;
    isDownloading: boolean;
    currentVersion: string;
  } {
    return {
      isUpdateAvailable: this.isUpdateAvailable,
      isDownloading: this.isDownloading,
      currentVersion: app.getVersion()
    };
  }
}
