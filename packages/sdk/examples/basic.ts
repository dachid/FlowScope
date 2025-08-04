/**
 * FlowScope SDK Basic Usage Example
 * 
 * This example demonstrates how to integrate FlowScope with LangChain
 * for automatic trace collection and debugging.
 */

import FlowScopeSDK, { 
  LangChainAdapter, 
  ConsoleTransport, 
  MemoryStorage 
} from '@flowscope/sdk';

async function basicExample() {
  // Initialize FlowScope SDK
  const flowscope = new FlowScopeSDK({
    projectId: 'my-project',
    apiEndpoint: 'http://localhost:3000',
    batchSize: 5,
    flushInterval: 3000,
    debug: true,
  });
  
  // Setup console transport for debugging
  const transport = new ConsoleTransport({ pretty: true });
  flowscope.setTransport(transport);
  
  // Setup memory storage
  const storage = new MemoryStorage();
  flowscope.setStorage(storage);
  
  // Initialize the SDK
  await flowscope.init();
  
  // Start a debugging session
  const session = flowscope.startSession('example-session', {
    user: 'developer',
    environment: 'development',
  });
  
  console.log('FlowScope session started:', session.id);
  
  // Manual trace example
  flowscope.trace('manual-chain-1', {
    type: 'prompt',
    data: {
      input: 'What is the capital of France?',
      model: 'gpt-3.5-turbo',
    },
    metadata: {
      source: 'manual',
    },
  });
  
  flowscope.trace('manual-chain-1', {
    type: 'response',
    data: {
      output: 'The capital of France is Paris.',
      tokensUsed: 15,
    },
  });
  
  // If you have LangChain installed, the adapter will automatically
  // capture traces from LangChain executions
  
  // Simulate some work
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // End the session
  flowscope.endSession();
  
  // Shutdown the SDK
  await flowscope.shutdown();
  
  console.log('FlowScope example completed');
}

// LangChain integration example (requires langchain to be installed)
async function langchainExample() {
  try {
    // This will only work if langchain is installed
    const { ChatOpenAI } = await import('langchain/chat_models/openai');
    const { HumanMessage } = await import('langchain/schema');
    
    const flowscope = new FlowScopeSDK({
      projectId: 'langchain-project',
      debug: true,
    });
    
    // Add LangChain adapter manually (though it would be auto-detected)
    const adapter = new LangChainAdapter();
    flowscope.addAdapter(adapter);
    await adapter.integrate();
    
    // Setup transport
    flowscope.setTransport(new ConsoleTransport({ pretty: true }));
    await flowscope.init();
    
    // Start session
    flowscope.startSession('langchain-example');
    
    // Use LangChain - traces will be automatically captured
    const chat = new ChatOpenAI({ 
      openAIApiKey: 'your-api-key-here',
      // The FlowScope adapter will automatically capture all interactions
    });
    
    const response = await chat.call([
      new HumanMessage('Tell me a joke about programming'),
    ]);
    
    console.log('LangChain response:', response);
    
    // Cleanup
    await flowscope.shutdown();
    
  } catch (error) {
    console.log('LangChain not available, skipping LangChain example');
    console.log('Install langchain to try this example: npm install langchain');
  }
}

// Run examples
if (require.main === module) {
  basicExample()
    .then(() => langchainExample())
    .catch(console.error);
}

export { basicExample, langchainExample };
