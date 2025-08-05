/**
 * Auto-instrumentation for LangChain - Zero configuration approach
 * Simply require this module to automatically trace all LangChain operations
 * 
 * Usage: require('@flowscope/auto-langchain');
 */

import { FlowScopeSDK } from '../core/sdk';
import { LangChainAdapter } from '../adapters/langchain';
import { HTTPTransport } from '../transports';

// Initialize SDK with default configuration
const sdk = new FlowScopeSDK({
  autoDetect: true,
  debug: process.env.FLOWSCOPE_DEBUG === 'true',
});

// Configure transport
const transport = new HTTPTransport(
  process.env.FLOWSCOPE_ENDPOINT || 'http://localhost:3001',
  {
    timeout: 10000,
  }
);

sdk.setTransport(transport);

// Global references to original modules
let originalLangChain: any = null;
let isPatched = false;

/**
 * Monkey patch LangChain modules
 */
function patchLangChain() {
  if (isPatched) return;
  
  try {
    // Try to require LangChain using dynamic loading
    // @ts-ignore - Optional peer dependency
    const langchain = (eval('require')('langchain') as any);
    originalLangChain = { ...langchain };
    
    // Patch key classes
    patchLLMChain(langchain);
    patchConversationChain(langchain);
    patchRetrievalQA(langchain);
    patchAgentExecutor(langchain);
    
    isPatched = true;
    console.log('🔍 FlowScope: Auto-instrumentation enabled for LangChain');
    
  } catch (error) {
    // LangChain not found, try alternative imports
    try {
      patchModularLangChain();
    } catch (altError) {
      console.warn('⚠️ FlowScope: LangChain not detected, auto-instrumentation disabled');
    }
  }
}

/**
 * Patch LLMChain class
 */
function patchLLMChain(langchain: any) {
  if (!langchain.LLMChain) return;
  
  const OriginalLLMChain = langchain.LLMChain;
  
  class FlowScopeLLMChain extends OriginalLLMChain {
    async call(values: any, callbacks?: any): Promise<any> {
      const sessionId = sdk.getCurrentSessionId();
      const traceId = sdk.generateTraceId();
      
      // Start trace
      sdk.trace('llm_chain_call', {
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
          class: 'LLMChain',
          method: 'call',
          auto_instrumented: true,
        },
      });
      
      try {
        const startTime = Date.now();
        const result = await super.call(values, callbacks);
        const duration = Date.now() - startTime;
        
        // Update trace with success
        sdk.trace('llm_chain_call', {
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
            class: 'LLMChain',
            method: 'call',
            duration,
            auto_instrumented: true,
          },
        });
        
        return result;
      } catch (error) {
        // Update trace with error
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : undefined;
        
        sdk.trace('llm_chain_call', {
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
            class: 'LLMChain',
            method: 'call',
            auto_instrumented: true,
          },
        });
        
        throw error;
      }
    }
    
    async run(input: any, callbacks?: any): Promise<any> {
      const sessionId = sdk.getCurrentSessionId();
      const traceId = sdk.generateTraceId();
      
      sdk.trace('llm_chain_run', {
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
          class: 'LLMChain',
          method: 'run',
          auto_instrumented: true,
        },
      });
      
      try {
        const startTime = Date.now();
        const result = await super.run(input, callbacks);
        const duration = Date.now() - startTime;
        
        sdk.trace('llm_chain_run', {
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
            class: 'LLMChain',
            method: 'run',
            duration,
            auto_instrumented: true,
          },
        });
        
        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : undefined;
        
        sdk.trace('llm_chain_run', {
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
            class: 'LLMChain',
            method: 'run',
            auto_instrumented: true,
          },
        });
        
        throw error;
      }
    }
  }
  
  // Replace the original class
  langchain.LLMChain = FlowScopeLLMChain;
}

/**
 * Patch ConversationChain class
 */
function patchConversationChain(langchain: any) {
  if (!langchain.ConversationChain) return;
  
  const OriginalConversationChain = langchain.ConversationChain;
  
  class FlowScopeConversationChain extends OriginalConversationChain {
    async call(values: any, callbacks?: any): Promise<any> {
      const sessionId = sdk.getCurrentSessionId();
      const traceId = sdk.generateTraceId();
      
      sdk.trace('conversation_chain', {
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
          class: 'ConversationChain',
          method: 'call',
          auto_instrumented: true,
        },
      });
      
      try {
        const startTime = Date.now();
        const result = await super.call(values, callbacks);
        const duration = Date.now() - startTime;
        
        sdk.trace('conversation_chain', {
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
            class: 'ConversationChain',
            method: 'call',
            duration,
            auto_instrumented: true,
          },
        });
        
        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : undefined;
        
        sdk.trace('conversation_chain', {
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
            class: 'ConversationChain',
            method: 'call',
            auto_instrumented: true,
          },
        });
        
        throw error;
      }
    }
  }
  
  langchain.ConversationChain = FlowScopeConversationChain;
}

/**
 * Patch RetrievalQA chain
 */
function patchRetrievalQA(langchain: any) {
  // Try different possible import paths
  const retrievalPaths = [
    'langchain/chains',
    'langchain/chains/retrieval_qa',
  ];
  
  for (const path of retrievalPaths) {
    try {
      const retrieval = require(path);
      if (retrieval.RetrievalQAChain) {
        patchRetrievalQAChain(retrieval);
        break;
      }
    } catch (error) {
      // Continue to next path
    }
  }
}

function patchRetrievalQAChain(retrieval: any) {
  const OriginalRetrievalQA = retrieval.RetrievalQAChain;
  
  class FlowScopeRetrievalQA extends OriginalRetrievalQA {
    async call(values: any, callbacks?: any): Promise<any> {
      const sessionId = sdk.getCurrentSessionId();
      const traceId = sdk.generateTraceId();
      
      sdk.trace('retrieval_qa', {
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
          class: 'RetrievalQAChain',
          method: 'call',
          auto_instrumented: true,
        },
      });
      
      try {
        const startTime = Date.now();
        const result = await super.call(values, callbacks);
        const duration = Date.now() - startTime;
        
        sdk.trace('retrieval_qa', {
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
            class: 'RetrievalQAChain',
            method: 'call',
            duration,
            auto_instrumented: true,
          },
        });
        
        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : undefined;
        
        sdk.trace('retrieval_qa', {
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
            class: 'RetrievalQAChain',
            method: 'call',
            auto_instrumented: true,
          },
        });
        
        throw error;
      }
    }
  }
  
  retrieval.RetrievalQAChain = FlowScopeRetrievalQA;
}

/**
 * Patch AgentExecutor
 */
function patchAgentExecutor(langchain: any) {
  // Try to find AgentExecutor
  try {
    // @ts-ignore - Optional peer dependency
    const agents = (eval('require')('langchain/agents') as any);
    if (agents.AgentExecutor) {
      patchAgentExecutorClass(agents);
    }
  } catch (error) {
    // Try alternative path
    try {
      if (langchain.AgentExecutor) {
        patchAgentExecutorClass(langchain);
      }
    } catch (altError) {
      // AgentExecutor not found
    }
  }
}

function patchAgentExecutorClass(module: any) {
  const OriginalAgentExecutor = module.AgentExecutor;
  
  class FlowScopeAgentExecutor extends OriginalAgentExecutor {
    async call(inputs: any, callbacks?: any): Promise<any> {
      const sessionId = sdk.getCurrentSessionId();
      const traceId = sdk.generateTraceId();
      
      sdk.trace('agent_executor', {
        id: traceId,
        sessionId,
        type: 'agent_step',
        status: 'pending',
        data: {
          input: inputs.input || inputs,
          tools: this.tools?.map((t: any) => t.name) || [],
          agent: this.agent?.constructor?.name || 'Unknown',
        },
        metadata: {
          framework: 'langchain',
          class: 'AgentExecutor',
          method: 'call',
          auto_instrumented: true,
        },
      });
      
      try {
        const startTime = Date.now();
        const result = await super.call(inputs, callbacks);
        const duration = Date.now() - startTime;
        
        sdk.trace('agent_executor', {
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
            class: 'AgentExecutor',
            method: 'call',
            duration,
            auto_instrumented: true,
          },
        });
        
        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : undefined;
        
        sdk.trace('agent_executor', {
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
            class: 'AgentExecutor',
            method: 'call',
            auto_instrumented: true,
          },
        });
        
        throw error;
      }
    }
  }
  
  module.AgentExecutor = FlowScopeAgentExecutor;
}

/**
 * Handle modular LangChain imports (newer versions)
 */
function patchModularLangChain() {
  // Try patching individual modules
  const modules = [
    '@langchain/core/chains',
    '@langchain/core/agents',
    '@langchain/community/chains',
  ];
  
  modules.forEach(modulePath => {
    try {
      const module = require(modulePath);
      if (module.LLMChain) patchLLMChain(module);
      if (module.ConversationChain) patchConversationChain(module);
      if (module.RetrievalQAChain) patchRetrievalQAChain(module);
      if (module.AgentExecutor) patchAgentExecutorClass(module);
    } catch (error) {
      // Module not found, continue
    }
  });
}

/**
 * Initialize SDK and start auto-instrumentation
 */
async function initialize() {
  try {
    await sdk.init();
    
    // Start a default session
    const sessionId = process.env.FLOWSCOPE_SESSION_ID || `auto-${Date.now()}`;
    sdk.startSession(sessionId, {
      auto_instrumentation: true,
      pid: process.pid,
      node_version: process.version,
    });
    
    // Apply patches
    patchLangChain();
    
  } catch (error) {
    console.error('FlowScope auto-instrumentation failed:', error);
  }
}

// Auto-initialize
initialize();

// Export SDK instance for manual control if needed
export { sdk as flowscope };
export default sdk;
