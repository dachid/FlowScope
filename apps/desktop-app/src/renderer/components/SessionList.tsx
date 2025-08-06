import React from 'react';
import { Session } from '../../shared/types';

interface SessionListProps {
  sessions: Session[];
  selectedSession: Session | null | undefined;
  onSessionSelect: (session: Session) => void;
  onNewSession: () => void;
}

export const SessionList: React.FC<SessionListProps> = ({
  sessions,
  selectedSession,
  onSessionSelect,
  onNewSession,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ 
        padding: '15px',
        borderBottom: '1px solid #3e3e42',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>Sessions</h3>
        <button
          className="btn btn-primary"
          onClick={onNewSession}
          style={{ fontSize: '12px', padding: '6px 12px' }}
        >
          New Session
        </button>
      </div>
      
      <div style={{ flex: 1, overflow: 'auto', padding: '10px' }}>
        {sessions.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            color: '#969696', 
            fontSize: '14px',
            marginTop: '20px'
          }}>
            No sessions yet.
            <br />
            Create your first session to get started.
          </div>
        ) : (
          sessions.map((session) => (
            <div
              key={session.id}
              onClick={() => onSessionSelect(session)}
              style={{
                padding: '12px',
                marginBottom: '8px',
                backgroundColor: selectedSession?.id === session.id 
                  ? '#094771' 
                  : '#2d2d30',
                border: '1px solid #3e3e42',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                if (selectedSession?.id !== session.id) {
                  e.currentTarget.style.backgroundColor = '#3c3c3c';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedSession?.id !== session.id) {
                  e.currentTarget.style.backgroundColor = '#2d2d30';
                }
              }}
            >
              <div style={{ 
                fontSize: '14px', 
                fontWeight: '500', 
                marginBottom: '4px',
                color: selectedSession?.id === session.id 
                  ? '#ffffff' 
                  : '#cccccc'
              }}>
                {session.name}
              </div>
              {session.description && (
                <div style={{ 
                  fontSize: '12px', 
                  color: '#969696',
                  marginBottom: '4px'
                }}>
                  {session.description}
                </div>
              )}
              <div style={{ fontSize: '11px', color: '#7c7c7c' }}>
                {new Date(session.created_at).toLocaleDateString()}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SessionList;
