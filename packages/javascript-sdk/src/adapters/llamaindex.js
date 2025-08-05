"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LlamaIndexAdapter = void 0;
const base_1 = require("./base");
/**
 * LlamaIndex integration adapter
 * Provides automatic tracing for LlamaIndex applications
 */
class LlamaIndexAdapter extends base_1.BaseAdapter {
    constructor() {
        super(...arguments);
        this.name = 'llamaindex';
        this.version = '1.0.0';
        this.isLlamaIndexAvailable = false;
    }
    /**
     * Check if LlamaIndex is available in the current environment
     */
    isSupported() {
        try {
            // Try to detect LlamaIndex (Python package typically)
            // This is a simplified check - real implementation would be more sophisticated
            if (typeof window !== 'undefined') {
                // Browser environment - check for LlamaIndex JS
                return !!window.LlamaIndex;
            }
            else {
                // Node.js environment - check for Python LlamaIndex via bridge
                return this.checkPythonLlamaIndex();
            }
        }
        catch {
            return false;
        }
    }
    /**
     * Integrate with LlamaIndex by setting up callback handlers
     */
    async integrate() {
        if (!this.isSupported()) {
            throw new Error('LlamaIndex is not available in this environment');
        }
        try {
            if (typeof window !== 'undefined') {
                // Browser integration
                await this.integrateBrowser();
            }
            else {
                // Node.js integration (typically via Python bridge)
                await this.integrateNode();
            }
            this.isIntegrated = true;
            this.debug('LlamaIndex integration activated');
        }
        catch (error) {
            this.handleError(error);
            throw error;
        }
    }
    /**
     * Disconnect from LlamaIndex
     */
    async disconnect() {
        if (this.isIntegrated) {
            // Cleanup integration
            this.isIntegrated = false;
            this.debug('LlamaIndex integration deactivated');
        }
    }
    /**
     * Generate chain ID from LlamaIndex event
     */
    generateChainId(event) {
        // LlamaIndex events might have different structure
        if (event?.query_id) {
            return event.query_id;
        }
        if (event?.trace_id) {
            return event.trace_id;
        }
        return `llamaindex_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * Determine event type from LlamaIndex event
     */
    determineEventType(event) {
        // Map LlamaIndex event types to FlowScope types
        if (event?.event_type === 'query')
            return 'prompt';
        if (event?.event_type === 'response')
            return 'response';
        if (event?.event_type === 'retrieval')
            return 'function_call';
        if (event?.event_type === 'error')
            return 'error';
        // Default based on event structure
        if (event?.query)
            return 'prompt';
        if (event?.response)
            return 'response';
        if (event?.nodes || event?.retrieval)
            return 'function_call';
        return 'prompt';
    }
    /**
     * Extract metadata from LlamaIndex event
     */
    extractMetadata(event) {
        const baseMetadata = super.extractMetadata(event);
        return {
            ...baseMetadata,
            llamaIndexEvent: event?.event_type,
            queryId: event?.query_id,
            traceId: event?.trace_id,
            nodeIds: event?.node_ids || [],
            retrievalScore: event?.score,
            indexType: event?.index_type,
        };
    }
    /**
     * Sanitize LlamaIndex event data
     */
    sanitizeEventData(event) {
        const sanitized = super.sanitizeEventData(event);
        // Remove LlamaIndex-specific sensitive data
        if (sanitized?.config) {
            delete sanitized.config.openai_api_key;
            delete sanitized.config.anthropic_api_key;
            delete sanitized.config.api_key;
        }
        return sanitized;
    }
    /**
     * Check if Python LlamaIndex is available
     */
    checkPythonLlamaIndex() {
        // This is a placeholder for Python bridge detection
        // Real implementation would check for Python process, llamaindex package, etc.
        return false;
    }
    /**
     * Browser integration for LlamaIndex JS
     */
    async integrateBrowser() {
        // Browser-specific integration logic
        const llamaIndex = window.LlamaIndex;
        if (llamaIndex && llamaIndex.addCallback) {
            const adapter = this;
            llamaIndex.addCallback('flowscope', {
                onQuery: (event) => {
                    adapter.emitTrace(adapter.captureTrace({
                        event_type: 'query',
                        ...event,
                    }));
                },
                onResponse: (event) => {
                    adapter.emitTrace(adapter.captureTrace({
                        event_type: 'response',
                        ...event,
                    }));
                },
                onRetrieval: (event) => {
                    adapter.emitTrace(adapter.captureTrace({
                        event_type: 'retrieval',
                        ...event,
                    }));
                },
                onError: (event) => {
                    adapter.emitTrace(adapter.captureTrace({
                        event_type: 'error',
                        ...event,
                    }));
                },
            });
        }
    }
    /**
     * Node.js integration (via Python bridge)
     */
    async integrateNode() {
        // Node.js-specific integration logic
        // This would typically involve setting up a Python bridge
        // or communicating with a Python process running LlamaIndex
        this.debug('Node.js LlamaIndex integration not yet implemented');
        this.debug('Consider using the Python FlowScope package for LlamaIndex integration');
    }
}
exports.LlamaIndexAdapter = LlamaIndexAdapter;
