export declare enum AnnotationType {
    NOTE = "NOTE",
    HIGHLIGHT = "HIGHLIGHT",
    BOOKMARK = "BOOKMARK",
    ISSUE = "ISSUE"
}
export declare class CreateCommentDto {
    resourceType: string;
    resourceId: string;
    content: string;
    parentId?: string;
}
export declare class UpdateCommentDto {
    content?: string;
}
export declare class CreateAnnotationDto {
    resourceType: string;
    resourceId: string;
    content: string;
    position?: {
        x?: number;
        y?: number;
        line?: number;
        column?: number;
        elementId?: string;
        selector?: string;
    };
    type?: AnnotationType;
}
export declare class UpdateAnnotationDto {
    content?: string;
    position?: {
        x?: number;
        y?: number;
        line?: number;
        column?: number;
        elementId?: string;
        selector?: string;
    };
    type?: AnnotationType;
}
export declare class CommentResponseDto {
    id: string;
    content: string;
    resourceType: string;
    resourceId: string;
    authorId: string;
    parentId?: string;
    isResolved: boolean;
    createdAt: Date;
    updatedAt: Date;
    author: {
        id: string;
        name: string;
        email: string;
    };
    children?: CommentResponseDto[];
}
export declare class AnnotationResponseDto {
    id: string;
    type: string;
    content?: string;
    position: any;
    resourceType: string;
    resourceId: string;
    authorId: string;
    color?: string;
    isVisible: boolean;
    createdAt: Date;
    updatedAt: Date;
    author: {
        id: string;
        name: string;
        email: string;
    };
}
export declare class PresenceUpdateDto {
    resourceType: string;
    resourceId: string;
    status?: string;
    cursor?: any;
    selection?: any;
}
export declare class PresenceResponseDto {
    id: string;
    user: {
        id: string;
        name: string;
        email: string;
    };
    resourceType: string;
    resourceId: string;
    status: string;
    cursor?: any;
    selection?: any;
    lastSeen: Date;
}
