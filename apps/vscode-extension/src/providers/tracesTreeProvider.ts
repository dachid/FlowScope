import * as vscode from 'vscode';
import { FlowScopeApiClient } from '../types';
import { TraceData } from '../types';

export class TraceTreeItem extends vscode.TreeItem {
    constructor(
        public readonly trace: TraceData,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState
    ) {
        super(trace.operation, collapsibleState);
        
        this.id = trace.id;
        this.description = new Date(trace.startTime).toLocaleString();
        this.tooltip = `${trace.operation} - ${this.description}`;
        this.contextValue = 'trace';
        
        // Set icon based on trace status
        switch (trace.status) {
            case 'success':
                this.iconPath = new vscode.ThemeIcon('check');
                break;
            case 'error':
                this.iconPath = new vscode.ThemeIcon('error');
                break;
            case 'pending':
                this.iconPath = new vscode.ThemeIcon('loading~spin');
                break;
            default:
                this.iconPath = new vscode.ThemeIcon('circle-filled');
        }
        
        // Command to select trace when clicked
        this.command = {
            command: 'flowscope.selectTrace',
            title: 'Select Trace',
            arguments: [trace.id]
        };
    }
}

export class TracesTreeDataProvider implements vscode.TreeDataProvider<TraceTreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<TraceTreeItem | undefined | null | void> = new vscode.EventEmitter<TraceTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<TraceTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private traces: TraceData[] = [];

    constructor(private apiClient: FlowScopeApiClient) {
        this.loadTraces();
        
        // Subscribe to trace updates
        this.apiClient.onTracesUpdated((traces) => {
            this.traces = traces;
            this.refresh();
        });
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: TraceTreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: TraceTreeItem): Thenable<TraceTreeItem[]> {
        if (!element) {
            // Return root level traces
            return Promise.resolve(
                this.traces.map(trace => 
                    new TraceTreeItem(trace, vscode.TreeItemCollapsibleState.None)
                )
            );
        }
        
        // For now, traces don't have children
        // In the future, this could show nested operations or related traces
        return Promise.resolve([]);
    }

    private async loadTraces(): Promise<void> {
        try {
            this.traces = await this.apiClient.getTraces();
            this.refresh();
        } catch (error) {
            console.error('Failed to load traces:', error);
            // Show empty state or error message
            this.traces = [];
            this.refresh();
        }
    }
}
