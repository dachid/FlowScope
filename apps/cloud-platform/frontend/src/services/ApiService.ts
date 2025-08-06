import type { Session, TraceData } from '../types';

const API_BASE_URL = 'http://localhost:3001/api';

class ApiService {
  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log(`[ApiService] Making request: ${options.method || 'GET'} ${url}`);
    
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      ...options,
    };

    try {
      const response = await fetch(url, defaultOptions);
      
      console.log(`[ApiService] Response: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[ApiService] Error response body:`, errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        console.log(`[ApiService] Response data:`, data);
        return data;
      } else {
        const text = await response.text();
        console.log(`[ApiService] Response text:`, text);
        return text as unknown as T;
      }
    } catch (error) {
      console.error(`[ApiService] Request failed for ${url}:`, error);
      throw error;
    }
  }

  // Initialize demo data
  async initializeDemoData(): Promise<void> {
    console.log('[ApiService] Initializing demo data...');
    await this.makeRequest('/sessions/demo/initialize', {
      method: 'POST',
    });
  }

  // Get all sessions
  async getAllSessions(): Promise<Session[]> {
    console.log('[ApiService] Fetching all sessions...');
    return this.makeRequest<Session[]>('/sessions');
  }

  // Get specific session
  async getSession(sessionId: string): Promise<Session> {
    console.log(`[ApiService] Fetching session: ${sessionId}`);
    return this.makeRequest<Session>(`/sessions/${sessionId}`);
  }

  // Get traces for a session
  async getSessionTraces(sessionId: string): Promise<TraceData[]> {
    console.log(`[ApiService] Fetching traces for session: ${sessionId}`);
    return this.makeRequest<TraceData[]>(`/sessions/${sessionId}/traces`);
  }

  // Create a new session
  async createSession(session: Partial<Session>): Promise<Session> {
    console.log('[ApiService] Creating new session:', session);
    return this.makeRequest<Session>('/sessions', {
      method: 'POST',
      body: JSON.stringify(session),
    });
  }

  // Update a session
  async updateSession(sessionId: string, updates: Partial<Session>): Promise<Session> {
    console.log(`[ApiService] Updating session ${sessionId}:`, updates);
    return this.makeRequest<Session>(`/sessions/${sessionId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  // Delete a session
  async deleteSession(sessionId: string): Promise<void> {
    console.log(`[ApiService] Deleting session: ${sessionId}`);
    await this.makeRequest(`/sessions/${sessionId}`, {
      method: 'DELETE',
    });
  }

  // Add trace to session
  async addTrace(sessionId: string, trace: Partial<TraceData>): Promise<TraceData> {
    console.log(`[ApiService] Adding trace to session ${sessionId}:`, trace);
    return this.makeRequest<TraceData>(`/sessions/${sessionId}/traces`, {
      method: 'POST',
      body: JSON.stringify(trace),
    });
  }

  // Add multiple traces to session
  async addTraces(sessionId: string, traces: Partial<TraceData>[]): Promise<TraceData[]> {
    console.log(`[ApiService] Adding ${traces.length} traces to session ${sessionId}`);
    return this.makeRequest<TraceData[]>(`/sessions/${sessionId}/traces/bulk`, {
      method: 'POST',
      body: JSON.stringify({ traces }),
    });
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    console.log('[ApiService] Performing health check...');
    return this.makeRequest<{ status: string; timestamp: string }>('/health');
  }

  // Convenience method for getSessions (alias)
  async getSessions(): Promise<Session[]> {
    return this.getAllSessions();
  }
}

// Export a singleton instance
export default new ApiService();
