# FlowScope Developer Testing Guide

## What is FlowScope?
FlowScope is a **debugging and observability platform for AI/LLM applications**. It helps developers:
- 🔍 **Debug AI chains** - See how prompts flow through your LLM pipeline
- 📊 **Visualize traces** - Timeline view of function calls, API requests, and responses  
- 🐛 **Find bottlenecks** - Identify slow or failing steps in AI workflows
- 👥 **Collaborate** - Share debugging sessions with your team

## How Developers Use FlowScope

### 1. **During Development** 
- Integrate SDK into AI applications
- Real-time debugging of LLM chains
- Performance monitoring of AI operations

### 2. **Production Monitoring**
- Track AI application health
- Monitor token usage and costs
- Debug user-reported issues

### 3. **Team Collaboration**
- Share problematic traces with teammates
- Add comments and annotations
- Review AI behavior together

## Quick Start Testing

### ✅ **Step 1: Web Interface (START HERE)**
1. Open: http://localhost:5173
2. Click "New Session" → Name it "My Test"
3. Refresh the page to see your session with traces from the integration test
4. Explore the visualization views

### ✅ **Step 2: SDK Integration Test**
The integration test we just ran simulates how developers would use the SDK:

```javascript
// In a real AI application:
import FlowScopeSDK from '@flowscope/sdk';

const flowscope = new FlowScopeSDK({ 
  apiEndpoint: 'http://localhost:3001' 
});

const session = flowscope.startSession('customer-support-bot');

// Trace your AI operations
flowscope.trace('chain-1', {
  type: 'prompt',
  data: { prompt: 'Analyze customer sentiment...' }
});
```

### 📋 **Step 3: Real Integration**
For real-world usage, developers would:

1. **Install SDK**: `npm install @flowscope/sdk`
2. **Integrate with LangChain/OpenAI**: Add tracing to existing AI code
3. **Deploy with monitoring**: Use in production for observability

## Real-World Use Cases

### 🤖 **Customer Support Bot**
- Track conversation flows
- Debug why bot gives wrong answers  
- Monitor response times

### 📄 **Document Analysis**
- Trace multi-step document processing
- Debug extraction failures
- Optimize processing pipeline

### 💬 **Conversational AI**
- Monitor conversation context
- Debug memory issues
- Track user satisfaction

## Next Steps for Testing

1. **Explore the UI** with the test traces we created
2. **Try the connection tester** for more sample data
3. **Install VS Code extension** for IDE integration
4. **Integrate with a real AI project** using the SDK

The key insight: FlowScope makes **invisible AI operations visible** for debugging!
