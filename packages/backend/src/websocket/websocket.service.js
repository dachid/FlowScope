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
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketService = void 0;
const common_1 = require("@nestjs/common");
const websocket_gateway_1 = require("../websocket/websocket.gateway");
let WebSocketService = class WebSocketService {
    constructor(websocketGateway) {
        this.websocketGateway = websocketGateway;
    }
    /**
     * Broadcast a trace event to all connected clients in a session
     */
    async broadcastTrace(trace) {
        try {
            this.websocketGateway.broadcastTrace(trace);
        }
        catch (error) {
            console.error('Failed to broadcast trace:', error);
        }
    }
    /**
     * Broadcast a session update to all connected clients
     */
    async broadcastSessionUpdate(sessionId, update) {
        try {
            this.websocketGateway.broadcastSessionUpdate(sessionId, update);
        }
        catch (error) {
            console.error('Failed to broadcast session update:', error);
        }
    }
    /**
     * Get session statistics (connected clients, etc.)
     */
    getSessionStats(sessionId) {
        return this.websocketGateway.getSessionStats(sessionId);
    }
    /**
     * Send trace events in batches for better performance
     */
    async broadcastTraceBatch(traces) {
        try {
            for (const trace of traces) {
                this.websocketGateway.broadcastTrace(trace);
            }
        }
        catch (error) {
            console.error('Failed to broadcast trace batch:', error);
        }
    }
};
exports.WebSocketService = WebSocketService;
exports.WebSocketService = WebSocketService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [websocket_gateway_1.DebugWebSocketGateway])
], WebSocketService);
