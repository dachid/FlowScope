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
  shareToken!: string;
  resourceType!: string;
  resourceId!: string;
  permissions!: any;
  expiresAt?: Date;
  isActive!: boolean;
  accessCount!: number;
  createdBy!: string;
  createdAt!: Date;
  lastAccessedAt?: Date;
  creator!: {
    id: string;
    name: string;
    email: string;
  };
}

export class AccessSharedResourceDto {
  @IsOptional()
  @IsString()
  password?: string;
}
