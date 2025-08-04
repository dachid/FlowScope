"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const lucide_react_1 = require("lucide-react");
const ChainVisualization_1 = __importDefault(require("./components/debugger/ChainVisualization"));
const SidebarControls_1 = require("./components/debugger/SidebarControls");
const NodeDetail_1 = require("./components/debugger/NodeDetail");
const TimelineView_1 = require("./components/debugger/TimelineView");
const TraceInspector_1 = require("./components/debugger/TraceInspector");
const BookmarksPanel_1 = require("./components/debugger/BookmarksPanel");
const Comments_1 = require("./components/teams/Comments");
const TeamManagement_1 = require("./components/teams/TeamManagement");
const WebSocketIndicator_1 = require("./components/WebSocketIndicator");
const debugger_1 = require("./store/debugger");
const bookmarks_1 = require("./store/bookmarks");
const useWebSocket_1 = require("./hooks/useWebSocket");
const useUserPreferences_1 = require("./hooks/useUserPreferences");
const react_1 = require("react");
const api_1 = require("./services/api");
function App() {
    const { sidebarOpen, setSidebarOpen, selectedNodeId, setSelectedNode, viewMode, setViewMode, traces, 
    // Session management
    sessions, currentSession, setCurrentSession, setSessions, addSession, deleteSession, addTrace, clearTraces } = (0, debugger_1.useDebuggerStore)();
    const { addBookmark, removeBookmark, isBookmarked, getBookmarkByTraceId } = (0, bookmarks_1.useBookmarkStore)();
    const { status, connect } = (0, useWebSocket_1.useWebSocket)();
    // User preferences hook
    const { preferences, setRightPanelTab, setRightPanelCollapsed, setSidebarCollapsed, } = (0, useUserPreferences_1.useUserPreferences)();
    // Use preferences or fallback to defaults
    const rightPanelTab = preferences?.rightPanelTab || 'details';
    const rightPanelCollapsed = preferences?.rightPanelCollapsed || false;
    const leftPanelCollapsed = preferences?.sidebarCollapsed || false;
    const autoOpenPanelOnNodeClick = preferences?.autoOpenPanelOnNodeClick ?? true;
    // Create wrapper for left panel collapsed to use the preferences system
    const setLeftPanelCollapsed = (collapsed) => {
        setSidebarCollapsed(collapsed);
    };
    const [selectedTrace, setSelectedTrace] = (0, react_1.useState)(null);
    const [showTeamManagement, setShowTeamManagement] = (0, react_1.useState)(false);
    const [leftPanelActiveTab, setLeftPanelActiveTab] = (0, react_1.useState)('sessions');
    const [searchQuery, setSearchQuery] = (0, react_1.useState)('');
    const [isLoadingScenarios, setIsLoadingScenarios] = (0, react_1.useState)(false);
    // Use useRef to ensure loadExistingSessions only runs once (StrictMode-safe)
    const hasLoadedRef = (0, react_1.useRef)(false);
    // Notification system for main panel
    const [notification, setNotification] = (0, react_1.useState)(null);
    // Create wrapper functions for session management
    const createSession = (name) => {
        const newSession = {
            id: `session-${Date.now()}`,
            name: name || 'New Session',
            startTime: Date.now(),
            status: 'active',
            traces: [],
            isActive: true,
            tags: [],
            sessionType: 'test',
            traceCount: 0,
            createdAt: new Date()
        };
        addSession(newSession);
        return newSession;
    };
    const handleSetCurrentSession = (session) => {
        setCurrentSession(session.id);
    };
    const loadExistingSessions = async () => {
        // Prevent concurrent executions
        if (isLoadingScenarios) {
            console.log('⏭️ loadExistingSessions already running, skipping...');
            return;
        }
        // Check if sessions are already loaded in store
        const currentSessions = debugger_1.useDebuggerStore.getState().sessions;
        console.log('🔍 Current sessions in store:', currentSessions.length);
        if (currentSessions.length > 0) {
            console.log('📋 Sessions already loaded in store, skipping load');
            return;
        }
        console.log('🔄 Starting loadExistingSessions...');
        setIsLoadingScenarios(true);
        try {
            console.log('🔄 Loading sessions from API...');
            // Load existing sessions
            const existingSessions = await api_1.ApiService.getAllSessions();
            console.log('📊 Found existing sessions in DB:', existingSessions.length);
            if (existingSessions.length > 0) {
                console.log('✅ Sessions loaded from database');
                // Convert API sessions to frontend sessions and load into store
                const frontendSessions = [];
                for (const apiSession of existingSessions) {
                    const sessionTraces = await api_1.ApiService.getSessionTraces(apiSession.id);
                    const frontendSession = {
                        id: apiSession.id,
                        name: apiSession.name || 'Unnamed Session',
                        startTime: apiSession.startTime,
                        endTime: apiSession.endTime,
                        status: apiSession.status,
                        metadata: apiSession.metadata,
                        traces: sessionTraces,
                        isActive: apiSession.status === 'active',
                        tags: [],
                        sessionType: 'production',
                        traceCount: sessionTraces.length,
                        createdAt: new Date(apiSession.startTime),
                    };
                    frontendSessions.push(frontendSession);
                    // Load traces for this session
                    sessionTraces.forEach(trace => addTrace(trace));
                }
                // Set all sessions at once to avoid duplicates
                setSessions(frontendSessions);
                console.log(`✅ Loaded ${existingSessions.length} sessions from database`);
            }
            else {
                console.log('📭 No sessions found in database');
            }
        }
        catch (error) {
            console.error('❌ Failed to load sessions from API:', error);
        }
        finally {
            setIsLoadingScenarios(false);
        }
    };
    const generateCompleteDemo = async () => {
        // Clear existing data and reload sessions
        clearTraces();
        setSessions([]);
        await loadExistingSessions();
    };
    const handleSelectTrace = (trace) => {
        setSelectedTrace(trace);
        setSelectedNode(trace.id); // Also set the node for Node Details tab
        // Auto-open right panel if user preference is enabled
        if (autoOpenPanelOnNodeClick) {
            setRightPanelCollapsed(false);
        }
    };
    const handleSelectTraceById = (traceId) => {
        const trace = traces.find(t => t.id === traceId);
        if (trace) {
            handleSelectTrace(trace);
        }
    };
    // When a node is selected, also find and set its related trace for the Inspector
    const handleNodeSelection = (nodeId) => {
        if (nodeId) {
            const relatedTrace = traces.find(t => t.id === nodeId);
            if (relatedTrace) {
                setSelectedTrace(relatedTrace);
            }
            // Open the right panel if it's collapsed and switch to details tab
            if (rightPanelCollapsed) {
                setRightPanelCollapsed(false);
            }
            setRightPanelTab('details');
        }
    };
    // Update selected trace when selectedNodeId changes
    (0, react_1.useEffect)(() => {
        handleNodeSelection(selectedNodeId);
    }, [selectedNodeId, traces]);
    // Initialize session data on app startup
    (0, react_1.useEffect)(() => {
        console.log('🚀 App useEffect triggered - starting loadExistingSessions');
        console.log('🔍 hasLoadedRef.current:', hasLoadedRef.current);
        console.log('🏗️ React StrictMode enabled - this useEffect may run twice in development');
        console.log('⏰ Timestamp:', new Date().toISOString());
        // Prevent multiple executions (StrictMode-safe)
        if (hasLoadedRef.current) {
            console.log('✅ Already loaded scenarios (ref check), skipping...');
            console.log('🎯 This is the StrictMode protection working correctly!');
            console.log('⚡ StrictMode double-render prevented successfully');
            return;
        }
        hasLoadedRef.current = true;
        console.log('🎬 Setting hasLoadedRef to true - proceeding with load');
        console.log('🔄 This should only appear ONCE even with StrictMode enabled');
        // Also test API connectivity immediately
        const testApi = async () => {
            try {
                console.log('🧪 Testing API connectivity...');
                console.log('🔗 Making fetch request to: http://localhost:3001/api/health');
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
                const response = await fetch('http://localhost:3001/api/health', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                    },
                    signal: controller.signal,
                });
                clearTimeout(timeoutId);
                console.log('📡 Response received:', {
                    status: response.status,
                    statusText: response.statusText,
                    headers: Object.fromEntries(response.headers.entries()),
                    url: response.url,
                    type: response.type,
                    ok: response.ok,
                });
                const contentType = response.headers.get('content-type');
                console.log('📋 Content-Type:', contentType);
                let data;
                if (contentType && contentType.includes('application/json')) {
                    data = await response.json();
                }
                else {
                    data = await response.text();
                }
                console.log('✅ API health check successful:', data);
                // Test the sessions endpoint too
                console.log('🔄 Testing sessions endpoint...');
                const sessionsResponse = await fetch('http://localhost:3001/api/sessions', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                    },
                });
                console.log('📡 Sessions response:', {
                    status: sessionsResponse.status,
                    statusText: sessionsResponse.statusText,
                    ok: sessionsResponse.ok,
                });
                const sessionsData = await sessionsResponse.json();
                console.log('📊 Sessions data:', sessionsData);
            }
            catch (error) {
                const err = error;
                console.error('❌ API connectivity test failed:', {
                    name: err.name,
                    message: err.message,
                    stack: err.stack,
                    cause: err.cause,
                });
                if (err.name === 'AbortError') {
                    console.error('⏰ Request timed out after 10 seconds');
                }
                else if (err.name === 'TypeError' && err.message.includes('fetch')) {
                    console.error('🌐 Network error - could not connect to server');
                }
            }
        };
        testApi();
        loadExistingSessions();
    }, []);
    const handleBookmarkTrace = (traceId) => {
        const trace = traces.find(t => t.id === traceId);
        if (trace) {
            if (isBookmarked(traceId)) {
                const bookmark = getBookmarkByTraceId(traceId);
                if (bookmark) {
                    removeBookmark(bookmark.id);
                }
            }
            else {
                addBookmark(traceId, trace);
            }
        }
    };
    return (<div className="h-screen flex bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (<div className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden" onClick={() => setSidebarOpen(false)}/>)}

      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-30 transform transition-transform duration-300 ease-in-out
        ${leftPanelCollapsed ? 'w-16' : 'w-80'}
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="h-full relative">
          {/* Collapse button for left panel - only show when collapsed */}
          {leftPanelCollapsed && (<button onClick={() => setLeftPanelCollapsed(false)} className="absolute z-10 p-2 rounded-md border border-gray-300 bg-white text-gray-600 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-300 transition-colors shadow-md top-2 left-1/2 transform -translate-x-1/2" title="Expand panel">
              <lucide_react_1.ChevronRight className="w-4 h-4"/>
            </button>)}
          
          <SidebarControls_1.SidebarControls sessions={sessions} currentSession={currentSession} status={status} searchQuery={searchQuery} setSearchQuery={setSearchQuery} setCurrentSession={handleSetCurrentSession} className="h-full" onOpenTeamManagement={() => setShowTeamManagement(true)} collapsed={leftPanelCollapsed} onExpand={() => setLeftPanelCollapsed(false)} activeTab={leftPanelActiveTab} onTabChange={setLeftPanelActiveTab} createSession={createSession} deleteSession={deleteSession} clearTraces={clearTraces} generateCompleteDemo={generateCompleteDemo} onCollapse={() => setLeftPanelCollapsed(true)} showNotification={(notif) => setNotification({ ...notif, isOpen: true })}/>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors lg:hidden">
                {sidebarOpen ? <lucide_react_1.X className="w-5 h-5"/> : <lucide_react_1.Menu className="w-5 h-5"/>}
              </button>
              <h1 className="text-xl font-semibold text-gray-900">FlowScope Visual Debugger</h1>
            </div>
            
            <div className="flex items-center gap-4">
              {/* View Mode Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button onClick={() => setViewMode('flow')} className={`px-3 py-1 rounded text-sm transition-colors flex items-center gap-1 ${viewMode === 'flow'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'}`}>
                  <lucide_react_1.Grid className="w-4 h-4"/>
                  Flow
                </button>
                <button onClick={() => setViewMode('timeline')} className={`px-3 py-1 rounded text-sm transition-colors flex items-center gap-1 ${viewMode === 'timeline'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'}`}>
                  <lucide_react_1.Clock className="w-4 h-4"/>
                  Timeline
                </button>
              </div>

              <WebSocketIndicator_1.WebSocketIndicator status={status} onReconnect={connect} className="text-sm"/>
            </div>
          </div>
        </header>

        {/* Main visualization area */}
        <main className="flex-1 flex relative">
          {/* Main view area */}
          <div className="flex-1 relative">
            {viewMode === 'flow' ? (<ChainVisualization_1.default />) : (<TimelineView_1.TimelineView onSelectTrace={handleSelectTrace} selectedTraceId={selectedTrace?.id}/>)}
            
            {/* Notification dialog centered in main panel */}
            {notification?.isOpen && (<div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
                  <h3 className="text-lg font-semibold mb-2">{notification.title}</h3>
                  <p className="text-gray-600 mb-4">{notification.message}</p>
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setNotification(null)} className="px-4 py-2 text-gray-600 hover:text-gray-800 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors">
                      Cancel
                    </button>
                    {notification.onConfirm && (<button onClick={() => {
                    notification.onConfirm?.();
                    setNotification(null);
                }} className={`px-4 py-2 text-white rounded-lg transition-colors ${notification.confirmVariant === 'danger'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-blue-600 hover:bg-blue-700'}`}>
                        {notification.confirmText || 'Confirm'}
                      </button>)}
                  </div>
                </div>
              </div>)}
          </div>

          {/* Right panel tabs */}
          <div className={`border-l border-gray-200 bg-white flex flex-col transition-all duration-300 relative ${rightPanelCollapsed ? 'w-12' : 'w-80'}`}>
            {/* Collapse button for right panel */}
            <button onClick={() => setRightPanelCollapsed(!rightPanelCollapsed)} className="absolute top-2 left-2 z-10 p-2 rounded-md border border-gray-300 bg-white text-gray-600 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-300 transition-colors shadow-md" title={rightPanelCollapsed ? "Expand panel" : "Collapse panel"}>
              {rightPanelCollapsed ? <lucide_react_1.ChevronLeft className="w-4 h-4"/> : <lucide_react_1.ChevronRight className="w-4 h-4"/>}
            </button>
            
            {rightPanelCollapsed ? (
        /* Collapsed right panel with icon tabs */
        <div className="flex flex-col items-center pt-16 space-y-4">
                <button onClick={() => {
                setRightPanelTab('details');
                setRightPanelCollapsed(false);
            }} className={`p-3 rounded-lg transition-colors ${rightPanelTab === 'details'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'}`} title="Node Details">
                  📋
                </button>
                
                <button onClick={() => {
                setRightPanelTab('inspector');
                setRightPanelCollapsed(false);
            }} className={`p-3 rounded-lg transition-colors ${rightPanelTab === 'inspector'
                ? 'bg-green-100 text-green-700'
                : 'text-gray-600 hover:text-green-600 hover:bg-green-50'}`} title="Trace Inspector">
                  🔍
                </button>
                
                <button onClick={() => {
                setRightPanelTab('bookmarks');
                setRightPanelCollapsed(false);
            }} className={`p-3 rounded-lg transition-colors ${rightPanelTab === 'bookmarks'
                ? 'bg-yellow-100 text-yellow-700'
                : 'text-gray-600 hover:text-yellow-600 hover:bg-yellow-50'}`} title="Bookmarks">
                  <lucide_react_1.Bookmark className="w-5 h-5"/>
                </button>
                
                <button onClick={() => {
                setRightPanelTab('comments');
                setRightPanelCollapsed(false);
            }} className={`p-3 rounded-lg transition-colors ${rightPanelTab === 'comments'
                ? 'bg-purple-100 text-purple-700'
                : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'}`} title="Comments">
                  <lucide_react_1.MessageCircle className="w-5 h-5"/>
                </button>
              </div>) : (<>
                {/* Tab headers - Icon-based tabs instead of dropdown */}
                <div className="border-b border-gray-200 bg-gray-50">
                  <div className="flex">
                    <button onClick={() => setRightPanelTab('details')} className={`flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center ${rightPanelTab === 'details'
                ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'}`} title="Node Details">
                      <span className="text-lg">📋</span>
                    </button>
                    
                    <button onClick={() => setRightPanelTab('inspector')} className={`flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center ${rightPanelTab === 'inspector'
                ? 'bg-white text-green-600 border-b-2 border-green-600'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'}`} title="Trace Inspector">
                      <span className="text-lg">🔍</span>
                    </button>
                    
                    <button onClick={() => setRightPanelTab('bookmarks')} className={`flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center ${rightPanelTab === 'bookmarks'
                ? 'bg-white text-yellow-600 border-b-2 border-yellow-600'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'}`} title="Bookmarks">
                      <lucide_react_1.Bookmark className="w-5 h-5"/>
                    </button>
                    
                    <button onClick={() => setRightPanelTab('comments')} className={`flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center ${rightPanelTab === 'comments'
                ? 'bg-white text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'}`} title="Comments">
                      <lucide_react_1.MessageCircle className="w-5 h-5"/>
                    </button>
                  </div>
                </div>

            {/* Tab content */}
            <div className="flex-1 overflow-hidden">
              {rightPanelTab === 'details' && selectedNodeId && (<NodeDetail_1.NodeDetail nodeId={selectedNodeId}/>)}
              {rightPanelTab === 'details' && !selectedNodeId && (<div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <p className="text-sm">Select a node to view details</p>
                    <p className="text-xs text-gray-400 mt-1">Click on any node in the Flow view</p>
                  </div>
                </div>)}
              {rightPanelTab === 'inspector' && selectedTrace && (<TraceInspector_1.TraceInspector trace={selectedTrace} onBookmark={handleBookmarkTrace} isBookmarked={isBookmarked(selectedTrace.id)}/>)}
              {rightPanelTab === 'inspector' && !selectedTrace && (<div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <p className="text-sm">Select a trace to inspect</p>
                    <p className="text-xs text-gray-400 mt-1">Click on a node in Flow view or trace in Timeline view</p>
                  </div>
                </div>)}
              {rightPanelTab === 'bookmarks' && (<BookmarksPanel_1.BookmarksPanel onSelectTrace={handleSelectTraceById} selectedTraceId={selectedTrace?.id}/>)}
              {rightPanelTab === 'comments' && selectedTrace && (<Comments_1.Comments traceId={selectedTrace.id} sessionId={selectedTrace.sessionId} className="p-4"/>)}
              {rightPanelTab === 'comments' && !selectedTrace && (<div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <lucide_react_1.MessageCircle className="w-8 h-8 mx-auto mb-2 text-gray-400"/>
                    <p className="text-sm">Select a trace to view comments</p>
                    <p className="text-xs text-gray-400 mt-1">Click on a node in Flow view or trace in Timeline view</p>
                  </div>
                </div>)}
            </div>
            </>)}
          </div>
        </main>
      </div>

      {/* Global Modals - Rendered outside main layout for proper overlay */}
      <TeamManagement_1.TeamManagement isOpen={showTeamManagement} onClose={() => setShowTeamManagement(false)}/>
    </div>);
}
exports.default = App;
