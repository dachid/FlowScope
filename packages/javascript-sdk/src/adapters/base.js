"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseAdapter = void 0;
const events_1 = require("events");
const uuid_1 = require("uuid");
/**
 * Base adapter class for framework integrations
 * Provides common functionality for all adapters
 */
class BaseAdapter extends events_1.EventEmitter {
    constructor() {
        super(...arguments);
        this.isIntegrated = false;
        this.activeChains = new Map();
    }
    /**
     * Capture a trace event
     */
    captureTrace(event) {
        const timestamp = Date.now();
        const traceId = (0, uuid_1.v4)();
        return {
            id: traceId,
            timestamp,
            sessionId: this.currentSession?.id || 'default',
            chainId: this.generateChainId(event),
            type: this.determineEventType(event),
            status: 'completed', // Default status, can be overridden
            data: this.sanitizeEventData(event),
            metadata: this.extractMetadata(event),
        };
    }
    /**
     * Start a new session
     */
    startSession(sessionId, metadata) {
        const session = {
            id: sessionId || (0, uuid_1.v4)(),
            startTime: Date.now(),
            metadata,
        };
        this.currentSession = session;
        this.emit('session:start', session);
        return session;
    }
    /**
     * End the current session
     */
    endSession() {
        if (this.currentSession) {
            this.currentSession.endTime = Date.now();
            this.emit('session:end', this.currentSession);
            this.currentSession = undefined;
        }
    }
    /**
     * Start tracking a chain execution
     */
    startChain(chainId, name, metadata) {
        const context = {
            chainId,
            sessionId: this.currentSession?.id || 'default',
            name,
            startTime: Date.now(),
            status: 'running',
            metadata,
        };
        this.activeChains.set(chainId, context);
        this.emit('chain:start', context);
        return context;
    }
    /**
     * End tracking a chain execution
     */
    endChain(chainId, status = 'completed') {
        const context = this.activeChains.get(chainId);
        if (context) {
            context.endTime = Date.now();
            context.status = status;
            this.activeChains.delete(chainId);
            this.emit('chain:end', context);
        }
    }
    /**
     * Emit a trace event
     */
    emitTrace(trace) {
        this.emit('trace', trace);
    }
    /**
     * Sanitize event data to remove sensitive information
     */
    sanitizeEventData(event) {
        // Default implementation - subclasses can override
        if (typeof event === 'object' && event !== null) {
            const sanitized = { ...event };
            // Remove common sensitive fields
            delete sanitized.apiKey;
            delete sanitized.token;
            delete sanitized.password;
            delete sanitized.secret;
            return sanitized;
        }
        return event;
    }
    /**
     * Extract metadata from the event
     */
    extractMetadata(event) {
        // Default implementation - subclasses can override
        return {
            framework: this.name,
            version: this.version,
            timestamp: Date.now(),
        };
    }
    /**
     * Log debug information if debug mode is enabled
     */
    debug(message, ...args) {
        if (process.env.FLOWSCOPE_DEBUG === 'true') {
            console.debug(`[FlowScope:${this.name}] ${message}`, ...args);
        }
    }
    /**
     * Handle adapter errors
     */
    handleError(error) {
        this.debug('Adapter error:', error);
        this.emit('error', error);
    }
}
exports.BaseAdapter = BaseAdapter;
