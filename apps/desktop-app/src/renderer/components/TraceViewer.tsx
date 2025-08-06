import React, { useState, useEffect } from 'react';
import { Session, Trace } from '../../shared/types';

// For compatibility, create a display trace interface
interface DisplayTrace {
  id: string;
  session_id: string;
  name: string;
  created_at: number;
  metadata?: any;
}

interface TraceViewerProps {
  session: Session;
  selectedTrace: Trace | DisplayTrace | null | undefined;
  onTraceSelect: (trace: Trace | DisplayTrace) => void;
}

export const TraceViewer: React.FC<TraceViewerProps> = ({
  session,
  selectedTrace,
  onTraceSelect,
}) => {
  const [traces, setTraces] = useState<Trace[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTraces();
  }, [session.id]);

  const loadTraces = async () => {
    try {
      setIsLoading(true);
      if (window.electronAPI) {
        const traceList = await window.electronAPI.database.getTracesBySession(session.id);
        setTraces(traceList);
      }
    } catch (error) {
      console.error('Failed to load traces:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100%',
        fontSize: '14px',
        color: '#969696'
      }}>
        Loading traces...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Session Header */}
      <div style={{ 
        padding: '20px',
        borderBottom: '1px solid #3e3e42',
        backgroundColor: '#252526'
      }}>
        <h2 style={{ 
          margin: '0 0 8px 0', 
          fontSize: '18px', 
          color: '#ffffff' 
        }}>
          {session.name}
        </h2>
        {session.description && (
          <p style={{ 
            margin: '0 0 8px 0', 
            fontSize: '14px', 
            color: '#cccccc' 
          }}>
            {session.description}
          </p>
        )}
        <div style={{ 
          fontSize: '12px', 
          color: '#969696' 
        }}>
          Created: {new Date(session.created_at).toLocaleString()}
        </div>
      </div>

      {/* Traces Content */}
      <div style={{ flex: 1, display: 'flex' }}>
        {/* Trace List */}
        <div style={{ 
          width: '300px', 
          borderRight: '1px solid #3e3e42',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ 
            padding: '15px',
            borderBottom: '1px solid #3e3e42',
            backgroundColor: '#2d2d30'
          }}>
            <h3 style={{ 
              margin: 0, 
              fontSize: '14px', 
              fontWeight: '600' 
            }}>
              Traces ({traces.length})
            </h3>
          </div>
          
          <div style={{ flex: 1, overflow: 'auto', padding: '10px' }}>
            {traces.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                color: '#969696', 
                fontSize: '14px',
                marginTop: '20px'
              }}>
                No traces in this session yet.
                <br />
                Start using VS Code with the FlowScope extension to create traces.
              </div>
            ) : (
              traces.map((trace) => (
                <div
                  key={trace.id}
                  onClick={() => onTraceSelect(trace)}
                  style={{
                    padding: '12px',
                    marginBottom: '8px',
                    backgroundColor: selectedTrace?.id === trace.id 
                      ? '#094771' 
                      : '#2d2d30',
                    border: '1px solid #3e3e42',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (selectedTrace?.id !== trace.id) {
                      e.currentTarget.style.backgroundColor = '#3c3c3c';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedTrace?.id !== trace.id) {
                      e.currentTarget.style.backgroundColor = '#2d2d30';
                    }
                  }}
                >
                  <div style={{ 
                    fontSize: '14px', 
                    fontWeight: '500', 
                    marginBottom: '4px',
                    color: selectedTrace?.id === trace.id 
                      ? '#ffffff' 
                      : '#cccccc'
                  }}>
                    {trace.name}
                  </div>
                  <div style={{ fontSize: '11px', color: '#7c7c7c' }}>
                    {new Date(trace.created_at).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Trace Details */}
        <div style={{ flex: 1, padding: '20px' }}>
          {selectedTrace ? (
            <div>
              <h3 style={{ 
                margin: '0 0 16px 0', 
                fontSize: '16px', 
                color: '#ffffff' 
              }}>
                {selectedTrace.name}
              </h3>
              <div style={{ 
                fontSize: '12px', 
                color: '#969696',
                marginBottom: '20px'
              }}>
                Created: {new Date(selectedTrace.created_at).toLocaleString()}
              </div>
              
              {/* Placeholder for trace visualization */}
              <div style={{
                padding: '20px',
                backgroundColor: '#252526',
                border: '1px solid #3e3e42',
                borderRadius: '6px',
                textAlign: 'center',
                color: '#969696'
              }}>
                <div style={{ fontSize: '16px', marginBottom: '10px' }}>
                  🔍 Trace Visualization
                </div>
                <div style={{ fontSize: '14px' }}>
                  Detailed trace analysis and visualization will be implemented here.
                  <br />
                  This will include prompt flows, responses, and interactive exploration tools.
                </div>
              </div>
            </div>
          ) : (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              height: '100%',
              textAlign: 'center',
              color: '#969696',
              fontSize: '14px'
            }}>
              <div>
                <div style={{ fontSize: '24px', marginBottom: '10px' }}>📊</div>
                Select a trace to view its details and analysis.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TraceViewer;
