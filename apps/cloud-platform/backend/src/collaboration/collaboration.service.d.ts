import { PrismaService } from '../prisma/prisma.service';
import { CreateCommentDto, UpdateCommentDto, CreateAnnotationDto } from './dto/collaboration.dto';
export declare class CollaborationService {
    private prisma;
    constructor(prisma: PrismaService);
    createComment(createCommentDto: CreateCommentDto, userId: string): Promise<{
        author: {
            name: string;
            email: string;
            id: string;
        };
        children: {
            author: {
                name: string;
                email: string;
                id: string;
            };
            parentId: string | undefined;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            projectId: string | null;
            resourceType: string;
            resourceId: string;
            content: string;
            authorId: string;
            isResolved: boolean;
        }[];
        parentId: string | undefined;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        projectId: string | null;
        resourceType: string;
        resourceId: string;
        content: string;
        authorId: string;
        isResolved: boolean;
    }>;
    getComments(resourceType: string, resourceId: string, userId?: string): Promise<{
        author: {
            name: string;
            email: string;
            id: string;
        };
        children: {
            author: {
                name: string;
                email: string;
                id: string;
            };
            parentId: string | undefined;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            projectId: string | null;
            resourceType: string;
            resourceId: string;
            content: string;
            authorId: string;
            isResolved: boolean;
        }[];
        parentId: string | undefined;
        _count: {
            children: number;
        };
        id: string;
        createdAt: Date;
        updatedAt: Date;
        projectId: string | null;
        resourceType: string;
        resourceId: string;
        content: string;
        authorId: string;
        isResolved: boolean;
    }[]>;
    updateComment(commentId: string, updateCommentDto: UpdateCommentDto, userId: string): Promise<{
        author: {
            name: string;
            email: string;
            id: string;
        };
        parentId: string | undefined;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        projectId: string | null;
        resourceType: string;
        resourceId: string;
        content: string;
        authorId: string;
        isResolved: boolean;
    }>;
    deleteComment(commentId: string, userId: string): Promise<void>;
    resolveComment(commentId: string, userId: string): Promise<{
        author: {
            name: string;
            email: string;
            id: string;
        };
        children: {
            author: {
                name: string;
                email: string;
                id: string;
            };
            parentId: string | undefined;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            projectId: string | null;
            resourceType: string;
            resourceId: string;
            content: string;
            authorId: string;
            isResolved: boolean;
        }[];
        parentId: string | undefined;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        projectId: string | null;
        resourceType: string;
        resourceId: string;
        content: string;
        authorId: string;
        isResolved: boolean;
    }>;
    createAnnotation(createAnnotationDto: CreateAnnotationDto, userId: string): Promise<{
        author: {
            name: string;
            email: string;
            id: string;
        };
        content: string | undefined;
        color: string | undefined;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        type: string;
        resourceType: string;
        resourceId: string;
        position: string;
        authorId: string;
        isVisible: boolean;
    }>;
    getAnnotations(resourceType: string, resourceId: string, userId?: string): Promise<{
        author: {
            name: string;
            email: string;
            id: string;
        };
        content: string | undefined;
        color: string | undefined;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        type: string;
        resourceType: string;
        resourceId: string;
        position: string;
        authorId: string;
        isVisible: boolean;
    }[]>;
    updateAnnotation(annotationId: string, updateData: Partial<CreateAnnotationDto>, userId: string): Promise<{
        author: {
            name: string;
            email: string;
            id: string;
        };
        content: string | undefined;
        color: string | undefined;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        type: string;
        resourceType: string;
        resourceId: string;
        position: string;
        authorId: string;
        isVisible: boolean;
    }>;
    deleteAnnotation(annotationId: string, userId: string): Promise<void>;
    getActiveCollaborators(resourceType: string, resourceId: string): Promise<{
        id: string;
        name: string;
        email: string;
        lastSeen: Date;
        status: string;
    }[]>;
    broadcastPresence(userId: string, resourceType: string, resourceId: string): Promise<{
        message: string;
        timestamp: Date;
    }>;
    private verifyResourceAccess;
    updatePresence(presenceUpdateDto: any, userId: string): Promise<{
        id: string;
        user: {
            name: string;
            email: string;
            id: string;
        };
        resourceType: string;
        resourceId: string;
        status: string;
        cursor: any;
        selection: any;
        lastSeen: Date;
    }>;
    getPresence(resourceType: string, resourceId: string): Promise<{
        id: any;
        user: any;
        resourceType: any;
        resourceId: any;
        status: any;
        cursor: any;
        selection: any;
        lastSeen: any;
    }[]>;
}
