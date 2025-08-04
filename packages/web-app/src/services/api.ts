import type { Session, TraceData } from '@flowscope/shared';

const API_BASE_URL = 'http://localhost:3001/api';

export class ApiService {
  private static async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return response.json();
  }

  // Demo data initialization
  static async initializeDemoData(): Promise<{ 
    sessions: Session[], 
    traces: { [sessionId: string]: TraceData[] } 
  }> {
    return this.makeRequest('/sessions/demo/initialize', {
      method: 'POST',
    });
  }

  // Session management
  static async createSession(data: {
    name?: string;
    userId?: string;
    projectId?: string;
    metadata?: any;
  }): Promise<Session> {
    return this.makeRequest('/sessions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async getAllSessions(userId?: string): Promise<Session[]> {
    const queryParams = userId ? `?userId=${encodeURIComponent(userId)}` : '';
    return this.makeRequest(`/sessions${queryParams}`);
  }

  static async getSession(id: string): Promise<Session | null> {
    return this.makeRequest(`/sessions/${id}`);
  }

  static async updateSession(id: string, data: Partial<Session>): Promise<Session> {
    return this.makeRequest(`/sessions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  static async deleteSession(id: string): Promise<void> {
    return this.makeRequest(`/sessions/${id}`, {
      method: 'DELETE',
    });
  }

  // Trace management
  static async addTrace(sessionId: string, trace: Omit<TraceData, 'id'>): Promise<TraceData> {
    return this.makeRequest(`/sessions/${sessionId}/traces`, {
      method: 'POST',
      body: JSON.stringify(trace),
    });
  }

  static async addMultipleTraces(
    sessionId: string, 
    traces: Omit<TraceData, 'id'>[]
  ): Promise<TraceData[]> {
    return this.makeRequest(`/sessions/${sessionId}/traces/bulk`, {
      method: 'POST',
      body: JSON.stringify(traces),
    });
  }

  static async getSessionTraces(sessionId: string): Promise<TraceData[]> {
    return this.makeRequest(`/sessions/${sessionId}/traces`);
  }

  // Health check
  static async healthCheck(): Promise<{ status: string, service: string }> {
    return this.makeRequest('/health');
  }
}
