import React, { useState } from 'react';
import {
  Clock,
  Zap,
  AlertTriangle,
  CheckCircle,
  XCircle,
  BarChart3,
  TrendingUp,
  Eye,
  Copy,
  Bookmark,
  BookmarkCheck,
  Download,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import type { TraceData } from '@flowscope/shared';

interface TraceInspectorProps {
  trace: TraceData;
  onBookmark?: (traceId: string) => void;
  isBookmarked?: boolean;
}

interface PerformanceMetrics {
  tokenUsage?: {
    prompt: number;
    completion: number;
    total: number;
  };
  cost?: number;
  latency?: number;
  throughput?: number;
}

export const TraceInspector: React.FC<TraceInspectorProps> = ({ 
  trace, 
  onBookmark, 
  isBookmarked = false 
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['overview']));
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const exportTrace = () => {
    const exportData = {
      trace,
      exportedAt: new Date().toISOString(),
      version: '1.0.0'
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
      type: 'application/json' 
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trace-${trace.id}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Extract performance metrics from trace data
  const getPerformanceMetrics = (): PerformanceMetrics => {
    const metrics: PerformanceMetrics = {};
    
    if (trace.metadata?.tokenUsage && typeof trace.metadata.tokenUsage === 'object') {
      const tokenUsage = trace.metadata.tokenUsage as any;
      if (tokenUsage.prompt && tokenUsage.completion && tokenUsage.total) {
        metrics.tokenUsage = {
          prompt: tokenUsage.prompt,
          completion: tokenUsage.completion,
          total: tokenUsage.total
        };
      }
    }
    
    if (trace.metadata?.cost && typeof trace.metadata.cost === 'number') {
      metrics.cost = trace.metadata.cost;
    }
    
    if (trace.duration) {
      metrics.latency = trace.duration;
    }
    
    if (trace.metadata?.throughput && typeof trace.metadata.throughput === 'number') {
      metrics.throughput = trace.metadata.throughput;
    }
    
    return metrics;
  };

  const metrics = getPerformanceMetrics();

  const getStatusIcon = () => {
    switch (trace.status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusColor = () => {
    switch (trace.status) {
      case 'completed':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'failed':
        return 'text-red-700 bg-red-50 border-red-200';
      default:
        return 'text-yellow-700 bg-yellow-50 border-yellow-200';
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
    return `${(ms / 60000).toFixed(2)}m`;
  };

  const formatTokens = (tokens: number) => {
    if (tokens < 1000) return tokens.toString();
    if (tokens < 1000000) return `${(tokens / 1000).toFixed(1)}K`;
    return `${(tokens / 1000000).toFixed(1)}M`;
  };

  const CollapsibleSection: React.FC<{ 
    title: string; 
    id: string; 
    children: React.ReactNode;
    icon?: React.ReactNode;
  }> = ({ title, id, children, icon }) => {
    const isExpanded = expandedSections.has(id);
    
    return (
      <div className="border border-gray-200 rounded-lg">
        <button
          onClick={() => toggleSection(id)}
          className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            {icon}
            <h3 className="font-medium text-gray-900">{title}</h3>
          </div>
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-400" />
          )}
        </button>
        {isExpanded && (
          <div className="border-t border-gray-200 p-3">
            {children}
          </div>
        )}
      </div>
    );
  };

  const CopyableField: React.FC<{ 
    label: string; 
    value: string; 
    fieldKey: string;
    multiline?: boolean;
  }> = ({ label, value, fieldKey, multiline = false }) => (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-gray-500">{label}</label>
        <button
          onClick={() => copyToClipboard(value, fieldKey)}
          className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
        >
          {copiedField === fieldKey ? (
            <>
              <CheckCircle className="w-3 h-3" />
              Copied
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              Copy
            </>
          )}
        </button>
      </div>
      {multiline ? (
        <textarea
          value={value}
          readOnly
          className="w-full p-2 text-xs bg-gray-50 border border-gray-200 rounded font-mono resize-none"
          rows={Math.min(10, value.split('\n').length)}
        />
      ) : (
        <input
          value={value}
          readOnly
          className="w-full p-2 text-xs bg-gray-50 border border-gray-200 rounded font-mono"
        />
      )}
    </div>
  );

  return (
    <div className="p-4 bg-white border-l border-gray-200 h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <h2 className="text-lg font-semibold text-gray-900">
            {trace.type.replace('_', ' ').toUpperCase()}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onBookmark?.(trace.id)}
            className={`p-2 rounded-lg transition-colors ${
              isBookmarked 
                ? 'text-yellow-600 bg-yellow-50 hover:bg-yellow-100' 
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
            }`}
          >
            {isBookmarked ? (
              <BookmarkCheck className="w-4 h-4" />
            ) : (
              <Bookmark className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={exportTrace}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Status Badge */}
      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border mb-4 ${getStatusColor()}`}>
        {getStatusIcon()}
        {trace.status || 'pending'}
      </div>

      <div className="space-y-4">
        {/* Overview */}
        <CollapsibleSection 
          title="Overview" 
          id="overview"
          icon={<Eye className="w-4 h-4 text-gray-500" />}
        >
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-500">Trace ID</div>
              <div className="font-mono text-xs bg-gray-50 p-1 rounded">{trace.id}</div>
            </div>
            <div>
              <div className="text-gray-500">Timestamp</div>
              <div>{new Date(trace.timestamp).toLocaleString()}</div>
            </div>
            <div>
              <div className="text-gray-500">Session ID</div>
              <div className="font-mono text-xs bg-gray-50 p-1 rounded">{trace.sessionId}</div>
            </div>
            <div>
              <div className="text-gray-500">Chain ID</div>
              <div className="font-mono text-xs bg-gray-50 p-1 rounded">{trace.chainId}</div>
            </div>
          </div>
        </CollapsibleSection>

        {/* Performance Metrics */}
        {(metrics.tokenUsage || metrics.latency || metrics.cost) && (
          <CollapsibleSection 
            title="Performance Metrics" 
            id="performance"
            icon={<BarChart3 className="w-4 h-4 text-gray-500" />}
          >
            <div className="space-y-4">
              {/* Token Usage */}
              {metrics.tokenUsage && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Token Usage</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-2 bg-blue-50 rounded">
                      <div className="text-lg font-semibold text-blue-700">
                        {formatTokens(metrics.tokenUsage.prompt)}
                      </div>
                      <div className="text-xs text-blue-600">Prompt</div>
                    </div>
                    <div className="text-center p-2 bg-green-50 rounded">
                      <div className="text-lg font-semibold text-green-700">
                        {formatTokens(metrics.tokenUsage.completion)}
                      </div>
                      <div className="text-xs text-green-600">Completion</div>
                    </div>
                    <div className="text-center p-2 bg-purple-50 rounded">
                      <div className="text-lg font-semibold text-purple-700">
                        {formatTokens(metrics.tokenUsage.total)}
                      </div>
                      <div className="text-xs text-purple-600">Total</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Other Metrics */}
              <div className="grid grid-cols-2 gap-4">
                {metrics.latency && (
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <div>
                      <div className="text-sm font-medium">{formatDuration(metrics.latency)}</div>
                      <div className="text-xs text-gray-500">Latency</div>
                    </div>
                  </div>
                )}
                {metrics.cost && (
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                    <TrendingUp className="w-4 h-4 text-gray-500" />
                    <div>
                      <div className="text-sm font-medium">${metrics.cost.toFixed(4)}</div>
                      <div className="text-xs text-gray-500">Cost</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CollapsibleSection>
        )}

        {/* Trace Data */}
        <CollapsibleSection 
          title="Trace Data" 
          id="data"
          icon={<Zap className="w-4 h-4 text-gray-500" />}
        >
          <div className="space-y-3">
            <CopyableField
              label="Raw Data"
              value={JSON.stringify(trace.data, null, 2)}
              fieldKey="data"
              multiline
            />
          </div>
        </CollapsibleSection>

        {/* Metadata */}
        {trace.metadata && (
          <CollapsibleSection 
            title="Metadata" 
            id="metadata"
            icon={<BarChart3 className="w-4 h-4 text-gray-500" />}
          >
            <div className="space-y-3">
              <CopyableField
                label="Metadata"
                value={JSON.stringify(trace.metadata, null, 2)}
                fieldKey="metadata"
                multiline
              />
            </div>
          </CollapsibleSection>
        )}

        {/* Error Details */}
        {(trace.type === 'error' || trace.status === 'failed') && (
          <CollapsibleSection 
            title="Error Details" 
            id="error"
            icon={<AlertTriangle className="w-4 h-4 text-red-500" />}
          >
            <div className="space-y-3">
              {(trace.data as any)?.error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded">
                  <div className="text-sm font-medium text-red-800 mb-1">Error Message</div>
                  <div className="text-sm text-red-700">{(trace.data as any).error}</div>
                </div>
              )}
              {(trace.data as any)?.stack && (
                <CopyableField
                  label="Stack Trace"
                  value={(trace.data as any).stack}
                  fieldKey="stack"
                  multiline
                />
              )}
            </div>
          </CollapsibleSection>
        )}
      </div>
    </div>
  );
};
