export type { TraceData, FlowScopeConfig, TraceEventType } from '@flowscope/shared';
import type { TraceData, FlowScopeConfig } from '@flowscope/shared';
export interface SDKConfig extends FlowScopeConfig {
    /** Enable automatic chain detection */
    autoDetect?: boolean;
    /** Batch size for trace events */
    batchSize?: number;
    /** Flush interval in milliseconds */
    flushInterval?: number;
    /** Maximum number of traces to keep in memory */
    maxTraces?: number;
    /** Debug mode for verbose logging */
    debug?: boolean;
}
export interface Session {
    id: string;
    name?: string;
    userId?: string;
    projectId?: string;
    startTime: number;
    endTime?: number;
    metadata?: Record<string, any>;
}
export interface ChainContext {
    chainId: string;
    sessionId: string;
    parentId?: string;
    name?: string;
    startTime: number;
    endTime?: number;
    status: 'running' | 'completed' | 'failed';
    metadata?: Record<string, any>;
}
export interface FrameworkAdapter {
    name: string;
    version: string;
    integrate(): void | Promise<void>;
    disconnect(): void | Promise<void>;
    isSupported(): boolean;
    on(event: string, listener: (...args: any[]) => void): this;
    removeAllListeners(): this;
}
export interface FlowScopeEvents {
    'trace': (trace: TraceData) => void;
    'session:start': (session: Session) => void;
    'session:end': (session: Session) => void;
    'chain:start': (context: ChainContext) => void;
    'chain:end': (context: ChainContext) => void;
    'error': (error: Error) => void;
}
export interface Transport {
    send(data: TraceData[]): Promise<void>;
    flush(): Promise<void>;
    isConnected(): boolean;
}
export interface Storage {
    save(key: string, data: any): Promise<void>;
    load(key: string): Promise<any>;
    delete(key: string): Promise<void>;
    clear(): Promise<void>;
}
