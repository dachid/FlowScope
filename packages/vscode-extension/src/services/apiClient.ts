import axios, { AxiosInstance } from 'axios';
import WebSocket from 'ws';
import { TraceData } from '@flowscope/shared';

export interface TracingSession {
    workspacePath: string;
    timestamp: number;
}

export interface PromptVersion {
    name: string;
    content: string;
    filePath: string;
    lineNumber: number;
}

export interface Bookmark {
    traceId: string;
    description: string;
    timestamp: number;
}

export class FlowScopeApiClient {
    private httpClient: AxiosInstance | null = null;
    private wsClient: WebSocket | null = null;
    private serverUrl: string = '';
    private tracesUpdateCallbacks: ((traces: TraceData[]) => void)[] = [];

    async connect(serverUrl: string): Promise<void> {
        this.serverUrl = serverUrl;
        
        // Initialize HTTP client
        this.httpClient = axios.create({
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

    private initializeWebSocket(): void {
        const wsUrl = this.serverUrl.replace('http', 'ws') + '/traces';
        this.wsClient = new WebSocket(wsUrl);

        if (this.wsClient) {
            this.wsClient.on('open', () => {
                console.log('WebSocket connection established');
            });

            this.wsClient.on('message', (data: WebSocket.Data) => {
                try {
                    const message = JSON.parse(data.toString());
                    
                    if (message.type === 'traces_updated') {
                        this.notifyTracesUpdated(message.traces);
                    }
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                }
            });

            this.wsClient.on('error', (error: Error) => {
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

    async startTracingSession(session: TracingSession): Promise<string> {
        if (!this.httpClient) {
            throw new Error('Not connected to server');
        }

        const response = await this.httpClient.post('/api/traces/sessions', session);
        return response.data.sessionId;
    }

    async stopTracingSession(sessionId: string): Promise<void> {
        if (!this.httpClient) {
            throw new Error('Not connected to server');
        }

        await this.httpClient.delete(`/api/traces/sessions/${sessionId}`);
    }

    async getTraces(): Promise<TraceData[]> {
        if (!this.httpClient) {
            throw new Error('Not connected to server');
        }

        const response = await this.httpClient.get('/api/traces');
        return response.data;
    }

    async getTrace(traceId: string): Promise<TraceData | null> {
        if (!this.httpClient) {
            throw new Error('Not connected to server');
        }

        try {
            const response = await this.httpClient.get(`/api/traces/${traceId}`);
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 404) {
                return null;
            }
            throw error;
        }
    }

    async createPromptVersion(prompt: PromptVersion): Promise<string> {
        if (!this.httpClient) {
            throw new Error('Not connected to server');
        }

        const response = await this.httpClient.post('/api/prompts/versions', prompt);
        return response.data.versionId;
    }

    async getPromptVersions(): Promise<any[]> {
        if (!this.httpClient) {
            throw new Error('Not connected to server');
        }

        const response = await this.httpClient.get('/api/prompts/versions');
        return response.data;
    }

    async addBookmark(bookmark: Bookmark): Promise<string> {
        if (!this.httpClient) {
            throw new Error('Not connected to server');
        }

        const response = await this.httpClient.post('/api/bookmarks', bookmark);
        return response.data.bookmarkId;
    }

    async removeBookmark(bookmarkId: string): Promise<void> {
        if (!this.httpClient) {
            throw new Error('Not connected to server');
        }

        await this.httpClient.delete(`/api/bookmarks/${bookmarkId}`);
    }

    async getBookmarks(): Promise<any[]> {
        if (!this.httpClient) {
            throw new Error('Not connected to server');
        }

        const response = await this.httpClient.get('/api/bookmarks');
        return response.data;
    }

    onTracesUpdated(callback: (traces: TraceData[]) => void): void {
        this.tracesUpdateCallbacks.push(callback);
    }

    private notifyTracesUpdated(traces: TraceData[]): void {
        this.tracesUpdateCallbacks.forEach(callback => {
            try {
                callback(traces);
            } catch (error) {
                console.error('Error in traces update callback:', error);
            }
        });
    }

    disconnect(): void {
        if (this.wsClient) {
            this.wsClient.close();
            this.wsClient = null;
        }
        
        this.httpClient = null;
        this.tracesUpdateCallbacks = [];
        this.serverUrl = '';
    }
}
