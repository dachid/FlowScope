import { Injectable } from '@nestjs/common';
import { DebugWebSocketGateway } from '../websocket/websocket.gateway';
import type { TraceData, UniversalTraceData } from '../types';

@Injectable()
export class WebSocketService {
  constructor(private readonly websocketGateway: DebugWebSocketGateway) {}

  /**
   * Broadcast a legacy trace event to all connected clients in a session
   */
  async broadcastTrace(trace: TraceData): Promise<void> {
    try {
      this.websocketGateway.broadcastTrace(trace);
    } catch (error) {
      console.error('Failed to broadcast trace:', error);
    }
  }

  /**
   * Broadcast a universal trace event to all connected clients in a session
   */
  async broadcastUniversalTrace(trace: UniversalTraceData): Promise<void> {
    try {
      // Convert universal trace to legacy format for existing clients if needed
      // For now, broadcast directly as universal trace
      this.websocketGateway.broadcastTrace(trace as any);
    } catch (error) {
      console.error('Failed to broadcast universal trace:', error);
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
   * Broadcast trace batch processing results
   */
  async broadcastTraceBatchResult(result: {
    batchId: string;
    processedCount: number;
    failedCount: number;
    successfulTraceIds: string[];
  }): Promise<void> {
    try {
      this.websocketGateway.broadcastSessionUpdate('batch', {
        type: 'batch_result',
        ...result
      });
    } catch (error) {
      console.error('Failed to broadcast batch result:', error);
    }
  }

  /**
   * Broadcast session processing results
   */
  async broadcastSessionResult(result: {
    sessionId: string;
    processedCount: number;
    failedCount: number;
    traceIds: string[];
  }): Promise<void> {
    try {
      this.websocketGateway.broadcastSessionUpdate(result.sessionId, {
        type: 'session_result',
        processedCount: result.processedCount,
        failedCount: result.failedCount,
        traceIds: result.traceIds
      });
    } catch (error) {
      console.error('Failed to broadcast session result:', error);
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
