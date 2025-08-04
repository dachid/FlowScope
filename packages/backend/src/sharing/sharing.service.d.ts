import { PrismaService } from '../prisma/prisma.service';
import { CreateShareLinkDto, UpdateShareLinkDto } from './dto/sharing.dto';
export declare enum SharePermission {
    VIEW = "VIEW",
    COMMENT = "COMMENT",
    EDIT = "EDIT"
}
export declare enum ShareableResourceType {
    TRACE = "TRACE",
    SESSION = "SESSION",
    PROJECT = "PROJECT",
    PROMPT = "PROMPT"
}
export declare class SharingService {
    private prisma;
    constructor(prisma: PrismaService);
    createShareLink(createShareLinkDto: CreateShareLinkDto, userId: string): Promise<{
        creator: {
            name: string;
            email: string;
            id: string;
        };
        expiresAt: Date | undefined;
        password: string | undefined;
        lastAccessedAt: Date | undefined;
        permission: SharePermission;
        shareUrl: string;
        id: string;
        isActive: boolean;
        createdAt: Date;
        projectId: string | null;
        resourceType: string;
        resourceId: string;
        shareToken: string;
        permissions: string;
        accessCount: number;
        createdBy: string;
    }>;
    getShareLink(shareToken: string, password?: string): Promise<{
        creator: {
            name: string;
            email: string;
            id: string;
        };
        expiresAt: Date | undefined;
        password: string | undefined;
        lastAccessedAt: Date | undefined;
        permission: SharePermission;
        shareUrl: string;
        id: string;
        isActive: boolean;
        createdAt: Date;
        projectId: string | null;
        resourceType: string;
        resourceId: string;
        shareToken: string;
        permissions: string;
        accessCount: number;
        createdBy: string;
    }>;
    getSharedResource(shareToken: string, password?: string): Promise<({
        session: {
            name: string | null;
            id: string;
        };
    } & {
        id: string;
        data: string;
        status: string;
        metadata: string | null;
        timestamp: Date;
        sessionId: string;
        chainId: string;
        type: string;
        parentId: string | null;
        duration: number | null;
    }) | ({
        project: {
            name: string;
            id: string;
            description: string | null;
        } | null;
        traces: {
            id: string;
            data: string;
            status: string;
            metadata: string | null;
            timestamp: Date;
            sessionId: string;
            chainId: string;
            type: string;
            parentId: string | null;
            duration: number | null;
        }[];
    } & {
        name: string | null;
        id: string;
        startTime: Date;
        endTime: Date | null;
        status: string;
        metadata: string | null;
        userId: string | null;
        projectId: string | null;
        isShared: boolean;
    }) | ({
        sessions: ({
            _count: {
                traces: number;
            };
        } & {
            name: string | null;
            id: string;
            startTime: Date;
            endTime: Date | null;
            status: string;
            metadata: string | null;
            userId: string | null;
            projectId: string | null;
            isShared: boolean;
        })[];
        _count: {
            sessions: number;
            prompts: number;
        };
    } & {
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        teamId: string | null;
        ownerId: string;
        settings: string | null;
        isPublic: boolean;
    }) | ({
        project: {
            name: string;
            id: string;
            description: string | null;
        };
        versions: {
            id: string;
            isActive: boolean;
            createdAt: Date;
            createdBy: string;
            promptId: string;
            version: string;
            content: string;
            parentVersionId: string | null;
            message: string | null;
            tags: string | null;
        }[];
    } & {
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        projectId: string;
        description: string | null;
        isPublic: boolean;
        currentVersionId: string | null;
    })>;
    updateShareLink(shareToken: string, updateShareLinkDto: UpdateShareLinkDto, userId: string): Promise<{
        creator: {
            name: string;
            email: string;
            id: string;
        };
        expiresAt: Date | undefined;
        password: string | undefined;
        lastAccessedAt: Date | undefined;
        permission: SharePermission;
        shareUrl: string;
        id: string;
        isActive: boolean;
        createdAt: Date;
        projectId: string | null;
        resourceType: string;
        resourceId: string;
        shareToken: string;
        permissions: string;
        accessCount: number;
        createdBy: string;
    }>;
    revokeShareLink(shareToken: string, userId: string): Promise<void>;
    getUserShareLinks(userId: string): Promise<any[]>;
    private verifyResourceAccess;
    private generateShareToken;
    private getSharedTrace;
    private getSharedSession;
    private getSharedProject;
    private getSharedPrompt;
    getShareLinksByUser(userId: string): Promise<any[]>;
    getShareLinkByToken(shareToken: string): Promise<{
        creator: {
            name: string;
            email: string;
            id: string;
        };
        expiresAt: Date | undefined;
        password: string | undefined;
        lastAccessedAt: Date | undefined;
        permission: SharePermission;
        shareUrl: string;
        id: string;
        isActive: boolean;
        createdAt: Date;
        projectId: string | null;
        resourceType: string;
        resourceId: string;
        shareToken: string;
        permissions: string;
        accessCount: number;
        createdBy: string;
    }>;
    accessSharedResource(shareToken: string, userId?: string): Promise<({
        session: {
            name: string | null;
            id: string;
        };
    } & {
        id: string;
        data: string;
        status: string;
        metadata: string | null;
        timestamp: Date;
        sessionId: string;
        chainId: string;
        type: string;
        parentId: string | null;
        duration: number | null;
    }) | ({
        project: {
            name: string;
            id: string;
            description: string | null;
        } | null;
        traces: {
            id: string;
            data: string;
            status: string;
            metadata: string | null;
            timestamp: Date;
            sessionId: string;
            chainId: string;
            type: string;
            parentId: string | null;
            duration: number | null;
        }[];
    } & {
        name: string | null;
        id: string;
        startTime: Date;
        endTime: Date | null;
        status: string;
        metadata: string | null;
        userId: string | null;
        projectId: string | null;
        isShared: boolean;
    }) | ({
        sessions: ({
            _count: {
                traces: number;
            };
        } & {
            name: string | null;
            id: string;
            startTime: Date;
            endTime: Date | null;
            status: string;
            metadata: string | null;
            userId: string | null;
            projectId: string | null;
            isShared: boolean;
        })[];
        _count: {
            sessions: number;
            prompts: number;
        };
    } & {
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        teamId: string | null;
        ownerId: string;
        settings: string | null;
        isPublic: boolean;
    }) | ({
        project: {
            name: string;
            id: string;
            description: string | null;
        };
        versions: {
            id: string;
            isActive: boolean;
            createdAt: Date;
            createdBy: string;
            promptId: string;
            version: string;
            content: string;
            parentVersionId: string | null;
            message: string | null;
            tags: string | null;
        }[];
    } & {
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        projectId: string;
        description: string | null;
        isPublic: boolean;
        currentVersionId: string | null;
    })>;
    validateShareAccess(shareToken: string, action?: string): Promise<{
        hasAccess: boolean;
        permissions: null;
        resource?: undefined;
    } | {
        hasAccess: boolean;
        permissions: string;
        resource: ({
            session: {
                name: string | null;
                id: string;
            };
        } & {
            id: string;
            data: string;
            status: string;
            metadata: string | null;
            timestamp: Date;
            sessionId: string;
            chainId: string;
            type: string;
            parentId: string | null;
            duration: number | null;
        }) | ({
            project: {
                name: string;
                id: string;
                description: string | null;
            } | null;
            traces: {
                id: string;
                data: string;
                status: string;
                metadata: string | null;
                timestamp: Date;
                sessionId: string;
                chainId: string;
                type: string;
                parentId: string | null;
                duration: number | null;
            }[];
        } & {
            name: string | null;
            id: string;
            startTime: Date;
            endTime: Date | null;
            status: string;
            metadata: string | null;
            userId: string | null;
            projectId: string | null;
            isShared: boolean;
        }) | ({
            sessions: ({
                _count: {
                    traces: number;
                };
            } & {
                name: string | null;
                id: string;
                startTime: Date;
                endTime: Date | null;
                status: string;
                metadata: string | null;
                userId: string | null;
                projectId: string | null;
                isShared: boolean;
            })[];
            _count: {
                sessions: number;
                prompts: number;
            };
        } & {
            name: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            teamId: string | null;
            ownerId: string;
            settings: string | null;
            isPublic: boolean;
        }) | ({
            project: {
                name: string;
                id: string;
                description: string | null;
            };
            versions: {
                id: string;
                isActive: boolean;
                createdAt: Date;
                createdBy: string;
                promptId: string;
                version: string;
                content: string;
                parentVersionId: string | null;
                message: string | null;
                tags: string | null;
            }[];
        } & {
            name: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            projectId: string;
            description: string | null;
            isPublic: boolean;
            currentVersionId: string | null;
        });
    }>;
}
