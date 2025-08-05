import { PrismaService } from '../prisma/prisma.service';
import { CreateTeamDto, AddMemberDto, UpdateMemberRoleDto } from './dto/teams.dto';
export declare enum TeamRole {
    OWNER = "OWNER",
    ADMIN = "ADMIN",
    MEMBER = "MEMBER",
    VIEWER = "VIEWER"
}
export declare class TeamsService {
    private prisma;
    constructor(prisma: PrismaService);
    createTeam(userId: string, createTeamDto: CreateTeamDto): Promise<{
        _count: {
            members: number;
            projects: number;
        };
        members: ({
            user: {
                email: string;
                name: string | null;
                company: string | null;
                id: string;
            };
        } & {
            id: string;
            role: string;
            userId: string;
            permissions: string | null;
            teamId: string;
            joinedAt: Date;
            invitedBy: string | null;
        })[];
    } & {
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        settings: string | null;
    }>;
    getUserTeams(userId: string): Promise<any[]>;
    getTeamById(teamId: string, userId: string): Promise<{
        currentUserRole: string;
        members: ({
            user: {
                email: string;
                name: string | null;
                company: string | null;
                id: string;
                createdAt: Date;
            };
        } & {
            id: string;
            role: string;
            userId: string;
            permissions: string | null;
            teamId: string;
            joinedAt: Date;
            invitedBy: string | null;
        })[];
        projects: ({
            _count: {
                sessions: number;
                prompts: number;
            };
        } & {
            name: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            teamId: string | null;
            ownerId: string;
            settings: string | null;
            isPublic: boolean;
        })[];
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        settings: string | null;
    }>;
    addMember(teamId: string, userId: string, addMemberDto: AddMemberDto): Promise<{
        user: {
            email: string;
            name: string | null;
            company: string | null;
            id: string;
        };
    } & {
        id: string;
        role: string;
        userId: string;
        permissions: string | null;
        teamId: string;
        joinedAt: Date;
        invitedBy: string | null;
    }>;
    updateMemberRole(teamId: string, userId: string, updateMemberRoleDto: UpdateMemberRoleDto): Promise<{
        user: {
            email: string;
            name: string | null;
            company: string | null;
            id: string;
        };
    } & {
        id: string;
        role: string;
        userId: string;
        permissions: string | null;
        teamId: string;
        joinedAt: Date;
        invitedBy: string | null;
    }>;
    removeMember(teamId: string, userId: string, memberId: string): Promise<{
        message: string;
    }>;
    leaveTeam(teamId: string, userId: string): Promise<{
        message: string;
    }>;
    private checkPermission;
}
