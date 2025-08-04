import { Storage } from '../types';

/**
 * In-memory storage implementation
 * Data is lost when the process exits
 */
export class MemoryStorage implements Storage {
  private data = new Map<string, any>();
  
  async save(key: string, data: any): Promise<void> {
    this.data.set(key, JSON.parse(JSON.stringify(data))); // Deep clone
  }
  
  async load(key: string): Promise<any> {
    const data = this.data.get(key);
    return data ? JSON.parse(JSON.stringify(data)) : undefined; // Deep clone
  }
  
  async delete(key: string): Promise<void> {
    this.data.delete(key);
  }
  
  async clear(): Promise<void> {
    this.data.clear();
  }
}

/**
 * Local storage implementation for browsers
 */
export class LocalStorage implements Storage {
  private prefix: string;
  
  constructor(prefix = 'flowscope_') {
    this.prefix = prefix;
    
    if (typeof window === 'undefined' || !window.localStorage) {
      throw new Error('LocalStorage is not available in this environment');
    }
  }
  
  async save(key: string, data: any): Promise<void> {
    const serialized = JSON.stringify(data);
    localStorage.setItem(this.prefix + key, serialized);
  }
  
  async load(key: string): Promise<any> {
    const serialized = localStorage.getItem(this.prefix + key);
    return serialized ? JSON.parse(serialized) : undefined;
  }
  
  async delete(key: string): Promise<void> {
    localStorage.removeItem(this.prefix + key);
  }
  
  async clear(): Promise<void> {
    const keys = Object.keys(localStorage).filter(key => key.startsWith(this.prefix));
    keys.forEach(key => localStorage.removeItem(key));
  }
}

/**
 * File system storage implementation for Node.js
 */
export class FileStorage implements Storage {
  private basePath: string;
  
  constructor(basePath = './flowscope-data') {
    this.basePath = basePath;
    
    if (typeof window !== 'undefined') {
      throw new Error('FileStorage is not available in browser environments');
    }
  }
  
  async save(key: string, data: any): Promise<void> {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    const filePath = path.join(this.basePath, `${key}.json`);
    const dirPath = path.dirname(filePath);
    
    // Ensure directory exists
    await fs.mkdir(dirPath, { recursive: true });
    
    // Write data
    const serialized = JSON.stringify(data, null, 2);
    await fs.writeFile(filePath, serialized, 'utf8');
  }
  
  async load(key: string): Promise<any> {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    const filePath = path.join(this.basePath, `${key}.json`);
    
    try {
      const serialized = await fs.readFile(filePath, 'utf8');
      return JSON.parse(serialized);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return undefined; // File doesn't exist
      }
      throw error;
    }
  }
  
  async delete(key: string): Promise<void> {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    const filePath = path.join(this.basePath, `${key}.json`);
    
    try {
      await fs.unlink(filePath);
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
      // File doesn't exist, that's fine
    }
  }
  
  async clear(): Promise<void> {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    try {
      const files = await fs.readdir(this.basePath);
      const jsonFiles = files.filter(file => file.endsWith('.json'));
      
      await Promise.all(
        jsonFiles.map(file => 
          fs.unlink(path.join(this.basePath, file))
        )
      );
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
      // Directory doesn't exist, that's fine
    }
  }
}
