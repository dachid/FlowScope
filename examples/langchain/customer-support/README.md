# Customer Support Bot Example

This is a **real-world production-ready customer support bot** built with LangChain and integrated with FlowScope for debugging and observability.

## 🎯 **What This Demonstrates**

### **Real-World LangChain Usage:**
- Complex conversation chains with memory
- Structured output parsing
- Intent recognition and classification
- Error handling and fallback responses
- Production-ready API endpoints

### **FlowScope Integration Value:**
- **Automatic trace capture** - See every LangChain operation
- **Visual conversation flow** - Debug complex conversation paths
- **Performance monitoring** - Track response times and bottlenecks
- **Error debugging** - Identify where conversations break down
- **Session management** - Isolate individual customer interactions

## 🚀 **Quick Start**

### **1. Install Dependencies**
```bash
npm install
```

### **2. Configure Environment**
```bash
cp .env.example .env
# Edit .env with your API keys
```

### **3. Start FlowScope Backend**
```bash
# In FlowScope root directory
npm run dev
```

### **4. Start the Customer Support Bot**
```bash
npm start
```

The bot will be available at `http://localhost:3003`

## 🧪 **Testing the Bot**

### **Basic Test with cURL**
```bash
curl -X POST http://localhost:3003/api/support \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What is the status of my order ORD-001?",
    "customerId": "cust_001",
    "sessionId": "test_session_1"
  }'
```

### **Expected Response**
```json
{
  "success": true,
  "data": {
    "intent": "order_status",
    "confidence": 0.95,
    "response": "Your order ORD-001 for MacBook Air has been delivered...",
    "requiresHuman": false,
    "suggestedActions": ["track_package", "leave_review"]
  }
}
```

## 📊 **FlowScope Integration**

### **What You'll See in FlowScope:**

1. **Session Traces** - Each customer conversation as a separate session
2. **Chain Visualization** - Visual flow of LangChain operations:
   - Memory retrieval
   - Prompt template rendering
   - LLM API calls
   - Output parsing
3. **Performance Metrics** - Response times for each step
4. **Error Tracking** - Any failures in the conversation flow

### **Check FlowScope Status**
```bash
curl http://localhost:3003/api/debug/flowscope
```

## 🎭 **Test Scenarios**

### **1. Order Status Query**
```bash
curl -X POST http://localhost:3003/api/support \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Where is my order ORD-002?",
    "customerId": "cust_001"
  }'
```

### **2. Product Information**
```bash
curl -X POST http://localhost:3003/api/support \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Tell me about the MacBook Air specifications",
    "customerId": "cust_002"
  }'
```

### **3. Return Request**
```bash
curl -X POST http://localhost:3003/api/support \
  -H "Content-Type: application/json" \
  -d '{
    "query": "I want to return my wireless mouse, it stopped working",
    "customerId": "cust_001"
  }'
```

### **4. Complex Multi-Turn Conversation**
```bash
# First message
curl -X POST http://localhost:3003/api/support \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Hi, I need help with my account",
    "customerId": "cust_001",
    "sessionId": "multi_turn_1"
  }'

# Follow-up message (same session)
curl -X POST http://localhost:3003/api/support \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Actually, I want to check my recent orders",
    "customerId": "cust_001",
    "sessionId": "multi_turn_1"
  }'
```

## 🐛 **Debugging with FlowScope**

### **Common Issues to Debug:**

1. **Slow Responses** - Identify bottlenecks in the chain
2. **Wrong Intent Classification** - See how prompts are processed
3. **Memory Issues** - Track conversation context retention
4. **API Failures** - Catch and handle OpenAI API errors

### **FlowScope Dashboard Features:**
- **Timeline View** - See conversation progression over time
- **Flow View** - Visualize the LangChain execution graph
- **Node Details** - Inspect prompts, responses, and metadata
- **Performance Metrics** - Response times and token usage

## 🏗️ **Architecture**

```
Customer Query
      ↓
   Express API
      ↓
CustomerSupportBot
      ↓
   LangChain Chain
      ↓
┌─────────────────┐
│ Memory Retrieval│ ← FlowScope captures this
├─────────────────┤
│ Prompt Template │ ← FlowScope captures this
├─────────────────┤
│   OpenAI API    │ ← FlowScope captures this
├─────────────────┤
│ Output Parsing  │ ← FlowScope captures this
└─────────────────┘
      ↓
   JSON Response
```

## 📁 **File Structure**

```
customer-support/
├── src/
│   └── index.ts          # Main application
├── tests/
│   ├── bot.test.ts       # Unit tests
│   └── integration.test.ts # Integration tests
├── package.json
├── .env.example
└── README.md
```

## 🔧 **Production Considerations**

This example includes production-ready patterns:
- Error handling and fallback responses
- Structured output validation
- Rate limiting (add express-rate-limit)
- Logging and monitoring
- Environment configuration
- Health check endpoints

## 📚 **Learn More**

- [LangChain Documentation](https://js.langchain.com/)
- [FlowScope SDK Guide](../../packages/sdk/README.md)
- [Express.js Documentation](https://expressjs.com/)

## 🤝 **Contributing**

This example is designed to be:
- **Educational** - Learn real-world LangChain patterns
- **Testable** - Comprehensive test coverage
- **Debuggable** - Full FlowScope integration
- **Extensible** - Easy to add new features
