import * as vscode from 'vscode';
import { DesktopAppClient } from '../services/desktopAppClient';

export class FlowScopeTreeProvider implements vscode.TreeDataProvider<FlowScopeTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<FlowScopeTreeItem | undefined | null | void> = new vscode.EventEmitter<FlowScopeTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<FlowScopeTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

  constructor(private desktopAppClient: DesktopAppClient) {}

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: FlowScopeTreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: FlowScopeTreeItem): Promise<FlowScopeTreeItem[]> {
    if (!element) {
      // Root level items
      return [
        new FlowScopeTreeItem(
          'Recent Traces',
          vscode.TreeItemCollapsibleState.Expanded,
          'traces',
          'Recent LLM traces and operations'
        ),
        new FlowScopeTreeItem(
          'Performance Metrics',
          vscode.TreeItemCollapsibleState.Collapsed,
          'metrics',
          'Performance analysis and statistics'
        ),
        new FlowScopeTreeItem(
          'Desktop App',
          vscode.TreeItemCollapsibleState.Collapsed,
          'desktop',
          'Desktop application status and controls'
        )
      ];
    }

    if (element.contextValue === 'traces') {
      return this.getTraceItems();
    }

    if (element.contextValue === 'metrics') {
      return this.getMetricItems();
    }

    if (element.contextValue === 'desktop') {
      return this.getDesktopItems();
    }

    return [];
  }

  private async getTraceItems(): Promise<FlowScopeTreeItem[]> {
    try {
      // Try to get traces from desktop app
      const traces = await this.desktopAppClient.getRecentTraces();
      
      if (traces && traces.length > 0) {
        return traces.slice(0, 10).map(trace => 
          new FlowScopeTreeItem(
            `${trace.operation || 'LLM Operation'} - ${this.formatDuration(trace.duration)}`,
            vscode.TreeItemCollapsibleState.None,
            'trace',
            trace.startTime ? new Date(trace.startTime).toLocaleString() : 'Recent',
            {
              command: 'flowscope.showTraceDetails',
              title: 'Show Trace Details',
              arguments: [trace.id]
            }
          )
        );
      } else {
        return [
          new FlowScopeTreeItem(
            'No traces available',
            vscode.TreeItemCollapsibleState.None,
            'empty',
            'Start tracing to see LLM operations'
          )
        ];
      }
    } catch (error) {
      return [
        new FlowScopeTreeItem(
          'Unable to load traces',
          vscode.TreeItemCollapsibleState.None,
          'error',
          'Check desktop app connection'
        )
      ];
    }
  }

  private async getMetricItems(): Promise<FlowScopeTreeItem[]> {
    try {
      const metrics = await this.desktopAppClient.getMetrics();
      
      if (metrics) {
        return [
          new FlowScopeTreeItem(
            `Total Operations: ${metrics.totalOperations || 0}`,
            vscode.TreeItemCollapsibleState.None,
            'metric'
          ),
          new FlowScopeTreeItem(
            `Average Duration: ${this.formatDuration(metrics.averageDuration)}`,
            vscode.TreeItemCollapsibleState.None,
            'metric'
          ),
          new FlowScopeTreeItem(
            `Success Rate: ${metrics.successRate ? (metrics.successRate * 100).toFixed(1) : 0}%`,
            vscode.TreeItemCollapsibleState.None,
            'metric'
          ),
          new FlowScopeTreeItem(
            `Total Cost: $${metrics.totalCost ? metrics.totalCost.toFixed(4) : '0.0000'}`,
            vscode.TreeItemCollapsibleState.None,
            'metric'
          )
        ];
      }
    } catch (error) {
      // Metrics not available
    }

    return [
      new FlowScopeTreeItem(
        'No metrics available',
        vscode.TreeItemCollapsibleState.None,
        'empty',
        'Start tracing to see performance metrics'
      )
    ];
  }

  private getDesktopItems(): FlowScopeTreeItem[] {
    const isConnected = this.desktopAppClient.isConnected;
    
    const items = [
      new FlowScopeTreeItem(
        isConnected ? 'Desktop App Connected' : 'Desktop App Disconnected',
        vscode.TreeItemCollapsibleState.None,
        'status',
        isConnected ? 'Connected to FlowScope Desktop' : 'Connect for enhanced features'
      )
    ];

    if (!isConnected) {
      items.push(
        new FlowScopeTreeItem(
          'Connect to Desktop',
          vscode.TreeItemCollapsibleState.None,
          'action',
          'Connect to FlowScope Desktop App',
          {
            command: 'flowscope.connectDesktopApp',
            title: 'Connect to Desktop App'
          }
        ),
        new FlowScopeTreeItem(
          'Install Desktop App',
          vscode.TreeItemCollapsibleState.None,
          'action',
          'Download and install FlowScope Desktop',
          {
            command: 'flowscope.installDesktopApp',
            title: 'Install Desktop App'
          }
        )
      );
    } else {
      items.push(
        new FlowScopeTreeItem(
          'Open Desktop App',
          vscode.TreeItemCollapsibleState.None,
          'action',
          'Open FlowScope Desktop application',
          {
            command: 'flowscope.openDesktopApp',
            title: 'Open Desktop App'
          }
        ),
        new FlowScopeTreeItem(
          'Disconnect',
          vscode.TreeItemCollapsibleState.None,
          'action',
          'Disconnect from desktop app',
          {
            command: 'flowscope.disconnectDesktopApp',
            title: 'Disconnect'
          }
        )
      );
    }

    return items;
  }

  private formatDuration(duration: number | undefined): string {
    if (!duration) return 'N/A';
    
    if (duration < 1000) {
      return `${Math.round(duration)}ms`;
    } else if (duration < 60000) {
      return `${(duration / 1000).toFixed(1)}s`;
    } else {
      const minutes = Math.floor(duration / 60000);
      const seconds = Math.floor((duration % 60000) / 1000);
      return `${minutes}m ${seconds}s`;
    }
  }
}

class FlowScopeTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly contextValue?: string,
    public readonly tooltip?: string,
    public readonly command?: vscode.Command
  ) {
    super(label, collapsibleState);

    this.tooltip = tooltip;
    this.contextValue = contextValue;
    
    if (command) {
      this.command = command;
    }

    // Set icons based on context
    switch (contextValue) {
      case 'traces':
        this.iconPath = new vscode.ThemeIcon('pulse');
        break;
      case 'metrics':
        this.iconPath = new vscode.ThemeIcon('graph');
        break;
      case 'desktop':
        this.iconPath = new vscode.ThemeIcon('desktop-download');
        break;
      case 'trace':
        this.iconPath = new vscode.ThemeIcon('circle-outline');
        break;
      case 'metric':
        this.iconPath = new vscode.ThemeIcon('dashboard');
        break;
      case 'status':
        this.iconPath = new vscode.ThemeIcon('circle-filled');
        break;
      case 'action':
        this.iconPath = new vscode.ThemeIcon('arrow-right');
        break;
      case 'empty':
        this.iconPath = new vscode.ThemeIcon('info');
        break;
      case 'error':
        this.iconPath = new vscode.ThemeIcon('error');
        break;
    }
  }
}
