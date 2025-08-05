/**
 * Enhanced Manual SDK Example - Functional Decorator Usage
 * 
 * This example shows how to use FlowScope functional decorators for
 * automatic method tracing with fine-grained control.
 * 
 * Note: This uses functional decorator application since Node.js doesn't
 * natively support decorator syntax. In a real implementation with
 * Babel or TypeScript, you would use @decorator syntax.
 */

// Mock enhanced manual SDK for demonstration
// In a real implementation, this would be the actual enhanced SDK

class MockEnhancedSDK {
  constructor() {
    this.traces = [];
    this.config = {};
    this.contextStack = [];
  }
  
  configure(config) {
    this.config = { ...this.config, ...config };
    console.log('⚙️ Enhanced SDK configured:', this.config);
  }
  
  // Decorator factory for method tracing
  trace(operationType, options = {}) {
    return (target, propertyName, descriptor) => {
      const originalMethod = descriptor.value;
      
      descriptor.value = async function(...args) {
        const startTime = Date.now();
        const traceId = `${operationType}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        
        console.log(`🎯 @trace decorator: ${operationType} started`);
        
        try {
          // Capture input if configured
          let traceData = {
            traceId,
            operationType,
            timestamp: startTime,
            metadata: options.metadata || {}
          };
          
          if (options.includeArgs) {
            traceData.inputs = args;
          }
          
          // Execute the original method
          const result = await originalMethod.apply(this, args);
          
          // Capture result if configured
          const duration = Date.now() - startTime;
          traceData.duration = duration;
          traceData.success = true;
          
          if (options.includeResult) {
            traceData.result = result;
          }
          
          // Store the trace
          flowscope.traces.push(traceData);
          console.log(`✅ @trace decorator: ${operationType} completed (${duration}ms)`);
          
          return result;
          
        } catch (error) {
          const duration = Date.now() - startTime;
          
          flowscope.traces.push({
            traceId,
            operationType,
            timestamp: startTime,
            duration,
            success: false,
            error: error.message,
            metadata: options.metadata || {}
          });
          
          console.log(`❌ @trace decorator: ${operationType} failed (${duration}ms)`);
          throw error;
        }
      };
      
      return descriptor;
    };
  }
  
  // Context manager for nested operations
  async withContext(contextName, metadata, fn) {
    const contextId = `ctx_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const startTime = Date.now();
    
    console.log(`🔄 Context started: ${contextName}`);
    
    // Create span object for the context function
    const span = {
      contextId,
      contextName,
      metadata: { ...metadata },
      tags: {},
      
      setTag(key, value) {
        this.tags[key] = value;
        console.log(`🏷️ Context tag set: ${key} = ${value}`);
      },
      
      setResult(result) {
        this.result = result;
        console.log(`📊 Context result set:`, result);
      }
    };
    
    // Add to context stack
    this.contextStack.push(span);
    
    try {
      const result = await fn(span);
      
      const duration = Date.now() - startTime;
      
      // Capture context trace
      this.traces.push({
        traceId: contextId,
        operationType: 'context_execution',
        contextName,
        timestamp: startTime,
        duration,
        success: true,
        metadata,
        tags: span.tags,
        result: span.result || result,
        depth: this.contextStack.length
      });
      
      console.log(`✅ Context completed: ${contextName} (${duration}ms)`);
      return result;
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.traces.push({
        traceId: contextId,
        operationType: 'context_execution',
        contextName,
        timestamp: startTime,
        duration,
        success: false,
        error: error.message,
        metadata,
        depth: this.contextStack.length
      });
      
      console.log(`❌ Context failed: ${contextName} (${duration}ms)`);
      throw error;
      
    } finally {
      // Remove from context stack
      this.contextStack.pop();
    }
  }
  
  getTraces() {
    return [...this.traces];
  }
  
  async flush() {
    console.log(`🚀 Flushing ${this.traces.length} enhanced traces...`);
    await new Promise(resolve => setTimeout(resolve, 100));
    console.log('✅ Enhanced traces flushed successfully');
  }
}

// Create enhanced SDK instance
const flowscope = new MockEnhancedSDK();

// Example service class using functional decorators
class LLMService {
  constructor() {
    this.model = 'gpt-3.5-turbo';
    console.log('🤖 LLMService initialized');
    
    // Apply decorators functionally since Node.js doesn't support decorator syntax natively
    this.callLLM = flowscope.trace('llm_call', { 
      includeArgs: true, 
      includeResult: true,
      metadata: { service: 'openai' }
    })(this, 'callLLM', { value: this.callLLM }).value;
    
    this.preparePrompt = flowscope.trace('prompt_preparation', { 
      includeArgs: true,
      metadata: { component: 'preprocessing' }
    })(this, 'preparePrompt', { value: this.preparePrompt }).value;
    
    this.processResponse = flowscope.trace('response_processing', { 
      includeResult: true,
      metadata: { component: 'postprocessing' }
    })(this, 'processResponse', { value: this.processResponse }).value;
  }
  
  // Note: In a real implementation with Babel/TypeScript, you would use:
  // @flowscope.trace('llm_call', { includeArgs: true, includeResult: true })
  async callLLM(prompt, options = {}) {
    console.log(`📝 Calling LLM with prompt: "${prompt}"`);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
    
    // Simulate different response types
    if (prompt.includes('error')) {
      throw new Error('Simulated LLM API error');
    }
    
    return {
      text: `Response to: ${prompt}`,
      model: this.model,
      tokens: Math.floor(Math.random() * 100) + 50
    };
  }
  
  // Note: In a real implementation with Babel/TypeScript, you would use:
  // @flowscope.trace('prompt_preparation', { includeArgs: true })
  async preparePrompt(userInput, context = {}) {
    console.log(`🔧 Preparing prompt for input: "${userInput}"`);
    
    // Simulate prompt engineering
    await new Promise(resolve => setTimeout(resolve, 50));
    
    const systemPrompt = "You are a helpful AI assistant.";
    const enhancedPrompt = `${systemPrompt}\n\nContext: ${JSON.stringify(context)}\n\nUser: ${userInput}`;
    
    return enhancedPrompt;
  }
  
  // Note: In a real implementation with Babel/TypeScript, you would use:
  // @flowscope.trace('response_processing', { includeResult: true })
  async processResponse(response) {
    console.log('⚙️ Processing LLM response');
    
    // Simulate response processing
    await new Promise(resolve => setTimeout(resolve, 30));
    
    return {
      ...response,
      processed: true,
      timestamp: Date.now()
    };
  }
}

// Example workflow class
class ConversationWorkflow {
  constructor() {
    this.llmService = new LLMService();
    this.conversationHistory = [];
    
    // Apply decorator functionally
    this.handleUserInput = flowscope.trace('conversation_turn', { 
      includeArgs: true,
      includeResult: true,
      metadata: { workflow: 'conversation' }
    })(this, 'handleUserInput', { value: this.handleUserInput }).value;
  }
  
  // Note: In a real implementation with Babel/TypeScript, you would use:
  // @flowscope.trace('conversation_turn', { includeArgs: true, includeResult: true })
  async handleUserInput(userInput, userId = 'anonymous') {
    console.log(`\n💬 Handling conversation turn for user: ${userId}`);
    
    try {
      // Step 1: Prepare prompt with context
      const context = {
        history: this.conversationHistory.slice(-5), // Last 5 messages
        userId
      };
      
      const prompt = await this.llmService.preparePrompt(userInput, context);
      
      // Step 2: Call LLM
      const llmResponse = await this.llmService.callLLM(prompt);
      
      // Step 3: Process response
      const processedResponse = await this.llmService.processResponse(llmResponse);
      
      // Step 4: Update conversation history
      this.conversationHistory.push(
        { role: 'user', content: userInput, timestamp: Date.now() },
        { role: 'assistant', content: processedResponse.text, timestamp: Date.now() }
      );
      
      return processedResponse;
      
    } catch (error) {
      console.error(`❌ Error in conversation turn: ${error.message}`);
      throw error;
    }
  }
}

async function main() {
  console.log('🚀 Starting Enhanced Manual SDK - Decorator Example');
  
  // Configure the enhanced SDK
  flowscope.configure({
    defaultSessionId: 'decorator-demo-session',
    includeStackTrace: false,
    metadata: {
      application: 'decorator-demo',
      environment: 'development'
    }
  });
  
  // Initialize workflow
  const workflow = new ConversationWorkflow();
  
  // Example conversation turns
  const testInputs = [
    "Hello, how are you?",
    "What's the weather like?",
    "Tell me a joke",
    "Please generate an error", // This will trigger error tracing
    "Thank you!"
  ];
  
  for (let i = 0; i < testInputs.length; i++) {
    const input = testInputs[i];
    console.log(`\n--- Turn ${i + 1} ---`);
    
    try {
      const response = await workflow.handleUserInput(input, `user_${i + 1}`);
      console.log(`✅ Response: ${response.text}`);
      
    } catch (error) {
      console.log(`❌ Error handled: ${error.message}`);
    }
    
    // Small delay between turns
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\n🎉 Functional decorator example completed');
  console.log('💡 All methods were automatically traced with functional decorators');
  console.log('💡 In production, you would use @decorator syntax with Babel/TypeScript');
  console.log(`📊 Conversation history: ${workflow.conversationHistory.length} messages`);
  
  // Show trace summary
  console.log('\n📈 Trace Summary:');
  const traces = flowscope.getTraces();
  console.log(`Total traces captured: ${traces.length}`);
  
  const tracesByType = traces.reduce((acc, trace) => {
    acc[trace.operationType] = (acc[trace.operationType] || 0) + 1;
    return acc;
  }, {});
  
  Object.entries(tracesByType).forEach(([type, count]) => {
    console.log(`  ${type}: ${count} traces`);
  });
  
  // Show performance analysis
  const avgDuration = traces.reduce((sum, t) => sum + (t.duration || 0), 0) / traces.length;
  const errors = traces.filter(t => !t.success).length;
  
  console.log('\n📊 Performance Analysis:');
  console.log(`Average trace duration: ${avgDuration.toFixed(2)}ms`);
  console.log(`Success rate: ${(((traces.length - errors) / traces.length) * 100).toFixed(1)}%`);
  
  // Flush traces
  console.log('\n🚀 Flushing traces to backend...');
  await flowscope.flush();
  
  setTimeout(() => {
    process.exit(0);
  }, 1000);
}

// Handle errors gracefully
process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error);
  process.exit(1);
});

// Export for testing
module.exports = {
  MockEnhancedSDK,
  LLMService,
  ConversationWorkflow,
  flowscope
};

// Run the example
if (require.main === module) {
  main().catch(console.error);
}
