import * as vscode from 'vscode';
import { FlowScopeApiClient } from '../services/apiClient';

export class PromptTreeItem extends vscode.TreeItem {
    constructor(
        public readonly promptVersion: any,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState
    ) {
        super(promptVersion.name, collapsibleState);
        
        this.description = `v${promptVersion.version}`;
        this.tooltip = `${promptVersion.name} - Version ${promptVersion.version}`;
        this.contextValue = 'promptVersion';
        this.iconPath = new vscode.ThemeIcon('file-text');
        
        // Command to open prompt version
        this.command = {
            command: 'flowscope.openPromptVersion',
            title: 'Open Prompt Version',
            arguments: [promptVersion.id]
        };
    }
}

export class PromptsTreeDataProvider implements vscode.TreeDataProvider<PromptTreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<PromptTreeItem | undefined | null | void> = new vscode.EventEmitter<PromptTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<PromptTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private promptVersions: any[] = [];

    constructor(private apiClient: FlowScopeApiClient) {
        this.loadPromptVersions();
    }

    refresh(): void {
        this.loadPromptVersions();
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: PromptTreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: PromptTreeItem): Promise<PromptTreeItem[]> {
        if (!element) {
            // Return root level prompt versions
            return Promise.resolve(
                this.promptVersions.map(promptVersion => 
                    new PromptTreeItem(promptVersion, vscode.TreeItemCollapsibleState.None)
                )
            );
        }
        
        return Promise.resolve([]);
    }

    private async loadPromptVersions(): Promise<void> {
        try {
            this.promptVersions = await this.apiClient.getPromptVersions();
        } catch (error) {
            console.error('Failed to load prompt versions:', error);
            this.promptVersions = [];
        }
    }
}
