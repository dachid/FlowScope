export declare enum TeamRole {
    OWNER = "OWNER",
    ADMIN = "ADMIN",
    MEMBER = "MEMBER",
    VIEWER = "VIEWER"
}
export declare class CreateTeamDto {
    name: string;
    description?: string;
}
export declare class AddMemberDto {
    email: string;
    role?: TeamRole;
}
export declare class UpdateMemberRoleDto {
    memberId: string;
    role: TeamRole;
}
export declare class InviteMemberDto {
    email: string;
    role?: TeamRole;
    message?: string;
}
