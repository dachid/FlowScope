import React, { useState, useMemo } from 'react';
import { Trace } from '../../shared/types';

interface TraceDetailPanelProps {
  trace: Trace;
  onClose: () => void;
  className?: string;
}

interface TabData {
  id: string;
  label: string;
  content: React.ReactNode;
}

export const TraceDetailPanel: React.FC<TraceDetailPanelProps> = ({
  trace,
  onClose,
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState('overview');

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatJSON = (data: any) => {
    try {
      const parsed = typeof data === 'string' ? JSON.parse(data) : data;
      return JSON.stringify(parsed, null, 2);
    } catch {
      return String(data);
    }
  };

  const getOperationIcon = (operation: string): string => {
    const icons: Record<string, string> = {
      'llm': '🤖',
      'database': '🗄️',
      'vector': '📊',
      'api': '🌐',
      'file': '📁',
      'network': '🔗',
    };
    
    const key = operation.toLowerCase();
    return icons[key] || '⚙️';
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed': return '#2ecc71';
      case 'error': return '#e74c3c';
      case 'pending': return '#f39c12';
      default: return '#95a5a6';
    }
  };

  // Parse trace data
  const traceData = useMemo(() => {
    try {
      return typeof trace.data === 'string' ? JSON.parse(trace.data) : trace.data;
    } catch {
      return { raw: trace.data };
    }
  }, [trace.data]);

  // Parse metadata
  const metadata = useMemo(() => {
    try {
      return trace.metadata ? JSON.parse(trace.metadata) : {};
    } catch {
      return {};
    }
  }, [trace.metadata]);

  const tabs: TabData[] = [
    {
      id: 'overview',
      label: 'Overview',
      content: (
        <div className="overview-tab">
          <div className="trace-header">
            <div className="trace-title">
              <span className="operation-icon">{getOperationIcon(trace.operation)}</span>
              <h3>{trace.operation}</h3>
              <span 
                className="status-badge"
                style={{ backgroundColor: getStatusColor(trace.status) }}
              >
                {trace.status}
              </span>
            </div>
          </div>

          <div className="metrics-grid">
            <div className="metric-item">
              <label>Duration</label>
              <span>{formatDuration(trace.duration || 0)}</span>
            </div>
            <div className="metric-item">
              <label>Start Time</label>
              <span>{formatTimestamp(trace.start_time)}</span>
            </div>
            <div className="metric-item">
              <label>End Time</label>
              <span>{trace.end_time ? formatTimestamp(trace.end_time) : 'N/A'}</span>
            </div>
            <div className="metric-item">
              <label>Language</label>
              <span>{trace.language}</span>
            </div>
            <div className="metric-item">
              <label>Framework</label>
              <span>{trace.framework}</span>
            </div>
            <div className="metric-item">
              <label>Session</label>
              <span>{trace.session_id}</span>
            </div>
          </div>

          {trace.error && (
            <div className="error-section">
              <h4>Error Details</h4>
              <pre className="error-content">{trace.error}</pre>
            </div>
          )}
        </div>
      ),
    },
    {
      id: 'data',
      label: 'Data',
      content: (
        <div className="data-tab">
          <div className="data-section">
            <h4>Input/Output Data</h4>
            <div className="data-viewer">
              <pre>{formatJSON(traceData)}</pre>
            </div>
          </div>
          
          {Object.keys(metadata).length > 0 && (
            <div className="data-section">
              <h4>Metadata</h4>
              <div className="data-viewer">
                <pre>{formatJSON(metadata)}</pre>
              </div>
            </div>
          )}
        </div>
      ),
    },
    {
      id: 'performance',
      label: 'Performance',
      content: (
        <div className="performance-tab">
          <div className="performance-metrics">
            <div className="metric-card">
              <h4>Execution Time</h4>
              <div className="metric-value">{formatDuration(trace.duration || 0)}</div>
              <div className="metric-breakdown">
                <div className="breakdown-item">
                  <span>Start</span>
                  <span>{formatTimestamp(trace.start_time)}</span>
                </div>
                <div className="breakdown-item">
                  <span>End</span>
                  <span>{trace.end_time ? formatTimestamp(trace.end_time) : 'N/A'}</span>
                </div>
              </div>
            </div>

            {traceData.tokens && (
              <div className="metric-card">
                <h4>Token Usage</h4>
                <div className="metric-value">{traceData.tokens.total || 'N/A'}</div>
                <div className="metric-breakdown">
                  <div className="breakdown-item">
                    <span>Input</span>
                    <span>{traceData.tokens.input || 'N/A'}</span>
                  </div>
                  <div className="breakdown-item">
                    <span>Output</span>
                    <span>{traceData.tokens.output || 'N/A'}</span>
                  </div>
                </div>
              </div>
            )}

            {traceData.cost && (
              <div className="metric-card">
                <h4>Cost</h4>
                <div className="metric-value">${traceData.cost.toFixed(4)}</div>
              </div>
            )}
          </div>

          {/* Performance visualization */}
          <div className="performance-chart">
            <h4>Timeline</h4>
            <div className="timeline-bar">
              <div 
                className="timeline-fill"
                style={{ 
                  width: '100%',
                  backgroundColor: getStatusColor(trace.status),
                }}
              >
                <span>{formatDuration(trace.duration || 0)}</span>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'relationships',
      label: 'Relationships',
      content: (
        <div className="relationships-tab">
          <div className="relationship-info">
            <div className="relationship-item">
              <label>Parent Trace</label>
              <span>{trace.parent_id || 'Root trace'}</span>
            </div>
            <div className="relationship-item">
              <label>Session</label>
              <span>{trace.session_id}</span>
            </div>
            <div className="relationship-item">
              <label>Trace ID</label>
              <span className="trace-id">{trace.id}</span>
            </div>
          </div>

          {/* TODO: Add child traces when available */}
          <div className="children-section">
            <h4>Child Traces</h4>
            <div className="placeholder">
              Child trace relationships will be displayed here
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className={`trace-detail-panel ${className}`}>
      {/* Header */}
      <div className="panel-header">
        <div className="panel-title">
          <span className="operation-icon">{getOperationIcon(trace.operation)}</span>
          <span>Trace Details</span>
        </div>
        <button className="close-button" onClick={onClose}>
          ✕
        </button>
      </div>

      {/* Tabs */}
      <div className="panel-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="panel-content">
        {tabs.find(tab => tab.id === activeTab)?.content}
      </div>

      {/* Actions */}
      <div className="panel-actions">
        <button className="action-button">
          📋 Copy Details
        </button>
        <button className="action-button">
          🔖 Bookmark
        </button>
        <button className="action-button">
          📤 Export
        </button>
      </div>
    </div>
  );
};

export default TraceDetailPanel;
