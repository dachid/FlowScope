// Cloud Platform Frontend Types
// Independent type definitions for the SaaS frontend

export type TraceStatus = 'pending' | 'success' | 'error' | 'timeout';

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  tier: 'free' | 'individual' | 'team' | 'enterprise';
  createdAt: Date;
  organizations?: Organization[];
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  tier: 'team' | 'enterprise';
  memberCount: number;
  role: 'owner' | 'admin' | 'member';
}

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  visibility: 'private' | 'team' | 'public';
  owner: User;
  organization?: Organization;
  projectType?: string;
  gitRepository?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TraceData {
  id: string;
  operation: string;
  startedAt: Date;
  completedAt?: Date;
  durationMs?: number;
  status: 'pending' | 'success' | 'error' | 'timeout';
  framework: string;
  modelName?: string;
  sourceFile?: string;
  sourceLine?: number;
  workspaceId: string;
  sessionId: string;
  userId: string;
  metadata?: Record<string, any>;
  tags?: string[];
}

export interface Session {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;
  status: 'active' | 'completed' | 'archived';
  startedAt: Date;
  completedAt?: Date;
  totalTraces: number;
  errorCount: number;
  successCount: number;
  framework?: string;
  environment?: string;
}

export interface Analytics {
  totalTraces: number;
  avgDuration: number;
  successRate: number;
  errorRate: number;
  dailyVolume: Array<{
    date: string;
    traces: number;
    avgDuration: number;
  }>;
  operationBreakdown: Array<{
    operation: string;
    count: number;
    avgDuration: number;
  }>;
  modelUsage: Array<{
    model: string;
    count: number;
    estimatedCost: number;
  }>;
}

// Subscription and billing types
export interface Subscription {
  id: string;
  tier: 'individual' | 'team' | 'enterprise';
  status: 'active' | 'canceled' | 'past_due';
  currentPeriodEnd: Date;
  maxTraces: number;
  maxStorage: number;
  features: string[];
}
