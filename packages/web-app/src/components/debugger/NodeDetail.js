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
exports.NodeDetail = void 0;
const react_1 = __importStar(require("react"));
const lucide_react_1 = require("lucide-react");
const debugger_1 = require("../../store/debugger");
const NodeDetail = ({ nodeId }) => {
    const { nodes, filteredTraces } = (0, debugger_1.useDebuggerStore)(); // Use filteredTraces instead of traces
    const [collapsedSections, setCollapsedSections] = (0, react_1.useState)(new Set());
    const [copiedText, setCopiedText] = (0, react_1.useState)(null);
    if (!nodeId)
        return null;
    const node = nodes.find(n => n.id === nodeId);
    const relatedTrace = filteredTraces.find(t => t.id === nodeId); // Use filteredTraces
    if (!node)
        return null;
    const toggleSection = (sectionId) => {
        const newCollapsed = new Set(collapsedSections);
        if (newCollapsed.has(sectionId)) {
            newCollapsed.delete(sectionId);
        }
        else {
            newCollapsed.add(sectionId);
        }
        setCollapsedSections(newCollapsed);
    };
    const copyToClipboard = async (text, label) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedText(label);
            setTimeout(() => setCopiedText(null), 2000);
        }
        catch (err) {
            console.error('Failed to copy text:', err);
        }
    };
    const truncateText = (text, maxLength = 150) => {
        if (text.length <= maxLength)
            return text;
        return text.substring(0, maxLength) + '...';
    };
    const CollapsibleSection = ({ id, title, icon, children, defaultExpanded = true }) => {
        const isExpanded = defaultExpanded ? !collapsedSections.has(id) : collapsedSections.has(id);
        return (<div>
        <button onClick={() => toggleSection(id)} className="flex items-center gap-2 w-full text-left mb-3 hover:bg-gray-50 p-1 rounded transition-colors">
          {isExpanded ? (<lucide_react_1.ChevronDown className="w-4 h-4 text-gray-400"/>) : (<lucide_react_1.ChevronRight className="w-4 h-4 text-gray-400"/>)}
          {icon}
          <h3 className="text-sm font-medium text-gray-900">{title}</h3>
        </button>
        {isExpanded && children}
      </div>);
    };
    const CopyableText = ({ text, label, className = "", truncated = false }) => {
        const displayText = truncated ? truncateText(text) : text;
        const isCopied = copiedText === label;
        return (<div className="relative group">
        <pre className={`${className} break-words overflow-wrap-anywhere whitespace-pre-wrap`}>
          {displayText}
        </pre>
        <button onClick={() => copyToClipboard(text, label)} className="absolute top-1 right-1 p-1 bg-white/80 hover:bg-white border border-gray-200 rounded opacity-0 group-hover:opacity-100 transition-opacity" title="Copy to clipboard">
          {isCopied ? (<lucide_react_1.Check className="w-3 h-3 text-green-600"/>) : (<lucide_react_1.Copy className="w-3 h-3 text-gray-500"/>)}
        </button>
      </div>);
    };
    const renderContent = (content) => {
        if (typeof content === 'string') {
            return content;
        }
        if (content === null || content === undefined) {
            return '';
        }
        try {
            return JSON.stringify(content, null, 2);
        }
        catch (error) {
            return String(content);
        }
    };
    const formatTimestamp = (timestamp) => {
        return new Date(timestamp).toLocaleString();
    };
    const formatDuration = (duration) => {
        if (!duration)
            return 'N/A';
        if (duration < 1000)
            return `${duration}ms`;
        return `${(duration / 1000).toFixed(2)}s`;
    };
    const getStatusColor = (status) => {
        switch (status) {
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'running':
                return 'bg-blue-100 text-blue-800';
            case 'completed':
                return 'bg-green-100 text-green-800';
            case 'error':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };
    return (<div className="h-full bg-white flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Node Details</h2>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Basic Info */}
          <CollapsibleSection id="basic" title="Basic Information" icon={<lucide_react_1.Tag className="w-4 h-4"/>}>
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <span className="text-sm text-gray-500 min-w-0">Type</span>
                <span className="text-sm font-medium text-gray-900 capitalize text-right">
                  {node.type.replace('_', ' ')}
                </span>
              </div>
              <div className="flex items-start justify-between gap-2">
                <span className="text-sm text-gray-500 min-w-0">Status</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(node.data.status)}`}>
                  {node.data.status}
                </span>
              </div>
              <div className="flex items-start justify-between gap-2">
                <span className="text-sm text-gray-500 min-w-0">ID</span>
                <CopyableText text={node.id} label="ID" className="text-sm font-mono text-gray-900 text-right text-xs" truncated={true}/>
              </div>
            </div>
          </CollapsibleSection>

          {/* Timing */}
          <CollapsibleSection id="timing" title="Timing" icon={<lucide_react_1.Clock className="w-4 h-4"/>}>
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <span className="text-sm text-gray-500 min-w-0">Timestamp</span>
                <span className="text-sm text-gray-900 text-right text-xs">
                  {formatTimestamp(node.data.timestamp)}
                </span>
              </div>
              <div className="flex items-start justify-between gap-2">
                <span className="text-sm text-gray-500 min-w-0">Duration</span>
                <span className="text-sm text-gray-900 text-right">
                  {formatDuration(node.data.duration)}
                </span>
              </div>
            </div>
          </CollapsibleSection>

          {/* Content */}
          <CollapsibleSection id="content" title="Content" icon={<lucide_react_1.Code className="w-4 h-4"/>}>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-sm text-gray-900 mb-2 font-medium break-words">
                {node.data.label}
              </div>
              {node.data.content ? (<CopyableText text={renderContent(node.data.content)} label="Content" className="text-xs text-gray-600 font-mono whitespace-pre-wrap break-words max-h-48 overflow-y-auto"/>) : null}
            </div>
          </CollapsibleSection>

          {/* Metadata */}
          {node.data.metadata && Object.keys(node.data.metadata).length > 0 && (<CollapsibleSection id="metadata" title="Metadata" icon={<lucide_react_1.Tag className="w-4 h-4"/>}>
              <div className="space-y-3">
                {Object.entries(node.data.metadata).map(([key, value]) => (<div key={key} className="border-b border-gray-100 pb-2 last:border-b-0">
                    <div className="text-sm text-gray-500 mb-1">{key}</div>
                    <CopyableText text={typeof value === 'object' && value !== null ? JSON.stringify(value, null, 2) : String(value ?? '')} label={`Metadata: ${key}`} className="text-xs text-gray-900 font-mono bg-gray-50 p-2 rounded" truncated={typeof value === 'string' && value.length > 100}/>
                  </div>))}
              </div>
            </CollapsibleSection>)}

          {/* Trace Data */}
          {relatedTrace && (<CollapsibleSection id="trace" title="Trace Data" icon={<lucide_react_1.AlertCircle className="w-4 h-4"/>} defaultExpanded={false}>
              <div className="bg-gray-50 rounded-lg p-3">
                <CopyableText text={JSON.stringify(relatedTrace || {}, null, 2)} label="Trace Data" className="text-xs text-gray-600 font-mono whitespace-pre-wrap break-words max-h-64 overflow-y-auto block"/>
              </div>
            </CollapsibleSection>)}
        </div>
      </div>
    </div>);
};
exports.NodeDetail = NodeDetail;
