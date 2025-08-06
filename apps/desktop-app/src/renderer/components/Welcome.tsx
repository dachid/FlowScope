import React, { useState, useEffect } from 'react';

interface WelcomeProps {
  onNewSession: () => void;
}

export const Welcome: React.FC<WelcomeProps> = ({ onNewSession }) => {
  const [vsCodeStatus, setVSCodeStatus] = useState<'checking' | 'installed' | 'not-installed'>('checking');

  useEffect(() => {
    checkVSCode();
  }, []);

  const checkVSCode = async () => {
    try {
      if (window.electronAPI) {
        const isInstalled = await window.electronAPI.vscode.checkInstallation();
        setVSCodeStatus(isInstalled ? 'installed' : 'not-installed');
      }
    } catch (error) {
      console.error('Failed to check VS Code installation:', error);
      setVSCodeStatus('not-installed');
    }
  };

  const handleInstallExtension = async () => {
    try {
      if (window.electronAPI) {
        const success = await window.electronAPI.vscode.installExtension();
        if (success) {
          alert('FlowScope extension installed successfully!');
        } else {
          alert('Failed to install extension. Please install manually.');
        }
      }
    } catch (error) {
      console.error('Failed to install extension:', error);
      alert('Failed to install extension. Please install manually.');
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100%',
      padding: '40px'
    }}>
      <div style={{ 
        maxWidth: '600px', 
        textAlign: 'center' 
      }}>
        {/* Logo/Header */}
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{ 
            fontSize: '32px', 
            margin: '0 0 16px 0',
            background: 'linear-gradient(135deg, #007acc 0%, #4fc3f7 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: '700'
          }}>
            FlowScope Desktop
          </h1>
          <p style={{ 
            fontSize: '16px', 
            color: '#cccccc',
            margin: 0
          }}>
            Visualize and analyze your AI conversation flows
          </p>
        </div>

        {/* VS Code Integration Status */}
        <div style={{ 
          marginBottom: '40px',
          padding: '20px',
          backgroundColor: '#252526',
          border: '1px solid #3e3e42',
          borderRadius: '8px'
        }}>
          <h3 style={{ 
            fontSize: '18px', 
            margin: '0 0 16px 0',
            color: '#ffffff'
          }}>
            VS Code Integration
          </h3>
          
          {vsCodeStatus === 'checking' && (
            <div style={{ color: '#969696' }}>
              Checking VS Code installation...
            </div>
          )}
          
          {vsCodeStatus === 'installed' && (
            <div>
              <div style={{ 
                color: '#4caf50', 
                marginBottom: '12px',
                fontSize: '14px'
              }}>
                ✅ VS Code detected
              </div>
              <button
                className="btn btn-primary"
                onClick={handleInstallExtension}
                style={{ fontSize: '14px' }}
              >
                Install FlowScope Extension
              </button>
            </div>
          )}
          
          {vsCodeStatus === 'not-installed' && (
            <div>
              <div style={{ 
                color: '#ff9800', 
                marginBottom: '12px',
                fontSize: '14px'
              }}>
                ⚠️ VS Code not found
              </div>
              <p style={{ 
                fontSize: '14px', 
                color: '#cccccc',
                margin: '0 0 12px 0'
              }}>
                Please install VS Code to use FlowScope's full capabilities.
              </p>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  // This would open VS Code download page
                  console.log('Open VS Code download page');
                }}
                style={{ fontSize: '14px' }}
              >
                Download VS Code
              </button>
            </div>
          )}
        </div>

        {/* Getting Started */}
        <div style={{ 
          marginBottom: '40px',
          padding: '20px',
          backgroundColor: '#252526',
          border: '1px solid #3e3e42',
          borderRadius: '8px',
          textAlign: 'left'
        }}>
          <h3 style={{ 
            fontSize: '18px', 
            margin: '0 0 16px 0',
            color: '#ffffff',
            textAlign: 'center'
          }}>
            Getting Started
          </h3>
          
          <ol style={{ 
            fontSize: '14px', 
            color: '#cccccc',
            paddingLeft: '20px',
            margin: 0
          }}>
            <li style={{ marginBottom: '8px' }}>
              Create a new session to organize your AI conversations
            </li>
            <li style={{ marginBottom: '8px' }}>
              Install the FlowScope VS Code extension
            </li>
            <li style={{ marginBottom: '8px' }}>
              Start coding and interacting with AI in VS Code
            </li>
            <li style={{ marginBottom: '8px' }}>
              View and analyze your conversation flows here in the desktop app
            </li>
          </ol>
        </div>

        {/* Action Button */}
        <button
          className="btn btn-primary"
          onClick={onNewSession}
          style={{ 
            fontSize: '16px',
            padding: '12px 24px',
            fontWeight: '600'
          }}
        >
          Create Your First Session
        </button>

        {/* Additional Info */}
        <div style={{ 
          marginTop: '40px',
          fontSize: '12px',
          color: '#7c7c7c'
        }}>
          <p style={{ margin: '0 0 8px 0' }}>
            FlowScope helps you understand and optimize your AI-assisted development workflow
          </p>
          <p style={{ margin: 0 }}>
            Trace conversations, bookmark important interactions, and visualize your coding patterns
          </p>
        </div>
      </div>
    </div>
  );
};

export default Welcome;
