# Phase 6B: VS Code Extension Implementation Plan

## 📋 Overview

**Goal**: Build a lightweight VS Code extension that seamlessly integrates with the FlowScope Desktop App, providing code-level integration without duplicating rich visualization features.

**Timeline**: Week 13 (1 week)

**Priority**: Secondary channel - depends on Desktop App foundation

**Approach**: Companion mode - extension handles IDE integration, desktop app handles visualization

---

## 🎯 Core Objectives

1. **Seamless Integration**: Zero-friction setup when desktop app is installed
2. **Code-Level Insights**: Inline metrics and annotations without leaving VS Code
3. **Trace Triggering**: Capture and send traces to desktop app
4. **Graceful Degradation**: Basic functionality when desktop app unavailable
5. **Lightweight Design**: Minimal performance impact on VS Code

---

## 🏗️ Technical Architecture

### **Extension Structure**

```
vscode-extension/
├── src/
│   ├── extension.ts              # Entry point and activation
│   ├── providers/                # VS Code UI providers
│   │   ├── traceTreeProvider.ts  # Trace tree view
│   │   ├── traceLensProvider.ts  # CodeLens for performance metrics
│   │   └── traceDecorationProvider.ts # Inline decorations
│   ├── services/                 # Core services
│   │   ├── desktopAppClient.ts   # Communication with desktop app
│   │   ├── traceCapture.ts       # Trace collection
│   │   └── workspaceManager.ts   # Workspace-aware functionality
│   ├── commands/                 # VS Code commands
│   │   ├── traceCommands.ts      # Start/stop tracing, view traces
│   │   └── installCommands.ts    # Desktop app installation
│   └── types/                    # Shared TypeScript types
├── package.json                  # Extension manifest
├── syntaxes/                     # Language support (if needed)
└── icons/                        # Extension icons
```

### **Core Architecture Pattern**

```typescript
// Main extension class - orchestrates all functionality
class FlowScopeExtension {
  private desktopAppClient: DesktopAppClient | null = null;
  private traceCapture: TraceCaptureService;
  private providers: ExtensionProviders;

  async activate(context: vscode.ExtensionContext) {
    // 1. Detect desktop app
    this.desktopAppClient = await this.detectDesktopApp();
    
    // 2. Set up trace capture
    this.traceCapture = new TraceCaptureService(this.desktopAppClient);
    
    // 3. Register UI providers
    this.providers = new ExtensionProviders(context, this.desktopAppClient);
    this.providers.registerAll();
    
    // 4. Register commands
    this.registerCommands(context);
    
    // 5. Set up workspace monitoring
    this.setupWorkspaceMonitoring();
  }

  private async detectDesktopApp(): Promise<DesktopAppClient | null> {
    // Try connecting to desktop app on standard port
    try {
      const client = new DesktopAppClient('http://localhost:31847');
      await client.health();
      return client;
    } catch {
      return null;
    }
  }
}
```

---

## 🔌 Desktop App Integration

### **Communication Protocol**

```typescript
// Client for communicating with desktop app
class DesktopAppClient {
  private baseUrl: string;
  private websocket: WebSocket | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.connectWebSocket();
  }

  // Health check
  async health(): Promise<{ status: string; version: string }> {
    const response = await fetch(`${this.baseUrl}/health`);
    return await response.json();
  }

  // Send trace to desktop app
  async addTrace(trace: TraceData): Promise<void> {
    await fetch(`${this.baseUrl}/traces`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(trace)
    });
  }

  // Set current workspace
  async setWorkspace(workspacePath: string): Promise<void> {
    await fetch(`${this.baseUrl}/workspace`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: workspacePath })
    });
  }

  // Request desktop app to focus on specific trace
  async focusTrace(traceId: string): Promise<void> {
    await fetch(`${this.baseUrl}/focus/${traceId}`, {
      method: 'POST'
    });
  }

  // WebSocket for real-time communication
  private connectWebSocket(): void {
    try {
      this.websocket = new WebSocket(`${this.baseUrl.replace('http', 'ws')}/ws/vscode`);
      
      this.websocket.onmessage = (event) => {
        const message = JSON.parse(event.data);
        this.handleDesktopAppMessage(message);
      };
    } catch (error) {
      console.log('WebSocket connection failed, using HTTP only');
    }
  }

  private handleDesktopAppMessage(message: any): void {
    switch (message.type) {
      case 'jump_to_code':
        this.jumpToCode(message.file, message.line);
        break;
      case 'highlight_code':
        this.highlightCode(message.file, message.range);
        break;
    }
  }
}
```

---

## 🎨 VS Code UI Integration

### **1. Trace Tree View Provider**

```typescript
class TraceTreeProvider implements vscode.TreeDataProvider<TraceTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<TraceTreeItem | undefined> = new vscode.EventEmitter<TraceTreeItem | undefined>();
  readonly onDidChangeTreeData: vscode.Event<TraceTreeItem | undefined> = this._onDidChangeTreeData.event;

  private traces: TraceData[] = [];
  private desktopAppClient: DesktopAppClient | null;

  constructor(desktopAppClient: DesktopAppClient | null) {
    this.desktopAppClient = desktopAppClient;
  }

  getTreeItem(element: TraceTreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: TraceTreeItem): Thenable<TraceTreeItem[]> {
    if (!element) {
      // Root level - show sessions
      return Promise.resolve(this.getSessionItems());
    } else if (element.type === 'session') {
      // Session level - show traces
      return Promise.resolve(this.getTraceItems(element.sessionId));
    } else {
      // Trace level - show details
      return Promise.resolve(this.getTraceDetails(element.traceId));
    }
  }

  private getSessionItems(): TraceTreeItem[] {
    const sessions = this.groupTracesBySession();
    return sessions.map(session => new TraceTreeItem(
      session.name,
      'session',
      vscode.TreeItemCollapsibleState.Expanded,
      {
        sessionId: session.id,
        command: 'flowscope.openSession',
        arguments: [session.id]
      }
    ));
  }

  addTrace(trace: TraceData): void {
    this.traces.push(trace);
    this._onDidChangeTreeData.fire(undefined);
  }
}

class TraceTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly type: 'session' | 'trace' | 'detail',
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly command?: vscode.Command
  ) {
    super(label, collapsibleState);
    
    // Set context value for command visibility
    this.contextValue = type;
    
    // Set icons based on type
    this.iconPath = this.getIconPath(type);
  }

  private getIconPath(type: string): vscode.ThemeIcon {
    switch (type) {
      case 'session': return new vscode.ThemeIcon('folder');
      case 'trace': return new vscode.ThemeIcon('pulse');
      case 'detail': return new vscode.ThemeIcon('info');
      default: return new vscode.ThemeIcon('circle');
    }
  }
}
```

### **2. CodeLens Provider for Performance Metrics**

```typescript
class TraceLensProvider implements vscode.CodeLensProvider {
  private traces: Map<string, TraceData[]> = new Map();

  provideCodeLenses(document: vscode.TextDocument): vscode.CodeLens[] {
    const filePath = document.uri.fsPath;
    const fileTraces = this.traces.get(filePath) || [];
    
    const codeLenses: vscode.CodeLens[] = [];

    // Group traces by line number
    const tracesByLine = this.groupTracesByLine(fileTraces);

    for (const [lineNumber, traces] of tracesByLine) {
      const range = new vscode.Range(lineNumber, 0, lineNumber, 0);
      
      // Calculate aggregate metrics
      const avgDuration = traces.reduce((sum, t) => sum + (t.duration || 0), 0) / traces.length;
      const successRate = traces.filter(t => t.status === 'success').length / traces.length * 100;
      
      const title = `⚡ ${avgDuration.toFixed(0)}ms avg | ✅ ${successRate.toFixed(0)}% success | 📊 ${traces.length} traces`;
      
      codeLenses.push(new vscode.CodeLens(range, {
        title,
        command: 'flowscope.showTraceDetails',
        arguments: [traces]
      }));
    }

    return codeLenses;
  }

  updateTraces(filePath: string, traces: TraceData[]): void {
    this.traces.set(filePath, traces);
    this._onDidChangeCodeLenses.fire();
  }
}
```

### **3. Inline Decorations for Performance Indicators**

```typescript
class TraceDecorationProvider {
  private decorationType: vscode.TextEditorDecorationType;

  constructor() {
    this.decorationType = vscode.window.createTextEditorDecorationType({
      after: {
        margin: '0 0 0 1em',
        textDecoration: 'none'
      },
      rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed
    });
  }

  updateDecorations(editor: vscode.TextEditor, traces: TraceData[]): void {
    const decorations: vscode.DecorationOptions[] = [];

    traces.forEach(trace => {
      if (trace.sourceLocation) {
        const line = trace.sourceLocation.line - 1; // VS Code is 0-indexed
        const range = new vscode.Range(line, 0, line, 0);
        
        const decoration: vscode.DecorationOptions = {
          range,
          renderOptions: {
            after: {
              contentText: this.getPerformanceIndicator(trace),
              color: this.getPerformanceColor(trace)
            }
          },
          hoverMessage: this.getHoverMessage(trace)
        };
        
        decorations.push(decoration);
      }
    });

    editor.setDecorations(this.decorationType, decorations);
  }

  private getPerformanceIndicator(trace: TraceData): string {
    if (trace.status === 'error') return ' ❌ ERROR';
    if (!trace.duration) return ' ⏳ PENDING';
    
    if (trace.duration < 100) return ' 🟢 FAST';
    if (trace.duration < 1000) return ' 🟡 SLOW';
    return ' 🔴 VERY SLOW';
  }

  private getPerformanceColor(trace: TraceData): string {
    if (trace.status === 'error') return '#ff4444';
    if (!trace.duration) return '#888888';
    
    if (trace.duration < 100) return '#44ff44';
    if (trace.duration < 1000) return '#ffaa00';
    return '#ff4444';
  }
}
```

---

## 🔧 Core Features Implementation

### **Day 1-2: Extension Foundation**

#### **Extension Manifest (package.json)**
```json
{
  "name": "flowscope-vscode",
  "displayName": "FlowScope LLM Debugger",
  "description": "Local-first LLM debugging and observability",
  "version": "1.0.0",
  "engines": {
    "vscode": "^1.85.0"
  },
  "categories": ["Debuggers", "Other"],
  "activationEvents": [
    "onLanguage:javascript",
    "onLanguage:typescript",
    "onLanguage:python",
    "workspaceContains:**/package.json",
    "workspaceContains:**/requirements.txt"
  ],
  "main": "./out/extension.js",
  "contributes": {
    "commands": [
      {
        "command": "flowscope.startTracing",
        "title": "Start Tracing",
        "category": "FlowScope",
        "icon": "$(play)"
      },
      {
        "command": "flowscope.stopTracing", 
        "title": "Stop Tracing",
        "category": "FlowScope",
        "icon": "$(stop)"
      },
      {
        "command": "flowscope.openDesktopApp",
        "title": "Open FlowScope Desktop",
        "category": "FlowScope",
        "icon": "$(window)"
      },
      {
        "command": "flowscope.installDesktopApp",
        "title": "Install FlowScope Desktop",
        "category": "FlowScope"
      }
    ],
    "views": {
      "explorer": [
        {
          "id": "flowscope-traces",
          "name": "FlowScope Traces",
          "when": "flowscope:enabled"
        }
      ]
    },
    "configuration": {
      "title": "FlowScope",
      "properties": {
        "flowscope.desktopApp.autoLaunch": {
          "type": "boolean",
          "default": true,
          "description": "Automatically launch desktop app when starting traces"
        },
        "flowscope.desktopApp.port": {
          "type": "number",
          "default": 31847,
          "description": "Port for desktop app communication"
        },
        "flowscope.traces.showInlineMetrics": {
          "type": "boolean", 
          "default": true,
          "description": "Show performance metrics inline in code"
        }
      }
    }
  },
  "scripts": {
    "vscode:prepublish": "npm run compile",
    "compile": "tsc -p ./",
    "watch": "tsc -watch -p ./"
  },
  "devDependencies": {
    "@types/node": "^20.x",
    "@types/vscode": "^1.85.0",
    "typescript": "^5.3.0"
  },
  "dependencies": {
    "ws": "^8.14.0"
  }
}
```

#### **Command Registration**
```typescript
function registerCommands(context: vscode.ExtensionContext, extension: FlowScopeExtension): void {
  // Start/Stop tracing
  context.subscriptions.push(
    vscode.commands.registerCommand('flowscope.startTracing', async () => {
      await extension.startTracing();
      vscode.window.showInformationMessage('FlowScope tracing started');
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('flowscope.stopTracing', async () => {
      await extension.stopTracing();
      vscode.window.showInformationMessage('FlowScope tracing stopped');
    })
  );

  // Desktop app integration
  context.subscriptions.push(
    vscode.commands.registerCommand('flowscope.openDesktopApp', async () => {
      await extension.openDesktopApp();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('flowscope.installDesktopApp', async () => {
      await extension.promptDesktopAppInstall();
    })
  );

  // Trace interaction
  context.subscriptions.push(
    vscode.commands.registerCommand('flowscope.showTraceDetails', (traces: TraceData[]) => {
      extension.showTraceDetails(traces);
    })
  );
}
```

### **Day 3-4: Trace Capture & Processing**

#### **Trace Capture Service**
```typescript
class TraceCaptureService {
  private isCapturing = false;
  private currentSession: string | null = null;
  private desktopAppClient: DesktopAppClient | null;

  constructor(desktopAppClient: DesktopAppClient | null) {
    this.desktopAppClient = desktopAppClient;
  }

  async startCapture(workspacePath: string): Promise<void> {
    this.isCapturing = true;
    this.currentSession = this.generateSessionId();

    // Notify desktop app of new session
    if (this.desktopAppClient) {
      await this.desktopAppClient.setWorkspace(workspacePath);
    }

    // Set up trace interception
    this.setupTraceInterception();
  }

  private setupTraceInterception(): void {
    // Watch for SDK trace files or HTTP requests
    // This depends on how the SDKs send traces
    
    // Option 1: File watching (if SDKs write to files)
    const traceDir = path.join(os.tmpdir(), 'flowscope-traces');
    if (fs.existsSync(traceDir)) {
      const watcher = fs.watch(traceDir, (eventType, filename) => {
        if (eventType === 'rename' && filename?.endsWith('.json')) {
          this.processTraceFile(path.join(traceDir, filename));
        }
      });
    }

    // Option 2: HTTP endpoint interception (if SDKs send via HTTP)
    // Set up local proxy or webhook endpoint
  }

  private async processTraceFile(filePath: string): Promise<void> {
    try {
      const traceData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      await this.processTrace(traceData);
      
      // Clean up processed file
      fs.unlinkSync(filePath);
    } catch (error) {
      console.error('Failed to process trace file:', error);
    }
  }

  private async processTrace(trace: TraceData): Promise<void> {
    // Add session and workspace context
    trace.sessionId = this.currentSession;
    trace.workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

    // Send to desktop app if available
    if (this.desktopAppClient) {
      await this.desktopAppClient.addTrace(trace);
    }

    // Update VS Code UI
    this.updateVSCodeUI(trace);
  }
}
```

### **Day 5: Graceful Degradation & Polish**

#### **Fallback UI for No Desktop App**
```typescript
class FallbackTraceView {
  private panel: vscode.WebviewPanel | undefined;

  show(traces: TraceData[]): void {
    if (!this.panel) {
      this.panel = vscode.window.createWebviewPanel(
        'flowscopeTraces',
        'FlowScope Traces',
        vscode.ViewColumn.Two,
        {
          enableScripts: true,
          retainContextWhenHidden: true
        }
      );
    }

    this.panel.webview.html = this.getWebviewContent(traces);
    this.panel.reveal();
  }

  private getWebviewContent(traces: TraceData[]): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>FlowScope Traces</title>
        <style>
          body { font-family: var(--vscode-font-family); }
          .trace { 
            border: 1px solid var(--vscode-panel-border);
            margin: 8px 0;
            padding: 12px;
            border-radius: 4px;
          }
          .trace-header {
            font-weight: bold;
            margin-bottom: 8px;
          }
          .install-prompt {
            background: var(--vscode-textBlockQuote-background);
            padding: 16px;
            border-radius: 4px;
            margin-bottom: 16px;
          }
        </style>
      </head>
      <body>
        <div class="install-prompt">
          📱 Install FlowScope Desktop for rich visualization and advanced features!
          <br><br>
          <button onclick="installDesktop()">Install Desktop App</button>
        </div>
        
        <h2>Recent Traces (${traces.length})</h2>
        ${traces.map(trace => `
          <div class="trace">
            <div class="trace-header">
              ${trace.operation} - ${trace.duration}ms
            </div>
            <div>Status: ${trace.status}</div>
            <div>Framework: ${trace.framework}</div>
          </div>
        `).join('')}
        
        <script>
          function installDesktop() {
            const vscode = acquireVsCodeApi();
            vscode.postMessage({ command: 'installDesktop' });
          }
        </script>
      </body>
      </html>
    `;
  }
}
```

---

## 📦 Distribution & Installation

### **VS Code Marketplace Preparation**

#### **README.md for Marketplace**
```markdown
# FlowScope - LLM Debugging Made Simple

FlowScope brings powerful LLM observability directly to your VS Code workspace. Debug AI applications with real-time trace visualization, performance metrics, and seamless code integration.

## Features

- **🔍 Real-time Trace Capture**: Automatically capture and visualize LLM operations
- **📊 Inline Performance Metrics**: See performance data directly in your code
- **🖥️ Rich Desktop Visualization**: Seamless integration with FlowScope Desktop App
- **⚡ Zero Configuration**: Works out of the box with LangChain and LlamaIndex
- **🔒 Privacy-First**: All data stays on your machine by default

## Quick Start

1. Install the FlowScope VS Code extension
2. Install FlowScope Desktop App (optional but recommended)
3. Add `require('@flowscope/auto-langchain')` to your project
4. Start debugging your LLM applications!

## Requirements

- VS Code 1.85.0 or higher
- Node.js 16+ or Python 3.8+ for LLM applications
- FlowScope Desktop App (recommended) for full visualization

## Privacy & Security

FlowScope is designed with privacy in mind:
- All traces stored locally by default
- No data sent to cloud unless explicitly enabled
- Open source and transparent
```

### **Extension Packaging**
```bash
# Install VS Code Extension Manager
npm install -g vsce

# Package extension
vsce package

# Publish to marketplace (requires publisher account)
vsce publish
```

---

## 🧪 Testing Strategy

### **Unit Tests**
```typescript
// Test desktop app communication
describe('DesktopAppClient', () => {
  test('should connect to desktop app when available', async () => {
    const client = new DesktopAppClient('http://localhost:31847');
    const health = await client.health();
    expect(health.status).toBe('ready');
  });

  test('should handle connection failure gracefully', async () => {
    const client = new DesktopAppClient('http://localhost:99999');
    await expect(client.health()).rejects.toThrow();
  });
});

// Test trace processing
describe('TraceCaptureService', () => {
  test('should process traces and send to desktop app', async () => {
    const mockClient = jest.fn();
    const service = new TraceCaptureService(mockClient);
    
    await service.processTrace(mockTrace);
    expect(mockClient.addTrace).toHaveBeenCalledWith(mockTrace);
  });
});
```

### **Integration Tests**
- Test full workflow with desktop app running
- Test graceful degradation without desktop app
- Test VS Code command execution
- Test UI provider functionality

---

## 📈 Success Metrics

### **Technical Metrics**
- [ ] Extension activation time < 1 second
- [ ] Trace processing latency < 50ms
- [ ] 95% successful desktop app detection
- [ ] Zero crashes during normal operation

### **User Experience Metrics**
- [ ] 90% users successfully capture first trace
- [ ] 80% users install desktop app within 7 days
- [ ] 4.5+ star rating on VS Code Marketplace
- [ ] 85% user retention after 30 days

### **Business Metrics**
- [ ] 5000+ VS Code Marketplace downloads in first month
- [ ] 40% conversion from extension to desktop app
- [ ] 15% progression to cloud features
- [ ] 50+ positive marketplace reviews

---

This VS Code extension serves as the perfect companion to the FlowScope Desktop App, providing seamless IDE integration while maintaining the local-first, privacy-focused approach that developers trust.
