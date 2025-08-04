// Mock FlowScope SDK for demonstration purposes
// This simulates the actual SDK behavior for our examples

export interface TraceData {
  id: string;
  sessionId: string;
  timestamp: string;
  type: 'prompt' | 'response' | 'function_call' | 'chain_start' | 'chain_end' | 'tool_call' | 'error';
  data: any;
  metadata?: any;
  duration?: number;
  parentId?: string;
  children?: string[];
  status: 'success' | 'error' | 'pending';
  tags?: string[];
  startTime: string;
  endTime?: string;
}

export class FlowScopeSDK {
  private traces: TraceData[] = [];
  private currentSessionId: string | null = null;
  private isInitialized = false;

  constructor(options: { endpoint?: string; apiKey?: string; autoDetect?: boolean } = {}) {
    console.log('🔧 FlowScope SDK initialized (mock implementation)');
  }

  async init(): Promise<void> {
    this.isInitialized = true;
    console.log('✅ FlowScope SDK mock initialized');
  }

  startSession(sessionId?: string): string {
    this.currentSessionId = sessionId || `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    console.log(`📝 Started FlowScope session: ${this.currentSessionId}`);
    return this.currentSessionId;
  }

  endSession(): void {
    if (this.currentSessionId) {
      console.log(`✅ Ended FlowScope session: ${this.currentSessionId}`);
      this.currentSessionId = null;
    }
  }

  trace(type: TraceData['type'], data: any, metadata?: any): TraceData {
    const trace: TraceData = {
      id: `trace_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      sessionId: this.currentSessionId || 'default_session',
      timestamp: new Date().toISOString(),
      type,
      data,
      metadata,
      status: 'success',
      startTime: new Date().toISOString(),
      tags: ['mock', 'example']
    };

    this.traces.push(trace);
    console.log(`📊 FlowScope trace captured: ${type} - ${trace.id}`);
    return trace;
  }

  tracePrompt(prompt: string, metadata?: any): TraceData {
    return this.trace('prompt', { prompt }, metadata);
  }

  traceResponse(response: string, metadata?: any): TraceData {
    return this.trace('response', { response }, metadata);
  }

  traceFunctionCall(functionName: string, args: any, result?: any, metadata?: any): TraceData {
    return this.trace('function_call', { functionName, args, result }, metadata);
  }

  traceChainStart(chainName: string, input: any, metadata?: any): TraceData {
    return this.trace('chain_start', { chainName, input }, metadata);
  }

  traceChainEnd(chainName: string, output: any, metadata?: any): TraceData {
    return this.trace('chain_end', { chainName, output }, metadata);
  }

  traceError(error: Error, metadata?: any): TraceData {
    return this.trace('error', { 
      message: error.message, 
      stack: error.stack,
      name: error.name 
    }, metadata);
  }

  getTraces(): TraceData[] {
    return [...this.traces];
  }

  getSessionTraces(sessionId: string): TraceData[] {
    return this.traces.filter(trace => trace.sessionId === sessionId);
  }

  clearTraces(): void {
    this.traces = [];
    console.log('🧹 FlowScope traces cleared');
  }

  getStats(): { totalTraces: number; sessions: number; isInitialized: boolean } {
    const sessions = new Set(this.traces.map(t => t.sessionId)).size;
    return {
      totalTraces: this.traces.length,
      sessions,
      isInitialized: this.isInitialized
    };
  }
}

// Create default instance
export const flowscope = new FlowScopeSDK();
