import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Trace } from '../../shared/types';

interface InteractiveTimelineProps {
  traces: Trace[];
  selectedTrace?: Trace;
  onTraceSelect: (trace: Trace) => void;
  height?: number;
  className?: string;
}

interface TimelineEvent {
  trace: Trace;
  startX: number;
  width: number;
  y: number;
  color: string;
  level: number;
}

export const InteractiveTimeline: React.FC<InteractiveTimelineProps> = ({
  traces,
  selectedTrace,
  onTraceSelect,
  height = 200,
  className = '',
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [svgDimensions, setSvgDimensions] = useState({ width: 800, height });
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(0);
  const [hoveredTrace, setHoveredTrace] = useState<Trace | null>(null);

  // Calculate timeline bounds and events
  const timelineData = useMemo(() => {
    if (traces.length === 0) return { events: [], minTime: 0, maxTime: 1000, duration: 1000 };

    const sortedTraces = [...traces].sort((a, b) => a.start_time - b.start_time);
    const minTime = sortedTraces[0].start_time;
    const maxTime = Math.max(...sortedTraces.map(t => t.end_time || t.start_time + (t.duration || 100)));
    const duration = maxTime - minTime || 1000;

    // Assign levels to avoid overlaps
    const events: TimelineEvent[] = [];
    const levels: { endTime: number; level: number }[] = [];

    sortedTraces.forEach(trace => {
      const traceStartTime = trace.start_time;
      const traceEndTime = trace.end_time || traceStartTime + (trace.duration || 100);
      
      // Find available level
      let level = 0;
      while (levels[level] && levels[level].endTime > traceStartTime) {
        level++;
      }
      
      if (!levels[level]) {
        levels[level] = { endTime: 0, level };
      }
      levels[level].endTime = traceEndTime;

      const startX = ((traceStartTime - minTime) / duration) * svgDimensions.width;
      const width = Math.max(((traceEndTime - traceStartTime) / duration) * svgDimensions.width, 8);
      const y = level * 30 + 10;
      const color = getTraceColor(trace.operation, trace.status);

      events.push({
        trace,
        startX,
        width,
        y,
        color,
        level,
      });
    });

    return { events, minTime, maxTime, duration };
  }, [traces, svgDimensions.width]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (svgRef.current) {
        const rect = svgRef.current.getBoundingClientRect();
        setSvgDimensions({ width: rect.width, height });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [height]);

  // Mouse handlers for pan and zoom
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      const deltaX = e.clientX - dragStart;
      setPanOffset(prev => Math.max(0, Math.min(prev - deltaX / zoom, svgDimensions.width * (zoom - 1))));
      setDragStart(e.clientX);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.max(0.5, Math.min(prev * zoomFactor, 5)));
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const maxLevel = Math.max(...timelineData.events.map(e => e.level), 0);
  const adjustedHeight = Math.max(height, (maxLevel + 1) * 30 + 50);

  return (
    <div className={`interactive-timeline ${className}`}>
      {/* Timeline Controls */}
      <div className="timeline-controls">
        <div className="timeline-info">
          <span>Zoom: {(zoom * 100).toFixed(0)}%</span>
          <span>{traces.length} traces</span>
          <span>Duration: {formatDuration(timelineData.duration)}</span>
        </div>
        <div className="timeline-actions">
          <button onClick={() => { setZoom(1); setPanOffset(0); }}>
            Reset View
          </button>
          <button onClick={() => setZoom(prev => Math.min(prev * 1.5, 5))}>
            Zoom In
          </button>
          <button onClick={() => setZoom(prev => Math.max(prev / 1.5, 0.5))}>
            Zoom Out
          </button>
        </div>
      </div>

      {/* SVG Timeline */}
      <div className="timeline-container" style={{ height: adjustedHeight, overflow: 'hidden' }}>
        <svg
          ref={svgRef}
          width="100%"
          height={adjustedHeight}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        >
          {/* Grid lines */}
          <defs>
            <pattern id="grid" width="50" height="30" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 30" fill="none" stroke="#333" strokeWidth="0.5" opacity="0.3"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Time scale */}
          <g className="time-scale">
            {Array.from({ length: 10 }, (_, i) => {
              const x = (i / 9) * svgDimensions.width;
              const time = timelineData.minTime + (i / 9) * timelineData.duration;
              return (
                <g key={i}>
                  <line
                    x1={x}
                    y1={0}
                    x2={x}
                    y2={adjustedHeight}
                    stroke="#444"
                    strokeWidth="1"
                    opacity="0.5"
                  />
                  <text
                    x={x}
                    y={adjustedHeight - 5}
                    fill="#ccc"
                    fontSize="10"
                    textAnchor="middle"
                  >
                    {formatTime(time)}
                  </text>
                </g>
              );
            })}
          </g>

          {/* Trace events */}
          <g transform={`scale(${zoom}, 1) translate(${-panOffset}, 0)`}>
            {timelineData.events.map((event, index) => (
              <g key={event.trace.id}>
                {/* Trace bar */}
                <rect
                  x={event.startX}
                  y={event.y}
                  width={event.width}
                  height={20}
                  fill={event.color}
                  stroke={selectedTrace?.id === event.trace.id ? '#fff' : 'transparent'}
                  strokeWidth="2"
                  rx="3"
                  style={{
                    cursor: 'pointer',
                    opacity: hoveredTrace?.id === event.trace.id ? 0.8 : 1,
                    filter: selectedTrace?.id === event.trace.id ? 'brightness(1.2)' : 'none',
                  }}
                  onClick={() => onTraceSelect(event.trace)}
                  onMouseEnter={() => setHoveredTrace(event.trace)}
                  onMouseLeave={() => setHoveredTrace(null)}
                />
                
                {/* Trace label */}
                {event.width > 40 && (
                  <text
                    x={event.startX + 4}
                    y={event.y + 14}
                    fill="white"
                    fontSize="10"
                    fontWeight="500"
                    style={{ pointerEvents: 'none' }}
                  >
                    {event.trace.operation}
                  </text>
                )}

                {/* Error indicator */}
                {event.trace.status === 'error' && (
                  <circle
                    cx={event.startX + event.width - 6}
                    cy={event.y + 6}
                    r="4"
                    fill="#ff4444"
                    stroke="white"
                    strokeWidth="1"
                  />
                )}
              </g>
            ))}
          </g>

          {/* Hover tooltip area */}
          {hoveredTrace && (
            <g className="tooltip">
              <rect
                x="10"
                y="10"
                width="200"
                height="60"
                fill="rgba(0, 0, 0, 0.9)"
                stroke="#666"
                strokeWidth="1"
                rx="4"
              />
              <text x="15" y="25" fill="white" fontSize="12" fontWeight="bold">
                {hoveredTrace.operation}
              </text>
              <text x="15" y="40" fill="#ccc" fontSize="10">
                Duration: {formatDuration(hoveredTrace.duration || 0)}
              </text>
              <text x="15" y="55" fill="#ccc" fontSize="10">
                Status: {hoveredTrace.status}
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* Legend */}
      <div className="timeline-legend">
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#3498db' }}></div>
          <span>LLM</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#2ecc71' }}></div>
          <span>Database</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#9b59b6' }}></div>
          <span>Vector</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#e67e22' }}></div>
          <span>API</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#e74c3c' }}></div>
          <span>Error</span>
        </div>
      </div>
    </div>
  );
};

// Helper function to get trace color
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

export default InteractiveTimeline;
