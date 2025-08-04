import React from 'react';
import { Wifi, WifiOff, AlertCircle, Loader2 } from 'lucide-react';

interface WebSocketStatus {
  connected: boolean;
  connecting: boolean;
  error: string | null;
  lastPing?: number;
}

interface WebSocketIndicatorProps {
  status: WebSocketStatus;
  onReconnect?: () => void;
  className?: string;
}

export const WebSocketIndicator: React.FC<WebSocketIndicatorProps> = ({
  status,
  onReconnect,
  className = '',
}) => {
  const getStatusInfo = () => {
    if (status.connecting) {
      return {
        icon: Loader2,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        label: 'Connecting...',
        pulse: true,
      };
    }

    if (status.error) {
      return {
        icon: AlertCircle,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        label: 'Connection Error',
        pulse: false,
      };
    }

    if (status.connected) {
      return {
        icon: Wifi,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        label: 'Connected',
        pulse: false,
      };
    }

    return {
      icon: WifiOff,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      label: 'Disconnected',
      pulse: false,
    };
  };

  const statusInfo = getStatusInfo();
  const Icon = statusInfo.icon;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`p-2 rounded-lg ${statusInfo.bgColor}`}>
        <Icon 
          className={`w-4 h-4 ${statusInfo.color} ${statusInfo.pulse ? 'animate-spin' : ''}`} 
        />
      </div>
      
      <div className="flex flex-col">
        <span className={`text-sm font-medium ${statusInfo.color}`}>
          {statusInfo.label}
        </span>
        
        {status.error && (
          <span className="text-xs text-red-500 truncate max-w-xs">
            {status.error}
          </span>
        )}
        
        {status.connected && status.lastPing && (
          <span className="text-xs text-gray-500">
            Last ping: {new Date(status.lastPing).toLocaleTimeString()}
          </span>
        )}
      </div>
      
      {(status.error || !status.connected) && onReconnect && (
        <button
          onClick={onReconnect}
          disabled={status.connecting}
          className="ml-2 px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {status.connecting ? 'Connecting...' : 'Reconnect'}
        </button>
      )}
    </div>
  );
};
