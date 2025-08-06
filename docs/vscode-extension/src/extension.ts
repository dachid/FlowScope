import * as vscode from 'vscode';
import axios from 'axios';
import WebSocket from 'ws';

interface FlowScopeConnection {
  isConnected: boolean;
  desktopVersion?: string;
  port: number;
  ws?: WebSocket;
}

export class FlowScopeExtension {
  private connection: FlowScopeConnection = {
    isConnected: false,
    port: 31847
  };
  
  private statusBarItem: vscode.StatusBarItem;
  private outputChannel: vscode.OutputChannel;

  constructor(private context: vscode.ExtensionContext) {
    this.outputChannel = vscode.window.createOutputChannel('FlowScope');
    this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    this.statusBarItem.command = 'flowscope.connectToDesktop';
    this.updateStatusBar();
    this.statusBarItem.show();
  }

  async activate() {
    // Register commands
    this.context.subscriptions.push(
      vscode.commands.registerCommand('flowscope.connectToDesktop', () => this.connectToDesktop()),
      vscode.commands.registerCommand('flowscope.startTracing', () => this.startTracing()),
      vscode.commands.registerCommand('flowscope.stopTracing', () => this.stopTracing()),
      vscode.commands.registerCommand('flowscope.openDesktop', () => this.openDesktop())
    );

    // Auto-connect if enabled
    const config = vscode.workspace.getConfiguration('flowscope');
    if (config.get('autoConnect', true)) {
      await this.connectToDesktop();
    }

    this.outputChannel.appendLine('FlowScope extension activated');
  }

  async connectToDesktop(): Promise<boolean> {
    try {
      const config = vscode.workspace.getConfiguration('flowscope');
      this.connection.port = config.get('desktopPort', 31847);
      
      // Check if FlowScope Desktop is running
      const response = await axios.get(`http://localhost:${this.connection.port}/health`, {
        timeout: 3000
      });

      if (response.data.status === 'ready') {
        this.connection.isConnected = true;
        this.connection.desktopVersion = response.data.version;
        
        // Set up WebSocket connection for real-time communication
        await this.setupWebSocket();
        
        this.updateStatusBar();
        this.outputChannel.appendLine(`Connected to FlowScope Desktop v${this.connection.desktopVersion}`);
        
        vscode.window.showInformationMessage('Connected to FlowScope Desktop!');
        return true;
      }
    } catch (error) {
      this.connection.isConnected = false;
      this.updateStatusBar();
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.outputChannel.appendLine(`Failed to connect to FlowScope Desktop: ${errorMessage}`);
      
      // Show helpful error message
      const action = await vscode.window.showWarningMessage(
        'Could not connect to FlowScope Desktop. Make sure the desktop app is running.',
        'Download FlowScope',
        'Retry'
      );
      
      if (action === 'Download FlowScope') {
        vscode.env.openExternal(vscode.Uri.parse('https://github.com/flowscope/flowscope-desktop'));
      } else if (action === 'Retry') {
        return this.connectToDesktop();
      }
    }
    
    return false;
  }

  private async setupWebSocket(): Promise<void> {
    try {
      this.connection.ws = new WebSocket(`ws://localhost:${this.connection.port}/ws`);
      
      this.connection.ws.on('open', () => {
        this.outputChannel.appendLine('WebSocket connection established');
        
        // Send handshake
        this.connection.ws?.send(JSON.stringify({
          type: 'extension-ready',
          payload: {
            extensionVersion: this.context.extension.packageJSON.version,
            workspacePath: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath
          },
          timestamp: Date.now()
        }));
      });

      this.connection.ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleDesktopMessage(message);
        } catch (error) {
          this.outputChannel.appendLine(`Error parsing message: ${error}`);
        }
      });

      this.connection.ws.on('close', () => {
        this.outputChannel.appendLine('WebSocket connection closed');
        this.connection.isConnected = false;
        this.updateStatusBar();
      });

      this.connection.ws.on('error', (error) => {
        this.outputChannel.appendLine(`WebSocket error: ${error}`);
      });
    } catch (error) {
      this.outputChannel.appendLine(`Failed to setup WebSocket: ${error}`);
    }
  }

  private handleDesktopMessage(message: any): void {
    switch (message.type) {
      case 'jump-to-code':
        this.handleJumpToCode(message.payload);
        break;
      case 'sync-trace':
        this.handleSyncTrace(message.payload);
        break;
      case 'ping':
        this.connection.ws?.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
        break;
      default:
        this.outputChannel.appendLine(`Unknown message type: ${message.type}`);
    }
  }

  private async handleJumpToCode(payload: any): Promise<void> {
    try {
      const { filePath, line, column } = payload;
      
      // Open the file
      const document = await vscode.workspace.openTextDocument(filePath);
      const editor = await vscode.window.showTextDocument(document);
      
      // Jump to specific line/column if provided
      if (line !== undefined) {
        const position = new vscode.Position(Math.max(0, line - 1), column || 0);
        editor.selection = new vscode.Selection(position, position);
        editor.revealRange(new vscode.Range(position, position), vscode.TextEditorRevealType.InCenter);
      }
      
      this.outputChannel.appendLine(`Jumped to ${filePath}:${line}:${column}`);
    } catch (error) {
      this.outputChannel.appendLine(`Failed to jump to code: ${error}`);
    }
  }

  private handleSyncTrace(payload: any): void {
    // Handle trace synchronization (highlighting, annotations, etc.)
    this.outputChannel.appendLine(`Sync trace: ${JSON.stringify(payload)}`);
  }

  private async startTracing(): Promise<void> {
    if (!this.connection.isConnected) {
      vscode.window.showErrorMessage('Not connected to FlowScope Desktop');
      return;
    }

    try {
      const workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
      const response = await axios.post(`http://localhost:${this.connection.port}/sessions`, {
        name: `VS Code Session - ${new Date().toLocaleString()}`,
        workspace_path: workspacePath
      });

      this.outputChannel.appendLine(`Started tracing session: ${response.data.id}`);
      vscode.window.showInformationMessage('FlowScope tracing session started!');
    } catch (error) {
      this.outputChannel.appendLine(`Failed to start tracing: ${error}`);
      vscode.window.showErrorMessage('Failed to start FlowScope tracing session');
    }
  }

  private async stopTracing(): Promise<void> {
    // Implementation for stopping tracing
    this.outputChannel.appendLine('Tracing stopped');
    vscode.window.showInformationMessage('FlowScope tracing session stopped');
  }

  private async openDesktop(): Promise<void> {
    // Try to bring FlowScope Desktop to foreground
    try {
      await axios.post(`http://localhost:${this.connection.port}/window/focus`);
    } catch (error) {
      // If API call fails, try opening the app
      vscode.env.openExternal(vscode.Uri.parse('flowscope://'));
    }
  }

  private updateStatusBar(): void {
    if (this.connection.isConnected) {
      this.statusBarItem.text = '$(debug-console) FlowScope';
      this.statusBarItem.tooltip = `Connected to FlowScope Desktop v${this.connection.desktopVersion}`;
      this.statusBarItem.backgroundColor = undefined;
    } else {
      this.statusBarItem.text = '$(debug-disconnect) FlowScope';
      this.statusBarItem.tooltip = 'Click to connect to FlowScope Desktop';
      this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
    }
  }

  dispose(): void {
    this.connection.ws?.close();
    this.statusBarItem.dispose();
    this.outputChannel.dispose();
  }
}

// Extension activation
export function activate(context: vscode.ExtensionContext) {
  const extension = new FlowScopeExtension(context);
  extension.activate();
  
  context.subscriptions.push(extension);
}

export function deactivate() {
  // Cleanup when extension is deactivated
}
