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
exports.FlowScopeSDK = void 0;
const events_1 = require("events");
const uuid_1 = require("uuid");
/**
 * Main FlowScope SDK class
 * Provides the primary interface for LLM chain debugging and observability
 */
class FlowScopeSDK extends events_1.EventEmitter {
    constructor(config) {
        super();
        this.adapters = new Map();
        this.traceBuffer = [];
        this.config = {
            autoDetect: true,
            batchSize: 10,
            flushInterval: 5000,
            maxTraces: 1000,
            debug: false,
            ...config,
        };
        this.setupEventHandling();
        this.startFlushTimer();
    }
    /**
     * Initialize the SDK with configuration
     */
    async init() {
        this.debug('Initializing FlowScope SDK', this.config);
        // Auto-detect and integrate supported frameworks
        if (this.config.autoDetect) {
            await this.autoDetectFrameworks();
        }
        // Initialize storage if configured
        if (this.storage) {
            await this.initializeStorage();
        }
        this.debug('FlowScope SDK initialized successfully');
    }
    /**
     * Manually trace a chain execution
     */
    trace(chainId, data) {
        const trace = {
            id: data.id || (0, uuid_1.v4)(),
            timestamp: data.timestamp || Date.now(),
            sessionId: data.sessionId || this.currentSession?.id || 'default',
            chainId,
            type: data.type || 'prompt',
            status: data.status || 'completed',
            data: data.data || {},
            metadata: {
                manual: true,
                ...data.metadata,
            },
        };
        this.addTrace(trace);
    }
    /**
     * Start a new debugging session
     */
    startSession(sessionId, metadata) {
        const session = {
            id: sessionId || (0, uuid_1.v4)(),
            startTime: Date.now(),
            metadata: {
                sdkVersion: '1.0.0',
                ...metadata,
            },
        };
        this.currentSession = session;
        this.emit('session:start', session);
        this.debug('Session started:', session.id);
        return session;
    }
    /**
     * End the current debugging session
     */
    endSession() {
        if (this.currentSession) {
            this.currentSession.endTime = Date.now();
            this.emit('session:end', this.currentSession);
            this.debug('Session ended:', this.currentSession.id);
            this.currentSession = undefined;
        }
    }
    /**
     * Add a framework adapter
     */
    addAdapter(adapter) {
        this.adapters.set(adapter.name, adapter);
        // Setup event forwarding from adapter
        adapter.on('trace', (trace) => {
            this.addTrace(trace);
        });
        adapter.on('session:start', (session) => {
            this.currentSession = session;
            this.emit('session:start', session);
        });
        adapter.on('session:end', (session) => {
            this.emit('session:end', session);
        });
        adapter.on('chain:start', (context) => {
            this.emit('chain:start', context);
        });
        adapter.on('chain:end', (context) => {
            this.emit('chain:end', context);
        });
        adapter.on('error', (error) => {
            this.handleError(error);
        });
        this.debug(`Adapter added: ${adapter.name}`);
    }
    /**
     * Remove a framework adapter
     */
    removeAdapter(name) {
        const adapter = this.adapters.get(name);
        if (adapter) {
            adapter.removeAllListeners();
            adapter.disconnect();
            this.adapters.delete(name);
            this.debug(`Adapter removed: ${name}`);
        }
    }
    /**
     * Set the transport for sending traces
     */
    setTransport(transport) {
        this.transport = transport;
        this.debug('Transport configured');
    }
    /**
     * Set the storage for local persistence
     */
    setStorage(storage) {
        this.storage = storage;
        this.debug('Storage configured');
    }
    /**
     * Get current traces
     */
    getTraces() {
        return [...this.traceBuffer];
    }
    /**
     * Clear all traces
     */
    clearTraces() {
        this.traceBuffer = [];
        this.debug('Traces cleared');
    }
    /**
     * Manually flush traces to transport
     */
    async flush() {
        if (this.transport && this.traceBuffer.length > 0) {
            try {
                await this.transport.send([...this.traceBuffer]);
                this.traceBuffer = [];
                this.debug('Traces flushed to transport');
            }
            catch (error) {
                this.handleError(error);
            }
        }
    }
    /**
     * Shutdown the SDK
     */
    async shutdown() {
        // Stop flush timer
        if (this.flushTimer) {
            clearInterval(this.flushTimer);
        }
        // End current session
        this.endSession();
        // Flush remaining traces
        await this.flush();
        // Disconnect all adapters
        for (const adapter of this.adapters.values()) {
            await adapter.disconnect();
        }
        this.debug('FlowScope SDK shutdown complete');
    }
    /**
     * Add a trace to the buffer
     */
    addTrace(trace) {
        this.traceBuffer.push(trace);
        this.emit('trace', trace);
        // Enforce max traces limit
        if (this.traceBuffer.length > this.config.maxTraces) {
            this.traceBuffer = this.traceBuffer.slice(-this.config.maxTraces);
        }
        // Auto-flush if batch size reached
        if (this.traceBuffer.length >= this.config.batchSize) {
            this.flush().catch(error => this.handleError(error));
        }
    }
    /**
     * Setup event handling for the SDK
     */
    setupEventHandling() {
        // Handle process exit to cleanup
        if (typeof process !== 'undefined') {
            process.on('exit', () => {
                this.shutdown().catch(console.error);
            });
            process.on('SIGINT', () => {
                this.shutdown().then(() => process.exit(0)).catch(console.error);
            });
        }
    }
    /**
     * Start the automatic flush timer
     */
    startFlushTimer() {
        if (this.config.flushInterval && this.config.flushInterval > 0) {
            this.flushTimer = setInterval(() => {
                this.flush().catch(error => this.handleError(error));
            }, this.config.flushInterval);
        }
    }
    /**
     * Auto-detect and integrate supported frameworks
     */
    async autoDetectFrameworks() {
        const { LangChainAdapter } = await Promise.resolve().then(() => __importStar(require('../adapters/langchain')));
        const { LlamaIndexAdapter } = await Promise.resolve().then(() => __importStar(require('../adapters/llamaindex')));
        // Try LangChain
        const langchainAdapter = new LangChainAdapter();
        if (langchainAdapter.isSupported()) {
            this.addAdapter(langchainAdapter);
            try {
                await langchainAdapter.integrate();
                this.debug('LangChain auto-detected and integrated');
            }
            catch (error) {
                this.debug('Failed to integrate LangChain:', error);
            }
        }
        // Try LlamaIndex
        const llamaIndexAdapter = new LlamaIndexAdapter();
        if (llamaIndexAdapter.isSupported()) {
            this.addAdapter(llamaIndexAdapter);
            try {
                await llamaIndexAdapter.integrate();
                this.debug('LlamaIndex auto-detected and integrated');
            }
            catch (error) {
                this.debug('Failed to integrate LlamaIndex:', error);
            }
        }
    }
    /**
     * Initialize storage system
     */
    async initializeStorage() {
        if (this.storage) {
            try {
                // Load existing session if any
                const savedSession = await this.storage.load('current_session');
                if (savedSession) {
                    this.currentSession = savedSession;
                }
            }
            catch (error) {
                this.debug('Failed to load saved session:', error);
            }
        }
    }
    /**
     * Handle errors within the SDK
     */
    handleError(error) {
        this.debug('SDK error:', error);
        this.emit('error', error);
    }
    /**
     * Log debug information if debug mode is enabled
     */
    debug(message, ...args) {
        if (this.config.debug || process.env.FLOWSCOPE_DEBUG === 'true') {
            console.debug(`[FlowScope] ${message}`, ...args);
        }
    }
}
exports.FlowScopeSDK = FlowScopeSDK;
