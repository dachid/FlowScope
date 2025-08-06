import { app, BrowserWindow, Menu, ipcMain } from 'electron';
import { join } from 'path';
import { FlowScopeDatabase } from './database/FlowScopeDatabase';
import { FlowScopeAPIServer } from './api/FlowScopeAPIServer';
import { VSCodeExtensionInstaller } from './installer/VSCodeExtensionInstaller';
import { VSCodeDetectionService } from './services/VSCodeDetectionService';
import { CompanionModeAPI } from './services/CompanionModeAPI';
import { VSCodeIntegrationManager } from './services/VSCodeIntegrationManager';
import { AutoUpdater } from './services/AutoUpdater';
import { MenuManager } from './services/MenuManager';
import log from 'electron-log';

class FlowScopeDesktopApp {
  private mainWindow: BrowserWindow | null = null;
  private database: FlowScopeDatabase | null = null;
  private apiServer: FlowScopeAPIServer | null = null;
  private vscodeInstaller: VSCodeExtensionInstaller | null = null;
  private vscodeService: VSCodeDetectionService | null = null;
  private companionAPI: CompanionModeAPI | null = null;
  private integrationManager: VSCodeIntegrationManager | null = null;
  private autoUpdater: AutoUpdater | null = null;
  private menuManager: MenuManager | null = null;

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    // Configure logging
    log.transports.file.level = 'info';
    log.transports.console.level = 'debug';
    
    // Initialize app event handlers
    this.setupAppEvents();
    
    // Wait for app to be ready
    await app.whenReady();
    
    // Create main window first
    await this.createMainWindow();
    
    // Initialize core services
    await this.initializeServices();
    
    // Setup VS Code integration
    await this.setupVSCodeIntegration();
  }

  private setupAppEvents(): void {
    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        this.cleanup();
        app.quit();
      }
    });

    app.on('activate', async () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        await this.createMainWindow();
      }
    });

    app.on('before-quit', () => {
      this.cleanup();
    });
  }

  private async initializeServices(): Promise<void> {
    try {
      // Initialize database
      this.database = new FlowScopeDatabase();
      log.info('Database initialized successfully');

      // Initialize API server
      this.apiServer = new FlowScopeAPIServer(this.database);
      const port = await this.apiServer.start();
      log.info(`API server started on port ${port}`);

      // Initialize VS Code services
      this.vscodeService = VSCodeDetectionService.getInstance();
      this.vscodeInstaller = new VSCodeExtensionInstaller();
      
      // Initialize companion API with the main window reference
      if (this.mainWindow) {
        this.companionAPI = new CompanionModeAPI(
          this.apiServer.getApp(),
          this.database,
          this.mainWindow
        );
        await this.companionAPI.initializeWebSocket(port);
        log.info('Companion mode API initialized');
      }

    } catch (error) {
      log.error('Failed to initialize services:', error);
      throw error;
    }
  }

  private async createMainWindow(): Promise<void> {
    // Create the browser window
    this.mainWindow = new BrowserWindow({
      width: 1400,
      height: 900,
      minWidth: 1000,
      minHeight: 600,
      show: false,
      title: 'FlowScope Desktop',
      icon: join(__dirname, '../../assets/icon.png'),
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: join(__dirname, 'preload.js'),
      },
    });

    // Load the app
    const rendererPath = join(__dirname, '../renderer/index.html');
    const fs = require('fs');
    
    if (app.isPackaged || fs.existsSync(rendererPath)) {
      // Production or built files available: load the built renderer
      await this.mainWindow.loadFile(rendererPath);
    } else {
      // Development: load from Vite dev server
      await this.mainWindow.loadURL('http://localhost:3000');
    }

    // Show window when ready
    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow?.show();
      
      if (!app.isPackaged) {
        this.mainWindow?.webContents.openDevTools();
      }
    });

    // Handle window closed
    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });

    // Setup application menu
    this.setupApplicationMenu();

    // Setup IPC handlers
    this.setupIpcHandlers();

    log.info('Main window created successfully');
  }

  private setupApplicationMenu(): void {
    const template: Electron.MenuItemConstructorOptions[] = [
      {
        label: 'File',
        submenu: [
          {
            label: 'New Session',
            accelerator: 'CmdOrCtrl+N',
            click: () => {
              this.mainWindow?.webContents.send('menu:new-session');
            },
          },
          {
            label: 'Open Session',
            accelerator: 'CmdOrCtrl+O',
            click: () => {
              this.mainWindow?.webContents.send('menu:open-session');
            },
          },
          { type: 'separator' },
          {
            label: 'Export Session',
            accelerator: 'CmdOrCtrl+E',
            click: () => {
              this.mainWindow?.webContents.send('menu:export-session');
            },
          },
          { type: 'separator' },
          {
            label: 'Quit',
            accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
            click: () => {
              app.quit();
            },
          },
        ],
      },
      {
        label: 'View',
        submenu: [
          { role: 'reload' },
          { role: 'forceReload' },
          { role: 'toggleDevTools' },
          { type: 'separator' },
          { role: 'resetZoom' },
          { role: 'zoomIn' },
          { role: 'zoomOut' },
          { type: 'separator' },
          { role: 'togglefullscreen' },
        ],
      },
      {
        label: 'Tools',
        submenu: [
          {
            label: 'VS Code Integration',
            click: async () => {
              await this.setupVSCodeIntegration();
            },
          },
          {
            label: 'Clear All Data',
            click: () => {
              this.mainWindow?.webContents.send('menu:clear-data');
            },
          },
        ],
      },
      {
        label: 'Help',
        submenu: [
          {
            label: 'About FlowScope',
            click: () => {
              this.mainWindow?.webContents.send('menu:about');
            },
          },
        ],
      },
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  }

  private setupIpcHandlers(): void {
    // Database operations - Sessions
    ipcMain.handle('db:getAllSessions', async () => {
      return this.database?.getSessions() || [];
    });

    ipcMain.handle('db:getSession', async (_, id: string) => {
      return this.database?.getSession(id);
    });

    ipcMain.handle('db:createSession', async (_, session) => {
      return this.database?.createSession(session);
    });

    ipcMain.handle('db:deleteSession', async (_, id: string) => {
      return this.database?.deleteSession(id);
    });

    // Database operations - Traces
    ipcMain.handle('db:getTracesBySession', async (_, sessionId: string) => {
      return this.database?.getTraces(sessionId) || [];
    });

    ipcMain.handle('db:getTrace', async (_, id: string) => {
      return this.database?.getTrace(id);
    });

    ipcMain.handle('db:createTrace', async (_, trace) => {
      return this.database?.insertTrace(trace);
    });

    ipcMain.handle('db:deleteTrace', async (_, id: string) => {
      // Note: deleteTrace method doesn't exist in database, would need to add it
      return false;
    });

    // Database operations - Prompts (not implemented in database yet)
    ipcMain.handle('db:getPromptsByTrace', async (_, traceId: string) => {
      // Prompts table not implemented yet
      return [];
    });

    ipcMain.handle('db:getPrompt', async (_, id: string) => {
      // Prompts table not implemented yet
      return null;
    });

    ipcMain.handle('db:createPrompt', async (_, prompt) => {
      // Prompts table not implemented yet
      return null;
    });

    ipcMain.handle('db:deletePrompt', async (_, id: string) => {
      // Prompts table not implemented yet
      return false;
    });

    // Database operations - Bookmarks
    ipcMain.handle('db:getAllBookmarks', async () => {
      return this.database?.getBookmarks() || [];
    });

    ipcMain.handle('db:getBookmark', async (_, id: string) => {
      // Note: getBookmark method doesn't exist, only getBookmarks
      const bookmarks = this.database?.getBookmarks() || [];
      return bookmarks.find(b => b.id === id) || null;
    });

    ipcMain.handle('db:createBookmark', async (_, bookmark) => {
      return this.database?.createBookmark(bookmark);
    });

    ipcMain.handle('db:deleteBookmark', async (_, id: string) => {
      return this.database?.deleteBookmark(id);
    });

    // VS Code integration
    ipcMain.handle('vscode:checkInstallation', async () => {
      return this.vscodeService?.detectVSCode() || { isInstalled: false };
    });

    ipcMain.handle('vscode:checkExtension', async () => {
      return this.vscodeService?.checkExtensionInstalled() || { isInstalled: false };
    });

    ipcMain.handle('vscode:installExtension', async () => {
      return this.integrationManager?.installExtension() || false;
    });

    ipcMain.handle('vscode:getIntegrationStatus', async () => {
      return this.integrationManager?.getStatus() || null;
    });

    ipcMain.handle('vscode:updateConfig', async (_, config) => {
      this.integrationManager?.updateConfig(config);
      return true;
    });

    ipcMain.handle('vscode:jumpToCode', async (_, traceId: string, filePath: string, line?: number, column?: number) => {
      return this.integrationManager?.jumpToCode(traceId, filePath, line, column) || false;
    });

    ipcMain.handle('vscode:syncTrace', async (_, traceId: string, action: 'focus' | 'highlight' | 'annotate' | 'clear', data?: any) => {
      return this.integrationManager?.syncTrace(traceId, action, data) || false;
    });

    ipcMain.handle('vscode:refresh', async () => {
      await this.integrationManager?.refresh();
      return true;
    });

    ipcMain.handle('vscode:showSettings', async () => {
      // This would open VS Code settings or FlowScope settings
      return Promise.resolve();
    });

    // Auto-updater handlers
    ipcMain.handle('updater:checkForUpdates', async () => {
      if (this.autoUpdater) {
        await this.autoUpdater.checkForUpdates(false);
      }
    });

    ipcMain.handle('updater:downloadUpdate', async () => {
      if (this.autoUpdater) {
        await this.autoUpdater.downloadUpdate();
      }
    });

    ipcMain.handle('updater:installUpdate', async () => {
      if (this.autoUpdater) {
        await this.autoUpdater.installUpdate();
      }
    });

    ipcMain.handle('updater:getStatus', async () => {
      return this.autoUpdater?.getStatus() || null;
    });

    // App controls
    ipcMain.handle('app:getVersion', () => {
      return app.getVersion();
    });

    ipcMain.handle('app:quit', () => {
      app.quit();
    });

    ipcMain.handle('app:minimize', () => {
      this.mainWindow?.minimize();
    });

    ipcMain.handle('app:maximize', () => {
      if (this.mainWindow?.isMaximized()) {
        this.mainWindow.unmaximize();
      } else {
        this.mainWindow?.maximize();
      }
    });

    ipcMain.handle('app:close', () => {
      this.mainWindow?.close();
    });

    ipcMain.handle('app:getApiPort', () => {
      return this.apiServer?.getPort();
    });
  }

  private async setupVSCodeIntegration(): Promise<void> {
    if (!this.mainWindow || !this.companionAPI) {
      log.warn('Cannot setup VS Code integration: missing dependencies');
      return;
    }

    try {
      // Initialize integration manager
      this.integrationManager = VSCodeIntegrationManager.getInstance(this.mainWindow);
      await this.integrationManager.initialize(this.companionAPI);
      
      // Initialize auto-updater
      this.autoUpdater = new AutoUpdater(this.mainWindow);
      this.autoUpdater.startPeriodicCheck();
      
      // Initialize menu manager
      this.menuManager = new MenuManager(this.mainWindow, this.autoUpdater);
      this.menuManager.setApplicationMenu();
      
      log.info('VS Code integration setup completed');
    } catch (error) {
      log.error('Error setting up VS Code integration:', error);
    }
  }

  private cleanup(): void {
    if (this.apiServer) {
      this.apiServer.stop();
    }
    if (this.database) {
      this.database.close();
    }
  }
}

// Create and start the application
new FlowScopeDesktopApp();

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  log.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  log.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
