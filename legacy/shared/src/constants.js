"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.STORAGE_KEYS = exports.EVENT_TYPES = exports.ERROR_CODES = exports.API_ENDPOINTS = exports.DEFAULT_CONFIG = void 0;
exports.DEFAULT_CONFIG = {
    apiUrl: 'http://localhost:3000',
    environment: 'development',
    enableRealtime: true,
    storage: {
        type: 'local',
        path: './data',
    },
    auth: {
        type: 'local',
        tokenExpiration: 86400000, // 24 hours in milliseconds
    },
};
exports.API_ENDPOINTS = {
    SESSIONS: '/api/sessions',
    TRACES: '/api/traces',
    PROMPTS: '/api/prompts',
    USERS: '/api/users',
    TEAMS: '/api/teams',
    PROJECTS: '/api/projects',
    AUTH: '/api/auth',
    WEBSOCKET: '/ws',
};
exports.ERROR_CODES = {
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    NOT_FOUND: 'NOT_FOUND',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    NETWORK_ERROR: 'NETWORK_ERROR',
    TIMEOUT: 'TIMEOUT',
};
exports.EVENT_TYPES = {
    TRACE_CREATED: 'trace:created',
    TRACE_UPDATED: 'trace:updated',
    SESSION_STARTED: 'session:started',
    SESSION_ENDED: 'session:ended',
    PROMPT_CREATED: 'prompt:created',
    PROMPT_UPDATED: 'prompt:updated',
    USER_JOINED: 'user:joined',
    USER_LEFT: 'user:left',
};
exports.STORAGE_KEYS = {
    USER_TOKEN: 'flowscope:token',
    USER_PREFERENCES: 'flowscope:preferences',
    ACTIVE_SESSION: 'flowscope:session',
    RECENT_PROJECTS: 'flowscope:recent',
};
