import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import type { TraceData } from '../types';
import { useDebuggerStore } from '../store/debugger';

interface UseWebSocketOptions {
  url?: string;
  autoConnect?: boolean;
}

interface WebSocketStatus {
  connected: boolean;
  connecting: boolean;
  error: string | null;
  lastPing?: number;
}

interface ServerToClientEvents {
  connected: (data: { clientId: string; timestamp: number }) => void;
  session_joined: (data: { sessionId: string; timestamp: number }) => void;
  new_trace: (trace: TraceData) => void;
  session_state: (data: { sessionId: string; traces: TraceData[]; timestamp: number }) => void;
  session_update: (update: any) => void;
  error: (error: { message: string }) => void;
}

interface ClientToServerEvents {
  join_session: (data: { sessionId: string; userId?: string }) => void;
  leave_session: (data: { sessionId: string }) => void;
  trace_event: (trace: TraceData) => void;
  request_session_state: (data: { sessionId: string }) => void;
}

export const useWebSocket = (options: UseWebSocketOptions = {}) => {
  const {
    url = import.meta.env.VITE_BACKEND_WS_URL || 'http://localhost:3001/debug', // Backend WebSocket URL
    autoConnect = true,
  } = options;

  const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
  const [status, setStatus] = useState<WebSocketStatus>({
    connected: false,
    connecting: false,
    error: null,
  });

  const { addTrace, currentSession } = useDebuggerStore();

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (socketRef.current?.connected) {
      return; // Already connected
    }

    setStatus(prev => ({ ...prev, connecting: true, error: null }));

    try {
      const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(url, {
        transports: ['websocket', 'polling'],
        timeout: 10000,
        forceNew: true,
      });

      // Connection event handlers
      socket.on('connect', () => {
        console.log('WebSocket connected:', socket.id);
        setStatus({
          connected: true,
          connecting: false,
          error: null,
          lastPing: Date.now(),
        });
      });

      socket.on('disconnect', (reason) => {
        console.log('WebSocket disconnected:', reason);
        setStatus(prev => ({
          ...prev,
          connected: false,
          connecting: false,
          error: `Disconnected: ${reason}`,
        }));
      });

      socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
        setStatus(prev => ({
          ...prev,
          connected: false,
          connecting: false,
          error: error.message,
        }));
      });

      // FlowScope-specific event handlers
      socket.on('connected', (data) => {
        console.log('FlowScope WebSocket ready:', data);
      });

      socket.on('new_trace', (trace: TraceData) => {
        console.log('Received new trace:', trace);
        addTrace(trace);
      });

      socket.on('session_joined', (data) => {
        console.log('Joined session:', data);
      });

      socket.on('session_state', (data) => {
        console.log('Received session state:', data);
        // Load existing traces for the session
        data.traces.forEach(trace => addTrace(trace));
      });

      socket.on('error', (error) => {
        console.error('WebSocket error:', error);
        setStatus(prev => ({ ...prev, error: error.message }));
      });

      socketRef.current = socket;
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setStatus(prev => ({
        ...prev,
        connecting: false,
        error: error instanceof Error ? error.message : 'Connection failed',
      }));
    }
  }, [url, addTrace]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setStatus({
      connected: false,
      connecting: false,
      error: null,
    });
  }, []);

  // Join a debugging session
  const joinSession = useCallback((sessionId: string, userId?: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('join_session', { sessionId, userId });
    }
  }, []);

  // Leave a debugging session
  const leaveSession = useCallback((sessionId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('leave_session', { sessionId });
    }
  }, []);

  // Send a trace event
  const sendTrace = useCallback((trace: TraceData) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('trace_event', trace);
    }
  }, []);

  // Request current session state
  const requestSessionState = useCallback((sessionId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('request_session_state', { sessionId });
    }
  }, []);

  // Auto-join current session when it changes
  useEffect(() => {
    if (currentSession && status.connected) {
      joinSession(currentSession.id);
      requestSessionState(currentSession.id);
    }
  }, [currentSession, status.connected, joinSession, requestSessionState]);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  return {
    status,
    connect,
    disconnect,
    joinSession,
    leaveSession,
    sendTrace,
    requestSessionState,
    socket: socketRef.current,
  };
};
