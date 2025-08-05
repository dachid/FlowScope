import React from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Zap } from 'lucide-react';

interface FunctionCallNodeData {
  label: string;
  content: unknown;
  metadata?: Record<string, unknown>;
  timestamp: number;
  duration?: number;
  status: 'pending' | 'running' | 'completed' | 'error';
  selected?: boolean;
}

export const FunctionCallNode: React.FC<NodeProps> = ({ data, selected }) => {
  const nodeData = data as unknown as FunctionCallNodeData;
  
  const getStatusColor = () => {
    switch (nodeData.status) {
      case 'pending':
        return 'border-yellow-300 bg-yellow-50';
      case 'running':
        return 'border-blue-300 bg-blue-50 animate-pulse';
      case 'completed':
        return 'border-orange-300 bg-orange-50';
      case 'error':
        return 'border-red-300 bg-red-50';
      default:
        return 'border-gray-300 bg-white';
    }
  };

  return (
    <div
      className={`px-4 py-3 shadow-lg rounded-lg border-2 transition-all duration-200 min-w-[200px] max-w-[300px] ${
        selected ? 'ring-2 ring-orange-500 ring-offset-2' : ''
      } ${getStatusColor()}`}
    >
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      
      <div className="flex items-center gap-2 mb-2">
        <Zap className="w-4 h-4 text-orange-600" />
        <span className="font-medium text-sm text-gray-900">Function Call</span>
        {nodeData.duration && (
          <span className="text-xs text-gray-500 ml-auto">
            {nodeData.duration}ms
          </span>
        )}
      </div>
      
      <div className="text-sm text-gray-700 mb-2 line-clamp-3">
        {nodeData.label}
      </div>
      
      {nodeData.metadata && (
        <div className="text-xs text-gray-500">
          {Object.entries(nodeData.metadata).slice(0, 2).map(([key, value]) => (
            <div key={key} className="truncate">
              {key}: {String(value)}
            </div>
          ))}
        </div>
      )}
      
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
};
