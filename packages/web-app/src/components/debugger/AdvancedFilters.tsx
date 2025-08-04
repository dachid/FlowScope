import React, { useState } from 'react';
import { 
  Filter, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  X
} from 'lucide-react';
import { useDebuggerStore } from '../../store/debugger';

interface FilterCriteria {
  types: string[];
  status: string[];
  timeRange: {
    start: Date | null;
    end: Date | null;
  };
  durationRange: {
    min: number | null;
    max: number | null;
  };
  search: string;
  hasErrors: boolean | null;
}

interface AdvancedFiltersProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({ isOpen, onClose }) => {
  const { traces, setFilterCriteria } = useDebuggerStore();
  
  const [filters, setFilters] = useState<FilterCriteria>({
    types: [],
    status: [],
    timeRange: { start: null, end: null },
    durationRange: { min: null, max: null },
    search: '',
    hasErrors: null
  });

  const traceTypes = ['prompt', 'response', 'function_call', 'tool_use', 'agent_step', 'error'];
  const statusOptions = ['pending', 'completed', 'failed'];

  const applyFilters = () => {
    let filtered = [...traces];

    // Filter by type
    if (filters.types.length > 0) {
      filtered = filtered.filter(trace => filters.types.includes(trace.type));
    }

    // Filter by status
    if (filters.status.length > 0) {
      filtered = filtered.filter(trace => 
        trace.status && filters.status.includes(trace.status)
      );
    }

    // Filter by time range
    if (filters.timeRange.start || filters.timeRange.end) {
      filtered = filtered.filter(trace => {
        const traceDate = new Date(trace.timestamp);
        if (filters.timeRange.start && traceDate < filters.timeRange.start) return false;
        if (filters.timeRange.end && traceDate > filters.timeRange.end) return false;
        return true;
      });
    }

    // Filter by duration range
    if (filters.durationRange.min !== null || filters.durationRange.max !== null) {
      filtered = filtered.filter(trace => {
        if (!trace.duration) return false;
        if (filters.durationRange.min !== null && trace.duration < filters.durationRange.min) return false;
        if (filters.durationRange.max !== null && trace.duration > filters.durationRange.max) return false;
        return true;
      });
    }

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(trace => 
        JSON.stringify(trace.data).toLowerCase().includes(searchLower) ||
        (trace.metadata && JSON.stringify(trace.metadata).toLowerCase().includes(searchLower))
      );
    }

    // Error filter
    if (filters.hasErrors !== null) {
      if (filters.hasErrors) {
        filtered = filtered.filter(trace => 
          trace.type === 'error' || trace.status === 'failed'
        );
      } else {
        filtered = filtered.filter(trace => 
          trace.type !== 'error' && trace.status !== 'failed'
        );
      }
    }

    // Apply filters through store
    setFilterCriteria({
      status: filters.status.length > 0 ? filters.status[0] : undefined,
      type: filters.types.length > 0 ? filters.types[0] : undefined,
      searchTerm: filters.search || undefined,
      timeRange: filters.timeRange.start && filters.timeRange.end ? {
        start: filters.timeRange.start,
        end: filters.timeRange.end
      } : undefined
    });
  };

  const clearFilters = () => {
    setFilters({
      types: [],
      status: [],
      timeRange: { start: null, end: null },
      durationRange: { min: null, max: null },
      search: '',
      hasErrors: null
    });
    setFilterCriteria({});
  };

  const toggleType = (type: string) => {
    setFilters(prev => ({
      ...prev,
      types: prev.types.includes(type)
        ? prev.types.filter(t => t !== type)
        : [...prev.types, type]
    }));
  };

  const toggleStatus = (status: string) => {
    setFilters(prev => ({
      ...prev,
      status: prev.status.includes(status)
        ? prev.status.filter(s => s !== status)
        : [...prev.status, status]
    }));
  };

  React.useEffect(() => {
    applyFilters();
  }, [filters, traces]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Advanced Filters
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search in trace content
            </label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              placeholder="Search traces..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Trace Types */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Trace Types
            </label>
            <div className="flex flex-wrap gap-2">
              {traceTypes.map(type => (
                <button
                  key={type}
                  onClick={() => toggleType(type)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    filters.types.includes(type)
                      ? 'bg-blue-100 text-blue-800 border border-blue-300'
                      : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                  }`}
                >
                  {type.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <div className="flex flex-wrap gap-2">
              {statusOptions.map(status => (
                <button
                  key={status}
                  onClick={() => toggleStatus(status)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors flex items-center gap-1 ${
                    filters.status.includes(status)
                      ? 'bg-blue-100 text-blue-800 border border-blue-300'
                      : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                  }`}
                >
                  {status === 'completed' && <CheckCircle className="w-3 h-3" />}
                  {status === 'failed' && <XCircle className="w-3 h-3" />}
                  {status === 'pending' && <Clock className="w-3 h-3" />}
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Error Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Error Status
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setFilters(prev => ({ ...prev, hasErrors: true }))}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors flex items-center gap-1 ${
                  filters.hasErrors === true
                    ? 'bg-red-100 text-red-800 border border-red-300'
                    : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                }`}
              >
                <AlertTriangle className="w-3 h-3" />
                Errors Only
              </button>
              <button
                onClick={() => setFilters(prev => ({ ...prev, hasErrors: false }))}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors flex items-center gap-1 ${
                  filters.hasErrors === false
                    ? 'bg-green-100 text-green-800 border border-green-300'
                    : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                }`}
              >
                <CheckCircle className="w-3 h-3" />
                No Errors
              </button>
              <button
                onClick={() => setFilters(prev => ({ ...prev, hasErrors: null }))}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  filters.hasErrors === null
                    ? 'bg-blue-100 text-blue-800 border border-blue-300'
                    : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                }`}
              >
                All
              </button>
            </div>
          </div>

          {/* Time Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time Range
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">From</label>
                <input
                  type="datetime-local"
                  value={filters.timeRange.start?.toISOString().slice(0, 16) || ''}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    timeRange: { ...prev.timeRange, start: e.target.value ? new Date(e.target.value) : null }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">To</label>
                <input
                  type="datetime-local"
                  value={filters.timeRange.end?.toISOString().slice(0, 16) || ''}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    timeRange: { ...prev.timeRange, end: e.target.value ? new Date(e.target.value) : null }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Duration Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Duration Range (ms)
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Min</label>
                <input
                  type="number"
                  value={filters.durationRange.min || ''}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    durationRange: { ...prev.durationRange, min: e.target.value ? Number(e.target.value) : null }
                  }))}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Max</label>
                <input
                  type="number"
                  value={filters.durationRange.max || ''}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    durationRange: { ...prev.durationRange, max: e.target.value ? Number(e.target.value) : null }
                  }))}
                  placeholder="∞"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
          <button
            onClick={clearFilters}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Clear All
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
};
