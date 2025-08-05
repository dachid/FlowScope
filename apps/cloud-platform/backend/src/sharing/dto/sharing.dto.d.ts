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
export declare class CreateShareLinkDto {
    resourceType: ShareableResourceType;
    resourceId: string;
    permission?: SharePermission;
    expiresAt?: Date;
    password?: string;
}
export declare class UpdateShareLinkDto {
    permission?: SharePermission;
    expiresAt?: Date;
    password?: string;
    isActive?: boolean;
}
export declare class AccessShareLinkDto {
    password?: string;
}
export declare class ShareLinkResponseDto {
    id: string;
    shareUrl: string;
    resourceType: string;
    resourceId: string;
    permission: SharePermission;
    expiresAt?: Date;
    password?: string;
    isActive: boolean;
    accessCount: number;
    lastAccessedAt?: Date;
    createdAt: Date;
    creator: {
        id: string;
        email: string;
        name: string;
    };
}
