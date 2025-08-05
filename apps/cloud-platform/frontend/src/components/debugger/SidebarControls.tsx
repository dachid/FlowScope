import React from 'react';
import { Play, RotateCcw, Download, Filter, Search, Zap, Send, Trash2, Share, Users, Settings, Wifi, ChevronLeft } from 'lucide-react';
import type { UISession } from '../../store/debugger';
import { TeamPanel } from '../teams/TeamPanel';
import { AdvancedFilters } from './AdvancedFilters';
import { ConnectionTester } from '../ConnectionTester';

interface WebSocketStatus {
  connected: boolean;
  connecting: boolean;
  error: string | null;
  lastPing?: number;
}

interface SidebarControlsProps {
  sessions: UISession[];
  currentSession: UISession | null;
  status: WebSocketStatus;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  setCurrentSession: (session: UISession) => void;
  className?: string;
  onOpenTeamManagement?: () => void;
  collapsed?: boolean;
  onExpand?: () => void;
  onCollapse?: () => void;
  activeTab?: 'sessions' | 'team' | 'tools';
  onTabChange?: (tab: 'sessions' | 'team' | 'tools') => void;
  // Session management
  createSession: (name?: string) => UISession;
  deleteSession: (id: string) => void;
  clearTraces: () => void;
  // Reload functionality
  generateCompleteDemo: () => void;
  // Notification system
  showNotification?: (notification: {
    title: string;
    message: string;
    onConfirm?: () => void;
    confirmText?: string;
    confirmVariant?: 'danger' | 'primary';
  }) => void;
}

export const SidebarControls: React.FC<SidebarControlsProps> = ({
  sessions,
  currentSession,
  status,
  searchQuery,
  setSearchQuery,
  setCurrentSession,
  className = '',
  onOpenTeamManagement,
  collapsed = false,
  onExpand,
  onCollapse,
  activeTab = 'sessions',
  onTabChange,
  createSession,
  deleteSession,
  clearTraces,
  generateCompleteDemo,
  showNotification,
}) => {
  const [showConnectionTester, setShowConnectionTester] = React.useState(false);
  const [showExportModal, setShowExportModal] = React.useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = React.useState(false);

  const handleAdvancedFilters = () => {
    // If collapsed, expand the panel first
    if (collapsed && onExpand) {
      onExpand();
      return; // Let the user access it from the expanded panel
    }
    
    // Show notification dialog in main panel center
    if (showNotification) {
      showNotification({
        title: 'Advanced Filters',
        message: 'Access comprehensive filtering options to refine your trace data by type, status, timeframe, and more.',
        onConfirm: () => {
          // Open the advanced filters modal
          setShowAdvancedFilters(true);
        },
        confirmText: 'Open Filters',
        confirmVariant: 'primary'
      });
    }
  };

  const handleNewSession = () => {
    const newSession = createSession();
    setCurrentSession(newSession);
  };

  const handleLoadSessions = () => {
    if (showNotification) {
      showNotification({
        title: 'Reload All Sessions',
        message: 'This will reload all sessions from the database. Any existing traces in the current session will be cleared. Continue?',
        onConfirm: () => {
          generateCompleteDemo();
        },
        confirmText: 'Reload Sessions',
        confirmVariant: 'primary'
      });
    }
  };

  const handleConfirmSessionSwitch = (onConfirm: () => void) => {
    if (currentSession && currentSession.traceCount > 0) {
      if (showNotification) {
        showNotification({
          title: 'Switch Session',
          message: 'You have unsaved traces in the current session. Switching sessions will clear the current traces. Continue?',
          onConfirm: onConfirm,
          confirmText: 'Switch Session',
          confirmVariant: 'danger'
        });
      }
    } else {
      onConfirm();
    }
  };

  const handleConfirmDeleteSession = (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (showNotification) {
      showNotification({
        title: 'Delete Session',
        message: `Are you sure you want to delete the session "${session?.name}"? This action cannot be undone.`,
        onConfirm: () => {
          deleteSession(sessionId);
        },
        confirmText: 'Delete',
        confirmVariant: 'danger'
      });
    }
  };

  const handleSendLiveTrace = () => {
    // If collapsed, expand the panel first
    if (collapsed && onExpand) {
      onExpand();
      return; // Let the user access it from the expanded panel
    }
    
    // Show confirmation dialog in main panel center
    if (showNotification) {
      showNotification({
        title: 'Send Live Trace',
        message: status.connected 
          ? 'This will send a live trace to the connected debugger target. Continue?' 
          : 'This will send a local trace simulation. Continue?',
        onConfirm: () => {
          // Implementation for sending live trace
          if (status.connected) {
            // Send actual live trace via WebSocket
            console.log('Sending live trace via WebSocket...');
            // TODO: Implement WebSocket trace sending
          } else {
            // Generate a local trace simulation
            console.log('Generating local trace simulation...');
            if (currentSession) {
              // Add a simulated trace to current session
              generateCompleteDemo();
            }
          }
        },
        confirmText: 'Send Trace',
        confirmVariant: 'primary'
      });
    }
  };

  const handleExportShare = () => {
    // If collapsed, expand the panel first
    if (collapsed && onExpand) {
      onExpand();
      return; // Let the user access it from the expanded panel
    }
    
    // Show confirmation dialog in main panel center
    if (showNotification) {
      showNotification({
        title: 'Export & Share',
        message: 'Choose export format and sharing options for the current session traces.',
        onConfirm: () => {
          // Open the export/share modal
          setShowExportModal(true);
        },
        confirmText: 'Continue',
        confirmVariant: 'primary'
      });
    }
  };

  const handleTestConnection = () => {
    // If collapsed, expand the panel first
    if (collapsed && onExpand) {
      onExpand();
      return; // Let the user access it from the expanded panel
    }
    
    // Show confirmation dialog in main panel center
    if (showNotification) {
      showNotification({
        title: 'Test Connection',
        message: 'Run comprehensive connection tests to verify backend, API, and WebSocket connectivity.',
        onConfirm: () => {
          // Open the connection tester modal
          setShowConnectionTester(true);
        },
        confirmText: 'Run Tests',
        confirmVariant: 'primary'
      });
    }
  };

  // Helper function to expand to a specific tab
  const expandToTab = (tab: 'sessions' | 'team' | 'tools') => {
    if (onTabChange) {
      onTabChange(tab);
    }
    if (onExpand) {
      onExpand();
    }
  };

  const filteredSessions = sessions.filter(session =>
    (session.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={`bg-white border-r border-gray-200 ${className}`}>
      {collapsed ? (
        /* Collapsed sidebar with comprehensive icons organized by tabs */
        <div className="p-2 pt-16 space-y-3">
          
          {/* Sessions Tab - Default active */}
          <button
            onClick={() => expandToTab('sessions')}
            className={`w-full p-2 rounded-lg transition-colors ${
              activeTab === 'sessions' 
                ? 'bg-blue-100 text-blue-700 border-blue-300' 
                : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
            }`}
            title="Sessions (Click to expand)"
          >
            <Settings className="w-4 h-4 mx-auto" />
          </button>

          {/* Team Tab */}
          <button
            onClick={() => expandToTab('team')}
            className={`w-full p-2 rounded-lg transition-colors ${
              activeTab === 'team' 
                ? 'bg-purple-100 text-purple-700 border-purple-300' 
                : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
            }`}
            title="Team Management (Click to expand)"
          >
            <Users className="w-4 h-4 mx-auto" />
          </button>

          {/* Tools Tab */}
          <button
            onClick={() => expandToTab('tools')}
            className={`w-full p-2 rounded-lg transition-colors ${
              activeTab === 'tools' 
                ? 'bg-green-100 text-green-700 border-green-300' 
                : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
            }`}
            title="Tools & Actions (Click to expand)"
          >
            <Zap className="w-4 h-4 mx-auto" />
          </button>

          {/* Quick Action Icons */}
          <div className="pt-3 border-t border-gray-200 space-y-2">
            {/* Send Live Trace */}
            <button
              onClick={handleSendLiveTrace}
              disabled={!currentSession}
              className="w-full p-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors disabled:text-gray-400 disabled:hover:bg-transparent"
              title="Send Live Trace"
            >
              <Send className="w-4 h-4 mx-auto" />
            </button>

            {/* Export & Share */}
            <button
              onClick={handleExportShare}
              disabled={!currentSession}
              className="w-full p-2 text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors disabled:text-gray-400 disabled:hover:bg-transparent"
              title="Export & Share"
            >
              <Download className="w-4 h-4 mx-auto" />
            </button>

            {/* Advanced Search/Filters */}
            <button
              onClick={handleAdvancedFilters}
              className="w-full p-2 text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              title="Advanced Filters"
            >
              <Filter className="w-4 h-4 mx-auto" />
            </button>
          </div>

          {/* Connection Status Indicator */}
          <div className="pt-3 border-t border-gray-200">
            <div className={`w-full p-2 rounded-lg ${status.connected ? 'text-green-600' : 'text-gray-500'}`} title={status.connected ? 'Connected' : 'Disconnected'}>
              <Wifi className="w-4 h-4 mx-auto" />
            </div>
          </div>
        </div>
      ) : (
        /* Full sidebar content with tabs */
        <>
          {/* Tab Headers with integrated collapse button */}
          <div className="border-b border-gray-200 bg-gray-50 relative">
            <div className="flex">
              <button
                onClick={() => onTabChange && onTabChange('sessions')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'sessions'
                    ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
              >
                <Settings className="w-4 h-4 inline mr-2" />
                Sessions
              </button>
              <button
                onClick={() => onTabChange && onTabChange('team')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'team'
                    ? 'bg-white text-purple-600 border-b-2 border-purple-600'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
              >
                <Users className="w-4 h-4 inline mr-2" />
                Team
              </button>
              <button
                onClick={() => onTabChange && onTabChange('tools')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'tools'
                    ? 'bg-white text-green-600 border-b-2 border-green-600'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
              >
                <Zap className="w-4 h-4 inline mr-2" />
                Tools
              </button>
            </div>
            
            {/* Collapse button integrated into tab header */}
            <button
              onClick={onCollapse}
              className="absolute top-1/2 right-2 transform -translate-y-1/2 p-1 rounded-md border border-gray-300 bg-white text-gray-500 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-300 transition-colors shadow-sm"
              title="Collapse panel"
            >
              <ChevronLeft className="w-3 h-3" />
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'sessions' && (
              <>
                {/* Session Search */}
                <div className="p-4 border-b border-gray-200">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search sessions..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                </div>

                {/* Sessions List */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-gray-900">Sessions</h3>
                    <div className="flex gap-1">
                      <button
                        onClick={() => clearTraces()}
                        className="text-xs text-gray-600 hover:text-gray-800"
                        title="Clear traces"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleAdvancedFilters}
                        className="text-xs text-gray-600 hover:text-gray-800"
                        title="Advanced filters"
                      >
                        <Filter className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleNewSession}
                        className="text-xs text-blue-600 hover:text-blue-700"
                        title="New Session"
                      >
                        <Play className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {filteredSessions.length > 0 ? (
                    <ul className="space-y-2">
                      {filteredSessions.map((session) => (
                        <li key={session.id}>
                          <div
                            className={`relative p-3 rounded-lg border transition-colors cursor-pointer ${
                              session.id === currentSession?.id
                                ? 'bg-blue-50 border-blue-200 text-blue-900'
                                : 'border-gray-200 hover:bg-gray-50'
                            }`}
                            onClick={() => {
                              if (session.id !== currentSession?.id) {
                                handleConfirmSessionSwitch(() => setCurrentSession(session));
                              }
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1 pr-2">
                                <div className="font-medium text-sm">{session.name}</div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {session.traceCount} traces
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleConfirmDeleteSession(session.id);
                                  }}
                                  className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors"
                                  title="Delete session"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setShowExportModal(true);
                                  }}
                                  className="p-1 text-gray-400 hover:text-blue-600 rounded transition-colors"
                                  title="Share session"
                                >
                                  <Share className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Settings className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">No sessions found</p>
                      <button
                        onClick={handleNewSession}
                        className="mt-2 text-xs text-blue-600 hover:text-blue-700"
                      >
                        Create your first session
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}

            {activeTab === 'team' && (
              <div className="p-4">
                <TeamPanel 
                  onOpenTeamManagement={onOpenTeamManagement || (() => {})}
                />
              </div>
            )}

            {activeTab === 'tools' && (
              <div className="p-4 space-y-3">
                <h3 className="text-sm font-medium text-gray-900 mb-4">Tools & Actions</h3>
                
                <button
                  onClick={handleLoadSessions}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                  <Zap className="w-4 h-4" />
                  Reload All Sessions
                </button>
                
                <button
                  onClick={handleSendLiveTrace}
                  disabled={!currentSession}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm"
                >
                  <Send className="w-4 h-4" />
                  {status.connected ? 'Send Live Trace' : 'Send Local Trace'}
                </button>
                
                <button
                  onClick={handleExportShare}
                  disabled={!currentSession}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm"
                >
                  <Download className="w-4 h-4" />
                  Export & Share
                </button>

                <button
                  onClick={handleTestConnection}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  <Wifi className="w-4 h-4" />
                  Test Connection
                </button>

                <div className="pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-500 mb-2">Connection Status</p>
                  <div className={`flex items-center gap-2 text-sm ${status.connected ? 'text-green-600' : 'text-gray-500'}`}>
                    <Wifi className="w-4 h-4" />
                    {status.connected ? 'Connected' : 'Disconnected'}
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Export & Share Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-0 max-w-lg w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Export & Share</h3>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ×
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Export Format</h4>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      // Export as JSON
                      if (currentSession) {
                        const data = JSON.stringify(currentSession, null, 2);
                        const blob = new Blob([data], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${currentSession.name}.json`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }
                      setShowExportModal(false);
                    }}
                    className="p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="font-medium text-sm">JSON</div>
                    <div className="text-xs text-gray-500">Raw session data</div>
                  </button>
                  <button
                    onClick={() => {
                      // Export as CSV
                      if (currentSession) {
                        // Create CSV from traces
                        const headers = ['Timestamp', 'Type', 'Status', 'Duration', 'Message'];
                        const csvContent = [
                          headers.join(','),
                          // Add trace data rows here when trace structure is available
                          `"${new Date().toISOString()}","export","completed","0","Session exported"`
                        ].join('\n');
                        const blob = new Blob([csvContent], { type: 'text/csv' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${currentSession.name}.csv`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }
                      setShowExportModal(false);
                    }}
                    className="p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="font-medium text-sm">CSV</div>
                    <div className="text-xs text-gray-500">Spreadsheet format</div>
                  </button>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Share Options</h4>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      // Copy session URL to clipboard
                      const url = `${window.location.origin}${window.location.pathname}?session=${currentSession?.id}`;
                      navigator.clipboard.writeText(url);
                      // Show a brief success message
                      alert('Session URL copied to clipboard!');
                      setShowExportModal(false);
                    }}
                    className="w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="font-medium text-sm">Copy Share Link</div>
                    <div className="text-xs text-gray-500">Share session with team members</div>
                  </button>
                  <button
                    onClick={() => {
                      // Generate shareable report
                      const report = `FlowScope Session Report
Session: ${currentSession?.name || 'Unnamed'}
Traces: ${currentSession?.traceCount || 0}
Generated: ${new Date().toLocaleString()}

Session Data:
${JSON.stringify(currentSession, null, 2)}`;
                      
                      const blob = new Blob([report], { type: 'text/plain' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${currentSession?.name || 'session'}-report.txt`;
                      a.click();
                      URL.revokeObjectURL(url);
                      setShowExportModal(false);
                    }}
                    className="w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="font-medium text-sm">Generate Report</div>
                    <div className="text-xs text-gray-500">Detailed session summary</div>
                  </button>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  onClick={() => setShowExportModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Bar - only show when expanded */}
      {!collapsed && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
            <span>
              {currentSession ? `Session: ${currentSession.name}` : 'No session'}
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <div className={`w-2 h-2 rounded-full ${
              status.connected ? 'bg-green-500 animate-pulse' : 
              status.connecting ? 'bg-yellow-500 animate-pulse' : 
              'bg-red-500'
            }`}></div>
            <span className={
              status.connected ? 'text-green-600' : 
              status.connecting ? 'text-yellow-600' : 
              'text-red-600'
            }>
              {status.connected ? 'WebSocket Connected' : 
               status.connecting ? 'Connecting...' : 
               'WebSocket Disconnected'}
            </span>
          </div>
        </div>
      )}

      {/* Connection Tester Modal */}
      {showConnectionTester && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-0 max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Connection Tests</h3>
              <button
                onClick={() => setShowConnectionTester(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ×
              </button>
            </div>
            <div className="p-4">
              <ConnectionTester />
            </div>
          </div>
        </div>
      )}

      {/* Advanced Filters Modal */}
      {showAdvancedFilters && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-0 max-w-3xl w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Advanced Filters</h3>
              <button
                onClick={() => setShowAdvancedFilters(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ×
              </button>
            </div>
            <div className="p-4">
              <AdvancedFilters 
                isOpen={showAdvancedFilters}
                onClose={() => setShowAdvancedFilters(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
