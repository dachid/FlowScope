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
    shareToken: string;
    resourceType: string;
    resourceId: string;
    permissions: any;
    expiresAt?: Date;
    isActive: boolean;
    accessCount: number;
    createdBy: string;
    createdAt: Date;
    lastAccessedAt?: Date;
    creator: {
        id: string;
        name: string;
        email: string;
    };
}
export declare class AccessSharedResourceDto {
    password?: string;
}
