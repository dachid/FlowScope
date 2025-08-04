"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketTransport = exports.HTTPTransport = exports.ConsoleTransport = void 0;
/**
 * Console transport for debugging
 * Outputs traces to console.log
 */
class ConsoleTransport {
    constructor(options = {}) {
        this.options = options;
        this.connected = true;
    }
    async send(data) {
        if (this.options.pretty) {
            console.log('FlowScope Traces:', JSON.stringify(data, null, 2));
        }
        else {
            console.log('FlowScope Traces:', data);
        }
    }
    async flush() {
        // Nothing to flush for console transport
    }
    isConnected() {
        return this.connected;
    }
}
exports.ConsoleTransport = ConsoleTransport;
/**
 * HTTP transport for sending traces to FlowScope backend
 */
class HTTPTransport {
    constructor(endpoint, options = {}) {
        this.endpoint = endpoint;
        this.options = options;
        this.connected = false;
    }
    async send(data) {
        if (!this.connected) {
            throw new Error('HTTP transport not connected');
        }
        const headers = {
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
    async flush() {
        // Nothing additional to flush for HTTP transport
    }
    isConnected() {
        return this.connected;
    }
    async connect() {
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
        }
        catch (error) {
            this.connected = false;
            throw error;
        }
    }
    disconnect() {
        this.connected = false;
    }
}
exports.HTTPTransport = HTTPTransport;
/**
 * WebSocket transport for real-time trace streaming
 */
class WebSocketTransport {
    constructor(endpoint, options = {}) {
        this.endpoint = endpoint;
        this.options = options;
        this.connected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectInterval = 1000;
    }
    async send(data) {
        return new Promise((resolve, reject) => {
            if (!this.connected || !this.ws) {
                reject(new Error('WebSocket not connected'));
                return;
            }
            try {
                this.ws.send(JSON.stringify({ type: 'traces', data }));
                resolve();
            }
            catch (error) {
                reject(error);
            }
        });
    }
    async flush() {
        // WebSocket sends immediately, nothing to flush
    }
    isConnected() {
        return this.connected;
    }
    async connect() {
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
            }
            catch (error) {
                reject(error);
            }
        });
    }
    disconnect() {
        this.connected = false;
        if (this.ws) {
            this.ws.close();
            this.ws = undefined;
        }
    }
}
exports.WebSocketTransport = WebSocketTransport;
