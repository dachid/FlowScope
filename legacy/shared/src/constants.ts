export const DEFAULT_CONFIG = {
  apiUrl: 'http://localhost:3000',
  environment: 'development' as const,
  enableRealtime: true,
  storage: {
    type: 'local' as const,
    path: './data',
  },
  auth: {
    type: 'local' as const,
    tokenExpiration: 86400000, // 24 hours in milliseconds
  },
};

export const API_ENDPOINTS = {
  SESSIONS: '/api/sessions',
  TRACES: '/api/traces',
  PROMPTS: '/api/prompts',
  USERS: '/api/users',
  TEAMS: '/api/teams',
  PROJECTS: '/api/projects',
  AUTH: '/api/auth',
  WEBSOCKET: '/ws',
} as const;

export const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT',
} as const;

export const EVENT_TYPES = {
  TRACE_CREATED: 'trace:created',
  TRACE_UPDATED: 'trace:updated',
  SESSION_STARTED: 'session:started',
  SESSION_ENDED: 'session:ended',
  PROMPT_CREATED: 'prompt:created',
  PROMPT_UPDATED: 'prompt:updated',
  USER_JOINED: 'user:joined',
  USER_LEFT: 'user:left',
} as const;

export const STORAGE_KEYS = {
  USER_TOKEN: 'flowscope:token',
  USER_PREFERENCES: 'flowscope:preferences',
  ACTIVE_SESSION: 'flowscope:session',
  RECENT_PROJECTS: 'flowscope:recent',
} as const;
