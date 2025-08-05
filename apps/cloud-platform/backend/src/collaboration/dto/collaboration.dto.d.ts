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
