"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromptNode = void 0;
const react_1 = __importDefault(require("react"));
const react_2 = require("@xyflow/react");
const lucide_react_1 = require("lucide-react");
const PromptNode = ({ data, selected }) => {
    const nodeData = data;
    const getStatusColor = () => {
        switch (nodeData.status) {
            case 'pending':
                return 'border-blue-300 bg-blue-50';
            case 'running':
                return 'border-blue-400 bg-blue-100 animate-pulse';
            case 'completed':
                return 'border-blue-500 bg-blue-100';
            case 'error':
                return 'border-red-300 bg-red-50';
            default:
                return 'border-blue-300 bg-blue-50';
        }
    };
    return (<div className={`px-4 py-3 shadow-lg rounded-lg border-2 transition-all duration-200 min-w-[200px] max-w-[300px] ${selected ? 'ring-2 ring-blue-500 ring-offset-2' : ''} ${getStatusColor()}`}>
      <react_2.Handle type="target" position={react_2.Position.Top} className="w-3 h-3"/>
      
      <div className="flex items-center gap-2 mb-2">
        <lucide_react_1.MessageSquare className="w-4 h-4 text-blue-600"/>
        <span className="font-medium text-sm text-gray-900">Prompt</span>
        {nodeData.duration && (<span className="text-xs text-gray-500 ml-auto">
            {nodeData.duration}ms
          </span>)}
      </div>
      
      <div className="text-sm text-gray-700 mb-2 line-clamp-3">
        {nodeData.label}
      </div>
      
      {nodeData.metadata && (<div className="text-xs text-gray-500">
          {Object.entries(nodeData.metadata).slice(0, 2).map(([key, value]) => (<div key={key} className="truncate">
              {key}: {String(value)}
            </div>))}
        </div>)}
      
      <react_2.Handle type="source" position={react_2.Position.Bottom} className="w-3 h-3"/>
    </div>);
};
exports.PromptNode = PromptNode;
