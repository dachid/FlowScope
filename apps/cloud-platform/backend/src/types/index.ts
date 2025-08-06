// Cloud Platform Backend Types
// Independent type definitions for the backend API

export type TraceStatus = 'pending' | 'success' | 'error' | 'timeout';
export type SessionStatus = 'active' | 'completed' | 'archived';
export type TraceEventType = 'llm_call' | 'function_call' | 'chain_execution' | 'custom';

// Legacy trace interface for compatibility
export interface TraceData {
  id: string;
  sessionId: string;
  chainId?: string;
  timestamp: number;
  type: string;
  status: TraceStatus;
  data: Record<string, any>;
  metadata?: Record<string, any>;
  tags?: string[];
}

// Universal trace interfaces
export interface UniversalTraceData {
  id: string;
  sessionId: string;
  parentId?: string;
  operation: string;
  startedAt: Date;
  completedAt?: Date;
  durationMs?: number;
  status: TraceStatus;
  framework: string;
  modelName?: string;
  sourceFile?: string;
  sourceLine?: number;
  metadata?: Record<string, any>;
  data: Record<string, any>;
  tags?: string[];
}

export interface UniversalSession {
  id: string;
  workspaceId: string;
  userId: string;
  name?: string;
  description?: string;
  status: SessionStatus;
  startedAt: Date;
  completedAt?: Date;
  framework?: string;
  environment?: string;
  metadata?: Record<string, any>;
}

export interface TraceBatch {
  batchId: string;
  sessionId: string;
  traces: UniversalTraceData[];
  metadata?: Record<string, any>;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

export interface LanguageDetectionResult {
  language: string;
  confidence: number;
  framework?: string;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  tier: 'free' | 'individual' | 'team' | 'enterprise';
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  subscriptionStatus?: string;
  subscriptionCurrentPeriodEnd?: Date;
  monthlyTracesUsed: number;
  monthlyStorageUsed: number;
  createdAt: Date;
  updatedAt: Date;
  lastSeenAt?: Date;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  tier: 'team' | 'enterprise';
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  maxSeats: number;
  ssoDomain?: string;
  ssoEnabled: boolean;
  auditLogRetentionDays: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  organizationId?: string;
  visibility: 'private' | 'team' | 'public';
  projectType?: string;
  gitRepository?: string;
  localPath?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Trace {
  id: string;
  sessionId: string;
  workspaceId: string;
  userId: string;
  externalId?: string;
  parentId?: string;
  operation: string;
  startedAt: Date;
  completedAt?: Date;
  durationMs?: number;
  status: 'pending' | 'success' | 'error' | 'timeout';
  framework: string;
  modelName?: string;
  sourceFile?: string;
  sourceLine?: string;
  sourceFunction?: string;
  traceDataUrl?: string;
  dataSizeBytes?: number;
  metadata?: Record<string, any>;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Session {
  id: string;
  workspaceId: string;
  userId: string;
  name?: string;
  description?: string;
  status: 'active' | 'completed' | 'archived';
  startedAt: Date;
  completedAt?: Date;
  framework?: string;
  sdkVersion?: string;
  environment?: string;
  gitCommit?: string;
  totalTraces: number;
  totalDurationMs: number;
  errorCount: number;
  successCount: number;
}

export interface ApiKey {
  id: string;
  userId: string;
  name: string;
  keyHash: string;
  keyPrefix: string;
  permissions: string[];
  lastUsedAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
}

// Request/Response DTOs
export interface CreateTraceDto {
  sessionId: string;
  workspaceId: string;
  operation: string;
  startedAt: Date;
  completedAt?: Date;
  status: string;
  framework: string;
  modelName?: string;
  sourceFile?: string;
  sourceLine?: number;
  metadata?: Record<string, any>;
  data: Record<string, any>;
}

export interface TraceListQuery {
  workspaceId: string;
  limit?: number;
  offset?: number;
  status?: string;
  operation?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface AnalyticsQuery {
  workspaceId: string;
  period: '1d' | '7d' | '30d' | '90d';
  groupBy?: 'hour' | 'day' | 'week';
}
