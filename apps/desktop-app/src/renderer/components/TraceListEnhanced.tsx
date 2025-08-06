import React, { useState, useMemo } from 'react';
import { Trace, TraceTreeNode, TimelineItem } from '../../shared/types';
import { useSessionTraces, useSelection, useViewState } from '../hooks';
import InteractiveTimeline from './InteractiveTimeline';
import TraceFlowDiagram from './TraceFlowDiagram';
import PerformanceCharts from './PerformanceCharts';
import TraceDetailPanel from './TraceDetailPanel';
import '../styles/visualization.css';

interface TraceListProps {
  sessionId?: string;
  className?: string;
}

type ViewMode = 'timeline' | 'tree' | 'table' | 'flow' | 'charts';

const TraceList: React.FC<TraceListProps> = ({ sessionId, className = '' }) => {
  const { traces, isLoading, error } = useSessionTraces(sessionId);
  const { selected, actions: selectionActions } = useSelection();
  const { viewState, actions: viewActions } = useViewState();
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [showDetailPanel, setShowDetailPanel] = useState(false);
  const [selectedTraceForDetail, setSelectedTraceForDetail] = useState<Trace | null>(null);
  const [currentViewMode, setCurrentViewMode] = useState<ViewMode>('timeline');

  const handleTraceSelect = (trace: Trace) => {
    selectionActions.selectTrace(trace);
    setSelectedTraceForDetail(trace);
  };

  const handleTraceDoubleClick = (trace: Trace) => {
    setSelectedTraceForDetail(trace);
    setShowDetailPanel(true);
  };

  const toggleNodeExpansion = (nodeId: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  // Build trace tree for hierarchical view
  const traceTree = useMemo(() => {
    if (currentViewMode !== 'tree') return [];

    const traceMap = new Map(traces.map(trace => [trace.id, trace]));
    const rootNodes: TraceTreeNode[] = [];
    const processedNodes = new Set<string>();

    const buildNode = (trace: Trace, depth = 0): TraceTreeNode => {
      const children: TraceTreeNode[] = [];
      
      // Find child traces
      traces
        .filter(t => t.parent_id === trace.id && !processedNodes.has(t.id))
        .forEach(childTrace => {
          processedNodes.add(childTrace.id);
          children.push(buildNode(childTrace, depth + 1));
        });

      return {
        trace,
        children,
        depth,
        isExpanded: expandedNodes.has(trace.id),
      };
    };

    // Find root traces (no parent)
    traces
      .filter(trace => !trace.parent_id && !processedNodes.has(trace.id))
      .forEach(rootTrace => {
        processedNodes.add(rootTrace.id);
        rootNodes.push(buildNode(rootTrace));
      });

    return rootNodes;
  }, [traces, currentViewMode, expandedNodes]);

  // Build timeline items for timeline view
  const timelineItems = useMemo(() => {
    if (currentViewMode !== 'timeline' || traces.length === 0) return [];

    const sortedTraces = [...traces].sort((a, b) => a.start_time - b.start_time);
    const startTime = sortedTraces[0].start_time;
    const endTime = Math.max(...sortedTraces.map(t => t.end_time || t.start_time));
    const totalDuration = endTime - startTime || 1;

    return sortedTraces.map((trace, index): TimelineItem => {
      const startOffset = ((trace.start_time - startTime) / totalDuration) * 100;
      const duration = trace.duration || 100; // Default 100ms if no duration
      const width = Math.max((duration / totalDuration) * 100, 2); // Minimum 2% width

      return {
        trace,
        startOffset,
        width,
        color: getTraceColor(trace.operation, trace.status),
        position: index % 3 === 0 ? 'top' : index % 3 === 1 ? 'middle' : 'bottom',
      };
    });
  }, [traces, currentViewMode]);

  const renderTraceRow = (trace: Trace, depth = 0) => {
    const isSelected = selected.trace?.id === trace.id;
    const hasError = trace.status === 'error';
    const isPending = trace.status === 'pending';

    return (
      <div
        key={trace.id}
        className={`trace-row ${isSelected ? 'selected' : ''} ${hasError ? 'error' : ''} ${isPending ? 'pending' : ''}`}
        style={{ paddingLeft: `${depth * 20}px` }}
        onClick={() => handleTraceSelect(trace)}
        onDoubleClick={() => handleTraceDoubleClick(trace)}
      >
        <div className="trace-info">
          <div className="trace-operation">
            <span className="operation-badge" data-operation={trace.operation}>
              {trace.operation}
            </span>
            <span className="trace-id">{trace.id.slice(0, 8)}</span>
          </div>
          <div className="trace-metadata">
            <span className="language">{trace.language}</span>
            <span className="framework">{trace.framework}</span>
            {trace.duration && (
              <span className="duration">{formatDuration(trace.duration)}</span>
            )}
            <span className="timestamp">{formatTimestamp(trace.start_time)}</span>
          </div>
        </div>
        <div className="trace-status">
          <div className={`status-indicator ${trace.status}`} />
          {hasError && <span className="error-icon">⚠️</span>}
        </div>
      </div>
    );
  };

  const renderTreeNode = (node: TraceTreeNode) => {
    const hasChildren = node.children.length > 0;
    
    return (
      <div key={node.trace.id} className="tree-node">
        <div className="tree-row">
          {hasChildren && (
            <button
              className={`expand-button ${node.isExpanded ? 'expanded' : ''}`}
              onClick={() => toggleNodeExpansion(node.trace.id)}
            >
              {node.isExpanded ? '▼' : '▶'}
            </button>
          )}
          {renderTraceRow(node.trace, node.depth)}
        </div>
        {node.isExpanded && node.children.length > 0 && (
          <div className="tree-children">
            {node.children.map(renderTreeNode)}
          </div>
        )}
      </div>
    );
  };

  const renderLegacyTimeline = () => (
    <div className="timeline-container">
      <div className="timeline-header">
        <div className="timeline-controls">
          <button onClick={() => setExpandedNodes(new Set())}>
            Collapse All
          </button>
          <button onClick={() => setExpandedNodes(new Set(traces.map(t => t.id)))}>
            Expand All
          </button>
        </div>
      </div>
      <div className="timeline-tracks">
        {['top', 'middle', 'bottom'].map(position => (
          <div key={position} className={`timeline-track ${position}`}>
            {timelineItems
              .filter(item => item.position === position)
              .map(item => (
                <div
                  key={item.trace.id}
                  className={`timeline-item ${selected.trace?.id === item.trace.id ? 'selected' : ''}`}
                  style={{
                    left: `${item.startOffset}%`,
                    width: `${item.width}%`,
                    backgroundColor: item.color,
                  }}
                  onClick={() => handleTraceSelect(item.trace)}
                  onDoubleClick={() => handleTraceDoubleClick(item.trace)}
                  title={`${item.trace.operation} - ${formatDuration(item.trace.duration || 0)}`}
                >
                  <span className="timeline-label">{item.trace.operation}</span>
                </div>
              ))}
          </div>
        ))}
      </div>
    </div>
  );

  const renderTable = () => (
    <div className="trace-table">
      <div className="table-header">
        <div className="header-cell">Operation</div>
        <div className="header-cell">Language</div>
        <div className="header-cell">Framework</div>
        <div className="header-cell">Duration</div>
        <div className="header-cell">Status</div>
        <div className="header-cell">Time</div>
      </div>
      <div className="table-body">
        {traces.map(trace => (
          <div
            key={trace.id}
            className={`table-row ${selected.trace?.id === trace.id ? 'selected' : ''}`}
            onClick={() => handleTraceSelect(trace)}
            onDoubleClick={() => handleTraceDoubleClick(trace)}
          >
            <div className="table-cell">{trace.operation}</div>
            <div className="table-cell">{trace.language}</div>
            <div className="table-cell">{trace.framework}</div>
            <div className="table-cell">{formatDuration(trace.duration || 0)}</div>
            <div className="table-cell">
              <span className={`status-badge ${trace.status}`}>
                {trace.status}
              </span>
            </div>
            <div className="table-cell">{formatTimestamp(trace.start_time)}</div>
          </div>
        ))}
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className={`trace-list loading ${className}`}>
        <div className="loading-indicator">Loading traces...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`trace-list error ${className}`}>
        <div className="error-message">Error: {error}</div>
      </div>
    );
  }

  if (traces.length === 0) {
    return (
      <div className={`trace-list empty ${className}`}>
        <div className="empty-message">
          <h3>No traces found</h3>
          <p>Start debugging to see traces appear here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`trace-list ${className}`}>
      <div className="trace-list-header">
        <div className="view-mode-selector">
          <button
            className={currentViewMode === 'timeline' ? 'active' : ''}
            onClick={() => setCurrentViewMode('timeline')}
          >
            🕒 Enhanced Timeline
          </button>
          <button
            className={currentViewMode === 'flow' ? 'active' : ''}
            onClick={() => setCurrentViewMode('flow')}
          >
            🔗 Flow Diagram
          </button>
          <button
            className={currentViewMode === 'charts' ? 'active' : ''}
            onClick={() => setCurrentViewMode('charts')}
          >
            📊 Performance Charts
          </button>
          <button
            className={currentViewMode === 'tree' ? 'active' : ''}
            onClick={() => setCurrentViewMode('tree')}
          >
            🌳 Tree
          </button>
          <button
            className={currentViewMode === 'table' ? 'active' : ''}
            onClick={() => setCurrentViewMode('table')}
          >
            📋 Table
          </button>
        </div>
        <div className="trace-count">
          {traces.length} trace{traces.length !== 1 ? 's' : ''}
        </div>
      </div>

      <div className="trace-list-content">
        {currentViewMode === 'timeline' && (
          <InteractiveTimeline
            traces={traces}
            selectedTrace={selectedTraceForDetail || undefined}
            onTraceSelect={handleTraceSelect}
            height={300}
          />
        )}
        
        {currentViewMode === 'flow' && (
          <TraceFlowDiagram
            traces={traces}
            selectedTrace={selectedTraceForDetail || undefined}
            onTraceSelect={handleTraceSelect}
            width={800}
            height={500}
          />
        )}
        
        {currentViewMode === 'charts' && (
          <PerformanceCharts traces={traces} />
        )}
        
        {currentViewMode === 'tree' && (
          <div className="tree-view">
            {traceTree.map(renderTreeNode)}
          </div>
        )}
        
        {currentViewMode === 'table' && renderTable()}
      </div>

      {/* Detail Panel */}
      {showDetailPanel && selectedTraceForDetail && (
        <div className="detail-panel-overlay">
          <TraceDetailPanel
            trace={selectedTraceForDetail}
            onClose={() => setShowDetailPanel(false)}
          />
        </div>
      )}
    </div>
  );
};

// Helper functions
function getTraceColor(operation: string, status: string): string {
  if (status === 'error') return '#e74c3c';
  if (status === 'pending') return '#f39c12';
  
  const colors: Record<string, string> = {
    'llm': '#3498db',
    'database': '#2ecc71',
    'vector': '#9b59b6',
    'api': '#e67e22',
    'file': '#95a5a6',
    'network': '#1abc9c',
  };
  
  const key = operation.toLowerCase();
  return colors[key] || '#34495e';
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString();
}

export default TraceList;
