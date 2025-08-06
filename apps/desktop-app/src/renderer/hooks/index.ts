import { useEffect, useState } from 'react';
import { Session, Trace, Bookmark } from '../../shared/types';
import { useAppStore } from './useAppStore';

// Hook for managing sessions
export const useSessions = () => {
  const sessions = useAppStore((state) => state.sessions);
  const loadSessions = useAppStore((state) => state.loadSessions);
  const createSession = useAppStore((state) => state.createSession);
  const updateSession = useAppStore((state) => state.updateSession);
  const deleteSession = useAppStore((state) => state.deleteSession);
  const isLoading = useAppStore((state) => state.isLoading);
  const error = useAppStore((state) => state.error);

  useEffect(() => {
    if (sessions.length === 0) {
      loadSessions();
    }
  }, [loadSessions, sessions.length]);

  return {
    sessions,
    isLoading,
    error,
    actions: {
      create: createSession,
      update: updateSession,
      delete: deleteSession,
      reload: loadSessions,
    },
  };
};

// Hook for managing traces for a specific session
export const useSessionTraces = (sessionId?: string) => {
  const traces = useAppStore((state) => state.traces);
  const loadTracesForSession = useAppStore((state) => state.loadTracesForSession);
  const createTrace = useAppStore((state) => state.createTrace);
  const updateTrace = useAppStore((state) => state.updateTrace);
  const isLoading = useAppStore((state) => state.isLoading);
  const error = useAppStore((state) => state.error);

  // Filter traces for the current session
  const sessionTraces = sessionId 
    ? traces.filter(trace => trace.session_id === sessionId)
    : [];

  useEffect(() => {
    if (sessionId) {
      loadTracesForSession(sessionId);
    }
  }, [sessionId, loadTracesForSession]);

  return {
    traces: sessionTraces,
    isLoading,
    error,
    actions: {
      create: createTrace,
      update: updateTrace,
      reload: () => sessionId && loadTracesForSession(sessionId),
    },
  };
};

// Hook for managing bookmarks
export const useBookmarks = () => {
  const bookmarks = useAppStore((state) => state.bookmarks);
  const loadBookmarks = useAppStore((state) => state.loadBookmarks);
  const createBookmark = useAppStore((state) => state.createBookmark);
  const deleteBookmark = useAppStore((state) => state.deleteBookmark);
  const isLoading = useAppStore((state) => state.isLoading);
  const error = useAppStore((state) => state.error);

  useEffect(() => {
    if (bookmarks.length === 0) {
      loadBookmarks();
    }
  }, [loadBookmarks, bookmarks.length]);

  return {
    bookmarks,
    isLoading,
    error,
    actions: {
      create: createBookmark,
      delete: deleteBookmark,
      reload: loadBookmarks,
    },
  };
};

// Hook for managing selected items
export const useSelection = () => {
  const selectedState = useAppStore((state) => state.selectedState);
  const setSelectedSession = useAppStore((state) => state.setSelectedSession);
  const setSelectedTrace = useAppStore((state) => state.setSelectedTrace);
  const setSelectedBookmark = useAppStore((state) => state.setSelectedBookmark);

  return {
    selected: selectedState,
    actions: {
      selectSession: setSelectedSession,
      selectTrace: setSelectedTrace,
      selectBookmark: setSelectedBookmark,
    },
  };
};

// Hook for managing view state
export const useViewState = () => {
  const viewState = useAppStore((state) => state.viewState);
  const updateViewState = useAppStore((state) => state.updateViewState);

  return {
    viewState,
    actions: {
      update: updateViewState,
      toggleSidebar: () => updateViewState({ 
        sidebarCollapsed: !viewState.sidebarCollapsed 
      }),
      setView: (selectedView: typeof viewState.selectedView) => 
        updateViewState({ selectedView }),
      setTraceViewMode: (traceViewMode: typeof viewState.traceViewMode) => 
        updateViewState({ traceViewMode }),
      setSearchQuery: (searchQuery: string) => 
        updateViewState({ searchQuery }),
      setFilters: (filters: typeof viewState.filters) => 
        updateViewState({ filters }),
    },
  };
};

// Hook for search functionality
export const useSearch = () => {
  const [searchResults, setSearchResults] = useState<Trace[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const traces = useAppStore((state) => state.traces);
  const viewState = useAppStore((state) => state.viewState);

  useEffect(() => {
    if (!viewState.searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    
    // Simple client-side search - can be enhanced with server-side search
    const searchTerm = viewState.searchQuery.toLowerCase();
    const filtered = traces.filter((trace) => {
      try {
        const data = JSON.parse(trace.data);
        const searchableText = [
          trace.operation,
          trace.language,
          trace.framework,
          trace.error,
          JSON.stringify(data),
        ].join(' ').toLowerCase();
        
        return searchableText.includes(searchTerm);
      } catch {
        return trace.operation.toLowerCase().includes(searchTerm);
      }
    });

    setSearchResults(filtered);
    setIsSearching(false);
  }, [viewState.searchQuery, traces]);

  return {
    searchResults,
    isSearching,
    searchQuery: viewState.searchQuery,
  };
};

// Hook for real-time connection status
export const useRealtimeStatus = () => {
  const isApiConnected = useAppStore((state) => state.isApiConnected);
  const apiPort = useAppStore((state) => state.apiPort);
  const [wsConnected, setWsConnected] = useState(false);

  useEffect(() => {
    const handleWSStatus = (event: CustomEvent) => {
      const { type } = event.detail;
      setWsConnected(type === 'connection');
    };

    window.addEventListener('flowscope-realtime', handleWSStatus as EventListener);
    return () => {
      window.removeEventListener('flowscope-realtime', handleWSStatus as EventListener);
    };
  }, []);

  return {
    isApiConnected,
    isWebSocketConnected: wsConnected,
    apiPort,
    isFullyConnected: isApiConnected && wsConnected,
  };
};

// Hook for trace statistics
export const useTraceStats = (sessionId?: string) => {
  const traces = useAppStore((state) => state.traces);
  
  const sessionTraces = sessionId 
    ? traces.filter(trace => trace.session_id === sessionId)
    : traces;

  const stats = {
    total: sessionTraces.length,
    completed: sessionTraces.filter(t => t.status === 'completed').length,
    pending: sessionTraces.filter(t => t.status === 'pending').length,
    errors: sessionTraces.filter(t => t.status === 'error').length,
    avgDuration: sessionTraces.length > 0 
      ? sessionTraces
          .filter(t => t.duration)
          .reduce((sum, t) => sum + (t.duration || 0), 0) / sessionTraces.length
      : 0,
    operations: [...new Set(sessionTraces.map(t => t.operation))],
    languages: [...new Set(sessionTraces.map(t => t.language))],
    frameworks: [...new Set(sessionTraces.map(t => t.framework))],
  };

  return stats;
};
