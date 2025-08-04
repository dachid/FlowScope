import React, { useState } from 'react';
import {
  Download,
  FileText,
  Database,
  Code,
  Share2,
  Link,
  Copy,
  CheckCircle,
  X,
  Calendar,
  Filter
} from 'lucide-react';
import { useDebuggerStore } from '../../store/debugger';
import type { TraceData } from '@flowscope/shared';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ExportFormat = 'json' | 'csv' | 'markdown' | 'html' | 'png' | 'svg';

interface ExportOptions {
  format: ExportFormat;
  includeMetadata: boolean;
  includeTimestamps: boolean;
  filterByStatus: string;
  filterByType: string;
  dateRange: {
    start: string;
    end: string;
  };
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose }) => {
  const { traces, filteredTraces, currentSession } = useDebuggerStore();
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'json',
    includeMetadata: true,
    includeTimestamps: true,
    filterByStatus: 'all',
    filterByType: 'all',
    dateRange: {
      start: '',
      end: ''
    }
  });
  const [shareUrl, setShareUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const getFilteredData = () => {
    let data = filteredTraces.length > 0 ? filteredTraces : traces;

    // Apply additional filters
    if (exportOptions.filterByStatus !== 'all') {
      data = data.filter(trace => trace.status === exportOptions.filterByStatus);
    }

    if (exportOptions.filterByType !== 'all') {
      data = data.filter(trace => trace.type === exportOptions.filterByType);
    }

    // Apply date range filter
    if (exportOptions.dateRange.start || exportOptions.dateRange.end) {
      data = data.filter(trace => {
        const traceDate = new Date(trace.timestamp);
        if (exportOptions.dateRange.start) {
          const startDate = new Date(exportOptions.dateRange.start);
          if (traceDate < startDate) return false;
        }
        if (exportOptions.dateRange.end) {
          const endDate = new Date(exportOptions.dateRange.end);
          if (traceDate > endDate) return false;
        }
        return true;
      });
    }

    return data;
  };

  const exportAsJSON = (data: TraceData[]) => {
    const exportData = {
      session: currentSession,
      traces: data.map(trace => ({
        ...trace,
        ...(exportOptions.includeMetadata ? {} : { metadata: undefined }),
        ...(exportOptions.includeTimestamps ? {} : { timestamp: undefined })
      })),
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
      exportOptions
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
      type: 'application/json' 
    });
    
    downloadFile(blob, `flowscope-export-${Date.now()}.json`);
  };

  const exportAsCSV = (data: TraceData[]) => {
    const headers = [
      'ID',
      'Type',
      'Status',
      ...(exportOptions.includeTimestamps ? ['Timestamp'] : []),
      'Duration',
      'Session ID',
      'Chain ID',
      'Data',
      ...(exportOptions.includeMetadata ? ['Metadata'] : [])
    ];

    const rows = data.map(trace => [
      trace.id,
      trace.type,
      trace.status || 'pending',
      ...(exportOptions.includeTimestamps ? [new Date(trace.timestamp).toISOString()] : []),
      trace.duration || '',
      trace.sessionId,
      trace.chainId,
      JSON.stringify(trace.data),
      ...(exportOptions.includeMetadata ? [JSON.stringify(trace.metadata || {})] : [])
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    downloadFile(blob, `flowscope-export-${Date.now()}.csv`);
  };

  const exportAsMarkdown = (data: TraceData[]) => {
    let markdown = `# FlowScope Debug Session Export\n\n`;
    
    if (currentSession) {
      markdown += `**Session:** ${currentSession.name}\n`;
      markdown += `**Created:** ${new Date(currentSession.createdAt).toLocaleString()}\n`;
      markdown += `**Traces:** ${data.length}\n\n`;
    }

    markdown += `## Traces\n\n`;

    data.forEach((trace, index) => {
      markdown += `### ${index + 1}. ${trace.type.toUpperCase()}\n\n`;
      markdown += `- **ID:** ${trace.id}\n`;
      markdown += `- **Status:** ${trace.status || 'pending'}\n`;
      
      if (exportOptions.includeTimestamps) {
        markdown += `- **Timestamp:** ${new Date(trace.timestamp).toLocaleString()}\n`;
      }
      
      if (trace.duration) {
        markdown += `- **Duration:** ${trace.duration}ms\n`;
      }
      
      markdown += `- **Session ID:** ${trace.sessionId}\n`;
      markdown += `- **Chain ID:** ${trace.chainId}\n\n`;
      
      markdown += `**Data:**\n\`\`\`json\n${JSON.stringify(trace.data, null, 2)}\n\`\`\`\n\n`;
      
      if (exportOptions.includeMetadata && trace.metadata) {
        markdown += `**Metadata:**\n\`\`\`json\n${JSON.stringify(trace.metadata, null, 2)}\n\`\`\`\n\n`;
      }
      
      markdown += `---\n\n`;
    });

    const blob = new Blob([markdown], { type: 'text/markdown' });
    downloadFile(blob, `flowscope-export-${Date.now()}.md`);
  };

  const exportAsHTML = (data: TraceData[]) => {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FlowScope Debug Session Export</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 40px; line-height: 1.6; }
        .header { border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; margin-bottom: 30px; }
        .trace { border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 20px; padding: 20px; }
        .trace-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
        .trace-type { background: #3b82f6; color: white; padding: 4px 12px; border-radius: 20px; font-size: 14px; }
        .status { padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
        .status-completed { background: #dcfce7; color: #166534; }
        .status-failed { background: #fecaca; color: #991b1b; }
        .status-pending { background: #fef3c7; color: #92400e; }
        pre { background: #f3f4f6; padding: 15px; border-radius: 6px; overflow-x: auto; }
        .metadata { margin-top: 15px; }
        .timestamp { color: #6b7280; font-size: 14px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>FlowScope Debug Session Export</h1>
        ${currentSession ? `
        <p><strong>Session:</strong> ${currentSession.name}</p>
        <p><strong>Created:</strong> ${new Date(currentSession.createdAt).toLocaleString()}</p>
        ` : ''}
        <p><strong>Traces:</strong> ${data.length}</p>
        <p><strong>Exported:</strong> ${new Date().toLocaleString()}</p>
    </div>
    
    ${data.map((trace) => `
    <div class="trace">
        <div class="trace-header">
            <div>
                <span class="trace-type">${trace.type.toUpperCase()}</span>
                <span class="status status-${trace.status || 'pending'}">${trace.status || 'pending'}</span>
            </div>
            ${exportOptions.includeTimestamps ? `<span class="timestamp">${new Date(trace.timestamp).toLocaleString()}</span>` : ''}
        </div>
        
        <p><strong>ID:</strong> <code>${trace.id}</code></p>
        <p><strong>Session ID:</strong> <code>${trace.sessionId}</code></p>
        <p><strong>Chain ID:</strong> <code>${trace.chainId}</code></p>
        ${trace.duration ? `<p><strong>Duration:</strong> ${trace.duration}ms</p>` : ''}
        
        <h4>Data:</h4>
        <pre>${JSON.stringify(trace.data, null, 2)}</pre>
        
        ${exportOptions.includeMetadata && trace.metadata ? `
        <div class="metadata">
            <h4>Metadata:</h4>
            <pre>${JSON.stringify(trace.metadata, null, 2)}</pre>
        </div>
        ` : ''}
    </div>
    `).join('')}
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html' });
    downloadFile(blob, `flowscope-export-${Date.now()}.html`);
  };

  const downloadFile = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExport = () => {
    const data = getFilteredData();
    
    if (data.length === 0) {
      alert('No traces to export with current filters');
      return;
    }

    switch (exportOptions.format) {
      case 'json':
        exportAsJSON(data);
        break;
      case 'csv':
        exportAsCSV(data);
        break;
      case 'markdown':
        exportAsMarkdown(data);
        break;
      case 'html':
        exportAsHTML(data);
        break;
      default:
        alert('Export format not yet implemented');
    }
  };

  const generateShareUrl = () => {
    // In a real application, this would upload to a sharing service
    // For now, we'll generate a mock URL
    const data = getFilteredData();
    const sessionData = {
      session: currentSession,
      traces: data,
      sharedAt: new Date().toISOString()
    };
    
    // Simulate generating a share URL
    const shareId = btoa(JSON.stringify(sessionData)).slice(0, 16);
    const url = `https://flowscope.dev/shared/${shareId}`;
    setShareUrl(url);
  };

  const copyShareUrl = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
  };

  if (!isOpen) return null;

  const data = getFilteredData();
  const traceTypes = ['all', 'prompt', 'response', 'function_call', 'tool_use', 'agent_step', 'error'];
  const statusOptions = ['all', 'completed', 'failed', 'pending'];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Download className="w-5 h-5" />
            Export & Share Session
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Export Format */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Export Format
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { format: 'json', icon: Code, label: 'JSON', desc: 'Structured data format' },
                { format: 'csv', icon: Database, label: 'CSV', desc: 'Spreadsheet compatible' },
                { format: 'markdown', icon: FileText, label: 'Markdown', desc: 'Documentation format' },
                { format: 'html', icon: FileText, label: 'HTML', desc: 'Web page format' }
              ].map(({ format, icon: Icon, label, desc }) => (
                <button
                  key={format}
                  onClick={() => setExportOptions(prev => ({ ...prev, format: format as ExportFormat }))}
                  className={`p-3 border rounded-lg text-left transition-colors ${
                    exportOptions.format === format
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className="w-4 h-4" />
                    <span className="font-medium">{label}</span>
                  </div>
                  <p className="text-xs text-gray-500">{desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Export Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Export Options
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={exportOptions.includeMetadata}
                  onChange={(e) => setExportOptions(prev => ({ ...prev, includeMetadata: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm">Include metadata</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={exportOptions.includeTimestamps}
                  onChange={(e) => setExportOptions(prev => ({ ...prev, includeTimestamps: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm">Include timestamps</span>
              </label>
            </div>
          </div>

          {/* Filters */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <Filter className="w-4 h-4 inline mr-1" />
              Additional Filters
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Trace Type</label>
                <select
                  value={exportOptions.filterByType}
                  onChange={(e) => setExportOptions(prev => ({ ...prev, filterByType: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {traceTypes.map(type => (
                    <option key={type} value={type}>
                      {type === 'all' ? 'All Types' : type.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Status</label>
                <select
                  value={exportOptions.filterByStatus}
                  onChange={(e) => setExportOptions(prev => ({ ...prev, filterByStatus: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {statusOptions.map(status => (
                    <option key={status} value={status}>
                      {status === 'all' ? 'All Status' : status}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <Calendar className="w-4 h-4 inline mr-1" />
              Date Range
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">From</label>
                <input
                  type="datetime-local"
                  value={exportOptions.dateRange.start}
                  onChange={(e) => setExportOptions(prev => ({
                    ...prev,
                    dateRange: { ...prev.dateRange, start: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">To</label>
                <input
                  type="datetime-local"
                  value={exportOptions.dateRange.end}
                  onChange={(e) => setExportOptions(prev => ({
                    ...prev,
                    dateRange: { ...prev.dateRange, end: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="p-3 bg-gray-50 rounded border">
            <div className="text-sm text-gray-600">
              <strong>Export Preview:</strong> {data.length} traces will be exported
            </div>
          </div>

          {/* Share Section */}
          <div className="border-t pt-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <Share2 className="w-4 h-4 inline mr-1" />
              Share Session
            </label>
            <div className="space-y-3">
              {!shareUrl ? (
                <button
                  onClick={generateShareUrl}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Link className="w-4 h-4" />
                  Generate Share Link
                </button>
              ) : (
                <div className="flex gap-2">
                  <input
                    value={shareUrl}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded bg-gray-50 text-sm"
                  />
                  <button
                    onClick={copyShareUrl}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={data.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export ({data.length} traces)
          </button>
        </div>
      </div>
    </div>
  );
};
