# FlowScope Real-World Examples

This directory contains **production-ready applications** that demonstrate FlowScope's value in real-world scenarios. These examples are designed to be **immediately runnable** and showcase the complete Tier 1 value proposition.

## 🎯 **Purpose**

These examples serve as:
- **Proof of Concept** - Validate FlowScope's core value with realistic applications
- **Integration Testing** - Test SDK integrations with actual framework code
- **Developer Experience** - Demonstrate the "2-line integration" promise
- **Documentation** - Show real usage patterns and best practices

## 📁 **Example Applications**

### **1. LangChain Examples** (`/langchain/`)

#### **Customer Support Bot** (`/langchain/customer-support/`)
- **What it is**: Production-ready e-commerce customer support system
- **LangChain Features**: Conversation chains, memory management, structured output
- **FlowScope Value**: 
  - Trace conversation flows
  - Debug intent classification
  - Monitor response generation
  - Track customer interaction patterns

**Quick Start:**
```bash
cd examples/langchain/customer-support
npm install
npm start
# Test: curl -X POST http://localhost:3003/api/support -d '{"query":"Order status?","customerId":"cust_001"}'
```

### **2. LlamaIndex Examples** (`/llamaindex/`)

#### **Document Search RAG** (`/llamaindex/document-search/`)
- **What it is**: Enterprise document search with question answering
- **LlamaIndex Features**: Document indexing, semantic search, RAG pipeline
- **FlowScope Value**:
  - Trace document retrieval
  - Debug relevance scoring
  - Monitor query processing
  - Track answer generation

**Quick Start:**
```bash
cd examples/llamaindex/document-search
npm install
npm start
# Test: curl -X POST http://localhost:3004/api/search -d '{"query":"What is the remote work policy?"}'
```

### **3. Hybrid Examples** (`/hybrid/`)

#### **Multi-Framework RAG System** (`/hybrid/rag-system/`)
- **What it is**: Advanced system combining LangChain + LlamaIndex
- **Hybrid Features**: Cross-framework coordination, complex reasoning chains
- **FlowScope Value**:
  - End-to-end pipeline visibility
  - Cross-framework performance monitoring
  - Multi-step reasoning debugging
  - Framework integration insights

**Quick Start:**
```bash
cd examples/hybrid/rag-system
npm install
npm start
# Test: curl -X POST http://localhost:3005/api/chat -d '{"query":"API process?","sessionId":"test_1"}'
```

## 🚀 **Getting Started**

### **Prerequisites**
1. **FlowScope Backend Running**:
   ```bash
   cd FlowScope
   npm run dev
   ```
   
2. **FlowScope Web Interface**: Open http://localhost:3000

### **Run All Examples**

```bash
# Terminal 1: Customer Support Bot
cd examples/langchain/customer-support && npm install && npm start

# Terminal 2: Document Search
cd examples/llamaindex/document-search && npm install && npm start

# Terminal 3: Hybrid System
cd examples/hybrid/rag-system && npm install && npm start
```

### **Generate Test Data**

Each example includes endpoints to generate sample traces:

```bash
# Generate customer support traces
curl -X POST http://localhost:3003/api/debug/generate-traces

# Generate document search traces  
curl -X POST http://localhost:3004/api/debug/generate-searches

# Generate hybrid framework traces
curl -X POST http://localhost:3005/api/debug/generate-hybrid-traces
```

## 📊 **What You'll See in FlowScope**

### **Visual Debugging Features**

#### **1. Session-Based Trace Isolation**
- Each customer interaction = separate session
- Clean, focused debugging per conversation
- No noise from other users' activities

#### **2. Real-Time Chain Visualization**
- **Flow View**: See LangChain/LlamaIndex execution as connected nodes
- **Timeline View**: Chronological sequence of operations
- **Interactive Inspection**: Click any node to see detailed data

#### **3. Multi-Framework Correlation**
- Trace operations across LangChain AND LlamaIndex
- See how frameworks interact in hybrid applications
- Unified debugging experience for complex pipelines

#### **4. Performance Monitoring**
- Response times for each operation
- Bottleneck identification
- Token usage and API call tracking

## 🧪 **Testing Scenarios**

### **Customer Support Bot Testing**

```bash
# Basic order inquiry
curl -X POST http://localhost:3003/api/support \
  -H "Content-Type: application/json" \
  -d '{"query":"What is my order status?","customerId":"cust_001"}'

# Complex return request
curl -X POST http://localhost:3003/api/support \
  -H "Content-Type: application/json" \
  -d '{"query":"I want to return my MacBook Air, it has a screen issue","customerId":"cust_001"}'
```

### **Document Search Testing**

```bash
# Policy inquiry
curl -X POST http://localhost:3004/api/search \
  -H "Content-Type: application/json" \
  -d '{"query":"What are the password requirements for company systems?"}'

# Multi-document query
curl -X POST http://localhost:3004/api/search \
  -H "Content-Type: application/json" \
  -d '{"query":"Tell me about remote work policy and VPN setup"}'
```

### **Hybrid System Testing**

```bash
# Multi-domain query
curl -X POST http://localhost:3005/api/chat \
  -H "Content-Type: application/json" \
  -d '{"query":"What is our API integration process and what are the legal requirements?","sessionId":"complex_test"}'
```

## 🎯 **Tier 1 Value Validation**

These examples demonstrate **complete Tier 1 value**:

### **✅ Real-Time Visual Chain Debugging**
- See every LangChain/LlamaIndex operation as it happens
- Interactive flow diagrams with detailed inspection
- Timeline views showing execution sequence

### **✅ Cross-Platform SDK Integration**
- **Zero code changes** to existing applications
- **Automatic trace capture** from framework operations
- **One-line integration**: `const flowscope = new FlowScopeSDK({ autoDetect: true })`

### **✅ Session-Based Trace Isolation**
- Clean separation of different user interactions
- Focused debugging without noise
- Perfect reproduction of specific scenarios

## 🔧 **Implementation Notes**

### **SDK Integration Pattern**

Each example follows the same simple pattern:

```typescript
// 1. Import FlowScope SDK
import { FlowScopeSDK } from '@flowscope/sdk';

// 2. Initialize with auto-detection
const flowscope = new FlowScopeSDK({
  projectId: 'your-project',
  autoDetect: true
});

// 3. Use your framework normally - traces are automatic!
const result = await langchainOperation();
```

### **Manual Tracing for Custom Logic**

```typescript
// Start a session
flowscope.startSession('session-id', { metadata });

// Add custom traces
flowscope.trace('session-id', {
  type: 'function_call',
  data: { operation: 'custom-logic' }
});

// End session
flowscope.endSession();
```

## 📈 **Expected FlowScope Dashboard Views**

### **Session List**
- `customer-support-session-cust_001`
- `document-search-policy-inquiry`
- `hybrid-complex-reasoning-test`

### **Flow Visualization**
- **Customer Support**: Query → Intent → Memory → LLM → Response
- **Document Search**: Query → Preprocessing → Retrieval → Ranking → Answer
- **Hybrid**: Query → Analysis (LC) → Retrieval (LI) → Context (Hybrid) → Response (LC)

### **Performance Metrics**
- Customer Support: ~200-800ms per interaction
- Document Search: ~500-1200ms per query
- Hybrid System: ~1000-2000ms per complex query

## 🚨 **Troubleshooting**

### **Common Issues**

1. **FlowScope Backend Not Running**
   ```bash
   cd FlowScope && npm run dev
   ```

2. **Port Conflicts**
   - Customer Support: Port 3003
   - Document Search: Port 3004
   - Hybrid System: Port 3005

3. **No Traces Visible**
   - Check FlowScope SDK initialization
   - Verify backend connection
   - Use `/api/debug/flowscope` endpoints

### **Debug Endpoints**

Each example provides debug information:

```bash
# Check FlowScope integration status
curl http://localhost:3003/api/debug/flowscope  # Customer Support
curl http://localhost:3004/api/debug/flowscope  # Document Search
curl http://localhost:3005/api/debug/flowscope  # Hybrid System
```

## 🎉 **Success Criteria**

After running these examples, you should see:

- [x] **Multiple sessions** in FlowScope dashboard
- [x] **Interactive flow diagrams** for each application type
- [x] **Detailed trace data** with prompts, responses, and metadata
- [x] **Performance metrics** for each operation
- [x] **Cross-framework visibility** in the hybrid example

## 📚 **Next Steps**

1. **Extend Examples**: Add your own LangChain/LlamaIndex code to existing examples
2. **Build New Applications**: Use these as templates for your own projects
3. **Contribute**: Share your real-world FlowScope integrations
4. **Production Deploy**: Take these examples to production with proper API keys

These examples prove that FlowScope delivers **immediate, tangible value** for LLM application debugging and observability.
