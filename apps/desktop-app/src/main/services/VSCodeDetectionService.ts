import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs';
import { app, dialog } from 'electron';

const execAsync = promisify(exec);

export interface VSCodeInfo {
  isInstalled: boolean;
  version?: string;
  executablePath?: string;
  userDataDir?: string;
  extensionsDir?: string;
}

export interface ExtensionInfo {
  id: string;
  version?: string;
  isInstalled: boolean;
}

export class VSCodeDetectionService {
  private static instance: VSCodeDetectionService;
  private vscodeInfo: VSCodeInfo | null = null;
  private extensionInfo: ExtensionInfo | null = null;

  static getInstance(): VSCodeDetectionService {
    if (!VSCodeDetectionService.instance) {
      VSCodeDetectionService.instance = new VSCodeDetectionService();
    }
    return VSCodeDetectionService.instance;
  }

  /**
   * Detect VS Code installation across platforms
   */
  async detectVSCode(): Promise<VSCodeInfo> {
    if (this.vscodeInfo) {
      return this.vscodeInfo;
    }

    const platform = process.platform;
    let vscodeInfo: VSCodeInfo = { isInstalled: false };

    try {
      // Try to get version first
      const { stdout: versionOutput } = await execAsync('code --version');
      const lines = versionOutput.trim().split('\n');
      if (lines.length >= 1) {
        vscodeInfo.version = lines[0];
        vscodeInfo.isInstalled = true;
      }

      // Get executable path based on platform
      if (vscodeInfo.isInstalled) {
        vscodeInfo.executablePath = await this.getExecutablePath(platform);
        vscodeInfo.userDataDir = await this.getUserDataDir(platform);
        vscodeInfo.extensionsDir = await this.getExtensionsDir(platform);
      }
    } catch (error) {
      console.log('VS Code not found in PATH, checking common installation locations...');
      
      // Check common installation paths
      const commonPaths = this.getCommonInstallPaths(platform);
      for (const execPath of commonPaths) {
        if (fs.existsSync(execPath)) {
          try {
            const { stdout } = await execAsync(`"${execPath}" --version`);
            const lines = stdout.trim().split('\n');
            if (lines.length >= 1) {
              vscodeInfo = {
                isInstalled: true,
                version: lines[0],
                executablePath: execPath,
                userDataDir: await this.getUserDataDir(platform),
                extensionsDir: await this.getExtensionsDir(platform),
              };
              break;
            }
          } catch {
            continue;
          }
        }
      }
    }

    this.vscodeInfo = vscodeInfo;
    return vscodeInfo;
  }

  /**
   * Check if FlowScope extension is installed
   */
  async checkExtensionInstalled(): Promise<ExtensionInfo> {
    if (this.extensionInfo) {
      return this.extensionInfo;
    }

    const extensionId = 'flowscope.flowscope-vscode';
    let extensionInfo: ExtensionInfo = {
      id: extensionId,
      isInstalled: false,
    };

    try {
      const { stdout } = await execAsync('code --list-extensions --show-versions');
      const extensions = stdout.split('\n');
      
      for (const ext of extensions) {
        if (ext.startsWith(extensionId)) {
          const parts = ext.split('@');
          extensionInfo = {
            id: extensionId,
            version: parts[1],
            isInstalled: true,
          };
          break;
        }
      }
    } catch (error) {
      console.error('Error checking extensions:', error);
    }

    this.extensionInfo = extensionInfo;
    return extensionInfo;
  }

  /**
   * Install FlowScope VS Code extension
   */
  async installExtension(): Promise<boolean> {
    try {
      console.log('Installing FlowScope VS Code extension...');
      
      // First check if extension exists in marketplace
      const extensionExists = await this.checkExtensionInMarketplace();
      if (!extensionExists) {
        console.warn('FlowScope VS Code extension not yet available in marketplace');
        return await this.handleMissingExtension();
      }
      
      await execAsync('code --install-extension flowscope.flowscope-vscode');
      
      // Clear cache to force re-check
      this.extensionInfo = null;
      
      // Verify installation
      const extensionInfo = await this.checkExtensionInstalled();
      return extensionInfo.isInstalled;
    } catch (error) {
      console.error('Error installing extension:', error);
      return await this.handleInstallationError(error);
    }
  }

  /**
   * Check if extension exists in VS Code marketplace
   */
  private async checkExtensionInMarketplace(): Promise<boolean> {
    try {
      // For now, we know the extension doesn't exist yet
      // In the future, this could check the marketplace API
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Handle missing extension scenario
   */
  private async handleMissingExtension(): Promise<boolean> {
    const result = await dialog.showMessageBox({
      type: 'info',
      buttons: ['Continue Without Extension', 'Learn More', 'Remind Me Later'],
      defaultId: 0,
      title: 'FlowScope VS Code Extension',
      message: 'Extension Not Yet Available',
      detail: 'The FlowScope VS Code extension is currently in development and not yet published to the marketplace. You can still use FlowScope Desktop independently with full functionality.'
    });

    switch (result.response) {
      case 1: // Learn More
        await this.openExtensionDocs();
        return false;
      case 2: // Remind Me Later
        // Could implement a reminder system here
        return false;
      default: // Continue Without Extension
        return false;
    }
  }

  /**
   * Handle installation errors
   */
  private async handleInstallationError(error: any): Promise<boolean> {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    if (errorMessage.includes('not found') || errorMessage.includes('Extension')) {
      return await this.handleMissingExtension();
    }

    const result = await dialog.showMessageBox({
      type: 'error',
      buttons: ['Retry', 'Skip', 'Report Issue'],
      defaultId: 1,
      title: 'Extension Installation Failed',
      message: 'Failed to install VS Code extension',
      detail: `Error: ${errorMessage}\n\nYou can continue using FlowScope Desktop without the VS Code extension.`
    });

    switch (result.response) {
      case 0: // Retry
        return await this.installExtension();
      case 2: // Report Issue
        await this.openIssueReporter(errorMessage);
        return false;
      default: // Skip
        return false;
    }
  }

  /**
   * Open extension documentation
   */
  private async openExtensionDocs(): Promise<void> {
    const { shell } = require('electron');
    await shell.openExternal('https://github.com/flowscope/flowscope-desktop#vs-code-integration');
  }

  /**
   * Open issue reporter
   */
  private async openIssueReporter(errorMessage: string): Promise<void> {
    const { shell } = require('electron');
    const issueUrl = `https://github.com/flowscope/flowscope-desktop/issues/new?title=Extension%20Installation%20Failed&body=Error:%20${encodeURIComponent(errorMessage)}`;
    await shell.openExternal(issueUrl);
  }

  /**
   * Show user prompt for extension installation
   */
  async promptForExtensionInstall(): Promise<'install' | 'skip' | 'never'> {
    const result = await dialog.showMessageBox({
      type: 'question',
      buttons: ['Install Extension', 'Skip for Now', 'Don\'t Ask Again'],
      defaultId: 0,
      title: 'FlowScope VS Code Integration',
      message: 'VS Code detected! Install FlowScope extension for seamless integration?',
      detail: 'The FlowScope extension provides:\n• Code annotations with trace data\n• Inline performance metrics\n• Jump-to-code from desktop app\n• Real-time debugging insights',
      icon: path.join(__dirname, '../../assets/icon.png'),
    });

    switch (result.response) {
      case 0: return 'install';
      case 1: return 'skip';
      case 2: return 'never';
      default: return 'skip';
    }
  }

  /**
   * Open VS Code with specific file and line
   */
  async openFileInVSCode(filePath: string, line?: number, column?: number): Promise<boolean> {
    const vscodeInfo = await this.detectVSCode();
    if (!vscodeInfo.isInstalled) {
      return false;
    }

    try {
      let command = `code "${filePath}"`;
      if (line !== undefined) {
        command += ` --goto "${filePath}:${line}${column ? `:${column}` : ''}"`;
      }
      
      await execAsync(command);
      return true;
    } catch (error) {
      console.error('Error opening file in VS Code:', error);
      return false;
    }
  }

  /**
   * Get workspace folders from VS Code
   */
  async getWorkspaceFolders(): Promise<string[]> {
    try {
      // This would typically require VS Code extension API
      // For now, we'll implement a basic approach
      const { stdout } = await execAsync('code --list-extensions --show-versions');
      // In a real implementation, this would communicate with the extension
      return [];
    } catch {
      return [];
    }
  }

  private getCommonInstallPaths(platform: string): string[] {
    switch (platform) {
      case 'win32':
        return [
          path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Microsoft VS Code', 'Code.exe'),
          path.join(process.env.PROGRAMFILES || '', 'Microsoft VS Code', 'Code.exe'),
          path.join(process.env['PROGRAMFILES(X86)'] || '', 'Microsoft VS Code', 'Code.exe'),
        ];
      case 'darwin':
        return [
          '/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code',
          '/usr/local/bin/code',
        ];
      case 'linux':
        return [
          '/usr/bin/code',
          '/usr/local/bin/code',
          '/snap/code/current/usr/share/code/bin/code',
        ];
      default:
        return [];
    }
  }

  private async getExecutablePath(platform: string): Promise<string> {
    try {
      const { stdout } = await execAsync('which code');
      return stdout.trim();
    } catch {
      const commonPaths = this.getCommonInstallPaths(platform);
      for (const path of commonPaths) {
        if (fs.existsSync(path)) {
          return path;
        }
      }
      return 'code'; // Fallback to PATH
    }
  }

  private async getUserDataDir(platform: string): Promise<string> {
    const homeDir = require('os').homedir();
    switch (platform) {
      case 'win32':
        return path.join(process.env.APPDATA || '', 'Code');
      case 'darwin':
        return path.join(homeDir, 'Library', 'Application Support', 'Code');
      case 'linux':
        return path.join(homeDir, '.config', 'Code');
      default:
        return '';
    }
  }

  private async getExtensionsDir(platform: string): Promise<string> {
    const userDataDir = await this.getUserDataDir(platform);
    return path.join(userDataDir, 'extensions');
  }

  /**
   * Clear cached information to force re-detection
   */
  clearCache(): void {
    this.vscodeInfo = null;
    this.extensionInfo = null;
  }
}

export default VSCodeDetectionService;
