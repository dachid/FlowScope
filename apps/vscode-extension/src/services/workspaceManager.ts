import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { FlowScopeApiClient } from '../types';

export class WorkspaceManager {
  private currentWorkspace: string | null = null;
  private workspaceWatcher: vscode.FileSystemWatcher | null = null;
  private disposables: vscode.Disposable[] = [];

  constructor(private apiClient: FlowScopeApiClient) {
    this.initializeWorkspace();
    this.setupWorkspaceWatching();
  }

  /**
   * Initialize workspace detection and setup
   */
  private async initializeWorkspace(): Promise<void> {
    // Get current workspace folder
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    
    if (workspaceFolder) {
      this.currentWorkspace = workspaceFolder.uri.fsPath;
      await this.setupWorkspace(this.currentWorkspace);
    }

    // Listen for workspace changes
    this.disposables.push(
      vscode.workspace.onDidChangeWorkspaceFolders(async (event) => {
        if (event.added.length > 0) {
          const newWorkspace = event.added[0].uri.fsPath;
          this.currentWorkspace = newWorkspace;
          await this.setupWorkspace(newWorkspace);
        }
      })
    );
  }

  /**
   * Setup workspace-specific configuration and detection
   */
  private async setupWorkspace(workspacePath: string): Promise<void> {
    try {
      // Notify desktop app of workspace
      if (this.apiClient.isDesktopAppConnected()) {
        await this.apiClient.setWorkspace(workspacePath);
      }

      // Detect project type and setup auto-instrumentation
      const projectInfo = await this.detectProjectType(workspacePath);
      
      if (projectInfo.hasLangChain || projectInfo.hasLlamaIndex || projectInfo.hasPython) {
        await this.setupPythonInstrumentation(workspacePath, projectInfo);
      }
      
      if (projectInfo.hasNodeJS || projectInfo.hasTypeScript) {
        await this.setupNodeInstrumentation(workspacePath, projectInfo);
      }

      // Show workspace info
      this.showWorkspaceInfo(projectInfo);

    } catch (error) {
      console.error('Failed to setup workspace:', error);
    }
  }

  /**
   * Detect project type and dependencies
   */
  private async detectProjectType(workspacePath: string): Promise<{
    hasLangChain: boolean;
    hasLlamaIndex: boolean;
    hasPython: boolean;
    hasNodeJS: boolean;
    hasTypeScript: boolean;
    pythonVersion?: string;
    nodeVersion?: string;
    dependencies: string[];
  }> {
    const info = {
      hasLangChain: false,
      hasLlamaIndex: false,
      hasPython: false,
      hasNodeJS: false,
      hasTypeScript: false,
      dependencies: [] as string[]
    };

    // Check for Python project files
    const pythonFiles = [
      'requirements.txt',
      'pyproject.toml',
      'setup.py',
      'Pipfile',
      'poetry.lock'
    ];

    for (const file of pythonFiles) {
      const filePath = path.join(workspacePath, file);
      if (fs.existsSync(filePath)) {
        info.hasPython = true;
        
        if (file === 'requirements.txt') {
          const content = fs.readFileSync(filePath, 'utf8');
          if (content.includes('langchain')) {
            info.hasLangChain = true;
            info.dependencies.push('langchain');
          }
          if (content.includes('llama-index') || content.includes('llamaindex')) {
            info.hasLlamaIndex = true;
            info.dependencies.push('llama-index');
          }
        }
        break;
      }
    }

    // Check for Node.js project files
    const packageJsonPath = path.join(workspacePath, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      info.hasNodeJS = true;
      
      try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        const allDeps = {
          ...packageJson.dependencies,
          ...packageJson.devDependencies
        };
        
        info.dependencies.push(...Object.keys(allDeps));
        
        if (allDeps['langchain'] || allDeps['@langchain/core']) {
          info.hasLangChain = true;
        }
        
        if (allDeps['typescript'] || allDeps['@types/node']) {
          info.hasTypeScript = true;
        }
      } catch (error) {
        console.error('Failed to parse package.json:', error);
      }
    }

    // Check for TypeScript files
    const tsConfigPath = path.join(workspacePath, 'tsconfig.json');
    if (fs.existsSync(tsConfigPath)) {
      info.hasTypeScript = true;
    }

    return info;
  }

  /**
   * Setup Python auto-instrumentation
   */
  private async setupPythonInstrumentation(workspacePath: string, projectInfo: any): Promise<void> {
    const instrumentationFile = path.join(workspacePath, '.flowscope_instrumentation.py');
    
    const instrumentationCode = `
# FlowScope Auto-Instrumentation
# This file is automatically generated and should not be modified

import os
import sys
from pathlib import Path

# Set FlowScope environment variables
os.environ['FLOWSCOPE_ENABLED'] = 'true'
os.environ['FLOWSCOPE_MODE'] = 'vscode'
os.environ['FLOWSCOPE_WORKSPACE'] = '${workspacePath}'

# Try to import and setup FlowScope SDKs
try:
    # For LangChain projects
    ${projectInfo.hasLangChain ? `
    try:
        from flowscope.langchain import setup_auto_trace
        setup_auto_trace()
        print("FlowScope: LangChain auto-tracing enabled")
    except ImportError:
        print("FlowScope: LangChain SDK not found. Install with: pip install flowscope[langchain]")
    ` : ''}
    
    # For LlamaIndex projects
    ${projectInfo.hasLlamaIndex ? `
    try:
        from flowscope.llamaindex import setup_auto_trace
        setup_auto_trace()
        print("FlowScope: LlamaIndex auto-tracing enabled")
    except ImportError:
        print("FlowScope: LlamaIndex SDK not found. Install with: pip install flowscope[llamaindex]")
    ` : ''}
    
except Exception as e:
    print(f"FlowScope: Failed to setup auto-tracing: {e}")

# Add current directory to Python path if not already there
current_dir = Path(__file__).parent
if str(current_dir) not in sys.path:
    sys.path.insert(0, str(current_dir))
`;

    try {
      fs.writeFileSync(instrumentationFile, instrumentationCode);
      console.log('Python auto-instrumentation file created');
    } catch (error) {
      console.error('Failed to create Python instrumentation file:', error);
    }
  }

  /**
   * Setup Node.js auto-instrumentation
   */
  private async setupNodeInstrumentation(workspacePath: string, projectInfo: any): Promise<void> {
    const instrumentationFile = path.join(workspacePath, '.flowscope_instrumentation.js');
    
    const instrumentationCode = `
// FlowScope Auto-Instrumentation
// This file is automatically generated and should not be modified

// Set FlowScope environment variables
process.env.FLOWSCOPE_ENABLED = 'true';
process.env.FLOWSCOPE_MODE = 'vscode';
process.env.FLOWSCOPE_WORKSPACE = '${workspacePath}';

// Try to import and setup FlowScope SDKs
try {
    ${projectInfo.hasLangChain ? `
    // For LangChain.js projects
    try {
        const { setupAutoTrace } = require('@flowscope/langchain');
        setupAutoTrace();
        console.log('FlowScope: LangChain.js auto-tracing enabled');
    } catch (error) {
        console.log('FlowScope: LangChain.js SDK not found. Install with: npm install @flowscope/langchain');
    }
    ` : ''}
    
} catch (error) {
    console.error('FlowScope: Failed to setup auto-tracing:', error);
}

module.exports = {};
`;

    try {
      fs.writeFileSync(instrumentationFile, instrumentationCode);
      console.log('Node.js auto-instrumentation file created');
    } catch (error) {
      console.error('Failed to create Node.js instrumentation file:', error);
    }
  }

  /**
   * Setup file watching for workspace changes
   */
  private setupWorkspaceWatching(): void {
    // Watch for configuration file changes
    const configFiles = [
      '**/requirements.txt',
      '**/package.json',
      '**/pyproject.toml',
      '**/tsconfig.json'
    ];

    this.workspaceWatcher = vscode.workspace.createFileSystemWatcher(
      `{${configFiles.join(',')}}`
    );

    this.disposables.push(
      this.workspaceWatcher.onDidChange(async (uri) => {
        console.log('Configuration file changed:', uri.fsPath);
        if (this.currentWorkspace) {
          await this.setupWorkspace(this.currentWorkspace);
        }
      })
    );

    this.disposables.push(
      this.workspaceWatcher.onDidCreate(async (uri) => {
        console.log('Configuration file created:', uri.fsPath);
        if (this.currentWorkspace) {
          await this.setupWorkspace(this.currentWorkspace);
        }
      })
    );
  }

  /**
   * Show workspace information to user
   */
  private showWorkspaceInfo(projectInfo: any): void {
    const detectedFrameworks = [];
    
    if (projectInfo.hasLangChain) {
      detectedFrameworks.push('LangChain');
    }
    if (projectInfo.hasLlamaIndex) {
      detectedFrameworks.push('LlamaIndex');
    }
    if (projectInfo.hasPython) {
      detectedFrameworks.push('Python');
    }
    if (projectInfo.hasNodeJS) {
      detectedFrameworks.push('Node.js');
    }
    if (projectInfo.hasTypeScript) {
      detectedFrameworks.push('TypeScript');
    }

    if (detectedFrameworks.length > 0) {
      const message = `FlowScope: Detected ${detectedFrameworks.join(', ')} project. Auto-tracing configured.`;
      vscode.window.showInformationMessage(message, 'View Setup Guide', 'Install SDKs')
        .then(action => {
          if (action === 'View Setup Guide') {
            this.showSetupGuide(projectInfo);
          } else if (action === 'Install SDKs') {
            this.showInstallInstructions(projectInfo);
          }
        });
    }
  }

  /**
   * Show setup guide
   */
  private async showSetupGuide(projectInfo: any): Promise<void> {
    const panel = vscode.window.createWebviewPanel(
      'flowscopeSetup',
      'FlowScope Setup Guide',
      vscode.ViewColumn.Two,
      { enableScripts: true }
    );

    panel.webview.html = this.getSetupGuideHTML(projectInfo);
  }

  /**
   * Show SDK installation instructions
   */
  private async showInstallInstructions(projectInfo: any): Promise<void> {
    const instructions: string[] = [];

    if (projectInfo.hasPython) {
      if (projectInfo.hasLangChain) {
        instructions.push('pip install flowscope[langchain]');
      }
      if (projectInfo.hasLlamaIndex) {
        instructions.push('pip install flowscope[llamaindex]');
      }
      if (!projectInfo.hasLangChain && !projectInfo.hasLlamaIndex) {
        instructions.push('pip install flowscope');
      }
    }

    if (projectInfo.hasNodeJS) {
      if (projectInfo.hasLangChain) {
        instructions.push('npm install @flowscope/langchain');
      } else {
        instructions.push('npm install @flowscope/sdk');
      }
    }

    if (instructions.length > 0) {
      const message = `Run these commands to install FlowScope SDKs:\n\n${instructions.join('\n')}`;
      
      vscode.window.showInformationMessage(
        'FlowScope SDK Installation',
        { modal: true, detail: message },
        'Copy Commands',
        'Open Terminal'
      ).then(action => {
        if (action === 'Copy Commands') {
          vscode.env.clipboard.writeText(instructions.join(' && '));
        } else if (action === 'Open Terminal') {
          const terminal = vscode.window.createTerminal('FlowScope Setup');
          terminal.show();
          terminal.sendText(instructions[0]);
        }
      });
    }
  }

  /**
   * Generate setup guide HTML
   */
  private getSetupGuideHTML(projectInfo: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>FlowScope Setup Guide</title>
        <style>
          body { 
            font-family: var(--vscode-font-family);
            padding: 20px;
            line-height: 1.6;
          }
          .framework { 
            background: var(--vscode-textBlockQuote-background);
            padding: 15px;
            margin: 10px 0;
            border-radius: 5px;
            border-left: 4px solid var(--vscode-textLink-foreground);
          }
          .command {
            background: var(--vscode-textCodeBlock-background);
            padding: 10px;
            margin: 10px 0;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
          }
          .status {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 3px;
            font-size: 0.8em;
            font-weight: bold;
          }
          .detected { background: #4CAF50; color: white; }
          .setup-needed { background: #FF9800; color: white; }
        </style>
      </head>
      <body>
        <h1>🔍 FlowScope Setup Guide</h1>
        
        <p>FlowScope has detected your project configuration and is ready to help you debug LLM applications!</p>
        
        <h2>📋 Project Status</h2>
        
        ${projectInfo.hasPython ? `
        <div class="framework">
          <h3>🐍 Python <span class="status detected">DETECTED</span></h3>
          <p>Python project detected. FlowScope can trace your Python LLM applications.</p>
          
          ${projectInfo.hasLangChain ? `
            <p><strong>LangChain:</strong> <span class="status detected">DETECTED</span></p>
            <div class="command">pip install flowscope[langchain]</div>
          ` : ''}
          
          ${projectInfo.hasLlamaIndex ? `
            <p><strong>LlamaIndex:</strong> <span class="status detected">DETECTED</span></p>
            <div class="command">pip install flowscope[llamaindex]</div>
          ` : ''}
        </div>
        ` : ''}
        
        ${projectInfo.hasNodeJS ? `
        <div class="framework">
          <h3>📦 Node.js <span class="status detected">DETECTED</span></h3>
          <p>Node.js project detected. FlowScope can trace your JavaScript/TypeScript LLM applications.</p>
          
          ${projectInfo.hasLangChain ? `
            <p><strong>LangChain.js:</strong> <span class="status detected">DETECTED</span></p>
            <div class="command">npm install @flowscope/langchain</div>
          ` : `
            <div class="command">npm install @flowscope/sdk</div>
          `}
        </div>
        ` : ''}
        
        <h2>🚀 Quick Start</h2>
        
        <ol>
          <li><strong>Install FlowScope SDK</strong> using the commands above</li>
          <li><strong>Add one line</strong> to import FlowScope in your project</li>
          <li><strong>Start tracing</strong> from the VS Code FlowScope panel</li>
          <li><strong>Run your code</strong> and see traces appear automatically</li>
        </ol>
        
        <h2>🔧 Next Steps</h2>
        
        <ul>
          <li>📱 <strong>Install FlowScope Desktop</strong> for rich visualizations</li>
          <li>🔍 <strong>Start tracing</strong> to see your LLM operations</li>
          <li>📊 <strong>Analyze performance</strong> with inline metrics</li>
          <li>🐛 <strong>Debug issues</strong> with detailed trace data</li>
        </ul>
        
        <p style="text-align: center; margin-top: 30px;">
          <strong>Ready to start debugging? Click "Start Tracing" in the FlowScope panel!</strong>
        </p>
      </body>
      </html>
    `;
  }

  /**
   * Get current workspace path
   */
  getCurrentWorkspace(): string | null {
    return this.currentWorkspace;
  }

  /**
   * Check if workspace has specific framework
   */
  async hasFramework(framework: 'langchain' | 'llamaindex' | 'python' | 'nodejs'): Promise<boolean> {
    if (!this.currentWorkspace) {
      return false;
    }

    const projectInfo = await this.detectProjectType(this.currentWorkspace);
    
    switch (framework) {
      case 'langchain':
        return projectInfo.hasLangChain;
      case 'llamaindex':
        return projectInfo.hasLlamaIndex;
      case 'python':
        return projectInfo.hasPython;
      case 'nodejs':
        return projectInfo.hasNodeJS;
      default:
        return false;
    }
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    this.disposables.forEach(d => d.dispose());
    if (this.workspaceWatcher) {
      this.workspaceWatcher.dispose();
    }
  }
}
