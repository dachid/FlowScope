import React, { useState } from 'react';
import { Download, FileJson, FileText, Database, Check, X } from 'lucide-react';
import { useDebuggerStore } from '../../store/debugger';

interface ExportOptionsProps {
  onClose?: () => void;
  className?: string;
}

type ExportFormat = 'json' | 'csv' | 'txt' | 'xml';
type ExportScope = 'all' | 'filtered' | 'selected' | 'current-session';

interface ExportConfig {
  format: ExportFormat;
  scope: ExportScope;
  includeMetadata: boolean;
  includeTimestamps: boolean;
  includeSessionInfo: boolean;
  prettyFormat: boolean;
  filterSensitiveData: boolean;
}

export const ExportOptions: React.FC<ExportOptionsProps> = ({ onClose, className = '' }) => {
  const { traces, filteredTraces, currentSession } = useDebuggerStore();
  
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [config, setConfig] = useState<ExportConfig>({
    format: 'json',
    scope: 'filtered',
    includeMetadata: true,
    includeTimestamps: true,
    includeSessionInfo: true,
    prettyFormat: true,
    filterSensitiveData: true
  });

  const formatOptions = [
    { value: 'json', label: 'JSON', icon: FileJson, description: 'JavaScript Object Notation' },
    { value: 'csv', label: 'CSV', icon: FileText, description: 'Comma Separated Values' },
    { value: 'txt', label: 'Text', icon: FileText, description: 'Plain text format' },
    { value: 'xml', label: 'XML', icon: Database, description: 'Extensible Markup Language' }
  ] as const;

  const scopeOptions = [
    { 
      value: 'all', 
      label: 'All Traces', 
      description: `Export all ${traces.length} traces`,
      count: traces.length 
    },
    { 
      value: 'filtered', 
      label: 'Filtered Traces', 
      description: `Export ${filteredTraces.length} filtered traces`,
      count: filteredTraces.length 
    },
    { 
      value: 'current-session', 
      label: 'Current Session', 
      description: currentSession ? `Export traces from "${currentSession.name}"` : 'No active session',
      count: currentSession ? traces.filter(t => t.sessionId === currentSession.id).length : 0 
    }
  ] as const;

  const getTracesToExport = () => {
    switch (config.scope) {
      case 'all':
        return traces;
      case 'filtered':
        return filteredTraces;
      case 'current-session':
        return currentSession ? traces.filter(t => t.sessionId === currentSession.id) : [];
      default:
        return [];
    }
  };

  const sanitizeData = (data: any): any => {
    if (!config.filterSensitiveData) return data;
    
    // Remove potentially sensitive information
    const sensitiveKeys = ['password', 'token', 'key', 'secret', 'auth', 'credential'];
    
    if (typeof data === 'object' && data !== null) {
      const sanitized = Array.isArray(data) ? [] : {};
      
      for (const [key, value] of Object.entries(data)) {
        const isSensitive = sensitiveKeys.some(sensitive => 
          key.toLowerCase().includes(sensitive)
        );
        
        if (isSensitive) {
          (sanitized as any)[key] = '[REDACTED]';
        } else if (typeof value === 'object' && value !== null) {
          (sanitized as any)[key] = sanitizeData(value);
        } else {
          (sanitized as any)[key] = value;
        }
      }
      
      return sanitized;
    }
    
    return data;
  };

  const formatTraceData = (trace: any) => {
    const baseTrace: any = {
      id: trace.id,
      type: trace.type,
      sessionId: trace.sessionId,
      status: trace.status,
      data: sanitizeData(trace.data)
    };

    if (config.includeTimestamps) {
      if (trace.timestamp) baseTrace.timestamp = trace.timestamp;
      if (trace.duration) baseTrace.duration = trace.duration;
    }

    if (config.includeMetadata && trace.metadata) {
      baseTrace.metadata = sanitizeData(trace.metadata);
    }

    return baseTrace;
  };

  const exportToJSON = (data: any[]) => {
    const exportData = {
      exportInfo: {
        timestamp: new Date().toISOString(),
        format: 'json',
        scope: config.scope,
        totalTraces: data.length,
        ...(config.includeSessionInfo && currentSession && { 
          session: {
            id: currentSession.id,
            name: currentSession.name,
            startTime: currentSession.startTime
          }
        })
      },
      traces: data.map(formatTraceData)
    };

    const jsonString = config.prettyFormat 
      ? JSON.stringify(exportData, null, 2)
      : JSON.stringify(exportData);
    
    return new Blob([jsonString], { type: 'application/json' });
  };

  const exportToCSV = (data: any[]) => {
    const headers = ['id', 'type', 'sessionId', 'status'];
    if (config.includeTimestamps) headers.push('timestamp', 'duration');
    headers.push('data');
    if (config.includeMetadata) headers.push('metadata');

    const csvContent = [
      headers.join(','),
      ...data.map(trace => {
        const formatted = formatTraceData(trace);
        const row = [
          `"${formatted.id}"`,
          `"${formatted.type}"`,
          `"${formatted.sessionId}"`,
          `"${formatted.status}"`
        ];
        
        if (config.includeTimestamps) {
          row.push(
            `"${formatted.timestamp || ''}"`,
            `"${formatted.duration || ''}"`
          );
        }
        
        row.push(`"${JSON.stringify(formatted.data).replace(/"/g, '""')}"`);
        
        if (config.includeMetadata) {
          row.push(`"${JSON.stringify(formatted.metadata || {}).replace(/"/g, '""')}"`);
        }
        
        return row.join(',');
      })
    ].join('\n');

    return new Blob([csvContent], { type: 'text/csv' });
  };

  const exportToText = (data: any[]) => {
    const lines = [
      '='.repeat(50),
      `FlowScope Trace Export`,
      `Generated: ${new Date().toISOString()}`,
      `Format: Plain Text`,
      `Scope: ${config.scope}`,
      `Total Traces: ${data.length}`,
      ...(config.includeSessionInfo && currentSession ? [
        `Session: ${currentSession.name} (${currentSession.id})`
      ] : []),
      '='.repeat(50),
      ''
    ];

    data.forEach((trace, index) => {
      const formatted = formatTraceData(trace);
      lines.push(`--- Trace ${index + 1} ---`);
      lines.push(`ID: ${formatted.id}`);
      lines.push(`Type: ${formatted.type}`);
      lines.push(`Session: ${formatted.sessionId}`);
      lines.push(`Status: ${formatted.status}`);
      
      if (config.includeTimestamps && formatted.timestamp) {
        lines.push(`Timestamp: ${new Date(formatted.timestamp).toISOString()}`);
        if (formatted.duration) {
          lines.push(`Duration: ${formatted.duration}ms`);
        }
      }
      
      lines.push(`Data: ${JSON.stringify(formatted.data, null, 2)}`);
      
      if (config.includeMetadata && formatted.metadata) {
        lines.push(`Metadata: ${JSON.stringify(formatted.metadata, null, 2)}`);
      }
      
      lines.push('');
    });

    return new Blob([lines.join('\n')], { type: 'text/plain' });
  };

  const exportToXML = (data: any[]) => {
    const escapeXml = (str: string) => {
      return str.replace(/[<>&'"]/g, (char) => {
        switch (char) {
          case '<': return '&lt;';
          case '>': return '&gt;';
          case '&': return '&amp;';
          case "'": return '&apos;';
          case '"': return '&quot;';
          default: return char;
        }
      });
    };

    const xmlLines = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<flowscope-export>',
      '  <export-info>',
      `    <timestamp>${new Date().toISOString()}</timestamp>`,
      `    <format>xml</format>`,
      `    <scope>${config.scope}</scope>`,
      `    <total-traces>${data.length}</total-traces>`,
      ...(config.includeSessionInfo && currentSession ? [
        '    <session>',
        `      <id>${escapeXml(currentSession.id)}</id>`,
        `      <name>${escapeXml(currentSession.name || '')}</name>`,
        `      <start-time>${currentSession.startTime}</start-time>`,
        '    </session>'
      ] : []),
      '  </export-info>',
      '  <traces>'
    ];

    data.forEach(trace => {
      const formatted = formatTraceData(trace);
      xmlLines.push('    <trace>');
      xmlLines.push(`      <id>${escapeXml(formatted.id)}</id>`);
      xmlLines.push(`      <type>${escapeXml(formatted.type)}</type>`);
      xmlLines.push(`      <session-id>${escapeXml(formatted.sessionId)}</session-id>`);
      xmlLines.push(`      <status>${escapeXml(formatted.status)}</status>`);
      
      if (config.includeTimestamps && formatted.timestamp) {
        xmlLines.push(`      <timestamp>${formatted.timestamp}</timestamp>`);
        if (formatted.duration) {
          xmlLines.push(`      <duration>${formatted.duration}</duration>`);
        }
      }
      
      xmlLines.push(`      <data><![CDATA[${JSON.stringify(formatted.data)}]]></data>`);
      
      if (config.includeMetadata && formatted.metadata) {
        xmlLines.push(`      <metadata><![CDATA[${JSON.stringify(formatted.metadata)}]]></metadata>`);
      }
      
      xmlLines.push('    </trace>');
    });

    xmlLines.push('  </traces>');
    xmlLines.push('</flowscope-export>');

    return new Blob([xmlLines.join('\n')], { type: 'application/xml' });
  };

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      const tracesToExport = getTracesToExport();
      
      if (tracesToExport.length === 0) {
        alert('No traces to export. Please check your selection.');
        return;
      }

      let blob: Blob;
      let filename: string;

      switch (config.format) {
        case 'json':
          blob = exportToJSON(tracesToExport);
          filename = `flowscope-traces-${config.scope}-${Date.now()}.json`;
          break;
        case 'csv':
          blob = exportToCSV(tracesToExport);
          filename = `flowscope-traces-${config.scope}-${Date.now()}.csv`;
          break;
        case 'txt':
          blob = exportToText(tracesToExport);
          filename = `flowscope-traces-${config.scope}-${Date.now()}.txt`;
          break;
        case 'xml':
          blob = exportToXML(tracesToExport);
          filename = `flowscope-traces-${config.scope}-${Date.now()}.xml`;
          break;
        default:
          throw new Error('Unsupported format');
      }

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Close modal after successful export
      setTimeout(() => {
        setIsOpen(false);
        onClose?.();
      }, 1000);

    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${className}`}
        title="Export traces"
      >
        <Download className="w-4 h-4" />
        Export
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Download className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Export Traces</h2>
          </div>
          <button
            onClick={() => {
              setIsOpen(false);
              onClose?.();
            }}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Export Format</label>
            <div className="grid grid-cols-2 gap-3">
              {formatOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setConfig(prev => ({ ...prev, format: option.value }))}
                  className={`p-3 border-2 rounded-lg text-left transition-colors ${
                    config.format === option.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <option.icon className="w-4 h-4" />
                    <span className="font-medium">{option.label}</span>
                  </div>
                  <p className="text-xs text-gray-600">{option.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Scope Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Export Scope</label>
            <div className="space-y-2">
              {scopeOptions.map((option) => (
                <label
                  key={option.value}
                  className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                    config.scope === option.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="scope"
                    value={option.value}
                    checked={config.scope === option.value}
                    onChange={(e) => setConfig(prev => ({ ...prev, scope: e.target.value as ExportScope }))}
                    className="sr-only"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{option.label}</span>
                      <span className="text-sm text-gray-500">({option.count} traces)</span>
                    </div>
                    <p className="text-sm text-gray-600">{option.description}</p>
                  </div>
                  {config.scope === option.value && (
                    <Check className="w-5 h-5 text-blue-600 ml-3" />
                  )}
                </label>
              ))}
            </div>
          </div>

          {/* Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Export Options</label>
            <div className="space-y-3">
              {[
                { key: 'includeMetadata', label: 'Include metadata', description: 'Export trace metadata and additional information' },
                { key: 'includeTimestamps', label: 'Include timestamps', description: 'Export trace timing information' },
                { key: 'includeSessionInfo', label: 'Include session info', description: 'Export session details in the output' },
                { key: 'prettyFormat', label: 'Pretty format', description: 'Format output for readability (JSON/XML only)' },
                { key: 'filterSensitiveData', label: 'Filter sensitive data', description: 'Remove potentially sensitive information' }
              ].map((option) => (
                <label key={option.key} className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config[option.key as keyof ExportConfig] as boolean}
                    onChange={(e) => setConfig(prev => ({ 
                      ...prev, 
                      [option.key]: e.target.checked 
                    }))}
                    className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-900">{option.label}</span>
                    <p className="text-xs text-gray-600">{option.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <span className="text-sm text-gray-600">
            Ready to export {getTracesToExport().length} traces as {config.format.toUpperCase()}
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setIsOpen(false);
                onClose?.();
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting || getTracesToExport().length === 0}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-2"
            >
              {isExporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Export
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
