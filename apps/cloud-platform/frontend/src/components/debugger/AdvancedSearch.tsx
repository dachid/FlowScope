import React, { useState, useEffect, useMemo } from 'react';
import { useDebuggerStore } from '../../store/debugger';
import type { TraceStatus } from '../../types';

interface SearchFilters {
  searchTerm: string;
  status: TraceStatus | 'all';
  type: string;
  timeRange: 'all' | 'last-hour' | 'last-day' | 'last-week' | 'custom';
  startDate: string;
  endDate: string;
  hasError: boolean;
  sortBy: 'timestamp' | 'type' | 'executionTime' | 'status';
  sortOrder: 'asc' | 'desc';
}

interface AdvancedSearchProps {
  className?: string;
}

export const AdvancedSearch: React.FC<AdvancedSearchProps> = ({ className = '' }) => {
  const { traces, setFilteredTraces } = useDebuggerStore();
  
  const [filters, setFilters] = useState<SearchFilters>({
    searchTerm: '',
    status: 'all',
    type: '',
    timeRange: 'all',
    startDate: '',
    endDate: '',
    hasError: false,
    sortBy: 'timestamp',
    sortOrder: 'desc'
  });

  const [showAdvanced, setShowAdvanced] = useState(false);

  // Get unique trace types for filter dropdown
  const traceTypes = useMemo(() => {
    const types = new Set(traces.map(trace => trace.type));
    return Array.from(types).sort();
  }, [traces]);

  // Apply filters and search
  const filteredAndSortedTraces = useMemo(() => {
    let filtered = [...traces];

    // Text search
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(trace => 
        trace.type.toLowerCase().includes(term) ||
        trace.id.toLowerCase().includes(term) ||
        JSON.stringify(trace.data).toLowerCase().includes(term) ||
        JSON.stringify(trace.metadata).toLowerCase().includes(term)
      );
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(trace => trace.status === filters.status);
    }

    // Type filter
    if (filters.type) {
      filtered = filtered.filter(trace => trace.type === filters.type);
    }

    // Error filter
    if (filters.hasError) {
      filtered = filtered.filter(trace => 
        trace.status === 'failed'
      );
    }

    // Time range filter
    if (filters.timeRange !== 'all') {
      const now = Date.now();
      let startTime = 0;

      switch (filters.timeRange) {
        case 'last-hour':
          startTime = now - (60 * 60 * 1000);
          break;
        case 'last-day':
          startTime = now - (24 * 60 * 60 * 1000);
          break;
        case 'last-week':
          startTime = now - (7 * 24 * 60 * 60 * 1000);
          break;
        case 'custom':
          if (filters.startDate) {
            startTime = new Date(filters.startDate).getTime();
          }
          if (filters.endDate) {
            const endTime = new Date(filters.endDate).getTime();
            filtered = filtered.filter(trace => trace.timestamp <= endTime);
          }
          break;
      }

      if (startTime > 0) {
        filtered = filtered.filter(trace => trace.timestamp >= startTime);
      }
    }

    // Sort results
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (filters.sortBy) {
        case 'timestamp':
          aValue = a.timestamp;
          bValue = b.timestamp;
          break;
        case 'type':
          aValue = a.type;
          bValue = b.type;
          break;
        case 'executionTime':
          aValue = a.duration || 0;
          bValue = b.duration || 0;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          aValue = a.timestamp;
          bValue = b.timestamp;
      }

      if (aValue < bValue) return filters.sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return filters.sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [traces, filters]);

  // Update filtered traces when results change
  useEffect(() => {
    setFilteredTraces(filteredAndSortedTraces);
  }, [filteredAndSortedTraces, setFilteredTraces]);

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      searchTerm: '',
      status: 'all',
      type: '',
      timeRange: 'all',
      startDate: '',
      endDate: '',
      hasError: false,
      sortBy: 'timestamp',
      sortOrder: 'desc'
    });
  };

  const hasActiveFilters = 
    filters.searchTerm ||
    filters.status !== 'all' ||
    filters.type ||
    filters.timeRange !== 'all' ||
    filters.hasError;

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Advanced Search</h3>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Clear all
            </button>
          )}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            {showAdvanced ? 'Simple' : 'Advanced'}
          </button>
        </div>
      </div>

      {/* Search bar */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search traces..."
          value={filters.searchTerm}
          onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Quick filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <select
          value={filters.status}
          onChange={(e) => handleFilterChange('status', e.target.value as TraceStatus | 'all')}
          className="px-3 py-1 border border-gray-300 rounded text-sm"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
          <option value="cancelled">Cancelled</option>
          <option value="error">Error</option>
        </select>

        <select
          value={filters.type}
          onChange={(e) => handleFilterChange('type', e.target.value)}
          className="px-3 py-1 border border-gray-300 rounded text-sm"
        >
          <option value="">All Types</option>
          {traceTypes.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>

        <select
          value={filters.timeRange}
          onChange={(e) => handleFilterChange('timeRange', e.target.value)}
          className="px-3 py-1 border border-gray-300 rounded text-sm"
        >
          <option value="all">All Time</option>
          <option value="last-hour">Last Hour</option>
          <option value="last-day">Last Day</option>
          <option value="last-week">Last Week</option>
          <option value="custom">Custom Range</option>
        </select>

        <label className="flex items-center gap-1 text-sm">
          <input
            type="checkbox"
            checked={filters.hasError}
            onChange={(e) => handleFilterChange('hasError', e.target.checked)}
          />
          Errors only
        </label>
      </div>

      {/* Advanced options */}
      {showAdvanced && (
        <div className="space-y-4 p-4 bg-gray-50 rounded">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Custom date range */}
            {filters.timeRange === 'custom' && (
              <div className="col-span-2 grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="datetime-local"
                    value={filters.startDate}
                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="datetime-local"
                    value={filters.endDate}
                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  />
                </div>
              </div>
            )}

            {/* Sort options */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sort by
              </label>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              >
                <option value="timestamp">Timestamp</option>
                <option value="type">Type</option>
                <option value="executionTime">Execution Time</option>
                <option value="status">Status</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Order
              </label>
              <select
                value={filters.sortOrder}
                onChange={(e) => handleFilterChange('sortOrder', e.target.value as 'asc' | 'desc')}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              >
                <option value="desc">Newest first</option>
                <option value="asc">Oldest first</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Results summary */}
      <div className="mt-4 text-sm text-gray-600">
        Showing {filteredAndSortedTraces.length} of {traces.length} traces
        {hasActiveFilters && (
          <span className="text-blue-600 ml-1">(filtered)</span>
        )}
      </div>
    </div>
  );
};
