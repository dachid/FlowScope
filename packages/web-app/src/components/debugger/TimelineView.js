"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimelineView = void 0;
const react_1 = __importStar(require("react"));
const lucide_react_1 = require("lucide-react");
const debugger_1 = require("../../store/debugger");
const TimelineView = ({ onSelectTrace, selectedTraceId }) => {
    const { filteredTraces } = (0, debugger_1.useDebuggerStore)();
    const [searchTerm, setSearchTerm] = (0, react_1.useState)('');
    const [filterType, setFilterType] = (0, react_1.useState)('all');
    const [expandedGroups, setExpandedGroups] = (0, react_1.useState)(new Set());
    // Group traces by date
    const timelineGroups = (0, react_1.useMemo)(() => {
        let traces = filteredTraces;
        // Apply search filter
        if (searchTerm) {
            traces = traces.filter(trace => JSON.stringify(trace.data).toLowerCase().includes(searchTerm.toLowerCase()) ||
                trace.type.toLowerCase().includes(searchTerm.toLowerCase()));
        }
        // Apply type filter
        if (filterType !== 'all') {
            traces = traces.filter(trace => trace.type === filterType);
        }
        // Group by date
        const groups = {};
        traces.forEach(trace => {
            const date = new Date(trace.timestamp).toDateString();
            if (!groups[date]) {
                groups[date] = [];
            }
            groups[date].push(trace);
        });
        // Sort traces within each group by timestamp
        Object.keys(groups).forEach(date => {
            groups[date].sort((a, b) => a.timestamp - b.timestamp);
        });
        // Convert to array and sort by date (newest first)
        return Object.entries(groups)
            .map(([date, traces]) => ({ date, traces }))
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [filteredTraces, searchTerm, filterType]);
    const toggleGroup = (date) => {
        setExpandedGroups(prev => {
            const newSet = new Set(prev);
            if (newSet.has(date)) {
                newSet.delete(date);
            }
            else {
                newSet.add(date);
            }
            return newSet;
        });
    };
    const getTraceIcon = (trace) => {
        switch (trace.status) {
            case 'completed':
                return <lucide_react_1.CheckCircle className="w-4 h-4 text-green-500"/>;
            case 'failed':
                return <lucide_react_1.XCircle className="w-4 h-4 text-red-500"/>;
            default:
                return <lucide_react_1.Clock className="w-4 h-4 text-yellow-500"/>;
        }
    };
    const getTraceTypeColor = (type) => {
        switch (type) {
            case 'prompt':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'response':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'function_call':
            case 'tool_use':
                return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'error':
                return 'bg-red-100 text-red-800 border-red-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };
    const formatTime = (timestamp) => {
        return new Date(timestamp).toLocaleTimeString();
    };
    const formatDuration = (ms) => {
        if (!ms)
            return '';
        if (ms < 1000)
            return `${ms}ms`;
        if (ms < 60000)
            return `${(ms / 1000).toFixed(1)}s`;
        return `${(ms / 60000).toFixed(1)}m`;
    };
    const getTracePreview = (trace) => {
        if (typeof trace.data === 'string') {
            return trace.data.slice(0, 100) + (trace.data.length > 100 ? '...' : '');
        }
        if (trace.data && typeof trace.data === 'object') {
            if (trace.data.content) {
                return trace.data.content.slice(0, 100) + '...';
            }
            if (trace.data.message) {
                return trace.data.message.slice(0, 100) + '...';
            }
            if (trace.data.text) {
                return trace.data.text.slice(0, 100) + '...';
            }
        }
        return JSON.stringify(trace.data).slice(0, 100) + '...';
    };
    const traceTypes = ['all', 'prompt', 'response', 'function_call', 'tool_use', 'agent_step', 'error'];
    return (<div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <lucide_react_1.Calendar className="w-5 h-5"/>
            Timeline View
          </h2>
          <div className="text-sm text-gray-500">
            {filteredTraces.length} traces
          </div>
        </div>

        {/* Search and Filter */}
        <div className="space-y-3">
          <div className="relative">
            <lucide_react_1.Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"/>
            <input type="text" placeholder="Search traces..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"/>
          </div>

          <div className="flex items-center gap-2">
            <lucide_react_1.Filter className="w-4 h-4 text-gray-400"/>
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              {traceTypes.map(type => (<option key={type} value={type}>
                  {type === 'all' ? 'All Types' : type.replace('_', ' ')}
                </option>))}
            </select>
          </div>
        </div>
      </div>

      {/* Timeline Content */}
      <div className="flex-1 overflow-y-auto">
        {timelineGroups.length === 0 ? (<div className="flex items-center justify-center h-64 text-gray-500">
            <div className="text-center">
              <lucide_react_1.Calendar className="w-12 h-12 text-gray-300 mx-auto mb-2"/>
              <p>No traces found</p>
              <p className="text-sm">Try adjusting your filters</p>
            </div>
          </div>) : (<div className="p-4 space-y-4">
            {timelineGroups.map(group => {
                const isExpanded = expandedGroups.has(group.date);
                return (<div key={group.date} className="border border-gray-200 rounded-lg">
                  {/* Date Header */}
                  <button onClick={() => toggleGroup(group.date)} className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-2">
                      <lucide_react_1.ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}/>
                      <span className="font-medium text-gray-900">{group.date}</span>
                      <span className="text-sm text-gray-500">
                        ({group.traces.length} traces)
                      </span>
                    </div>
                  </button>

                  {/* Traces List */}
                  {isExpanded && (<div className="border-t border-gray-200">
                      {group.traces.map((trace, index) => (<div key={trace.id} onClick={() => onSelectTrace?.(trace)} className={`p-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 cursor-pointer transition-colors ${selectedTraceId === trace.id ? 'bg-blue-50 border-blue-200' : ''}`}>
                          <div className="flex items-start gap-3">
                            {/* Timeline Line */}
                            <div className="relative flex flex-col items-center">
                              <div className="w-8 h-8 rounded-full border-2 border-gray-300 bg-white flex items-center justify-center">
                                {getTraceIcon(trace)}
                              </div>
                              {index < group.traces.length - 1 && (<div className="w-px h-16 bg-gray-200 mt-2"/>)}
                            </div>

                            {/* Trace Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getTraceTypeColor(trace.type)}`}>
                                  {trace.type.replace('_', ' ')}
                                </span>
                                <span className="text-xs text-gray-500">{formatTime(trace.timestamp)}</span>
                                {trace.duration && (<span className="text-xs text-gray-500 flex items-center gap-1">
                                    <lucide_react_1.Zap className="w-3 h-3"/>
                                    {formatDuration(trace.duration)}
                                  </span>)}
                              </div>

                              <div className="text-sm text-gray-900 mb-1">
                                {getTracePreview(trace)}
                              </div>

                              {trace.metadata && Object.keys(trace.metadata).length > 0 && (<div className="text-xs text-gray-500">
                                  {Object.keys(trace.metadata).length} metadata fields
                                </div>)}

                              {(trace.type === 'error' || trace.status === 'failed') && (<div className="flex items-center gap-1 text-xs text-red-600 mt-1">
                                  <lucide_react_1.AlertTriangle className="w-3 h-3"/>
                                  Error occurred
                                </div>)}
                            </div>
                          </div>
                        </div>))}
                    </div>)}
                </div>);
            })}
          </div>)}
      </div>
    </div>);
};
exports.TimelineView = TimelineView;
