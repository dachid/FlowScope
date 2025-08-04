import React from 'react';
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
export declare const WebSocketIndicator: React.FC<WebSocketIndicatorProps>;
export {};
