import * as vscode from 'vscode';
import { FlowScopeApiClient } from '../services/apiClient';
export declare class PromptTreeItem extends vscode.TreeItem {
    readonly promptVersion: any;
    readonly collapsibleState: vscode.TreeItemCollapsibleState;
    constructor(promptVersion: any, collapsibleState: vscode.TreeItemCollapsibleState);
}
export declare class PromptsTreeDataProvider implements vscode.TreeDataProvider<PromptTreeItem> {
    private apiClient;
    private _onDidChangeTreeData;
    readonly onDidChangeTreeData: vscode.Event<PromptTreeItem | undefined | null | void>;
    private promptVersions;
    constructor(apiClient: FlowScopeApiClient);
    refresh(): void;
    getTreeItem(element: PromptTreeItem): vscode.TreeItem;
    getChildren(element?: PromptTreeItem): Promise<PromptTreeItem[]>;
    private loadPromptVersions;
}
