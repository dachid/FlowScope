import React from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { MessageCircle } from 'lucide-react';

interface ResponseNodeData {
  label: string;
  content: unknown;
  metadata?: Record<string, unknown>;
  timestamp: number;
  duration?: number;
  status: 'pending' | 'running' | 'completed' | 'error';
  selected?: boolean;
}

export const ResponseNode: React.FC<NodeProps> = ({ data, selected }) => {
  const nodeData = data as unknown as ResponseNodeData;
  
  const getStatusColor = () => {
    switch (nodeData.status) {
      case 'pending':
        return 'border-green-300 bg-green-50';
      case 'running':
        return 'border-green-400 bg-green-100 animate-pulse';
      case 'completed':
        return 'border-green-500 bg-green-100';
      case 'error':
        return 'border-red-300 bg-red-50';
      default:
        return 'border-green-300 bg-green-50';
    }
  };

  return (
    <div
      className={`px-4 py-3 shadow-lg rounded-lg border-2 transition-all duration-200 min-w-[200px] max-w-[300px] ${
        selected ? 'ring-2 ring-green-500 ring-offset-2' : ''
      } ${getStatusColor()}`}
    >
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      
      <div className="flex items-center gap-2 mb-2">
        <MessageCircle className="w-4 h-4 text-green-600" />
        <span className="font-medium text-sm text-gray-900">Response</span>
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
