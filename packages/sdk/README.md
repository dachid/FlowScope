# FlowScope SDK

The FlowScope SDK provides comprehensive observability and debugging capabilities for LLM chains and agent workflows. It offers automatic framework integration, manual tracing capabilities, and flexible transport/storage options.

## Features

- 🔍 **Automatic Framework Detection**: Seamlessly integrates with LangChain and LlamaIndex
- 📊 **Manual Tracing**: Add custom traces for any LLM operation
- 🎯 **Session Management**: Track chains across user sessions
- 🚀 **Multiple Transports**: Console, HTTP, and WebSocket support
- 💾 **Flexible Storage**: Memory, LocalStorage, and File system options
- 🎉 **Event-Driven**: Real-time trace capture and processing
- 🔧 **TypeScript Support**: Full type safety and IntelliSense

## Installation

```bash
npm install @flowscope/sdk
```

### Optional Peer Dependencies

For framework integration support:

```bash
# For LangChain integration
npm install langchain

# For LlamaIndex integration  
npm install llamaindex
```

## Quick Start

```typescript
import { FlowScopeSDK } from '@flowscope/sdk';

// Initialize with automatic framework detection
const sdk = new FlowScopeSDK({
  debug: true,
  autoDetect: true
});

// Start a session
const session = sdk.startSession('my-session');

// Manual tracing
sdk.trace('chain-1', {
  id: 'step-1',
  type: 'prompt',
  data: {
    input: 'What is machine learning?',
    output: 'Machine learning is a subset of artificial intelligence...'
  },
  metadata: {
    model: 'gpt-4',
    temperature: 0.7
  }
});

// End session
sdk.endSession();
```

## Configuration Options

```typescript
interface SDKConfig {
  /** Enable automatic framework detection */
  autoDetect?: boolean;
  /** Batch size for trace events */
  batchSize?: number;
  /** Flush interval in milliseconds */
  flushInterval?: number;
  /** Maximum number of traces to keep in memory */
  maxTraces?: number;
  /** Debug mode for verbose logging */
  debug?: boolean;
}
```

## Framework Integration

### LangChain

The SDK automatically detects and integrates with LangChain when available:

```typescript
import { ChatOpenAI } from 'langchain/chat_models/openai';
import { FlowScopeSDK } from '@flowscope/sdk';

const sdk = new FlowScopeSDK({ autoDetect: true });

// LangChain operations are automatically traced
const model = new ChatOpenAI();
const result = await model.invoke("Hello world!");
```

### LlamaIndex

Similarly, LlamaIndex integration is automatic:

```typescript
import { OpenAI } from 'llamaindex';
import { FlowScopeSDK } from '@flowscope/sdk';

const sdk = new FlowScopeSDK({ autoDetect: true });

// LlamaIndex operations are automatically traced
const llm = new OpenAI();
const response = await llm.complete("What is AI?");
```

### Manual Adapter Integration

For custom integration or debugging:

```typescript
import { FlowScopeSDK, LangChainAdapter } from '@flowscope/sdk';

const sdk = new FlowScopeSDK({ autoDetect: false });

const adapter = new LangChainAdapter();
if (adapter.isSupported()) {
  sdk.addAdapter(adapter);
  await adapter.integrate();
}
```

## Transport Options

### Console Transport (Default)

```typescript
import { ConsoleTransport } from '@flowscope/sdk';

sdk.setTransport(new ConsoleTransport());
```

### HTTP Transport

```typescript
import { HTTPTransport } from '@flowscope/sdk';

sdk.setTransport(new HTTPTransport('https://api.flowscope.dev/traces', {
  apiKey: 'your-api-key',
  timeout: 5000
}));
```

### WebSocket Transport

```typescript
import { WebSocketTransport } from '@flowscope/sdk';

sdk.setTransport(new WebSocketTransport('wss://api.flowscope.dev/ws', {
  reconnectInterval: 3000
}));
```

## Storage Options

### Memory Storage (Default)

```typescript
import { MemoryStorage } from '@flowscope/sdk';

sdk.setStorage(new MemoryStorage());
```

### LocalStorage (Browser)

```typescript
import { LocalStorage } from '@flowscope/sdk';

sdk.setStorage(new LocalStorage());
```

### File Storage (Node.js)

```typescript
import { FileStorage } from '@flowscope/sdk';

sdk.setStorage(new FileStorage('./traces'));
```

## Event Handling

```typescript
// Listen for trace events
sdk.on('trace', (trace) => {
  console.log('New trace:', trace.id);
});

// Listen for session events
sdk.on('sessionStart', (session) => {
  console.log('Session started:', session.id);
});

sdk.on('sessionEnd', (session) => {
  console.log('Session ended:', session.id);
});

// Listen for errors
sdk.on('error', (error) => {
  console.error('SDK error:', error);
});
```

## Manual Tracing

### Basic Tracing

```typescript
sdk.trace('chain-id', {
  id: 'unique-trace-id',
  type: 'prompt',
  data: {
    input: 'User question',
    output: 'AI response'
  },
  metadata: {
    model: 'gpt-4',
    temperature: 0.7,
    tokens: 150
  }
});
```

### Trace Types

Available trace event types:

- `chain_start` - Beginning of a chain execution
- `chain_end` - End of a chain execution  
- `prompt` - LLM prompt/completion
- `response` - LLM response
- `function_call` - Function/tool call
- `tool_use` - Tool usage
- `agent_step` - Agent reasoning step
- `error` - Error occurrence
- `warning` - Warning event

### Hierarchical Tracing

```typescript
// Parent trace
sdk.trace('chain-1', {
  id: 'parent-trace',
  type: 'chain_start',
  data: { goal: 'Answer user question' }
});

// Child trace
sdk.trace('chain-1', {
  id: 'child-trace',
  type: 'prompt',
  data: { input: 'What is AI?' },
  parentId: 'parent-trace'
});
```

## Session Management

```typescript
// Start a session with metadata
const session = sdk.startSession('session-id', {
  userId: 'user-123',
  projectId: 'project-456',
  environment: 'production'
});

// Get current session
console.log('Current session:', session);

// End session
sdk.endSession();
```

## Advanced Usage

### Batch Operations

```typescript
// Configure batching
const sdk = new FlowScopeSDK({
  batchSize: 50,
  flushInterval: 10000 // 10 seconds
});

// Manual flush
await sdk.flush();
```

### Data Management

```typescript
// Get all traces
const traces = sdk.getTraces();

// Clear traces
sdk.clearTraces();

// Shutdown (cleanup resources)
await sdk.shutdown();
```

## Examples

Check out the `examples/` directory for complete usage examples:

- `examples/complete-example.ts` - Comprehensive SDK usage

## API Reference

### FlowScopeSDK

Main SDK class providing the primary interface.

#### Constructor

```typescript
constructor(config: SDKConfig)
```

#### Methods

- `init()` - Initialize the SDK and auto-detect frameworks
- `trace(chainId: string, data: Partial<TraceData>)` - Add a manual trace
- `startSession(sessionId?: string, metadata?: any)` - Start a new session
- `endSession()` - End the current session
- `addAdapter(adapter: FrameworkAdapter)` - Add a framework adapter
- `removeAdapter(name: string)` - Remove a framework adapter
- `setTransport(transport: Transport)` - Set the trace transport
- `setStorage(storage: Storage)` - Set the storage backend
- `getTraces()` - Get all current traces
- `clearTraces()` - Clear all traces
- `flush()` - Manually flush pending traces
- `shutdown()` - Cleanup and shutdown

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
