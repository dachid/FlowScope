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
exports.SessionsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../database/prisma.service");
let SessionsService = class SessionsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createSession(data) {
        const session = await this.prisma.session.create({
            data: {
                name: data.name,
                userId: data.userId,
                projectId: data.projectId,
                metadata: data.metadata ? JSON.stringify(data.metadata) : null,
                status: 'active',
            },
        });
        return {
            id: session.id,
            name: session.name || undefined,
            startTime: session.startTime.getTime(),
            endTime: session.endTime?.getTime(),
            status: session.status,
            metadata: session.metadata ? JSON.parse(session.metadata) : undefined,
            traces: [], // Empty traces array for new session
        };
    }
    async getAllSessions(userId) {
        const sessions = await this.prisma.session.findMany({
            where: userId ? { userId } : {},
            orderBy: { startTime: 'desc' },
        });
        // Get traces for each session
        const sessionsWithTraces = await Promise.all(sessions.map(async (session) => {
            const traces = await this.getSessionTraces(session.id);
            return {
                id: session.id,
                name: session.name || undefined,
                startTime: session.startTime.getTime(),
                endTime: session.endTime?.getTime(),
                status: session.status,
                metadata: session.metadata ? JSON.parse(session.metadata) : undefined,
                traces,
            };
        }));
        return sessionsWithTraces;
    }
    async getSession(id) {
        const session = await this.prisma.session.findUnique({
            where: { id },
        });
        if (!session)
            return null;
        const traces = await this.getSessionTraces(id);
        return {
            id: session.id,
            name: session.name || undefined,
            startTime: session.startTime.getTime(),
            endTime: session.endTime?.getTime(),
            status: session.status,
            metadata: session.metadata ? JSON.parse(session.metadata) : undefined,
            traces,
        };
    }
    async updateSession(id, data) {
        const session = await this.prisma.session.update({
            where: { id },
            data: {
                name: data.name,
                status: data.status,
                endTime: data.endTime ? new Date(data.endTime) : undefined,
                metadata: data.metadata ? JSON.stringify(data.metadata) : undefined,
            },
        });
        const traces = await this.getSessionTraces(id);
        return {
            id: session.id,
            name: session.name || undefined,
            startTime: session.startTime.getTime(),
            endTime: session.endTime?.getTime(),
            status: session.status,
            metadata: session.metadata ? JSON.parse(session.metadata) : undefined,
            traces,
        };
    }
    async deleteSession(id) {
        await this.prisma.session.delete({
            where: { id },
        });
    }
    // Trace data management
    async addTrace(sessionId, trace) {
        const traceData = await this.prisma.traceData.create({
            data: {
                sessionId,
                operation: trace.type || 'unknown',
                language: 'javascript',
                framework: 'unknown',
                data: trace.data, // Cast to any to handle unknown JSON
                metadata: trace.metadata, // Cast to any to handle unknown JSON
                parentId: trace.parentId,
                duration: trace.duration,
                status: trace.status || 'pending',
                timestamp: trace.timestamp ? new Date(trace.timestamp) : new Date(),
                startTime: trace.timestamp ? new Date(trace.timestamp) : new Date(),
                endTime: trace.duration
                    ? new Date((trace.timestamp || Date.now()) + trace.duration)
                    : undefined,
            },
        });
        return {
            id: traceData.id,
            sessionId: traceData.sessionId,
            chainId: traceData.operation, // Map operation to chainId for backward compatibility
            timestamp: traceData.timestamp.getTime(),
            type: traceData.operation,
            data: traceData.data,
            metadata: traceData.metadata,
            parentId: traceData.parentId || undefined,
            duration: traceData.duration || undefined,
            status: traceData.status,
        };
    }
    async getSessionTraces(sessionId) {
        const traces = await this.prisma.traceData.findMany({
            where: { sessionId },
            orderBy: { timestamp: 'asc' },
        });
        return traces.map(trace => ({
            id: trace.id,
            sessionId: trace.sessionId,
            chainId: trace.operation, // Map operation to chainId for backward compatibility
            timestamp: trace.timestamp.getTime(),
            type: trace.operation,
            data: trace.data,
            metadata: trace.metadata,
            parentId: trace.parentId || undefined,
            duration: trace.duration || undefined,
            status: trace.status,
        }));
    }
    async addMultipleTraces(sessionId, traces) {
        const createdTraces = await Promise.all(traces.map(trace => this.addTrace(sessionId, trace)));
        return createdTraces;
    }
};
exports.SessionsService = SessionsService;
exports.SessionsService = SessionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SessionsService);
