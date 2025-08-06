// VS Code Extension Core Types
// Independent type definitions for the VS Code extension

export interface TraceData {
  id: string;
  sessionId?: string;
  parentId?: string;
  operation: string;
  language: string;
  framework: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  data: any;
  metadata?: any;
  status: 'pending' | 'success' | 'error';
  error?: string;
  workspacePath?: string;
  sourceLocation?: {
    file: string;
    line: number;
    column?: number;
  };
}

export interface HealthResponse {
  status: string;
  version: string;
  mode: string;
  timestamp: string;
}

export interface FlowScopeApiClient {
  health(): Promise<HealthResponse>;
  addTrace(trace: TraceData): Promise<void>;
  updateTrace(traceId: string, updates: Partial<TraceData>): Promise<void>;
  getTraces(sessionId?: string, limit?: number, offset?: number): Promise<TraceData[]>;
  getTrace(traceId: string): Promise<TraceData | null>;
  setWorkspace(workspacePath: string): Promise<void>;
  focusTrace(traceId: string): Promise<void>;
  createSession(name: string, workspacePath?: string): Promise<string>;
  isDesktopAppConnected(): boolean;
  openDesktopApp(): Promise<void>;
  onTracesUpdated(callback: (traces: TraceData[]) => void): void;
  getBookmarks(): Promise<any[]>;
  getPromptVersions(): Promise<any[]>;
  dispose(): void;
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
