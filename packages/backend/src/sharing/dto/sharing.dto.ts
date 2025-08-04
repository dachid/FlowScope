import { IsString, IsEnum, IsOptional, IsDateString, IsBoolean } from 'class-validator';

export enum SharePermission {
  VIEW = 'VIEW',
  COMMENT = 'COMMENT',
  EDIT = 'EDIT',
}

export enum ShareableResourceType {
  TRACE = 'TRACE',
  SESSION = 'SESSION',
  PROJECT = 'PROJECT',
  PROMPT = 'PROMPT',
}

export class CreateShareLinkDto {
  @IsEnum(ShareableResourceType)
  resourceType!: ShareableResourceType;

  @IsString()
  resourceId!: string;

  @IsOptional()
  @IsEnum(SharePermission)
  permission?: SharePermission;

  @IsOptional()
  @IsDateString()
  expiresAt?: Date;

  @IsOptional()
  @IsString()
  password?: string;
}

export class UpdateShareLinkDto {
  @IsOptional()
  @IsEnum(SharePermission)
  permission?: SharePermission;

  @IsOptional()
  @IsDateString()
  expiresAt?: Date;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class AccessShareLinkDto {
  @IsOptional()
  @IsString()
  password?: string;
}

export class ShareLinkResponseDto {
  id!: string;
  shareUrl!: string;
  resourceType!: string;
  resourceId!: string;
  permission!: SharePermission;
  expiresAt?: Date;
  password?: string;
  isActive!: boolean;
  accessCount!: number;
  lastAccessedAt?: Date;
  createdAt!: Date;
  creator!: {
    id: string;
    email: string;
    name: string;
  };
}
