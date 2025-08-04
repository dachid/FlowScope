"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useWebSocket = void 0;
const react_1 = require("react");
const socket_io_client_1 = require("socket.io-client");
const debugger_1 = require("../store/debugger");
const useWebSocket = (options = {}) => {
    const { url = import.meta.env.VITE_BACKEND_WS_URL || 'http://localhost:3001/debug', // Backend WebSocket URL
    autoConnect = true, } = options;
    const socketRef = (0, react_1.useRef)(null);
    const [status, setStatus] = (0, react_1.useState)({
        connected: false,
        connecting: false,
        error: null,
    });
    const { addTrace, currentSession } = (0, debugger_1.useDebuggerStore)();
    // Connect to WebSocket
    const connect = (0, react_1.useCallback)(() => {
        if (socketRef.current?.connected) {
            return; // Already connected
        }
        setStatus(prev => ({ ...prev, connecting: true, error: null }));
        try {
            const socket = (0, socket_io_client_1.io)(url, {
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
            socket.on('new_trace', (trace) => {
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
        }
        catch (error) {
            console.error('Failed to create WebSocket connection:', error);
            setStatus(prev => ({
                ...prev,
                connecting: false,
                error: error instanceof Error ? error.message : 'Connection failed',
            }));
        }
    }, [url, addTrace]);
    // Disconnect from WebSocket
    const disconnect = (0, react_1.useCallback)(() => {
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
    const joinSession = (0, react_1.useCallback)((sessionId, userId) => {
        if (socketRef.current?.connected) {
            socketRef.current.emit('join_session', { sessionId, userId });
        }
    }, []);
    // Leave a debugging session
    const leaveSession = (0, react_1.useCallback)((sessionId) => {
        if (socketRef.current?.connected) {
            socketRef.current.emit('leave_session', { sessionId });
        }
    }, []);
    // Send a trace event
    const sendTrace = (0, react_1.useCallback)((trace) => {
        if (socketRef.current?.connected) {
            socketRef.current.emit('trace_event', trace);
        }
    }, []);
    // Request current session state
    const requestSessionState = (0, react_1.useCallback)((sessionId) => {
        if (socketRef.current?.connected) {
            socketRef.current.emit('request_session_state', { sessionId });
        }
    }, []);
    // Auto-join current session when it changes
    (0, react_1.useEffect)(() => {
        if (currentSession && status.connected) {
            joinSession(currentSession.id);
            requestSessionState(currentSession.id);
        }
    }, [currentSession, status.connected, joinSession, requestSessionState]);
    // Auto-connect on mount
    (0, react_1.useEffect)(() => {
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
exports.useWebSocket = useWebSocket;
