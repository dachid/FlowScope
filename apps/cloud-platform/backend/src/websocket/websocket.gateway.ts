import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import type { TraceData } from '../types';

interface SocketSession {
  id: string;
  sessionId?: string;
  userId?: string;
  connectedAt: number;
}

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:3000'], // Vite dev server
    credentials: true,
  },
  namespace: '/debug',
})
export class DebugWebSocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(DebugWebSocketGateway.name);
  private connectedClients = new Map<string, SocketSession>();

  handleConnection(client: Socket) {
    const session: SocketSession = {
      id: client.id,
      connectedAt: Date.now(),
    };

    this.connectedClients.set(client.id, session);
    this.logger.log(`Client connected: ${client.id}`);

    // Send connection confirmation
    client.emit('connected', {
      clientId: client.id,
      timestamp: Date.now(),
    });
  }

  handleDisconnect(client: Socket) {
    this.connectedClients.delete(client.id);
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join_session')
  handleJoinSession(
    @MessageBody() data: { sessionId: string; userId?: string },
    @ConnectedSocket() client: Socket,
  ) {
    const session = this.connectedClients.get(client.id);
    if (session) {
      session.sessionId = data.sessionId;
      session.userId = data.userId;
      
      // Join the session room for targeted broadcasting
      client.join(`session:${data.sessionId}`);
      
      this.logger.log(`Client ${client.id} joined session: ${data.sessionId}`);
      
      client.emit('session_joined', {
        sessionId: data.sessionId,
        timestamp: Date.now(),
      });
    }
  }

  @SubscribeMessage('leave_session')
  handleLeaveSession(
    @MessageBody() data: { sessionId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(`session:${data.sessionId}`);
    
    const session = this.connectedClients.get(client.id);
    if (session) {
      session.sessionId = undefined;
    }
    
    this.logger.log(`Client ${client.id} left session: ${data.sessionId}`);
  }

  @SubscribeMessage('trace_event')
  handleTraceEvent(
    @MessageBody() trace: TraceData,
    @ConnectedSocket() client: Socket,
  ) {
    // Validate trace data
    if (!trace.sessionId || !trace.id) {
      client.emit('error', { message: 'Invalid trace data' });
      return;
    }

    // Broadcast to all clients in the same session
    this.server.to(`session:${trace.sessionId}`).emit('new_trace', trace);
    
    this.logger.debug(`Trace event broadcasted for session: ${trace.sessionId}`);
  }

  @SubscribeMessage('request_session_state')
  handleRequestSessionState(
    @MessageBody() data: { sessionId: string },
    @ConnectedSocket() client: Socket,
  ) {
    // In a real implementation, this would fetch from database
    // For now, emit empty state
    client.emit('session_state', {
      sessionId: data.sessionId,
      traces: [],
      timestamp: Date.now(),
    });
  }

  // Method to broadcast traces from external sources (like SDK)
  broadcastTrace(trace: TraceData) {
    this.server.to(`session:${trace.sessionId}`).emit('new_trace', trace);
  }

  // Method to broadcast session updates
  broadcastSessionUpdate(sessionId: string, update: any) {
    this.server.to(`session:${sessionId}`).emit('session_update', update);
  }

  // Get session statistics
  getSessionStats(sessionId: string) {
    const clients = Array.from(this.connectedClients.values()).filter(
      session => session.sessionId === sessionId
    );
    
    return {
      sessionId,
      connectedClients: clients.length,
      clients: clients.map(c => ({
        id: c.id,
        userId: c.userId,
        connectedAt: c.connectedAt,
      })),
    };
  }
}
