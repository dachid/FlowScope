/**
 * Import Replacement Basic Example
 * 
 * This example demonstrates API-compatible wrapper components
 * that provide automatic tracing with identical interfaces.
 */

// Mock import replacement module for demonstration
// In a real implementation, these would be actual wrapped LangChain components

class MockSDKCore {
  constructor() {
    this.traces = [];
    this.sessionId = 'default';
    this.config = {};
  }
  
  configure(config) {
    this.config = { ...this.config, ...config };
    console.log('⚙️ SDK configured:', this.config);
  }
  
  startSession(sessionId, metadata = {}) {
    this.sessionId = sessionId;
    console.log(`🎯 Session started: ${sessionId}`, metadata);
  }
  
  captureTrace(type, data) {
    const trace = {
      id: `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      data
    };
    
    this.traces.push(trace);
    console.log(`📊 Trace captured: ${type}`);
    return trace;
  }
  
  getTraces() {
    return [...this.traces];
  }
  
  async flush() {
    console.log(`🚀 Flushing ${this.traces.length} traces...`);
    await new Promise(resolve => setTimeout(resolve, 100));
    console.log('✅ Traces flushed successfully');
  }
}

// Create shared SDK instance
const flowscope = new MockSDKCore();

// Wrapped LLMChain with automatic tracing
class WrappedLLMChain {
  constructor(config) {
    this.config = config;
    this.traceConfig = config.traceConfig || {};
    console.log('🔗 Wrapped LLMChain initialized');
    
    if (this.traceConfig.sessionId) {
      flowscope.startSession(this.traceConfig.sessionId);
    }
  }
  
  async call(inputs, callOptions = {}) {
    const startTime = Date.now();
    const traceId = `llm_call_${Date.now()}`;
    
    console.log(`📞 LLMChain.call(): "${inputs.prompt?.substring(0, 50)}..."`);
    
    try {
      // Pre-processing with tracing
      if (this.traceConfig.includePrompts) {
        flowscope.captureTrace('prompt_input', {
          prompt: inputs.prompt,
          traceId,
          metadata: callOptions.metadata
        });
      }
      
      // Simulate LLM API call
      await new Promise(resolve => setTimeout(resolve, 120 + Math.random() * 180));
      
      // Simulate potential errors
      if (inputs.prompt?.includes('error')) {
        throw new Error('Simulated API error');
      }
      
      const result = {
        text: `Wrapped LLM response to: ${inputs.prompt}`,
        model: this.config.model || 'gpt-3.5-turbo',
        tokens: Math.floor(Math.random() * 200) + 75,
        confidence: Math.random() * 0.3 + 0.7
      };
      
      const duration = Date.now() - startTime;
      
      // Automatic result tracing
      flowscope.captureTrace('llm_chain_call', {
        traceId,
        inputs: this.traceConfig.includeArgs ? inputs : undefined,
        result: this.traceConfig.includeResults ? result : { tokens: result.tokens },
        duration,
        model: result.model,
        success: true,
        customTags: this.traceConfig.customTags
      });
      
      return result;
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      flowscope.captureTrace('llm_chain_call', {
        traceId,
        inputs: this.traceConfig.includeArgs ? inputs : undefined,
        error: error.message,
        duration,
        success: false,
        customTags: this.traceConfig.customTags
      });
      
      throw error;
    }
  }
  
  // Additional LangChain-compatible methods
  async predict(inputs) {
    return await this.call(inputs);
  }
  
  async batch(inputsList) {
    console.log(`📦 Batch processing ${inputsList.length} inputs`);
    const results = [];
    
    for (let i = 0; i < inputsList.length; i++) {
      try {
        const result = await this.call(inputsList[i], {
          metadata: { batchIndex: i, batchSize: inputsList.length }
        });
        results.push({ success: true, result });
      } catch (error) {
        results.push({ success: false, error: error.message });
      }
    }
    
    return results;
  }
}

// Wrapped ConversationChain with memory and tracing
class WrappedConversationChain {
  constructor(config) {
    this.config = config;
    this.traceConfig = config.traceConfig || {};
    this.memory = [];
    console.log('💬 Wrapped ConversationChain initialized');
    
    if (this.traceConfig.sessionId) {
      flowscope.startSession(this.traceConfig.sessionId);
    }
  }
  
  async predict(inputs, options = {}) {
    const startTime = Date.now();
    const traceId = `conversation_${Date.now()}`;
    
    console.log(`🗣️ ConversationChain.predict(): "${inputs.input}"`);
    
    try {
      // Memory context tracing
      if (this.traceConfig.includeMemory) {
        flowscope.captureTrace('conversation_context', {
          traceId,
          memoryLength: this.memory.length,
          recentHistory: this.memory.slice(-3)
        });
      }
      
      // Add user input to memory
      this.memory.push({
        role: 'user',
        content: inputs.input,
        timestamp: Date.now()
      });
      
      // Simulate conversation processing with context
      await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 150));
      
      const response = `Conversation response considering context: ${inputs.input}`;
      
      // Add assistant response to memory
      this.memory.push({
        role: 'assistant', 
        content: response,
        timestamp: Date.now()
      });
      
      const duration = Date.now() - startTime;
      
      // Trace the complete conversation turn
      flowscope.captureTrace('conversation_turn', {
        traceId,
        input: inputs.input,
        response,
        duration,
        memorySize: this.memory.length,
        conversationFlow: this.traceConfig.trackConversationFlow,
        customTags: this.traceConfig.customTags
      });
      
      return { response };
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      flowscope.captureTrace('conversation_turn', {
        traceId,
        input: inputs.input,
        error: error.message,
        duration,
        success: false
      });
      
      throw error;
    }
  }
  
  getMemory() {
    return [...this.memory];
  }
  
  clearMemory() {
    this.memory = [];
    flowscope.captureTrace('memory_cleared', {
      timestamp: Date.now()
    });
  }
}

// Export wrapped components (API-compatible with LangChain)
const LLMChain = WrappedLLMChain;
const ConversationChain = WrappedConversationChain;

async function runBasicImportReplacementDemo() {
  console.log('🚀 FlowScope Import Replacement Basic Demo');
  console.log('=' .repeat(50));
  
  // Step 1: Configure the wrapper system
  flowscope.configure({
    tracing: {
      enabled: true,
      includeArguments: true,
      includeResults: true,
      sampleRate: 1.0
    },
    metadata: {
      application: 'import-replacement-demo',
      environment: 'development'
    }
  });
  
  console.log('\n--- Testing Wrapped LLMChain ---');
  
  // Step 2: Use wrapped LLMChain with enhanced tracing config
  const llmChain = new LLMChain({
    model: 'gpt-4',
    temperature: 0.8,
    traceConfig: {
      sessionId: 'import-demo-session',
      includePrompts: true,
      includeResults: true,
      includeArgs: true,
      customTags: {
        component: 'llm',
        version: '1.0.0'
      }
    }
  });
  
  const queries = [
    'Explain the benefits of microservices architecture',
    'What are the key principles of clean code?',
    'How do you implement effective error handling?'
  ];
  
  for (let i = 0; i < queries.length; i++) {
    const query = queries[i];
    console.log(`\n--- Query ${i + 1} ---`);
    
    try {
      const result = await llmChain.call({ prompt: query }, {
        metadata: { queryIndex: i, queryType: 'technical' }
      });
      
      console.log(`✅ Result: ${result.text.substring(0, 80)}...`);
      console.log(`📊 Model: ${result.model}, Tokens: ${result.tokens}, Confidence: ${result.confidence.toFixed(2)}`);
      
    } catch (error) {
      console.log(`❌ Query failed: ${error.message}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\n--- Testing Batch Processing ---');
  
  const batchInputs = [
    { prompt: 'What is TypeScript?' },
    { prompt: 'Explain async/await' },
    { prompt: 'What are design patterns?' }
  ];
  
  const batchResults = await llmChain.batch(batchInputs);
  console.log(`📦 Batch completed: ${batchResults.filter(r => r.success).length}/${batchResults.length} successful`);
  
  console.log('\n--- Testing Wrapped ConversationChain ---');
  
  // Step 3: Use wrapped ConversationChain
  const conversationChain = new ConversationChain({
    memory: { type: 'buffer', maxSize: 10 },
    traceConfig: {
      sessionId: 'conversation-demo-session',
      includeMemory: true,
      trackConversationFlow: true,
      customTags: {
        component: 'conversation',
        memoryType: 'buffer'
      }
    }
  });
  
  const conversationTurns = [
    'Hi, I\'m working on a React project',
    'What state management should I use?',
    'Can you explain Redux vs Context API?',
    'Thanks for the explanation!'
  ];
  
  for (let i = 0; i < conversationTurns.length; i++) {
    const input = conversationTurns[i];
    console.log(`\n--- Conversation Turn ${i + 1} ---`);
    
    try {
      const result = await conversationChain.predict({ input });
      console.log(`✅ Response: ${result.response}`);
      
    } catch (error) {
      console.log(`❌ Conversation failed: ${error.message}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 80));
  }
  
  // Step 4: Show import replacement results
  console.log('\n📊 Import Replacement Results');
  console.log('-' .repeat(50));
  
  const traces = flowscope.getTraces();
  console.log(`Total traces captured: ${traces.length}`);
  
  // Analyze traces by type
  const traceAnalysis = traces.reduce((acc, trace) => {
    acc[trace.type] = acc[trace.type] || { count: 0, totalDuration: 0 };
    acc[trace.type].count++;
    acc[trace.type].totalDuration += trace.data.duration || 0;
    return acc;
  }, {});
  
  console.log('\nTrace analysis:');
  Object.entries(traceAnalysis).forEach(([type, stats]) => {
    const avgDuration = stats.totalDuration / stats.count;
    console.log(`  ${type}: ${stats.count} traces, avg ${avgDuration.toFixed(2)}ms`);
  });
  
  // Memory usage analysis
  const memoryTraces = traces.filter(t => t.type === 'conversation_turn');
  if (memoryTraces.length > 0) {
    const finalMemorySize = memoryTraces[memoryTraces.length - 1].data.memorySize;
    console.log(`\nConversation memory: ${finalMemorySize} messages stored`);
  }
  
  // Step 5: Flush traces
  await flowscope.flush();
  
  console.log('\n🎉 Import replacement demo completed!');
  console.log('💡 Key benefits demonstrated:');
  console.log('  ✅ API-compatible with original LangChain');
  console.log('  ✅ Enhanced tracing configuration');
  console.log('  ✅ Automatic instrumentation');
  console.log('  ✅ Type-safe integration');
  
  return {
    tracesCount: traces.length,
    traceTypes: Object.keys(traceAnalysis).length,
    conversationTurns: memoryTraces.length
  };
}

async function main() {
  try {
    await runBasicImportReplacementDemo();
  } catch (error) {
    console.error('❌ Demo failed:', error);
  }
  
  setTimeout(() => {
    process.exit(0);
  }, 1000);
}

// Handle errors gracefully
process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error);
  process.exit(1);
});

// Export for testing and external use
module.exports = { 
  LLMChain,
  ConversationChain,
  flowscope,
  runBasicImportReplacementDemo 
};

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}
