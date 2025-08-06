import { exec } from 'child_process';
import { promisify } from 'util';
import { dialog } from 'electron';
import log from 'electron-log';

const execAsync = promisify(exec);

export class VSCodeExtensionInstaller {
  private readonly EXTENSION_ID = 'flowscope.flowscope-vscode';
  private readonly EXTENSION_MARKETPLACE_ID = 'flowscope.flowscope-vscode';

  async detectVSCode(): Promise<boolean> {
    try {
      await execAsync('code --version');
      log.info('VS Code detected successfully');
      return true;
    } catch (error) {
      log.info('VS Code not detected in PATH');
      return false;
    }
  }

  async isExtensionInstalled(): Promise<boolean> {
    try {
      const { stdout } = await execAsync('code --list-extensions');
      const isInstalled = stdout.includes(this.EXTENSION_ID);
      log.info(`FlowScope extension installed: ${isInstalled}`);
      return isInstalled;
    } catch (error) {
      log.error('Error checking extension installation:', error);
      return false;
    }
  }

  async installExtension(): Promise<boolean> {
    try {
      log.info('Installing FlowScope VS Code extension...');
      await execAsync(`code --install-extension ${this.EXTENSION_MARKETPLACE_ID}`);
      log.info('FlowScope VS Code extension installed successfully');
      return true;
    } catch (error) {
      log.error('Failed to install FlowScope VS Code extension:', error);
      return false;
    }
  }

  async uninstallExtension(): Promise<boolean> {
    try {
      log.info('Uninstalling FlowScope VS Code extension...');
      await execAsync(`code --uninstall-extension ${this.EXTENSION_ID}`);
      log.info('FlowScope VS Code extension uninstalled successfully');
      return true;
    } catch (error) {
      log.error('Failed to uninstall FlowScope VS Code extension:', error);
      return false;
    }
  }

  async promptUserForInstallation(): Promise<boolean> {
    try {
      const result = await dialog.showMessageBox({
        type: 'question',
        buttons: ['Install Extension', 'Skip', 'Don\'t Ask Again'],
        defaultId: 0,
        title: 'FlowScope VS Code Integration',
        message: 'VS Code detected! Install FlowScope extension for seamless integration?',
        detail: 'The FlowScope VS Code extension provides:\n\n' +
                '• Code annotations and inline metrics\n' +
                '• Seamless debugging workflow\n' +
                '• Jump to code from traces\n' +
                '• Real-time trace visualization\n\n' +
                'You can always install it later from the Tools menu.',
        icon: undefined, // You can add an icon path here
      });

      switch (result.response) {
        case 0: // Install Extension
          log.info('User chose to install VS Code extension');
          return true;
        case 1: // Skip
          log.info('User chose to skip VS Code extension installation');
          return false;
        case 2: // Don't Ask Again
          log.info('User chose to never be asked about VS Code extension installation');
          await this.setDontAskAgain();
          return false;
        default:
          return false;
      }
    } catch (error) {
      log.error('Error showing installation prompt:', error);
      return false;
    }
  }

  async shouldPromptUser(): Promise<boolean> {
    // Check if user has chosen "Don't Ask Again"
    const dontAsk = await this.getDontAskAgain();
    return !dontAsk;
  }

  async openVSCode(filePath?: string): Promise<boolean> {
    try {
      const command = filePath ? `code "${filePath}"` : 'code';
      await execAsync(command);
      log.info(`Opened VS Code${filePath ? ` with file: ${filePath}` : ''}`);
      return true;
    } catch (error) {
      log.error('Failed to open VS Code:', error);
      return false;
    }
  }

  async openVSCodeToLine(filePath: string, line: number, column = 1): Promise<boolean> {
    try {
      const command = `code --goto "${filePath}:${line}:${column}"`;
      await execAsync(command);
      log.info(`Opened VS Code to ${filePath}:${line}:${column}`);
      return true;
    } catch (error) {
      log.error('Failed to open VS Code to specific line:', error);
      return false;
    }
  }

  async getExtensionInfo(): Promise<{
    installed: boolean;
    version?: string;
    enabled?: boolean;
  }> {
    try {
      const { stdout } = await execAsync(`code --list-extensions --show-versions`);
      const lines = stdout.split('\n');
      const extensionLine = lines.find(line => line.startsWith(this.EXTENSION_ID));
      
      if (extensionLine) {
        const version = extensionLine.split('@')[1];
        return {
          installed: true,
          version: version?.trim(),
          enabled: true, // VS Code doesn't provide easy way to check if extension is disabled
        };
      }

      return { installed: false };
    } catch (error) {
      log.error('Error getting extension info:', error);
      return { installed: false };
    }
  }

  async checkVSCodeVersion(): Promise<string | null> {
    try {
      const { stdout } = await execAsync('code --version');
      const version = stdout.split('\n')[0];
      log.info(`VS Code version: ${version}`);
      return version;
    } catch (error) {
      log.error('Error checking VS Code version:', error);
      return null;
    }
  }

  private async setDontAskAgain(): Promise<void> {
    try {
      // Store preference in app settings
      // This would typically use electron-store or similar
      // For now, we'll use a simple file-based approach
      const { app } = await import('electron');
      const fs = await import('fs').then(m => m.promises);
      const path = await import('path');
      
      const settingsPath = path.join(app.getPath('userData'), 'settings.json');
      let settings = {};
      
      try {
        const settingsContent = await fs.readFile(settingsPath, 'utf8');
        settings = JSON.parse(settingsContent);
      } catch {
        // Settings file doesn't exist, use empty object
      }
      
      (settings as any).dontAskVSCodeExtension = true;
      await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2));
      
      log.info('Set "don\'t ask again" preference for VS Code extension');
    } catch (error) {
      log.error('Error setting "don\'t ask again" preference:', error);
    }
  }

  private async getDontAskAgain(): Promise<boolean> {
    try {
      const { app } = await import('electron');
      const fs = await import('fs').then(m => m.promises);
      const path = await import('path');
      
      const settingsPath = path.join(app.getPath('userData'), 'settings.json');
      
      try {
        const settingsContent = await fs.readFile(settingsPath, 'utf8');
        const settings = JSON.parse(settingsContent);
        return settings.dontAskVSCodeExtension || false;
      } catch {
        return false;
      }
    } catch (error) {
      log.error('Error getting "don\'t ask again" preference:', error);
      return false;
    }
  }
}
