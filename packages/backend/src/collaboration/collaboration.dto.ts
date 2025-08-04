import { IsString, IsOptional, IsObject, IsEnum } from 'class-validator';

export enum AnnotationType {
  NOTE = 'NOTE',
  HIGHLIGHT = 'HIGHLIGHT',
  BOOKMARK = 'BOOKMARK',
  ISSUE = 'ISSUE',
}

export class CreateCommentDto {
  @IsString()
  resourceType!: string;

  @IsString()
  resourceId!: string;

  @IsString()
  content!: string;

  @IsOptional()
  @IsString()
  parentId?: string;
}

export class UpdateCommentDto {
  @IsOptional()
  @IsString()
  content?: string;
}

export class CreateAnnotationDto {
  @IsString()
  resourceType!: string;

  @IsString()
  resourceId!: string;

  @IsString()
  content!: string;

  @IsOptional()
  @IsObject()
  position?: {
    x?: number;
    y?: number;
    line?: number;
    column?: number;
    elementId?: string;
    selector?: string;
  };

  @IsOptional()
  @IsEnum(AnnotationType)
  type?: AnnotationType;
}

export class UpdateAnnotationDto {
  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsObject()
  position?: {
    x?: number;
    y?: number;
    line?: number;
    column?: number;
    elementId?: string;
    selector?: string;
  };

  @IsOptional()
  @IsEnum(AnnotationType)
  type?: AnnotationType;
}

export class CommentResponseDto {
  id!: string;
  content!: string;
  resourceType!: string;
  resourceId!: string;
  authorId!: string;
  parentId?: string;
  isResolved!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
  author!: {
    id: string;
    name: string;
    email: string;
  };
  children?: CommentResponseDto[];
}

export class AnnotationResponseDto {
  id!: string;
  type!: string;
  content?: string;
  position!: any;
  resourceType!: string;
  resourceId!: string;
  authorId!: string;
  color?: string;
  isVisible!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
  author!: {
    id: string;
    name: string;
    email: string;
  };
}

export class PresenceUpdateDto {
  @IsString()
  resourceType!: string;

  @IsString()
  resourceId!: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsObject()
  cursor?: any;

  @IsOptional()
  @IsObject()
  selection?: any;
}

export class PresenceResponseDto {
  id!: string;
  user!: {
    id: string;
    name: string;
    email: string;
  };
  resourceType!: string;
  resourceId!: string;
  status!: string;
  cursor?: any;
  selection?: any;
  lastSeen!: Date;
}
