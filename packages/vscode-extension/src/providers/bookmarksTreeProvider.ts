import * as vscode from 'vscode';
import { FlowScopeApiClient } from '../services/apiClient';

export class BookmarkTreeItem extends vscode.TreeItem {
    constructor(
        public readonly bookmark: any,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState
    ) {
        super(bookmark.description || `Trace ${bookmark.traceId}`, collapsibleState);
        
        this.description = new Date(bookmark.timestamp).toLocaleDateString();
        this.tooltip = `Bookmark: ${bookmark.description || 'No description'}`;
        this.contextValue = 'bookmark';
        this.iconPath = new vscode.ThemeIcon('bookmark');
        
        // Command to select bookmarked trace
        this.command = {
            command: 'flowscope.selectTrace',
            title: 'Select Bookmarked Trace',
            arguments: [bookmark.traceId]
        };
    }
}

export class BookmarksTreeDataProvider implements vscode.TreeDataProvider<BookmarkTreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<BookmarkTreeItem | undefined | null | void> = new vscode.EventEmitter<BookmarkTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<BookmarkTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private bookmarks: any[] = [];

    constructor(private apiClient: FlowScopeApiClient) {
        this.loadBookmarks();
    }

    refresh(): void {
        this.loadBookmarks();
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: BookmarkTreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: BookmarkTreeItem): Promise<BookmarkTreeItem[]> {
        if (!element) {
            return Promise.resolve(
                this.bookmarks.map(bookmark => 
                    new BookmarkTreeItem(bookmark, vscode.TreeItemCollapsibleState.None)
                )
            );
        }
        
        return Promise.resolve([]);
    }

    private async loadBookmarks(): Promise<void> {
        try {
            this.bookmarks = await this.apiClient.getBookmarks();
        } catch (error) {
            console.error('Failed to load bookmarks:', error);
            this.bookmarks = [];
        }
    }
}
