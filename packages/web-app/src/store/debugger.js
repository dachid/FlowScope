"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useDebuggerStore = void 0;
const zustand_1 = require("zustand");
exports.useDebuggerStore = (0, zustand_1.create)((set, get) => ({
    // Initial State
    sessions: [],
    currentSessionId: null,
    traces: [],
    filteredTraces: [],
    nodes: [],
    edges: [],
    selectedNodeId: null,
    isLoading: false,
    error: null,
    sidebarOpen: true,
    viewMode: 'timeline',
    filterCriteria: {},
    bookmarks: [],
    // Computed properties
    get currentSession() {
        const { sessions, currentSessionId } = get();
        return sessions.find(session => session.id === currentSessionId) || null;
    },
    // Session Actions
    setSessions: (sessions) => set({ sessions }),
    addSession: (session) => set((state) => {
        let newSession;
        if (typeof session === 'string') {
            // Create session from string name
            newSession = {
                id: `session-${Date.now()}`,
                name: session,
                startTime: Date.now(),
                status: 'active',
                traces: [],
                isActive: true,
                tags: [],
                sessionType: 'test',
                traceCount: 0,
                createdAt: new Date()
            };
        }
        else {
            newSession = session;
        }
        return { sessions: [...state.sessions, newSession] };
    }),
    updateSession: (id, updates) => set((state) => ({
        sessions: state.sessions.map(session => session.id === id ? { ...session, ...updates } : session)
    })),
    deleteSession: (id) => set((state) => ({
        sessions: state.sessions.filter(session => session.id !== id),
        traces: state.traces.filter(trace => trace.sessionId !== id),
        currentSessionId: state.currentSessionId === id ? null : state.currentSessionId
    })),
    setCurrentSession: (id) => {
        set({ currentSessionId: id });
        get().applyFilters();
    },
    // Trace Actions
    addTrace: (trace) => set((state) => {
        const newTraces = [...state.traces, trace];
        return { traces: newTraces };
    }),
    updateTrace: (id, updates) => set((state) => ({
        traces: state.traces.map(trace => trace.id === id ? { ...trace, ...updates } : trace)
    })),
    deleteTrace: (id) => set((state) => ({
        traces: state.traces.filter(trace => trace.id !== id)
    })),
    setTraces: (traces) => {
        set({ traces });
        get().applyFilters();
    },
    clearTraces: () => set({ traces: [], filteredTraces: [] }),
    // Visualization Actions
    setNodes: (nodes) => set({ nodes }),
    setEdges: (edges) => set({ edges }),
    setSelectedNode: (id) => set({ selectedNodeId: id }),
    // Filter Actions
    setFilterCriteria: (criteria) => {
        set((state) => ({
            filterCriteria: { ...state.filterCriteria, ...criteria }
        }));
        get().applyFilters();
    },
    clearFilters: () => {
        set({ filterCriteria: {} });
        get().applyFilters();
    },
    applyFilters: () => {
        const { traces, currentSessionId, filterCriteria } = get();
        let filtered = traces;
        // Filter by current session
        if (currentSessionId) {
            filtered = filtered.filter(trace => trace.sessionId === currentSessionId);
        }
        // Apply other filters
        if (filterCriteria.status) {
            filtered = filtered.filter(trace => trace.status === filterCriteria.status);
        }
        if (filterCriteria.type) {
            filtered = filtered.filter(trace => trace.type === filterCriteria.type);
        }
        if (filterCriteria.searchTerm) {
            const term = filterCriteria.searchTerm.toLowerCase();
            filtered = filtered.filter(trace => trace.type.toLowerCase().includes(term) ||
                JSON.stringify(trace.metadata).toLowerCase().includes(term));
        }
        if (filterCriteria.timeRange) {
            const startTime = filterCriteria.timeRange.start.getTime();
            const endTime = filterCriteria.timeRange.end.getTime();
            filtered = filtered.filter(trace => trace.timestamp >= startTime &&
                trace.timestamp <= endTime);
        }
        set({ filteredTraces: filtered });
    },
    // Bookmark Actions
    addBookmark: (traceId) => set((state) => ({
        bookmarks: [...state.bookmarks, traceId]
    })),
    removeBookmark: (traceId) => set((state) => ({
        bookmarks: state.bookmarks.filter(id => id !== traceId)
    })),
    // UI Actions
    setViewMode: (mode) => set({ viewMode: mode }),
    setSidebarOpen: (open) => set({ sidebarOpen: open }),
    setLoading: (loading) => set({ isLoading: loading }),
    setError: (error) => set({ error }),
    // Utility Functions
    getCurrentSession: () => {
        const { sessions, currentSessionId } = get();
        return sessions.find(session => session.id === currentSessionId) || null;
    },
    getSessionTraces: (sessionId) => {
        const { traces } = get();
        return traces.filter(trace => trace.sessionId === sessionId);
    },
    convertToReactFlowNodes: () => {
        const { nodes } = get();
        return nodes.map((node) => ({
            id: node.id,
            type: 'default',
            position: node.position,
            data: {
                label: node.label,
                status: node.status,
                ...node.data
            }
        }));
    },
    convertToReactFlowEdges: () => {
        const { edges } = get();
        return edges.map((edge) => ({
            id: edge.id,
            source: edge.source,
            target: edge.target,
            label: edge.label,
            type: edge.type || 'default'
        }));
    }
}));
