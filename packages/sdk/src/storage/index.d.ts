import { Storage } from '../types';
/**
 * In-memory storage implementation
 * Data is lost when the process exits
 */
export declare class MemoryStorage implements Storage {
    private data;
    save(key: string, data: any): Promise<void>;
    load(key: string): Promise<any>;
    delete(key: string): Promise<void>;
    clear(): Promise<void>;
}
/**
 * Local storage implementation for browsers
 */
export declare class LocalStorage implements Storage {
    private prefix;
    constructor(prefix?: string);
    save(key: string, data: any): Promise<void>;
    load(key: string): Promise<any>;
    delete(key: string): Promise<void>;
    clear(): Promise<void>;
}
/**
 * File system storage implementation for Node.js
 */
export declare class FileStorage implements Storage {
    private basePath;
    constructor(basePath?: string);
    save(key: string, data: any): Promise<void>;
    load(key: string): Promise<any>;
    delete(key: string): Promise<void>;
    clear(): Promise<void>;
}
