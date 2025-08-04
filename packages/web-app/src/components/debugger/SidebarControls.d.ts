import React from 'react';
import type { UISession } from '../../store/debugger';
interface WebSocketStatus {
    connected: boolean;
    connecting: boolean;
    error: string | null;
    lastPing?: number;
}
interface SidebarControlsProps {
    sessions: UISession[];
    currentSession: UISession | null;
    status: WebSocketStatus;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    setCurrentSession: (session: UISession) => void;
    className?: string;
    onOpenTeamManagement?: () => void;
    collapsed?: boolean;
    onExpand?: () => void;
    onCollapse?: () => void;
    activeTab?: 'sessions' | 'team' | 'tools';
    onTabChange?: (tab: 'sessions' | 'team' | 'tools') => void;
    createSession: (name?: string) => UISession;
    deleteSession: (id: string) => void;
    clearTraces: () => void;
    generateCompleteDemo: () => void;
    showNotification?: (notification: {
        title: string;
        message: string;
        onConfirm?: () => void;
        confirmText?: string;
        confirmVariant?: 'danger' | 'primary';
    }) => void;
}
export declare const SidebarControls: React.FC<SidebarControlsProps>;
export {};
