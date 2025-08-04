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
