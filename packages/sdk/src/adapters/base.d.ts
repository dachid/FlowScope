import { EventEmitter } from 'events';
import { TraceData } from '@flowscope/shared';
import { FrameworkAdapter, ChainContext, Session } from '../types';
/**
 * Base adapter class for framework integrations
 * Provides common functionality for all adapters
 */
export declare abstract class BaseAdapter extends EventEmitter implements FrameworkAdapter {
    abstract readonly name: string;
    abstract readonly version: string;
    protected isIntegrated: boolean;
    protected currentSession?: Session;
    protected activeChains: Map<string, ChainContext>;
    /**
     * Initialize the adapter integration
     */
    abstract integrate(): void | Promise<void>;
    /**
     * Disconnect the adapter
     */
    abstract disconnect(): void | Promise<void>;
    /**
     * Check if the framework is supported in current environment
     */
    abstract isSupported(): boolean;
    /**
     * Capture a trace event
     */
    protected captureTrace(event: any): TraceData;
    /**
     * Start a new session
     */
    protected startSession(sessionId?: string, metadata?: Record<string, any>): Session;
    /**
     * End the current session
     */
    protected endSession(): void;
    /**
     * Start tracking a chain execution
     */
    protected startChain(chainId: string, name?: string, metadata?: Record<string, any>): ChainContext;
    /**
     * End tracking a chain execution
     */
    protected endChain(chainId: string, status?: 'completed' | 'failed'): void;
    /**
     * Emit a trace event
     */
    protected emitTrace(trace: TraceData): void;
    /**
     * Generate a unique chain ID for the event
     */
    protected abstract generateChainId(event: any): string;
    /**
     * Determine the event type from the framework event
     */
    protected abstract determineEventType(event: any): TraceData['type'];
    /**
     * Sanitize event data to remove sensitive information
     */
    protected sanitizeEventData(event: any): any;
    /**
     * Extract metadata from the event
     */
    protected extractMetadata(event: any): Record<string, any>;
    /**
     * Log debug information if debug mode is enabled
     */
    protected debug(message: string, ...args: any[]): void;
    /**
     * Handle adapter errors
     */
    protected handleError(error: Error): void;
}
