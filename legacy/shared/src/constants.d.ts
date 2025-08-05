export declare const DEFAULT_CONFIG: {
    apiUrl: string;
    environment: "development";
    enableRealtime: boolean;
    storage: {
        type: "local";
        path: string;
    };
    auth: {
        type: "local";
        tokenExpiration: number;
    };
};
export declare const API_ENDPOINTS: {
    readonly SESSIONS: "/api/sessions";
    readonly TRACES: "/api/traces";
    readonly PROMPTS: "/api/prompts";
    readonly USERS: "/api/users";
    readonly TEAMS: "/api/teams";
    readonly PROJECTS: "/api/projects";
    readonly AUTH: "/api/auth";
    readonly WEBSOCKET: "/ws";
};
export declare const ERROR_CODES: {
    readonly UNAUTHORIZED: "UNAUTHORIZED";
    readonly FORBIDDEN: "FORBIDDEN";
    readonly NOT_FOUND: "NOT_FOUND";
    readonly VALIDATION_ERROR: "VALIDATION_ERROR";
    readonly INTERNAL_ERROR: "INTERNAL_ERROR";
    readonly NETWORK_ERROR: "NETWORK_ERROR";
    readonly TIMEOUT: "TIMEOUT";
};
export declare const EVENT_TYPES: {
    readonly TRACE_CREATED: "trace:created";
    readonly TRACE_UPDATED: "trace:updated";
    readonly SESSION_STARTED: "session:started";
    readonly SESSION_ENDED: "session:ended";
    readonly PROMPT_CREATED: "prompt:created";
    readonly PROMPT_UPDATED: "prompt:updated";
    readonly USER_JOINED: "user:joined";
    readonly USER_LEFT: "user:left";
};
export declare const STORAGE_KEYS: {
    readonly USER_TOKEN: "flowscope:token";
    readonly USER_PREFERENCES: "flowscope:preferences";
    readonly ACTIVE_SESSION: "flowscope:session";
    readonly RECENT_PROJECTS: "flowscope:recent";
};
