import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { TraceData } from '../types';
import { 
  SDKConfig, 
  Session, 
  ChainContext, 
  FrameworkAdapter,
  Transport,
  Storage,
  FlowScopeEvents
} from '../types';

/**
 * Main FlowScope SDK class
 * Provides the primary interface for LLM chain debugging and observability
 */
export class FlowScopeSDK extends EventEmitter {
  private config: SDKConfig;
  private adapters = new Map<string, FrameworkAdapter>();
  private transport?: Transport;
  private storage?: Storage;
  private traceBuffer: TraceData[] = [];
  private flushTimer?: NodeJS.Timeout;
  private currentSession?: Session;
  
  constructor(config: SDKConfig) {
    super();
    this.config = {
      autoDetect: true,
      batchSize: 10,
      flushInterval: 5000,
      maxTraces: 1000,
      debug: false,
      ...config,
    };
    
    this.setupEventHandling();
    this.startFlushTimer();
  }
  
  /**
   * Initialize the SDK with configuration
   */
  public async init(): Promise<void> {
    this.debug('Initializing FlowScope SDK', this.config);
    
    // Auto-detect and integrate supported frameworks
    if (this.config.autoDetect) {
      await this.autoDetectFrameworks();
    }
    
    // Initialize storage if configured
    if (this.storage) {
      await this.initializeStorage();
    }
    
    this.debug('FlowScope SDK initialized successfully');
  }
  
  /**
   * Manually trace a chain execution
   */
  public trace(chainId: string, data: Partial<TraceData>): void {
    const trace: TraceData = {
      id: data.id || uuidv4(),
      timestamp: data.timestamp || Date.now(),
      sessionId: data.sessionId || this.currentSession?.id || 'default',
      chainId,
      type: data.type || 'prompt',
      status: data.status || 'completed',
      data: data.data || {},
      metadata: {
        manual: true,
        ...data.metadata,
      },
    };
    
    this.addTrace(trace);
  }
  
  /**
   * Start a new debugging session
   */
  public startSession(sessionId?: string, metadata?: Record<string, any>): Session {
    const session: Session = {
      id: sessionId || uuidv4(),
      startTime: Date.now(),
      metadata: {
        sdkVersion: '1.0.0',
        ...metadata,
      },
    };
    
    this.currentSession = session;
    this.emit('session:start', session);
    this.debug('Session started:', session.id);
    
    return session;
  }
  
  /**
   * End the current debugging session
   */
  public endSession(): void {
    if (this.currentSession) {
      this.currentSession.endTime = Date.now();
      this.emit('session:end', this.currentSession);
      this.debug('Session ended:', this.currentSession.id);
      this.currentSession = undefined;
    }
  }
  
  /**
   * Add a framework adapter
   */
  public addAdapter(adapter: FrameworkAdapter): void {
    this.adapters.set(adapter.name, adapter);
    
    // Setup event forwarding from adapter
    adapter.on('trace', (trace: TraceData) => {
      this.addTrace(trace);
    });
    
    adapter.on('session:start', (session: Session) => {
      this.currentSession = session;
      this.emit('session:start', session);
    });
    
    adapter.on('session:end', (session: Session) => {
      this.emit('session:end', session);
    });
    
    adapter.on('chain:start', (context: ChainContext) => {
      this.emit('chain:start', context);
    });
    
    adapter.on('chain:end', (context: ChainContext) => {
      this.emit('chain:end', context);
    });
    
    adapter.on('error', (error: Error) => {
      this.handleError(error);
    });
    
    this.debug(`Adapter added: ${adapter.name}`);
  }
  
  /**
   * Remove a framework adapter
   */
  public removeAdapter(name: string): void {
    const adapter = this.adapters.get(name);
    if (adapter) {
      adapter.removeAllListeners();
      adapter.disconnect();
      this.adapters.delete(name);
      this.debug(`Adapter removed: ${name}`);
    }
  }
  
  /**
   * Set the transport for sending traces
   */
  public setTransport(transport: Transport): void {
    this.transport = transport;
    this.debug('Transport configured');
  }
  
  /**
   * Set the storage for local persistence
   */
  public setStorage(storage: Storage): void {
    this.storage = storage;
    this.debug('Storage configured');
  }
  
  /**
   * Get current traces
   */
  public getTraces(): TraceData[] {
    return [...this.traceBuffer];
  }
  
  /**
   * Clear all traces
   */
  public clearTraces(): void {
    this.traceBuffer = [];
    this.debug('Traces cleared');
  }
  
  /**
   * Manually flush traces to transport
   */
  public async flush(): Promise<void> {
    if (this.transport && this.traceBuffer.length > 0) {
      try {
        await this.transport.send([...this.traceBuffer]);
        this.traceBuffer = [];
        this.debug('Traces flushed to transport');
      } catch (error) {
        this.handleError(error as Error);
      }
    }
  }
  
  /**
   * Shutdown the SDK
   */
  public async shutdown(): Promise<void> {
    // Stop flush timer
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    
    // End current session
    this.endSession();
    
    // Flush remaining traces
    await this.flush();
    
    // Disconnect all adapters
    for (const adapter of this.adapters.values()) {
      await adapter.disconnect();
    }
    
    this.debug('FlowScope SDK shutdown complete');
  }
  
  /**
   * Add a trace to the buffer
   */
  private addTrace(trace: TraceData): void {
    this.traceBuffer.push(trace);
    this.emit('trace', trace);
    
    // Enforce max traces limit
    if (this.traceBuffer.length > this.config.maxTraces!) {
      this.traceBuffer = this.traceBuffer.slice(-this.config.maxTraces!);
    }
    
    // Auto-flush if batch size reached
    if (this.traceBuffer.length >= this.config.batchSize!) {
      this.flush().catch(error => this.handleError(error));
    }
  }
  
  /**
   * Setup event handling for the SDK
   */
  private setupEventHandling(): void {
    // Handle process exit to cleanup
    if (typeof process !== 'undefined') {
      process.on('exit', () => {
        this.shutdown().catch(console.error);
      });
      
      process.on('SIGINT', () => {
        this.shutdown().then(() => process.exit(0)).catch(console.error);
      });
    }
  }
  
  /**
   * Start the automatic flush timer
   */
  private startFlushTimer(): void {
    if (this.config.flushInterval && this.config.flushInterval > 0) {
      this.flushTimer = setInterval(() => {
        this.flush().catch(error => this.handleError(error));
      }, this.config.flushInterval);
    }
  }
  
  /**
   * Auto-detect and integrate supported frameworks
   */
  private async autoDetectFrameworks(): Promise<void> {
    const { LangChainAdapter } = await import('../adapters/langchain');
    const { LlamaIndexAdapter } = await import('../adapters/llamaindex');
    
    // Try LangChain
    const langchainAdapter = new LangChainAdapter();
    if (langchainAdapter.isSupported()) {
      this.addAdapter(langchainAdapter);
      try {
        await langchainAdapter.integrate();
        this.debug('LangChain auto-detected and integrated');
      } catch (error) {
        this.debug('Failed to integrate LangChain:', error);
      }
    }
    
    // Try LlamaIndex
    const llamaIndexAdapter = new LlamaIndexAdapter();
    if (llamaIndexAdapter.isSupported()) {
      this.addAdapter(llamaIndexAdapter);
      try {
        await llamaIndexAdapter.integrate();
        this.debug('LlamaIndex auto-detected and integrated');
      } catch (error) {
        this.debug('Failed to integrate LlamaIndex:', error);
      }
    }
  }
  
  /**
   * Initialize storage system
   */
  private async initializeStorage(): Promise<void> {
    if (this.storage) {
      try {
        // Load existing session if any
        const savedSession = await this.storage.load('current_session');
        if (savedSession) {
          this.currentSession = savedSession;
        }
      } catch (error) {
        this.debug('Failed to load saved session:', error);
      }
    }
  }
  
  /**
   * Handle errors within the SDK
   */
  private handleError(error: Error): void {
    this.debug('SDK error:', error);
    this.emit('error', error);
  }
  
  /**
   * Get current session ID
   */
  public getCurrentSessionId(): string {
    return this.currentSession?.id || 'default';
  }
  
  /**
   * Generate a unique trace ID
   */
  public generateTraceId(): string {
    return uuidv4();
  }
  
  /**
   * Get current session
   */
  public getCurrentSession(): Session | undefined {
    return this.currentSession;
  }
  
  /**
   * Log debug information if debug mode is enabled
   */
  private debug(message: string, ...args: any[]): void {
    if (this.config.debug || process.env.FLOWSCOPE_DEBUG === 'true') {
      console.debug(`[FlowScope] ${message}`, ...args);
    }
  }
}
