import { Express } from 'express';
import { WebSocket, WebSocketServer } from 'ws';
import { FlowScopeDatabase } from '../database/FlowScopeDatabase';
import { VSCodeDetectionService } from './VSCodeDetectionService';
import { BrowserWindow } from 'electron';

export interface CompanionMessage {
  type: 'jump-to-code' | 'sync-trace' | 'workspace-changed' | 'extension-ready' | 'ping' | 'error';
  payload: any;
  id?: string;
  timestamp: number;
}

export interface JumpToCodePayload {
  filePath: string;
  line?: number;
  column?: number;
  traceId?: string;
}

export interface SyncTracePayload {
  traceId: string;
  action: 'highlight' | 'focus' | 'annotate' | 'clear';
  data?: any;
}

export interface WorkspaceChangedPayload {
  workspacePath: string;
  sessionId?: string;
}

export class CompanionModeAPI {
  private app: Express;
  private database: FlowScopeDatabase;
  private vscodeService: VSCodeDetectionService;
  private mainWindow: BrowserWindow;
  private wsServer: WebSocketServer | null = null;
  private connectedClients: Set<WebSocket> = new Set();
  private extensionReady = false;

  constructor(
    app: Express,
    database: FlowScopeDatabase,
    mainWindow: BrowserWindow
  ) {
    this.app = app;
    this.database = database;
    this.mainWindow = mainWindow;
    this.vscodeService = VSCodeDetectionService.getInstance();
    this.setupRoutes();
  }

  /**
   * Initialize WebSocket server for real-time communication
   */
  initializeWebSocket(port: number): void {
    this.wsServer = new WebSocketServer({ port: port + 1 }); // Use port + 1 for WebSocket

    this.wsServer.on('connection', (ws: WebSocket) => {
      console.log('VS Code extension connected via WebSocket');
      this.connectedClients.add(ws);

      ws.on('message', (data: Buffer) => {
        try {
          const message: CompanionMessage = JSON.parse(data.toString());
          this.handleWebSocketMessage(ws, message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      });

      ws.on('close', () => {
        console.log('VS Code extension disconnected');
        this.connectedClients.delete(ws);
        this.extensionReady = false;
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.connectedClients.delete(ws);
      });

      // Send welcome message
      this.sendToExtension(ws, {
        type: 'ping',
        payload: { message: 'FlowScope Desktop connected' },
        timestamp: Date.now(),
      });
    });

    console.log(`Companion mode WebSocket server started on port ${port + 1}`);
  }

  /**
   * Set up REST API routes for VS Code integration
   */
  private setupRoutes(): void {
    // Extension health check and registration
    this.app.get('/companion/health', (req, res) => {
      res.json({
        status: 'ready',
        version: require('../../../package.json').version,
        extensionReady: this.extensionReady,
        connectedClients: this.connectedClients.size,
      });
    });

    // Register extension connection
    this.app.post('/companion/register', (req, res) => {
      const { extensionVersion, workspacePath } = req.body;
      
      console.log(`VS Code extension registered: v${extensionVersion}`);
      this.extensionReady = true;

      // Notify renderer about extension connection
      this.notifyRenderer('extension:connected', {
        version: extensionVersion,
        workspacePath,
      });

      res.json({ status: 'registered', timestamp: Date.now() });
    });

    // Jump to code endpoint
    this.app.post('/companion/jump-to-code', async (req, res) => {
      const { filePath, line, column, traceId }: JumpToCodePayload = req.body;
      
      try {
        const success = await this.jumpToCode(filePath, line, column, traceId);
        res.json({ success, timestamp: Date.now() });
      } catch (error) {
        console.error('Error jumping to code:', error);
        res.status(500).json({ error: 'Failed to jump to code' });
      }
    });

    // Sync trace data with extension
    this.app.post('/companion/sync-trace', async (req, res) => {
      const { traceId, action, data }: SyncTracePayload = req.body;
      
      try {
        await this.syncTrace(traceId, action, data);
        res.json({ success: true, timestamp: Date.now() });
      } catch (error) {
        console.error('Error syncing trace:', error);
        res.status(500).json({ error: 'Failed to sync trace' });
      }
    });

    // Get current session traces for extension
    this.app.get('/companion/traces/:sessionId', async (req, res) => {
      try {
        const { sessionId } = req.params;
        const traces = this.database.getTraces(sessionId);
        res.json({ traces, timestamp: Date.now() });
      } catch (error) {
        console.error('Error fetching traces:', error);
        res.status(500).json({ error: 'Failed to fetch traces' });
      }
    });

    // Workspace change notification
    this.app.post('/companion/workspace-changed', (req, res) => {
      const { workspacePath, sessionId }: WorkspaceChangedPayload = req.body;
      
      this.handleWorkspaceChange(workspacePath, sessionId);
      res.json({ success: true, timestamp: Date.now() });
    });

    // Extension capabilities
    this.app.get('/companion/capabilities', (req, res) => {
      res.json({
        features: [
          'jump-to-code',
          'trace-sync',
          'workspace-detection',
          'real-time-updates',
          'code-annotations',
        ],
        version: require('../../../package.json').version,
        supportedLanguages: ['javascript', 'typescript', 'python', 'go', 'java'],
      });
    });
  }

  /**
   * Handle WebSocket messages from VS Code extension
   */
  private async handleWebSocketMessage(ws: WebSocket, message: CompanionMessage): Promise<void> {
    console.log('Received WebSocket message:', message.type);

    switch (message.type) {
      case 'extension-ready':
        this.extensionReady = true;
        this.notifyRenderer('extension:ready', message.payload);
        break;

      case 'workspace-changed':
        this.handleWorkspaceChange(message.payload.workspacePath, message.payload.sessionId);
        break;

      case 'ping':
        this.sendToExtension(ws, {
          type: 'ping',
          payload: { message: 'pong' },
          timestamp: Date.now(),
        });
        break;

      case 'error':
        console.error('Extension error:', message.payload);
        this.notifyRenderer('extension:error', message.payload);
        break;

      default:
        console.warn('Unknown message type:', message.type);
    }
  }

  /**
   * Jump to specific code location in VS Code
   */
  async jumpToCode(filePath: string, line?: number, column?: number, traceId?: string): Promise<boolean> {
    try {
      // First try to open via VS Code service
      const success = await this.vscodeService.openFileInVSCode(filePath, line, column);
      
      if (success && traceId) {
        // Send trace context to extension via WebSocket
        this.broadcastToExtensions({
          type: 'jump-to-code',
          payload: { filePath, line, column, traceId },
          timestamp: Date.now(),
        });

        // Update trace with jump action
        await this.database.updateTrace(traceId, {
          metadata: JSON.stringify({ lastJumpedAt: Date.now() }),
        });
      }

      return success;
    } catch (error) {
      console.error('Error jumping to code:', error);
      return false;
    }
  }

  /**
   * Sync trace data with VS Code extension
   */
  async syncTrace(traceId: string, action: string, data?: any): Promise<void> {
    const trace = await this.database.getTrace(traceId);
    if (!trace) {
      throw new Error('Trace not found');
    }

    // Send to extension
    this.broadcastToExtensions({
      type: 'sync-trace',
      payload: { traceId, action, data, trace },
      timestamp: Date.now(),
    });

    // Notify renderer
    this.notifyRenderer('trace:synced', { traceId, action, data });
  }

  /**
   * Handle workspace change events
   */
  private handleWorkspaceChange(workspacePath: string, sessionId?: string): void {
    console.log('Workspace changed:', workspacePath);
    
    // Notify renderer about workspace change
    this.notifyRenderer('workspace:changed', { workspacePath, sessionId });

    // Broadcast to extensions
    this.broadcastToExtensions({
      type: 'workspace-changed',
      payload: { workspacePath, sessionId },
      timestamp: Date.now(),
    });
  }

  /**
   * Send message to specific extension
   */
  private sendToExtension(ws: WebSocket, message: CompanionMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  /**
   * Broadcast message to all connected extensions
   */
  private broadcastToExtensions(message: CompanionMessage): void {
    this.connectedClients.forEach(ws => {
      this.sendToExtension(ws, message);
    });
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
   * Check if extension is connected and ready
   */
  isExtensionReady(): boolean {
    return this.extensionReady && this.connectedClients.size > 0;
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      extensionReady: this.extensionReady,
      connectedClients: this.connectedClients.size,
      wsServerRunning: this.wsServer !== null,
    };
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    if (this.wsServer) {
      this.wsServer.close();
      this.wsServer = null;
    }
    this.connectedClients.clear();
    this.extensionReady = false;
  }
}

export default CompanionModeAPI;
