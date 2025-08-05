"use strict";
/**
 * Pre-wrapped LangChain module replacement
 * Provides identical API to LangChain but with automatic tracing
 *
 * Usage: const { LLMChain } = require('@flowscope/langchain');
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessagesPlaceholder = exports.ChatPromptTemplate = exports.PromptTemplate = exports.ConversationSummaryMemory = exports.ConversationBufferWindowMemory = exports.ConversationBufferMemory = exports.BufferMemory = exports.BaseLanguageModel = exports.BaseLLM = exports.LLM = exports.ChatOpenAI = exports.OpenAI = exports.flowscope = exports.AgentExecutor = exports.RetrievalQAChain = exports.ConversationChain = exports.LLMChain = void 0;
const sdk_1 = require("../core/sdk");
const transports_1 = require("../transports");
// Initialize SDK
const sdk = new sdk_1.FlowScopeSDK({
    autoDetect: false, // Manual control for wrapper approach
    debug: process.env.FLOWSCOPE_DEBUG === 'true',
});
exports.flowscope = sdk;
// Configure transport
const transport = new transports_1.HTTPTransport(process.env.FLOWSCOPE_ENDPOINT || 'http://localhost:3001', { timeout: 10000 });
sdk.setTransport(transport);
// Initialize SDK
sdk.init().catch(console.error);
// Start default session
sdk.startSession(`wrapper-${Date.now()}`, {
    wrapper_mode: true,
    pid: process.pid,
});
// Import original LangChain modules (optional peer dependency)
let originalLangChain = {};
let originalChains = {};
let originalAgents = {};
// Use dynamic loading to avoid TypeScript compilation errors for optional dependencies
const loadLangChainModule = (moduleName) => {
    try {
        // @ts-ignore - Optional peer dependency
        return eval('require')(moduleName);
    }
    catch (error) {
        return {};
    }
};
try {
    originalLangChain = loadLangChainModule('langchain');
}
catch (error) {
    console.warn('⚠️ FlowScope: LangChain not found, wrapper disabled');
    originalLangChain = {};
}
try {
    originalChains = loadLangChainModule('langchain/chains');
}
catch (error) {
    originalChains = {};
}
try {
    originalAgents = loadLangChainModule('langchain/agents');
}
catch (error) {
    originalAgents = {};
}
/**
 * Wrapped LLMChain with automatic tracing
 */
class LLMChain extends (originalLangChain.LLMChain || class {
}) {
    constructor(...args) {
        super(...args);
        console.log('🔍 FlowScope: LLMChain initialized with tracing');
    }
    async call(values, callbacks) {
        const sessionId = sdk.getCurrentSessionId();
        const traceId = sdk.generateTraceId();
        // Start trace
        sdk.trace('wrapped_llm_chain', {
            id: traceId,
            sessionId,
            type: 'prompt',
            status: 'pending',
            data: {
                input: values,
                prompt: this.prompt?.template || 'Unknown prompt',
                llm: this.llm?.constructor?.name || 'Unknown LLM',
            },
            metadata: {
                framework: 'langchain',
                integration: 'wrapper',
                class: 'LLMChain',
                method: 'call',
            },
        });
        try {
            const startTime = Date.now();
            const result = await super.call(values, callbacks);
            const duration = Date.now() - startTime;
            // Complete trace
            sdk.trace('wrapped_llm_chain', {
                id: traceId,
                sessionId,
                type: 'response',
                status: 'completed',
                data: {
                    input: values,
                    output: result,
                },
                metadata: {
                    framework: 'langchain',
                    integration: 'wrapper',
                    class: 'LLMChain',
                    method: 'call',
                    duration,
                },
            });
            return result;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            const errorStack = error instanceof Error ? error.stack : undefined;
            sdk.trace('wrapped_llm_chain', {
                id: traceId,
                sessionId,
                type: 'error',
                status: 'failed',
                data: {
                    input: values,
                    error: errorMessage,
                    stack: errorStack,
                },
                metadata: {
                    framework: 'langchain',
                    integration: 'wrapper',
                    class: 'LLMChain',
                    method: 'call',
                },
            });
            throw error;
        }
    }
    async run(input, callbacks) {
        const sessionId = sdk.getCurrentSessionId();
        const traceId = sdk.generateTraceId();
        sdk.trace('wrapped_llm_chain_run', {
            id: traceId,
            sessionId,
            type: 'prompt',
            status: 'pending',
            data: {
                input,
                prompt: this.prompt?.template || 'Unknown prompt',
            },
            metadata: {
                framework: 'langchain',
                integration: 'wrapper',
                class: 'LLMChain',
                method: 'run',
            },
        });
        try {
            const startTime = Date.now();
            const result = await super.run(input, callbacks);
            const duration = Date.now() - startTime;
            sdk.trace('wrapped_llm_chain_run', {
                id: traceId,
                sessionId,
                type: 'response',
                status: 'completed',
                data: {
                    input,
                    output: result,
                },
                metadata: {
                    framework: 'langchain',
                    integration: 'wrapper',
                    class: 'LLMChain',
                    method: 'run',
                    duration,
                },
            });
            return result;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            const errorStack = error instanceof Error ? error.stack : undefined;
            sdk.trace('wrapped_llm_chain_run', {
                id: traceId,
                sessionId,
                type: 'error',
                status: 'failed',
                data: {
                    input,
                    error: errorMessage,
                    stack: errorStack,
                },
                metadata: {
                    framework: 'langchain',
                    integration: 'wrapper',
                    class: 'LLMChain',
                    method: 'run',
                },
            });
            throw error;
        }
    }
}
exports.LLMChain = LLMChain;
/**
 * Wrapped ConversationChain with automatic tracing
 */
class ConversationChain extends (originalLangChain.ConversationChain || class {
}) {
    constructor(...args) {
        super(...args);
        console.log('🔍 FlowScope: ConversationChain initialized with tracing');
    }
    async call(values, callbacks) {
        const sessionId = sdk.getCurrentSessionId();
        const traceId = sdk.generateTraceId();
        sdk.trace('wrapped_conversation', {
            id: traceId,
            sessionId,
            type: 'prompt',
            status: 'pending',
            data: {
                input: values,
                memory: this.memory?.chatHistory || null,
            },
            metadata: {
                framework: 'langchain',
                integration: 'wrapper',
                class: 'ConversationChain',
                method: 'call',
            },
        });
        try {
            const startTime = Date.now();
            const result = await super.call(values, callbacks);
            const duration = Date.now() - startTime;
            sdk.trace('wrapped_conversation', {
                id: traceId,
                sessionId,
                type: 'response',
                status: 'completed',
                data: {
                    input: values,
                    output: result,
                    memory: this.memory?.chatHistory || null,
                },
                metadata: {
                    framework: 'langchain',
                    integration: 'wrapper',
                    class: 'ConversationChain',
                    method: 'call',
                    duration,
                },
            });
            return result;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            const errorStack = error instanceof Error ? error.stack : undefined;
            sdk.trace('wrapped_conversation', {
                id: traceId,
                sessionId,
                type: 'error',
                status: 'failed',
                data: {
                    input: values,
                    error: errorMessage,
                    stack: errorStack,
                },
                metadata: {
                    framework: 'langchain',
                    integration: 'wrapper',
                    class: 'ConversationChain',
                    method: 'call',
                },
            });
            throw error;
        }
    }
}
exports.ConversationChain = ConversationChain;
/**
 * Wrapped RetrievalQAChain with automatic tracing
 */
class RetrievalQAChain extends (originalChains.RetrievalQAChain || class {
}) {
    constructor(...args) {
        super(...args);
        console.log('🔍 FlowScope: RetrievalQAChain initialized with tracing');
    }
    async call(values, callbacks) {
        const sessionId = sdk.getCurrentSessionId();
        const traceId = sdk.generateTraceId();
        sdk.trace('wrapped_retrieval_qa', {
            id: traceId,
            sessionId,
            type: 'prompt',
            status: 'pending',
            data: {
                query: values.query || values.question,
                retriever: this.retriever?.constructor?.name || 'Unknown',
            },
            metadata: {
                framework: 'langchain',
                integration: 'wrapper',
                class: 'RetrievalQAChain',
                method: 'call',
            },
        });
        try {
            const startTime = Date.now();
            const result = await super.call(values, callbacks);
            const duration = Date.now() - startTime;
            sdk.trace('wrapped_retrieval_qa', {
                id: traceId,
                sessionId,
                type: 'response',
                status: 'completed',
                data: {
                    query: values.query || values.question,
                    answer: result.text || result.answer,
                    sourceDocuments: result.sourceDocuments?.length || 0,
                },
                metadata: {
                    framework: 'langchain',
                    integration: 'wrapper',
                    class: 'RetrievalQAChain',
                    method: 'call',
                    duration,
                },
            });
            return result;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            const errorStack = error instanceof Error ? error.stack : undefined;
            sdk.trace('wrapped_retrieval_qa', {
                id: traceId,
                sessionId,
                type: 'error',
                status: 'failed',
                data: {
                    query: values.query || values.question,
                    error: errorMessage,
                    stack: errorStack,
                },
                metadata: {
                    framework: 'langchain',
                    integration: 'wrapper',
                    class: 'RetrievalQAChain',
                    method: 'call',
                },
            });
            throw error;
        }
    }
}
exports.RetrievalQAChain = RetrievalQAChain;
/**
 * Wrapped AgentExecutor with automatic tracing
 */
class AgentExecutor extends (originalAgents.AgentExecutor || class {
}) {
    constructor(...args) {
        super(...args);
        console.log('🔍 FlowScope: AgentExecutor initialized with tracing');
    }
    async call(inputs, callbacks) {
        const sessionId = sdk.getCurrentSessionId();
        const traceId = sdk.generateTraceId();
        sdk.trace('wrapped_agent_executor', {
            id: traceId,
            sessionId,
            type: 'agent_step',
            status: 'pending',
            data: {
                input: inputs.input || inputs,
                tools: this.tools?.map((t) => t.name) || [],
                agent: this.agent?.constructor?.name || 'Unknown',
            },
            metadata: {
                framework: 'langchain',
                integration: 'wrapper',
                class: 'AgentExecutor',
                method: 'call',
            },
        });
        try {
            const startTime = Date.now();
            const result = await super.call(inputs, callbacks);
            const duration = Date.now() - startTime;
            sdk.trace('wrapped_agent_executor', {
                id: traceId,
                sessionId,
                type: 'response',
                status: 'completed',
                data: {
                    input: inputs.input || inputs,
                    output: result.output || result,
                    intermediateSteps: result.intermediateSteps?.length || 0,
                },
                metadata: {
                    framework: 'langchain',
                    integration: 'wrapper',
                    class: 'AgentExecutor',
                    method: 'call',
                    duration,
                },
            });
            return result;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            const errorStack = error instanceof Error ? error.stack : undefined;
            sdk.trace('wrapped_agent_executor', {
                id: traceId,
                sessionId,
                type: 'error',
                status: 'failed',
                data: {
                    input: inputs.input || inputs,
                    error: errorMessage,
                    stack: errorStack,
                },
                metadata: {
                    framework: 'langchain',
                    integration: 'wrapper',
                    class: 'AgentExecutor',
                    method: 'call',
                },
            });
            throw error;
        }
    }
}
exports.AgentExecutor = AgentExecutor;
// Note: LangChain integration is available as an optional peer dependency
// Users can install 'langchain' separately to use advanced features
// Export common LLM classes (most frequently used)
exports.OpenAI = originalLangChain.OpenAI, exports.ChatOpenAI = originalLangChain.ChatOpenAI, exports.LLM = originalLangChain.LLM, exports.BaseLLM = originalLangChain.BaseLLM, exports.BaseLanguageModel = originalLangChain.BaseLanguageModel;
// Export memory classes
exports.BufferMemory = originalLangChain.BufferMemory, exports.ConversationBufferMemory = originalLangChain.ConversationBufferMemory, exports.ConversationBufferWindowMemory = originalLangChain.ConversationBufferWindowMemory, exports.ConversationSummaryMemory = originalLangChain.ConversationSummaryMemory;
// Export prompt templates
exports.PromptTemplate = originalLangChain.PromptTemplate, exports.ChatPromptTemplate = originalLangChain.ChatPromptTemplate, exports.MessagesPlaceholder = originalLangChain.MessagesPlaceholder;
console.log('✅ FlowScope LangChain wrapper loaded - automatic tracing enabled');
