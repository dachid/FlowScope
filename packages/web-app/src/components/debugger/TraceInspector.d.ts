import React from 'react';
import type { TraceData } from '@flowscope/shared';
interface TraceInspectorProps {
    trace: TraceData;
    onBookmark?: (traceId: string) => void;
    isBookmarked?: boolean;
}
export declare const TraceInspector: React.FC<TraceInspectorProps>;
export {};
