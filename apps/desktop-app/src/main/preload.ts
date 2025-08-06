import { contextBridge, ipcRenderer } from 'electron';

// Expose APIs to renderer process with security restrictions
contextBridge.exposeInMainWorld('electronAPI', {
  // Database operations
  database: {
    createSession: (session: any) => ipcRenderer.invoke('db:createSession', session),
    getSession: (sessionId: string) => ipcRenderer.invoke('db:getSession', sessionId),
    getAllSessions: () => ipcRenderer.invoke('db:getAllSessions'),
    deleteSession: (sessionId: string) => ipcRenderer.invoke('db:deleteSession', sessionId),
    
    createTrace: (trace: any) => ipcRenderer.invoke('db:createTrace', trace),
    getTrace: (traceId: string) => ipcRenderer.invoke('db:getTrace', traceId),
    getTracesBySession: (sessionId: string) => ipcRenderer.invoke('db:getTracesBySession', sessionId),
    deleteTrace: (traceId: string) => ipcRenderer.invoke('db:deleteTrace', traceId),
    
    createPrompt: (prompt: any) => ipcRenderer.invoke('db:createPrompt', prompt),
    getPrompt: (promptId: string) => ipcRenderer.invoke('db:getPrompt', promptId),
    getPromptsByTrace: (traceId: string) => ipcRenderer.invoke('db:getPromptsByTrace', traceId),
    deletePrompt: (promptId: string) => ipcRenderer.invoke('db:deletePrompt', promptId),
    
    createBookmark: (bookmark: any) => ipcRenderer.invoke('db:createBookmark', bookmark),
    getBookmark: (bookmarkId: string) => ipcRenderer.invoke('db:getBookmark', bookmarkId),
    getAllBookmarks: () => ipcRenderer.invoke('db:getAllBookmarks'),
    deleteBookmark: (bookmarkId: string) => ipcRenderer.invoke('db:deleteBookmark', bookmarkId),
  },
  
  // VS Code integration
  vscode: {
    checkInstallation: () => ipcRenderer.invoke('vscode:checkInstallation'),
    installExtension: () => ipcRenderer.invoke('vscode:installExtension'),
    showSettings: () => ipcRenderer.invoke('vscode:showSettings'),
  },
  
  // App controls
  app: {
    getVersion: () => ipcRenderer.invoke('app:getVersion'),
    quit: () => ipcRenderer.invoke('app:quit'),
    minimize: () => ipcRenderer.invoke('app:minimize'),
    maximize: () => ipcRenderer.invoke('app:maximize'),
    close: () => ipcRenderer.invoke('app:close'),
  },
  
  // Event listeners for real-time updates
  onSessionUpdate: (callback: (session: any) => void) => {
    ipcRenderer.on('session:updated', (_, session) => callback(session));
    return () => ipcRenderer.removeAllListeners('session:updated');
  },
  
  onTraceUpdate: (callback: (trace: any) => void) => {
    ipcRenderer.on('trace:updated', (_, trace) => callback(trace));
    return () => ipcRenderer.removeAllListeners('trace:updated');
  },
  
  onPromptUpdate: (callback: (prompt: any) => void) => {
    ipcRenderer.on('prompt:updated', (_, prompt) => callback(prompt));
    return () => ipcRenderer.removeAllListeners('prompt:updated');
  },
});

// Type definitions for the exposed API
declare global {
  interface Window {
    electronAPI: {
      database: {
        createSession: (session: any) => Promise<any>;
        getSession: (sessionId: string) => Promise<any>;
        getAllSessions: () => Promise<any[]>;
        deleteSession: (sessionId: string) => Promise<boolean>;
        createTrace: (trace: any) => Promise<any>;
        getTrace: (traceId: string) => Promise<any>;
        getTracesBySession: (sessionId: string) => Promise<any[]>;
        deleteTrace: (traceId: string) => Promise<boolean>;
        createPrompt: (prompt: any) => Promise<any>;
        getPrompt: (promptId: string) => Promise<any>;
        getPromptsByTrace: (traceId: string) => Promise<any[]>;
        deletePrompt: (promptId: string) => Promise<boolean>;
        createBookmark: (bookmark: any) => Promise<any>;
        getBookmark: (bookmarkId: string) => Promise<any>;
        getAllBookmarks: () => Promise<any[]>;
        deleteBookmark: (bookmarkId: string) => Promise<boolean>;
      };
      vscode: {
        checkInstallation: () => Promise<boolean>;
        installExtension: () => Promise<boolean>;
        showSettings: () => Promise<void>;
      };
      app: {
        getVersion: () => Promise<string>;
        quit: () => Promise<void>;
        minimize: () => Promise<void>;
        maximize: () => Promise<void>;
        close: () => Promise<void>;
      };
      onSessionUpdate: (callback: (session: any) => void) => () => void;
      onTraceUpdate: (callback: (trace: any) => void) => () => void;
      onPromptUpdate: (callback: (prompt: any) => void) => () => void;
    };
  }
}
