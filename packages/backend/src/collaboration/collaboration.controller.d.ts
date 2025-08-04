import { CollaborationService } from './collaboration.service';
import { CreateCommentDto, UpdateCommentDto, CommentResponseDto, CreateAnnotationDto, UpdateAnnotationDto, AnnotationResponseDto, PresenceUpdateDto, PresenceResponseDto } from './collaboration.dto';
export declare class CollaborationController {
    private readonly collaborationService;
    constructor(collaborationService: CollaborationService);
    createComment(createCommentDto: CreateCommentDto, req: any): Promise<CommentResponseDto>;
    getComments(resourceType: string, resourceId: string): Promise<CommentResponseDto[]>;
    updateComment(id: string, updateCommentDto: UpdateCommentDto, req: any): Promise<CommentResponseDto>;
    deleteComment(id: string, req: any): Promise<void>;
    resolveComment(id: string, req: any): Promise<CommentResponseDto>;
    createAnnotation(createAnnotationDto: CreateAnnotationDto, req: any): Promise<AnnotationResponseDto>;
    getAnnotations(resourceType: string, resourceId: string): Promise<AnnotationResponseDto[]>;
    updateAnnotation(id: string, updateAnnotationDto: UpdateAnnotationDto, req: any): Promise<AnnotationResponseDto>;
    deleteAnnotation(id: string, req: any): Promise<void>;
    updatePresence(presenceUpdateDto: PresenceUpdateDto, req: any): Promise<PresenceResponseDto>;
    getPresence(resourceType: string, resourceId: string): Promise<PresenceResponseDto[]>;
}
