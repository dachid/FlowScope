import { create } from 'zustand';

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
  // Team Data
  currentTeam: Team | null;
  teams: Team[];
  currentUser: TeamMember | null;
  
  // Comments
  comments: Comment[];
  
  // Actions
  setCurrentTeam: (team: Team | null) => void;
  addTeam: (name: string, description?: string) => Team;
  addTeamMember: (teamId: string, member: Omit<TeamMember, 'id'>) => void;
  removeTeamMember: (teamId: string, memberId: string) => void;
  updateMemberRole: (teamId: string, memberId: string, role: TeamMember['role']) => void;
  
  // Comments
  addComment: (comment: Omit<Comment, 'id' | 'timestamp'>) => void;
  updateComment: (commentId: string, content: string) => void;
  deleteComment: (commentId: string) => void;
  resolveComment: (commentId: string) => void;
  getCommentsForTrace: (traceId: string) => Comment[];
}

export const useTeamsStore = create<TeamsStore>((set, get) => ({
  // Initial state
  currentTeam: null,
  teams: [],
  currentUser: null,
  comments: [],
  
  // Actions
  setCurrentTeam: (team) => set({ currentTeam: team }),
  
  addTeam: (name, description) => {
    const newTeam: Team = {
      id: `team-${Date.now()}`,
      name,
      description,
      createdAt: Date.now(),
      members: [],
      projects: []
    };
    
    set((state) => ({
      teams: [...state.teams, newTeam],
      currentTeam: newTeam
    }));
    
    return newTeam;
  },
  
  addTeamMember: (teamId, memberData) => {
    const newMember: TeamMember = {
      ...memberData,
      id: `member-${Date.now()}`
    };
    
    set((state) => ({
      teams: state.teams.map(team =>
        team.id === teamId
          ? { ...team, members: [...team.members, newMember] }
          : team
      ),
      currentTeam: state.currentTeam?.id === teamId
        ? { ...state.currentTeam, members: [...state.currentTeam.members, newMember] }
        : state.currentTeam
    }));
  },
  
  removeTeamMember: (teamId, memberId) => {
    set((state) => ({
      teams: state.teams.map(team =>
        team.id === teamId
          ? { ...team, members: team.members.filter(m => m.id !== memberId) }
          : team
      ),
      currentTeam: state.currentTeam?.id === teamId
        ? { ...state.currentTeam, members: state.currentTeam.members.filter(m => m.id !== memberId) }
        : state.currentTeam
    }));
  },
  
  updateMemberRole: (teamId, memberId, role) => {
    set((state) => ({
      teams: state.teams.map(team =>
        team.id === teamId
          ? {
              ...team,
              members: team.members.map(m =>
                m.id === memberId ? { ...m, role } : m
              )
            }
          : team
      ),
      currentTeam: state.currentTeam?.id === teamId
        ? {
            ...state.currentTeam,
            members: state.currentTeam.members.map(m =>
              m.id === memberId ? { ...m, role } : m
            )
          }
        : state.currentTeam
    }));
  },
  
  addComment: (commentData) => {
    const newComment: Comment = {
      ...commentData,
      id: `comment-${Date.now()}`,
      timestamp: Date.now()
    };
    
    set((state) => ({
      comments: [...state.comments, newComment]
    }));
  },
  
  updateComment: (commentId, content) => {
    set((state) => ({
      comments: state.comments.map(comment =>
        comment.id === commentId ? { ...comment, content } : comment
      )
    }));
  },
  
  deleteComment: (commentId) => {
    set((state) => ({
      comments: state.comments.filter(comment => comment.id !== commentId)
    }));
  },
  
  resolveComment: (commentId) => {
    set((state) => ({
      comments: state.comments.map(comment =>
        comment.id === commentId ? { ...comment, isResolved: !comment.isResolved } : comment
      )
    }));
  },
  
  getCommentsForTrace: (traceId) => {
    const { comments } = get();
    return comments.filter(comment => comment.traceId === traceId);
  },
}));
