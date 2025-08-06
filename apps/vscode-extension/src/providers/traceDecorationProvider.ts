import * as vscode from 'vscode';
import { FlowScopeApiClient, TraceData } from '../types';

export class TraceDecorationProvider {
  private decorationType: vscode.TextEditorDecorationType;
  private errorDecorationType: vscode.TextEditorDecorationType;
  private successDecorationType: vscode.TextEditorDecorationType;
  private pendingDecorationType: vscode.TextEditorDecorationType;
  
  private traces: Map<string, TraceData[]> = new Map();
  private isEnabled = true;

  constructor(private apiClient: FlowScopeApiClient) {
    // Initialize decoration types
    this.decorationType = vscode.window.createTextEditorDecorationType({
      backgroundColor: 'rgba(100, 200, 100, 0.1)',
      after: {
        contentText: ' ✓',
        color: 'green'
      }
    });

    this.errorDecorationType = vscode.window.createTextEditorDecorationType({
      backgroundColor: 'rgba(255, 100, 100, 0.1)',
      after: {
        contentText: ' ✗',
        color: 'red'
      }
    });

    this.successDecorationType = vscode.window.createTextEditorDecorationType({
      backgroundColor: 'rgba(100, 255, 100, 0.1)',
      after: {
        contentText: ' ✓',
        color: 'green'
      }
    });

    this.pendingDecorationType = vscode.window.createTextEditorDecorationType({
      backgroundColor: 'rgba(255, 255, 100, 0.1)',
      after: {
        contentText: ' ⏳',
        color: 'orange'
      }
    });
    
    // Listen for configuration changes
    vscode.workspace.onDidChangeConfiguration(e => {
      if (e.affectsConfiguration('flowscope.showInlineDecorations')) {
        this.isEnabled = vscode.workspace.getConfiguration('flowscope').get('showInlineDecorations', true);
        this.updateAllEditors();
      }
    });

    this.isEnabled = vscode.workspace.getConfiguration('flowscope').get('showInlineDecorations', true);

    // Listen for active editor changes
    vscode.window.onDidChangeActiveTextEditor(editor => {
      if (editor) {
        this.updateEditor(editor);
      }
    });

    // Update current editor
    if (vscode.window.activeTextEditor) {
      this.updateEditor(vscode.window.activeTextEditor);
    }
  }

  /**
   * Create decoration types for different trace statuses
   */
  private createDecorationTypes(): void {
    // General decoration type
    this.decorationType = vscode.window.createTextEditorDecorationType({
      after: {
        margin: '0 0 0 1em',
        textDecoration: 'none',
        fontWeight: 'normal',
        fontStyle: 'italic'
      },
      rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed
    });

    // Success traces
    this.successDecorationType = vscode.window.createTextEditorDecorationType({
      after: {
        margin: '0 0 0 1em',
        textDecoration: 'none',
        fontWeight: 'normal',
        fontStyle: 'italic'
      },
      backgroundColor: 'rgba(0, 255, 0, 0.1)',
      border: '1px solid rgba(0, 255, 0, 0.3)',
      borderRadius: '3px',
      rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed
    });

    // Error traces
    this.errorDecorationType = vscode.window.createTextEditorDecorationType({
      after: {
        margin: '0 0 0 1em',
        textDecoration: 'none',
        fontWeight: 'normal',
        fontStyle: 'italic'
      },
      backgroundColor: 'rgba(255, 0, 0, 0.1)',
      border: '1px solid rgba(255, 0, 0, 0.3)',
      borderRadius: '3px',
      rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed
    });

    // Pending traces
    this.pendingDecorationType = vscode.window.createTextEditorDecorationType({
      after: {
        margin: '0 0 0 1em',
        textDecoration: 'none',
        fontWeight: 'normal',
        fontStyle: 'italic'
      },
      backgroundColor: 'rgba(255, 255, 0, 0.1)',
      border: '1px solid rgba(255, 255, 0, 0.3)',
      borderRadius: '3px',
      rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed
    });
  }

  /**
   * Update decorations for specific editor
   */
  updateEditor(editor: vscode.TextEditor): void {
    if (!this.isEnabled) {
      this.clearDecorations(editor);
      return;
    }

    const filePath = editor.document.uri.fsPath;
    const traces = this.traces.get(filePath) || [];

    this.updateDecorations(editor, traces);
  }

  /**
   * Update all visible editors
   */
  private updateAllEditors(): void {
    vscode.window.visibleTextEditors.forEach(editor => {
      this.updateEditor(editor);
    });
  }

  /**
   * Update decorations for traces
   */
  updateDecorations(editor?: vscode.TextEditor, traces?: TraceData[]): void {
    const activeEditor = editor || vscode.window.activeTextEditor;
    if (!activeEditor) {
      return;
    }

    // If traces are provided, use them, otherwise get cached traces for this file
    let tracesToUse = traces;
    if (!tracesToUse) {
      const filePath = activeEditor.document.uri.fsPath;
      tracesToUse = this.traces.get(filePath) || [];
    }

    const successDecorations: vscode.DecorationOptions[] = [];
    const errorDecorations: vscode.DecorationOptions[] = [];
    const pendingDecorations: vscode.DecorationOptions[] = [];

    // Group traces by line number and status
    const tracesByLine = this.groupTracesByLine(tracesToUse, activeEditor.document);

    for (const [lineNumber, lineTraces] of tracesByLine) {
      if (lineNumber < 0 || lineNumber >= activeEditor.document.lineCount) {
        continue;
      }

      const range = new vscode.Range(lineNumber, 0, lineNumber, 0);
      const metrics = this.calculateLineMetrics(lineTraces);
      
      const decoration: vscode.DecorationOptions = {
        range,
        renderOptions: {
          after: {
            contentText: this.getPerformanceIndicator(metrics),
            color: this.getPerformanceColor(metrics)
          }
        },
        hoverMessage: this.getHoverMessage(lineTraces, metrics)
      };

      // Categorize by primary status
      if (metrics.errorCount > 0) {
        errorDecorations.push(decoration);
      } else if (metrics.pendingCount > 0) {
        pendingDecorations.push(decoration);
      } else {
        successDecorations.push(decoration);
      }
    }

    // Apply decorations
    activeEditor.setDecorations(this.successDecorationType, successDecorations);
    activeEditor.setDecorations(this.errorDecorationType, errorDecorations);
    activeEditor.setDecorations(this.pendingDecorationType, pendingDecorations);
  }

  /**
   * Group traces by line number
   */
  private groupTracesByLine(traces: TraceData[], document: vscode.TextDocument): Map<number, TraceData[]> {
    const tracesByLine = new Map<number, TraceData[]>();

    for (const trace of traces) {
      let lineNumber = -1;

      if (trace.sourceLocation?.line !== undefined) {
        lineNumber = trace.sourceLocation.line - 1; // Convert to 0-based
      } else if (trace.metadata?.lineNumber !== undefined) {
        lineNumber = typeof trace.metadata.lineNumber === 'number' 
          ? trace.metadata.lineNumber 
          : parseInt(trace.metadata.lineNumber) - 1;
      }

      if (lineNumber >= 0 && lineNumber < document.lineCount) {
        if (!tracesByLine.has(lineNumber)) {
          tracesByLine.set(lineNumber, []);
        }
        tracesByLine.get(lineNumber)!.push(trace);
      }
    }

    return tracesByLine;
  }

  /**
   * Calculate metrics for traces on a specific line
   */
  private calculateLineMetrics(traces: TraceData[]): {
    totalCount: number;
    successCount: number;
    errorCount: number;
    pendingCount: number;
    avgDuration: number;
    minDuration: number;
    maxDuration: number;
  } {
    const durations = traces
      .filter(t => t.duration !== undefined)
      .map(t => t.duration!);

    return {
      totalCount: traces.length,
      successCount: traces.filter(t => t.status === 'success').length,
      errorCount: traces.filter(t => t.status === 'error').length,
      pendingCount: traces.filter(t => t.status === 'pending').length,
      avgDuration: durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0,
      minDuration: durations.length > 0 ? Math.min(...durations) : 0,
      maxDuration: durations.length > 0 ? Math.max(...durations) : 0
    };
  }

  /**
   * Get performance indicator text
   */
  private getPerformanceIndicator(metrics: any): string {
    const parts = [];

    // Status indicator
    if (metrics.errorCount > 0) {
      parts.push(`❌ ${metrics.errorCount}`);
    } else if (metrics.pendingCount > 0) {
      parts.push(`⏳ ${metrics.pendingCount}`);
    } else if (metrics.successCount > 0) {
      parts.push(`✅ ${metrics.successCount}`);
    }

    // Duration indicator
    if (metrics.avgDuration > 0) {
      const duration = this.formatDuration(metrics.avgDuration);
      
      if (metrics.avgDuration < 100) {
        parts.push(`🟢 ${duration}`);
      } else if (metrics.avgDuration < 1000) {
        parts.push(`🟡 ${duration}`);
      } else {
        parts.push(`🔴 ${duration}`);
      }
    }

    return ` ${parts.join(' ')}`;
  }

  /**
   * Get performance indicator color
   */
  private getPerformanceColor(metrics: any): string {
    if (metrics.errorCount > 0) {
      return '#ff4444';
    } else if (metrics.pendingCount > 0) {
      return '#ffaa00';
    } else if (metrics.avgDuration > 1000) {
      return '#ff6666';
    } else if (metrics.avgDuration > 100) {
      return '#ffaa00';
    } else {
      return '#44ff44';
    }
  }

  /**
   * Get hover message with detailed information
   */
  private getHoverMessage(traces: TraceData[], metrics: any): vscode.MarkdownString {
    const markdown = new vscode.MarkdownString();
    markdown.isTrusted = true;

    markdown.appendMarkdown(`### FlowScope Trace Information\n\n`);
    
    // Summary
    markdown.appendMarkdown(`**Total Traces:** ${metrics.totalCount}\n\n`);
    
    if (metrics.avgDuration > 0) {
      markdown.appendMarkdown(`**Average Duration:** ${this.formatDuration(metrics.avgDuration)}\n\n`);
      
      if (metrics.minDuration !== metrics.maxDuration) {
        markdown.appendMarkdown(`**Duration Range:** ${this.formatDuration(metrics.minDuration)} - ${this.formatDuration(metrics.maxDuration)}\n\n`);
      }
    }

    // Status breakdown
    if (metrics.successCount > 0) {
      markdown.appendMarkdown(`✅ **Success:** ${metrics.successCount}\n\n`);
    }
    if (metrics.errorCount > 0) {
      markdown.appendMarkdown(`❌ **Errors:** ${metrics.errorCount}\n\n`);
    }
    if (metrics.pendingCount > 0) {
      markdown.appendMarkdown(`⏳ **Pending:** ${metrics.pendingCount}\n\n`);
    }

    // Recent traces
    markdown.appendMarkdown(`---\n\n**Recent Traces:**\n\n`);
    
    const recentTraces = traces
      .sort((a, b) => (b.startTime || 0) - (a.startTime || 0))
      .slice(0, 5);

    for (const trace of recentTraces) {
      const status = trace.status === 'success' ? '✅' : trace.status === 'error' ? '❌' : '⏳';
      const duration = trace.duration ? ` (${this.formatDuration(trace.duration)})` : '';
      const timestamp = new Date(trace.startTime || 0).toLocaleTimeString();
      
      markdown.appendMarkdown(`- ${status} **${trace.operation}**${duration} - ${timestamp}\n`);
    }

    // Actions
    markdown.appendMarkdown(`\n---\n\n`);
    markdown.appendMarkdown(`[View in Desktop App](command:flowscope.openDesktopApp) | `);
    markdown.appendMarkdown(`[Analyze Traces](command:flowscope.analyzeTraces?${encodeURIComponent(JSON.stringify(traces))})`);

    return markdown;
  }

  /**
   * Format duration
   */
  private formatDuration(ms: number): string {
    if (ms < 1) {
      return `${(ms * 1000).toFixed(0)}μs`;
    } else if (ms < 1000) {
      return `${ms.toFixed(0)}ms`;
    } else if (ms < 60000) {
      return `${(ms / 1000).toFixed(1)}s`;
    } else {
      const minutes = Math.floor(ms / 60000);
      const seconds = ((ms % 60000) / 1000).toFixed(0);
      return `${minutes}m ${seconds}s`;
    }
  }

  /**
   * Update traces for a specific file
   */
  updateTraces(filePath: string, traces: TraceData[]): void {
    this.traces.set(filePath, traces);
    
    // Update any open editors for this file
    vscode.window.visibleTextEditors.forEach(editor => {
      if (editor.document.uri.fsPath === filePath) {
        this.updateEditor(editor);
      }
    });
  }

  /**
   * Add trace for a specific file
   */
  addTrace(filePath: string, trace: TraceData): void {
    if (!this.traces.has(filePath)) {
      this.traces.set(filePath, []);
    }
    
    const fileTraces = this.traces.get(filePath)!;
    fileTraces.push(trace);
    
    // Keep only recent traces (last 50 per file)
    if (fileTraces.length > 50) {
      fileTraces.splice(0, fileTraces.length - 50);
    }
    
    // Update any open editors for this file
    vscode.window.visibleTextEditors.forEach(editor => {
      if (editor.document.uri.fsPath === filePath) {
        this.updateEditor(editor);
      }
    });
  }

  /**
   * Clear decorations for an editor
   */
  private clearDecorations(editor: vscode.TextEditor): void {
    editor.setDecorations(this.successDecorationType, []);
    editor.setDecorations(this.errorDecorationType, []);
    editor.setDecorations(this.pendingDecorationType, []);
  }

  /**
   * Clear traces for a file
   */
  clearTraces(filePath?: string): void {
    if (filePath) {
      this.traces.delete(filePath);
      
      // Clear decorations for this file
      vscode.window.visibleTextEditors.forEach(editor => {
        if (editor.document.uri.fsPath === filePath) {
          this.clearDecorations(editor);
        }
      });
    } else {
      this.traces.clear();
      
      // Clear all decorations
      vscode.window.visibleTextEditors.forEach(editor => {
        this.clearDecorations(editor);
      });
    }
  }

  /**
   * Refresh configuration
   */
  refreshConfiguration(): void {
    this.isEnabled = vscode.workspace.getConfiguration('flowscope').get('showInlineDecorations', true);
    this.updateAllEditors();
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    this.decorationType.dispose();
    this.errorDecorationType.dispose();
    this.successDecorationType.dispose();
    this.pendingDecorationType.dispose();
    this.traces.clear();
  }
}
