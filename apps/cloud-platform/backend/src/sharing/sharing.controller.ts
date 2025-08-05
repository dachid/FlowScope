import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { SharingService } from './sharing.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  CreateShareLinkDto,
  UpdateShareLinkDto,
  ShareLinkResponseDto,
  AccessShareLinkDto,
} from './dto/sharing.dto';

@Controller('sharing')
@UseGuards(JwtAuthGuard)
export class SharingController {
  constructor(private readonly sharingService: SharingService) {}

  @Post('links')
  async createShareLink(
    @Body() createShareLinkDto: CreateShareLinkDto,
    @Request() req: any,
  ): Promise<ShareLinkResponseDto> {
    return this.sharingService.createShareLink(createShareLinkDto, req.user.id);
  }

  @Get('links')
  async getShareLinks(@Request() req: any): Promise<ShareLinkResponseDto[]> {
    return this.sharingService.getShareLinksByUser(req.user.id);
  }

  @Get('links/:shareToken')
  async getShareLinkByToken(
    @Param('shareToken') shareToken: string,
  ): Promise<ShareLinkResponseDto> {
    return this.sharingService.getShareLinkByToken(shareToken);
  }

  @Put('links/:id')
  async updateShareLink(
    @Param('id') id: string,
    @Body() updateShareLinkDto: UpdateShareLinkDto,
    @Request() req: any,
  ): Promise<ShareLinkResponseDto> {
    return this.sharingService.updateShareLink(id, updateShareLinkDto, req.user.id);
  }

  @Delete('links/:id')
  async revokeShareLink(@Param('id') id: string, @Request() req: any): Promise<void> {
    return this.sharingService.revokeShareLink(id, req.user.id);
  }

  @Post('access/:shareToken')
  async accessSharedResource(
    @Param('shareToken') shareToken: string,
    @Body() accessDto: AccessShareLinkDto,
    @Request() req: any,
  ): Promise<any> {
    return this.sharingService.accessSharedResource(shareToken, req.user?.id);
  }

  @Get('access/:shareToken/validate')
  async validateShareAccess(
    @Param('shareToken') shareToken: string,
    @Query('action') action?: string,
  ): Promise<{ hasAccess: boolean; permissions: any; resource?: any }> {
    return this.sharingService.validateShareAccess(shareToken, action);
  }
}
