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
exports.SessionsController = void 0;
const common_1 = require("@nestjs/common");
const sessions_service_1 = require("./sessions.service");
const debug_service_1 = require("../debug/debug.service");
let SessionsController = class SessionsController {
    constructor(sessionsService, debugService) {
        this.sessionsService = sessionsService;
        this.debugService = debugService;
    }
    async createSession(createSessionDto) {
        return this.sessionsService.createSession(createSessionDto);
    }
    async getAllSessions(userId) {
        return this.sessionsService.getAllSessions(userId);
    }
    async getSession(id) {
        return this.sessionsService.getSession(id);
    }
    async updateSession(id, updateSessionDto) {
        return this.sessionsService.updateSession(id, updateSessionDto);
    }
    async deleteSession(id) {
        return this.sessionsService.deleteSession(id);
    }
    async getDatabaseSessions() {
        const sessions = await this.sessionsService.getAllSessions();
        const sessionGroups = {};
        sessions.forEach(session => {
            const name = session.name || 'Unnamed';
            if (!sessionGroups[name]) {
                sessionGroups[name] = [];
            }
            sessionGroups[name].push(session);
        });
        return {
            total: sessions.length,
            groups: sessionGroups,
            duplicates: Object.entries(sessionGroups).filter(([_, sessions]) => sessions.length > 1)
        };
    }
    async cleanupDuplicateSessions() {
        const sessions = await this.sessionsService.getAllSessions();
        const sessionGroups = {};
        sessions.forEach(session => {
            const name = session.name || 'Unnamed';
            if (!sessionGroups[name]) {
                sessionGroups[name] = [];
            }
            sessionGroups[name].push(session);
        });
        let deleted = 0;
        for (const [name, sessionList] of Object.entries(sessionGroups)) {
            if (sessionList.length > 1) {
                // Keep the newest session, delete the rest
                const sorted = sessionList.sort((a, b) => b.startTime - a.startTime);
                const toDelete = sorted.slice(1); // Remove first (newest), keep rest for deletion
                for (const session of toDelete) {
                    await this.sessionsService.deleteSession(session.id);
                    deleted++;
                    console.log(`🗑️ Deleted duplicate session: ${session.name} (${session.id})`);
                }
            }
        }
        return { deleted, remaining: sessions.length - deleted };
    }
    // Trace endpoints
    async addTrace(sessionId, trace) {
        return this.sessionsService.addTrace(sessionId, trace);
    }
    async addMultipleTraces(sessionId, traces) {
        return this.sessionsService.addMultipleTraces(sessionId, traces);
    }
    async getSessionTraces(sessionId) {
        return this.sessionsService.getSessionTraces(sessionId);
    }
};
exports.SessionsController = SessionsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SessionsController.prototype, "createSession", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SessionsController.prototype, "getAllSessions", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SessionsController.prototype, "getSession", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SessionsController.prototype, "updateSession", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SessionsController.prototype, "deleteSession", null);
__decorate([
    (0, common_1.Get)('debug/database-sessions'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SessionsController.prototype, "getDatabaseSessions", null);
__decorate([
    (0, common_1.Post)('debug/cleanup-duplicates'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SessionsController.prototype, "cleanupDuplicateSessions", null);
__decorate([
    (0, common_1.Post)(':id/traces'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SessionsController.prototype, "addTrace", null);
__decorate([
    (0, common_1.Post)(':id/traces/bulk'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Array]),
    __metadata("design:returntype", Promise)
], SessionsController.prototype, "addMultipleTraces", null);
__decorate([
    (0, common_1.Get)(':id/traces'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SessionsController.prototype, "getSessionTraces", null);
exports.SessionsController = SessionsController = __decorate([
    (0, common_1.Controller)('sessions'),
    __metadata("design:paramtypes", [sessions_service_1.SessionsService,
        debug_service_1.DebugService])
], SessionsController);
