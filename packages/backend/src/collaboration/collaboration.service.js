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
exports.CollaborationService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let CollaborationService = class CollaborationService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    // Comments functionality
    async createComment(createCommentDto, userId) {
        const { resourceType, resourceId, content, parentId } = createCommentDto;
        // Verify user has access to the resource
        await this.verifyResourceAccess(userId, resourceType, resourceId);
        const comment = await this.prisma.comment.create({
            data: {
                content,
                resourceType,
                resourceId,
                authorId: userId,
                parentId,
            },
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                children: {
                    include: {
                        author: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                            },
                        },
                    },
                    orderBy: { createdAt: 'asc' },
                },
            },
        });
        return {
            ...comment,
            author: {
                ...comment.author,
                name: comment.author.name || '',
            },
            children: comment.children?.map(child => ({
                ...child,
                author: {
                    ...child.author,
                    name: child.author.name || '',
                },
                parentId: child.parentId || undefined,
            })),
            parentId: comment.parentId || undefined,
        };
    }
    async getComments(resourceType, resourceId, userId) {
        // Verify user has access to the resource if user is provided
        if (userId) {
            await this.verifyResourceAccess(userId, resourceType, resourceId);
        }
        const comments = await this.prisma.comment.findMany({
            where: {
                resourceType,
                resourceId,
                parentId: null, // Only get top-level comments
            },
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                children: {
                    include: {
                        author: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                            },
                        },
                    },
                    orderBy: { createdAt: 'asc' },
                },
                _count: {
                    select: {
                        children: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        return comments.map(comment => ({
            ...comment,
            author: {
                ...comment.author,
                name: comment.author.name || '',
            },
            children: comment.children?.map(child => ({
                ...child,
                author: {
                    ...child.author,
                    name: child.author.name || '',
                },
                parentId: child.parentId || undefined,
            })),
            parentId: comment.parentId || undefined,
        }));
    }
    async updateComment(commentId, updateCommentDto, userId) {
        const comment = await this.prisma.comment.findUnique({
            where: { id: commentId },
        });
        if (!comment) {
            throw new common_1.NotFoundException('Comment not found');
        }
        if (comment.authorId !== userId) {
            throw new common_1.ForbiddenException('You can only edit your own comments');
        }
        const updatedComment = await this.prisma.comment.update({
            where: { id: commentId },
            data: updateCommentDto,
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });
        return {
            ...updatedComment,
            author: {
                ...updatedComment.author,
                name: updatedComment.author.name || '',
            },
            parentId: updatedComment.parentId || undefined,
        };
    }
    async deleteComment(commentId, userId) {
        const comment = await this.prisma.comment.findUnique({
            where: { id: commentId },
        });
        if (!comment) {
            throw new common_1.NotFoundException('Comment not found');
        }
        if (comment.authorId !== userId) {
            throw new common_1.ForbiddenException('You can only delete your own comments');
        }
        await this.prisma.comment.delete({
            where: { id: commentId },
        });
    }
    async resolveComment(commentId, userId) {
        const comment = await this.prisma.comment.findUnique({
            where: { id: commentId },
        });
        if (!comment) {
            throw new common_1.NotFoundException('Comment not found');
        }
        // Verify user has access to the resource
        await this.verifyResourceAccess(userId, comment.resourceType, comment.resourceId);
        const updatedComment = await this.prisma.comment.update({
            where: { id: commentId },
            data: { isResolved: true },
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                children: {
                    include: {
                        author: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                            },
                        },
                    },
                },
            },
        });
        return {
            ...updatedComment,
            author: {
                ...updatedComment.author,
                name: updatedComment.author.name || '',
            },
            children: updatedComment.children?.map(child => ({
                ...child,
                author: {
                    ...child.author,
                    name: child.author.name || '',
                },
                parentId: child.parentId || undefined,
            })),
            parentId: updatedComment.parentId || undefined,
        };
    }
    // Annotations functionality
    async createAnnotation(createAnnotationDto, userId) {
        const { resourceType, resourceId, content, position, type = 'NOTE', } = createAnnotationDto;
        // Verify user has access to the resource
        await this.verifyResourceAccess(userId, resourceType, resourceId);
        const annotation = await this.prisma.annotation.create({
            data: {
                content,
                resourceType,
                resourceId,
                authorId: userId,
                position: JSON.stringify(position),
                type,
            },
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });
        return {
            ...annotation,
            author: {
                ...annotation.author,
                name: annotation.author.name || '',
            },
            content: annotation.content || undefined,
            color: annotation.color || undefined,
        };
    }
    async getAnnotations(resourceType, resourceId, userId) {
        // Verify user has access to the resource if user is provided
        if (userId) {
            await this.verifyResourceAccess(userId, resourceType, resourceId);
        }
        const annotations = await this.prisma.annotation.findMany({
            where: {
                resourceType,
                resourceId,
            },
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        return annotations.map(annotation => ({
            ...annotation,
            author: {
                ...annotation.author,
                name: annotation.author.name || '',
            },
            content: annotation.content || undefined,
            color: annotation.color || undefined,
        }));
    }
    async updateAnnotation(annotationId, updateData, userId) {
        const annotation = await this.prisma.annotation.findUnique({
            where: { id: annotationId },
        });
        if (!annotation) {
            throw new common_1.NotFoundException('Annotation not found');
        }
        if (annotation.authorId !== userId) {
            throw new common_1.ForbiddenException('You can only edit your own annotations');
        }
        const updateDataSerialized = {
            ...updateData,
            position: updateData.position ? JSON.stringify(updateData.position) : undefined,
        };
        const updatedAnnotation = await this.prisma.annotation.update({
            where: { id: annotationId },
            data: updateDataSerialized,
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });
        return {
            ...updatedAnnotation,
            author: {
                ...updatedAnnotation.author,
                name: updatedAnnotation.author.name || '',
            },
            content: updatedAnnotation.content || undefined,
            color: updatedAnnotation.color || undefined,
        };
    }
    async deleteAnnotation(annotationId, userId) {
        const annotation = await this.prisma.annotation.findUnique({
            where: { id: annotationId },
        });
        if (!annotation) {
            throw new common_1.NotFoundException('Annotation not found');
        }
        if (annotation.authorId !== userId) {
            throw new common_1.ForbiddenException('You can only delete your own annotations');
        }
        await this.prisma.annotation.delete({
            where: { id: annotationId },
        });
    }
    // Real-time collaboration
    async getActiveCollaborators(resourceType, resourceId) {
        // This would integrate with WebSocket connections to track active users
        // For now, return a mock implementation
        const mockCollaborators = [
            {
                id: 'user-1',
                name: 'John Doe',
                email: 'john@example.com',
                lastSeen: new Date(),
                status: 'online',
            },
            {
                id: 'user-2',
                name: 'Jane Smith',
                email: 'jane@example.com',
                lastSeen: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
                status: 'away',
            },
        ];
        return mockCollaborators;
    }
    async broadcastPresence(userId, resourceType, resourceId) {
        // This would broadcast user presence to other connected users
        // Implementation would depend on WebSocket setup
        return {
            message: 'Presence broadcasted',
            timestamp: new Date(),
        };
    }
    async verifyResourceAccess(userId, resourceType, resourceId) {
        // Simplified access verification
        // In a real implementation, this would check user permissions
        // based on team membership, project access, etc.
        switch (resourceType) {
            case 'TRACE':
            case 'SESSION':
            case 'PROJECT':
            case 'PROMPT':
                // For now, allow access to all resources
                return true;
            default:
                throw new common_1.NotFoundException('Invalid resource type');
        }
    }
    // Presence tracking methods
    async updatePresence(presenceUpdateDto, userId) {
        const { resourceType, resourceId, status, cursor, selection } = presenceUpdateDto;
        // Verify user has access to the resource
        await this.verifyResourceAccess(userId, resourceType, resourceId);
        const presenceRecord = await this.prisma.presenceRecord.upsert({
            where: {
                userId_resourceType_resourceId: {
                    userId,
                    resourceType,
                    resourceId,
                },
            },
            update: {
                status,
                cursor: cursor ? JSON.stringify(cursor) : null,
                selection: selection ? JSON.stringify(selection) : null,
                lastSeen: new Date(),
            },
            create: {
                userId,
                resourceType,
                resourceId,
                status,
                cursor: cursor ? JSON.stringify(cursor) : null,
                selection: selection ? JSON.stringify(selection) : null,
                lastSeen: new Date(),
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });
        return {
            id: presenceRecord.id,
            user: {
                ...presenceRecord.user,
                name: presenceRecord.user.name || '',
            },
            resourceType: presenceRecord.resourceType,
            resourceId: presenceRecord.resourceId,
            status: presenceRecord.status,
            cursor: presenceRecord.cursor ? JSON.parse(presenceRecord.cursor) : null,
            selection: presenceRecord.selection ? JSON.parse(presenceRecord.selection) : null,
            lastSeen: presenceRecord.lastSeen,
        };
    }
    async getPresence(resourceType, resourceId) {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        const presenceRecords = await this.prisma.presenceRecord.findMany({
            where: {
                resourceType,
                resourceId,
                lastSeen: {
                    gte: fiveMinutesAgo,
                },
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
            orderBy: {
                lastSeen: 'desc',
            },
        });
        return presenceRecords.map((record) => ({
            id: record.id,
            user: record.user,
            resourceType: record.resourceType,
            resourceId: record.resourceId,
            status: record.status,
            cursor: record.cursor ? JSON.parse(record.cursor) : null,
            selection: record.selection ? JSON.parse(record.selection) : null,
            lastSeen: record.lastSeen,
        }));
    }
};
exports.CollaborationService = CollaborationService;
exports.CollaborationService = CollaborationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CollaborationService);
