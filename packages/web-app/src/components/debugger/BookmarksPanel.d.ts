import React from 'react';
interface BookmarksPanel {
    onSelectTrace?: (traceId: string) => void;
    selectedTraceId?: string;
}
export declare const BookmarksPanel: React.FC<BookmarksPanel>;
export {};
