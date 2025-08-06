import Database from 'better-sqlite3';
import { join } from 'path';
import { app } from 'electron';

export interface Session {
  id: string;
  name: string;
  start_time: number;
  end_time?: number;
  status: 'active' | 'completed' | 'archived';
  metadata?: string;
  workspace_path?: string;
  created_at: number;
}

export interface Trace {
  id: string;
  session_id: string;
  parent_id?: string;
  operation: string;
  language: string;
  framework: string;
  start_time: number;
  end_time?: number;
  duration?: number;
  data: string;
  metadata?: string;
  status: 'pending' | 'success' | 'error' | 'timeout';
  error?: string;
}

export interface Prompt {
  id: string;
  name: string;
  content: string;
  version: string;
  session_id?: string;
  created_at: number;
}

export interface Bookmark {
  id: string;
  trace_id: string;
  title: string;
  description?: string;
  color: string;
  created_at: number;
}

export class FlowScopeDatabase {
  private db: Database.Database;

  constructor(userDataPath?: string) {
    const dbPath = userDataPath 
      ? join(userDataPath, 'flowscope.db')
      : join(app.getPath('userData'), 'flowscope.db');
    
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('synchronous = NORMAL');
    this.db.pragma('cache_size = 1000000');
    this.db.pragma('temp_store = memory');
    
    this.initializeSchema();
  }

  private initializeSchema(): void {
    // Create tables
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        start_time INTEGER NOT NULL,
        end_time INTEGER,
        status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
        metadata TEXT,
        workspace_path TEXT,
        created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
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
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'error', 'timeout')),
        error TEXT,
        FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS prompts (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        content TEXT NOT NULL,
        version TEXT DEFAULT '1.0.0',
        session_id TEXT,
        created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
        FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS bookmarks (
        id TEXT PRIMARY KEY,
        trace_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        color TEXT DEFAULT '#FFD700',
        created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
        FOREIGN KEY (trace_id) REFERENCES traces(id) ON DELETE CASCADE
      );
    `);

    // Create performance indexes
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_traces_session_time 
      ON traces(session_id, start_time DESC);
      
      CREATE INDEX IF NOT EXISTS idx_traces_status 
      ON traces(status);
      
      CREATE INDEX IF NOT EXISTS idx_traces_operation 
      ON traces(operation);
      
      CREATE INDEX IF NOT EXISTS idx_sessions_status_time 
      ON sessions(status, created_at DESC);
      
      CREATE INDEX IF NOT EXISTS idx_bookmarks_trace 
      ON bookmarks(trace_id);
    `);
  }

  // Session operations
  createSession(session: Omit<Session, 'id' | 'created_at'>): Session {
    const id = this.generateId();
    const created_at = Date.now();
    
    const stmt = this.db.prepare(`
      INSERT INTO sessions (id, name, start_time, end_time, status, metadata, workspace_path, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      id,
      session.name,
      session.start_time,
      session.end_time || null,
      session.status,
      session.metadata || null,
      session.workspace_path || null,
      created_at
    );

    return { ...session, id, created_at };
  }

  getSessions(limit = 100, offset = 0): Session[] {
    const stmt = this.db.prepare(`
      SELECT * FROM sessions 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `);
    
    return stmt.all(limit, offset) as Session[];
  }

  getSession(id: string): Session | null {
    const stmt = this.db.prepare('SELECT * FROM sessions WHERE id = ?');
    return stmt.get(id) as Session | null;
  }

  updateSession(id: string, updates: Partial<Session>): boolean {
    const fields = Object.keys(updates).filter(key => key !== 'id');
    if (fields.length === 0) return false;

    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(field => updates[field as keyof Session]);

    const stmt = this.db.prepare(`UPDATE sessions SET ${setClause} WHERE id = ?`);
    const result = stmt.run(...values, id);
    
    return result.changes > 0;
  }

  deleteSession(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM sessions WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // Trace operations
  insertTrace(trace: Omit<Trace, 'id'>): Trace {
    const id = this.generateId();
    
    const stmt = this.db.prepare(`
      INSERT INTO traces (
        id, session_id, parent_id, operation, language, framework,
        start_time, end_time, duration, data, metadata, status, error
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      id,
      trace.session_id,
      trace.parent_id || null,
      trace.operation,
      trace.language,
      trace.framework,
      trace.start_time,
      trace.end_time || null,
      trace.duration || null,
      trace.data,
      trace.metadata || null,
      trace.status,
      trace.error || null
    );

    return { ...trace, id };
  }

  getTraces(sessionId: string, limit = 1000, offset = 0): Trace[] {
    const stmt = this.db.prepare(`
      SELECT * FROM traces 
      WHERE session_id = ? 
      ORDER BY start_time ASC 
      LIMIT ? OFFSET ?
    `);
    
    return stmt.all(sessionId, limit, offset) as Trace[];
  }

  getTrace(id: string): Trace | null {
    const stmt = this.db.prepare('SELECT * FROM traces WHERE id = ?');
    return stmt.get(id) as Trace | null;
  }

  updateTrace(id: string, updates: Partial<Trace>): boolean {
    const fields = Object.keys(updates).filter(key => key !== 'id');
    if (fields.length === 0) return false;

    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(field => updates[field as keyof Trace]);

    const stmt = this.db.prepare(`UPDATE traces SET ${setClause} WHERE id = ?`);
    const result = stmt.run(...values, id);
    
    return result.changes > 0;
  }

  // Bookmark operations
  createBookmark(bookmark: Omit<Bookmark, 'id' | 'created_at'>): Bookmark {
    const id = this.generateId();
    const created_at = Date.now();
    
    const stmt = this.db.prepare(`
      INSERT INTO bookmarks (id, trace_id, title, description, color, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      id,
      bookmark.trace_id,
      bookmark.title,
      bookmark.description || null,
      bookmark.color,
      created_at
    );

    return { ...bookmark, id, created_at };
  }

  getBookmarks(): Bookmark[] {
    const stmt = this.db.prepare('SELECT * FROM bookmarks ORDER BY created_at DESC');
    return stmt.all() as Bookmark[];
  }

  deleteBookmark(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM bookmarks WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // Utility methods
  private generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  getStats() {
    const sessionCount = this.db.prepare('SELECT COUNT(*) as count FROM sessions').get() as { count: number };
    const traceCount = this.db.prepare('SELECT COUNT(*) as count FROM traces').get() as { count: number };
    const bookmarkCount = this.db.prepare('SELECT COUNT(*) as count FROM bookmarks').get() as { count: number };

    return {
      sessions: sessionCount.count,
      traces: traceCount.count,
      bookmarks: bookmarkCount.count
    };
  }

  close(): void {
    this.db.close();
  }
}
