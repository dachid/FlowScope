import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { WebSocketService } from '../websocket/websocket.service';
import type { TraceData } from '../types';

@Controller('traces')
export class TracesController {
  constructor(private readonly websocketService: WebSocketService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createTrace(@Body() trace: TraceData) {
    // Validate trace data
    if (!trace.id || !trace.sessionId || !trace.timestamp) {
      throw new Error('Invalid trace data: missing required fields');
    }

    // Store trace in database (if needed)
    // await this.tracesService.create(trace);

    // Broadcast to WebSocket clients
    await this.websocketService.broadcastTrace(trace);

    return {
      success: true,
      message: 'Trace received and broadcasted',
      traceId: trace.id,
    };
  }

  @Post('batch')
  @HttpCode(HttpStatus.CREATED)
  async createTraceBatch(@Body() data: { traces: TraceData[] }) {
    const { traces } = data;

    if (!Array.isArray(traces) || traces.length === 0) {
      throw new Error('Invalid batch data: traces array required');
    }

    // Validate all traces
    for (const trace of traces) {
      if (!trace.id || !trace.sessionId || !trace.timestamp) {
        throw new Error(`Invalid trace data: missing required fields in trace ${trace.id}`);
      }
    }

    // Store traces in database (if needed)
    // await this.tracesService.createBatch(traces);

    // Broadcast all traces
    await this.websocketService.broadcastTraceBatch(traces);

    return {
      success: true,
      message: 'Trace batch received and broadcasted',
      count: traces.length,
      traceIds: traces.map(t => t.id),
    };
  }
}
