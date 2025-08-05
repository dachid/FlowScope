// Cloud Platform Shared Types
// Types shared between frontend and backend within cloud platform

export interface User {
  id: string;
  email: string;
  name: string;
  tier: 'free' | 'individual' | 'team' | 'enterprise';
  createdAt: Date;
  updatedAt: Date;
  organizations?: OrganizationMember[];
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  tier: 'team' | 'enterprise';
  createdAt: Date;
  maxSeats: number;
  settings: Record<string, any>;
}

export interface OrganizationMember {
  id: string;
  organizationId: string;
  userId: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: Date;
  organization?: Organization;
}

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  organizationId?: string;
  visibility: 'private' | 'team' | 'public';
  createdAt: Date;
  updatedAt: Date;
  projectType?: string;
  gitRepository?: string;
}

export interface TraceSession {
  id: string;
  workspaceId: string;
  userId: string;
  name: string;
  description?: string;
  status: 'active' | 'completed' | 'archived';
  startedAt: Date;
  completedAt?: Date;
  totalTraces: number;
  totalDurationMs: number;
  errorCount: number;
  successCount: number;
}

export interface CloudTrace {
  id: string;
  sessionId: string;
  workspaceId: string;
  userId: string;
  operation: string;
  startedAt: Date;
  completedAt?: Date;
  durationMs?: number;
  status: 'pending' | 'success' | 'error' | 'timeout';
  framework: string;
  modelName?: string;
  sourceFile?: string;
  sourceLine?: number;
  traceDataUrl?: string; // S3/R2 URL for full data
  dataSizeBytes?: number;
  metadata: Record<string, any>;
  tags: string[];
}

export interface ApiKey {
  id: string;
  userId: string;
  name: string;
  keyPrefix: string; // First 8 characters for display
  lastUsedAt?: Date;
  expiresAt?: Date;
  permissions: string[];
  createdAt: Date;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Subscription and billing
export interface Subscription {
  id: string;
  userId: string;
  organizationId?: string;
  stripeSubscriptionId: string;
  status: 'active' | 'canceled' | 'past_due' | 'incomplete';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  tier: 'individual' | 'team' | 'enterprise';
}
