import { WebSocketService } from '../websocket/websocket.service';
import { UniversalTraceService } from './universal-trace.service';
import type { UniversalTraceData, TraceBatch, UniversalSession } from '../types';
export declare class TracesController {
    private readonly websocketService;
    private readonly universalTraceService;
    private readonly logger;
    constructor(websocketService: WebSocketService, universalTraceService: UniversalTraceService);
    /**
     * Primary trace endpoint - universal format only
     */
    submitTrace(trace: UniversalTraceData): Promise<{
        success: boolean;
        message: string;
        traceId: string;
        validation: import("../types").ValidationResult;
        warnings: string[];
    }>;
    /**
     * Batch processing endpoint for high-throughput scenarios
     */
    submitBatch(batch: TraceBatch): Promise<{
        success: boolean;
        message: string;
        batchId: string;
        processedCount: number;
        failedCount: number;
        validation: import("../types").ValidationResult;
        results: {
            traceId: string;
            success: boolean;
            error?: string;
        }[];
    }>;
    /**
     * Session processing endpoint
     */
    submitSession(session: UniversalSession): Promise<{
        success: boolean;
        message: string;
        sessionId: string;
        processedCount: number;
        failedCount: number;
        results: {
            success: boolean;
            validation: import("../types").ValidationResult;
            processedTrace?: UniversalTraceData;
            error?: string;
            traceId: string;
        }[];
    }>;
    /**
     * Get session traces
     */
    getSessionTraces(sessionId: string): Promise<{
        success: boolean;
        session: UniversalSession;
        traces: UniversalTraceData[];
        stats: {
            languages: {
                [language: string]: number;
            };
            frameworks: {
                [framework: string]: number;
            };
        };
    }>;
    /**
     * Cross-language trace correlation
     */
    correlateTraces(body: {
        traceIds: string[];
    }): Promise<{
        success: boolean;
        correlation: {
            correlatedTraces: UniversalTraceData[];
            correlationGraph: {
                [traceId: string]: string[];
            };
            languages: string[];
            frameworks: string[];
        };
    }>;
    /**
     * Health check for trace processing
     */
    getHealth(): Promise<{
        success: boolean;
        message: string;
        version: string;
        protocol: string;
        supportedLanguages: string[];
        supportedFrameworks: string[];
        timestamp: string;
    }>;
}
