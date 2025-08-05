// Desktop App Core Types
// Independent type definitions for the desktop application

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
  workspaceId?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
  tags?: string[];
}

export interface WorkspaceData {
  id: string;
  name: string;
  path: string;
  projectType?: string;
  gitRepository?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SessionData {
  id: string;
  workspaceId: string;
  name: string;
  startedAt: Date;
  completedAt?: Date;
  status: 'active' | 'completed' | 'archived';
  traceCount: number;
  framework?: string;
  environment?: string;
}

// Desktop-specific configuration
export interface DesktopConfig {
  theme: 'light' | 'dark' | 'auto';
  autoLaunch: boolean;
  minimizeToTray: boolean;
  showNotifications: boolean;
  vscodeIntegration: {
    enabled: boolean;
    autoLaunch: boolean;
    port: number;
  };
  cloudSync: {
    enabled: boolean;
    autoSync: boolean;
    apiKey?: string;
  };
}
