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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TracesController = void 0;
const common_1 = require("@nestjs/common");
const websocket_service_1 = require("../websocket/websocket.service");
let TracesController = class TracesController {
    constructor(websocketService) {
        this.websocketService = websocketService;
    }
    async createTrace(trace) {
        // Validate trace data
        if (!trace.id || !trace.sessionId || !trace.timestamp) {
            throw new Error('Invalid trace data: missing required fields');
        }
        // Store trace in database (if needed)
        // await this.tracesService.create(trace);
        // Broadcast to WebSocket clients
        await this.websocketService.broadcastTrace(trace);
        return {
            success: true,
            message: 'Trace received and broadcasted',
            traceId: trace.id,
        };
    }
    async createTraceBatch(data) {
        const { traces } = data;
        if (!Array.isArray(traces) || traces.length === 0) {
            throw new Error('Invalid batch data: traces array required');
        }
        // Validate all traces
        for (const trace of traces) {
            if (!trace.id || !trace.sessionId || !trace.timestamp) {
                throw new Error(`Invalid trace data: missing required fields in trace ${trace.id}`);
            }
        }
        // Store traces in database (if needed)
        // await this.tracesService.createBatch(traces);
        // Broadcast all traces
        await this.websocketService.broadcastTraceBatch(traces);
        return {
            success: true,
            message: 'Trace batch received and broadcasted',
            count: traces.length,
            traceIds: traces.map(t => t.id),
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
], TracesController.prototype, "createTrace", null);
__decorate([
    (0, common_1.Post)('batch'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TracesController.prototype, "createTraceBatch", null);
exports.TracesController = TracesController = __decorate([
    (0, common_1.Controller)('traces'),
    __metadata("design:paramtypes", [websocket_service_1.WebSocketService])
], TracesController);
