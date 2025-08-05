import * as vscode from 'vscode';
import { FlowScopeApiClient } from '../services/apiClient';
import { TraceData } from '@flowscope/shared';
export declare class TraceTreeItem extends vscode.TreeItem {
    readonly trace: TraceData;
    readonly collapsibleState: vscode.TreeItemCollapsibleState;
    constructor(trace: TraceData, collapsibleState: vscode.TreeItemCollapsibleState);
}
export declare class TracesTreeDataProvider implements vscode.TreeDataProvider<TraceTreeItem> {
    private apiClient;
    private _onDidChangeTreeData;
    readonly onDidChangeTreeData: vscode.Event<TraceTreeItem | undefined | null | void>;
    private traces;
    constructor(apiClient: FlowScopeApiClient);
    refresh(): void;
    getTreeItem(element: TraceTreeItem): vscode.TreeItem;
    getChildren(element?: TraceTreeItem): Thenable<TraceTreeItem[]>;
    private loadTraces;
}
