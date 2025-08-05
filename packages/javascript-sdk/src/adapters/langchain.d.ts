import { BaseAdapter } from './base';
import { TraceData } from '@flowscope/shared';
/**
 * LangChain integration adapter
 * Provides automatic tracing for LangChain applications
 */
export declare class LangChainAdapter extends BaseAdapter {
    readonly name = "langchain";
    readonly version = "1.0.0";
    private originalCallbackManager?;
    private isLangChainAvailable;
    /**
     * Check if LangChain is available in the current environment
     */
    isSupported(): boolean;
    /**
     * Integrate with LangChain by registering callback handlers
     */
    integrate(): Promise<void>;
    /**
     * Disconnect from LangChain
     */
    disconnect(): Promise<void>;
    /**
     * Generate chain ID from LangChain event
     */
    protected generateChainId(event: any): string;
    /**
     * Determine event type from LangChain event
     */
    protected determineEventType(event: any): TraceData['type'];
    /**
     * Extract metadata from LangChain event
     */
    protected extractMetadata(event: any): Record<string, any>;
    /**
     * Sanitize LangChain event data
     */
    protected sanitizeEventData(event: any): any;
    /**
     * Dynamically import LangChain modules
     */
    private importLangChain;
    /**
     * Create a custom callback handler class
     */
    private createCallbackHandler;
    /**
     * Register the callback handler globally with LangChain
     */
    private registerGlobalHandler;
}
