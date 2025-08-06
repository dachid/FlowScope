import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Trace } from '../../shared/types';

interface TraceFlowDiagramProps {
  traces: Trace[];
  selectedTrace?: Trace;
  onTraceSelect: (trace: Trace) => void;
  width?: number;
  height?: number;
  className?: string;
}

interface FlowNode {
  id: string;
  trace: Trace;
  x: number;
  y: number;
  level: number;
  children: FlowNode[];
  parent?: FlowNode;
}

interface FlowEdge {
  from: FlowNode;
  to: FlowNode;
  path: string;
}

export const TraceFlowDiagram: React.FC<TraceFlowDiagramProps> = ({
  traces,
  selectedTrace,
  onTraceSelect,
  width = 800,
  height = 600,
  className = '',
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedNode, setSelectedNode] = useState<FlowNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<FlowNode | null>(null);
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });

  // Build flow graph from traces
  const flowData = useMemo(() => {
    if (traces.length === 0) return { nodes: [], edges: [] };

    // Create nodes map
    const nodesMap = new Map<string, FlowNode>();
    const rootNodes: FlowNode[] = [];

    // First pass: create all nodes
    traces.forEach(trace => {
      const node: FlowNode = {
        id: trace.id,
        trace,
        x: 0,
        y: 0,
        level: 0,
        children: [],
      };
      nodesMap.set(trace.id, node);
    });

    // Second pass: build parent-child relationships
    traces.forEach(trace => {
      const node = nodesMap.get(trace.id)!;
      if (trace.parent_id) {
        const parent = nodesMap.get(trace.parent_id);
        if (parent) {
          parent.children.push(node);
          node.parent = parent;
        } else {
          rootNodes.push(node);
        }
      } else {
        rootNodes.push(node);
      }
    });

    // Calculate layout using hierarchical positioning
    const levelWidth = 150;
    const nodeHeight = 80;
    const nodes: FlowNode[] = [];
    const edges: FlowEdge[] = [];

    const processNode = (node: FlowNode, level: number, parentY: number, siblingIndex: number, totalSiblings: number) => {
      node.level = level;
      node.x = level * levelWidth + 50;
      
      if (totalSiblings === 1) {
        node.y = parentY;
      } else {
        const spacing = Math.max(nodeHeight, height / Math.max(totalSiblings, 4));
        node.y = parentY + (siblingIndex - (totalSiblings - 1) / 2) * spacing;
      }
      
      nodes.push(node);

      // Process children
      node.children.forEach((child, index) => {
        processNode(child, level + 1, node.y, index, node.children.length);
        
        // Create edge
        edges.push({
          from: node,
          to: child,
          path: createEdgePath(node, child),
        });
      });
    };

    // Process all root nodes
    rootNodes.forEach((root, index) => {
      processNode(root, 0, height / 2 + (index - (rootNodes.length - 1) / 2) * 120, 0, 1);
    });

    return { nodes, edges };
  }, [traces, height]);

  // Create SVG path for edges
  const createEdgePath = (from: FlowNode, to: FlowNode): string => {
    const fromX = from.x + 100; // Node width
    const fromY = from.y + 30; // Node height / 2
    const toX = to.x;
    const toY = to.y + 30;
    
    const midX = fromX + (toX - fromX) / 2;
    
    return `M ${fromX} ${fromY} C ${midX} ${fromY}, ${midX} ${toY}, ${toX} ${toY}`;
  };

  // Handle node click
  const handleNodeClick = (node: FlowNode) => {
    setSelectedNode(node);
    onTraceSelect(node.trace);
  };

  // Handle zoom and pan
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.max(0.3, Math.min(prev * zoomFactor, 3)));
  };

  // Get node color based on trace status and operation
  const getNodeColor = (trace: Trace): string => {
    if (trace.status === 'error') return '#e74c3c';
    if (trace.status === 'pending') return '#f39c12';
    
    const colors: Record<string, string> = {
      'llm': '#3498db',
      'database': '#2ecc71',
      'vector': '#9b59b6',
      'api': '#e67e22',
      'file': '#95a5a6',
      'network': '#1abc9c',
    };
    
    const key = trace.operation.toLowerCase();
    return colors[key] || '#34495e';
  };

  // Format duration
  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  return (
    <div className={`trace-flow-diagram ${className}`}>
      {/* Controls */}
      <div className="flow-controls">
        <div className="flow-info">
          <span>Nodes: {flowData.nodes.length}</span>
          <span>Zoom: {(zoom * 100).toFixed(0)}%</span>
          {selectedNode && (
            <span>Selected: {selectedNode.trace.operation}</span>
          )}
        </div>
        <div className="flow-actions">
          <button onClick={() => { setZoom(1); setPanOffset({ x: 0, y: 0 }); }}>
            Reset View
          </button>
          <button onClick={() => setZoom(prev => Math.min(prev * 1.5, 3))}>
            Zoom In
          </button>
          <button onClick={() => setZoom(prev => Math.max(prev / 1.5, 0.3))}>
            Zoom Out
          </button>
        </div>
      </div>

      {/* SVG Flow Diagram */}
      <div className="flow-container" style={{ width, height, overflow: 'hidden' }}>
        <svg
          ref={svgRef}
          width={width}
          height={height}
          onWheel={handleWheel}
          style={{ cursor: 'grab' }}
        >
          {/* Background grid */}
          <defs>
            <pattern id="flowGrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#333" strokeWidth="0.5" opacity="0.2"/>
            </pattern>
            
            {/* Arrowhead marker */}
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon
                points="0 0, 10 3.5, 0 7"
                fill="#666"
              />
            </marker>

            {/* Glow filter for selected nodes */}
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge> 
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          <rect width="100%" height="100%" fill="url(#flowGrid)" />

          <g transform={`scale(${zoom}) translate(${panOffset.x}, ${panOffset.y})`}>
            {/* Render edges first */}
            {flowData.edges.map((edge, index) => (
              <path
                key={`edge-${index}`}
                d={edge.path}
                stroke="#666"
                strokeWidth="2"
                fill="none"
                markerEnd="url(#arrowhead)"
                opacity={
                  selectedNode && 
                  (selectedNode.id === edge.from.id || selectedNode.id === edge.to.id)
                    ? 1 : 0.6
                }
              />
            ))}

            {/* Render nodes */}
            {flowData.nodes.map((node) => {
              const isSelected = selectedTrace?.id === node.trace.id;
              const isHovered = hoveredNode?.id === node.id;
              const nodeColor = getNodeColor(node.trace);

              return (
                <g key={node.id}>
                  {/* Node background */}
                  <rect
                    x={node.x}
                    y={node.y}
                    width="100"
                    height="60"
                    rx="8"
                    fill={nodeColor}
                    stroke={isSelected ? '#fff' : 'transparent'}
                    strokeWidth="3"
                    style={{
                      cursor: 'pointer',
                      filter: isSelected ? 'url(#glow)' : 'none',
                      opacity: isHovered ? 0.8 : 1,
                    }}
                    onClick={() => handleNodeClick(node)}
                    onMouseEnter={() => setHoveredNode(node)}
                    onMouseLeave={() => setHoveredNode(null)}
                  />

                  {/* Node icon based on operation type */}
                  <text
                    x={node.x + 10}
                    y={node.y + 20}
                    fill="white"
                    fontSize="16"
                    style={{ pointerEvents: 'none' }}
                  >
                    {getOperationIcon(node.trace.operation)}
                  </text>

                  {/* Node title */}
                  <text
                    x={node.x + 30}
                    y={node.y + 18}
                    fill="white"
                    fontSize="11"
                    fontWeight="bold"
                    style={{ pointerEvents: 'none' }}
                  >
                    {node.trace.operation.substring(0, 8)}
                  </text>

                  {/* Node duration */}
                  <text
                    x={node.x + 30}
                    y={node.y + 32}
                    fill="rgba(255, 255, 255, 0.8)"
                    fontSize="9"
                    style={{ pointerEvents: 'none' }}
                  >
                    {formatDuration(node.trace.duration || 0)}
                  </text>

                  {/* Status indicator */}
                  <circle
                    cx={node.x + 85}
                    cy={node.y + 15}
                    r="4"
                    fill={getStatusColor(node.trace.status)}
                  />

                  {/* Error indicator */}
                  {node.trace.status === 'error' && (
                    <text
                      x={node.x + 75}
                      y={node.y + 48}
                      fill="#ff6b6b"
                      fontSize="12"
                      style={{ pointerEvents: 'none' }}
                    >
                      ⚠
                    </text>
                  )}
                </g>
              );
            })}

            {/* Hover tooltip */}
            {hoveredNode && (
              <g className="tooltip">
                <rect
                  x={hoveredNode.x + 110}
                  y={hoveredNode.y - 10}
                  width="180"
                  height="80"
                  fill="rgba(0, 0, 0, 0.9)"
                  stroke="#666"
                  strokeWidth="1"
                  rx="4"
                />
                <text
                  x={hoveredNode.x + 120}
                  y={hoveredNode.y + 10}
                  fill="white"
                  fontSize="12"
                  fontWeight="bold"
                >
                  {hoveredNode.trace.operation}
                </text>
                <text
                  x={hoveredNode.x + 120}
                  y={hoveredNode.y + 28}
                  fill="#ccc"
                  fontSize="10"
                >
                  Duration: {formatDuration(hoveredNode.trace.duration || 0)}
                </text>
                <text
                  x={hoveredNode.x + 120}
                  y={hoveredNode.y + 43}
                  fill="#ccc"
                  fontSize="10"
                >
                  Status: {hoveredNode.trace.status}
                </text>
                <text
                  x={hoveredNode.x + 120}
                  y={hoveredNode.y + 58}
                  fill="#ccc"
                  fontSize="10"
                >
                  Children: {hoveredNode.children.length}
                </text>
              </g>
            )}
          </g>
        </svg>
      </div>

      {/* Selected trace details */}
      {selectedNode && (
        <div className="selected-trace-details">
          <h4>{selectedNode.trace.operation}</h4>
          <div className="trace-metrics">
            <span>Duration: {formatDuration(selectedNode.trace.duration || 0)}</span>
            <span>Status: {selectedNode.trace.status}</span>
            <span>Level: {selectedNode.level}</span>
            <span>Children: {selectedNode.children.length}</span>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper functions
function getOperationIcon(operation: string): string {
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
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'success': return '#2ecc71';
    case 'error': return '#e74c3c';
    case 'pending': return '#f39c12';
    default: return '#95a5a6';
  }
}

export default TraceFlowDiagram;
