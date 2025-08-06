import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import { Server } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { FlowScopeDatabase, Trace, Session } from '../database/FlowScopeDatabase';
import log from 'electron-log';

export class FlowScopeAPIServer {
  private app: Express;
  private server: Server | null = null;
  private wss: WebSocketServer | null = null;
  private port: number = 31847;
  private clients: Set<WebSocket> = new Set();

  constructor(private database: FlowScopeDatabase) {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    this.app.use(cors());
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));
    
    // Request logging
    this.app.use((req, res, next) => {
      log.debug(`${req.method} ${req.path}`);
      next();
    });
  }

  private setupRoutes(): void {
    // Health check endpoint
    this.app.get('/health', (req: Request, res: Response) => {
      res.json({
        status: 'ready',
        version: process.env.npm_package_version || '1.0.0',
        mode: 'desktop',
        timestamp: new Date().toISOString(),
      });
    });

    // Session endpoints
    this.app.get('/api/sessions', async (req: Request, res: Response) => {
      try {
        const limit = parseInt(req.query.limit as string) || 100;
        const offset = parseInt(req.query.offset as string) || 0;
        const sessions = this.database.getSessions(limit, offset);
        res.json({ success: true, data: sessions });
      } catch (error) {
        log.error('Error fetching sessions:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch sessions' });
      }
    });

    this.app.get('/api/sessions/:id', async (req: Request, res: Response) => {
      try {
        const session = this.database.getSession(req.params.id);
        if (!session) {
          return res.status(404).json({ success: false, error: 'Session not found' });
        }
        res.json({ success: true, data: session });
      } catch (error) {
        log.error('Error fetching session:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch session' });
      }
    });

    this.app.post('/api/sessions', async (req: Request, res: Response) => {
      try {
        const sessionData = {
          name: req.body.name || 'New Session',
          start_time: req.body.start_time || Date.now(),
          status: req.body.status || 'active',
          metadata: req.body.metadata ? JSON.stringify(req.body.metadata) : undefined,
          workspace_path: req.body.workspace_path,
        } as const;

        const session = this.database.createSession(sessionData);
        
        // Notify WebSocket clients
        this.broadcast('session:created', session);
        
        res.status(201).json({ success: true, data: session });
      } catch (error) {
        log.error('Error creating session:', error);
        res.status(500).json({ success: false, error: 'Failed to create session' });
      }
    });

    this.app.put('/api/sessions/:id', async (req: Request, res: Response) => {
      try {
        const updates: Partial<Session> = {};
        
        if (req.body.name) updates.name = req.body.name;
        if (req.body.status) updates.status = req.body.status;
        if (req.body.end_time) updates.end_time = req.body.end_time;
        if (req.body.metadata) updates.metadata = JSON.stringify(req.body.metadata);
        
        const success = this.database.updateSession(req.params.id, updates);
        
        if (!success) {
          return res.status(404).json({ success: false, error: 'Session not found' });
        }

        const updatedSession = this.database.getSession(req.params.id);
        this.broadcast('session:updated', updatedSession);
        
        res.json({ success: true, data: updatedSession });
      } catch (error) {
        log.error('Error updating session:', error);
        res.status(500).json({ success: false, error: 'Failed to update session' });
      }
    });

    // Trace endpoints
    this.app.get('/api/sessions/:sessionId/traces', async (req: Request, res: Response) => {
      try {
        const limit = parseInt(req.query.limit as string) || 1000;
        const offset = parseInt(req.query.offset as string) || 0;
        const traces = this.database.getTraces(req.params.sessionId, limit, offset);
        res.json({ success: true, data: traces });
      } catch (error) {
        log.error('Error fetching traces:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch traces' });
      }
    });

    this.app.get('/api/traces/:id', async (req: Request, res: Response) => {
      try {
        const trace = this.database.getTrace(req.params.id);
        if (!trace) {
          return res.status(404).json({ success: false, error: 'Trace not found' });
        }
        res.json({ success: true, data: trace });
      } catch (error) {
        log.error('Error fetching trace:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch trace' });
      }
    });

    this.app.post('/api/traces', async (req: Request, res: Response) => {
      try {
        const traceData = {
          session_id: req.body.session_id,
          parent_id: req.body.parent_id,
          operation: req.body.operation || 'unknown',
          language: req.body.language || 'javascript',
          framework: req.body.framework || 'unknown',
          start_time: req.body.start_time || Date.now(),
          end_time: req.body.end_time,
          duration: req.body.duration,
          data: JSON.stringify(req.body.data || {}),
          metadata: req.body.metadata ? JSON.stringify(req.body.metadata) : undefined,
          status: req.body.status || 'pending',
          error: req.body.error,
        };

        const trace = this.database.insertTrace(traceData);
        
        // Notify WebSocket clients and main window
        this.broadcast('trace:new', trace);
        
        res.status(201).json({ success: true, data: trace });
      } catch (error) {
        log.error('Error creating trace:', error);
        res.status(500).json({ success: false, error: 'Failed to create trace' });
      }
    });

    this.app.put('/api/traces/:id', async (req: Request, res: Response) => {
      try {
        const updates: Partial<Trace> = {};
        
        if (req.body.end_time) updates.end_time = req.body.end_time;
        if (req.body.duration) updates.duration = req.body.duration;
        if (req.body.status) updates.status = req.body.status;
        if (req.body.error) updates.error = req.body.error;
        if (req.body.data) updates.data = JSON.stringify(req.body.data);
        
        const success = this.database.updateTrace(req.params.id, updates);
        
        if (!success) {
          return res.status(404).json({ success: false, error: 'Trace not found' });
        }

        const updatedTrace = this.database.getTrace(req.params.id);
        this.broadcast('trace:updated', updatedTrace);
        
        res.json({ success: true, data: updatedTrace });
      } catch (error) {
        log.error('Error updating trace:', error);
        res.status(500).json({ success: false, error: 'Failed to update trace' });
      }
    });

    // Bookmark endpoints
    this.app.get('/api/bookmarks', async (req: Request, res: Response) => {
      try {
        const bookmarks = this.database.getBookmarks();
        res.json({ success: true, data: bookmarks });
      } catch (error) {
        log.error('Error fetching bookmarks:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch bookmarks' });
      }
    });

    this.app.post('/api/bookmarks', async (req: Request, res: Response) => {
      try {
        const bookmarkData = {
          trace_id: req.body.trace_id,
          title: req.body.title || 'Bookmark',
          description: req.body.description,
          color: req.body.color || '#FFD700',
        };

        const bookmark = this.database.createBookmark(bookmarkData);
        this.broadcast('bookmark:created', bookmark);
        
        res.status(201).json({ success: true, data: bookmark });
      } catch (error) {
        log.error('Error creating bookmark:', error);
        res.status(500).json({ success: false, error: 'Failed to create bookmark' });
      }
    });

    // Statistics endpoint
    this.app.get('/api/stats', async (req: Request, res: Response) => {
      try {
        const stats = this.database.getStats();
        res.json({ success: true, data: stats });
      } catch (error) {
        log.error('Error fetching stats:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch stats' });
      }
    });

    // Error handling middleware
    this.app.use((error: Error, req: Request, res: Response, next: any) => {
      log.error('API Error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    });
  }

  private setupWebSocket(): void {
    if (!this.server) return;

    this.wss = new WebSocketServer({ server: this.server });

    this.wss.on('connection', (ws: WebSocket) => {
      log.debug('WebSocket client connected');
      this.clients.add(ws);

      ws.on('close', () => {
        log.debug('WebSocket client disconnected');
        this.clients.delete(ws);
      });

      ws.on('error', (error) => {
        log.error('WebSocket error:', error);
        this.clients.delete(ws);
      });

      // Send initial connection message
      ws.send(JSON.stringify({
        type: 'connection',
        data: { status: 'connected', timestamp: new Date().toISOString() },
      }));
    });
  }

  private broadcast(type: string, data: any): void {
    const message = JSON.stringify({ type, data, timestamp: new Date().toISOString() });
    
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      } else {
        this.clients.delete(client);
      }
    });
  }

  async start(): Promise<number> {
    try {
      const port = await this.findAvailablePort(this.port);
      
      this.server = this.app.listen(port, 'localhost', () => {
        log.info(`FlowScope API server listening on http://localhost:${port}`);
      });

      this.setupWebSocket();
      this.port = port;
      
      return port;
    } catch (error) {
      log.error('Failed to start API server:', error);
      throw error;
    }
  }

  stop(): void {
    if (this.wss) {
      this.wss.close();
      this.wss = null;
    }

    if (this.server) {
      this.server.close();
      this.server = null;
    }

    this.clients.clear();
    log.info('API server stopped');
  }

  getPort(): number {
    return this.port;
  }

  getApp(): Express {
    return this.app;
  }

  private async findAvailablePort(startPort: number): Promise<number> {
    const net = await import('net');
    
    return new Promise((resolve, reject) => {
      const server = net.createServer();
      
      server.listen(startPort, (error?: Error) => {
        if (error) {
          server.close();
          // Try next port
          this.findAvailablePort(startPort + 1).then(resolve).catch(reject);
        } else {
          const port = (server.address() as any)?.port;
          server.close(() => {
            resolve(port);
          });
        }
      });
    });
  }
}
