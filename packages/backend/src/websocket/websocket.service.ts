import { Injectable } from '@nestjs/common';
import { DebugWebSocketGateway } from '../websocket/websocket.gateway';
import type { TraceData } from '@flowscope/shared';

@Injectable()
export class WebSocketService {
  constructor(private readonly websocketGateway: DebugWebSocketGateway) {}

  /**
   * Broadcast a trace event to all connected clients in a session
   */
  async broadcastTrace(trace: TraceData): Promise<void> {
    try {
      this.websocketGateway.broadcastTrace(trace);
    } catch (error) {
      console.error('Failed to broadcast trace:', error);
    }
  }

  /**
   * Broadcast a session update to all connected clients
   */
  async broadcastSessionUpdate(sessionId: string, update: any): Promise<void> {
    try {
      this.websocketGateway.broadcastSessionUpdate(sessionId, update);
    } catch (error) {
      console.error('Failed to broadcast session update:', error);
    }
  }

  /**
   * Get session statistics (connected clients, etc.)
   */
  getSessionStats(sessionId: string) {
    return this.websocketGateway.getSessionStats(sessionId);
  }

  /**
   * Send trace events in batches for better performance
   */
  async broadcastTraceBatch(traces: TraceData[]): Promise<void> {
    try {
      for (const trace of traces) {
        this.websocketGateway.broadcastTrace(trace);
      }
    } catch (error) {
      console.error('Failed to broadcast trace batch:', error);
    }
  }
}
