import { TraceData } from '@flowscope/shared';
import { Transport } from '../types';

/**
 * Console transport for debugging
 * Outputs traces to console.log
 */
export class ConsoleTransport implements Transport {
  private connected = true;
  
  constructor(private options: { pretty?: boolean } = {}) {}
  
  async send(data: TraceData[]): Promise<void> {
    if (this.options.pretty) {
      console.log('FlowScope Traces:', JSON.stringify(data, null, 2));
    } else {
      console.log('FlowScope Traces:', data);
    }
  }
  
  async flush(): Promise<void> {
    // Nothing to flush for console transport
  }
  
  isConnected(): boolean {
    return this.connected;
  }
}

/**
 * HTTP transport for sending traces to FlowScope backend
 */
export class HTTPTransport implements Transport {
  private connected = false;
  
  constructor(
    private endpoint: string,
    private options: {
      apiKey?: string;
      timeout?: number;
      headers?: Record<string, string>;
    } = {}
  ) {}
  
  async send(data: TraceData[]): Promise<void> {
    if (!this.connected) {
      throw new Error('HTTP transport not connected');
    }
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...this.options.headers,
    };
    
    if (this.options.apiKey) {
      headers['Authorization'] = `Bearer ${this.options.apiKey}`;
    }
    
    const response = await fetch(`${this.endpoint}/traces`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ traces: data }),
      signal: AbortSignal.timeout(this.options.timeout || 10000),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP transport failed: ${response.status} ${response.statusText}`);
    }
  }
  
  async flush(): Promise<void> {
    // Nothing additional to flush for HTTP transport
  }
  
  isConnected(): boolean {
    return this.connected;
  }
  
  async connect(): Promise<void> {
    try {
      // Test connection with a ping
      const response = await fetch(`${this.endpoint}/api/health`, {
        method: 'GET',
        headers: this.options.headers,
        signal: AbortSignal.timeout(5000),
      });
      
      this.connected = response.ok;
      
      if (!this.connected) {
        throw new Error(`Health check failed: ${response.status}`);
      }
    } catch (error) {
      this.connected = false;
      throw error;
    }
  }
  
  disconnect(): void {
    this.connected = false;
  }
}

/**
 * WebSocket transport for real-time trace streaming
 */
export class WebSocketTransport implements Transport {
  private ws?: WebSocket;
  private connected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 1000;
  
  constructor(
    private endpoint: string,
    private options: {
      protocols?: string[];
      reconnect?: boolean;
    } = {}
  ) {}
  
  async send(data: TraceData[]): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.connected || !this.ws) {
        reject(new Error('WebSocket not connected'));
        return;
      }
      
      try {
        this.ws.send(JSON.stringify({ type: 'traces', data }));
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }
  
  async flush(): Promise<void> {
    // WebSocket sends immediately, nothing to flush
  }
  
  isConnected(): boolean {
    return this.connected;
  }
  
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.endpoint, this.options.protocols);
        
        this.ws.onopen = () => {
          this.connected = true;
          this.reconnectAttempts = 0;
          resolve();
        };
        
        this.ws.onclose = () => {
          this.connected = false;
          if (this.options.reconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
            setTimeout(() => {
              this.reconnectAttempts++;
              this.connect().catch(console.error);
            }, this.reconnectInterval * this.reconnectAttempts);
          }
        };
        
        this.ws.onerror = (error) => {
          this.connected = false;
          reject(error);
        };
        
      } catch (error) {
        reject(error);
      }
    });
  }
  
  disconnect(): void {
    this.connected = false;
    if (this.ws) {
      this.ws.close();
      this.ws = undefined;
    }
  }
}
