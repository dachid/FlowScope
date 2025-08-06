/**
 * Enhanced Manual SDK with decorators and simplified API
 * Provides decorator support and context propagation for manual instrumentation
 * 
 * Usage: 
 * - @flowscope.trace decorator
 * - with flowscope.context() context manager
 * - flowscope.trace() manual calls
 */

import { FlowScopeSDK } from '../core/sdk';
import { HTTPTransport, ConsoleTransport } from '../transports';
import { TraceData, TraceEventType, TraceStatus } from '../types';

// Initialize enhanced SDK
const sdk = new FlowScopeSDK({
  autoDetect: false,
  debug: process.env.FLOWSCOPE_DEBUG === 'true',
  batchSize: parseInt(process.env.FLOWSCOPE_BATCH_SIZE || '10'),
  flushInterval: parseInt(process.env.FLOWSCOPE_FLUSH_INTERVAL || '5000'),
});

// Configure transport based on environment
const transportType = process.env.FLOWSCOPE_TRANSPORT || 'http';
let transport;

switch (transportType) {
  case 'console':
    transport = new ConsoleTransport({ pretty: true });
    break;
  case 'http':
  default:
    transport = new HTTPTransport(
      process.env.FLOWSCOPE_ENDPOINT || 'http://localhost:3001',
      {
        timeout: parseInt(process.env.FLOWSCOPE_TIMEOUT || '10000'),
        apiKey: process.env.FLOWSCOPE_API_KEY,
      }
    );
    break;
}

sdk.setTransport(transport);

// Global context stack for nested tracing
const contextStack: Array<{
  traceId: string;
  sessionId: string;
  parentId?: string;
  operation: string;
  startTime: number;
}> = [];

/**
 * Enhanced FlowScope class with decorators and context management
 */
class EnhancedFlowScope {
  private sdk: FlowScopeSDK;
  
  constructor(sdkInstance: FlowScopeSDK) {
    this.sdk = sdkInstance;
  }
  
  /**
   * Initialize the enhanced SDK
   */
  async init(): Promise<void> {
    await this.sdk.init();
    
    // Start default session if none exists
    if (!this.sdk.getCurrentSession()) {
      const sessionId = process.env.FLOWSCOPE_SESSION_ID || `manual-${Date.now()}`;
      this.sdk.startSession(sessionId, {
        manual_instrumentation: true,
        enhanced_sdk: true,
        pid: process.pid,
        node_version: process.version,
      });
    }
  }
  
  /**
   * Method decorator for automatic tracing
   */
  trace(operation?: string, options?: {
    type?: TraceEventType;
    includeArgs?: boolean;
    includeResult?: boolean;
    metadata?: Record<string, any>;
  }) {
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
      const originalMethod = descriptor.value;
      const operationName = operation || `${target.constructor.name}.${propertyKey}`;
      
      descriptor.value = async function (...args: any[]) {
        const sessionId = sdk.getCurrentSessionId();
        const traceId = sdk.generateTraceId();
        const parentId = contextStack.length > 0 ? contextStack[contextStack.length - 1].traceId : undefined;
        
        // Push context
        contextStack.push({
          traceId,
          sessionId,
          parentId,
          operation: operationName,
          startTime: Date.now(),
        });
        
        // Start trace
        sdk.trace('method_call', {
          id: traceId,
          sessionId,
          parentId,
          type: options?.type || 'function_call',
          status: 'pending',
          data: {
            operation: operationName,
            class: target.constructor.name,
            method: propertyKey,
            args: options?.includeArgs ? args : `[${args.length} arguments]`,
          },
          metadata: {
            enhanced_sdk: true,
            decorator: true,
            ...options?.metadata,
          },
        });
        
        try {
          const startTime = Date.now();
          const result = await originalMethod.apply(this, args);
          const duration = Date.now() - startTime;
          
          // Complete trace
          sdk.trace('method_call', {
            id: traceId,
            sessionId,
            parentId,
            type: 'response',
            status: 'completed',
            data: {
              operation: operationName,
              result: options?.includeResult ? result : '[result hidden]',
            },
            metadata: {
              enhanced_sdk: true,
              decorator: true,
              duration,
              ...options?.metadata,
            },
          });
          
          return result;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          const errorStack = error instanceof Error ? error.stack : undefined;
          
          sdk.trace('method_call', {
            id: traceId,
            sessionId,
            parentId,
            type: 'error',
            status: 'failed',
            data: {
              operation: operationName,
              error: errorMessage,
              stack: errorStack,
            },
            metadata: {
              enhanced_sdk: true,
              decorator: true,
              ...options?.metadata,
            },
          });
          
          throw error;
        } finally {
          // Pop context
          contextStack.pop();
        }
      };
      
      return descriptor;
    };
  }
  
  /**
   * Context manager for manual tracing blocks
   */
  context(operation: string, options?: {
    sessionId?: string;
    type?: TraceEventType;
    metadata?: Record<string, any>;
  }) {
    const sessionId = options?.sessionId || this.sdk.getCurrentSessionId();
    const traceId = this.sdk.generateTraceId();
    const parentId = contextStack.length > 0 ? contextStack[contextStack.length - 1].traceId : undefined;
    
    // Push context
    contextStack.push({
      traceId,
      sessionId,
      parentId,
      operation,
      startTime: Date.now(),
    });
    
    // Start trace
    this.sdk.trace('context_block', {
      id: traceId,
      sessionId,
      parentId,
      type: options?.type || 'prompt',
      status: 'pending',
      data: {
        operation,
        context: 'manual',
      },
      metadata: {
        enhanced_sdk: true,
        context_manager: true,
        ...options?.metadata,
      },
    });
    
    return {
      /**
       * Complete the context successfully
       */
      complete: (data?: any, metadata?: Record<string, any>) => {
        const context = contextStack.pop();
        if (context) {
          const duration = Date.now() - context.startTime;
          
          this.sdk.trace('context_block', {
            id: context.traceId,
            sessionId: context.sessionId,
            parentId: context.parentId,
            type: 'response',
            status: 'completed',
            data: {
              operation: context.operation,
              result: data,
            },
            metadata: {
              enhanced_sdk: true,
              context_manager: true,
              duration,
              ...metadata,
            },
          });
        }
      },
      
      /**
       * Complete the context with error
       */
      error: (error: Error | string, metadata?: Record<string, any>) => {
        const context = contextStack.pop();
        if (context) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          const errorStack = error instanceof Error ? error.stack : undefined;
          
          this.sdk.trace('context_block', {
            id: context.traceId,
            sessionId: context.sessionId,
            parentId: context.parentId,
            type: 'error',
            status: 'failed',
            data: {
              operation: context.operation,
              error: errorMessage,
              stack: errorStack,
            },
            metadata: {
              enhanced_sdk: true,
              context_manager: true,
              ...metadata,
            },
          });
        }
      },
      
      /**
       * Add intermediate step to the trace
       */
      step: (stepName: string, data?: any, metadata?: Record<string, any>) => {
        const context = contextStack[contextStack.length - 1];
        if (context) {
          const stepId = this.sdk.generateTraceId();
          
          this.sdk.trace('context_step', {
            id: stepId,
            sessionId: context.sessionId,
            parentId: context.traceId,
            type: 'function_call',
            status: 'completed',
            data: {
              step: stepName,
              data,
            },
            metadata: {
              enhanced_sdk: true,
              context_step: true,
              parent_operation: context.operation,
              ...metadata,
            },
          });
        }
      },
      
      /**
       * Get current trace context info
       */
      getContext: () => {
        const context = contextStack[contextStack.length - 1];
        return context ? {
          traceId: context.traceId,
          sessionId: context.sessionId,
          parentId: context.parentId,
          operation: context.operation,
        } : null;
      },
    };
  }
  
  /**
   * Simple manual trace function
   */
  manual(operation: string, data: any, options?: {
    sessionId?: string;
    type?: TraceEventType;
    status?: TraceStatus;
    metadata?: Record<string, any>;
  }): void {
    const sessionId = options?.sessionId || this.sdk.getCurrentSessionId();
    const traceId = this.sdk.generateTraceId();
    const parentId = contextStack.length > 0 ? contextStack[contextStack.length - 1].traceId : undefined;
    
    this.sdk.trace('manual_trace', {
      id: traceId,
      sessionId,
      parentId,
      type: options?.type || 'prompt',
      status: options?.status || 'completed',
      data: {
        operation,
        ...data,
      },
      metadata: {
        enhanced_sdk: true,
        manual_trace: true,
        ...options?.metadata,
      },
    });
  }
  
  /**
   * Start a new session
   */
  startSession(sessionId?: string, metadata?: Record<string, any>) {
    return this.sdk.startSession(sessionId, {
      enhanced_sdk: true,
      ...metadata,
    });
  }
  
  /**
   * End current session
   */
  endSession() {
    return this.sdk.endSession();
  }
  
  /**
   * Get current session info
   */
  getCurrentSession() {
    return this.sdk.getCurrentSession();
  }
  
  /**
   * Flush traces immediately
   */
  async flush() {
    return this.sdk.flush();
  }
  
  /**
   * Get all traces
   */
  getTraces() {
    return this.sdk.getTraces();
  }
  
  /**
   * Clear all traces
   */
  clearTraces() {
    return this.sdk.clearTraces();
  }
}

// Create enhanced instance
const flowscope = new EnhancedFlowScope(sdk);

// Auto-initialize
flowscope.init().catch(console.error);

// Export enhanced instance
export default flowscope;
export { flowscope };

// Export underlying SDK for advanced usage
export { sdk };

// Example usage documentation
export const examples = {
  decorator: `
// Class method decoration
class LLMService {
  @flowscope.trace('llm_call', { includeArgs: true, includeResult: true })
  async callLLM(prompt: string) {
    // Your LLM call here
    return await openai.completions.create({ prompt });
  }
}
  `,
  
  context: `
// Context manager usage
const ctx = flowscope.context('custom_chain', { type: 'prompt' });
try {
  ctx.step('prepare_prompt', { prompt: 'Hello' });
  const result = await someOperation();
  ctx.step('process_result', { result });
  ctx.complete(result);
} catch (error) {
  ctx.error(error);
}
  `,
  
  manual: `
// Simple manual tracing
flowscope.manual('user_action', {
  action: 'submit_query',
  query: 'What is the weather?',
  user_id: 'user123'
}, { type: 'prompt' });
  `,
};

console.log('✅ FlowScope Enhanced Manual SDK loaded - decorators and context management enabled');
console.log('💡 Usage examples available at flowscope.examples');
