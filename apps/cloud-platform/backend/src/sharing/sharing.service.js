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
exports.SharingService = exports.ShareableResourceType = exports.SharePermission = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const crypto_1 = require("crypto");
var SharePermission;
(function (SharePermission) {
    SharePermission["VIEW"] = "VIEW";
    SharePermission["COMMENT"] = "COMMENT";
    SharePermission["EDIT"] = "EDIT";
})(SharePermission || (exports.SharePermission = SharePermission = {}));
var ShareableResourceType;
(function (ShareableResourceType) {
    ShareableResourceType["TRACE"] = "TRACE";
    ShareableResourceType["SESSION"] = "SESSION";
    ShareableResourceType["PROJECT"] = "PROJECT";
    ShareableResourceType["PROMPT"] = "PROMPT";
})(ShareableResourceType || (exports.ShareableResourceType = ShareableResourceType = {}));
let SharingService = class SharingService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createShareLink(createShareLinkDto, userId) {
        const { resourceType, resourceId, permission = SharePermission.VIEW, expiresAt, password, } = createShareLinkDto;
        // Verify user has access to the resource
        await this.verifyResourceAccess(userId, resourceType, resourceId);
        // Generate unique share token
        const shareToken = this.generateShareToken();
        const shareLink = await this.prisma.shareLink.create({
            data: {
                shareToken,
                resourceType,
                resourceId,
                permissions: JSON.stringify(permission || 'VIEW'),
                createdBy: userId,
                expiresAt,
                password,
                isActive: true,
            },
            include: {
                creator: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });
        return {
            ...shareLink,
            creator: {
                ...shareLink.creator,
                name: shareLink.creator.name || '',
            },
            expiresAt: shareLink.expiresAt || undefined,
            password: shareLink.password || undefined,
            lastAccessedAt: shareLink.lastAccessedAt || undefined,
            permission: JSON.parse(shareLink.permissions),
            shareUrl: `${process.env.FRONTEND_URL}/shared/${shareToken}`,
        };
    }
    async getShareLink(shareToken, password) {
        const shareLink = await this.prisma.shareLink.findUnique({
            where: { shareToken },
            include: {
                creator: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });
        if (!shareLink) {
            throw new common_1.NotFoundException('Share link not found');
        }
        if (!shareLink.isActive) {
            throw new common_1.ForbiddenException('Share link is disabled');
        }
        if (shareLink.expiresAt && shareLink.expiresAt < new Date()) {
            throw new common_1.ForbiddenException('Share link has expired');
        }
        if (shareLink.password && shareLink.password !== password) {
            throw new common_1.ForbiddenException('Invalid password');
        }
        // Increment access count
        await this.prisma.shareLink.update({
            where: { id: shareLink.id },
            data: {
                accessCount: {
                    increment: 1,
                },
                lastAccessedAt: new Date(),
            },
        });
        return {
            ...shareLink,
            creator: {
                ...shareLink.creator,
                name: shareLink.creator.name || '',
            },
            expiresAt: shareLink.expiresAt || undefined,
            password: shareLink.password || undefined,
            lastAccessedAt: shareLink.lastAccessedAt || undefined,
            permission: JSON.parse(shareLink.permissions),
            shareUrl: `${process.env.FRONTEND_URL}/shared/${shareLink.shareToken}`,
        };
    }
    async getSharedResource(shareToken, password) {
        const shareLink = await this.getShareLink(shareToken, password);
        // Fetch the actual resource based on type
        switch (shareLink.resourceType) {
            case ShareableResourceType.TRACE:
                return this.getSharedTrace(shareLink.resourceId);
            case ShareableResourceType.SESSION:
                return this.getSharedSession(shareLink.resourceId);
            case ShareableResourceType.PROJECT:
                return this.getSharedProject(shareLink.resourceId);
            case ShareableResourceType.PROMPT:
                return this.getSharedPrompt(shareLink.resourceId);
            default:
                throw new common_1.NotFoundException('Invalid resource type');
        }
    }
    async updateShareLink(shareToken, updateShareLinkDto, userId) {
        const shareLink = await this.prisma.shareLink.findUnique({
            where: { shareToken },
        });
        if (!shareLink) {
            throw new common_1.NotFoundException('Share link not found');
        }
        if (shareLink.createdBy !== userId) {
            throw new common_1.ForbiddenException('You can only update your own share links');
        }
        const updatedShareLink = await this.prisma.shareLink.update({
            where: { shareToken },
            data: updateShareLinkDto,
            include: {
                creator: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });
        return {
            ...updatedShareLink,
            creator: {
                ...updatedShareLink.creator,
                name: updatedShareLink.creator.name || '',
            },
            expiresAt: updatedShareLink.expiresAt || undefined,
            password: updatedShareLink.password || undefined,
            lastAccessedAt: updatedShareLink.lastAccessedAt || undefined,
            permission: JSON.parse(updatedShareLink.permissions),
            shareUrl: `${process.env.FRONTEND_URL}/shared/${shareToken}`,
        };
    }
    async revokeShareLink(shareToken, userId) {
        const shareLink = await this.prisma.shareLink.findUnique({
            where: { shareToken },
        });
        if (!shareLink) {
            throw new common_1.NotFoundException('Share link not found');
        }
        if (shareLink.createdBy !== userId) {
            throw new common_1.ForbiddenException('You can only revoke your own share links');
        }
        await this.prisma.shareLink.update({
            where: { shareToken },
            data: { isActive: false },
        });
    }
    async getUserShareLinks(userId) {
        const shareLinks = await this.prisma.shareLink.findMany({
            where: { createdBy: userId },
            include: {
                creator: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        return shareLinks.map((link) => ({
            ...link,
            shareUrl: `${process.env.FRONTEND_URL}/shared/${link.shareToken}`,
        }));
    }
    async verifyResourceAccess(userId, resourceType, resourceId) {
        // Implement resource access verification logic
        // This is a simplified version
        return true;
    }
    generateShareToken() {
        return (0, crypto_1.randomBytes)(32).toString('hex');
    }
    async getSharedTrace(traceId) {
        const trace = await this.prisma.traceData.findUnique({
            where: { id: traceId },
            include: {
                session: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });
        if (!trace) {
            throw new common_1.NotFoundException('Trace not found');
        }
        return trace;
    }
    async getSharedSession(sessionId) {
        const session = await this.prisma.session.findUnique({
            where: { id: sessionId },
            include: {
                traces: {
                    orderBy: { timestamp: 'asc' },
                },
                project: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                    },
                },
            },
        });
        if (!session) {
            throw new common_1.NotFoundException('Session not found');
        }
        return session;
    }
    async getSharedProject(projectId) {
        const project = await this.prisma.project.findUnique({
            where: { id: projectId },
            include: {
                sessions: {
                    include: {
                        _count: {
                            select: {
                                traces: true,
                            },
                        },
                    },
                    orderBy: { startTime: 'desc' },
                },
                _count: {
                    select: {
                        sessions: true,
                        prompts: true,
                    },
                },
            },
        });
        if (!project) {
            throw new common_1.NotFoundException('Project not found');
        }
        return project;
    }
    async getSharedPrompt(promptId) {
        const prompt = await this.prisma.prompt.findUnique({
            where: { id: promptId },
            include: {
                versions: {
                    orderBy: { createdAt: 'desc' },
                },
                project: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                    },
                },
            },
        });
        if (!prompt) {
            throw new common_1.NotFoundException('Prompt not found');
        }
        return prompt;
    }
    // Additional methods required by controller
    async getShareLinksByUser(userId) {
        return this.getUserShareLinks(userId);
    }
    async getShareLinkByToken(shareToken) {
        return this.getShareLink(shareToken);
    }
    async accessSharedResource(shareToken, userId) {
        return this.getSharedResource(shareToken);
    }
    async validateShareAccess(shareToken, action) {
        try {
            const shareLink = await this.getShareLink(shareToken);
            if (!shareLink) {
                return { hasAccess: false, permissions: null };
            }
            const resource = await this.getSharedResource(shareToken);
            return {
                hasAccess: true,
                permissions: shareLink.permissions,
                resource: resource
            };
        }
        catch (error) {
            return { hasAccess: false, permissions: null };
        }
    }
};
exports.SharingService = SharingService;
exports.SharingService = SharingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SharingService);
