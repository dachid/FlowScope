"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeamsService = exports.TeamRole = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
var TeamRole;
(function (TeamRole) {
    TeamRole["OWNER"] = "OWNER";
    TeamRole["ADMIN"] = "ADMIN";
    TeamRole["MEMBER"] = "MEMBER";
    TeamRole["VIEWER"] = "VIEWER";
})(TeamRole || (exports.TeamRole = TeamRole = {}));
let TeamsService = class TeamsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createTeam(userId, createTeamDto) {
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
    async getUserTeams(userId) {
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
        return teamMemberships.map((membership) => ({
            ...membership.team,
            role: membership.role,
        }));
    }
    async getTeamById(teamId, userId) {
        // Check if user is a member of the team
        const membership = await this.prisma.teamMember.findFirst({
            where: {
                teamId,
                userId,
            },
        });
        if (!membership) {
            throw new common_1.ForbiddenException('You are not a member of this team');
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
            throw new common_1.NotFoundException('Team not found');
        }
        return {
            ...team,
            currentUserRole: membership.role,
        };
    }
    async addMember(teamId, userId, addMemberDto) {
        // Check if user has permission to add members
        await this.checkPermission(teamId, userId, [TeamRole.OWNER, TeamRole.ADMIN]);
        const { email, role = TeamRole.MEMBER } = addMemberDto;
        // Find user by email
        const userToAdd = await this.prisma.user.findUnique({
            where: { email },
        });
        if (!userToAdd) {
            throw new common_1.NotFoundException('User not found');
        }
        // Check if user is already a member
        const existingMembership = await this.prisma.teamMember.findFirst({
            where: {
                teamId,
                userId: userToAdd.id,
            },
        });
        if (existingMembership) {
            throw new common_1.ForbiddenException('User is already a member of this team');
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
    async updateMemberRole(teamId, userId, updateMemberRoleDto) {
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
            throw new common_1.NotFoundException('Team member not found');
        }
        if (targetMember.role === TeamRole.OWNER) {
            throw new common_1.ForbiddenException('Cannot change owner role');
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
    async removeMember(teamId, userId, memberId) {
        // Check if user has permission to remove members
        await this.checkPermission(teamId, userId, [TeamRole.OWNER, TeamRole.ADMIN]);
        const memberToRemove = await this.prisma.teamMember.findFirst({
            where: {
                teamId,
                userId: memberId,
            },
        });
        if (!memberToRemove) {
            throw new common_1.NotFoundException('Team member not found');
        }
        // Cannot remove owner
        if (memberToRemove.role === TeamRole.OWNER) {
            throw new common_1.ForbiddenException('Cannot remove team owner');
        }
        await this.prisma.teamMember.delete({
            where: {
                id: memberToRemove.id,
            },
        });
        return { message: 'Member removed successfully' };
    }
    async leaveTeam(teamId, userId) {
        const membership = await this.prisma.teamMember.findFirst({
            where: {
                teamId,
                userId,
            },
        });
        if (!membership) {
            throw new common_1.NotFoundException('You are not a member of this team');
        }
        // Owner cannot leave team
        if (membership.role === TeamRole.OWNER) {
            throw new common_1.ForbiddenException('Team owner cannot leave the team');
        }
        await this.prisma.teamMember.delete({
            where: {
                id: membership.id,
            },
        });
        return { message: 'Left team successfully' };
    }
    async checkPermission(teamId, userId, allowedRoles) {
        const membership = await this.prisma.teamMember.findFirst({
            where: {
                teamId,
                userId,
            },
        });
        if (!membership || !allowedRoles.includes(membership.role)) {
            throw new common_1.ForbiddenException('Insufficient permissions');
        }
        return membership;
    }
};
exports.TeamsService = TeamsService;
exports.TeamsService = TeamsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TeamsService);
