import { Menu, X, Grid, Clock, Bookmark, MessageCircle, ChevronLeft, ChevronRight, Settings, BarChart, Search, Download, Keyboard } from 'lucide-react';
import ChainVisualization from './components/debugger/ChainVisualization';
import { SidebarControls } from './components/debugger/SidebarControls';
import { NodeDetail } from './components/debugger/NodeDetail';
import { TimelineView } from './components/debugger/TimelineView';
import { TraceInspector } from './components/debugger/TraceInspector';
import { BookmarksPanel } from './components/debugger/BookmarksPanel';
import { Comments } from './components/teams/Comments';
import { TeamManagement } from './components/teams/TeamManagement';
import { WebSocketIndicator } from './components/WebSocketIndicator';
import { useDebuggerStore } from './store/debugger';
import type { UISession } from './store/debugger';
import { useBookmarkStore } from './store/bookmarks';

// Phase 5 Professional Visualization Components
import { PerformanceMetrics } from './components/debugger/PerformanceMetrics';
import { AdvancedSearch } from './components/debugger/AdvancedSearch';
import { KeyboardShortcuts } from './components/debugger/KeyboardShortcuts';
import { ExportOptions } from './components/debugger/ExportOptions';

import { useWebSocket } from './hooks/useWebSocket';
import { useUserPreferences } from './hooks/useUserPreferences';
import { useState, useEffect, useRef } from 'react';
import { ApiService } from './services/api';

function App() {
  const { 
    sidebarOpen, 
    setSidebarOpen, 
    selectedNodeId,
    setSelectedNode,
    viewMode, 
    setViewMode,
    traces,
    // Session management
    sessions,
    currentSession,
    setCurrentSession,
    setSessions,
    addSession,
    deleteSession,
    addTrace,
    clearTraces
  } = useDebuggerStore();
  
  const { 
    addBookmark, 
    removeBookmark, 
    isBookmarked, 
    getBookmarkByTraceId 
  } = useBookmarkStore();

  const { status, connect } = useWebSocket();
  
  // User preferences hook
  const {
    preferences,
    setRightPanelTab,
    setRightPanelCollapsed,
    setSidebarCollapsed,
  } = useUserPreferences();
  
  // Use preferences or fallback to defaults
  const rightPanelTab = preferences?.rightPanelTab || 'details';
  const rightPanelCollapsed = preferences?.rightPanelCollapsed || false;
  const leftPanelCollapsed = preferences?.sidebarCollapsed || false;
  const autoOpenPanelOnNodeClick = preferences?.autoOpenPanelOnNodeClick ?? true;
  
  // Create wrapper for left panel collapsed to use the preferences system
  const setLeftPanelCollapsed = (collapsed: boolean) => {
    setSidebarCollapsed(collapsed);
  };
  
  const [selectedTrace, setSelectedTrace] = useState<any>(null);
  const [showTeamManagement, setShowTeamManagement] = useState(false);
  const [leftPanelActiveTab, setLeftPanelActiveTab] = useState<'sessions' | 'team' | 'tools'>('sessions');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingScenarios, setIsLoadingScenarios] = useState(false);
  
  // Phase 5 Professional Visualization State
  const [showPerformanceMetrics, setShowPerformanceMetrics] = useState(false);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [showToolsDropdown, setShowToolsDropdown] = useState(false);
  
  // Use useRef to ensure loadExistingSessions only runs once (StrictMode-safe)
  const hasLoadedRef = useRef(false);
  const toolsDropdownRef = useRef<HTMLDivElement>(null);
  
  // Notification system for main panel
  const [notification, setNotification] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm?: () => void;
    confirmText?: string;
    confirmVariant?: 'danger' | 'primary';
  } | null>(null);

  // Create wrapper functions for session management
  const createSession = (name?: string): UISession => {
    const newSession: UISession = {
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

  const handleSetCurrentSession = (session: UISession) => {
    setCurrentSession(session.id);
  };

  const loadExistingSessions = async () => {
    // Prevent concurrent executions
    if (isLoadingScenarios) {
      console.log('⏭️ loadExistingSessions already running, skipping...');
      return;
    }
    
    // Check if sessions are already loaded in store
    const currentSessions = useDebuggerStore.getState().sessions;
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
      const existingSessions = await ApiService.getAllSessions();
      console.log('📊 Found existing sessions in DB:', existingSessions.length);
      
      if (existingSessions.length > 0) {
        console.log('✅ Sessions loaded from database');
        
        // Convert API sessions to frontend sessions and load into store
        const frontendSessions: UISession[] = [];
        for (const apiSession of existingSessions) {
          const sessionTraces = await ApiService.getSessionTraces(apiSession.id);
          
          const frontendSession: UISession = {
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
      } else {
        console.log('📭 No sessions found in database');
      }
      
    } catch (error) {
      console.error('❌ Failed to load sessions from API:', error);
    } finally {
      setIsLoadingScenarios(false);
    }
  };

  const generateCompleteDemo = async () => {
    // Clear existing data and reload sessions
    clearTraces();
    setSessions([]);
    await loadExistingSessions();
  };

  const handleSelectTrace = (trace: any) => {
    setSelectedTrace(trace);
    setSelectedNode(trace.id); // Also set the node for Node Details tab
    
    // Auto-open right panel if user preference is enabled
    if (autoOpenPanelOnNodeClick) {
      setRightPanelCollapsed(false);
    }
  };

  const handleSelectTraceById = (traceId: string) => {
    const trace = traces.find(t => t.id === traceId);
    if (trace) {
      handleSelectTrace(trace);
    }
  };

  // When a node is selected, also find and set its related trace for the Inspector
  const handleNodeSelection = (nodeId: string | null) => {
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
  useEffect(() => {
    handleNodeSelection(selectedNodeId);
  }, [selectedNodeId, traces]);

  // Initialize session data on app startup
  useEffect(() => {
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
        } else {
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
        
      } catch (error) {
        const err = error as Error;
        console.error('❌ API connectivity test failed:', {
          name: err.name,
          message: err.message,
          stack: err.stack,
          cause: (err as any).cause,
        });
        
        if (err.name === 'AbortError') {
          console.error('⏰ Request timed out after 10 seconds');
        } else if (err.name === 'TypeError' && err.message.includes('fetch')) {
          console.error('🌐 Network error - could not connect to server');
        }
      }
    };
    
    testApi();
    loadExistingSessions();
  }, []);

  // Close tools dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (toolsDropdownRef.current && !toolsDropdownRef.current.contains(event.target as Node)) {
        setShowToolsDropdown(false);
      }
    };

    if (showToolsDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showToolsDropdown]);

  const handleBookmarkTrace = (traceId: string) => {
    const trace = traces.find(t => t.id === traceId);
    if (trace) {
      if (isBookmarked(traceId)) {
        const bookmark = getBookmarkByTraceId(traceId);
        if (bookmark) {
          removeBookmark(bookmark.id);
        }
      } else {
        addBookmark(traceId, trace);
      }
    }
  };

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-30 transform transition-transform duration-300 ease-in-out
        ${leftPanelCollapsed ? 'w-16' : 'w-80'}
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="h-full relative">
          {/* Collapse button for left panel - only show when collapsed */}
          {leftPanelCollapsed && (
            <button
              onClick={() => setLeftPanelCollapsed(false)}
              className="absolute z-10 p-2 rounded-md border border-gray-300 bg-white text-gray-600 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-300 transition-colors shadow-md top-2 left-1/2 transform -translate-x-1/2"
              title="Expand panel"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
          
          <SidebarControls 
            sessions={sessions}
            currentSession={currentSession}
            status={status}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            setCurrentSession={handleSetCurrentSession}
            className="h-full" 
            onOpenTeamManagement={() => setShowTeamManagement(true)}
            collapsed={leftPanelCollapsed}
            onExpand={() => setLeftPanelCollapsed(false)}
            activeTab={leftPanelActiveTab}
            onTabChange={setLeftPanelActiveTab}
            createSession={createSession}
            deleteSession={deleteSession}
            clearTraces={clearTraces}
            generateCompleteDemo={generateCompleteDemo}
            onCollapse={() => setLeftPanelCollapsed(true)}
            showNotification={(notif) => setNotification({ ...notif, isOpen: true })}
          />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors lg:hidden"
              >
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              <h1 className="text-xl font-semibold text-gray-900">FlowScope Visual Debugger</h1>
            </div>
            
            <div className="flex items-center gap-4">
              {/* View Mode Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('flow')}
                  className={`px-3 py-1 rounded text-sm transition-colors flex items-center gap-1 ${
                    viewMode === 'flow' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Grid className="w-4 h-4" />
                  Flow
                </button>
                <button
                  onClick={() => setViewMode('timeline')}
                  className={`px-3 py-1 rounded text-sm transition-colors flex items-center gap-1 ${
                    viewMode === 'timeline' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  Timeline
                </button>
              </div>

              {/* Phase 5 Professional Tools Dropdown */}
              <div className="relative" ref={toolsDropdownRef}>
                <button
                  onClick={() => setShowToolsDropdown(!showToolsDropdown)}
                  className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
                >
                  <Settings className="w-4 h-4" />
                  Tools
                </button>
                
                {showToolsDropdown && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                    <div className="py-2">
                      <button
                        onClick={() => {
                          setShowPerformanceMetrics(!showPerformanceMetrics);
                          setShowToolsDropdown(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3"
                      >
                        <BarChart className="w-4 h-4" />
                        Performance Metrics
                      </button>
                      <button
                        onClick={() => {
                          setShowAdvancedSearch(!showAdvancedSearch);
                          setShowToolsDropdown(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3"
                      >
                        <Search className="w-4 h-4" />
                        Advanced Search
                      </button>
                      <button
                        onClick={() => {
                          setShowExportOptions(!showExportOptions);
                          setShowToolsDropdown(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3"
                      >
                        <Download className="w-4 h-4" />
                        Export Options
                      </button>
                      <div className="border-t border-gray-100 my-1"></div>
                      <div className="px-4 py-2 text-xs text-gray-500 flex items-center gap-2">
                        <Keyboard className="w-3 h-3" />
                        Keyboard shortcuts active
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <WebSocketIndicator 
                status={status} 
                onReconnect={connect}
                className="text-sm"
              />
            </div>
          </div>
        </header>

        {/* Main visualization area */}
        <main className="flex-1 flex relative">
          {/* Main view area */}
          <div className="flex-1 relative">
            {viewMode === 'flow' ? (
              <ChainVisualization />
            ) : (
              <TimelineView 
                onSelectTrace={handleSelectTrace}
                selectedTraceId={selectedTrace?.id}
              />
            )}
            
            {/* Notification dialog centered in main panel */}
            {notification?.isOpen && (
              <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
                  <h3 className="text-lg font-semibold mb-2">{notification.title}</h3>
                  <p className="text-gray-600 mb-4">{notification.message}</p>
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => setNotification(null)}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    {notification.onConfirm && (
                      <button
                        onClick={() => {
                          notification.onConfirm?.();
                          setNotification(null);
                        }}
                        className={`px-4 py-2 text-white rounded-lg transition-colors ${
                          notification.confirmVariant === 'danger' 
                            ? 'bg-red-600 hover:bg-red-700' 
                            : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                      >
                        {notification.confirmText || 'Confirm'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {/* Phase 5 Professional Visualization Overlays */}
            {showPerformanceMetrics && (
              <div className="absolute top-4 left-4 z-40">
                <PerformanceMetrics className="w-80" />
                <button
                  onClick={() => setShowPerformanceMetrics(false)}
                  className="absolute top-2 right-2 p-1 text-gray-500 hover:text-gray-700 bg-white rounded-full shadow-md hover:shadow-lg transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            
            {showAdvancedSearch && (
              <div className="absolute top-4 right-4 z-40">
                <AdvancedSearch className="w-96" />
                <button
                  onClick={() => setShowAdvancedSearch(false)}
                  className="absolute top-2 right-2 p-1 text-gray-500 hover:text-gray-700 bg-white rounded-full shadow-md hover:shadow-lg transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            
            {showExportOptions && (
              <div className="absolute bottom-4 left-4 z-40">
                <ExportOptions className="w-72" />
                <button
                  onClick={() => setShowExportOptions(false)}
                  className="absolute top-2 right-2 p-1 text-gray-500 hover:text-gray-700 bg-white rounded-full shadow-md hover:shadow-lg transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Right panel tabs */}
          <div className={`border-l border-gray-200 bg-white flex flex-col transition-all duration-300 relative ${
            rightPanelCollapsed ? 'w-12' : 'w-80'
          }`}>
            {/* Collapse button for right panel */}
            <button
              onClick={() => setRightPanelCollapsed(!rightPanelCollapsed)}
              className="absolute top-2 left-2 z-10 p-2 rounded-md border border-gray-300 bg-white text-gray-600 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-300 transition-colors shadow-md"
              title={rightPanelCollapsed ? "Expand panel" : "Collapse panel"}
            >
              {rightPanelCollapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
            
            {rightPanelCollapsed ? (
              /* Collapsed right panel with icon tabs */
              <div className="flex flex-col items-center pt-16 space-y-4">
                <button
                  onClick={() => {
                    setRightPanelTab('details');
                    setRightPanelCollapsed(false);
                  }}
                  className={`p-3 rounded-lg transition-colors ${
                    rightPanelTab === 'details' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                  }`}
                  title="Node Details"
                >
                  📋
                </button>
                
                <button
                  onClick={() => {
                    setRightPanelTab('inspector');
                    setRightPanelCollapsed(false);
                  }}
                  className={`p-3 rounded-lg transition-colors ${
                    rightPanelTab === 'inspector' 
                      ? 'bg-green-100 text-green-700' 
                      : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
                  }`}
                  title="Trace Inspector"
                >
                  🔍
                </button>
                
                <button
                  onClick={() => {
                    setRightPanelTab('bookmarks');
                    setRightPanelCollapsed(false);
                  }}
                  className={`p-3 rounded-lg transition-colors ${
                    rightPanelTab === 'bookmarks' 
                      ? 'bg-yellow-100 text-yellow-700' 
                      : 'text-gray-600 hover:text-yellow-600 hover:bg-yellow-50'
                  }`}
                  title="Bookmarks"
                >
                  <Bookmark className="w-5 h-5" />
                </button>
                
                <button
                  onClick={() => {
                    setRightPanelTab('comments');
                    setRightPanelCollapsed(false);
                  }}
                  className={`p-3 rounded-lg transition-colors ${
                    rightPanelTab === 'comments' 
                      ? 'bg-purple-100 text-purple-700' 
                      : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
                  }`}
                  title="Comments"
                >
                  <MessageCircle className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <>
                {/* Tab headers - Icon-based tabs instead of dropdown */}
                <div className="border-b border-gray-200 bg-gray-50">
                  <div className="flex">
                    <button
                      onClick={() => setRightPanelTab('details')}
                      className={`flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center ${
                        rightPanelTab === 'details'
                          ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                          : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                      }`}
                      title="Node Details"
                    >
                      <span className="text-lg">📋</span>
                    </button>
                    
                    <button
                      onClick={() => setRightPanelTab('inspector')}
                      className={`flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center ${
                        rightPanelTab === 'inspector'
                          ? 'bg-white text-green-600 border-b-2 border-green-600'
                          : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                      }`}
                      title="Trace Inspector"
                    >
                      <span className="text-lg">🔍</span>
                    </button>
                    
                    <button
                      onClick={() => setRightPanelTab('bookmarks')}
                      className={`flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center ${
                        rightPanelTab === 'bookmarks'
                          ? 'bg-white text-yellow-600 border-b-2 border-yellow-600'
                          : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                      }`}
                      title="Bookmarks"
                    >
                      <Bookmark className="w-5 h-5" />
                    </button>
                    
                    <button
                      onClick={() => setRightPanelTab('comments')}
                      className={`flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center ${
                        rightPanelTab === 'comments'
                          ? 'bg-white text-purple-600 border-b-2 border-purple-600'
                          : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                      }`}
                      title="Comments"
                    >
                      <MessageCircle className="w-5 h-5" />
                    </button>
                  </div>
                </div>

            {/* Tab content */}
            <div className="flex-1 overflow-hidden">
              {rightPanelTab === 'details' && selectedNodeId && (
                <NodeDetail 
                  nodeId={selectedNodeId} 
                />
              )}
              {rightPanelTab === 'details' && !selectedNodeId && (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <p className="text-sm">Select a node to view details</p>
                    <p className="text-xs text-gray-400 mt-1">Click on any node in the Flow view</p>
                  </div>
                </div>
              )}
              {rightPanelTab === 'inspector' && selectedTrace && (
                <TraceInspector 
                  trace={selectedTrace}
                  onBookmark={handleBookmarkTrace}
                  isBookmarked={isBookmarked(selectedTrace.id)}
                />
              )}
              {rightPanelTab === 'inspector' && !selectedTrace && (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <p className="text-sm">Select a trace to inspect</p>
                    <p className="text-xs text-gray-400 mt-1">Click on a node in Flow view or trace in Timeline view</p>
                  </div>
                </div>
              )}
              {rightPanelTab === 'bookmarks' && (
                <BookmarksPanel 
                  onSelectTrace={handleSelectTraceById}
                  selectedTraceId={selectedTrace?.id}
                />
              )}
              {rightPanelTab === 'comments' && selectedTrace && (
                <Comments 
                  traceId={selectedTrace.id}
                  sessionId={selectedTrace.sessionId}
                  className="p-4"
                />
              )}
              {rightPanelTab === 'comments' && !selectedTrace && (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <MessageCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">Select a trace to view comments</p>
                    <p className="text-xs text-gray-400 mt-1">Click on a node in Flow view or trace in Timeline view</p>
                  </div>
                </div>
              )}
            </div>
            </>
            )}
          </div>
        </main>
      </div>

      {/* Global Modals - Rendered outside main layout for proper overlay */}
      <TeamManagement 
        isOpen={showTeamManagement} 
        onClose={() => setShowTeamManagement(false)} 
      />
      
      {/* Phase 5 Keyboard Shortcuts - Always Active */}
      <KeyboardShortcuts />
    </div>
  );
}

export default App;
