/**
 * Auto-Instrumentation Basic Example
 * 
 * This example demonstrates zero-configuration automatic tracing
 * using monkey patching to instrument LangChain components.
 */

// Mock the auto-instrumentation module for demonstration
// In a real implementation, this would be the actual SDK
class MockAutoInstrumentation {
  constructor() {
    this.traces = [];
    this.enabled = false;
    this.config = {};
  }
  
  enable(config = {}) {
    this.enabled = true;
    this.config = { ...this.config, ...config };
    console.log('🤖 Auto-instrumentation enabled');
    console.log('⚙️ Configuration:', this.config);
    
    // Mock monkey patching - in real implementation this would patch actual LangChain classes
    this.patchLangChain();
  }
  
  patchLangChain() {
    // Simulate patching by creating traced versions
    console.log('🔧 Patching LangChain components...');
    console.log('✅ LLMChain patched');
    console.log('✅ ConversationChain patched'); 
    console.log('✅ RetrievalQA patched');
    console.log('✅ AgentExecutor patched');
  }
  
  captureTrace(type, data) {
    if (!this.enabled) return;
    
    const trace = {
      id: `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      timestamp: Date.now(),
      duration: data.duration || 0,
      data,
      sessionId: this.config.sessionId || 'default'
    };
    
    this.traces.push(trace);
    console.log(`📊 Trace captured: ${type} (${trace.duration}ms)`);
    return trace;
  }
  
  getTraces() {
    return [...this.traces];
  }
  
  flush() {
    console.log(`🚀 Flushing ${this.traces.length} traces to backend...`);
    // Simulate backend call
    return new Promise(resolve => {
      setTimeout(() => {
        console.log('✅ Traces flushed successfully');
        resolve();
      }, 100);
    });
  }
}

// Create mock auto-instrumentation instance
const autoInstrumentation = new MockAutoInstrumentation();

// Mock LangChain classes with automatic tracing
class MockLLMChain {
  constructor(config) {
    this.config = config;
    console.log('🔗 LLMChain initialized');
  }
  
  async call(inputs) {
    const startTime = Date.now();
    console.log(`📞 LLMChain.call(): "${inputs.prompt?.substring(0, 50)}..."`);
    
    try {
      // Simulate LLM processing time
      await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
      
      // Simulate potential errors
      if (inputs.prompt?.includes('error')) {
        throw new Error('Simulated LLM error');
      }
      
      const result = {
        text: `AI response to: ${inputs.prompt}`,
        model: this.config.model || 'gpt-3.5-turbo',
        tokens: Math.floor(Math.random() * 150) + 50
      };
      
      // Auto-instrumentation captures this automatically
      const duration = Date.now() - startTime;
      autoInstrumentation.captureTrace('llm_chain_call', {
        inputs,
        result,
        duration,
        model: result.model
      });
      
      return result;
      
    } catch (error) {
      const duration = Date.now() - startTime;
      autoInstrumentation.captureTrace('llm_chain_call', {
        inputs,
        error: error.message,
        duration,
        failed: true
      });
      throw error;
    }
  }
}

class MockConversationChain {
  constructor(config) {
    this.config = config;
    this.memory = [];
    console.log('💬 ConversationChain initialized');
  }
  
  async predict(inputs) {
    const startTime = Date.now();
    console.log(`🗣️ ConversationChain.predict(): "${inputs.input}"`);
    
    try {
      // Add to memory
      this.memory.push({ role: 'user', content: inputs.input });
      
      // Simulate conversation processing
      await new Promise(resolve => setTimeout(resolve, 150 + Math.random() * 100));
      
      const response = `Conversation response to: ${inputs.input}`;
      this.memory.push({ role: 'assistant', content: response });
      
      const duration = Date.now() - startTime;
      autoInstrumentation.captureTrace('conversation_chain_predict', {
        inputs,
        response,
        duration,
        memorySize: this.memory.length
      });
      
      return { response };
      
    } catch (error) {
      const duration = Date.now() - startTime;
      autoInstrumentation.captureTrace('conversation_chain_predict', {
        inputs,
        error: error.message,
        duration,
        failed: true
      });
      throw error;
    }
  }
}

async function runBasicAutoInstrumentationDemo() {
  console.log('🚀 FlowScope Auto-Instrumentation Basic Demo');
  console.log('=' .repeat(50));
  
  // Step 1: Enable auto-instrumentation with configuration
  autoInstrumentation.enable({
    traceAll: true,
    includeArguments: true,
    includeResults: true,
    sessionId: 'basic-demo-session',
    metadata: {
      application: 'basic-demo',
      environment: 'development'
    }
  });
  
  console.log('\n--- Testing LLMChain ---');
  
  // Step 2: Use LangChain normally - tracing happens automatically
  const llmChain = new MockLLMChain({
    model: 'gpt-3.5-turbo',
    temperature: 0.7
  });
  
  const queries = [
    'What is artificial intelligence?',
    'Explain machine learning in simple terms',
    'How does natural language processing work?'
  ];
  
  for (let i = 0; i < queries.length; i++) {
    const query = queries[i];
    console.log(`\n--- Query ${i + 1} ---`);
    
    try {
      const result = await llmChain.call({ prompt: query });
      console.log(`✅ Result: ${result.text.substring(0, 60)}...`);
      console.log(`📊 Tokens used: ${result.tokens}`);
      
    } catch (error) {
      console.log(`❌ Query failed: ${error.message}`);
    }
    
    // Small delay between queries
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  
  console.log('\n--- Testing ConversationChain ---');
  
  // Step 3: Test conversation chain
  const conversationChain = new MockConversationChain({
    memory: { type: 'buffer' }
  });
  
  const conversationInputs = [
    'Hello, my name is John',
    'What is my name?',
    'Can you help me with programming?',
    'Thank you for your help'
  ];
  
  for (let i = 0; i < conversationInputs.length; i++) {
    const input = conversationInputs[i];
    console.log(`\n--- Conversation Turn ${i + 1} ---`);
    
    try {
      const result = await conversationChain.predict({ input });
      console.log(`✅ Response: ${result.response}`);
      
    } catch (error) {
      console.log(`❌ Conversation failed: ${error.message}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  
  // Step 4: Show auto-instrumentation results
  console.log('\n📊 Auto-Instrumentation Results');
  console.log('-' .repeat(50));
  
  const traces = autoInstrumentation.getTraces();
  console.log(`Total traces captured: ${traces.length}`);
  
  // Group traces by type
  const tracesByType = traces.reduce((acc, trace) => {
    acc[trace.type] = (acc[trace.type] || 0) + 1;
    return acc;
  }, {});
  
  console.log('Traces by type:');
  Object.entries(tracesByType).forEach(([type, count]) => {
    console.log(`  ${type}: ${count}`);
  });
  
  // Calculate performance metrics
  const totalDuration = traces.reduce((sum, trace) => sum + (trace.duration || 0), 0);
  const avgDuration = totalDuration / traces.length;
  const errors = traces.filter(trace => trace.data.failed).length;
  
  console.log(`\nPerformance metrics:`);
  console.log(`  Total duration: ${totalDuration}ms`);
  console.log(`  Average duration: ${avgDuration.toFixed(2)}ms`);
  console.log(`  Error rate: ${((errors / traces.length) * 100).toFixed(1)}%`);
  
  // Step 5: Flush traces to backend
  await autoInstrumentation.flush();
  
  console.log('\n🎉 Basic auto-instrumentation demo completed!');
  console.log('💡 Key benefits demonstrated:');
  console.log('  ✅ Zero code changes required');
  console.log('  ✅ Automatic trace capture');
  console.log('  ✅ Comprehensive coverage');
  console.log('  ✅ Performance monitoring');
  
  return {
    tracesCount: traces.length,
    errorRate: (errors / traces.length) * 100,
    avgDuration
  };
}

async function main() {
  try {
    await runBasicAutoInstrumentationDemo();
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

// Export for testing
module.exports = { 
  MockAutoInstrumentation,
  MockLLMChain,
  MockConversationChain,
  runBasicAutoInstrumentationDemo 
};

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}
