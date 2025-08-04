import { IsString, IsEmail, IsEnum, IsOptional, MaxLength } from 'class-validator';

export enum TeamRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
  VIEWER = 'VIEWER',
}

export class CreateTeamDto {
  @IsString()
  @MaxLength(100)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}

export class AddMemberDto {
  @IsEmail()
  email!: string;

  @IsOptional()
  @IsEnum(TeamRole)
  role?: TeamRole;
}

export class UpdateMemberRoleDto {
  @IsString()
  memberId!: string;

  @IsEnum(TeamRole)
  role!: TeamRole;
}

export class InviteMemberDto {
  @IsEmail()
  email!: string;

  @IsOptional()
  @IsEnum(TeamRole)
  role?: TeamRole;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string;
}
