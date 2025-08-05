// VS Code Extension Core Types
// Independent type definitions for the VS Code extension

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
  metadata?: Record<string, any>;
}

export interface VSCodeExtensionConfig {
  desktopApp: {
    autoLaunch: boolean;
    port: number;
    connectionTimeout: number;
  };
  traces: {
    showInlineMetrics: boolean;
    enableCodeLens: boolean;
    autoCapture: boolean;
  };
  ui: {
    showTraceTree: boolean;
    showPerformanceDecorations: boolean;
    theme: 'auto' | 'light' | 'dark';
  };
}

export interface DesktopAppConnection {
  url: string;
  isConnected: boolean;
  lastHeartbeat?: Date;
  version?: string;
}

export interface TraceTreeItem {
  id: string;
  label: string;
  type: 'session' | 'trace' | 'detail';
  collapsibleState: number;
  trace?: TraceData;
  children?: TraceTreeItem[];
}

// Message protocol for desktop app communication
export interface DesktopAppMessage {
  id: string;
  type: 'trace_added' | 'jump_to_code' | 'focus_trace' | 'sync_request' | 'heartbeat';
  data: any;
  timestamp: Date;
}
