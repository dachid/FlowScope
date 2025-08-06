import React from 'react';
import { useVSCodeIntegration } from '../hooks/useVSCodeIntegration';
import '../styles/VSCodeIntegration.css';

interface VSCodeIntegrationPanelProps {
  className?: string;
  onJumpToCode?: (traceId: string, filePath: string, line?: number, column?: number) => void;
}

export const VSCodeIntegrationPanel: React.FC<VSCodeIntegrationPanelProps> = ({
  className = '',
  onJumpToCode
}) => {
  const {
    status,
    isLoading,
    error,
    checkInstallation,
    installExtension,
    refresh,
    isFullyIntegrated,
    canJumpToCode,
    needsSetup
  } = useVSCodeIntegration();

  const getStatusIcon = () => {
    if (isLoading) return '⏳';
    if (error) return '❌';
    if (isFullyIntegrated) return '✅';
    if (canJumpToCode) return '⚠️';
    return '❌';
  };

  const getStatusText = () => {
    if (isLoading) return 'Checking VS Code integration...';
    if (error) return `Error: ${error}`;
    if (isFullyIntegrated) return 'VS Code fully integrated';
    if (canJumpToCode) return 'VS Code ready (companion mode offline)';
    if (status?.vscodeInstalled && !status?.extensionInstalled) {
      return 'VS Code found, extension needed';
    }
    if (!status?.vscodeInstalled) return 'VS Code not found';
    return 'VS Code integration not available';
  };

  const getConnectionStatus = () => {
    if (!status) return 'unknown';
    return status.connectionStatus || 'disconnected';
  };

  const handleInstallExtension = async () => {
    const success = await installExtension();
    if (success) {
      // Show success message or notification
      console.log('VS Code extension installed successfully');
    }
  };

  return (
    <div className={`vscode-integration-panel ${className}`}>
      <div className="vscode-status-header">
        <h3>
          <span className="vscode-icon">⚡</span>
          VS Code Integration
        </h3>
        <button 
          className="refresh-btn"
          onClick={refresh}
          disabled={isLoading}
          title="Refresh integration status"
        >
          🔄
        </button>
      </div>

      <div className="vscode-status-content">
        <div className={`status-indicator ${getConnectionStatus()}`}>
          <span className="status-icon">{getStatusIcon()}</span>
          <span className="status-text">{getStatusText()}</span>
        </div>

        {status && (
          <div className="status-details">
            <div className="status-item">
              <span className="label">VS Code:</span>
              <span className={`value ${status.vscodeInstalled ? 'success' : 'error'}`}>
                {status.vscodeInstalled ? '✅ Installed' : '❌ Not Found'}
              </span>
            </div>
            
            <div className="status-item">
              <span className="label">Extension:</span>
              <span className={`value ${status.extensionInstalled ? 'success' : 'error'}`}>
                {status.extensionInstalled ? '✅ Installed' : '❌ Missing'}
              </span>
            </div>
            
            <div className="status-item">
              <span className="label">Companion:</span>
              <span className={`value ${status.companionRunning ? 'success' : 'warning'}`}>
                {status.companionRunning ? '✅ Running' : '⚠️ Offline'}
              </span>
            </div>
            
            <div className="status-item">
              <span className="label">Workspace:</span>
              <span className={`value ${status.workspaceConnected ? 'success' : 'warning'}`}>
                {status.workspaceConnected ? '✅ Connected' : '⚠️ Disconnected'}
              </span>
            </div>
            
            {status.lastSync && (
              <div className="status-item">
                <span className="label">Last Sync:</span>
                <span className="value">{new Date(status.lastSync).toLocaleTimeString()}</span>
              </div>
            )}
          </div>
        )}

        {needsSetup && (
          <div className="setup-actions">
            {!status?.vscodeInstalled && (
              <div className="setup-step">
                <p>VS Code is not installed or not found.</p>
                <button onClick={checkInstallation} disabled={isLoading}>
                  Check Again
                </button>
              </div>
            )}
            
            {status?.vscodeInstalled && !status?.extensionInstalled && (
              <div className="setup-step">
                <p>The FlowScope VS Code extension is currently in development.</p>
                <p>You can use FlowScope Desktop independently with full functionality!</p>
                <button 
                  onClick={() => window.open('https://github.com/flowscope/flowscope-desktop#vs-code-integration')}
                  className="action-btn secondary"
                >
                  📖 Learn More
                </button>
                <button 
                  onClick={handleInstallExtension} 
                  disabled={isLoading}
                  className="install-btn primary"
                >
                  🔄 Check Again
                </button>
              </div>
            )}
          </div>
        )}

        {isFullyIntegrated && (
          <div className="integration-actions">
            <button 
              className="action-btn secondary"
              onClick={() => window.open('vscode://file')}
              title="Open VS Code"
            >
              🔗 Open VS Code
            </button>
            
            <button 
              className="action-btn secondary"
              onClick={refresh}
              title="Refresh connection"
            >
              ♻️ Refresh
            </button>
          </div>
        )}

        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            <span className="error-text">{error}</span>
            <button onClick={refresh} className="retry-btn">
              Retry
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Compact status indicator for toolbar/header
export const VSCodeStatusIndicator: React.FC<{
  onClick?: () => void;
  className?: string;
}> = ({ onClick, className = '' }) => {
  const { status, isFullyIntegrated, canJumpToCode } = useVSCodeIntegration();

  const getIndicatorClass = () => {
    if (isFullyIntegrated) return 'integrated';
    if (canJumpToCode) return 'partial';
    return 'disconnected';
  };

  const getIndicatorIcon = () => {
    if (isFullyIntegrated) return '⚡';
    if (canJumpToCode) return '⚠️';
    return '❌';
  };

  const getTooltip = () => {
    if (isFullyIntegrated) return 'VS Code fully integrated - click for details';
    if (canJumpToCode) return 'VS Code ready, companion mode offline - click for details';
    return 'VS Code integration not available - click for setup';
  };

  return (
    <button
      className={`vscode-status-indicator ${getIndicatorClass()} ${className}`}
      onClick={onClick}
      title={getTooltip()}
    >
      <span className="indicator-icon">{getIndicatorIcon()}</span>
      <span className="indicator-text">VS Code</span>
    </button>
  );
};
