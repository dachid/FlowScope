"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookmarksTreeDataProvider = exports.BookmarkTreeItem = void 0;
const vscode = __importStar(require("vscode"));
class BookmarkTreeItem extends vscode.TreeItem {
    constructor(bookmark, collapsibleState) {
        super(bookmark.description || `Trace ${bookmark.traceId}`, collapsibleState);
        this.bookmark = bookmark;
        this.collapsibleState = collapsibleState;
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
exports.BookmarkTreeItem = BookmarkTreeItem;
class BookmarksTreeDataProvider {
    constructor(apiClient) {
        this.apiClient = apiClient;
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.bookmarks = [];
        this.loadBookmarks();
    }
    refresh() {
        this.loadBookmarks();
        this._onDidChangeTreeData.fire();
    }
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        if (!element) {
            return Promise.resolve(this.bookmarks.map(bookmark => new BookmarkTreeItem(bookmark, vscode.TreeItemCollapsibleState.None)));
        }
        return Promise.resolve([]);
    }
    async loadBookmarks() {
        try {
            this.bookmarks = await this.apiClient.getBookmarks();
        }
        catch (error) {
            console.error('Failed to load bookmarks:', error);
            this.bookmarks = [];
        }
    }
}
exports.BookmarksTreeDataProvider = BookmarksTreeDataProvider;
