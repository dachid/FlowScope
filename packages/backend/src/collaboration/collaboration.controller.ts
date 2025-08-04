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
import { CollaborationService } from './collaboration.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  CreateCommentDto,
  UpdateCommentDto,
  CommentResponseDto,
  CreateAnnotationDto,
  UpdateAnnotationDto,
  AnnotationResponseDto,
  PresenceUpdateDto,
  PresenceResponseDto,
} from './collaboration.dto';

@Controller('collaboration')
@UseGuards(JwtAuthGuard)
export class CollaborationController {
  constructor(private readonly collaborationService: CollaborationService) {}

  // Comments endpoints
  @Post('comments')
  async createComment(
    @Body() createCommentDto: CreateCommentDto,
    @Request() req: any,
  ): Promise<CommentResponseDto> {
    return this.collaborationService.createComment(createCommentDto, req.user.id);
  }

  @Get('comments')
  async getComments(
    @Query('resourceType') resourceType: string,
    @Query('resourceId') resourceId: string,
  ): Promise<CommentResponseDto[]> {
    return this.collaborationService.getComments(resourceType, resourceId);
  }

  @Put('comments/:id')
  async updateComment(
    @Param('id') id: string,
    @Body() updateCommentDto: UpdateCommentDto,
    @Request() req: any,
  ): Promise<CommentResponseDto> {
    return this.collaborationService.updateComment(id, updateCommentDto, req.user.id);
  }

  @Delete('comments/:id')
  async deleteComment(@Param('id') id: string, @Request() req: any): Promise<void> {
    return this.collaborationService.deleteComment(id, req.user.id);
  }

  @Put('comments/:id/resolve')
  async resolveComment(@Param('id') id: string, @Request() req: any): Promise<CommentResponseDto> {
    return this.collaborationService.resolveComment(id, req.user.id);
  }

  // Annotations endpoints
  @Post('annotations')
  async createAnnotation(
    @Body() createAnnotationDto: CreateAnnotationDto,
    @Request() req: any,
  ): Promise<AnnotationResponseDto> {
    return this.collaborationService.createAnnotation(createAnnotationDto, req.user.id);
  }

  @Get('annotations')
  async getAnnotations(
    @Query('resourceType') resourceType: string,
    @Query('resourceId') resourceId: string,
  ): Promise<AnnotationResponseDto[]> {
    return this.collaborationService.getAnnotations(resourceType, resourceId);
  }

  @Put('annotations/:id')
  async updateAnnotation(
    @Param('id') id: string,
    @Body() updateAnnotationDto: UpdateAnnotationDto,
    @Request() req: any,
  ): Promise<AnnotationResponseDto> {
    return this.collaborationService.updateAnnotation(id, updateAnnotationDto, req.user.id);
  }

  @Delete('annotations/:id')
  async deleteAnnotation(@Param('id') id: string, @Request() req: any): Promise<void> {
    return this.collaborationService.deleteAnnotation(id, req.user.id);
  }

  // Presence endpoints
  @Post('presence')
  async updatePresence(
    @Body() presenceUpdateDto: PresenceUpdateDto,
    @Request() req: any,
  ): Promise<PresenceResponseDto> {
    return this.collaborationService.updatePresence(presenceUpdateDto, req.user.id);
  }

  @Get('presence')
  async getPresence(
    @Query('resourceType') resourceType: string,
    @Query('resourceId') resourceId: string,
  ): Promise<PresenceResponseDto[]> {
    return this.collaborationService.getPresence(resourceType, resourceId);
  }
}
