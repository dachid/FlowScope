import React, { ReactNode } from 'react';

interface ConnectionStatus {
  api: boolean;
  websocket: boolean;
  fullyConnected: boolean;
}

interface LayoutProps {
  appVersion: string;
  sidebar: ReactNode;
  mainContent: ReactNode;
  connectionStatus?: ConnectionStatus;
}

export const Layout: React.FC<LayoutProps> = ({ 
  appVersion, 
  sidebar, 
  mainContent, 
  connectionStatus 
}) => {
  return (
    <div className="app">
      <header className="app-header">
        <div className="app-title">FlowScope Desktop</div>
        <div className="header-controls">
          {connectionStatus && (
            <div className="connection-status">
              <div 
                className={`connection-indicator ${connectionStatus.fullyConnected ? 'connected' : 'disconnected'}`}
                title={`API: ${connectionStatus.api ? 'Connected' : 'Disconnected'}, WebSocket: ${connectionStatus.websocket ? 'Connected' : 'Disconnected'}`}
              >
                <span className="status-dot"></span>
                {connectionStatus.fullyConnected ? 'Connected' : 'Disconnected'}
              </div>
            </div>
          )}
          <div className="app-version">v{appVersion}</div>
        </div>
      </header>
      <div className="app-content">
        <aside className="sidebar">
          {sidebar}
        </aside>
        <main className="main-content">
          {mainContent}
        </main>
      </div>
    </div>
  );
};

export default Layout;
