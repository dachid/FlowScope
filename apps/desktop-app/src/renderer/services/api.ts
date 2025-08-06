import { Session, Trace, Bookmark } from '../../shared/types';

interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

class APIService {
  private baseURL: string;
  private wsConnection: WebSocket | null = null;
  private wsReconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor() {
    this.baseURL = 'http://localhost:31847';
  }

  // Initialize WebSocket connection for real-time updates
  async initializeWebSocket(): Promise<void> {
    try {
      const wsURL = this.baseURL.replace('http', 'ws');
      this.wsConnection = new WebSocket(wsURL);

      this.wsConnection.onopen = () => {
        console.log('WebSocket connected');
        this.wsReconnectAttempts = 0;
      };

      this.wsConnection.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleWebSocketMessage(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.wsConnection.onclose = () => {
        console.log('WebSocket disconnected');
        this.scheduleReconnect();
      };

      this.wsConnection.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('Failed to initialize WebSocket:', error);
    }
  }

  private scheduleReconnect(): void {
    if (this.wsReconnectAttempts < this.maxReconnectAttempts) {
      setTimeout(() => {
        this.wsReconnectAttempts++;
        console.log('Attempting to reconnect WebSocket (' + this.wsReconnectAttempts + '/' + this.maxReconnectAttempts + ')');
        this.initializeWebSocket();
      }, this.reconnectDelay * this.wsReconnectAttempts);
    }
  }

  private handleWebSocketMessage(message: any): void {
    const { type, data } = message;
    
    // Emit custom events that can be listened to by the React components
    const event = new CustomEvent('flowscope-realtime', {
      detail: { type, data }
    });
    window.dispatchEvent(event);
  }

  disconnect(): void {
    if (this.wsConnection) {
      this.wsConnection.close();
      this.wsConnection = null;
    }
  }

  // Health check
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(this.baseURL + '/health');
      const data = await response.json();
      return data.status === 'ready';
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }

  // Session API methods
  async getSessions(limit = 100, offset = 0): Promise<Session[]> {
    try {
      const response = await fetch(this.baseURL + '/api/sessions?limit=' + limit + '&offset=' + offset);
      const result: APIResponse<Session[]> = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch sessions');
      }
      
      return result.data || [];
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
      throw error;
    }
  }

  async getSession(id: string): Promise<Session | null> {
    try {
      const response = await fetch(this.baseURL + '/api/sessions/' + id);
      const result: APIResponse<Session> = await response.json();
      
      if (!result.success) {
        if (response.status === 404) return null;
        throw new Error(result.error || 'Failed to fetch session');
      }
      
      return result.data || null;
    } catch (error) {
      console.error('Failed to fetch session:', error);
      throw error;
    }
  }

  async createSession(sessionData: Partial<Session>): Promise<Session> {
    try {
      const response = await fetch(this.baseURL + '/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sessionData),
      });
      
      const result: APIResponse<Session> = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create session');
      }
      
      return result.data!;
    } catch (error) {
      console.error('Failed to create session:', error);
      throw error;
    }
  }

  async updateSession(id: string, updates: Partial<Session>): Promise<Session> {
    try {
      const response = await fetch(this.baseURL + '/api/sessions/' + id, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      
      const result: APIResponse<Session> = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to update session');
      }
      
      return result.data!;
    } catch (error) {
      console.error('Failed to update session:', error);
      throw error;
    }
  }

  // Trace API methods
  async getTraces(sessionId: string, limit = 1000, offset = 0): Promise<Trace[]> {
    try {
      const response = await fetch(this.baseURL + '/api/sessions/' + sessionId + '/traces?limit=' + limit + '&offset=' + offset);
      const result: APIResponse<Trace[]> = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch traces');
      }
      
      return result.data || [];
    } catch (error) {
      console.error('Failed to fetch traces:', error);
      throw error;
    }
  }

  async getTrace(id: string): Promise<Trace | null> {
    try {
      const response = await fetch(this.baseURL + '/api/traces/' + id);
      const result: APIResponse<Trace> = await response.json();
      
      if (!result.success) {
        if (response.status === 404) return null;
        throw new Error(result.error || 'Failed to fetch trace');
      }
      
      return result.data || null;
    } catch (error) {
      console.error('Failed to fetch trace:', error);
      throw error;
    }
  }

  async createTrace(traceData: Partial<Trace>): Promise<Trace> {
    try {
      const response = await fetch(this.baseURL + '/api/traces', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(traceData),
      });
      
      const result: APIResponse<Trace> = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create trace');
      }
      
      return result.data!;
    } catch (error) {
      console.error('Failed to create trace:', error);
      throw error;
    }
  }

  async updateTrace(id: string, updates: Partial<Trace>): Promise<Trace> {
    try {
      const response = await fetch(this.baseURL + '/api/traces/' + id, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      
      const result: APIResponse<Trace> = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to update trace');
      }
      
      return result.data!;
    } catch (error) {
      console.error('Failed to update trace:', error);
      throw error;
    }
  }

  // Bookmark API methods
  async getBookmarks(): Promise<Bookmark[]> {
    try {
      const response = await fetch(this.baseURL + '/api/bookmarks');
      const result: APIResponse<Bookmark[]> = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch bookmarks');
      }
      
      return result.data || [];
    } catch (error) {
      console.error('Failed to fetch bookmarks:', error);
      throw error;
    }
  }

  async createBookmark(bookmarkData: Partial<Bookmark>): Promise<Bookmark> {
    try {
      const response = await fetch(this.baseURL + '/api/bookmarks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookmarkData),
      });
      
      const result: APIResponse<Bookmark> = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create bookmark');
      }
      
      return result.data!;
    } catch (error) {
      console.error('Failed to create bookmark:', error);
      throw error;
    }
  }

  // Statistics
  async getStats(): Promise<any> {
    try {
      const response = await fetch(this.baseURL + '/api/stats');
      const result: APIResponse<any> = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch stats');
      }
      
      return result.data || {};
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      throw error;
    }
  }
}

export const apiService = new APIService();
export default APIService;
