# Phase 6D: Integration Strategy Implementation Plan

## 📋 Overview

**Goal**: Orchestrate seamless integration between Desktop App, VS Code Extension, and Cloud Platform to create a unified, multi-channel FlowScope experience.

**Timeline**: Week 17 (1 week)

**Priority**: Critical - ensures all channels work together cohesively

**Approach**: Event-driven architecture with robust fallback mechanisms and graceful degradation

---

## 🎯 Core Objectives

1. **Unified Data Flow**: Seamless trace synchronization across all channels
2. **Real-time Collaboration**: Live sharing and multi-user debugging sessions
3. **Cross-Device Continuity**: Pick up debugging sessions on any device
4. **Graceful Degradation**: Full functionality even when components are offline
5. **Zero-Friction Setup**: Automatic discovery and configuration

---

## 🏗️ Integration Architecture

### **Data Flow Architecture**

```
┌─────────────────────────────────────────────────────────────────────┐
│                        FlowScope Ecosystem                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐              │
│  │   Desktop   │    │  VS Code    │    │   Cloud     │              │
│  │     App     │◄──►│ Extension   │◄──►│  Platform   │              │
│  │             │    │             │    │             │              │
│  │ • Rich UI   │    │ • Code Ctx  │    │ • Sync      │              │
│  │ • Analysis  │    │ • Triggers  │    │ • Teams     │              │
│  │ • Storage   │    │ • Inline    │    │ • Analytics │              │
│  └─────────────┘    └─────────────┘    └─────────────┘              │
│         │                   │                   │                   │
│         └───────────────────┼───────────────────┘                   │
│                             │                                       │
│  ┌──────────────────────────▼──────────────────────────┐             │
│  │              Event Bus / Message Broker              │             │
│  │                                                      │             │
│  │  • Real-time trace events                           │             │
│  │  • Cross-channel notifications                      │             │
│  │  │  • User presence/collaboration                   │             │
│  │  • State synchronization                            │             │
│  └──────────────────────────────────────────────────────┘             │
│                             │                                       │
│  ┌──────────────────────────▼──────────────────────────┐             │
│  │                 Local Storage Layer                  │             │
│  │                                                      │             │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │             │
│  │  │   SQLite    │  │   IndexedDB │  │ PostgreSQL  │  │             │
│  │  │ (Desktop)   │  │ (VS Code)   │  │  (Cloud)    │  │             │
│  │  │             │  │             │  │             │  │             │
│  │  │ • Primary   │  │ • Cache     │  │ • Sync      │  │             │
│  │  │ • Offline   │  │ • Metadata  │  │ • Teams     │  │             │
│  │  │ • Fast      │  │ • Settings  │  │ • Archive   │  │             │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  │             │
│  └──────────────────────────────────────────────────────┘             │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### **Communication Protocols**

```typescript
// Unified message protocol for cross-channel communication
interface FlowScopeMessage {
  id: string;
  type: MessageType;
  source: ChannelType;
  target?: ChannelType;
  timestamp: Date;
  data: any;
  metadata?: {
    userId?: string;
    workspaceId?: string;
    sessionId?: string;
  };
}

enum MessageType {
  // Trace events
  TRACE_ADDED = 'trace_added',
  TRACE_UPDATED = 'trace_updated',
  TRACE_DELETED = 'trace_deleted',
  
  // Session events
  SESSION_STARTED = 'session_started',
  SESSION_ENDED = 'session_ended',
  SESSION_SHARED = 'session_shared',
  
  // Navigation events
  JUMP_TO_CODE = 'jump_to_code',
  FOCUS_TRACE = 'focus_trace',
  HIGHLIGHT_CODE = 'highlight_code',
  
  // Collaboration events
  USER_JOINED = 'user_joined',
  USER_LEFT = 'user_left',
  CURSOR_MOVED = 'cursor_moved',
  
  // Sync events
  SYNC_REQUEST = 'sync_request',
  SYNC_RESPONSE = 'sync_response',
  SYNC_CONFLICT = 'sync_conflict',
  
  // System events
  CHANNEL_CONNECTED = 'channel_connected',
  CHANNEL_DISCONNECTED = 'channel_disconnected',
  ERROR = 'error'
}

enum ChannelType {
  DESKTOP_APP = 'desktop_app',
  VSCODE_EXTENSION = 'vscode_extension',
  CLOUD_PLATFORM = 'cloud_platform',
  WEB_PORTAL = 'web_portal'
}
```

---

## 🔄 Cross-Channel Synchronization

### **Central Message Router**

```typescript
// Core message routing system
export class FlowScopeMessageRouter {
  private channels: Map<ChannelType, MessageChannel> = new Map();
  private messageQueue: FlowScopeMessage[] = [];
  private isOnline = true;

  constructor() {
    this.setupHeartbeat();
    this.setupOfflineHandling();
  }

  // Register a channel (Desktop App, VS Code, etc.)
  registerChannel(type: ChannelType, channel: MessageChannel): void {
    this.channels.set(type, channel);
    
    // Set up bidirectional communication
    channel.onMessage = (message: FlowScopeMessage) => {
      this.routeMessage(message);
    };

    channel.onConnect = () => {
      this.broadcastMessage({
        id: generateId(),
        type: MessageType.CHANNEL_CONNECTED,
        source: type,
        timestamp: new Date(),
        data: { channelType: type }
      });
    };

    channel.onDisconnect = () => {
      this.broadcastMessage({
        id: generateId(),
        type: MessageType.CHANNEL_DISCONNECTED,
        source: type,
        timestamp: new Date(),
        data: { channelType: type }
      });
    };
  }

  // Route message to appropriate channels
  private routeMessage(message: FlowScopeMessage): void {
    // Log message for debugging
    console.log(`[MessageRouter] Routing ${message.type} from ${message.source}`);

    // Route based on message type and target
    if (message.target) {
      // Direct message to specific channel
      const targetChannel = this.channels.get(message.target);
      if (targetChannel) {
        targetChannel.send(message);
      } else {
        // Queue message if target channel offline
        this.queueMessage(message);
      }
    } else {
      // Broadcast to all other channels
      this.broadcastMessage(message, message.source);
    }

    // Handle specific message types
    this.handleSpecialMessages(message);
  }

  private broadcastMessage(message: FlowScopeMessage, excludeSource?: ChannelType): void {
    for (const [type, channel] of this.channels) {
      if (type !== excludeSource && channel.isConnected()) {
        channel.send(message);
      }
    }
  }

  private queueMessage(message: FlowScopeMessage): void {
    this.messageQueue.push(message);
    
    // Persist queue to storage for reliability
    this.persistMessageQueue();
  }

  private async flushMessageQueue(): Promise<void> {
    const messages = [...this.messageQueue];
    this.messageQueue = [];

    for (const message of messages) {
      this.routeMessage(message);
    }
  }

  private handleSpecialMessages(message: FlowScopeMessage): void {
    switch (message.type) {
      case MessageType.SYNC_REQUEST:
        this.handleSyncRequest(message);
        break;
        
      case MessageType.JUMP_TO_CODE:
        this.handleJumpToCode(message);
        break;
        
      case MessageType.FOCUS_TRACE:
        this.handleFocusTrace(message);
        break;
    }
  }

  private handleSyncRequest(message: FlowScopeMessage): void {
    // Coordinate sync between desktop app and cloud
    const desktopChannel = this.channels.get(ChannelType.DESKTOP_APP);
    const cloudChannel = this.channels.get(ChannelType.CLOUD_PLATFORM);

    if (desktopChannel && cloudChannel) {
      // Orchestrate sync process
      this.orchestrateSync(message.data);
    }
  }

  private handleJumpToCode(message: FlowScopeMessage): void {
    // Route to VS Code if available, otherwise show notification
    const vscodeChannel = this.channels.get(ChannelType.VSCODE_EXTENSION);
    
    if (vscodeChannel) {
      vscodeChannel.send(message);
    } else {
      // Send fallback notification to desktop app
      const desktopChannel = this.channels.get(ChannelType.DESKTOP_APP);
      if (desktopChannel) {
        desktopChannel.send({
          ...message,
          type: MessageType.ERROR,
          data: {
            error: 'VS Code not available',
            suggestion: 'Open VS Code to enable code navigation',
            originalMessage: message
          }
        });
      }
    }
  }
}
```

### **Desktop App Integration Hub**

```typescript
// Desktop app serves as central hub for local integration
export class DesktopIntegrationManager {
  private messageRouter: FlowScopeMessageRouter;
  private vscodeConnection: VSCodeConnection | null = null;
  private cloudConnection: CloudConnection | null = null;
  private localDatabase: SQLiteDatabase;

  constructor(database: SQLiteDatabase) {
    this.localDatabase = database;
    this.messageRouter = new FlowScopeMessageRouter();
    this.setupIntegrations();
  }

  private async setupIntegrations(): Promise<void> {
    // Register desktop app channel
    this.messageRouter.registerChannel(
      ChannelType.DESKTOP_APP,
      new DesktopMessageChannel(this)
    );

    // Auto-discover and connect to VS Code
    await this.discoverVSCode();

    // Connect to cloud if user authenticated
    await this.connectToCloud();

    // Set up sync processes
    this.setupAutoSync();
  }

  private async discoverVSCode(): Promise<void> {
    // Try to connect to VS Code extension
    try {
      this.vscodeConnection = new VSCodeConnection('http://localhost:31848');
      await this.vscodeConnection.connect();

      // Register VS Code channel
      this.messageRouter.registerChannel(
        ChannelType.VSCODE_EXTENSION,
        this.vscodeConnection
      );

      console.log('VS Code extension connected');
    } catch (error) {
      console.log('VS Code extension not available');
    }
  }

  private async connectToCloud(): Promise<void> {
    const user = await this.getAuthenticatedUser();
    if (!user) return;

    try {
      this.cloudConnection = new CloudConnection(user.apiKey);
      await this.cloudConnection.connect();

      // Register cloud channel
      this.messageRouter.registerChannel(
        ChannelType.CLOUD_PLATFORM,
        this.cloudConnection
      );

      console.log('Cloud platform connected');
    } catch (error) {
      console.log('Cloud platform connection failed:', error);
    }
  }

  // Handle trace added locally
  async addTrace(trace: TraceData): Promise<void> {
    // Store locally first (for offline support)
    await this.localDatabase.addTrace(trace);

    // Broadcast to all channels
    this.messageRouter.broadcastMessage({
      id: generateId(),
      type: MessageType.TRACE_ADDED,
      source: ChannelType.DESKTOP_APP,
      timestamp: new Date(),
      data: { trace },
      metadata: {
        workspaceId: trace.workspaceId,
        sessionId: trace.sessionId
      }
    });

    // Trigger sync if cloud connected
    if (this.cloudConnection?.isConnected()) {
      await this.syncTraceToCloud(trace);
    }
  }

  // Handle external navigation requests
  async jumpToCode(file: string, line: number): Promise<void> {
    this.messageRouter.broadcastMessage({
      id: generateId(),
      type: MessageType.JUMP_TO_CODE,
      source: ChannelType.DESKTOP_APP,
      target: ChannelType.VSCODE_EXTENSION,
      timestamp: new Date(),
      data: { file, line }
    });
  }

  // Set up automatic synchronization
  private setupAutoSync(): void {
    // Sync every 30 seconds if cloud connected
    setInterval(async () => {
      if (this.cloudConnection?.isConnected()) {
        await this.performIncrementalSync();
      }
    }, 30000);

    // Sync when VS Code connects/disconnects
    this.messageRouter.on(MessageType.CHANNEL_CONNECTED, (message) => {
      if (message.data.channelType === ChannelType.VSCODE_EXTENSION) {
        this.syncWithVSCode();
      }
    });
  }

  private async performIncrementalSync(): Promise<void> {
    const lastSyncTime = await this.getLastSyncTime();
    const newTraces = await this.localDatabase.getTracesSince(lastSyncTime);

    if (newTraces.length > 0) {
      await this.cloudConnection?.syncTraces(newTraces);
      await this.updateLastSyncTime(new Date());
    }

    // Pull updates from cloud
    const cloudUpdates = await this.cloudConnection?.getUpdatesSince(lastSyncTime);
    if (cloudUpdates && cloudUpdates.length > 0) {
      await this.mergeCloudUpdates(cloudUpdates);
    }
  }

  private async syncWithVSCode(): Promise<void> {
    // Send current workspace info to VS Code
    const currentWorkspace = await this.getCurrentWorkspace();
    if (currentWorkspace) {
      this.messageRouter.broadcastMessage({
        id: generateId(),
        type: MessageType.SYNC_RESPONSE,
        source: ChannelType.DESKTOP_APP,
        target: ChannelType.VSCODE_EXTENSION,
        timestamp: new Date(),
        data: { workspace: currentWorkspace }
      });
    }
  }
}
```

---

## 🔌 VS Code Integration Layer

### **VS Code Message Handler**

```typescript
// VS Code extension integration with message routing
export class VSCodeIntegrationManager {
  private messageRouter: FlowScopeMessageRouter;
  private desktopConnection: DesktopConnection | null = null;
  private cloudConnection: CloudConnection | null = null;
  private localCache: VSCodeCache;

  constructor(context: vscode.ExtensionContext) {
    this.localCache = new VSCodeCache(context);
    this.messageRouter = new FlowScopeMessageRouter();
    this.setupIntegrations();
  }

  private async setupIntegrations(): Promise<void> {
    // Register VS Code channel
    this.messageRouter.registerChannel(
      ChannelType.VSCODE_EXTENSION,
      new VSCodeMessageChannel(this)
    );

    // Connect to desktop app
    await this.connectToDesktop();

    // Connect to cloud if authenticated
    await this.connectToCloud();

    // Set up workspace monitoring
    this.setupWorkspaceMonitoring();
  }

  private async connectToDesktop(): Promise<void> {
    try {
      this.desktopConnection = new DesktopConnection('http://localhost:31847');
      await this.desktopConnection.connect();

      // Register desktop channel
      this.messageRouter.registerChannel(
        ChannelType.DESKTOP_APP,
        this.desktopConnection
      );

      // Request current workspace sync
      this.requestWorkspaceSync();
    } catch (error) {
      console.log('Desktop app not available, running in standalone mode');
      this.showDesktopInstallPrompt();
    }
  }

  // Handle messages from other channels
  async handleMessage(message: FlowScopeMessage): Promise<void> {
    switch (message.type) {
      case MessageType.JUMP_TO_CODE:
        await this.handleJumpToCode(message.data);
        break;
        
      case MessageType.HIGHLIGHT_CODE:
        await this.handleHighlightCode(message.data);
        break;
        
      case MessageType.TRACE_ADDED:
        await this.handleTraceAdded(message.data);
        break;
        
      case MessageType.FOCUS_TRACE:
        await this.handleFocusTrace(message.data);
        break;
        
      case MessageType.SYNC_RESPONSE:
        await this.handleSyncResponse(message.data);
        break;
    }
  }

  private async handleJumpToCode(data: { file: string; line: number }): Promise<void> {
    try {
      // Open file in VS Code
      const uri = vscode.Uri.file(data.file);
      const document = await vscode.workspace.openTextDocument(uri);
      const editor = await vscode.window.showTextDocument(document);

      // Jump to specific line
      const position = new vscode.Position(data.line - 1, 0);
      editor.selection = new vscode.Selection(position, position);
      editor.revealRange(new vscode.Range(position, position));

      // Show notification
      vscode.window.showInformationMessage(`Jumped to ${path.basename(data.file)}:${data.line}`);
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to open ${data.file}: ${error}`);
    }
  }

  private async handleHighlightCode(data: { file: string; range: { start: number; end: number } }): Promise<void> {
    try {
      const uri = vscode.Uri.file(data.file);
      const editor = vscode.window.visibleTextEditors.find(e => e.document.uri.fsPath === uri.fsPath);
      
      if (editor) {
        const startPos = new vscode.Position(data.range.start - 1, 0);
        const endPos = new vscode.Position(data.range.end - 1, 0);
        const range = new vscode.Range(startPos, endPos);
        
        // Highlight the range
        const decoration = vscode.window.createTextEditorDecorationType({
          backgroundColor: 'rgba(255, 255, 0, 0.3)',
          isWholeLine: true
        });
        
        editor.setDecorations(decoration, [range]);
        
        // Remove highlight after 3 seconds
        setTimeout(() => {
          decoration.dispose();
        }, 3000);
      }
    } catch (error) {
      console.error('Failed to highlight code:', error);
    }
  }

  private async handleTraceAdded(data: { trace: TraceData }): Promise<void> {
    // Update local cache
    await this.localCache.addTrace(data.trace);

    // Update UI providers
    this.updateTraceProviders(data.trace);

    // Show inline metrics if enabled
    if (this.shouldShowInlineMetrics()) {
      await this.updateInlineMetrics(data.trace);
    }
  }

  // Send trace to desktop app
  async captureTrace(trace: TraceData): Promise<void> {
    // Store in local cache first
    await this.localCache.addTrace(trace);

    // Send to desktop app if connected
    if (this.desktopConnection?.isConnected()) {
      this.messageRouter.broadcastMessage({
        id: generateId(),
        type: MessageType.TRACE_ADDED,
        source: ChannelType.VSCODE_EXTENSION,
        target: ChannelType.DESKTOP_APP,
        timestamp: new Date(),
        data: { trace }
      });
    } else {
      // Show fallback UI
      this.showFallbackTraceUI([trace]);
    }
  }

  // Request focus on trace in desktop app
  async focusTrace(traceId: string): Promise<void> {
    this.messageRouter.broadcastMessage({
      id: generateId(),
      type: MessageType.FOCUS_TRACE,
      source: ChannelType.VSCODE_EXTENSION,
      timestamp: new Date(),
      data: { traceId }
    });
  }
}
```

---

## ☁️ Cloud Integration Layer

### **Real-time Collaboration**

```typescript
// Cloud-based real-time collaboration
export class CloudCollaborationManager {
  private websocket: WebSocket | null = null;
  private messageRouter: FlowScopeMessageRouter;
  private activeUsers: Map<string, UserPresence> = new Map();
  private currentSessionId: string | null = null;

  constructor(apiKey: string) {
    this.messageRouter = new FlowScopeMessageRouter();
    this.connectWebSocket(apiKey);
  }

  private connectWebSocket(apiKey: string): void {
    const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL}/collaboration?apiKey=${apiKey}`;
    this.websocket = new WebSocket(wsUrl);

    this.websocket.onopen = () => {
      console.log('Connected to collaboration service');
      this.registerForCollaboration();
    };

    this.websocket.onmessage = (event) => {
      const message = JSON.parse(event.data) as FlowScopeMessage;
      this.handleCollaborationMessage(message);
    };

    this.websocket.onclose = () => {
      console.log('Disconnected from collaboration service');
      this.scheduleReconnect();
    };
  }

  private registerForCollaboration(): void {
    this.messageRouter.registerChannel(
      ChannelType.CLOUD_PLATFORM,
      new WebSocketMessageChannel(this.websocket!)
    );
  }

  private handleCollaborationMessage(message: FlowScopeMessage): void {
    switch (message.type) {
      case MessageType.USER_JOINED:
        this.handleUserJoined(message.data);
        break;
        
      case MessageType.USER_LEFT:
        this.handleUserLeft(message.data);
        break;
        
      case MessageType.CURSOR_MOVED:
        this.handleCursorMoved(message.data);
        break;
        
      case MessageType.TRACE_ADDED:
        this.handleSharedTrace(message.data);
        break;
    }

    // Route to local channels
    this.messageRouter.routeMessage(message);
  }

  // Start collaborative session
  async startCollaborativeSession(workspaceId: string): Promise<string> {
    const sessionId = generateId();
    this.currentSessionId = sessionId;

    const message: FlowScopeMessage = {
      id: generateId(),
      type: MessageType.SESSION_STARTED,
      source: ChannelType.CLOUD_PLATFORM,
      timestamp: new Date(),
      data: {
        sessionId,
        workspaceId,
        hostUserId: await this.getCurrentUserId()
      }
    };

    this.websocket?.send(JSON.stringify(message));
    return sessionId;
  }

  // Share trace with collaborators
  async shareTrace(trace: TraceData): Promise<void> {
    if (!this.currentSessionId) return;

    const message: FlowScopeMessage = {
      id: generateId(),
      type: MessageType.TRACE_ADDED,
      source: ChannelType.CLOUD_PLATFORM,
      timestamp: new Date(),
      data: { trace },
      metadata: {
        sessionId: this.currentSessionId,
        workspaceId: trace.workspaceId
      }
    };

    this.websocket?.send(JSON.stringify(message));
  }

  // Handle user presence
  private handleUserJoined(data: { user: UserPresence; sessionId: string }): void {
    this.activeUsers.set(data.user.id, data.user);
    
    // Notify local channels
    this.messageRouter.broadcastMessage({
      id: generateId(),
      type: MessageType.USER_JOINED,
      source: ChannelType.CLOUD_PLATFORM,
      timestamp: new Date(),
      data: data
    });
  }

  private handleUserLeft(data: { userId: string; sessionId: string }): void {
    this.activeUsers.delete(data.userId);
    
    this.messageRouter.broadcastMessage({
      id: generateId(),
      type: MessageType.USER_LEFT,
      source: ChannelType.CLOUD_PLATFORM,
      timestamp: new Date(),
      data: data
    });
  }

  // Send cursor/selection updates
  async updateCursor(file: string, line: number, column: number): Promise<void> {
    if (!this.currentSessionId) return;

    const message: FlowScopeMessage = {
      id: generateId(),
      type: MessageType.CURSOR_MOVED,
      source: ChannelType.CLOUD_PLATFORM,
      timestamp: new Date(),
      data: {
        file,
        line,
        column,
        userId: await this.getCurrentUserId()
      },
      metadata: {
        sessionId: this.currentSessionId
      }
    };

    this.websocket?.send(JSON.stringify(message));
  }
}
```

---

## 🔄 Conflict Resolution & Sync

### **Smart Sync Engine**

```typescript
// Intelligent sync with conflict resolution
export class SmartSyncEngine {
  private conflictResolver: ConflictResolver;
  private syncHistory: SyncEvent[] = [];

  constructor() {
    this.conflictResolver = new ConflictResolver();
  }

  async performSync(
    localData: TraceData[],
    cloudData: TraceData[],
    lastSyncTime: Date
  ): Promise<SyncResult> {
    // Identify changes since last sync
    const localChanges = this.getChangesSince(localData, lastSyncTime);
    const cloudChanges = this.getChangesSince(cloudData, lastSyncTime);

    // Detect conflicts
    const conflicts = this.detectConflicts(localChanges, cloudChanges);

    // Resolve conflicts
    const resolutions = await this.conflictResolver.resolve(conflicts);

    // Apply changes
    const syncResult = await this.applyChanges(localChanges, cloudChanges, resolutions);

    // Record sync event
    this.recordSyncEvent(syncResult);

    return syncResult;
  }

  private detectConflicts(
    localChanges: ChangeSet,
    cloudChanges: ChangeSet
  ): Conflict[] {
    const conflicts: Conflict[] = [];

    // Check for same trace modified in both places
    for (const localTrace of localChanges.modified) {
      const cloudTrace = cloudChanges.modified.find(t => t.id === localTrace.id);
      if (cloudTrace && cloudTrace.updatedAt !== localTrace.updatedAt) {
        conflicts.push({
          type: 'trace_modified',
          localVersion: localTrace,
          cloudVersion: cloudTrace,
          conflictFields: this.getConflictingFields(localTrace, cloudTrace)
        });
      }
    }

    // Check for deleted vs modified conflicts
    for (const deletedTrace of localChanges.deleted) {
      const cloudTrace = cloudChanges.modified.find(t => t.id === deletedTrace.id);
      if (cloudTrace) {
        conflicts.push({
          type: 'delete_vs_modify',
          localVersion: deletedTrace,
          cloudVersion: cloudTrace
        });
      }
    }

    return conflicts;
  }

  private async applyChanges(
    localChanges: ChangeSet,
    cloudChanges: ChangeSet,
    resolutions: ConflictResolution[]
  ): Promise<SyncResult> {
    const result: SyncResult = {
      localUpdates: [],
      cloudUpdates: [],
      conflicts: resolutions.filter(r => r.requiresUserInput),
      success: true
    };

    try {
      // Apply cloud changes to local
      for (const trace of cloudChanges.added) {
        await this.addToLocal(trace);
        result.localUpdates.push({ type: 'added', trace });
      }

      for (const trace of cloudChanges.modified) {
        const resolution = resolutions.find(r => r.traceId === trace.id);
        if (resolution) {
          await this.updateLocal(resolution.resolvedTrace);
          result.localUpdates.push({ type: 'updated', trace: resolution.resolvedTrace });
        } else {
          await this.updateLocal(trace);
          result.localUpdates.push({ type: 'updated', trace });
        }
      }

      // Apply local changes to cloud
      for (const trace of localChanges.added) {
        await this.addToCloud(trace);
        result.cloudUpdates.push({ type: 'added', trace });
      }

      for (const trace of localChanges.modified) {
        const resolution = resolutions.find(r => r.traceId === trace.id);
        if (resolution && !resolution.requiresUserInput) {
          await this.updateCloud(resolution.resolvedTrace);
          result.cloudUpdates.push({ type: 'updated', trace: resolution.resolvedTrace });
        } else if (!resolution) {
          await this.updateCloud(trace);
          result.cloudUpdates.push({ type: 'updated', trace });
        }
      }

    } catch (error) {
      result.success = false;
      result.error = error as Error;
    }

    return result;
  }
}

// Conflict resolution strategies
export class ConflictResolver {
  async resolve(conflicts: Conflict[]): Promise<ConflictResolution[]> {
    const resolutions: ConflictResolution[] = [];

    for (const conflict of conflicts) {
      switch (conflict.type) {
        case 'trace_modified':
          resolutions.push(await this.resolveTraceModified(conflict));
          break;
          
        case 'delete_vs_modify':
          resolutions.push(await this.resolveDeleteVsModify(conflict));
          break;
      }
    }

    return resolutions;
  }

  private async resolveTraceModified(conflict: Conflict): Promise<ConflictResolution> {
    // Strategy: Merge non-conflicting fields, prefer cloud for timing data
    const merged = { ...conflict.localVersion };

    // Cloud wins for timing and status (more authoritative)
    if (conflict.cloudVersion.completedAt) {
      merged.completedAt = conflict.cloudVersion.completedAt;
    }
    if (conflict.cloudVersion.durationMs) {
      merged.durationMs = conflict.cloudVersion.durationMs;
    }
    if (conflict.cloudVersion.status !== conflict.localVersion.status) {
      merged.status = conflict.cloudVersion.status;
    }

    // Local wins for source location (more recent context)
    if (conflict.localVersion.sourceFile !== conflict.cloudVersion.sourceFile) {
      merged.sourceFile = conflict.localVersion.sourceFile;
      merged.sourceLine = conflict.localVersion.sourceLine;
    }

    // Merge tags and metadata
    merged.tags = [...new Set([
      ...(conflict.localVersion.tags || []),
      ...(conflict.cloudVersion.tags || [])
    ])];

    merged.metadata = {
      ...conflict.cloudVersion.metadata,
      ...conflict.localVersion.metadata
    };

    return {
      traceId: conflict.localVersion.id,
      strategy: 'auto_merge',
      resolvedTrace: merged,
      requiresUserInput: false
    };
  }

  private async resolveDeleteVsModify(conflict: Conflict): Promise<ConflictResolution> {
    // This requires user input - we can't automatically decide
    return {
      traceId: conflict.localVersion.id,
      strategy: 'user_choice',
      requiresUserInput: true,
      options: [
        { label: 'Keep deleted', action: 'delete', trace: conflict.localVersion },
        { label: 'Restore and update', action: 'restore', trace: conflict.cloudVersion }
      ]
    };
  }
}
```

---

## 🎛️ Configuration Management

### **Unified Settings System**

```typescript
// Cross-channel configuration synchronization
export class ConfigurationManager {
  private localConfig: LocalConfiguration;
  private cloudConfig: CloudConfiguration | null = null;
  private mergedConfig: FlowScopeConfiguration;

  constructor() {
    this.localConfig = new LocalConfiguration();
    this.loadConfiguration();
  }

  async loadConfiguration(): Promise<void> {
    // Load local configuration
    const local = await this.localConfig.load();

    // Load cloud configuration if authenticated
    let cloud = null;
    const user = await this.getAuthenticatedUser();
    if (user) {
      this.cloudConfig = new CloudConfiguration(user.apiKey);
      cloud = await this.cloudConfig.load();
    }

    // Merge configurations (cloud overrides local for sync settings)
    this.mergedConfig = this.mergeConfigurations(local, cloud);
  }

  private mergeConfigurations(
    local: LocalConfig,
    cloud: CloudConfig | null
  ): FlowScopeConfiguration {
    return {
      // Local preferences take precedence
      ui: {
        theme: local.ui.theme,
        traceDisplayMode: local.ui.traceDisplayMode,
        showInlineMetrics: local.ui.showInlineMetrics,
        autoOpenTraces: local.ui.autoOpenTraces
      },

      // Cloud settings for collaboration
      collaboration: cloud?.collaboration || {
        enableRealTimeSharing: false,
        autoJoinSessions: false,
        shareByDefault: false
      },

      // Sync settings from cloud or defaults
      sync: cloud?.sync || {
        autoSync: true,
        syncInterval: 30000,
        enableOfflineMode: true,
        conflictResolution: 'auto_merge'
      },

      // Privacy settings (local only)
      privacy: {
        localOnly: local.privacy.localOnly,
        encryptSensitiveData: local.privacy.encryptSensitiveData,
        shareUsageMetrics: local.privacy.shareUsageMetrics || false
      },

      // Integration settings
      integrations: {
        vscode: {
          autoLaunch: local.integrations.vscode.autoLaunch,
          inlineMetrics: local.integrations.vscode.inlineMetrics,
          codeNavigation: local.integrations.vscode.codeNavigation
        },
        cloud: cloud?.integrations || {
          autoUpload: false,
          teamWorkspaces: [],
          enterpriseSSO: false
        }
      }
    };
  }

  // Update configuration across all channels
  async updateConfiguration(updates: Partial<FlowScopeConfiguration>): Promise<void> {
    // Update merged config
    this.mergedConfig = { ...this.mergedConfig, ...updates };

    // Save to local storage
    await this.localConfig.save(this.extractLocalConfig(this.mergedConfig));

    // Save to cloud if available
    if (this.cloudConfig) {
      await this.cloudConfig.save(this.extractCloudConfig(this.mergedConfig));
    }

    // Broadcast configuration change
    this.broadcastConfigurationChange(updates);
  }

  private broadcastConfigurationChange(updates: Partial<FlowScopeConfiguration>): void {
    const messageRouter = getMessageRouter();
    
    messageRouter.broadcastMessage({
      id: generateId(),
      type: MessageType.CONFIGURATION_UPDATED,
      source: ChannelType.DESKTOP_APP,
      timestamp: new Date(),
      data: { updates, fullConfig: this.mergedConfig }
    });
  }

  // Get configuration for specific channel
  getConfigurationForChannel(channel: ChannelType): Partial<FlowScopeConfiguration> {
    switch (channel) {
      case ChannelType.VSCODE_EXTENSION:
        return {
          ui: this.mergedConfig.ui,
          integrations: { vscode: this.mergedConfig.integrations.vscode },
          privacy: this.mergedConfig.privacy
        };
        
      case ChannelType.CLOUD_PLATFORM:
        return {
          collaboration: this.mergedConfig.collaboration,
          sync: this.mergedConfig.sync,
          integrations: { cloud: this.mergedConfig.integrations.cloud }
        };
        
      default:
        return this.mergedConfig;
    }
  }
}

interface FlowScopeConfiguration {
  ui: {
    theme: 'light' | 'dark' | 'auto';
    traceDisplayMode: 'timeline' | 'tree' | 'table';
    showInlineMetrics: boolean;
    autoOpenTraces: boolean;
  };
  collaboration: {
    enableRealTimeSharing: boolean;
    autoJoinSessions: boolean;
    shareByDefault: boolean;
  };
  sync: {
    autoSync: boolean;
    syncInterval: number;
    enableOfflineMode: boolean;
    conflictResolution: 'auto_merge' | 'manual' | 'cloud_wins' | 'local_wins';
  };
  privacy: {
    localOnly: boolean;
    encryptSensitiveData: boolean;
    shareUsageMetrics: boolean;
  };
  integrations: {
    vscode: {
      autoLaunch: boolean;
      inlineMetrics: boolean;
      codeNavigation: boolean;
    };
    cloud: {
      autoUpload: boolean;
      teamWorkspaces: string[];
      enterpriseSSO: boolean;
    };
  };
}
```

---

## 🧪 Testing Strategy

### **Integration Testing Framework**

```typescript
// Test framework for multi-channel integration
export class IntegrationTestSuite {
  private testEnvironment: TestEnvironment;
  private mockChannels: Map<ChannelType, MockChannel> = new Map();

  constructor() {
    this.testEnvironment = new TestEnvironment();
    this.setupMockChannels();
  }

  private setupMockChannels(): void {
    this.mockChannels.set(ChannelType.DESKTOP_APP, new MockDesktopApp());
    this.mockChannels.set(ChannelType.VSCODE_EXTENSION, new MockVSCodeExtension());
    this.mockChannels.set(ChannelType.CLOUD_PLATFORM, new MockCloudPlatform());
  }

  // Test trace flow across all channels
  async testTraceFlow(): Promise<TestResult> {
    const testTrace = this.createTestTrace();
    const results: TestResult[] = [];

    // Test 1: Desktop App receives trace
    await this.mockChannels.get(ChannelType.DESKTOP_APP)!.addTrace(testTrace);
    results.push(await this.verifyTraceInChannel(ChannelType.VSCODE_EXTENSION, testTrace.id));
    results.push(await this.verifyTraceInChannel(ChannelType.CLOUD_PLATFORM, testTrace.id));

    // Test 2: VS Code triggers trace
    const vscodeTrace = this.createTestTrace();
    await this.mockChannels.get(ChannelType.VSCODE_EXTENSION)!.captureTrace(vscodeTrace);
    results.push(await this.verifyTraceInChannel(ChannelType.DESKTOP_APP, vscodeTrace.id));

    // Test 3: Cloud sync
    const cloudTrace = this.createTestTrace();
    await this.mockChannels.get(ChannelType.CLOUD_PLATFORM)!.syncTrace(cloudTrace);
    results.push(await this.verifyTraceInChannel(ChannelType.DESKTOP_APP, cloudTrace.id));

    return this.aggregateResults(results);
  }

  // Test offline behavior
  async testOfflineBehavior(): Promise<TestResult> {
    const results: TestResult[] = [];

    // Disconnect cloud
    await this.mockChannels.get(ChannelType.CLOUD_PLATFORM)!.disconnect();

    // Add traces while offline
    const offlineTrace = this.createTestTrace();
    await this.mockChannels.get(ChannelType.DESKTOP_APP)!.addTrace(offlineTrace);

    // Verify trace is queued
    results.push(await this.verifyTraceQueued(offlineTrace.id));

    // Reconnect and verify sync
    await this.mockChannels.get(ChannelType.CLOUD_PLATFORM)!.reconnect();
    await this.waitForSync();
    results.push(await this.verifyTraceInChannel(ChannelType.CLOUD_PLATFORM, offlineTrace.id));

    return this.aggregateResults(results);
  }

  // Test conflict resolution
  async testConflictResolution(): Promise<TestResult> {
    const trace = this.createTestTrace();
    const results: TestResult[] = [];

    // Create conflicting modifications
    const localVersion = { ...trace, status: 'success', updatedAt: new Date() };
    const cloudVersion = { ...trace, status: 'error', updatedAt: new Date(Date.now() + 1000) };

    // Simulate conflict
    await this.mockChannels.get(ChannelType.DESKTOP_APP)!.updateTrace(localVersion);
    await this.mockChannels.get(ChannelType.CLOUD_PLATFORM)!.updateTrace(cloudVersion);

    // Trigger sync and verify resolution
    await this.triggerSync();
    const resolvedTrace = await this.getTraceFromChannel(ChannelType.DESKTOP_APP, trace.id);
    
    results.push({
      name: 'Conflict Resolution',
      passed: resolvedTrace.status === 'error', // Cloud should win for status
      details: `Resolved status: ${resolvedTrace.status}`
    });

    return this.aggregateResults(results);
  }

  // Test cross-channel navigation
  async testCrossChannelNavigation(): Promise<TestResult> {
    const results: TestResult[] = [];

    // Test jump to code from desktop to VS Code
    const jumpRequest = { file: '/test/file.ts', line: 42 };
    await this.mockChannels.get(ChannelType.DESKTOP_APP)!.jumpToCode(jumpRequest.file, jumpRequest.line);
    
    const vscodeChannel = this.mockChannels.get(ChannelType.VSCODE_EXTENSION) as MockVSCodeExtension;
    const jumpedFile = await vscodeChannel.getCurrentFile();
    const jumpedLine = await vscodeChannel.getCurrentLine();

    results.push({
      name: 'Jump to Code',
      passed: jumpedFile === jumpRequest.file && jumpedLine === jumpRequest.line,
      details: `Jumped to ${jumpedFile}:${jumpedLine}`
    });

    // Test focus trace from VS Code to desktop
    const focusTrace = this.createTestTrace();
    await this.mockChannels.get(ChannelType.VSCODE_EXTENSION)!.focusTrace(focusTrace.id);
    
    const desktopChannel = this.mockChannels.get(ChannelType.DESKTOP_APP) as MockDesktopApp;
    const focusedTrace = await desktopChannel.getFocusedTrace();

    results.push({
      name: 'Focus Trace',
      passed: focusedTrace?.id === focusTrace.id,
      details: `Focused trace: ${focusedTrace?.id}`
    });

    return this.aggregateResults(results);
  }
}
```

---

## 📈 Success Metrics & Monitoring

### **Integration Health Monitoring**

```typescript
// Monitor integration health across all channels
export class IntegrationHealthMonitor {
  private metrics: IntegrationMetrics = {
    channelConnectivity: new Map(),
    messageLatency: new Map(),
    syncSuccess: 0,
    syncFailures: 0,
    conflictResolutions: 0,
    userSatisfaction: 0
  };

  constructor() {
    this.startMonitoring();
  }

  private startMonitoring(): void {
    // Monitor channel connectivity
    setInterval(() => {
      this.checkChannelConnectivity();
    }, 30000);

    // Monitor message latency
    setInterval(() => {
      this.measureMessageLatency();
    }, 60000);

    // Monitor sync health
    setInterval(() => {
      this.checkSyncHealth();
    }, 300000); // 5 minutes
  }

  private async checkChannelConnectivity(): Promise<void> {
    const channels = [
      ChannelType.DESKTOP_APP,
      ChannelType.VSCODE_EXTENSION,
      ChannelType.CLOUD_PLATFORM
    ];

    for (const channel of channels) {
      const isConnected = await this.pingChannel(channel);
      this.metrics.channelConnectivity.set(channel, {
        isConnected,
        lastSeen: new Date(),
        uptime: this.calculateUptime(channel)
      });
    }
  }

  private async measureMessageLatency(): Promise<void> {
    const testMessage: FlowScopeMessage = {
      id: generateId(),
      type: MessageType.PING,
      source: ChannelType.DESKTOP_APP,
      timestamp: new Date(),
      data: { pingTime: Date.now() }
    };

    const latencies = await this.broadcastAndMeasure(testMessage);
    
    for (const [channel, latency] of latencies) {
      this.metrics.messageLatency.set(channel, latency);
    }
  }

  // Generate health report
  generateHealthReport(): IntegrationHealthReport {
    const connectivity = Array.from(this.metrics.channelConnectivity.entries()).map(
      ([channel, status]) => ({
        channel,
        isConnected: status.isConnected,
        uptime: status.uptime,
        lastSeen: status.lastSeen
      })
    );

    const latency = Array.from(this.metrics.messageLatency.entries()).map(
      ([channel, ms]) => ({ channel, latencyMs: ms })
    );

    const syncHealth = {
      successRate: this.metrics.syncSuccess / (this.metrics.syncSuccess + this.metrics.syncFailures),
      totalSyncs: this.metrics.syncSuccess + this.metrics.syncFailures,
      conflicts: this.metrics.conflictResolutions
    };

    return {
      overall: this.calculateOverallHealth(),
      connectivity,
      latency,
      sync: syncHealth,
      timestamp: new Date()
    };
  }

  private calculateOverallHealth(): number {
    // Calculate weighted health score (0-100)
    const connectivityScore = this.getConnectivityScore();
    const latencyScore = this.getLatencyScore();
    const syncScore = this.getSyncScore();

    return Math.round(
      connectivityScore * 0.4 + 
      latencyScore * 0.3 + 
      syncScore * 0.3
    );
  }
}

interface IntegrationHealthReport {
  overall: number; // 0-100 health score
  connectivity: ChannelConnectivity[];
  latency: ChannelLatency[];
  sync: SyncHealth;
  timestamp: Date;
}
```

---

## 🎯 Success Criteria

### **Technical Success Metrics**
- [ ] 99.5% message delivery success rate across channels
- [ ] < 100ms average message latency between channels
- [ ] 95% successful auto-discovery of VS Code extension
- [ ] 90% successful cloud sync completion rate
- [ ] < 1% data loss during sync conflicts

### **User Experience Metrics**  
- [ ] 95% users successfully connect all channels
- [ ] < 30 seconds for initial setup and discovery
- [ ] 90% users report seamless cross-channel experience
- [ ] 85% users actively use collaborative features
- [ ] 4.8+ average user satisfaction rating

### **Business Metrics**
- [ ] 60% desktop users also install VS Code extension
- [ ] 40% users upgrade to cloud collaboration features
- [ ] 25% users engage in team collaboration
- [ ] 15% progression to enterprise features
- [ ] 95% retention rate after successful integration

---

This integration strategy ensures that FlowScope delivers a truly unified experience across all channels while maintaining the flexibility for users to choose their preferred combination of tools and features.
