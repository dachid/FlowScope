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
exports.PromptsTreeDataProvider = exports.PromptTreeItem = void 0;
const vscode = __importStar(require("vscode"));
class PromptTreeItem extends vscode.TreeItem {
    constructor(promptVersion, collapsibleState) {
        super(promptVersion.name, collapsibleState);
        this.promptVersion = promptVersion;
        this.collapsibleState = collapsibleState;
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
exports.PromptTreeItem = PromptTreeItem;
class PromptsTreeDataProvider {
    constructor(apiClient) {
        this.apiClient = apiClient;
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.promptVersions = [];
        this.loadPromptVersions();
    }
    refresh() {
        this.loadPromptVersions();
        this._onDidChangeTreeData.fire();
    }
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        if (!element) {
            // Return root level prompt versions
            return Promise.resolve(this.promptVersions.map(promptVersion => new PromptTreeItem(promptVersion, vscode.TreeItemCollapsibleState.None)));
        }
        return Promise.resolve([]);
    }
    async loadPromptVersions() {
        try {
            this.promptVersions = await this.apiClient.getPromptVersions();
        }
        catch (error) {
            console.error('Failed to load prompt versions:', error);
            this.promptVersions = [];
        }
    }
}
exports.PromptsTreeDataProvider = PromptsTreeDataProvider;
