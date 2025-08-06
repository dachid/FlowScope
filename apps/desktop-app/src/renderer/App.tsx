import React, { useEffect } from 'react';
import Layout from './components/Layout.tsx';
import SessionList from './components/SessionList.tsx';
import TraceViewer from './components/TraceViewer.tsx';
import Welcome from './components/Welcome.tsx';
import TraceList from './components/TraceListEnhanced';
import { useAppStore, useSelectedSession } from './hooks/useAppStore';
import { useSessions, useSelection, useRealtimeStatus } from './hooks';

const App: React.FC = () => {
  const initialize = useAppStore((state) => state.initialize);
  const isLoading = useAppStore((state) => state.isLoading);
  const error = useAppStore((state) => state.error);
  const appVersion = useAppStore((state) => state.apiPort ? '1.0.0' : 'Unknown');

  const { sessions } = useSessions();
  const { selected, actions: selectionActions } = useSelection();
  const { isFullyConnected, isApiConnected, isWebSocketConnected } = useRealtimeStatus();

  useEffect(() => {
    initialize();
  }, [initialize]);

  const handleNewSession = async () => {
    try {
      const sessionData = {
        name: `Session ${new Date().toLocaleString()}`,
        start_time: Date.now(),
        status: 'active' as const,
      };
      
      // Use the store's createSession method which calls the API
      const newSession = await useAppStore.getState().createSession(sessionData);
      selectionActions.selectSession(newSession);
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  };

  // Loading state
  if (isLoading && sessions.length === 0) {
    return (
      <div className="app">
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          fontSize: '18px'
        }}>
          <div style={{
            border: '3px solid #333',
            borderTop: '3px solid #007acc',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            animation: 'spin 1s linear infinite',
            marginRight: '15px'
          }}></div>
          Initializing FlowScope...
        </div>
      </div>
    );
  }

  // Error state
  if (error && !isApiConnected) {
    return (
      <div className="app">
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          fontSize: '18px',
          color: '#e74c3c'
        }}>
          <h2>Connection Error</h2>
          <p>{error}</p>
          <button 
            onClick={initialize}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              backgroundColor: '#007acc',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <Layout
      appVersion={appVersion}
      connectionStatus={{
        api: isApiConnected,
        websocket: isWebSocketConnected,
        fullyConnected: isFullyConnected,
      }}
      sidebar={
        <SessionList
          sessions={sessions}
          selectedSession={selected.session || null}
          onSessionSelect={selectionActions.selectSession}
          onNewSession={handleNewSession}
        />
      }
      mainContent={
        selected.session ? (
          <div className="main-content-container">
            <TraceList sessionId={selected.session.id} />
            {selected.trace && (
              <TraceViewer
                session={selected.session}
                selectedTrace={{
                  ...selected.trace,
                  name: selected.trace.operation || 'Unknown',
                  created_at: selected.trace.start_time
                }}
                onTraceSelect={(trace: any) => selectionActions.selectTrace(trace)}
              />
            )}
          </div>
        ) : (
          <Welcome onNewSession={handleNewSession} />
        )
      }
    />
  );
};

export default App;
