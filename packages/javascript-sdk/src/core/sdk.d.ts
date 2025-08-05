import { EventEmitter } from 'events';
import { TraceData } from '@flowscope/shared';
import { SDKConfig, Session, FrameworkAdapter, Transport, Storage } from '../types';
/**
 * Main FlowScope SDK class
 * Provides the primary interface for LLM chain debugging and observability
 */
export declare class FlowScopeSDK extends EventEmitter {
    private config;
    private adapters;
    private transport?;
    private storage?;
    private traceBuffer;
    private flushTimer?;
    private currentSession?;
    constructor(config: SDKConfig);
    /**
     * Initialize the SDK with configuration
     */
    init(): Promise<void>;
    /**
     * Manually trace a chain execution
     */
    trace(chainId: string, data: Partial<TraceData>): void;
    /**
     * Start a new debugging session
     */
    startSession(sessionId?: string, metadata?: Record<string, any>): Session;
    /**
     * End the current debugging session
     */
    endSession(): void;
    /**
     * Add a framework adapter
     */
    addAdapter(adapter: FrameworkAdapter): void;
    /**
     * Remove a framework adapter
     */
    removeAdapter(name: string): void;
    /**
     * Set the transport for sending traces
     */
    setTransport(transport: Transport): void;
    /**
     * Set the storage for local persistence
     */
    setStorage(storage: Storage): void;
    /**
     * Get current traces
     */
    getTraces(): TraceData[];
    /**
     * Clear all traces
     */
    clearTraces(): void;
    /**
     * Manually flush traces to transport
     */
    flush(): Promise<void>;
    /**
     * Shutdown the SDK
     */
    shutdown(): Promise<void>;
    /**
     * Add a trace to the buffer
     */
    private addTrace;
    /**
     * Setup event handling for the SDK
     */
    private setupEventHandling;
    /**
     * Start the automatic flush timer
     */
    private startFlushTimer;
    /**
     * Auto-detect and integrate supported frameworks
     */
    private autoDetectFrameworks;
    /**
     * Initialize storage system
     */
    private initializeStorage;
    /**
     * Handle errors within the SDK
     */
    private handleError;
    /**
     * Log debug information if debug mode is enabled
     */
    private debug;
}
