import { io, Socket } from 'socket.io-client';
import type { TraceData } from '../types';

// Simple test client to verify WebSocket functionality
class WebSocketTestClient {
  private socket: Socket | null = null;
  private readonly url = 'http://localhost:3001/debug';

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket = io(this.url, {
        transports: ['websocket', 'polling'],
        timeout: 5000,
      });

      this.socket.on('connect', () => {
        console.log('✅ Test client connected:', this.socket?.id);
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.error('❌ Test client connection failed:', error);
        reject(error);
      });

      // Listen for trace events
      this.socket.on('new_trace', (trace: TraceData) => {
        console.log('📡 Received trace via WebSocket:', {
          id: trace.id,
          type: trace.type,
          sessionId: trace.sessionId,
          timestamp: new Date(trace.timestamp).toISOString(),
        });
      });

      this.socket.on('session_joined', (data) => {
        console.log('🔗 Joined session:', data);
      });

      this.socket.on('error', (error) => {
        console.error('🚨 WebSocket error:', error);
      });
    });
  }

  joinSession(sessionId: string): void {
    if (!this.socket?.connected) {
      throw new Error('Not connected to WebSocket server');
    }

    this.socket.emit('join_session', { sessionId });
    console.log(`🎯 Joining session: ${sessionId}`);
  }

  sendTrace(trace: TraceData): void {
    if (!this.socket?.connected) {
      throw new Error('Not connected to WebSocket server');
    }

    this.socket.emit('trace_event', trace);
    console.log(`📤 Sent trace: ${trace.id}`);
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      console.log('👋 Test client disconnected');
    }
  }
}

// Test function
async function runWebSocketTest() {
  const client = new WebSocketTestClient();
  
  try {
    console.log('🚀 Starting WebSocket test...');
    
    // Connect to server
    await client.connect();
    
    // Join a test session
    const sessionId = 'test-session-' + Date.now();
    client.joinSession(sessionId);
    
    // Wait a moment for session join
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Send some test traces
    const testTraces: TraceData[] = [
      {
        id: 'test-trace-1',
        sessionId,
        chainId: 'test-chain',
        timestamp: Date.now(),
        type: 'prompt',
        status: 'completed',
        data: {
          prompt: 'Hello, this is a test prompt',
          model: 'test-model',
        },
      },
      {
        id: 'test-trace-2',
        sessionId,
        chainId: 'test-chain',
        timestamp: Date.now() + 1000,
        type: 'response',
        status: 'completed',
        data: {
          response: 'This is a test response',
        },
      },
    ];
    
    for (const trace of testTraces) {
      client.sendTrace(trace);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('✅ WebSocket test completed successfully');
    
    // Keep connection open for a bit to see responses
    await new Promise(resolve => setTimeout(resolve, 3000));
    
  } catch (error) {
    console.error('❌ WebSocket test failed:', error);
  } finally {
    client.disconnect();
  }
}

// Export for frontend usage
export { WebSocketTestClient, runWebSocketTest };
