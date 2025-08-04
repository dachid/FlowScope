"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LangChainAdapter = void 0;
const base_1 = require("./base");
/**
 * LangChain integration adapter
 * Provides automatic tracing for LangChain applications
 */
class LangChainAdapter extends base_1.BaseAdapter {
    constructor() {
        super(...arguments);
        this.name = 'langchain';
        this.version = '1.0.0';
        this.isLangChainAvailable = false;
    }
    /**
     * Check if LangChain is available in the current environment
     */
    isSupported() {
        try {
            // Try to import LangChain
            require.resolve('langchain');
            this.isLangChainAvailable = true;
            return true;
        }
        catch {
            // Try alternative imports
            try {
                require.resolve('@langchain/core');
                this.isLangChainAvailable = true;
                return true;
            }
            catch {
                return false;
            }
        }
    }
    /**
     * Integrate with LangChain by registering callback handlers
     */
    async integrate() {
        if (!this.isSupported()) {
            throw new Error('LangChain is not available in this environment');
        }
        try {
            // Dynamic import to avoid errors if LangChain is not installed
            const { BaseCallbackHandler } = await this.importLangChain();
            // Create FlowScope callback handler
            const FlowScopeCallbackHandler = this.createCallbackHandler(BaseCallbackHandler);
            // Register the callback handler globally
            this.registerGlobalHandler(FlowScopeCallbackHandler);
            this.isIntegrated = true;
            this.debug('LangChain integration activated');
        }
        catch (error) {
            this.handleError(error);
            throw error;
        }
    }
    /**
     * Disconnect from LangChain
     */
    async disconnect() {
        if (this.isIntegrated) {
            // Restore original callback manager if needed
            if (this.originalCallbackManager) {
                // Implementation depends on LangChain version
            }
            this.isIntegrated = false;
            this.debug('LangChain integration deactivated');
        }
    }
    /**
     * Generate chain ID from LangChain event
     */
    generateChainId(event) {
        // Use run_id if available, otherwise generate one
        if (event?.run_id) {
            return event.run_id;
        }
        if (event?.tags?.length > 0) {
            return `chain_${event.tags.join('_')}_${Date.now()}`;
        }
        return `langchain_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * Determine event type from LangChain event
     */
    determineEventType(event) {
        if (event?.event?.includes('start'))
            return 'prompt';
        if (event?.event?.includes('end'))
            return 'response';
        if (event?.event?.includes('error'))
            return 'error';
        if (event?.event?.includes('tool'))
            return 'function_call';
        // Default based on event structure
        if (event?.inputs)
            return 'prompt';
        if (event?.outputs)
            return 'response';
        return 'prompt';
    }
    /**
     * Extract metadata from LangChain event
     */
    extractMetadata(event) {
        const baseMetadata = super.extractMetadata(event);
        return {
            ...baseMetadata,
            langchainEvent: event?.event,
            runId: event?.run_id,
            parentRunId: event?.parent_run_id,
            tags: event?.tags || [],
            serialized: event?.serialized,
            executionOrder: event?.execution_order,
        };
    }
    /**
     * Sanitize LangChain event data
     */
    sanitizeEventData(event) {
        const sanitized = super.sanitizeEventData(event);
        // Remove LangChain-specific sensitive data
        if (sanitized?.serialized?.kwargs) {
            delete sanitized.serialized.kwargs.openai_api_key;
            delete sanitized.serialized.kwargs.anthropic_api_key;
            delete sanitized.serialized.kwargs.api_key;
        }
        return sanitized;
    }
    /**
     * Dynamically import LangChain modules
     */
    async importLangChain() {
        // Use eval to prevent TypeScript from analyzing the imports
        const dynamicImport = eval('import');
        try {
            // Try modern LangChain structure first
            const module = await dynamicImport('@langchain/core/callbacks/base');
            return module;
        }
        catch {
            try {
                // Fallback to legacy structure
                const module = await dynamicImport('langchain/callbacks');
                return module;
            }
            catch {
                throw new Error('Could not import LangChain callback modules');
            }
        }
    }
    /**
     * Create a custom callback handler class
     */
    createCallbackHandler(BaseCallbackHandler) {
        const adapter = this;
        return class FlowScopeCallbackHandler extends BaseCallbackHandler {
            constructor() {
                super(...arguments);
                this.name = 'flowscope_callback';
            }
            async handleChainStart(chain, inputs, runId, parentRunId, tags) {
                const event = {
                    event: 'chain_start',
                    run_id: runId,
                    parent_run_id: parentRunId,
                    serialized: chain,
                    inputs,
                    tags,
                };
                adapter.startChain(runId, chain?.name || 'unknown_chain');
                adapter.emitTrace(adapter.captureTrace(event));
            }
            async handleChainEnd(outputs, runId, parentRunId) {
                const event = {
                    event: 'chain_end',
                    run_id: runId,
                    parent_run_id: parentRunId,
                    outputs,
                };
                adapter.endChain(runId, 'completed');
                adapter.emitTrace(adapter.captureTrace(event));
            }
            async handleChainError(err, runId, parentRunId) {
                const event = {
                    event: 'chain_error',
                    run_id: runId,
                    parent_run_id: parentRunId,
                    error: {
                        name: err.name,
                        message: err.message,
                        stack: err.stack,
                    },
                };
                adapter.endChain(runId, 'failed');
                adapter.emitTrace(adapter.captureTrace(event));
            }
            async handleLLMStart(llm, prompts, runId, parentRunId, extraParams) {
                const event = {
                    event: 'llm_start',
                    run_id: runId,
                    parent_run_id: parentRunId,
                    serialized: llm,
                    prompts,
                    extra_params: extraParams,
                };
                adapter.emitTrace(adapter.captureTrace(event));
            }
            async handleLLMEnd(output, runId, parentRunId) {
                const event = {
                    event: 'llm_end',
                    run_id: runId,
                    parent_run_id: parentRunId,
                    output,
                };
                adapter.emitTrace(adapter.captureTrace(event));
            }
            async handleToolStart(tool, input, runId, parentRunId) {
                const event = {
                    event: 'tool_start',
                    run_id: runId,
                    parent_run_id: parentRunId,
                    serialized: tool,
                    input,
                };
                adapter.emitTrace(adapter.captureTrace(event));
            }
            async handleToolEnd(output, runId, parentRunId) {
                const event = {
                    event: 'tool_end',
                    run_id: runId,
                    parent_run_id: parentRunId,
                    output,
                };
                adapter.emitTrace(adapter.captureTrace(event));
            }
        };
    }
    /**
     * Register the callback handler globally with LangChain
     */
    registerGlobalHandler(HandlerClass) {
        // This is a simplified version - actual implementation would depend on
        // how the application wants to register handlers (globally vs per-chain)
        this.debug('FlowScope callback handler registered with LangChain');
    }
}
exports.LangChainAdapter = LangChainAdapter;
