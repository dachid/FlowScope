export interface TeamMember {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    role: 'admin' | 'member' | 'viewer';
    isOnline: boolean;
    lastSeen: number;
}
export interface Team {
    id: string;
    name: string;
    description?: string;
    createdAt: number;
    members: TeamMember[];
    projects: string[];
}
export interface Comment {
    id: string;
    traceId: string;
    sessionId: string;
    userId: string;
    content: string;
    timestamp: number;
    type: 'comment' | 'issue' | 'question' | 'praise';
    isResolved?: boolean;
    replies?: Comment[];
}
interface TeamsStore {
    currentTeam: Team | null;
    teams: Team[];
    currentUser: TeamMember | null;
    comments: Comment[];
    setCurrentTeam: (team: Team | null) => void;
    addTeam: (name: string, description?: string) => Team;
    addTeamMember: (teamId: string, member: Omit<TeamMember, 'id'>) => void;
    removeTeamMember: (teamId: string, memberId: string) => void;
    updateMemberRole: (teamId: string, memberId: string, role: TeamMember['role']) => void;
    addComment: (comment: Omit<Comment, 'id' | 'timestamp'>) => void;
    updateComment: (commentId: string, content: string) => void;
    deleteComment: (commentId: string) => void;
    resolveComment: (commentId: string) => void;
    getCommentsForTrace: (traceId: string) => Comment[];
}
export declare const useTeamsStore: import("zustand").UseBoundStore<import("zustand").StoreApi<TeamsStore>>;
export {};
