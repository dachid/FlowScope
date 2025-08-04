import { IsEmail, IsString, IsOptional, MinLength, MaxLength } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(50)
  password!: string;

  @IsString()
  @MaxLength(100)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  company?: string;
}

export class LoginUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;
}

export class RefreshTokenDto {
  @IsString()
  refreshToken!: string;
}

export class AuthResponseDto {
  user!: {
    id: string;
    email: string;
    name: string;
    company?: string;
    role: string;
    createdAt: Date;
  };
  accessToken!: string;
  refreshToken!: string;
}
