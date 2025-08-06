# Phase 6A: Electron Desktop App Implementation Plan

## 📋 Overview

**Goal**: Build the core FlowScope desktop application as the primary platform, providing rich visualization, local data storage, and seamless developer experience.

**Timeline**: Week 11-12 (2 weeks)

**Priority**: Primary channel - all other channels depend on this foundation

---

## 🎯 Core Objectives

1. **Rich Visualization Engine**: Advanced trace visualization that VS Code extensions cannot provide
2. **Local-First Storage**: Complete SQLite-based data management
3. **Auto-Integration**: Detect and install VS Code extension automatically
4. **Cross-Platform**: Windows, macOS, and Linux support
5. **Performance**: Handle large trace volumes efficiently

---

## 🏗️ Technical Architecture

### **Electron App Structure**

```
flowscope-desktop/
├── src/
│   ├── main/                    # Electron main process
│   │   ├── main.ts              # Entry point
│   │   ├── database/            # SQLite management
│   │   ├── api/                 # Local HTTP API server
│   │   ├── installer/           # VS Code extension installer
│   │   └── utils/               # File system, OS detection
│   ├── renderer/                # Frontend (React)
│   │   ├── components/          # UI components
│   │   ├── pages/               # Main application pages
│   │   ├── hooks/               # React hooks for data
│   │   └── services/            # API communication
│   └── shared/                  # Shared types and utilities
├── assets/                      # Icons, images
├── build/                       # Build configuration
└── dist/                        # Built application
```

### **Core Components**

#### 1. **Local Database Service**
```typescript
// SQLite database with full schema
class FlowScopeDatabase {
  private db: Database;
  
  constructor(userDataPath: string) {
    this.db = new Database(path.join(userDataPath, 'flowscope.db'));
    this.db.pragma('journal_mode = WAL');
    this.initializeSchema();
  }

  private initializeSchema() {
    // Complete database schema matching current Prisma schema
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        name TEXT,
        start_time INTEGER,
        end_time INTEGER,
        status TEXT DEFAULT 'active',
        metadata TEXT,
        workspace_path TEXT,
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
      );

      CREATE TABLE IF NOT EXISTS traces (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        parent_id TEXT,
        operation TEXT NOT NULL,
        language TEXT DEFAULT 'javascript',
        framework TEXT DEFAULT 'unknown',
        start_time INTEGER NOT NULL,
        end_time INTEGER,
        duration INTEGER,
        data TEXT NOT NULL,
        metadata TEXT,
        status TEXT DEFAULT 'pending',
        error TEXT,
        FOREIGN KEY (session_id) REFERENCES sessions(id)
      );

      CREATE TABLE IF NOT EXISTS prompts (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        content TEXT NOT NULL,
        version TEXT DEFAULT '1.0.0',
        session_id TEXT,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        FOREIGN KEY (session_id) REFERENCES sessions(id)
      );

      CREATE TABLE IF NOT EXISTS bookmarks (
        id TEXT PRIMARY KEY,
        trace_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        color TEXT DEFAULT '#FFD700',
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        FOREIGN KEY (trace_id) REFERENCES traces(id)
      );
    `);

    // Performance indexes
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_traces_session_time 
      ON traces(session_id, start_time DESC);
      
      CREATE INDEX IF NOT EXISTS idx_traces_status 
      ON traces(status);
      
      CREATE INDEX IF NOT EXISTS idx_traces_operation 
      ON traces(operation);
    `);
  }
}
```

#### 2. **Local API Server**
```typescript
// HTTP API for VS Code extension communication
class FlowScopeAPIServer {
  private app: Express;
  private server: Server;
  private database: FlowScopeDatabase;

  constructor(database: FlowScopeDatabase) {
    this.database = database;
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupRoutes() {
    // Health check for VS Code extension
    this.app.get('/health', (req, res) => {
      res.json({ 
        status: 'ready', 
        version: app.getVersion(),
        mode: 'desktop'
      });
    });

    // Trace ingestion
    this.app.post('/traces', async (req, res) => {
      const trace = req.body;
      await this.database.insertTrace(trace);
      
      // Notify renderer process
      this.notifyRenderer('trace:new', trace);
      
      res.status(201).json({ status: 'created' });
    });

    // Session management
    this.app.get('/sessions', async (req, res) => {
      const sessions = await this.database.getSessions();
      res.json(sessions);
    });

    this.app.post('/sessions', async (req, res) => {
      const session = await this.database.createSession(req.body);
      res.status(201).json(session);
    });
  }

  async start(): Promise<number> {
    // Find available port starting from 31847
    const port = await this.findAvailablePort(31847);
    this.server = this.app.listen(port);
    return port;
  }
}
```

#### 3. **VS Code Extension Auto-Installer**
```typescript
class VSCodeExtensionInstaller {
  async detectVSCode(): Promise<boolean> {
    try {
      const { exec } = require('child_process');
      return new Promise((resolve) => {
        exec('code --version', (error) => {
          resolve(!error);
        });
      });
    } catch {
      return false;
    }
  }

  async isExtensionInstalled(): Promise<boolean> {
    try {
      const { exec } = require('child_process');
      return new Promise((resolve) => {
        exec('code --list-extensions', (error, stdout) => {
          if (error) resolve(false);
          resolve(stdout.includes('flowscope.flowscope-vscode'));
        });
      });
    } catch {
      return false;
    }
  }

  async installExtension(): Promise<boolean> {
    try {
      const { exec } = require('child_process');
      return new Promise((resolve) => {
        exec('code --install-extension flowscope.flowscope-vscode', (error) => {
          resolve(!error);
        });
      });
    } catch {
      return false;
    }
  }

  async promptUserForInstallation(): Promise<boolean> {
    const { dialog } = require('electron');
    const result = await dialog.showMessageBox({
      type: 'question',
      buttons: ['Install Extension', 'Skip', 'Don\'t Ask Again'],
      defaultId: 0,
      title: 'FlowScope VS Code Integration',
      message: 'VS Code detected! Install FlowScope extension for seamless integration?',
      detail: 'The extension provides code annotations, inline metrics, and seamless debugging workflow.'
    });

    return result.response === 0;
  }
}
```

---

## 🎨 User Interface Design

### **Main Application Layout**

```
┌─────────────────────────────────────────────────────────┐
│ ☰ FlowScope Desktop    [○][□][✕]                        │
├─────────────────────────────────────────────────────────┤
│ 📁 Sessions | 🔍 Search | ⚙️ Settings | ☁️ Sync        │ 
├─────────────┬───────────────────────────────────────────┤
│ Session     │                                           │
│ Tree        │          Trace Visualization              │
│             │                                           │
│ ├ 📝 Sess1  │     ┌─────────────────────────────────┐   │
│ │ ├ 🔗 T1   │     │     Interactive Timeline       │   │
│ │ ├ 🔗 T2   │     │  ├──┬──┬────┬───┬──────────┤   │   │
│ │ └ 🔗 T3   │     │  LLM│DB│VEC │LLM│  RESPONSE │   │   │
│ └ 📝 Sess2  │     │     │  │    │   │          │   │   │
│             │     └─────────────────────────────────┘   │
│             │                                           │
│ 🔖 Bookmarks│          Trace Details Panel              │
│ ├ ⭐ Issue1 │     ┌─────────────────────────────────┐   │
│ └ ⭐ Slow   │     │ Input:  "Cancel subscription"   │   │
│             │     │ Output: "I'll help you with..  │   │
│             │     │ Duration: 1.2s                  │   │
│             │     │ Tokens: 45 in, 120 out        │   │
│             │     └─────────────────────────────────┘   │
└─────────────┴───────────────────────────────────────────┘
```

### **Key UI Components**

#### 1. **Session Management Panel**
- Tree view of all debugging sessions
- Real-time session status indicators
- Quick session switching
- Session import/export buttons

#### 2. **Interactive Trace Timeline**
- Horizontal timeline showing trace execution
- Color-coded operations (LLM calls, DB queries, etc.)
- Zoom and pan capabilities
- Click to focus on specific traces

#### 3. **Trace Details Panel**
- Full input/output data with syntax highlighting
- Performance metrics and token usage
- Error details with stack traces
- Related traces and dependencies

#### 4. **Search and Filter Bar**
- Global search across all sessions
- Advanced filters (time range, operation type, status)
- Saved search queries
- Real-time search results

---

## 📊 Core Features Implementation

### **Week 11: Foundation (Days 1-5)**

#### **Day 1-2: Project Setup and Database**
- [ ] Initialize Electron project with TypeScript
- [ ] Set up build configuration with electron-builder
- [ ] Implement SQLite database service
- [ ] Create database schema and migrations
- [ ] Add data import/export functionality

#### **Day 3-4: Local API Server**
- [x] Build Express.js API server in main process
- [x] Implement trace ingestion endpoints
- [x] Add session management APIs
- [x] Set up WebSocket for real-time updates
- [x] Test API with existing SDK traces

#### **Day 5: Basic UI Framework**
- [x] Set up React frontend in renderer process
- [x] Create main application layout
- [x] Implement basic session tree view
- [x] Add trace list component
- [x] Set up state management (Redux/Zustand)

### **Week 12: Rich Visualization (Days 6-10)**

#### **Day 6-7: Trace Visualization Engine**
- [x] Build interactive timeline component
- [x] Implement trace flow diagram
- [x] Add performance charts and metrics
- [x] Create trace detail panels
- [x] Implement zoom and filtering

#### **Day 8-9: VS Code Integration**
- [x] Build VS Code detection service
- [x] Implement extension auto-installer
- [x] Create companion mode API
- [x] Add jump-to-code functionality
- [x] Test integration workflow
- [x] Handle missing extension gracefully
- [ ] Publish VS Code extension to marketplace

#### **Day 10: Polish and Packaging**
- [x] Implement auto-updater
- [x] Add native menu items and shortcuts
- [x] Create installer packages for all platforms
- [x] Performance optimization and testing
- [x] Documentation and user guides

---

## 🔧 Technical Specifications

### **Performance Requirements**
- **Startup Time**: < 3 seconds on modern hardware
- **Trace Rendering**: < 100ms for 1000+ traces
- **Memory Usage**: < 500MB for typical sessions
- **Database Queries**: < 50ms for common operations

### **Storage Management**
```typescript
class StorageManager {
  private readonly MAX_SESSIONS = 100;
  private readonly MAX_TRACES_PER_SESSION = 10000;
  private readonly AUTO_CLEANUP_DAYS = 30;

  async cleanup(): Promise<void> {
    // Remove sessions older than 30 days
    await this.database.execute(`
      DELETE FROM sessions 
      WHERE created_at < strftime('%s', 'now', '-30 days')
    `);

    // Limit session count
    await this.database.execute(`
      DELETE FROM sessions 
      WHERE id NOT IN (
        SELECT id FROM sessions 
        ORDER BY created_at DESC 
        LIMIT ${this.MAX_SESSIONS}
      )
    `);
  }
}
```

### **Cross-Platform Considerations**
- **Windows**: Handle file associations and system tray
- **macOS**: App signing and notarization required
- **Linux**: AppImage and .deb packages for wide compatibility

---

## 📦 Distribution Strategy

### **Installation Packages**
- **Windows**: `.exe` installer with auto-update
- **macOS**: `.dmg` with code signing
- **Linux**: `.AppImage` for universal compatibility

### **Auto-Update System**
```typescript
// Electron auto-updater configuration
class AutoUpdater {
  constructor() {
    autoUpdater.setFeedURL({
      provider: 'github',
      owner: 'flowscope',
      repo: 'flowscope-desktop'
    });
  }

  async checkForUpdates(): Promise<void> {
    if (app.isPackaged) {
      await autoUpdater.checkForUpdatesAndNotify();
    }
  }
}
```

---

## 🧪 Testing Strategy

### **Unit Testing**
- Database operations and schema validation
- API endpoint functionality
- Trace processing and visualization logic
- VS Code integration utilities

### **Integration Testing**
- Full application workflow testing
- Cross-platform compatibility
- Performance testing with large datasets
- VS Code extension communication

### **User Acceptance Testing**
- Developer workflow validation
- UI/UX testing with real users
- Performance benchmarking
- Installation and setup testing

---

## 📈 Success Metrics

### **Technical Metrics**
- [ ] Startup time < 3 seconds
- [ ] Trace visualization < 100ms
- [ ] Memory usage < 500MB
- [ ] 99.9% crash-free sessions

### **User Experience Metrics**
- [ ] 90% successful first-run experience
- [ ] 80% VS Code extension auto-install success
- [ ] 4.5+ star rating in early user feedback
- [ ] 95% of traces processed without errors

### **Business Metrics**
- [ ] 1000+ downloads in first month
- [ ] 60% weekly active user retention
- [ ] 30% user progression to cloud features
- [ ] 5+ enterprise customer inquiries

---

This implementation plan establishes the Electron Desktop App as the robust foundation for the entire FlowScope platform, providing developers with a powerful, local-first debugging experience while setting up seamless integration with VS Code and optional cloud collaboration.
