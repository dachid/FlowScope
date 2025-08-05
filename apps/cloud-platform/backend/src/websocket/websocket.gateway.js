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
var DebugWebSocketGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DebugWebSocketGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const common_1 = require("@nestjs/common");
let DebugWebSocketGateway = DebugWebSocketGateway_1 = class DebugWebSocketGateway {
    constructor() {
        this.logger = new common_1.Logger(DebugWebSocketGateway_1.name);
        this.connectedClients = new Map();
    }
    handleConnection(client) {
        const session = {
            id: client.id,
            connectedAt: Date.now(),
        };
        this.connectedClients.set(client.id, session);
        this.logger.log(`Client connected: ${client.id}`);
        // Send connection confirmation
        client.emit('connected', {
            clientId: client.id,
            timestamp: Date.now(),
        });
    }
    handleDisconnect(client) {
        this.connectedClients.delete(client.id);
        this.logger.log(`Client disconnected: ${client.id}`);
    }
    handleJoinSession(data, client) {
        const session = this.connectedClients.get(client.id);
        if (session) {
            session.sessionId = data.sessionId;
            session.userId = data.userId;
            // Join the session room for targeted broadcasting
            client.join(`session:${data.sessionId}`);
            this.logger.log(`Client ${client.id} joined session: ${data.sessionId}`);
            client.emit('session_joined', {
                sessionId: data.sessionId,
                timestamp: Date.now(),
            });
        }
    }
    handleLeaveSession(data, client) {
        client.leave(`session:${data.sessionId}`);
        const session = this.connectedClients.get(client.id);
        if (session) {
            session.sessionId = undefined;
        }
        this.logger.log(`Client ${client.id} left session: ${data.sessionId}`);
    }
    handleTraceEvent(trace, client) {
        // Validate trace data
        if (!trace.sessionId || !trace.id) {
            client.emit('error', { message: 'Invalid trace data' });
            return;
        }
        // Broadcast to all clients in the same session
        this.server.to(`session:${trace.sessionId}`).emit('new_trace', trace);
        this.logger.debug(`Trace event broadcasted for session: ${trace.sessionId}`);
    }
    handleRequestSessionState(data, client) {
        // In a real implementation, this would fetch from database
        // For now, emit empty state
        client.emit('session_state', {
            sessionId: data.sessionId,
            traces: [],
            timestamp: Date.now(),
        });
    }
    // Method to broadcast traces from external sources (like SDK)
    broadcastTrace(trace) {
        this.server.to(`session:${trace.sessionId}`).emit('new_trace', trace);
    }
    // Method to broadcast session updates
    broadcastSessionUpdate(sessionId, update) {
        this.server.to(`session:${sessionId}`).emit('session_update', update);
    }
    // Get session statistics
    getSessionStats(sessionId) {
        const clients = Array.from(this.connectedClients.values()).filter(session => session.sessionId === sessionId);
        return {
            sessionId,
            connectedClients: clients.length,
            clients: clients.map(c => ({
                id: c.id,
                userId: c.userId,
                connectedAt: c.connectedAt,
            })),
        };
    }
};
exports.DebugWebSocketGateway = DebugWebSocketGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], DebugWebSocketGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('join_session'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], DebugWebSocketGateway.prototype, "handleJoinSession", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('leave_session'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], DebugWebSocketGateway.prototype, "handleLeaveSession", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('trace_event'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], DebugWebSocketGateway.prototype, "handleTraceEvent", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('request_session_state'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], DebugWebSocketGateway.prototype, "handleRequestSessionState", null);
exports.DebugWebSocketGateway = DebugWebSocketGateway = DebugWebSocketGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: ['http://localhost:5173', 'http://localhost:3000'], // Vite dev server
            credentials: true,
        },
        namespace: '/debug',
    })
], DebugWebSocketGateway);
