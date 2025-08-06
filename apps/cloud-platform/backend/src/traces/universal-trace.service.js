"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UniversalTraceService = void 0;
const common_1 = require("@nestjs/common");
const shared_1 = require("../utils");
let UniversalTraceService = class UniversalTraceService {
    constructor() {
        this.validator = shared_1.traceValidator;
    }
    /**
     * Process a single universal trace
     */
    async processTrace(trace) {
        try {
            // Validate the trace
            const validation = this.validator.validate(trace);
            if (!validation.valid) {
                return {
                    success: false,
                    validation,
                    error: `Validation failed: ${validation.errors.join(', ')}`
                };
            }
            // Enrich trace with additional metadata
            const enrichedTrace = await this.enrichTrace(trace);
            // Store trace (implement persistence layer as needed)
            await this.storeTrace(enrichedTrace);
            return {
                success: true,
                validation,
                processedTrace: enrichedTrace
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return {
                success: false,
                validation: { valid: false, errors: [errorMessage], warnings: [] },
                error: errorMessage
            };
        }
    }
    /**
     * Process a batch of traces
     */
    async processBatch(batch) {
        // Validate the batch
        const validation = this.validator.validateBatch(batch);
        if (!validation.valid) {
            return {
                success: false,
                validation,
                processedCount: 0,
                failedCount: batch.traces.length,
                results: batch.traces.map((trace) => ({
                    traceId: trace.id,
                    success: false,
                    error: 'Batch validation failed'
                }))
            };
        }
        // Process each trace in the batch
        const results = await Promise.allSettled(batch.traces.map((trace) => this.processTrace(trace)));
        const processedResults = results.map((result, index) => {
            const trace = batch.traces[index];
            if (result.status === 'fulfilled') {
                return {
                    traceId: trace.id,
                    success: result.value.success,
                    error: result.value.error
                };
            }
            else {
                return {
                    traceId: trace.id,
                    success: false,
                    error: result.reason.message
                };
            }
        });
        const successCount = processedResults.filter((r) => r.success).length;
        const failedCount = processedResults.filter((r) => !r.success).length;
        return {
            success: successCount > 0,
            validation,
            processedCount: successCount,
            failedCount,
            results: processedResults
        };
    }
    /**
     * Process a complete session with multiple traces
     */
    async processSession(session) {
        try {
            const results = [];
            // Validate the session first
            const sessionValidation = this.validator.validateSession(session);
            // Process each trace in the session
            for (const trace of session.traces) {
                // Ensure trace has session information
                trace.session_id = session.sessionId;
                trace.session_metadata = {
                    ...trace.session_metadata,
                    ...session.session_metadata
                };
                const result = await this.processTrace(trace);
                results.push({
                    ...result,
                    traceId: trace.id
                });
            }
            return results;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Session processing failed';
            return [{
                    success: false,
                    error: errorMessage,
                    traceId: session.sessionId,
                    validation: {
                        valid: false,
                        errors: [errorMessage],
                        warnings: []
                    }
                }];
        }
    }
    /**
     * Convert legacy trace to universal format
     */
    async convertLegacyTrace(legacyTrace) {
        return shared_1.legacyTraceAdapter.fromLegacy(legacyTrace);
    }
    /**
     * Auto-detect language from trace data
     */
    detectLanguage(trace) {
        return shared_1.languageDetector.detectFromTrace(trace);
    }
    /**
     * Get traces by session with language correlation
     */
    async getSessionTraces(sessionId) {
        // Implement session trace retrieval
        const traces = await this.getTracesForSession(sessionId);
        const session = await this.getSession(sessionId);
        // Calculate statistics
        const languageStats = this.calculateLanguageStats(traces);
        const frameworkStats = this.calculateFrameworkStats(traces);
        return {
            session,
            traces,
            languageStats,
            frameworkStats
        };
    }
    /**
     * Cross-language correlation
     */
    async correlateTraces(traceIds) {
        const traces = await this.getTracesByIds(traceIds);
        // Build correlation graph based on parent-child relationships
        const correlationGraph = {};
        traces.forEach(trace => {
            if (trace.parent_id) {
                if (!correlationGraph[trace.parent_id]) {
                    correlationGraph[trace.parent_id] = [];
                }
                correlationGraph[trace.parent_id].push(trace.id);
            }
        });
        // Extract unique languages and frameworks
        const languages = [...new Set(traces.map(t => t.language))];
        const frameworks = [...new Set(traces.map(t => t.framework))];
        return {
            correlatedTraces: traces,
            correlationGraph,
            languages,
            frameworks
        };
    }
    async enrichTrace(trace) {
        const enriched = { ...trace };
        // Add server-side timestamp if missing
        if (!enriched.start_time) {
            enriched.start_time = new Date().toISOString();
        }
        // Calculate duration if end_time is present but duration is missing
        if (enriched.end_time && !enriched.duration_ms) {
            const startTime = new Date(enriched.start_time);
            const endTime = new Date(enriched.end_time);
            enriched.duration_ms = endTime.getTime() - startTime.getTime();
        }
        // Auto-detect language if not provided or confidence is low
        if (!enriched.language) {
            const detection = shared_1.languageDetector.detectFromTrace(trace);
            enriched.language = detection.language;
            // Add detection metadata
            if (!enriched.metadata) {
                enriched.metadata = {};
            }
            enriched.metadata._language_detection = {
                confidence: detection.confidence,
                evidence: detection.evidence
            };
        }
        // Add server metadata
        if (!enriched.metadata) {
            enriched.metadata = {};
        }
        enriched.metadata._server = {
            processed_at: new Date().toISOString(),
            server_version: process.env.npm_package_version || '1.0.0',
            node_version: process.version
        };
        return enriched;
    }
    async storeTrace(trace) {
        // TODO: Implement database storage
        // For now, this is a placeholder
        console.log(`Storing trace ${trace.id} for session ${trace.session_id}`);
    }
    async getTracesForSession(sessionId) {
        // TODO: Implement database query
        return [];
    }
    async getSession(sessionId) {
        // TODO: Implement database query
        return {
            sessionId: sessionId,
            id: sessionId,
            start_time: new Date().toISOString(),
            status: 'active',
            language: 'javascript',
            framework: 'custom',
            traces: [] // Empty for now, would be populated from DB
        };
    }
    async getTracesByIds(traceIds) {
        // TODO: Implement database query
        return [];
    }
    calculateLanguageStats(traces) {
        const stats = {};
        traces.forEach(trace => {
            stats[trace.language] = (stats[trace.language] || 0) + 1;
        });
        return stats;
    }
    calculateFrameworkStats(traces) {
        const stats = {};
        traces.forEach(trace => {
            stats[trace.framework] = (stats[trace.framework] || 0) + 1;
        });
        return stats;
    }
};
exports.UniversalTraceService = UniversalTraceService;
exports.UniversalTraceService = UniversalTraceService = __decorate([
    (0, common_1.Injectable)()
], UniversalTraceService);
