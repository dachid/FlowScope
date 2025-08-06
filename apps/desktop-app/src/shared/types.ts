export interface Session {
  id: string;
  name: string;
  description?: string; // For compatibility with existing UI
  start_time: number;
  end_time?: number;
  status: 'active' | 'completed' | 'archived';
  metadata?: string;
  workspace_path?: string;
  created_at: number;
}

export interface Trace {
  id: string;
  session_id: string;
  parent_id?: string;
  operation: string;
  language: string;
  framework: string;
  start_time: number;
  end_time?: number;
  duration?: number;
  data: string; // JSON stringified data
  metadata?: string;
  status: 'pending' | 'completed' | 'error';
  error?: string;
  
  // Compatibility fields for existing UI components
  name?: string; // Can be derived from operation or data
  created_at?: number; // Can be derived from start_time
}

export interface Bookmark {
  id: string;
  trace_id: string;
  title: string;
  description?: string;
  color: string;
  created_at: number;
}

export interface Prompt {
  id: string;
  name: string;
  content: string;
  version: string;
  session_id?: string;
  created_at: number;
}

export interface DatabaseStats {
  sessionCount: number;
  traceCount: number;
  bookmarkCount: number;
  promptCount: number;
  totalSize: number;
  oldestSession?: string;
  newestSession?: string;
}

export interface VSCodeStatus {
  isInstalled: boolean;
  extensionInstalled: boolean;
  version?: string;
}

export interface RealtimeMessage {
  type: string;
  data: any;
  timestamp: string;
}

// UI-specific types
export interface SelectedState {
  session?: Session;
  trace?: Trace;
  bookmark?: Bookmark;
}

export interface ViewState {
  sidebarCollapsed: boolean;
  selectedView: 'traces' | 'bookmarks' | 'search' | 'settings';
  traceViewMode: 'timeline' | 'tree' | 'table' | 'interactive-timeline' | 'flow-diagram' | 'performance';
  searchQuery: string;
  filters: {
    status?: string[];
    operation?: string[];
    dateRange?: [number, number];
  };
}

export interface TraceTreeNode {
  trace: Trace;
  children: TraceTreeNode[];
  depth: number;
  isExpanded: boolean;
}

export interface TimelineItem {
  trace: Trace;
  startOffset: number;
  width: number;
  color: string;
  position: 'top' | 'middle' | 'bottom';
}

export interface SearchResult {
  trace: Trace;
  session: Session;
  score: number;
  matches: {
    field: string;
    value: string;
    snippet: string;
  }[];
}
