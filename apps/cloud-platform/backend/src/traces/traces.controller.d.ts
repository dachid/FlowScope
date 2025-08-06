import { WebSocketService } from '../websocket/websocket.service';
import type { TraceData } from '../types';
export declare class TracesController {
    private readonly websocketService;
    constructor(websocketService: WebSocketService);
    createTrace(trace: TraceData): Promise<{
        success: boolean;
        message: string;
        traceId: string;
    }>;
    createTraceBatch(data: {
        traces: TraceData[];
    }): Promise<{
        success: boolean;
        message: string;
        count: number;
        traceIds: string[];
    }>;
}
