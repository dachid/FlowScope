"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeamManagement = void 0;
const react_1 = __importStar(require("react"));
const lucide_react_1 = require("lucide-react");
const teams_1 = require("../../store/teams");
const TeamManagement = ({ isOpen, onClose }) => {
    const { currentTeam, currentUser, addTeamMember, removeTeamMember, updateMemberRole } = (0, teams_1.useTeamsStore)();
    const [showAddMember, setShowAddMember] = (0, react_1.useState)(false);
    const [newMemberData, setNewMemberData] = (0, react_1.useState)({
        name: '',
        email: '',
        role: 'member'
    });
    // Confirmation dialog states
    const [confirmDelete, setConfirmDelete] = (0, react_1.useState)({ show: false });
    const [confirmRoleChange, setConfirmRoleChange] = (0, react_1.useState)({ show: false });
    const handleAddMember = () => {
        if (currentTeam && newMemberData.name && newMemberData.email) {
            addTeamMember(currentTeam.id, {
                ...newMemberData,
                isOnline: false,
                lastSeen: Date.now()
            });
            setNewMemberData({ name: '', email: '', role: 'member' });
            setShowAddMember(false);
        }
    };
    const handleDeleteMember = (memberId, memberName) => {
        setConfirmDelete({ show: true, memberId, memberName });
    };
    const confirmDeleteMember = () => {
        if (currentTeam && confirmDelete.memberId) {
            removeTeamMember(currentTeam.id, confirmDelete.memberId);
            setConfirmDelete({ show: false });
        }
    };
    const handleRoleChange = (memberId, memberName, newRole, oldRole) => {
        setConfirmRoleChange({ show: true, memberId, memberName, newRole, oldRole });
    };
    const confirmRoleChangeAction = () => {
        if (currentTeam && confirmRoleChange.memberId && confirmRoleChange.newRole) {
            updateMemberRole(currentTeam.id, confirmRoleChange.memberId, confirmRoleChange.newRole);
            setConfirmRoleChange({ show: false });
        }
    };
    const getRoleIcon = (role) => {
        switch (role) {
            case 'admin':
                return <lucide_react_1.Crown className="w-4 h-4 text-yellow-500"/>;
            case 'member':
                return <lucide_react_1.Shield className="w-4 h-4 text-blue-500"/>;
            case 'viewer':
                return <lucide_react_1.Eye className="w-4 h-4 text-gray-500"/>;
        }
    };
    const getRoleBadgeColor = (role) => {
        switch (role) {
            case 'admin':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'member':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'viewer':
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };
    const formatLastSeen = (timestamp) => {
        const now = Date.now();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        if (minutes < 1)
            return 'Just now';
        if (minutes < 60)
            return `${minutes}m ago`;
        if (hours < 24)
            return `${hours}h ago`;
        return `${days}d ago`;
    };
    if (!isOpen || !currentTeam)
        return null;
    return (<div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col shadow-xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <lucide_react_1.Users className="w-6 h-6 text-blue-600"/>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{currentTeam.name}</h2>
              <p className="text-sm text-gray-500">{currentTeam.description}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
            <lucide_react_1.X className="w-5 h-5"/>
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* Team Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <lucide_react_1.Users className="w-5 h-5 text-blue-600"/>
                <span className="text-sm font-medium text-blue-900">Team Members</span>
              </div>
              <p className="text-2xl font-bold text-blue-900 mt-1">{currentTeam.members.length}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <lucide_react_1.Circle className="w-5 h-5 text-green-600 fill-current"/>
                <span className="text-sm font-medium text-green-900">Online Now</span>
              </div>
              <p className="text-2xl font-bold text-green-900 mt-1">
                {currentTeam.members.filter(m => m.isOnline).length}
              </p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <lucide_react_1.Settings className="w-5 h-5 text-purple-600"/>
                <span className="text-sm font-medium text-purple-900">Projects</span>
              </div>
              <p className="text-2xl font-bold text-purple-900 mt-1">{currentTeam.projects.length}</p>
            </div>
          </div>

          {/* Add Member Button */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Team Members</h3>
            {currentUser?.role === 'admin' && (<button onClick={() => setShowAddMember(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <lucide_react_1.UserPlus className="w-4 h-4"/>
                Add Member
              </button>)}
          </div>

          {/* Add Member Form */}
          {showAddMember && (<div className="bg-gray-50 rounded-lg p-4 mb-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Add New Team Member</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input type="text" placeholder="Full Name" value={newMemberData.name} onChange={(e) => setNewMemberData(prev => ({ ...prev, name: e.target.value }))} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"/>
                <input type="email" placeholder="Email Address" value={newMemberData.email} onChange={(e) => setNewMemberData(prev => ({ ...prev, email: e.target.value }))} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"/>
                <select value={newMemberData.role} onChange={(e) => setNewMemberData(prev => ({ ...prev, role: e.target.value }))} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="viewer">Viewer</option>
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <button onClick={handleAddMember} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Add Member
                </button>
                <button onClick={() => setShowAddMember(false)} className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors">
                  Cancel
                </button>
              </div>
            </div>)}

          {/* Members List */}
          <div className="space-y-3">{currentTeam.members.map((member) => (<div key={member.id} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </div>
                  
                  {/* Member Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-gray-900">{member.name}</h4>
                      {member.id === currentUser?.id && (<span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">You</span>)}
                      <div className="flex items-center gap-1">
                        <div className={`w-2 h-2 rounded-full ${member.isOnline ? 'bg-green-500' : 'bg-gray-300'}`}/>
                        <span className="text-xs text-gray-500">
                          {member.isOnline ? 'Online' : formatLastSeen(member.lastSeen)}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500">{member.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Role Badge */}
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(member.role)}`}>
                    {getRoleIcon(member.role)}
                    {member.role}
                  </div>

                  {/* Actions */}
                  {currentUser?.role === 'admin' && member.id !== currentUser.id && (<div className="flex items-center gap-1">
                      <select value={member.role} onChange={(e) => handleRoleChange(member.id, member.name, e.target.value, member.role)} className="text-xs border border-gray-300 rounded px-2 py-1">
                        <option value="viewer">Viewer</option>
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                      </select>
                      <button onClick={() => handleDeleteMember(member.id, member.name)} className="p-1 text-gray-400 hover:text-red-600 transition-colors" title="Remove member">
                        <lucide_react_1.X className="w-4 h-4"/>
                      </button>
                    </div>)}
                </div>
              </div>))}
          </div>

          {/* Projects Section */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Team Projects</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {currentTeam.projects.map((project, index) => (<div key={index} className="p-3 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900">{project}</h4>
                  <p className="text-xs text-gray-500 mt-1">Active project</p>
                </div>))}
            </div>
          </div>
        </div>

        {/* Delete Member Confirmation Modal */}
        {confirmDelete.show && (<div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
            <div className="bg-white rounded-lg p-6 max-w-md mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Remove Team Member</h3>
              <p className="text-gray-600 mb-4">
                Are you sure you want to remove <strong>{confirmDelete.memberName}</strong> from the team? 
                This action cannot be undone.
              </p>
              <div className="flex items-center gap-3 justify-end">
                <button onClick={() => setConfirmDelete({ show: false })} className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors">
                  Cancel
                </button>
                <button onClick={confirmDeleteMember} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                  Remove Member
                </button>
              </div>
            </div>
          </div>)}

        {/* Role Change Confirmation Modal */}
        {confirmRoleChange.show && (<div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
            <div className="bg-white rounded-lg p-6 max-w-md mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Change Member Role</h3>
              <p className="text-gray-600 mb-4">
                Are you sure you want to change <strong>{confirmRoleChange.memberName}</strong>'s role from{' '}
                <span className="font-medium">{confirmRoleChange.oldRole}</span> to{' '}
                <span className="font-medium">{confirmRoleChange.newRole}</span>?
              </p>
              <div className="flex items-center gap-3 justify-end">
                <button onClick={() => setConfirmRoleChange({ show: false })} className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors">
                  Cancel
                </button>
                <button onClick={confirmRoleChangeAction} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Change Role
                </button>
              </div>
            </div>
          </div>)}
      </div>
    </div>);
};
exports.TeamManagement = TeamManagement;
