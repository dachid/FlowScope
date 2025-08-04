import { TraceData } from '@flowscope/shared';
import { Transport } from '../types';
/**
 * Console transport for debugging
 * Outputs traces to console.log
 */
export declare class ConsoleTransport implements Transport {
    private options;
    private connected;
    constructor(options?: {
        pretty?: boolean;
    });
    send(data: TraceData[]): Promise<void>;
    flush(): Promise<void>;
    isConnected(): boolean;
}
/**
 * HTTP transport for sending traces to FlowScope backend
 */
export declare class HTTPTransport implements Transport {
    private endpoint;
    private options;
    private connected;
    constructor(endpoint: string, options?: {
        apiKey?: string;
        timeout?: number;
        headers?: Record<string, string>;
    });
    send(data: TraceData[]): Promise<void>;
    flush(): Promise<void>;
    isConnected(): boolean;
    connect(): Promise<void>;
    disconnect(): void;
}
/**
 * WebSocket transport for real-time trace streaming
 */
export declare class WebSocketTransport implements Transport {
    private endpoint;
    private options;
    private ws?;
    private connected;
    private reconnectAttempts;
    private maxReconnectAttempts;
    private reconnectInterval;
    constructor(endpoint: string, options?: {
        protocols?: string[];
        reconnect?: boolean;
    });
    send(data: TraceData[]): Promise<void>;
    flush(): Promise<void>;
    isConnected(): boolean;
    connect(): Promise<void>;
    disconnect(): void;
}
