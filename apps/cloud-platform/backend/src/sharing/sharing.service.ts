import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateShareLinkDto, UpdateShareLinkDto } from './dto/sharing.dto';
import { randomBytes } from 'crypto';

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

@Injectable()
export class SharingService {
  constructor(private prisma: PrismaService) {}

  async createShareLink(createShareLinkDto: CreateShareLinkDto, userId: string) {
    const {
      resourceType,
      resourceId,
      permission = SharePermission.VIEW,
      expiresAt,
      password,
    } = createShareLinkDto;

    // Verify user has access to the resource
    await this.verifyResourceAccess(userId, resourceType, resourceId);

    // Generate unique share token
    const shareToken = this.generateShareToken();

    const shareLink = await this.prisma.shareLink.create({
      data: {
        shareToken,
        resourceType,
        resourceId,
        permissions: JSON.stringify(permission || 'VIEW'),
        createdBy: userId,
        expiresAt,
        password,
        isActive: true,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return {
      ...shareLink,
      creator: {
        ...shareLink.creator,
        name: shareLink.creator.name || '',
      },
      expiresAt: shareLink.expiresAt || undefined,
      password: shareLink.password || undefined,
      lastAccessedAt: shareLink.lastAccessedAt || undefined,
      permission: JSON.parse(shareLink.permissions) as SharePermission,
      shareUrl: `${process.env.FRONTEND_URL}/shared/${shareToken}`,
    };
  }

  async getShareLink(shareToken: string, password?: string) {
    const shareLink = await this.prisma.shareLink.findUnique({
      where: { shareToken },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!shareLink) {
      throw new NotFoundException('Share link not found');
    }

    if (!shareLink.isActive) {
      throw new ForbiddenException('Share link is disabled');
    }

    if (shareLink.expiresAt && shareLink.expiresAt < new Date()) {
      throw new ForbiddenException('Share link has expired');
    }

    if (shareLink.password && shareLink.password !== password) {
      throw new ForbiddenException('Invalid password');
    }

    // Increment access count
    await this.prisma.shareLink.update({
      where: { id: shareLink.id },
      data: {
        accessCount: {
          increment: 1,
        },
        lastAccessedAt: new Date(),
      },
    });

    return {
      ...shareLink,
      creator: {
        ...shareLink.creator,
        name: shareLink.creator.name || '',
      },
      expiresAt: shareLink.expiresAt || undefined,
      password: shareLink.password || undefined,
      lastAccessedAt: shareLink.lastAccessedAt || undefined,
      permission: JSON.parse(shareLink.permissions) as SharePermission,
      shareUrl: `${process.env.FRONTEND_URL}/shared/${shareLink.shareToken}`,
    };
  }

  async getSharedResource(shareToken: string, password?: string) {
    const shareLink = await this.getShareLink(shareToken, password);

    // Fetch the actual resource based on type
    switch (shareLink.resourceType) {
      case ShareableResourceType.TRACE:
        return this.getSharedTrace(shareLink.resourceId);
      case ShareableResourceType.SESSION:
        return this.getSharedSession(shareLink.resourceId);
      case ShareableResourceType.PROJECT:
        return this.getSharedProject(shareLink.resourceId);
      case ShareableResourceType.PROMPT:
        return this.getSharedPrompt(shareLink.resourceId);
      default:
        throw new NotFoundException('Invalid resource type');
    }
  }

  async updateShareLink(
    shareToken: string,
    updateShareLinkDto: UpdateShareLinkDto,
    userId: string,
  ) {
    const shareLink = await this.prisma.shareLink.findUnique({
      where: { shareToken },
    });

    if (!shareLink) {
      throw new NotFoundException('Share link not found');
    }

    if (shareLink.createdBy !== userId) {
      throw new ForbiddenException('You can only update your own share links');
    }

    const updatedShareLink = await this.prisma.shareLink.update({
      where: { shareToken },
      data: updateShareLinkDto,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return {
      ...updatedShareLink,
      creator: {
        ...updatedShareLink.creator,
        name: updatedShareLink.creator.name || '',
      },
      expiresAt: updatedShareLink.expiresAt || undefined,
      password: updatedShareLink.password || undefined,
      lastAccessedAt: updatedShareLink.lastAccessedAt || undefined,
      permission: JSON.parse(updatedShareLink.permissions) as SharePermission,
      shareUrl: `${process.env.FRONTEND_URL}/shared/${shareToken}`,
    };
  }

  async revokeShareLink(shareToken: string, userId: string): Promise<void> {
    const shareLink = await this.prisma.shareLink.findUnique({
      where: { shareToken },
    });

    if (!shareLink) {
      throw new NotFoundException('Share link not found');
    }

    if (shareLink.createdBy !== userId) {
      throw new ForbiddenException('You can only revoke your own share links');
    }

    await this.prisma.shareLink.update({
      where: { shareToken },
      data: { isActive: false },
    });
  }

  async getUserShareLinks(userId: string) {
    const shareLinks = await this.prisma.shareLink.findMany({
      where: { createdBy: userId },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return shareLinks.map((link: any) => ({
      ...link,
      shareUrl: `${process.env.FRONTEND_URL}/shared/${link.shareToken}`,
    }));
  }

  private async verifyResourceAccess(
    userId: string,
    resourceType: ShareableResourceType,
    resourceId: string,
  ) {
    // Implement resource access verification logic
    // This is a simplified version
    return true;
  }

  private generateShareToken(): string {
    return randomBytes(32).toString('hex');
  }

  private async getSharedTrace(traceId: string) {
    const trace = await this.prisma.traceData.findUnique({
      where: { id: traceId },
      include: {
        session: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!trace) {
      throw new NotFoundException('Trace not found');
    }

    return trace;
  }

  private async getSharedSession(sessionId: string) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        traces: {
          orderBy: { timestamp: 'asc' },
        },
        project: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    return session;
  }

  private async getSharedProject(projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        sessions: {
          include: {
            _count: {
              select: {
                traces: true,
              },
            },
          },
          orderBy: { startTime: 'desc' },
        },
        _count: {
          select: {
            sessions: true,
            prompts: true,
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  private async getSharedPrompt(promptId: string) {
    const prompt = await this.prisma.prompt.findUnique({
      where: { id: promptId },
      include: {
        versions: {
          orderBy: { createdAt: 'desc' },
        },
        project: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    });

    if (!prompt) {
      throw new NotFoundException('Prompt not found');
    }

    return prompt;
  }

  // Additional methods required by controller
  async getShareLinksByUser(userId: string) {
    return this.getUserShareLinks(userId);
  }

  async getShareLinkByToken(shareToken: string) {
    return this.getShareLink(shareToken);
  }

  async accessSharedResource(shareToken: string, userId?: string) {
    return this.getSharedResource(shareToken);
  }

  async validateShareAccess(shareToken: string, action?: string) {
    try {
      const shareLink = await this.getShareLink(shareToken);
      if (!shareLink) {
        return { hasAccess: false, permissions: null };
      }

      const resource = await this.getSharedResource(shareToken);
      return {
        hasAccess: true,
        permissions: shareLink.permissions,
        resource: resource
      };
    } catch (error) {
      return { hasAccess: false, permissions: null };
    }
  }
}
