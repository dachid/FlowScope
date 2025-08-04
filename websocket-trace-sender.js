// websocket-trace-sender.js - Send traces via WebSocket
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001/debug');

socket.on('connect', () => {
  console.log('🔌 Connected to FlowScope WebSocket');
  
  // Join a session
  socket.emit('join_session', { 
    sessionId: 'websocket-live-session',
    userId: 'test-user'
  });
});

socket.on('session_joined', (data) => {
  console.log('🎯 Joined session:', data.sessionId);
  startSendingTraces();
});

function generateTrace() {
  const operations = ['prompt', 'llm', 'retrieval', 'tool', 'output'];
  const models = ['gpt-4', 'gpt-3.5-turbo', 'claude-3', 'gemini-pro'];
  
  return {
    id: `ws-trace-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    sessionId: 'websocket-live-session',
    type: operations[Math.floor(Math.random() * operations.length)],
    input: {
      prompt: `Live trace generated at ${new Date().toLocaleTimeString()}`,
      model: models[Math.floor(Math.random() * models.length)],
      temperature: Math.random(),
      timestamp: new Date().toISOString()
    },
    output: {
      response: `Simulated AI response - ${Math.random().toString(36).substr(2, 15)}`,
      tokens: Math.floor(Math.random() * 200) + 50,
      confidence: Math.random()
    },
    metadata: {
      cost: (Math.random() * 0.02).toFixed(4),
      duration_ms: Math.floor(Math.random() * 3000) + 200,
      provider: Math.random() > 0.5 ? 'openai' : 'anthropic'
    },
    startTime: new Date().toISOString(),
    endTime: new Date(Date.now() + Math.random() * 3000).toISOString()
  };
}

function startSendingTraces() {
  setInterval(() => {
    const trace = generateTrace();
    socket.emit('trace_event', trace);
    console.log('📡 Sent WebSocket trace:', trace.id);
  }, 3000); // Send every 3 seconds
  
  // Send initial trace
  const initialTrace = generateTrace();
  socket.emit('trace_event', initialTrace);
  console.log('📡 Sent initial WebSocket trace:', initialTrace.id);
}

socket.on('error', (error) => {
  console.error('❌ WebSocket error:', error);
});

socket.on('disconnect', () => {
  console.log('🔌 Disconnected from FlowScope WebSocket');
});

console.log('🚀 WebSocket trace sender started. Connecting to ws://localhost:3001/debug');
