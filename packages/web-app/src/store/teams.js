"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useTeamsStore = void 0;
const zustand_1 = require("zustand");
exports.useTeamsStore = (0, zustand_1.create)((set, get) => ({
    // Initial state
    currentTeam: null,
    teams: [],
    currentUser: null,
    comments: [],
    // Actions
    setCurrentTeam: (team) => set({ currentTeam: team }),
    addTeam: (name, description) => {
        const newTeam = {
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
        const newMember = {
            ...memberData,
            id: `member-${Date.now()}`
        };
        set((state) => ({
            teams: state.teams.map(team => team.id === teamId
                ? { ...team, members: [...team.members, newMember] }
                : team),
            currentTeam: state.currentTeam?.id === teamId
                ? { ...state.currentTeam, members: [...state.currentTeam.members, newMember] }
                : state.currentTeam
        }));
    },
    removeTeamMember: (teamId, memberId) => {
        set((state) => ({
            teams: state.teams.map(team => team.id === teamId
                ? { ...team, members: team.members.filter(m => m.id !== memberId) }
                : team),
            currentTeam: state.currentTeam?.id === teamId
                ? { ...state.currentTeam, members: state.currentTeam.members.filter(m => m.id !== memberId) }
                : state.currentTeam
        }));
    },
    updateMemberRole: (teamId, memberId, role) => {
        set((state) => ({
            teams: state.teams.map(team => team.id === teamId
                ? {
                    ...team,
                    members: team.members.map(m => m.id === memberId ? { ...m, role } : m)
                }
                : team),
            currentTeam: state.currentTeam?.id === teamId
                ? {
                    ...state.currentTeam,
                    members: state.currentTeam.members.map(m => m.id === memberId ? { ...m, role } : m)
                }
                : state.currentTeam
        }));
    },
    addComment: (commentData) => {
        const newComment = {
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
            comments: state.comments.map(comment => comment.id === commentId ? { ...comment, content } : comment)
        }));
    },
    deleteComment: (commentId) => {
        set((state) => ({
            comments: state.comments.filter(comment => comment.id !== commentId)
        }));
    },
    resolveComment: (commentId) => {
        set((state) => ({
            comments: state.comments.map(comment => comment.id === commentId ? { ...comment, isResolved: !comment.isResolved } : comment)
        }));
    },
    getCommentsForTrace: (traceId) => {
        const { comments } = get();
        return comments.filter(comment => comment.traceId === traceId);
    },
}));
