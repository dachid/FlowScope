export interface FlowScopeConfig {
    apiUrl?: string;
    apiKey?: string;
    projectId?: string;
    environment?: 'development' | 'staging' | 'production';
    enableRealtime?: boolean;
    storage?: StorageConfig;
    auth?: AuthConfig;
}
export interface StorageConfig {
    type: 'local' | 'cloud';
    path?: string;
    cloudConfig?: {
        provider: 'aws' | 'supabase';
        bucket?: string;
        region?: string;
    };
}
export interface AuthConfig {
    type: 'local' | 'jwt' | 'oauth';
    secretKey?: string;
    tokenExpiration?: number;
}
export interface TraceData {
    id: string;
    timestamp: number;
    sessionId: string;
    chainId: string;
    type: TraceEventType;
    data: unknown;
    metadata?: Record<string, unknown>;
    parentId?: string;
    duration?: number;
    status: TraceStatus;
}
export type TraceEventType = 'chain_start' | 'chain_end' | 'prompt' | 'response' | 'function_call' | 'tool_use' | 'agent_step' | 'error' | 'warning';
export type TraceStatus = 'pending' | 'completed' | 'failed' | 'cancelled';
export interface Session {
    id: string;
    name?: string;
    startTime: number;
    endTime?: number;
    status: SessionStatus;
    metadata?: Record<string, unknown>;
    traces: TraceData[];
}
export type SessionStatus = 'active' | 'completed' | 'failed';
export interface User {
    id: string;
    email?: string;
    name?: string;
    role: UserRole;
    createdAt: number;
    lastActiveAt: number;
}
export type UserRole = 'admin' | 'developer' | 'viewer';
export interface Team {
    id: string;
    name: string;
    description?: string;
    members: TeamMember[];
    projects: Project[];
    createdAt: number;
}
export interface TeamMember {
    userId: string;
    role: TeamRole;
    joinedAt: number;
}
export type TeamRole = 'owner' | 'admin' | 'member' | 'viewer';
export interface Project {
    id: string;
    name: string;
    description?: string;
    teamId?: string;
    ownerId: string;
    settings: ProjectSettings;
    createdAt: number;
    updatedAt: number;
}
export interface ProjectSettings {
    framework?: LLMFramework;
    environment: 'development' | 'staging' | 'production';
    retentionDays: number;
    enableRealtime: boolean;
}
export type LLMFramework = 'langchain' | 'llamaindex' | 'flowise' | 'autogen' | 'crewai' | 'custom';
export interface Prompt {
    id: string;
    name: string;
    description?: string;
    projectId: string;
    currentVersionId: string;
    createdAt: number;
    updatedAt: number;
}
export interface PromptVersion {
    id: string;
    promptId: string;
    version: string;
    content: PromptContent;
    parentVersionId?: string;
    createdAt: number;
    createdBy: string;
    message?: string;
}
export interface PromptContent {
    template: string;
    variables?: Record<string, PromptVariable>;
    metadata?: Record<string, unknown>;
}
export interface PromptVariable {
    type: 'string' | 'number' | 'boolean' | 'array' | 'object';
    description?: string;
    defaultValue?: unknown;
    required?: boolean;
}
export interface ChainExecution {
    id: string;
    sessionId: string;
    promptId?: string;
    promptVersionId?: string;
    startTime: number;
    endTime?: number;
    status: TraceStatus;
    input: unknown;
    output?: unknown;
    error?: string;
    metadata?: Record<string, unknown>;
    traces: TraceData[];
}
export interface APIResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
    timestamp: number;
}
