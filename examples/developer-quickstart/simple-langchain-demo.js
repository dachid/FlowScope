#!/usr/bin/env node

/**
 * FlowScope Developer Quickstart - Simple LangChain Integration
 * 
 * This demonstrates how any developer can integrate FlowScope
 * into their existing LangChain application in just 3 steps.
 */

const { FlowScope } = require('@flowscope/sdk');

// Step 1: Initialize FlowScope (one line!)
const flowScope = new FlowScope({
  projectId: 'my-langchain-app',
  debug: true
});

// Step 2: Simulate a typical LangChain application
class MyLangChainApp {
  constructor() {
    console.log('🚀 Starting LangChain Application with FlowScope debugging...');
  }

  async processUserQuery(query, sessionId = 'default') {
    console.log(`\n📝 Processing query: "${query}"`);
    
    // Step 3: Wrap your LangChain operations with FlowScope tracing
    const traceId = await flowScope.startTrace({
      sessionId,
      operation: 'user_query_processing',
      input: { query },
      metadata: { 
        framework: 'langchain',
        model: 'gpt-3.5-turbo',
        timestamp: new Date().toISOString()
      }
    });

    try {
      // Simulate LangChain chain execution steps
      await this.simulateChainStep(traceId, 'prompt_template', { 
        input: query,
        template: 'You are a helpful assistant. Question: {query}'
      });

      await this.simulateChainStep(traceId, 'llm_call', {
        model: 'gpt-3.5-turbo',
        prompt: `You are a helpful assistant. Question: ${query}`,
        temperature: 0.7
      });

      const result = await this.simulateChainStep(traceId, 'response_formatting', {
        rawResponse: `This is a simulated response to: ${query}`,
        format: 'text'
      });

      // End the trace with success
      await flowScope.endTrace(traceId, {
        success: true,
        output: result,
        duration_ms: 1500
      });

      return result;

    } catch (error) {
      // End trace with error
      await flowScope.endTrace(traceId, {
        success: false,
        error: error.message
      });
      throw error;
    }
  }

  async simulateChainStep(parentTraceId, stepName, data) {
    // Each chain step gets its own sub-trace
    const stepTrace = await flowScope.startTrace({
      parentId: parentTraceId,
      operation: stepName,
      input: data
    });

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 200));

    const output = {
      step: stepName,
      processed: true,
      data: data,
      result: `Processed ${stepName} successfully`
    };

    await flowScope.endTrace(stepTrace, {
      success: true,
      output
    });

    console.log(`   ✅ ${stepName} completed`);
    return output;
  }
}

// Demo function to show how it works
async function runDemo() {
  console.log('🔍 FlowScope LangChain Integration Demo');
  console.log('=' .repeat(50));

  const app = new MyLangChainApp();

  // Test different types of queries
  const testQueries = [
    'What is the weather like today?',
    'Explain quantum computing',
    'Help me write a email'
  ];

  for (let i = 0; i < testQueries.length; i++) {
    const query = testQueries[i];
    const sessionId = `demo_session_${i + 1}`;
    
    try {
      const result = await app.processUserQuery(query, sessionId);
      console.log(`✅ Query processed successfully!`);
      console.log(`📊 Check FlowScope dashboard for trace visualization\n`);
    } catch (error) {
      console.error(`❌ Error processing query: ${error.message}\n`);
    }
  }

  console.log('🎉 Demo complete! All traces sent to FlowScope for debugging.');
  console.log('\n📈 What developers see in FlowScope:');
  console.log('   • Real-time trace visualization');
  console.log('   • Step-by-step execution flow');
  console.log('   • Performance metrics for each step');
  console.log('   • Error tracking and debugging info');
  console.log('   • Session isolation for different users');
}

// Export for testing
module.exports = { MyLangChainApp, runDemo };

// Run demo if called directly
if (require.main === module) {
  runDemo().then(() => {
    console.log('\n🔗 Visit FlowScope dashboard to see your traces!');
    process.exit(0);
  }).catch(error => {
    console.error('Demo failed:', error);
    process.exit(1);
  });
}
