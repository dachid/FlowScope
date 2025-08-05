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
exports.FileStorage = exports.LocalStorage = exports.MemoryStorage = void 0;
/**
 * In-memory storage implementation
 * Data is lost when the process exits
 */
class MemoryStorage {
    constructor() {
        this.data = new Map();
    }
    async save(key, data) {
        this.data.set(key, JSON.parse(JSON.stringify(data))); // Deep clone
    }
    async load(key) {
        const data = this.data.get(key);
        return data ? JSON.parse(JSON.stringify(data)) : undefined; // Deep clone
    }
    async delete(key) {
        this.data.delete(key);
    }
    async clear() {
        this.data.clear();
    }
}
exports.MemoryStorage = MemoryStorage;
/**
 * Local storage implementation for browsers
 */
class LocalStorage {
    constructor(prefix = 'flowscope_') {
        this.prefix = prefix;
        if (typeof window === 'undefined' || !window.localStorage) {
            throw new Error('LocalStorage is not available in this environment');
        }
    }
    async save(key, data) {
        const serialized = JSON.stringify(data);
        localStorage.setItem(this.prefix + key, serialized);
    }
    async load(key) {
        const serialized = localStorage.getItem(this.prefix + key);
        return serialized ? JSON.parse(serialized) : undefined;
    }
    async delete(key) {
        localStorage.removeItem(this.prefix + key);
    }
    async clear() {
        const keys = Object.keys(localStorage).filter(key => key.startsWith(this.prefix));
        keys.forEach(key => localStorage.removeItem(key));
    }
}
exports.LocalStorage = LocalStorage;
/**
 * File system storage implementation for Node.js
 */
class FileStorage {
    constructor(basePath = './flowscope-data') {
        this.basePath = basePath;
        if (typeof window !== 'undefined') {
            throw new Error('FileStorage is not available in browser environments');
        }
    }
    async save(key, data) {
        const fs = await Promise.resolve().then(() => __importStar(require('fs/promises')));
        const path = await Promise.resolve().then(() => __importStar(require('path')));
        const filePath = path.join(this.basePath, `${key}.json`);
        const dirPath = path.dirname(filePath);
        // Ensure directory exists
        await fs.mkdir(dirPath, { recursive: true });
        // Write data
        const serialized = JSON.stringify(data, null, 2);
        await fs.writeFile(filePath, serialized, 'utf8');
    }
    async load(key) {
        const fs = await Promise.resolve().then(() => __importStar(require('fs/promises')));
        const path = await Promise.resolve().then(() => __importStar(require('path')));
        const filePath = path.join(this.basePath, `${key}.json`);
        try {
            const serialized = await fs.readFile(filePath, 'utf8');
            return JSON.parse(serialized);
        }
        catch (error) {
            if (error.code === 'ENOENT') {
                return undefined; // File doesn't exist
            }
            throw error;
        }
    }
    async delete(key) {
        const fs = await Promise.resolve().then(() => __importStar(require('fs/promises')));
        const path = await Promise.resolve().then(() => __importStar(require('path')));
        const filePath = path.join(this.basePath, `${key}.json`);
        try {
            await fs.unlink(filePath);
        }
        catch (error) {
            if (error.code !== 'ENOENT') {
                throw error;
            }
            // File doesn't exist, that's fine
        }
    }
    async clear() {
        const fs = await Promise.resolve().then(() => __importStar(require('fs/promises')));
        const path = await Promise.resolve().then(() => __importStar(require('path')));
        try {
            const files = await fs.readdir(this.basePath);
            const jsonFiles = files.filter(file => file.endsWith('.json'));
            await Promise.all(jsonFiles.map(file => fs.unlink(path.join(this.basePath, file))));
        }
        catch (error) {
            if (error.code !== 'ENOENT') {
                throw error;
            }
            // Directory doesn't exist, that's fine
        }
    }
}
exports.FileStorage = FileStorage;
