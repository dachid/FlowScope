// Core types for JavaScript SDK - Independent copy
export interface TraceData {
  id: string;
  timestamp: number;
  sessionId: string;
  chainId: string;
  type: TraceEventType;
  data: unknown;
  metadata?: Record<string, unknown>;
  parentId?: string;
  duration?: number;
  status: TraceStatus;
  executionTime?: number;
  error?: string;
}

export type TraceEventType =
  | 'chain_start'
  | 'chain_end'
  | 'prompt'
  | 'response'
  | 'function_call'
  | 'tool_use'
  | 'agent_step'
  | 'error'
  | 'warning';

export type TraceStatus = 'pending' | 'completed' | 'failed' | 'cancelled' | 'error';

export interface FlowScopeConfig {
  apiUrl?: string;
  apiKey?: string;
  projectId?: string;
  environment?: 'development' | 'staging' | 'production';
  enableRealtime?: boolean;
}

// SDK-specific configuration
export interface SDKConfig extends FlowScopeConfig {
  /** Enable automatic chain detection */
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

// Session management
export interface Session {
  id: string;
  name?: string;
  userId?: string;
  projectId?: string;
  startTime: number;
  endTime?: number;
  metadata?: Record<string, any>;
}

// Chain execution context
export interface ChainContext {
  chainId: string;
  sessionId: string;
  parentId?: string;
  name?: string;
  startTime: number;
  endTime?: number;
  status: 'running' | 'completed' | 'failed';
  metadata?: Record<string, any>;
}

// Adapter interface for framework integrations
export interface FrameworkAdapter {
  name: string;
  version: string;
  integrate(): void | Promise<void>;
  disconnect(): void | Promise<void>;
  isSupported(): boolean;
  // EventEmitter methods
  on(event: string, listener: (...args: any[]) => void): this;
  removeAllListeners(): this;
}

// Event emitter types
export interface FlowScopeEvents {
  'trace': (trace: TraceData) => void;
  'session:start': (session: Session) => void;
  'session:end': (session: Session) => void;
  'chain:start': (context: ChainContext) => void;
  'chain:end': (context: ChainContext) => void;
  'error': (error: Error) => void;
}

// Transport interface for sending data
export interface Transport {
  send(data: TraceData[]): Promise<void>;
  flush(): Promise<void>;
  isConnected(): boolean;
}

// Storage interface for local persistence
export interface Storage {
  save(key: string, data: any): Promise<void>;
  load(key: string): Promise<any>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
}
