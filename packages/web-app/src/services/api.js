"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiService = void 0;
const API_BASE_URL = 'http://localhost:3001/api';
class ApiService {
    static async makeRequest(endpoint, options = {}) {
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
    static async initializeDemoData() {
        return this.makeRequest('/sessions/demo/initialize', {
            method: 'POST',
        });
    }
    // Session management
    static async createSession(data) {
        return this.makeRequest('/sessions', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }
    static async getAllSessions(userId) {
        const queryParams = userId ? `?userId=${encodeURIComponent(userId)}` : '';
        return this.makeRequest(`/sessions${queryParams}`);
    }
    static async getSession(id) {
        return this.makeRequest(`/sessions/${id}`);
    }
    static async updateSession(id, data) {
        return this.makeRequest(`/sessions/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }
    static async deleteSession(id) {
        return this.makeRequest(`/sessions/${id}`, {
            method: 'DELETE',
        });
    }
    // Trace management
    static async addTrace(sessionId, trace) {
        return this.makeRequest(`/sessions/${sessionId}/traces`, {
            method: 'POST',
            body: JSON.stringify(trace),
        });
    }
    static async addMultipleTraces(sessionId, traces) {
        return this.makeRequest(`/sessions/${sessionId}/traces/bulk`, {
            method: 'POST',
            body: JSON.stringify(traces),
        });
    }
    static async getSessionTraces(sessionId) {
        return this.makeRequest(`/sessions/${sessionId}/traces`);
    }
    // Health check
    static async healthCheck() {
        return this.makeRequest('/health');
    }
}
exports.ApiService = ApiService;
