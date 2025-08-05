/**
 * Pre-wrapped LangChain module replacement
 * Provides identical API to LangChain but with automatic tracing
 * 
 * Usage: const { LLMChain } = require('@flowscope/langchain');
 */

import { FlowScopeSDK } from '../core/sdk';
import { HTTPTransport } from '../transports';

// Initialize SDK
const sdk = new FlowScopeSDK({
  autoDetect: false, // Manual control for wrapper approach
  debug: process.env.FLOWSCOPE_DEBUG === 'true',
});

// Configure transport
const transport = new HTTPTransport(
  process.env.FLOWSCOPE_ENDPOINT || 'http://localhost:3001',
  { timeout: 10000 }
);
sdk.setTransport(transport);

// Initialize SDK
sdk.init().catch(console.error);

// Start default session
sdk.startSession(`wrapper-${Date.now()}`, {
  wrapper_mode: true,
  pid: process.pid,
});

// Import original LangChain modules (optional peer dependency)
let originalLangChain: any = {};
let originalChains: any = {};
let originalAgents: any = {};

// Use dynamic loading to avoid TypeScript compilation errors for optional dependencies
const loadLangChainModule = (moduleName: string) => {
  try {
    // @ts-ignore - Optional peer dependency
    return (eval('require')(moduleName) as any);
  } catch (error) {
    return {};
  }
};

try {
  originalLangChain = loadLangChainModule('langchain');
} catch (error) {
  console.warn('⚠️ FlowScope: LangChain not found, wrapper disabled');
  originalLangChain = {};
}

try {
  originalChains = loadLangChainModule('langchain/chains');
} catch (error) {
  originalChains = {};
}

try {
  originalAgents = loadLangChainModule('langchain/agents');
} catch (error) {
  originalAgents = {};
}

/**
 * Wrapped LLMChain with automatic tracing
 */
export class LLMChain extends (originalLangChain.LLMChain || class {}) {
  constructor(...args: any[]) {
    super(...args);
    console.log('🔍 FlowScope: LLMChain initialized with tracing');
  }
  
  async call(values: any, callbacks?: any): Promise<any> {
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
        prompt: (this as any).prompt?.template || 'Unknown prompt',
        llm: (this as any).llm?.constructor?.name || 'Unknown LLM',
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
    } catch (error) {
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
  
  async run(input: any, callbacks?: any): Promise<any> {
    const sessionId = sdk.getCurrentSessionId();
    const traceId = sdk.generateTraceId();
    
    sdk.trace('wrapped_llm_chain_run', {
      id: traceId,
      sessionId,
      type: 'prompt',
      status: 'pending',
      data: {
        input,
        prompt: (this as any).prompt?.template || 'Unknown prompt',
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
    } catch (error) {
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

/**
 * Wrapped ConversationChain with automatic tracing
 */
export class ConversationChain extends (originalLangChain.ConversationChain || class {}) {
  constructor(...args: any[]) {
    super(...args);
    console.log('🔍 FlowScope: ConversationChain initialized with tracing');
  }
  
  async call(values: any, callbacks?: any): Promise<any> {
    const sessionId = sdk.getCurrentSessionId();
    const traceId = sdk.generateTraceId();
    
    sdk.trace('wrapped_conversation', {
      id: traceId,
      sessionId,
      type: 'prompt',
      status: 'pending',
      data: {
        input: values,
        memory: (this as any).memory?.chatHistory || null,
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
          memory: (this as any).memory?.chatHistory || null,
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
    } catch (error) {
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

/**
 * Wrapped RetrievalQAChain with automatic tracing
 */
export class RetrievalQAChain extends (originalChains.RetrievalQAChain || class {}) {
  constructor(...args: any[]) {
    super(...args);
    console.log('🔍 FlowScope: RetrievalQAChain initialized with tracing');
  }
  
  async call(values: any, callbacks?: any): Promise<any> {
    const sessionId = sdk.getCurrentSessionId();
    const traceId = sdk.generateTraceId();
    
    sdk.trace('wrapped_retrieval_qa', {
      id: traceId,
      sessionId,
      type: 'prompt',
      status: 'pending',
      data: {
        query: values.query || values.question,
        retriever: (this as any).retriever?.constructor?.name || 'Unknown',
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
    } catch (error) {
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

/**
 * Wrapped AgentExecutor with automatic tracing
 */
export class AgentExecutor extends (originalAgents.AgentExecutor || class {}) {
  constructor(...args: any[]) {
    super(...args);
    console.log('🔍 FlowScope: AgentExecutor initialized with tracing');
  }
  
  async call(inputs: any, callbacks?: any): Promise<any> {
    const sessionId = sdk.getCurrentSessionId();
    const traceId = sdk.generateTraceId();
    
    sdk.trace('wrapped_agent_executor', {
      id: traceId,
      sessionId,
      type: 'agent_step',
      status: 'pending',
      data: {
        input: inputs.input || inputs,
        tools: (this as any).tools?.map((t: any) => t.name) || [],
        agent: (this as any).agent?.constructor?.name || 'Unknown',
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
    } catch (error) {
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

// Export SDK instance for advanced usage
export { sdk as flowscope };

// Note: LangChain integration is available as an optional peer dependency
// Users can install 'langchain' separately to use advanced features

// Export common LLM classes (most frequently used)
export const {
  OpenAI,
  ChatOpenAI,
  LLM,
  BaseLLM,
  BaseLanguageModel,
} = originalLangChain;

// Export memory classes
export const {
  BufferMemory,
  ConversationBufferMemory,
  ConversationBufferWindowMemory,
  ConversationSummaryMemory,
} = originalLangChain;

// Export prompt templates
export const {
  PromptTemplate,
  ChatPromptTemplate,
  MessagesPlaceholder,
} = originalLangChain;

console.log('✅ FlowScope LangChain wrapper loaded - automatic tracing enabled');
