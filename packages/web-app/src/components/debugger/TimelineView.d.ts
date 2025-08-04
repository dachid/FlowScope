import React from 'react';
import type { TraceData } from '@flowscope/shared';
interface TimelineViewProps {
    onSelectTrace?: (trace: TraceData) => void;
    selectedTraceId?: string;
}
export declare const TimelineView: React.FC<TimelineViewProps>;
export {};
