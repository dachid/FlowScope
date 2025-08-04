import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTeamDto, AddMemberDto, UpdateMemberRoleDto } from './dto/teams.dto';

export enum TeamRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
  VIEWER = 'VIEWER',
}

@Injectable()
export class TeamsService {
  constructor(private prisma: PrismaService) {}

  async createTeam(userId: string, createTeamDto: CreateTeamDto) {
    const { name, description } = createTeamDto;

    const team = await this.prisma.team.create({
      data: {
        name,
        description,
        members: {
          create: {
            userId,
            role: TeamRole.OWNER,
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                company: true,
              },
            },
          },
        },
        _count: {
          select: {
            projects: true,
            members: true,
          },
        },
      },
    });

    return team;
  }

  async getUserTeams(userId: string) {
    const teamMemberships = await this.prisma.teamMember.findMany({
      where: { userId },
      include: {
        team: {
          include: {
            _count: {
              select: {
                projects: true,
                members: true,
              },
            },
          },
        },
      },
      orderBy: {
        team: {
          createdAt: 'desc',
        },
      },
    });

    return teamMemberships.map((membership: any) => ({
      ...membership.team,
      role: membership.role,
    }));
  }

  async getTeamById(teamId: string, userId: string) {
    // Check if user is a member of the team
    const membership = await this.prisma.teamMember.findFirst({
      where: {
        teamId,
        userId,
      },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this team');
    }

    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                company: true,
                createdAt: true,
              },
            },
          },
          orderBy: {
            joinedAt: 'asc',
          },
        },
        projects: {
          include: {
            _count: {
              select: {
                sessions: true,
                prompts: true,
              },
            },
          },
          orderBy: {
            updatedAt: 'desc',
          },
        },
      },
    });

    if (!team) {
      throw new NotFoundException('Team not found');
    }

    return {
      ...team,
      currentUserRole: membership.role,
    };
  }

  async addMember(teamId: string, userId: string, addMemberDto: AddMemberDto) {
    // Check if user has permission to add members
    await this.checkPermission(teamId, userId, [TeamRole.OWNER, TeamRole.ADMIN]);

    const { email, role = TeamRole.MEMBER } = addMemberDto;

    // Find user by email
    const userToAdd = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!userToAdd) {
      throw new NotFoundException('User not found');
    }

    // Check if user is already a member
    const existingMembership = await this.prisma.teamMember.findFirst({
      where: {
        teamId,
        userId: userToAdd.id,
      },
    });

    if (existingMembership) {
      throw new ForbiddenException('User is already a member of this team');
    }

    // Add member
    const membership = await this.prisma.teamMember.create({
      data: {
        teamId,
        userId: userToAdd.id,
        role,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            company: true,
          },
        },
      },
    });

    return membership;
  }

  async updateMemberRole(
    teamId: string,
    userId: string,
    updateMemberRoleDto: UpdateMemberRoleDto,
  ) {
    // Check if user has permission to update roles
    await this.checkPermission(teamId, userId, [TeamRole.OWNER, TeamRole.ADMIN]);

    const { memberId, role } = updateMemberRoleDto;

    // Cannot change owner role
    const targetMember = await this.prisma.teamMember.findFirst({
      where: {
        teamId,
        userId: memberId,
      },
    });

    if (!targetMember) {
      throw new NotFoundException('Team member not found');
    }

    if (targetMember.role === TeamRole.OWNER) {
      throw new ForbiddenException('Cannot change owner role');
    }

    // Update role
    const updatedMembership = await this.prisma.teamMember.update({
      where: {
        id: targetMember.id,
      },
      data: { role },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            company: true,
          },
        },
      },
    });

    return updatedMembership;
  }

  async removeMember(teamId: string, userId: string, memberId: string) {
    // Check if user has permission to remove members
    await this.checkPermission(teamId, userId, [TeamRole.OWNER, TeamRole.ADMIN]);

    const memberToRemove = await this.prisma.teamMember.findFirst({
      where: {
        teamId,
        userId: memberId,
      },
    });

    if (!memberToRemove) {
      throw new NotFoundException('Team member not found');
    }

    // Cannot remove owner
    if (memberToRemove.role === TeamRole.OWNER) {
      throw new ForbiddenException('Cannot remove team owner');
    }

    await this.prisma.teamMember.delete({
      where: {
        id: memberToRemove.id,
      },
    });

    return { message: 'Member removed successfully' };
  }

  async leaveTeam(teamId: string, userId: string) {
    const membership = await this.prisma.teamMember.findFirst({
      where: {
        teamId,
        userId,
      },
    });

    if (!membership) {
      throw new NotFoundException('You are not a member of this team');
    }

    // Owner cannot leave team
    if (membership.role === TeamRole.OWNER) {
      throw new ForbiddenException('Team owner cannot leave the team');
    }

    await this.prisma.teamMember.delete({
      where: {
        id: membership.id,
      },
    });

    return { message: 'Left team successfully' };
  }

  private async checkPermission(
    teamId: string,
    userId: string,
    allowedRoles: TeamRole[],
  ) {
    const membership = await this.prisma.teamMember.findFirst({
      where: {
        teamId,
        userId,
      },
    });

    if (!membership || !allowedRoles.includes(membership.role as TeamRole)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return membership;
  }
}
