import * as vscode from 'vscode';
import { FlowScopeApiClient } from '../services/apiClient';
export declare class BookmarkTreeItem extends vscode.TreeItem {
    readonly bookmark: any;
    readonly collapsibleState: vscode.TreeItemCollapsibleState;
    constructor(bookmark: any, collapsibleState: vscode.TreeItemCollapsibleState);
}
export declare class BookmarksTreeDataProvider implements vscode.TreeDataProvider<BookmarkTreeItem> {
    private apiClient;
    private _onDidChangeTreeData;
    readonly onDidChangeTreeData: vscode.Event<BookmarkTreeItem | undefined | null | void>;
    private bookmarks;
    constructor(apiClient: FlowScopeApiClient);
    refresh(): void;
    getTreeItem(element: BookmarkTreeItem): vscode.TreeItem;
    getChildren(element?: BookmarkTreeItem): Promise<BookmarkTreeItem[]>;
    private loadBookmarks;
}
