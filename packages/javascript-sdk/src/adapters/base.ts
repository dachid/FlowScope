import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { TraceData } from '../types';
import { FrameworkAdapter, ChainContext, Session } from '../types';

/**
 * Base adapter class for framework integrations
 * Provides common functionality for all adapters
 */
export abstract class BaseAdapter extends EventEmitter implements FrameworkAdapter {
  public abstract readonly name: string;
  public abstract readonly version: string;
  
  protected isIntegrated = false;
  protected currentSession?: Session;
  protected activeChains = new Map<string, ChainContext>();
  
  /**
   * Initialize the adapter integration
   */
  public abstract integrate(): void | Promise<void>;
  
  /**
   * Disconnect the adapter
   */
  public abstract disconnect(): void | Promise<void>;
  
  /**
   * Check if the framework is supported in current environment
   */
  public abstract isSupported(): boolean;
  
  /**
   * Capture a trace event
   */
  protected captureTrace(event: any): TraceData {
    const timestamp = Date.now();
    const traceId = uuidv4();
    
    return {
      id: traceId,
      timestamp,
      sessionId: this.currentSession?.id || 'default',
      chainId: this.generateChainId(event),
      type: this.determineEventType(event),
      status: 'completed', // Default status, can be overridden
      data: this.sanitizeEventData(event),
      metadata: this.extractMetadata(event),
    };
  }
  
  /**
   * Start a new session
   */
  protected startSession(sessionId?: string, metadata?: Record<string, any>): Session {
    const session: Session = {
      id: sessionId || uuidv4(),
      startTime: Date.now(),
      metadata,
    };
    
    this.currentSession = session;
    this.emit('session:start', session);
    
    return session;
  }
  
  /**
   * End the current session
   */
  protected endSession(): void {
    if (this.currentSession) {
      this.currentSession.endTime = Date.now();
      this.emit('session:end', this.currentSession);
      this.currentSession = undefined;
    }
  }
  
  /**
   * Start tracking a chain execution
   */
  protected startChain(chainId: string, name?: string, metadata?: Record<string, any>): ChainContext {
    const context: ChainContext = {
      chainId,
      sessionId: this.currentSession?.id || 'default',
      name,
      startTime: Date.now(),
      status: 'running',
      metadata,
    };
    
    this.activeChains.set(chainId, context);
    this.emit('chain:start', context);
    
    return context;
  }
  
  /**
   * End tracking a chain execution
   */
  protected endChain(chainId: string, status: 'completed' | 'failed' = 'completed'): void {
    const context = this.activeChains.get(chainId);
    if (context) {
      context.endTime = Date.now();
      context.status = status;
      this.activeChains.delete(chainId);
      this.emit('chain:end', context);
    }
  }
  
  /**
   * Emit a trace event
   */
  protected emitTrace(trace: TraceData): void {
    this.emit('trace', trace);
  }
  
  /**
   * Generate a unique chain ID for the event
   */
  protected abstract generateChainId(event: any): string;
  
  /**
   * Determine the event type from the framework event
   */
  protected abstract determineEventType(event: any): TraceData['type'];
  
  /**
   * Sanitize event data to remove sensitive information
   */
  protected sanitizeEventData(event: any): any {
    // Default implementation - subclasses can override
    if (typeof event === 'object' && event !== null) {
      const sanitized = { ...event };
      
      // Remove common sensitive fields
      delete sanitized.apiKey;
      delete sanitized.token;
      delete sanitized.password;
      delete sanitized.secret;
      
      return sanitized;
    }
    
    return event;
  }
  
  /**
   * Extract metadata from the event
   */
  protected extractMetadata(event: any): Record<string, any> {
    // Default implementation - subclasses can override
    return {
      framework: this.name,
      version: this.version,
      timestamp: Date.now(),
    };
  }
  
  /**
   * Log debug information if debug mode is enabled
   */
  protected debug(message: string, ...args: any[]): void {
    if (process.env.FLOWSCOPE_DEBUG === 'true') {
      console.debug(`[FlowScope:${this.name}] ${message}`, ...args);
    }
  }
  
  /**
   * Handle adapter errors
   */
  protected handleError(error: Error): void {
    this.debug('Adapter error:', error);
    this.emit('error', error);
  }
}
