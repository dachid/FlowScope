# 🚀 FlowScope Developer Quickstart

**Add FlowScope debugging to your LangChain app in 3 lines of code!**

## Quick Test - See It Working Now

1. **Install dependencies:**
```bash
cd examples/developer-quickstart
npm install
```

2. **Run the demo:**
```bash
npm run demo
```

3. **Test your integration:**
```bash
npm test
```

## 👨‍💻 How Developers Use FlowScope

### Step 1: Install FlowScope
```bash
npm install @flowscope/sdk
```

### Step 2: Add to Your LangChain App
```javascript
const { FlowScope } = require('@flowscope/sdk');

// Initialize once in your app
const flowScope = new FlowScope({
  projectId: 'my-langchain-app',
  debug: true
});
```

### Step 3: Wrap Your LangChain Operations
```javascript
async function processUserQuery(query, sessionId) {
  // Start tracing
  const traceId = await flowScope.startTrace({
    sessionId,
    operation: 'user_query',
    input: { query }
  });

  try {
    // Your existing LangChain code here
    const chain = new LLMChain({...});
    const result = await chain.call({ query });

    // End trace with success
    await flowScope.endTrace(traceId, {
      success: true,
      output: result
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
```

## 🎯 What You Get

### Real-Time Debugging
- **Visual trace flows** - See exactly how your LangChain executes
- **Performance metrics** - Identify slow steps in your chains
- **Error tracking** - Debug failures with complete context

### Session Isolation
- **Multi-user debugging** - Track different users separately
- **Context preservation** - Each session maintains its own trace history
- **Team collaboration** - Share debugging sessions with teammates

### Zero Configuration
- **Auto-detection** - FlowScope automatically captures LangChain operations
- **No code changes** - Minimal integration required
- **Framework agnostic** - Works with any LangChain setup

## 📊 Real Example Output

When you run the demo, you'll see:
```
🚀 Starting LangChain Application with FlowScope debugging...

📝 Processing query: "What is the weather like today?"
   ✅ prompt_template completed
   ✅ llm_call completed  
   ✅ response_formatting completed
✅ Query processed successfully!
📊 Check FlowScope dashboard for trace visualization
```

## 🔍 Advanced Usage

### Multiple Chain Steps
```javascript
// Each step gets its own sub-trace
const stepTrace = await flowScope.startTrace({
  parentId: mainTraceId,
  operation: 'retrieval_step',
  input: { documents: docs }
});
```

### Custom Metadata
```javascript
await flowScope.startTrace({
  sessionId: 'user_123',
  operation: 'rag_pipeline',
  metadata: {
    model: 'gpt-4',
    temperature: 0.7,
    user_context: 'enterprise_customer'
  }
});
```

### Error Handling
```javascript
try {
  // Your LangChain operations
} catch (error) {
  await flowScope.endTrace(traceId, {
    success: false,
    error: error.message,
    errorType: error.constructor.name,
    stack: error.stack
  });
}
```

## 🚦 Production Ready

### Environment Configuration
```javascript
const flowScope = new FlowScope({
  projectId: process.env.FLOWSCOPE_PROJECT_ID,
  apiKey: process.env.FLOWSCOPE_API_KEY,
  environment: process.env.NODE_ENV,
  debug: process.env.NODE_ENV === 'development'
});
```

### Performance Optimized
```javascript
const flowScope = new FlowScope({
  batchSize: 50,        // Batch traces for performance
  flushInterval: 5000,  // Send every 5 seconds
  maxTraces: 1000       // Limit memory usage
});
```

## 🎉 That's It!

Your LangChain application now has professional-grade debugging capabilities. 

**Next Steps:**
1. Run `npm test` to verify everything works
2. Open FlowScope dashboard to see your traces
3. Integrate into your production application
4. Share debugging sessions with your team

**Need Help?**
- 📖 [Full Documentation](https://flowscope.dev/docs)
- 💬 [Community Discord](https://discord.gg/flowscope)
- 🐛 [Report Issues](https://github.com/flowscope/issues)
