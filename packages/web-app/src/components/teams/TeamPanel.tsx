import React from 'react';
import { Users, Crown, Shield, Eye, Circle } from 'lucide-react';
import { useTeamsStore } from '../../store/teams';

interface TeamPanelProps {
  onOpenTeamManagement: () => void;
  className?: string;
}

export const TeamPanel: React.FC<TeamPanelProps> = ({ onOpenTeamManagement, className = '' }) => {
  const { currentTeam, currentUser } = useTeamsStore();

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="w-3 h-3 text-yellow-500" />;
      case 'member':
        return <Shield className="w-3 h-3 text-blue-500" />;
      case 'viewer':
        return <Eye className="w-3 h-3 text-gray-500" />;
      default:
        return null;
    }
  };

  if (!currentTeam || !currentUser) {
    return (
      <div className={`p-4 border-b border-gray-200 ${className}`}>
        <div className="text-center">
          <Users className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm text-gray-500 mb-3">No team selected</p>
          <button
            onClick={onOpenTeamManagement}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Join or Create Team
          </button>
        </div>
      </div>
    );
  }

  const onlineMembers = currentTeam.members.filter(m => m.isOnline).length;

  return (
    <div className={`p-4 border-b border-gray-200 ${className}`}>
      {/* Team Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-600" />
          <span className="font-medium text-gray-900 text-sm truncate">
            {currentTeam.name}
          </span>
        </div>
        <button
          onClick={onOpenTeamManagement}
          className="text-xs text-blue-600 hover:text-blue-700 font-medium"
        >
          Manage
        </button>
      </div>

      {/* Current User */}
      <div className="flex items-center gap-2 mb-3 p-2 bg-blue-50 rounded-lg">
        <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
          {currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <span className="text-xs font-medium text-gray-900 truncate">
              {currentUser.name}
            </span>
            {getRoleIcon(currentUser.role)}
          </div>
          <span className="text-xs text-gray-500">{currentUser.role}</span>
        </div>
      </div>

      {/* Team Stats */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="flex items-center gap-1">
          <Users className="w-3 h-3 text-gray-400" />
          <span className="text-gray-600">{currentTeam.members.length} members</span>
        </div>
        <div className="flex items-center gap-1">
          <Circle className="w-3 h-3 text-green-500 fill-current" />
          <span className="text-gray-600">{onlineMembers} online</span>
        </div>
      </div>

      {/* Quick Member List */}
      <div className="mt-3">
        <div className="text-xs text-gray-500 mb-2">Team Members</div>
        <div className="space-y-1">
          {currentTeam.members.slice(0, 3).map((member) => (
            <div key={member.id} className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                member.isOnline ? 'bg-green-500' : 'bg-gray-300'
              }`} />
              <span className="text-xs text-gray-700 truncate">
                {member.name}
                {member.id === currentUser.id ? ' (You)' : ''}
              </span>
              {getRoleIcon(member.role)}
            </div>
          ))}
          {currentTeam.members.length > 3 && (
            <div className="text-xs text-gray-500 pl-4">
              +{currentTeam.members.length - 3} more members
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
