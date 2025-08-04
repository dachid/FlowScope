// test-app.js - Simple test application to generate live traces
import { FlowScopeSDK } from '@flowscope/sdk';

const sdk = new FlowScopeSDK({
  debug: true,
  autoDetect: true,
  transport: {
    type: 'websocket',
    url: 'ws://localhost:3001/debug'
  }
});

// Start a session
const session = sdk.startSession('live-test-session');

// Simulate a chain of operations
async function simulateAIChain() {
  console.log('🚀 Starting AI chain simulation...');
  
  // Step 1: Input processing
  sdk.trace('input-processing', {
    id: 'step-1',
    type: 'prompt',
    input: { 
      query: 'What is the weather like today?',
      user_id: 'test-user',
      timestamp: new Date().toISOString()
    },
    metadata: {
      model: 'gpt-4',
      temperature: 0.7
    }
  });
  
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Step 2: LLM call
  sdk.trace('llm-call', {
    id: 'step-2',
    type: 'llm',
    input: {
      prompt: 'Generate a weather response',
      model: 'gpt-4'
    },
    output: {
      response: 'The weather today is sunny with a temperature of 72°F.',
      tokens_used: 45,
      cost: 0.002
    },
    metadata: {
      duration_ms: 800,
      provider: 'openai'
    }
  });
  
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Step 3: Response formatting
  sdk.trace('response-formatting', {
    id: 'step-3',
    type: 'output',
    input: {
      raw_response: 'The weather today is sunny with a temperature of 72°F.'
    },
    output: {
      formatted_response: {
        weather: 'sunny',
        temperature: '72°F',
        message: 'The weather today is sunny with a temperature of 72°F.'
      }
    }
  });
  
  console.log('✅ AI chain simulation completed');
}

// Run simulation every 10 seconds
setInterval(simulateAIChain, 10000);

// Run initial simulation
simulateAIChain();

console.log('🎯 Live trace generator started. Traces will be sent to FlowScope every 10 seconds.');
