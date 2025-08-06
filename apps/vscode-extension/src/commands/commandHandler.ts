import * as vscode from 'vscode';
import { DesktopAppClient } from '../services/desktopAppClient';
import { TraceCaptureService } from '../services/traceCapture';
import { WorkspaceManager } from '../services/workspaceManager';

export class CommandHandler {
  constructor(
    private desktopAppClient: DesktopAppClient,
    private traceCaptureService: TraceCaptureService,
    private workspaceManager: WorkspaceManager
  ) {}

  /**
   * Register all FlowScope commands
   */
  registerCommands(context: vscode.ExtensionContext): void {
    // Core tracing commands
    context.subscriptions.push(
      vscode.commands.registerCommand('flowscope.startTracing', () => this.startTracing())
    );

    context.subscriptions.push(
      vscode.commands.registerCommand('flowscope.stopTracing', () => this.stopTracing())
    );

    context.subscriptions.push(
      vscode.commands.registerCommand('flowscope.viewTraces', () => this.viewTraces())
    );

    context.subscriptions.push(
      vscode.commands.registerCommand('flowscope.clearTraces', () => this.clearTraces())
    );

    // Desktop app commands
    context.subscriptions.push(
      vscode.commands.registerCommand('flowscope.connectDesktopApp', () => this.connectDesktopApp())
    );

    context.subscriptions.push(
      vscode.commands.registerCommand('flowscope.disconnectDesktopApp', () => this.disconnectDesktopApp())
    );

    context.subscriptions.push(
      vscode.commands.registerCommand('flowscope.openDesktopApp', () => this.openDesktopApp())
    );

    context.subscriptions.push(
      vscode.commands.registerCommand('flowscope.installDesktopApp', () => this.installDesktopApp())
    );

    // Workspace commands
    context.subscriptions.push(
      vscode.commands.registerCommand('flowscope.setupWorkspace', () => this.setupWorkspace())
    );

    context.subscriptions.push(
      vscode.commands.registerCommand('flowscope.installSDK', () => this.installSDK())
    );

    // Analysis commands
    context.subscriptions.push(
      vscode.commands.registerCommand('flowscope.analyzePerformance', () => this.analyzePerformance())
    );

    context.subscriptions.push(
      vscode.commands.registerCommand('flowscope.exportTraces', () => this.exportTraces())
    );

    context.subscriptions.push(
      vscode.commands.registerCommand('flowscope.showSettings', () => this.showSettings())
    );

    // Code lens commands
    context.subscriptions.push(
      vscode.commands.registerCommand('flowscope.showTraceDetails', (traceId: string) => 
        this.showTraceDetails(traceId))
    );

    context.subscriptions.push(
      vscode.commands.registerCommand('flowscope.viewLineTraces', (uri: vscode.Uri, line: number) => 
        this.viewLineTraces(uri, line))
    );
  }

  /**
   * Start tracing command
   */
  private async startTracing(): Promise<void> {
    try {
      const isStarted = await this.traceCaptureService.startCapture();
      
      if (isStarted) {
        vscode.window.showInformationMessage(
          '🔍 FlowScope tracing started! Run your code to see traces.',
          'View Panel'
        ).then(action => {
          if (action === 'View Panel') {
            vscode.commands.executeCommand('flowscope.viewTraces');
          }
        });

        // Update status bar
        this.updateStatusBar('tracing');
      } else {
        vscode.window.showErrorMessage('Failed to start tracing. Check FlowScope setup.');
      }
    } catch (error) {
      console.error('Failed to start tracing:', error);
      vscode.window.showErrorMessage(`Failed to start tracing: ${error}`);
    }
  }

  /**
   * Stop tracing command
   */
  private async stopTracing(): Promise<void> {
    try {
      await this.traceCaptureService.stopCapture();
      
      vscode.window.showInformationMessage('FlowScope tracing stopped.');
      this.updateStatusBar('stopped');
    } catch (error) {
      console.error('Failed to stop tracing:', error);
      vscode.window.showErrorMessage(`Failed to stop tracing: ${error}`);
    }
  }

  /**
   * View traces command
   */
  private async viewTraces(): Promise<void> {
    try {
      if (this.desktopAppClient.isConnected) {
        // Open desktop app traces view
        await this.desktopAppClient.openTracesView();
      } else {
        // Show fallback traces panel
        this.showFallbackTracesPanel();
      }
    } catch (error) {
      console.error('Failed to view traces:', error);
      this.showFallbackTracesPanel();
    }
  }

  /**
   * Clear traces command
   */
  private async clearTraces(): Promise<void> {
    const result = await vscode.window.showWarningMessage(
      'Are you sure you want to clear all traces?',
      { modal: true },
      'Clear All',
      'Cancel'
    );

    if (result === 'Clear All') {
      try {
        await this.traceCaptureService.clearTraces();
        vscode.window.showInformationMessage('All traces cleared.');
      } catch (error) {
        console.error('Failed to clear traces:', error);
        vscode.window.showErrorMessage(`Failed to clear traces: ${error}`);
      }
    }
  }

  /**
   * Connect to desktop app command
   */
  private async connectDesktopApp(): Promise<void> {
    try {
      const isConnected = await this.desktopAppClient.connect();
      
      if (isConnected) {
        vscode.window.showInformationMessage(
          '✅ Connected to FlowScope Desktop App!',
          'Open App'
        ).then(action => {
          if (action === 'Open App') {
            this.openDesktopApp();
          }
        });
        this.updateStatusBar('connected');
      } else {
        vscode.window.showErrorMessage(
          'Failed to connect to FlowScope Desktop App. Make sure it\'s running.',
          'Install App',
          'Try Again'
        ).then(action => {
          if (action === 'Install App') {
            this.installDesktopApp();
          } else if (action === 'Try Again') {
            this.connectDesktopApp();
          }
        });
      }
    } catch (error) {
      console.error('Failed to connect to desktop app:', error);
      vscode.window.showErrorMessage(`Connection failed: ${error}`);
    }
  }

  /**
   * Disconnect from desktop app command
   */
  private async disconnectDesktopApp(): Promise<void> {
    try {
      await this.desktopAppClient.disconnect();
      vscode.window.showInformationMessage('Disconnected from FlowScope Desktop App.');
      this.updateStatusBar('disconnected');
    } catch (error) {
      console.error('Failed to disconnect from desktop app:', error);
      vscode.window.showErrorMessage(`Disconnect failed: ${error}`);
    }
  }

  /**
   * Open desktop app command
   */
  private async openDesktopApp(): Promise<void> {
    try {
      if (process.platform === 'win32') {
        vscode.env.openExternal(vscode.Uri.parse('flowscope://'));
      } else if (process.platform === 'darwin') {
        vscode.env.openExternal(vscode.Uri.parse('flowscope://'));
      } else {
        // Linux - try common installation paths
        const { exec } = require('child_process');
        exec('flowscope', (error: any) => {
          if (error) {
            vscode.window.showErrorMessage(
              'FlowScope Desktop App not found. Please install it first.',
              'Install App'
            ).then(action => {
              if (action === 'Install App') {
                this.installDesktopApp();
              }
            });
          }
        });
      }
    } catch (error) {
      console.error('Failed to open desktop app:', error);
      vscode.window.showErrorMessage(
        'Failed to open FlowScope Desktop App.',
        'Install App'
      ).then(action => {
        if (action === 'Install App') {
          this.installDesktopApp();
        }
      });
    }
  }

  /**
   * Install desktop app command
   */
  private async installDesktopApp(): Promise<void> {
    const panel = vscode.window.createWebviewPanel(
      'flowscopeInstall',
      'Install FlowScope Desktop App',
      vscode.ViewColumn.One,
      { enableScripts: true }
    );

    panel.webview.html = this.getInstallDesktopAppHTML();
  }

  /**
   * Setup workspace command
   */
  private async setupWorkspace(): Promise<void> {
    const workspace = this.workspaceManager.getCurrentWorkspace();
    
    if (!workspace) {
      vscode.window.showErrorMessage('No workspace folder open.');
      return;
    }

    const setupOptions = [
      'Install FlowScope SDK',
      'Configure Auto-Tracing',
      'View Setup Guide',
      'Generate Sample Code'
    ];

    const choice = await vscode.window.showQuickPick(setupOptions, {
      placeHolder: 'Choose setup option'
    });

    switch (choice) {
      case 'Install FlowScope SDK':
        await this.installSDK();
        break;
      case 'Configure Auto-Tracing':
        await this.configureAutoTracing();
        break;
      case 'View Setup Guide':
        await this.showSetupGuide();
        break;
      case 'Generate Sample Code':
        await this.generateSampleCode();
        break;
    }
  }

  /**
   * Install SDK command
   */
  private async installSDK(): Promise<void> {
    const hasPython = await this.workspaceManager.hasFramework('python');
    const hasNodeJS = await this.workspaceManager.hasFramework('nodejs');
    const hasLangChain = await this.workspaceManager.hasFramework('langchain');
    const hasLlamaIndex = await this.workspaceManager.hasFramework('llamaindex');

    const installOptions = [];
    
    if (hasPython) {
      if (hasLangChain) {
        installOptions.push({
          label: 'FlowScope for LangChain (Python)',
          detail: 'pip install flowscope[langchain]',
          command: 'pip install flowscope[langchain]'
        });
      }
      if (hasLlamaIndex) {
        installOptions.push({
          label: 'FlowScope for LlamaIndex',
          detail: 'pip install flowscope[llamaindex]',
          command: 'pip install flowscope[llamaindex]'
        });
      }
      if (!hasLangChain && !hasLlamaIndex) {
        installOptions.push({
          label: 'FlowScope Python SDK',
          detail: 'pip install flowscope',
          command: 'pip install flowscope'
        });
      }
    }

    if (hasNodeJS) {
      if (hasLangChain) {
        installOptions.push({
          label: 'FlowScope for LangChain.js',
          detail: 'npm install @flowscope/langchain',
          command: 'npm install @flowscope/langchain'
        });
      } else {
        installOptions.push({
          label: 'FlowScope Node.js SDK',
          detail: 'npm install @flowscope/sdk',
          command: 'npm install @flowscope/sdk'
        });
      }
    }

    if (installOptions.length === 0) {
      vscode.window.showInformationMessage(
        'No supported frameworks detected. FlowScope supports Python and Node.js projects with LangChain or LlamaIndex.'
      );
      return;
    }

    const choice = await vscode.window.showQuickPick(installOptions, {
      placeHolder: 'Choose SDK to install'
    });

    if (choice) {
      const terminal = vscode.window.createTerminal('FlowScope SDK Installation');
      terminal.show();
      terminal.sendText(choice.command);
      
      vscode.window.showInformationMessage(
        `Installing ${choice.label}...`,
        'View Terminal'
      ).then(action => {
        if (action === 'View Terminal') {
          terminal.show();
        }
      });
    }
  }

  /**
   * Analyze performance command
   */
  private async analyzePerformance(): Promise<void> {
    try {
      const traces = await this.traceCaptureService.getTraces();
      
      if (traces.length === 0) {
        vscode.window.showInformationMessage(
          'No traces available. Start tracing to analyze performance.',
          'Start Tracing'
        ).then(action => {
          if (action === 'Start Tracing') {
            this.startTracing();
          }
        });
        return;
      }

      // Show performance analysis panel
      this.showPerformanceAnalysisPanel(traces);
    } catch (error) {
      console.error('Failed to analyze performance:', error);
      vscode.window.showErrorMessage(`Performance analysis failed: ${error}`);
    }
  }

  /**
   * Export traces command
   */
  private async exportTraces(): Promise<void> {
    try {
      const traces = await this.traceCaptureService.getTraces();
      
      if (traces.length === 0) {
        vscode.window.showInformationMessage('No traces to export.');
        return;
      }

      const exportFormats = [
        { label: 'JSON', detail: 'Standard JSON format', ext: 'json' },
        { label: 'CSV', detail: 'Spreadsheet format', ext: 'csv' },
        { label: 'OpenTelemetry', detail: 'OTLP format', ext: 'otlp' }
      ];

      const choice = await vscode.window.showQuickPick(exportFormats, {
        placeHolder: 'Choose export format'
      });

      if (choice) {
        const defaultUri = vscode.Uri.file(`flowscope-traces.${choice.ext}`);
        const fileUri = await vscode.window.showSaveDialog({
          defaultUri,
          filters: {
            [choice.label]: [choice.ext]
          }
        });

        if (fileUri) {
          await this.traceCaptureService.exportTraces(fileUri.fsPath, choice.ext);
          vscode.window.showInformationMessage(
            `Traces exported to ${fileUri.fsPath}`,
            'Open File'
          ).then(action => {
            if (action === 'Open File') {
              vscode.window.showTextDocument(fileUri);
            }
          });
        }
      }
    } catch (error) {
      console.error('Failed to export traces:', error);
      vscode.window.showErrorMessage(`Export failed: ${error}`);
    }
  }

  /**
   * Show settings command
   */
  private async showSettings(): Promise<void> {
    vscode.commands.executeCommand('workbench.action.openSettings', 'flowscope');
  }

  /**
   * Show trace details command
   */
  private async showTraceDetails(traceId: string): Promise<void> {
    try {
      if (this.desktopAppClient.isConnected) {
        await this.desktopAppClient.showTraceDetails(traceId);
      } else {
        this.showFallbackTraceDetails(traceId);
      }
    } catch (error) {
      console.error('Failed to show trace details:', error);
      this.showFallbackTraceDetails(traceId);
    }
  }

  /**
   * View line traces command
   */
  private async viewLineTraces(uri: vscode.Uri, line: number): Promise<void> {
    try {
      const traces = await this.traceCaptureService.getTracesForLine(uri.fsPath, line);
      
      if (traces.length === 0) {
        vscode.window.showInformationMessage(`No traces found for line ${line + 1}.`);
        return;
      }

      if (this.desktopAppClient.isConnected) {
        await this.desktopAppClient.showLineTraces(uri.fsPath, line, traces);
      } else {
        this.showFallbackLineTraces(uri, line, traces);
      }
    } catch (error) {
      console.error('Failed to view line traces:', error);
      vscode.window.showErrorMessage(`Failed to view traces: ${error}`);
    }
  }

  // Helper methods

  private updateStatusBar(status: 'tracing' | 'stopped' | 'connected' | 'disconnected'): void {
    // Implementation for status bar updates
    // This would be implemented with the status bar provider
  }

  private showFallbackTracesPanel(): void {
    const panel = vscode.window.createWebviewPanel(
      'flowscopeTraces',
      'FlowScope Traces',
      vscode.ViewColumn.Two,
      { enableScripts: true }
    );

    // Implement fallback traces view
    panel.webview.html = this.getFallbackTracesHTML();
  }

  private showFallbackTraceDetails(traceId: string): void {
    const panel = vscode.window.createWebviewPanel(
      'flowscopeTraceDetails',
      `FlowScope Trace: ${traceId}`,
      vscode.ViewColumn.Two,
      { enableScripts: true }
    );

    // Implement fallback trace details view
    panel.webview.html = this.getFallbackTraceDetailsHTML(traceId);
  }

  private showFallbackLineTraces(uri: vscode.Uri, line: number, traces: any[]): void {
    const panel = vscode.window.createWebviewPanel(
      'flowscopeLineTraces',
      `FlowScope Line ${line + 1} Traces`,
      vscode.ViewColumn.Two,
      { enableScripts: true }
    );

    // Implement fallback line traces view
    panel.webview.html = this.getFallbackLineTracesHTML(uri, line, traces);
  }

  private showPerformanceAnalysisPanel(traces: any[]): void {
    const panel = vscode.window.createWebviewPanel(
      'flowscopePerformance',
      'FlowScope Performance Analysis',
      vscode.ViewColumn.Two,
      { enableScripts: true }
    );

    // Implement performance analysis view
    panel.webview.html = this.getPerformanceAnalysisHTML(traces);
  }

  private async configureAutoTracing(): Promise<void> {
    // Implementation for auto-tracing configuration
    vscode.window.showInformationMessage('Auto-tracing configuration would be implemented here.');
  }

  private async showSetupGuide(): Promise<void> {
    // Implementation for setup guide
    vscode.window.showInformationMessage('Setup guide would be implemented here.');
  }

  private async generateSampleCode(): Promise<void> {
    // Implementation for sample code generation
    vscode.window.showInformationMessage('Sample code generation would be implemented here.');
  }

  // HTML generators for fallback views
  private getInstallDesktopAppHTML(): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Install FlowScope Desktop App</title>
        <style>
          body { font-family: var(--vscode-font-family); padding: 20px; }
          .download-button { 
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 4px;
            display: inline-block;
            margin: 10px;
          }
        </style>
      </head>
      <body>
        <h1>📱 Install FlowScope Desktop App</h1>
        <p>The FlowScope Desktop App provides rich visualizations and advanced debugging features.</p>
        
        <h2>Download for your platform:</h2>
        <a href="https://flowscope.ai/download/windows" class="download-button">Windows</a>
        <a href="https://flowscope.ai/download/mac" class="download-button">macOS</a>
        <a href="https://flowscope.ai/download/linux" class="download-button">Linux</a>
        
        <h2>What you get:</h2>
        <ul>
          <li>Rich trace visualizations</li>
          <li>Performance analytics</li>
          <li>Interactive debugging</li>
          <li>Export capabilities</li>
        </ul>
      </body>
      </html>
    `;
  }

  private getFallbackTracesHTML(): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>FlowScope Traces</title>
        <style>
          body { font-family: var(--vscode-font-family); padding: 20px; }
          .trace { 
            border: 1px solid var(--vscode-panel-border);
            margin: 10px 0;
            padding: 15px;
            border-radius: 4px;
          }
        </style>
      </head>
      <body>
        <h1>🔍 FlowScope Traces</h1>
        <p>Install the FlowScope Desktop App for rich trace visualizations.</p>
        <div id="traces">Loading traces...</div>
      </body>
      </html>
    `;
  }

  private getFallbackTraceDetailsHTML(traceId: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Trace Details</title>
        <style>
          body { font-family: var(--vscode-font-family); padding: 20px; }
        </style>
      </head>
      <body>
        <h1>📊 Trace Details: ${traceId}</h1>
        <p>Install the FlowScope Desktop App for detailed trace analysis.</p>
      </body>
      </html>
    `;
  }

  private getFallbackLineTracesHTML(uri: vscode.Uri, line: number, traces: any[]): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Line Traces</title>
        <style>
          body { font-family: var(--vscode-font-family); padding: 20px; }
        </style>
      </head>
      <body>
        <h1>📍 Line ${line + 1} Traces</h1>
        <p>Found ${traces.length} traces for this line.</p>
        <p>Install the FlowScope Desktop App for interactive trace exploration.</p>
      </body>
      </html>
    `;
  }

  private getPerformanceAnalysisHTML(traces: any[]): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Performance Analysis</title>
        <style>
          body { font-family: var(--vscode-font-family); padding: 20px; }
        </style>
      </head>
      <body>
        <h1>📈 Performance Analysis</h1>
        <p>Analyzed ${traces.length} traces.</p>
        <p>Install the FlowScope Desktop App for detailed performance insights.</p>
      </body>
      </html>
    `;
  }
}
