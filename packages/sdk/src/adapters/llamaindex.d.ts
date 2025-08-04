import { BaseAdapter } from './base';
import { TraceData } from '@flowscope/shared';
/**
 * LlamaIndex integration adapter
 * Provides automatic tracing for LlamaIndex applications
 */
export declare class LlamaIndexAdapter extends BaseAdapter {
    readonly name = "llamaindex";
    readonly version = "1.0.0";
    private isLlamaIndexAvailable;
    /**
     * Check if LlamaIndex is available in the current environment
     */
    isSupported(): boolean;
    /**
     * Integrate with LlamaIndex by setting up callback handlers
     */
    integrate(): Promise<void>;
    /**
     * Disconnect from LlamaIndex
     */
    disconnect(): Promise<void>;
    /**
     * Generate chain ID from LlamaIndex event
     */
    protected generateChainId(event: any): string;
    /**
     * Determine event type from LlamaIndex event
     */
    protected determineEventType(event: any): TraceData['type'];
    /**
     * Extract metadata from LlamaIndex event
     */
    protected extractMetadata(event: any): Record<string, any>;
    /**
     * Sanitize LlamaIndex event data
     */
    protected sanitizeEventData(event: any): any;
    /**
     * Check if Python LlamaIndex is available
     */
    private checkPythonLlamaIndex;
    /**
     * Browser integration for LlamaIndex JS
     */
    private integrateBrowser;
    /**
     * Node.js integration (via Python bridge)
     */
    private integrateNode;
}
