import type { Node, Edge } from '@xyflow/react';
import type { Session, TraceData } from '@flowscope/shared';
export type { Session, TraceData as Trace } from '@flowscope/shared';
export interface UISession extends Session {
    isActive: boolean;
    tags: string[];
    description?: string;
    sessionType: 'test' | 'production';
    traceCount: number;
    createdAt: Date;
}
export interface NodeData {
    id: string;
    label: string;
    type: string;
    status: 'success' | 'error' | 'pending' | 'warning';
    data: any;
    position: {
        x: number;
        y: number;
    };
}
export interface EdgeData {
    id: string;
    source: string;
    target: string;
    label?: string;
    type?: string;
}
export interface DebuggerStore {
    sessions: UISession[];
    currentSessionId: string | null;
    currentSession: UISession | null;
    traces: TraceData[];
    filteredTraces: TraceData[];
    nodes: NodeData[];
    edges: EdgeData[];
    selectedNodeId: string | null;
    isLoading: boolean;
    error: string | null;
    sidebarOpen: boolean;
    viewMode: 'timeline' | 'flow' | 'table';
    filterCriteria: {
        status?: string;
        type?: string;
        timeRange?: {
            start: Date;
            end: Date;
        };
        searchTerm?: string;
    };
    bookmarks: string[];
    setSessions: (sessions: UISession[]) => void;
    addSession: (session: UISession | string) => void;
    updateSession: (id: string, updates: Partial<UISession>) => void;
    deleteSession: (id: string) => void;
    setCurrentSession: (id: string | null) => void;
    addTrace: (trace: TraceData) => void;
    updateTrace: (id: string, updates: Partial<TraceData>) => void;
    deleteTrace: (id: string) => void;
    setTraces: (traces: TraceData[]) => void;
    clearTraces: () => void;
    setNodes: (nodes: NodeData[]) => void;
    setEdges: (edges: EdgeData[]) => void;
    setSelectedNode: (id: string | null) => void;
    setFilterCriteria: (criteria: Partial<DebuggerStore['filterCriteria']>) => void;
    clearFilters: () => void;
    applyFilters: () => void;
    addBookmark: (traceId: string) => void;
    removeBookmark: (traceId: string) => void;
    setViewMode: (mode: 'timeline' | 'flow' | 'table') => void;
    setSidebarOpen: (open: boolean) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    getCurrentSession: () => UISession | null;
    getSessionTraces: (sessionId: string) => TraceData[];
    convertToReactFlowNodes: () => Node[];
    convertToReactFlowEdges: () => Edge[];
}
export declare const useDebuggerStore: import("zustand").UseBoundStore<import("zustand").StoreApi<DebuggerStore>>;
