import React, { useMemo } from 'react';
import { Trace } from '../../shared/types';

interface PerformanceChartsProps {
  traces: Trace[];
  className?: string;
}

interface ChartData {
  label: string;
  value: number;
  color: string;
}

interface MetricSummary {
  totalTraces: number;
  avgDuration: number;
  successRate: number;
  errorCount: number;
  slowestTrace: Trace | null;
  fastestTrace: Trace | null;
  operationBreakdown: ChartData[];
  durationDistribution: ChartData[];
  statusBreakdown: ChartData[];
  timelineData: { time: number; duration: number; operation: string }[];
}

export const PerformanceCharts: React.FC<PerformanceChartsProps> = ({
  traces,
  className = '',
}) => {
  const metrics = useMemo((): MetricSummary => {
    if (traces.length === 0) {
      return {
        totalTraces: 0,
        avgDuration: 0,
        successRate: 0,
        errorCount: 0,
        slowestTrace: null,
        fastestTrace: null,
        operationBreakdown: [],
        durationDistribution: [],
        statusBreakdown: [],
        timelineData: [],
      };
    }

    const totalTraces = traces.length;
    const durations = traces.map(t => t.duration || 0);
    const avgDuration = durations.reduce((sum, d) => sum + d, 0) / totalTraces;
    const successfulTraces = traces.filter(t => t.status === 'completed').length;
    const successRate = (successfulTraces / totalTraces) * 100;
    const errorCount = traces.filter(t => t.status === 'error').length;

    const slowestTrace = traces.reduce((slowest, current) => 
      (current.duration || 0) > (slowest?.duration || 0) ? current : slowest
    );
    
    const fastestTrace = traces.reduce((fastest, current) => 
      (current.duration || 0) < (fastest?.duration || 0) ? current : fastest
    );

    // Operation breakdown
    const operationCounts = traces.reduce((acc, trace) => {
      acc[trace.operation] = (acc[trace.operation] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const operationColors: Record<string, string> = {
      'llm': '#3498db',
      'database': '#2ecc71',
      'vector': '#9b59b6',
      'api': '#e67e22',
      'file': '#95a5a6',
      'network': '#1abc9c',
    };

    const operationBreakdown: ChartData[] = Object.entries(operationCounts).map(([op, count]) => ({
      label: op,
      value: count,
      color: operationColors[op.toLowerCase()] || '#34495e',
    }));

    // Duration distribution
    const durationBuckets = [
      { label: '< 100ms', min: 0, max: 100 },
      { label: '100ms - 500ms', min: 100, max: 500 },
      { label: '500ms - 1s', min: 500, max: 1000 },
      { label: '1s - 5s', min: 1000, max: 5000 },
      { label: '> 5s', min: 5000, max: Infinity },
    ];

    const durationDistribution: ChartData[] = durationBuckets.map((bucket, index) => {
      const count = traces.filter(t => {
        const duration = t.duration || 0;
        return duration >= bucket.min && duration < bucket.max;
      }).length;

      return {
        label: bucket.label,
        value: count,
        color: `hsl(${index * 60}, 70%, 50%)`,
      };
    });

    // Status breakdown
    const statusCounts = traces.reduce((acc, trace) => {
      acc[trace.status] = (acc[trace.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const statusColors: Record<string, string> = {
      'completed': '#2ecc71',
      'error': '#e74c3c',
      'pending': '#f39c12',
    };

    const statusBreakdown: ChartData[] = Object.entries(statusCounts).map(([status, count]) => ({
      label: status,
      value: count,
      color: statusColors[status] || '#95a5a6',
    }));

    // Timeline data for sparkline
    const sortedTraces = [...traces].sort((a, b) => a.start_time - b.start_time);
    const timelineData = sortedTraces.slice(-20).map(trace => ({
      time: trace.start_time,
      duration: trace.duration || 0,
      operation: trace.operation,
    }));

    return {
      totalTraces,
      avgDuration,
      successRate,
      errorCount,
      slowestTrace,
      fastestTrace,
      operationBreakdown,
      durationDistribution,
      statusBreakdown,
      timelineData,
    };
  }, [traces]);

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const PieChart: React.FC<{ data: ChartData[]; title: string; size?: number }> = ({ 
    data, 
    title, 
    size = 120 
  }) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    if (total === 0) return null;

    let currentAngle = 0;
    const radius = size / 2 - 10;
    const centerX = size / 2;
    const centerY = size / 2;

    return (
      <div className="chart-container">
        <h4>{title}</h4>
        <div className="pie-chart-wrapper">
          <svg width={size} height={size}>
            {data.map((item, index) => {
              if (item.value === 0) return null;
              
              const percentage = item.value / total;
              const sliceAngle = percentage * 360;
              const endAngle = currentAngle + sliceAngle;
              
              const x1 = centerX + radius * Math.cos((currentAngle * Math.PI) / 180);
              const y1 = centerY + radius * Math.sin((currentAngle * Math.PI) / 180);
              const x2 = centerX + radius * Math.cos((endAngle * Math.PI) / 180);
              const y2 = centerY + radius * Math.sin((endAngle * Math.PI) / 180);
              
              const largeArcFlag = sliceAngle > 180 ? 1 : 0;
              
              const pathData = [
                `M ${centerX} ${centerY}`,
                `L ${x1} ${y1}`,
                `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                'Z'
              ].join(' ');
              
              currentAngle = endAngle;
              
              return (
                <path
                  key={index}
                  d={pathData}
                  fill={item.color}
                  stroke="#1a1a1a"
                  strokeWidth="1"
                />
              );
            })}
          </svg>
          <div className="chart-legend">
            {data.map((item, index) => (
              <div key={index} className="legend-item">
                <div 
                  className="legend-color" 
                  style={{ backgroundColor: item.color }}
                ></div>
                <span>{item.label}: {item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const BarChart: React.FC<{ data: ChartData[]; title: string }> = ({ data, title }) => {
    const maxValue = Math.max(...data.map(d => d.value));
    if (maxValue === 0) return null;

    return (
      <div className="chart-container">
        <h4>{title}</h4>
        <div className="bar-chart">
          {data.map((item, index) => (
            <div key={index} className="bar-item">
              <div className="bar-label">{item.label}</div>
              <div className="bar-wrapper">
                <div 
                  className="bar"
                  style={{
                    width: `${(item.value / maxValue) * 100}%`,
                    backgroundColor: item.color,
                  }}
                >
                  <span className="bar-value">{item.value}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const Sparkline: React.FC<{ data: typeof metrics.timelineData }> = ({ data }) => {
    if (data.length === 0) return null;

    const maxDuration = Math.max(...data.map(d => d.duration));
    const width = 200;
    const height = 40;
    
    const points = data.map((d, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - (d.duration / maxDuration) * height;
      return `${x},${y}`;
    }).join(' ');

    return (
      <div className="sparkline-container">
        <h5>Recent Performance Trend</h5>
        <svg width={width} height={height} className="sparkline">
          <polyline
            points={points}
            stroke="#3498db"
            strokeWidth="2"
            fill="none"
          />
          {data.map((d, index) => {
            const x = (index / (data.length - 1)) * width;
            const y = height - (d.duration / maxDuration) * height;
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="2"
                fill="#3498db"
              />
            );
          })}
        </svg>
      </div>
    );
  };

  return (
    <div className={`performance-charts ${className}`}>
      {/* Key Metrics */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-value">{metrics.totalTraces}</div>
          <div className="metric-label">Total Traces</div>
        </div>
        
        <div className="metric-card">
          <div className="metric-value">{formatDuration(metrics.avgDuration)}</div>
          <div className="metric-label">Avg Duration</div>
        </div>
        
        <div className="metric-card">
          <div className="metric-value">{metrics.successRate.toFixed(1)}%</div>
          <div className="metric-label">Success Rate</div>
        </div>
        
        <div className="metric-card">
          <div className="metric-value">{metrics.errorCount}</div>
          <div className="metric-label">Errors</div>
        </div>
      </div>

      {/* Performance Extremes */}
      <div className="extremes-section">
        <div className="extreme-card">
          <h4>Slowest Trace</h4>
          {metrics.slowestTrace ? (
            <div>
              <div className="extreme-operation">{metrics.slowestTrace.operation}</div>
              <div className="extreme-duration">{formatDuration(metrics.slowestTrace.duration || 0)}</div>
            </div>
          ) : (
            <div>No data</div>
          )}
        </div>
        
        <div className="extreme-card">
          <h4>Fastest Trace</h4>
          {metrics.fastestTrace ? (
            <div>
              <div className="extreme-operation">{metrics.fastestTrace.operation}</div>
              <div className="extreme-duration">{formatDuration(metrics.fastestTrace.duration || 0)}</div>
            </div>
          ) : (
            <div>No data</div>
          )}
        </div>
      </div>

      {/* Charts */}
      <div className="charts-grid">
        <PieChart data={metrics.operationBreakdown} title="Operations" />
        <PieChart data={metrics.statusBreakdown} title="Status" />
        <BarChart data={metrics.durationDistribution} title="Duration Distribution" />
      </div>

      {/* Sparkline */}
      <Sparkline data={metrics.timelineData} />
    </div>
  );
};

export default PerformanceCharts;
