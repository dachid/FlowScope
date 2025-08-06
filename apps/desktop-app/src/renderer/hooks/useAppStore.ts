import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { Session, Trace, Bookmark, ViewState, SelectedState } from '../../shared/types';
import { apiService } from '../services/api';

interface AppState {
  // Data state
  sessions: Session[];
  traces: Trace[];
  bookmarks: Bookmark[];
  
  // UI state
  viewState: ViewState;
  selectedState: SelectedState;
  isLoading: boolean;
  error: string | null;
  
  // API connection
  isApiConnected: boolean;
  apiPort: number | null;
  
  // Actions
  setSessions: (sessions: Session[]) => void;
  addSession: (session: Session) => void;
  updateSession: (id: string, updates: Partial<Session>) => void;
  deleteSession: (id: string) => void;
  
  setTraces: (traces: Trace[]) => void;
  addTrace: (trace: Trace) => void;
  updateTrace: (id: string, updates: Partial<Trace>) => void;
  
  setBookmarks: (bookmarks: Bookmark[]) => void;
  addBookmark: (bookmark: Bookmark) => void;
  deleteBookmark: (id: string) => void;
  
  setSelectedSession: (session: Session | undefined) => void;
  setSelectedTrace: (trace: Trace | undefined) => void;
  setSelectedBookmark: (bookmark: Bookmark | undefined) => void;
  
  updateViewState: (updates: Partial<ViewState>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setApiConnection: (connected: boolean, port?: number) => void;
  
  // Async actions
  loadSessions: () => Promise<void>;
  loadTracesForSession: (sessionId: string) => Promise<void>;
  loadBookmarks: () => Promise<void>;
  createSession: (sessionData: Partial<Session>) => Promise<Session>;
  createTrace: (traceData: Partial<Trace>) => Promise<Trace>;
  createBookmark: (bookmarkData: Partial<Bookmark>) => Promise<Bookmark>;
  
  // Real-time updates
  handleRealtimeMessage: (type: string, data: any) => void;
  
  // Initialize
  initialize: () => Promise<void>;
}

const initialViewState: ViewState = {
  sidebarCollapsed: false,
  selectedView: 'traces',
  traceViewMode: 'timeline',
  searchQuery: '',
  filters: {},
};

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        sessions: [],
        traces: [],
        bookmarks: [],
        viewState: initialViewState,
        selectedState: {},
        isLoading: false,
        error: null,
        isApiConnected: false,
        apiPort: null,

        // Synchronous actions
        setSessions: (sessions) => set({ sessions }),
        
        addSession: (session) =>
          set((state) => {
            // Check if session already exists to prevent duplicates
            const exists = state.sessions.find(s => s.id === session.id);
            if (exists) {
              console.log('Session already exists, skipping add:', session.id);
              return state;
            }
            return {
              sessions: [session, ...state.sessions],
            };
          }),
        
        updateSession: (id, updates) =>
          set((state) => ({
            sessions: state.sessions.map((session) =>
              session.id === id ? { ...session, ...updates } : session
            ),
            selectedState: state.selectedState.session?.id === id 
              ? { ...state.selectedState, session: { ...state.selectedState.session, ...updates } }
              : state.selectedState,
          })),
        
        deleteSession: (id) =>
          set((state) => ({
            sessions: state.sessions.filter((session) => session.id !== id),
            selectedState: state.selectedState.session?.id === id
              ? { ...state.selectedState, session: undefined, trace: undefined }
              : state.selectedState,
          })),

        setTraces: (traces) => set({ traces }),
        
        addTrace: (trace) =>
          set((state) => ({
            traces: [...state.traces, trace],
          })),
        
        updateTrace: (id, updates) =>
          set((state) => ({
            traces: state.traces.map((trace) =>
              trace.id === id ? { ...trace, ...updates } : trace
            ),
            selectedState: state.selectedState.trace?.id === id
              ? { ...state.selectedState, trace: { ...state.selectedState.trace, ...updates } }
              : state.selectedState,
          })),

        setBookmarks: (bookmarks) => set({ bookmarks }),
        
        addBookmark: (bookmark) =>
          set((state) => ({
            bookmarks: [...state.bookmarks, bookmark],
          })),
        
        deleteBookmark: (id) =>
          set((state) => ({
            bookmarks: state.bookmarks.filter((bookmark) => bookmark.id !== id),
            selectedState: state.selectedState.bookmark?.id === id
              ? { ...state.selectedState, bookmark: undefined }
              : state.selectedState,
          })),

        setSelectedSession: (session) =>
          set((state) => ({
            selectedState: {
              ...state.selectedState,
              session,
              trace: undefined, // Clear trace selection when changing sessions
            },
          })),
        
        setSelectedTrace: (trace) =>
          set((state) => ({
            selectedState: { ...state.selectedState, trace },
          })),
        
        setSelectedBookmark: (bookmark) =>
          set((state) => ({
            selectedState: { ...state.selectedState, bookmark },
          })),

        updateViewState: (updates) =>
          set((state) => ({
            viewState: { ...state.viewState, ...updates },
          })),

        setLoading: (isLoading) => set({ isLoading }),
        setError: (error) => set({ error }),
        setApiConnection: (isApiConnected, apiPort) => set({ isApiConnected, apiPort }),

        // Async actions
        loadSessions: async () => {
          const { setLoading, setError, setSessions } = get();
          try {
            setLoading(true);
            setError(null);
            const sessions = await apiService.getSessions();
            setSessions(sessions);
          } catch (error) {
            console.error('Failed to load sessions:', error);
            setError('Failed to load sessions');
          } finally {
            setLoading(false);
          }
        },

        loadTracesForSession: async (sessionId: string) => {
          const { setLoading, setError, setTraces } = get();
          try {
            setLoading(true);
            setError(null);
            const traces = await apiService.getTraces(sessionId);
            setTraces(traces);
          } catch (error) {
            console.error('Failed to load traces:', error);
            setError('Failed to load traces');
          } finally {
            setLoading(false);
          }
        },

        loadBookmarks: async () => {
          const { setLoading, setError, setBookmarks } = get();
          try {
            setLoading(true);
            setError(null);
            const bookmarks = await apiService.getBookmarks();
            setBookmarks(bookmarks);
          } catch (error) {
            console.error('Failed to load bookmarks:', error);
            setError('Failed to load bookmarks');
          } finally {
            setLoading(false);
          }
        },

        createSession: async (sessionData) => {
          const { setError } = get();
          try {
            setError(null);
            const session = await apiService.createSession(sessionData);
            // Don't call addSession here - the real-time update will handle it
            return session;
          } catch (error) {
            console.error('Failed to create session:', error);
            setError('Failed to create session');
            throw error;
          }
        },

        createTrace: async (traceData) => {
          const { setError, addTrace } = get();
          try {
            setError(null);
            const trace = await apiService.createTrace(traceData);
            addTrace(trace);
            return trace;
          } catch (error) {
            console.error('Failed to create trace:', error);
            setError('Failed to create trace');
            throw error;
          }
        },

        createBookmark: async (bookmarkData) => {
          const { setError, addBookmark } = get();
          try {
            setError(null);
            const bookmark = await apiService.createBookmark(bookmarkData);
            addBookmark(bookmark);
            return bookmark;
          } catch (error) {
            console.error('Failed to create bookmark:', error);
            setError('Failed to create bookmark');
            throw error;
          }
        },

        // Real-time message handling
        handleRealtimeMessage: (type: string, data: any) => {
          const { addSession, updateSession, addTrace, updateTrace, addBookmark } = get();
          
          switch (type) {
            case 'connection':
              // Handle WebSocket connection status - don't log as unhandled
              console.log('WebSocket connection established');
              break;
            case 'session:created':
              addSession(data);
              break;
            case 'session:updated':
              updateSession(data.id, data);
              break;
            case 'trace:new':
              addTrace(data);
              break;
            case 'trace:updated':
              updateTrace(data.id, data);
              break;
            case 'bookmark:created':
              addBookmark(data);
              break;
            default:
              console.log('Unhandled realtime message:', type, data);
          }
        },

        // Initialize the app
        initialize: async () => {
          const { setLoading, setError, setApiConnection } = get();
          try {
            setLoading(true);
            setError(null);
            
            // Check API connection
            const isConnected = await apiService.checkHealth();
            setApiConnection(isConnected, 31847);
            
            if (isConnected) {
              // Initialize WebSocket for real-time updates
              await apiService.initializeWebSocket();
              
              // Set up real-time message handler
              window.addEventListener('flowscope-realtime', (event: any) => {
                const { type, data } = event.detail;
                get().handleRealtimeMessage(type, data);
              });
              
              // Load initial data - only from API, not from Electron IPC
              await Promise.all([
                get().loadSessions(),
                get().loadBookmarks(),
              ]);
            } else {
              setError('Unable to connect to FlowScope API server');
            }
          } catch (error) {
            console.error('Failed to initialize app:', error);
            setError('Failed to initialize application');
          } finally {
            setLoading(false);
          }
        },
      }),
      {
        name: 'flowscope-app-state',
        partialize: (state) => ({
          viewState: state.viewState,
          selectedState: {
            session: state.selectedState.session,
            // Don't persist trace/bookmark selections
          },
        }),
      }
    ),
    {
      name: 'flowscope-app-store',
    }
  )
);

// Selector hooks for better performance
export const useSelectedSession = () => useAppStore((state) => state.selectedState.session);
export const useSelectedTrace = () => useAppStore((state) => state.selectedState.trace);
export const useSessions = () => useAppStore((state) => state.sessions);
export const useTraces = () => useAppStore((state) => state.traces);
export const useBookmarks = () => useAppStore((state) => state.bookmarks);
export const useViewState = () => useAppStore((state) => state.viewState);
export const useApiStatus = () => useAppStore((state) => ({ 
  isConnected: state.isApiConnected, 
  port: state.apiPort 
}));
export const useAppLoading = () => useAppStore((state) => state.isLoading);
export const useAppError = () => useAppStore((state) => state.error);
