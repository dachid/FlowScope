"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FlowScopeApiClient = void 0;
const axios_1 = __importDefault(require("axios"));
const ws_1 = __importDefault(require("ws"));
class FlowScopeApiClient {
    constructor() {
        this.httpClient = null;
        this.wsClient = null;
        this.serverUrl = '';
        this.tracesUpdateCallbacks = [];
    }
    async connect(serverUrl) {
        this.serverUrl = serverUrl;
        // Initialize HTTP client
        this.httpClient = axios_1.default.create({
            baseURL: serverUrl,
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        // Test connection
        await this.httpClient.get('/health');
        // Initialize WebSocket connection
        this.initializeWebSocket();
    }
    initializeWebSocket() {
        const wsUrl = this.serverUrl.replace('http', 'ws') + '/traces';
        this.wsClient = new ws_1.default(wsUrl);
        if (this.wsClient) {
            this.wsClient.on('open', () => {
                console.log('WebSocket connection established');
            });
            this.wsClient.on('message', (data) => {
                try {
                    const message = JSON.parse(data.toString());
                    if (message.type === 'traces_updated') {
                        this.notifyTracesUpdated(message.traces);
                    }
                }
                catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                }
            });
            this.wsClient.on('error', (error) => {
                console.error('WebSocket error:', error);
            });
            this.wsClient.on('close', () => {
                console.log('WebSocket connection closed');
                // Attempt reconnection after 5 seconds
                setTimeout(() => {
                    if (this.serverUrl) {
                        this.initializeWebSocket();
                    }
                }, 5000);
            });
        }
    }
    async startTracingSession(session) {
        if (!this.httpClient) {
            throw new Error('Not connected to server');
        }
        const response = await this.httpClient.post('/api/traces/sessions', session);
        return response.data.sessionId;
    }
    async stopTracingSession(sessionId) {
        if (!this.httpClient) {
            throw new Error('Not connected to server');
        }
        await this.httpClient.delete(`/api/traces/sessions/${sessionId}`);
    }
    async getTraces() {
        if (!this.httpClient) {
            throw new Error('Not connected to server');
        }
        const response = await this.httpClient.get('/api/traces');
        return response.data;
    }
    async getTrace(traceId) {
        if (!this.httpClient) {
            throw new Error('Not connected to server');
        }
        try {
            const response = await this.httpClient.get(`/api/traces/${traceId}`);
            return response.data;
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error) && error.response?.status === 404) {
                return null;
            }
            throw error;
        }
    }
    async createPromptVersion(prompt) {
        if (!this.httpClient) {
            throw new Error('Not connected to server');
        }
        const response = await this.httpClient.post('/api/prompts/versions', prompt);
        return response.data.versionId;
    }
    async getPromptVersions() {
        if (!this.httpClient) {
            throw new Error('Not connected to server');
        }
        const response = await this.httpClient.get('/api/prompts/versions');
        return response.data;
    }
    async addBookmark(bookmark) {
        if (!this.httpClient) {
            throw new Error('Not connected to server');
        }
        const response = await this.httpClient.post('/api/bookmarks', bookmark);
        return response.data.bookmarkId;
    }
    async removeBookmark(bookmarkId) {
        if (!this.httpClient) {
            throw new Error('Not connected to server');
        }
        await this.httpClient.delete(`/api/bookmarks/${bookmarkId}`);
    }
    async getBookmarks() {
        if (!this.httpClient) {
            throw new Error('Not connected to server');
        }
        const response = await this.httpClient.get('/api/bookmarks');
        return response.data;
    }
    onTracesUpdated(callback) {
        this.tracesUpdateCallbacks.push(callback);
    }
    notifyTracesUpdated(traces) {
        this.tracesUpdateCallbacks.forEach(callback => {
            try {
                callback(traces);
            }
            catch (error) {
                console.error('Error in traces update callback:', error);
            }
        });
    }
    disconnect() {
        if (this.wsClient) {
            this.wsClient.close();
            this.wsClient = null;
        }
        this.httpClient = null;
        this.tracesUpdateCallbacks = [];
        this.serverUrl = '';
    }
}
exports.FlowScopeApiClient = FlowScopeApiClient;
