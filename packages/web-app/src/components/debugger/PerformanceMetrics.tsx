import React, { useMemo } from 'react';
import { Clock, Zap, AlertTriangle, TrendingUp, BarChart, Activity } from 'lucide-react';
import { useDebuggerStore } from '../../store/debugger';

interface PerformanceMetricsProps {
  className?: string;
}

interface PerformanceStats {
  totalTraces: number;
  avgExecutionTime: number;
  errorRate: number;
  totalExecutionTime: number;
  slowestOperation: { operation: string; duration: number } | null;
  fastestOperation: { operation: string; duration: number } | null;
  operationStats: { [operation: string]: { count: number; avgTime: number; errorCount: number } };
  bottlenecks: Array<{ operation: string; duration: number; timestamp: number }>;
}

export const PerformanceMetrics: React.FC<PerformanceMetricsProps> = ({ className = '' }) => {
  const { filteredTraces, currentSession } = useDebuggerStore();

  const stats: PerformanceStats = useMemo(() => {
    const traces = filteredTraces;
    
    if (traces.length === 0) {
      return {
        totalTraces: 0,
        avgExecutionTime: 0,
        errorRate: 0,
        totalExecutionTime: 0,
        slowestOperation: null,
        fastestOperation: null,
        operationStats: {},
        bottlenecks: []
      };
    }

    let totalTime = 0;
    let errorCount = 0;
    const operationStats: { [operation: string]: { count: number; totalTime: number; errorCount: number } } = {};
    const operations: Array<{ operation: string; duration: number; timestamp: number }> = [];

    traces.forEach(trace => {
      const duration = trace.duration || 0;
      totalTime += duration;
      
      if (trace.status === 'failed') {
        errorCount++;
      }

      // Track operation statistics
      const operation = trace.type || 'unknown';
      if (!operationStats[operation]) {
        operationStats[operation] = { count: 0, totalTime: 0, errorCount: 0 };
      }
      
      operationStats[operation].count++;
      operationStats[operation].totalTime += duration;
      if (trace.status === 'failed') {
        operationStats[operation].errorCount++;
      }

      operations.push({
        operation,
        duration,
        timestamp: trace.timestamp
      });
    });

    // Find slowest and fastest operations
    const sortedOps = operations.sort((a, b) => b.duration - a.duration);
    const slowestOperation = sortedOps[0] || null;
    const fastestOperation = sortedOps[sortedOps.length - 1] || null;

    // Identify bottlenecks (operations taking > 2x average time)
    const avgTime = totalTime / traces.length;
    const bottlenecks = operations
      .filter(op => op.duration > avgTime * 2)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 5);

    // Calculate operation averages
    const processedOperationStats: { [operation: string]: { count: number; avgTime: number; errorCount: number } } = {};
    Object.entries(operationStats).forEach(([operation, stats]) => {
      processedOperationStats[operation] = {
        count: stats.count,
        avgTime: stats.totalTime / stats.count,
        errorCount: stats.errorCount
      };
    });

    return {
      totalTraces: traces.length,
      avgExecutionTime: totalTime / traces.length,
      errorRate: (errorCount / traces.length) * 100,
      totalExecutionTime: totalTime,
      slowestOperation,
      fastestOperation,
      operationStats: processedOperationStats,
      bottlenecks
    };
  }, [filteredTraces]);

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const getPerformanceLevel = (avgTime: number): { level: string; color: string; icon: React.ReactNode } => {
    if (avgTime < 100) return { level: 'Excellent', color: 'text-green-600', icon: <TrendingUp className="w-4 h-4" /> };
    if (avgTime < 500) return { level: 'Good', color: 'text-blue-600', icon: <BarChart className="w-4 h-4" /> };
    if (avgTime < 1000) return { level: 'Fair', color: 'text-yellow-600', icon: <Activity className="w-4 h-4" /> };
    return { level: 'Needs Attention', color: 'text-red-600', icon: <AlertTriangle className="w-4 h-4" /> };
  };

  const performance = getPerformanceLevel(stats.avgExecutionTime);

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-600" />
          Performance Metrics
        </h3>
        {currentSession && (
          <span className="text-sm text-gray-500">
            Session: {currentSession?.name || 'None'}
          </span>
        )}
      </div>

      {stats.totalTraces === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Activity className="w-12 h-12 mx-auto mb-2 text-gray-300" />
          <p>No traces available</p>
          <p className="text-sm text-gray-400">Start debugging to see performance metrics</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Overview Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium">Total Traces</p>
                  <p className="text-2xl font-bold text-blue-700">{stats.totalTraces}</p>
                </div>
                <BarChart className="w-8 h-8 text-blue-500" />
              </div>
            </div>

            <div className="bg-green-50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 font-medium">Avg Time</p>
                  <p className="text-2xl font-bold text-green-700">{formatDuration(stats.avgExecutionTime)}</p>
                </div>
                <Clock className="w-8 h-8 text-green-500" />
              </div>
            </div>

            <div className="bg-yellow-50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-yellow-600 font-medium">Error Rate</p>
                  <p className="text-2xl font-bold text-yellow-700">{stats.errorRate.toFixed(1)}%</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-yellow-500" />
              </div>
            </div>

            <div className="bg-purple-50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600 font-medium">Total Time</p>
                  <p className="text-2xl font-bold text-purple-700">{formatDuration(stats.totalExecutionTime)}</p>
                </div>
                <Zap className="w-8 h-8 text-purple-500" />
              </div>
            </div>
          </div>

          {/* Performance Level */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className={performance.color}>
                {performance.icon}
              </div>
              <div>
                <p className="font-medium text-gray-900">Overall Performance: {performance.level}</p>
                <p className="text-sm text-gray-600">
                  Average execution time: {formatDuration(stats.avgExecutionTime)}
                </p>
              </div>
            </div>
          </div>

          {/* Bottlenecks */}
          {stats.bottlenecks.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                Performance Bottlenecks
              </h4>
              <div className="space-y-2">
                {stats.bottlenecks.map((bottleneck, index) => (
                  <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-red-800">{bottleneck.operation}</p>
                        <p className="text-sm text-red-600">
                          {formatDuration(bottleneck.duration)} - {new Date(bottleneck.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                          {Math.round((bottleneck.duration / stats.avgExecutionTime) * 100) / 100}x slower
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Operation Statistics */}
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Operation Statistics</h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {Object.entries(stats.operationStats)
                .sort(([,a], [,b]) => b.avgTime - a.avgTime)
                .map(([operation, operationStats]) => (
                  <div key={operation} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">{operation}</p>
                        <div className="flex gap-4 text-sm text-gray-600 mt-1">
                          <span>{operationStats.count} calls</span>
                          <span>{formatDuration(operationStats.avgTime)} avg</span>
                          {operationStats.errorCount > 0 && (
                            <span className="text-red-600">{operationStats.errorCount} errors</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm px-2 py-1 rounded ${
                          operationStats.avgTime < stats.avgExecutionTime 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {operationStats.avgTime < stats.avgExecutionTime ? 'Fast' : 'Slow'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Extremes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stats.slowestOperation && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <h5 className="font-medium text-red-800 mb-1">Slowest Operation</h5>
                <p className="text-sm text-red-700">{stats.slowestOperation.operation}</p>
                <p className="text-lg font-bold text-red-800">{formatDuration(stats.slowestOperation.duration)}</p>
              </div>
            )}

            {stats.fastestOperation && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <h5 className="font-medium text-green-800 mb-1">Fastest Operation</h5>
                <p className="text-sm text-green-700">{stats.fastestOperation.operation}</p>
                <p className="text-lg font-bold text-green-800">{formatDuration(stats.fastestOperation.duration)}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
