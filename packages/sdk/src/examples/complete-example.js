"use strict";
/**
 * Complete FlowScope SDK Example
 *
 * This example demonstrates:
 * - SDK initialization and configuration
 * - Framework adapter integration (LangChain & LlamaIndex)
 * - Manual tracing
 * - Transport and storage configuration
 * - Session management
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.runCompleteExample = runCompleteExample;
const sdk_1 = require("../core/sdk");
const langchain_1 = require("../adapters/langchain");
const llamaindex_1 = require("../adapters/llamaindex");
const transports_1 = require("../transports");
const storage_1 = require("../storage");
async function runCompleteExample() {
    console.log('🚀 Starting FlowScope SDK Complete Example');
    // Initialize SDK with custom configuration
    const sdk = new sdk_1.FlowScopeSDK({
        debug: true,
        autoDetect: false, // We'll manually add adapters for demonstration
        batchSize: 10,
        flushInterval: 5000,
        maxTraces: 100
    });
    // Set transport and storage after initialization
    sdk.setTransport(new transports_1.HTTPTransport('https://api.flowscope.dev/traces', {
        apiKey: 'your-api-key-here'
    }));
    sdk.setStorage(new storage_1.LocalStorage());
    // Start a session
    const session = sdk.startSession('complete-example-session');
    console.log(`📋 Started session: ${session.id}`);
    // Manual tracing example
    console.log('\n📊 Creating manual traces...');
    sdk.trace('chain-1', {
        id: 'manual-trace-1',
        type: 'prompt',
        data: {
            input: 'What is the capital of France?',
            output: 'The capital of France is Paris.'
        },
        metadata: {
            model: 'gpt-3.5-turbo',
            temperature: 0.7,
            tokens: 15
        }
    });
    sdk.trace('chain-1', {
        id: 'manual-trace-2',
        type: 'tool_use',
        data: {
            input: 'Search for information about Paris',
            output: 'Found 5 relevant documents about Paris'
        },
        metadata: {
            source: 'vector-database',
            similarity_scores: [0.95, 0.89, 0.84, 0.81, 0.79]
        }
    });
    // Add and integrate framework adapters
    console.log('\n🔧 Adding framework adapters...');
    const langchainAdapter = new langchain_1.LangChainAdapter();
    if (langchainAdapter.isSupported()) {
        sdk.addAdapter(langchainAdapter);
        try {
            await langchainAdapter.integrate();
            console.log('✅ LangChain adapter integrated successfully');
        }
        catch (error) {
            console.log('❌ LangChain not available:', error);
        }
    }
    const llamaIndexAdapter = new llamaindex_1.LlamaIndexAdapter();
    if (llamaIndexAdapter.isSupported()) {
        sdk.addAdapter(llamaIndexAdapter);
        try {
            await llamaIndexAdapter.integrate();
            console.log('✅ LlamaIndex adapter integrated successfully');
        }
        catch (error) {
            console.log('❌ LlamaIndex not available:', error);
        }
    }
    // Demonstrate event listening
    console.log('\n👂 Setting up event listeners...');
    sdk.on('trace', (trace) => {
        console.log(`📝 New trace captured: ${trace.type} - ${trace.id}`);
    });
    sdk.on('sessionStart', (session) => {
        console.log(`🎬 Session started: ${session.id}`);
    });
    sdk.on('sessionEnd', (session) => {
        console.log(`🎬 Session ended: ${session.id} (duration: ${session.endTime - session.startTime}ms)`);
    });
    // Get current traces
    console.log('\n📋 Current traces:');
    const traces = sdk.getTraces();
    traces.forEach((trace, index) => {
        console.log(`  ${index + 1}. ${trace.type}: ${trace.id}`);
    });
    // Get session information
    console.log('\n📊 Session information:');
    if (session) {
        console.log(`  ID: ${session.id}`);
        console.log(`  Start Time: ${new Date(session.startTime).toISOString()}`);
        console.log(`  Traces Count: ${traces.length}`);
    }
    // Simulate some time passing
    await new Promise(resolve => setTimeout(resolve, 1000));
    // End session
    console.log('\n🏁 Ending session...');
    sdk.endSession();
    console.log('✨ Complete example finished!');
}
// Example usage with error handling
async function main() {
    try {
        await runCompleteExample();
    }
    catch (error) {
        console.error('❌ Example failed:', error);
    }
}
// Run if this file is executed directly
if (require.main === module) {
    main();
}
