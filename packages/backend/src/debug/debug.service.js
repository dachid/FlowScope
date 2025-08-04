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
exports.DebugService = void 0;
const prisma_service_1 = require("../database/prisma.service");
const common_1 = require("@nestjs/common");
let DebugService = class DebugService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getDatabaseSessions() {
        const sessions = await this.prisma.session.findMany({
            select: {
                id: true,
                name: true,
                startTime: true,
                status: true
            },
            orderBy: {
                startTime: 'asc'
            }
        });
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
            sessions: sessions
        };
    }
    async cleanupDuplicateSessions() {
        const sessions = await this.prisma.session.findMany({
            orderBy: {
                startTime: 'asc'
            }
        });
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
                const sorted = sessionList.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
                const toDelete = sorted.slice(1); // Remove first (newest), keep rest for deletion
                for (const session of toDelete) {
                    await this.prisma.session.delete({
                        where: { id: session.id }
                    });
                    deleted++;
                    console.log(`🗑️ Deleted duplicate session: ${session.name} (${session.id})`);
                }
            }
        }
        return { deleted, remaining: sessions.length - deleted };
    }
};
exports.DebugService = DebugService;
exports.DebugService = DebugService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DebugService);
