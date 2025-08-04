/**
 * Quick SDK Integration Test
 * Run this to test FlowScope SDK integration
 */

const axios = require('axios');

async function testSDKIntegration() {
  const baseUrl = 'http://localhost:3001/api';
  
  try {
    // 1. Create a session
    console.log('🔄 Creating session...');
    const sessionResponse = await axios.post(`${baseUrl}/sessions`, {
      name: 'SDK Test Session',
      metadata: { source: 'sdk-test', environment: 'development' }
    });
    
    const sessionId = sessionResponse.data.id;
    console.log('✅ Session created:', sessionId);
    
    // 2. Add some traces (simulating SDK usage)
    console.log('🔄 Adding traces...');
    
    const traces = [
      {
        sessionId,
        chainId: 'test-chain-1', 
        timestamp: Date.now(),
        type: 'prompt',
        status: 'completed',
        data: {
          prompt: 'Analyze this customer feedback: "Great product!"',
          model: 'gpt-4',
          temperature: 0.7
        }
      },
      {
        sessionId,
        chainId: 'test-chain-1',
        timestamp: Date.now() + 1000,
        type: 'function_call', 
        status: 'completed',
        data: {
          function: 'sentiment_analysis',
          arguments: { text: 'Great product!' }
        }
      },
      {
        sessionId,
        chainId: 'test-chain-1',
        timestamp: Date.now() + 2000,
        type: 'response',
        status: 'completed', 
        data: {
          result: 'Positive sentiment detected (confidence: 0.95)',
          reasoning: 'Positive language indicators: "Great", "product"'
        }
      }
    ];
    
    for (const trace of traces) {
      await axios.post(`${baseUrl}/sessions/${sessionId}/traces`, trace);
      console.log(`✅ Added ${trace.type} trace`);
    }
    
    // 3. Verify traces were added
    const tracesResponse = await axios.get(`${baseUrl}/sessions/${sessionId}/traces`);
    console.log(`✅ Session now has ${tracesResponse.data.length} traces`);
    
    console.log(`\n🎉 Success! View your traces at: http://localhost:5173`);
    console.log(`📊 Session ID: ${sessionId}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testSDKIntegration();
