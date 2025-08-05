import { TeamsService } from './teams.service';
import { CreateTeamDto, AddMemberDto, UpdateMemberRoleDto } from './dto/teams.dto';
export declare class TeamsController {
    private teamsService;
    constructor(teamsService: TeamsService);
    createTeam(req: any, createTeamDto: CreateTeamDto): Promise<{
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
    getUserTeams(req: any): Promise<any[]>;
    getTeam(teamId: string, req: any): Promise<{
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
    addMember(teamId: string, req: any, addMemberDto: AddMemberDto): Promise<{
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
    updateMemberRole(teamId: string, req: any, updateMemberRoleDto: UpdateMemberRoleDto): Promise<{
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
    removeMember(teamId: string, memberId: string, req: any): Promise<{
        message: string;
    }>;
    leaveTeam(teamId: string, req: any): Promise<{
        message: string;
    }>;
}
