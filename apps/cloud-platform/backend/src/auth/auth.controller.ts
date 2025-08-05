import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto, LoginUserDto, RefreshTokenDto } from './dto/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginUserDto: LoginUserDto) {
    return this.authService.login(loginUserDto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshTokens(@Body() refreshTokenDto: RefreshTokenDto) {
    // Extract user ID from token payload
    // This is a simplified implementation
    return this.authService.refreshTokens('user-id', refreshTokenDto.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Request() req: any) {
    return this.authService.logout(req.user?.sub || 'anonymous');
  }

  @Get('profile')
  async getProfile(@Request() req: any) {
    // In a real implementation, this would be protected by JWT guard
    return this.authService.validateUser(req.user?.sub || 'anonymous-user');
  }
}
