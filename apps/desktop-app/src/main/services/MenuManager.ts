import { Menu, MenuItem, BrowserWindow, app, shell, dialog } from 'electron';
import { AutoUpdater } from './AutoUpdater';
import log from 'electron-log';

export class MenuManager {
  private mainWindow: BrowserWindow;
  private autoUpdater: AutoUpdater;

  constructor(mainWindow: BrowserWindow, autoUpdater: AutoUpdater) {
    this.mainWindow = mainWindow;
    this.autoUpdater = autoUpdater;
  }

  createApplicationMenu(): Menu {
    const isMac = process.platform === 'darwin';

    const template: Electron.MenuItemConstructorOptions[] = [
      // App menu (macOS only)
      ...(isMac ? [this.createAppMenu()] : []),
      
      // File menu
      this.createFileMenu(),
      
      // Edit menu
      this.createEditMenu(),
      
      // View menu
      this.createViewMenu(),
      
      // Session menu
      this.createSessionMenu(),
      
      // Tools menu
      this.createToolsMenu(),
      
      // Window menu
      this.createWindowMenu(),
      
      // Help menu
      this.createHelpMenu()
    ];

    return Menu.buildFromTemplate(template);
  }

  private createAppMenu(): Electron.MenuItemConstructorOptions {
    return {
      label: app.getName(),
      submenu: [
        {
          label: `About ${app.getName()}`,
          click: () => this.showAboutDialog()
        },
        { type: 'separator' },
        {
          label: 'Check for Updates...',
          click: () => this.autoUpdater.checkForUpdates(false)
        },
        { type: 'separator' },
        {
          label: 'Preferences...',
          accelerator: 'CmdOrCtrl+,',
          click: () => this.openSettings()
        },
        { type: 'separator' },
        {
          label: 'Services',
          submenu: []
        },
        { type: 'separator' },
        {
          label: `Hide ${app.getName()}`,
          accelerator: 'Command+H',
          role: 'hide'
        },
        {
          label: 'Hide Others',
          accelerator: 'Command+Shift+H',
          role: 'hideOthers'
        },
        {
          label: 'Show All',
          role: 'unhide'
        },
        { type: 'separator' },
        {
          label: `Quit ${app.getName()}`,
          accelerator: 'Command+Q',
          click: () => app.quit()
        }
      ]
    };
  }

  private createFileMenu(): Electron.MenuItemConstructorOptions {
    return {
      label: 'File',
      submenu: [
        {
          label: 'New Session',
          accelerator: 'CmdOrCtrl+N',
          click: () => this.sendToRenderer('session:new')
        },
        {
          label: 'Open Session...',
          accelerator: 'CmdOrCtrl+O',
          click: () => this.openSessionFile()
        },
        { type: 'separator' },
        {
          label: 'Save Session',
          accelerator: 'CmdOrCtrl+S',
          click: () => this.sendToRenderer('session:save')
        },
        {
          label: 'Save Session As...',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: () => this.saveSessionAs()
        },
        { type: 'separator' },
        {
          label: 'Export Session',
          submenu: [
            {
              label: 'Export as JSON...',
              click: () => this.exportSession('json')
            },
            {
              label: 'Export as CSV...',
              click: () => this.exportSession('csv')
            },
            {
              label: 'Export Report...',
              click: () => this.exportSession('report')
            }
          ]
        },
        {
          label: 'Import Session...',
          click: () => this.importSession()
        },
        { type: 'separator' },
        ...(process.platform !== 'darwin' ? [
          {
            label: 'Settings',
            accelerator: 'CmdOrCtrl+,',
            click: () => this.openSettings()
          },
          { type: 'separator' as const }
        ] : []),
        {
          label: 'Exit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => app.quit()
        }
      ]
    };
  }

  private createEditMenu(): Electron.MenuItemConstructorOptions {
    return {
      label: 'Edit',
      submenu: [
        {
          label: 'Undo',
          accelerator: 'CmdOrCtrl+Z',
          role: 'undo'
        },
        {
          label: 'Redo',
          accelerator: 'Shift+CmdOrCtrl+Z',
          role: 'redo'
        },
        { type: 'separator' },
        {
          label: 'Cut',
          accelerator: 'CmdOrCtrl+X',
          role: 'cut'
        },
        {
          label: 'Copy',
          accelerator: 'CmdOrCtrl+C',
          role: 'copy'
        },
        {
          label: 'Paste',
          accelerator: 'CmdOrCtrl+V',
          role: 'paste'
        },
        {
          label: 'Select All',
          accelerator: 'CmdOrCtrl+A',
          role: 'selectAll'
        },
        { type: 'separator' },
        {
          label: 'Find',
          accelerator: 'CmdOrCtrl+F',
          click: () => this.sendToRenderer('search:focus')
        },
        {
          label: 'Find Next',
          accelerator: 'CmdOrCtrl+G',
          click: () => this.sendToRenderer('search:next')
        },
        {
          label: 'Find Previous',
          accelerator: 'CmdOrCtrl+Shift+G',
          click: () => this.sendToRenderer('search:previous')
        }
      ]
    };
  }

  private createViewMenu(): Electron.MenuItemConstructorOptions {
    return {
      label: 'View',
      submenu: [
        {
          label: 'Reload',
          accelerator: 'CmdOrCtrl+R',
          click: () => this.mainWindow.reload()
        },
        {
          label: 'Force Reload',
          accelerator: 'CmdOrCtrl+Shift+R',
          click: () => this.mainWindow.webContents.reloadIgnoringCache()
        },
        {
          label: 'Toggle Developer Tools',
          accelerator: process.platform === 'darwin' ? 'Alt+Cmd+I' : 'Ctrl+Shift+I',
          click: () => this.mainWindow.webContents.toggleDevTools()
        },
        { type: 'separator' },
        {
          label: 'Actual Size',
          accelerator: 'CmdOrCtrl+0',
          click: () => this.mainWindow.webContents.setZoomLevel(0)
        },
        {
          label: 'Zoom In',
          accelerator: 'CmdOrCtrl+Plus',
          click: () => {
            const currentZoom = this.mainWindow.webContents.getZoomLevel();
            this.mainWindow.webContents.setZoomLevel(currentZoom + 1);
          }
        },
        {
          label: 'Zoom Out',
          accelerator: 'CmdOrCtrl+-',
          click: () => {
            const currentZoom = this.mainWindow.webContents.getZoomLevel();
            this.mainWindow.webContents.setZoomLevel(currentZoom - 1);
          }
        },
        { type: 'separator' },
        {
          label: 'Toggle Fullscreen',
          accelerator: process.platform === 'darwin' ? 'Ctrl+Cmd+F' : 'F11',
          click: () => this.mainWindow.setFullScreen(!this.mainWindow.isFullScreen())
        },
        { type: 'separator' },
        {
          label: 'Show Sidebar',
          accelerator: 'CmdOrCtrl+B',
          type: 'checkbox',
          checked: true,
          click: () => this.sendToRenderer('view:toggle-sidebar')
        },
        {
          label: 'Show Timeline',
          accelerator: 'CmdOrCtrl+T',
          type: 'checkbox',
          checked: true,
          click: () => this.sendToRenderer('view:toggle-timeline')
        },
        {
          label: 'Show Details Panel',
          accelerator: 'CmdOrCtrl+D',
          type: 'checkbox',
          checked: true,
          click: () => this.sendToRenderer('view:toggle-details')
        }
      ]
    };
  }

  private createSessionMenu(): Electron.MenuItemConstructorOptions {
    return {
      label: 'Session',
      submenu: [
        {
          label: 'Start New Session',
          accelerator: 'CmdOrCtrl+Shift+N',
          click: () => this.sendToRenderer('session:start')
        },
        {
          label: 'Stop Current Session',
          accelerator: 'CmdOrCtrl+Shift+E',
          click: () => this.sendToRenderer('session:stop')
        },
        { type: 'separator' },
        {
          label: 'Clear All Traces',
          click: () => this.clearAllTraces()
        },
        {
          label: 'Delete Session...',
          click: () => this.deleteSession()
        },
        { type: 'separator' },
        {
          label: 'Session Settings...',
          click: () => this.sendToRenderer('session:settings')
        }
      ]
    };
  }

  private createToolsMenu(): Electron.MenuItemConstructorOptions {
    return {
      label: 'Tools',
      submenu: [
        {
          label: 'VS Code Integration',
          submenu: [
            {
              label: 'Check VS Code Installation',
              click: () => this.sendToRenderer('vscode:check')
            },
            {
              label: 'Install VS Code Extension',
              click: () => this.sendToRenderer('vscode:install-extension')
            },
            {
              label: 'Open in VS Code',
              accelerator: 'CmdOrCtrl+Shift+V',
              click: () => this.sendToRenderer('vscode:open')
            }
          ]
        },
        { type: 'separator' },
        {
          label: 'Performance Monitor',
          click: () => this.sendToRenderer('tools:performance')
        },
        {
          label: 'Database Statistics',
          click: () => this.sendToRenderer('tools:database-stats')
        },
        {
          label: 'Export Logs...',
          click: () => this.exportLogs()
        },
        { type: 'separator' },
        {
          label: 'Clear Cache',
          click: () => this.clearCache()
        },
        {
          label: 'Reset to Defaults',
          click: () => this.resetToDefaults()
        }
      ]
    };
  }

  private createWindowMenu(): Electron.MenuItemConstructorOptions {
    return {
      label: 'Window',
      submenu: [
        {
          label: 'Minimize',
          accelerator: 'CmdOrCtrl+M',
          role: 'minimize'
        },
        {
          label: 'Close',
          accelerator: 'CmdOrCtrl+W',
          role: 'close'
        },
        ...(process.platform === 'darwin' ? [
          { type: 'separator' as const },
          {
            label: 'Bring All to Front',
            role: 'front' as const
          }
        ] : [])
      ]
    };
  }

  private createHelpMenu(): Electron.MenuItemConstructorOptions {
    return {
      label: 'Help',
      submenu: [
        {
          label: 'FlowScope Documentation',
          click: () => shell.openExternal('https://docs.flowscope.dev')
        },
        {
          label: 'Getting Started Guide',
          click: () => shell.openExternal('https://docs.flowscope.dev/getting-started')
        },
        {
          label: 'Keyboard Shortcuts',
          accelerator: 'CmdOrCtrl+/',
          click: () => this.sendToRenderer('help:shortcuts')
        },
        { type: 'separator' },
        {
          label: 'Report an Issue',
          click: () => shell.openExternal('https://github.com/dachid/FlowScope/issues/new')
        },
        {
          label: 'Feature Requests',
          click: () => shell.openExternal('https://github.com/dachid/FlowScope/discussions')
        },
        { type: 'separator' },
        {
          label: 'Check for Updates',
          click: () => this.autoUpdater.checkForUpdates(false)
        },
        ...(process.platform !== 'darwin' ? [
          { type: 'separator' as const },
          {
            label: `About ${app.getName()}`,
            click: () => this.showAboutDialog()
          }
        ] : [])
      ]
    };
  }

  // Menu action implementations
  private async showAboutDialog(): Promise<void> {
    await dialog.showMessageBox(this.mainWindow, {
      type: 'info',
      title: `About ${app.getName()}`,
      message: `${app.getName()} ${app.getVersion()}`,
      detail: `A powerful desktop application for visualizing and debugging LLM application traces.\n\nBuilt with Electron and React.\n\n© 2025 FlowScope Team`
    });
  }

  private openSettings(): void {
    this.sendToRenderer('app:open-settings');
  }

  private async openSessionFile(): Promise<void> {
    const result = await dialog.showOpenDialog(this.mainWindow, {
      title: 'Open Session File',
      filters: [
        { name: 'FlowScope Sessions', extensions: ['flowscope', 'json'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      properties: ['openFile']
    });

    if (!result.canceled && result.filePaths.length > 0) {
      this.sendToRenderer('session:open', result.filePaths[0]);
    }
  }

  private async saveSessionAs(): Promise<void> {
    const result = await dialog.showSaveDialog(this.mainWindow, {
      title: 'Save Session As',
      filters: [
        { name: 'FlowScope Sessions', extensions: ['flowscope'] },
        { name: 'JSON Files', extensions: ['json'] }
      ],
      defaultPath: `flowscope-session-${new Date().toISOString().split('T')[0]}.flowscope`
    });

    if (!result.canceled && result.filePath) {
      this.sendToRenderer('session:save-as', result.filePath);
    }
  }

  private async exportSession(format: 'json' | 'csv' | 'report'): Promise<void> {
    const extensions = {
      json: ['json'],
      csv: ['csv'],
      report: ['html', 'pdf']
    };

    const result = await dialog.showSaveDialog(this.mainWindow, {
      title: `Export Session as ${format.toUpperCase()}`,
      filters: [
        { name: `${format.toUpperCase()} Files`, extensions: extensions[format] },
        { name: 'All Files', extensions: ['*'] }
      ],
      defaultPath: `flowscope-export-${new Date().toISOString().split('T')[0]}.${extensions[format][0]}`
    });

    if (!result.canceled && result.filePath) {
      this.sendToRenderer('session:export', { format, filePath: result.filePath });
    }
  }

  private async importSession(): Promise<void> {
    const result = await dialog.showOpenDialog(this.mainWindow, {
      title: 'Import Session',
      filters: [
        { name: 'Session Files', extensions: ['flowscope', 'json', 'csv'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      properties: ['openFile']
    });

    if (!result.canceled && result.filePaths.length > 0) {
      this.sendToRenderer('session:import', result.filePaths[0]);
    }
  }

  private async clearAllTraces(): Promise<void> {
    const result = await dialog.showMessageBox(this.mainWindow, {
      type: 'warning',
      buttons: ['Clear All Traces', 'Cancel'],
      defaultId: 1,
      title: 'Clear All Traces',
      message: 'Are you sure you want to clear all traces?',
      detail: 'This action cannot be undone. All trace data in the current session will be permanently deleted.'
    });

    if (result.response === 0) {
      this.sendToRenderer('session:clear-traces');
    }
  }

  private async deleteSession(): Promise<void> {
    const result = await dialog.showMessageBox(this.mainWindow, {
      type: 'warning',
      buttons: ['Delete Session', 'Cancel'],
      defaultId: 1,
      title: 'Delete Session',
      message: 'Are you sure you want to delete this session?',
      detail: 'This action cannot be undone. The session and all its traces will be permanently deleted.'
    });

    if (result.response === 0) {
      this.sendToRenderer('session:delete');
    }
  }

  private async exportLogs(): Promise<void> {
    const result = await dialog.showSaveDialog(this.mainWindow, {
      title: 'Export Application Logs',
      filters: [
        { name: 'Log Files', extensions: ['log', 'txt'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      defaultPath: `flowscope-logs-${new Date().toISOString().split('T')[0]}.log`
    });

    if (!result.canceled && result.filePath) {
      // Export logs logic would go here
      log.info(`Exporting logs to: ${result.filePath}`);
      this.sendToRenderer('tools:export-logs', result.filePath);
    }
  }

  private async clearCache(): Promise<void> {
    const result = await dialog.showMessageBox(this.mainWindow, {
      type: 'question',
      buttons: ['Clear Cache', 'Cancel'],
      defaultId: 0,
      title: 'Clear Cache',
      message: 'Clear application cache?',
      detail: 'This will clear all cached data and may improve performance. The application will restart.'
    });

    if (result.response === 0) {
      await this.mainWindow.webContents.session.clearCache();
      app.relaunch();
      app.exit();
    }
  }

  private async resetToDefaults(): Promise<void> {
    const result = await dialog.showMessageBox(this.mainWindow, {
      type: 'warning',
      buttons: ['Reset to Defaults', 'Cancel'],
      defaultId: 1,
      title: 'Reset to Defaults',
      message: 'Reset all settings to defaults?',
      detail: 'This will reset all application settings, preferences, and window layouts to their default values. Sessions and trace data will not be affected.'
    });

    if (result.response === 0) {
      this.sendToRenderer('app:reset-settings');
    }
  }

  private sendToRenderer(channel: string, data?: any): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('menu-action', { action: channel, data });
    }
  }

  setApplicationMenu(): void {
    const menu = this.createApplicationMenu();
    Menu.setApplicationMenu(menu);
  }

  updateMenuState(updates: { [menuId: string]: boolean }): void {
    const menu = Menu.getApplicationMenu();
    if (!menu) return;

    // Update checkbox states for view menu items
    Object.entries(updates).forEach(([menuId, checked]) => {
      const menuItem = menu.getMenuItemById(menuId);
      if (menuItem && menuItem.type === 'checkbox') {
        menuItem.checked = checked;
      }
    });
  }
}
