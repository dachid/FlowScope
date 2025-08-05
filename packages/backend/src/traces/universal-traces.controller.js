"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var TracesController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TracesController = void 0;
const common_1 = require("@nestjs/common");
const websocket_service_1 = require("../websocket/websocket.service");
const universal_trace_service_1 = require("./universal-trace.service");
let TracesController = TracesController_1 = class TracesController {
    constructor(websocketService, universalTraceService) {
        this.websocketService = websocketService;
        this.universalTraceService = universalTraceService;
        this.logger = new common_1.Logger(TracesController_1.name);
    }
    /**
     * Primary trace endpoint - universal format only
     */
    async submitTrace(trace) {
        try {
            this.logger.debug(`Processing trace: ${trace.id}`);
            const result = await this.universalTraceService.processTrace(trace);
            if (!result.success) {
                throw new common_1.BadRequestException(`Trace processing failed: ${result.error}`);
            }
            // Broadcast to WebSocket clients
            await this.websocketService.broadcastUniversalTrace(result.processedTrace);
            return {
                success: true,
                message: 'Trace processed successfully',
                traceId: trace.id,
                validation: result.validation,
                warnings: result.validation.warnings
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(`Trace processing failed: ${errorMessage}`);
            throw new common_1.BadRequestException(errorMessage);
        }
    }
    /**
     * Batch processing endpoint for high-throughput scenarios
     */
    async submitBatch(batch) {
        try {
            this.logger.debug(`Processing trace batch with ${batch.traces.length} traces`);
            const result = await this.universalTraceService.processBatch(batch);
            // Broadcast successful traces
            if (result.processedCount > 0) {
                const successfulResults = result.results.filter((r) => r.success);
                await this.websocketService.broadcastTraceBatchResult({
                    batchId: batch.batch_id,
                    processedCount: result.processedCount,
                    failedCount: result.failedCount,
                    successfulTraceIds: successfulResults.map((r) => r.traceId)
                });
            }
            return {
                success: result.success,
                message: `Processed ${result.processedCount}/${batch.traces.length} traces`,
                batchId: batch.batch_id,
                processedCount: result.processedCount,
                failedCount: result.failedCount,
                validation: result.validation,
                results: result.results
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(`Batch processing failed: ${errorMessage}`);
            throw new common_1.BadRequestException(errorMessage);
        }
    }
    /**
     * Session processing endpoint
     */
    async submitSession(session) {
        try {
            this.logger.debug(`Processing session: ${session.sessionId}`);
            const results = await this.universalTraceService.processSession(session);
            const successfulResults = results.filter((r) => r.success);
            if (successfulResults.length > 0) {
                await this.websocketService.broadcastSessionResult({
                    sessionId: session.sessionId,
                    processedCount: successfulResults.length,
                    failedCount: results.length - successfulResults.length,
                    traceIds: successfulResults.map((r) => r.traceId)
                });
            }
            return {
                success: successfulResults.length > 0,
                message: `Processed ${successfulResults.length}/${results.length} traces in session`,
                sessionId: session.sessionId,
                processedCount: successfulResults.length,
                failedCount: results.length - successfulResults.length,
                results
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(`Session processing failed: ${errorMessage}`);
            throw new common_1.BadRequestException(errorMessage);
        }
    }
    /**
     * Get session traces
     */
    async getSessionTraces(sessionId) {
        try {
            const sessionData = await this.universalTraceService.getSessionTraces(sessionId);
            return {
                success: true,
                session: sessionData.session,
                traces: sessionData.traces,
                stats: {
                    languages: sessionData.languageStats,
                    frameworks: sessionData.frameworkStats
                }
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(`Session retrieval failed: ${errorMessage}`);
            throw new common_1.BadRequestException(errorMessage);
        }
    }
    /**
     * Cross-language trace correlation
     */
    async correlateTraces(body) {
        try {
            const { traceIds } = body;
            if (!Array.isArray(traceIds) || traceIds.length === 0) {
                throw new common_1.BadRequestException('traceIds array is required');
            }
            this.logger.debug(`Correlating ${traceIds.length} traces`);
            const correlation = await this.universalTraceService.correlateTraces(traceIds);
            return {
                success: true,
                correlation
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(`Trace correlation failed: ${errorMessage}`);
            throw new common_1.BadRequestException(errorMessage);
        }
    }
    /**
     * Health check for trace processing
     */
    async getHealth() {
        return {
            success: true,
            message: 'Trace processing service is healthy',
            version: '1.0',
            protocol: 'Universal Trace Format v1.0',
            supportedLanguages: ['javascript', 'python', 'go', 'java', 'csharp', 'rust'],
            supportedFrameworks: ['langchain', 'llamaindex', 'custom', 'autogen', 'crewai', 'flowise'],
            timestamp: new Date().toISOString()
        };
    }
};
exports.TracesController = TracesController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TracesController.prototype, "submitTrace", null);
__decorate([
    (0, common_1.Post)('batch'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TracesController.prototype, "submitBatch", null);
__decorate([
    (0, common_1.Post)('session'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TracesController.prototype, "submitSession", null);
__decorate([
    (0, common_1.Get)('session/:sessionId'),
    __param(0, (0, common_1.Param)('sessionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TracesController.prototype, "getSessionTraces", null);
__decorate([
    (0, common_1.Post)('correlate'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TracesController.prototype, "correlateTraces", null);
__decorate([
    (0, common_1.Get)('health'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TracesController.prototype, "getHealth", null);
exports.TracesController = TracesController = TracesController_1 = __decorate([
    (0, common_1.Controller)('traces'),
    __metadata("design:paramtypes", [websocket_service_1.WebSocketService,
        universal_trace_service_1.UniversalTraceService])
], TracesController);
