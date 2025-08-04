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
exports.Comments = void 0;
const react_1 = __importStar(require("react"));
const lucide_react_1 = require("lucide-react");
const teams_1 = require("../../store/teams");
const Comments = ({ traceId, sessionId, className = '' }) => {
    const { currentUser, currentTeam, addComment, updateComment, deleteComment, resolveComment, getCommentsForTrace } = (0, teams_1.useTeamsStore)();
    const [newComment, setNewComment] = (0, react_1.useState)('');
    const [commentType, setCommentType] = (0, react_1.useState)('comment');
    const [editingComment, setEditingComment] = (0, react_1.useState)(null);
    const [editContent, setEditContent] = (0, react_1.useState)('');
    const traceComments = getCommentsForTrace(traceId);
    const handleSubmitComment = () => {
        if (newComment.trim() && currentUser && currentTeam) {
            addComment({
                traceId,
                sessionId,
                userId: currentUser.id,
                content: newComment.trim(),
                type: commentType
            });
            setNewComment('');
            setCommentType('comment');
        }
    };
    const handleEditComment = (comment) => {
        setEditingComment(comment.id);
        setEditContent(comment.content);
    };
    const handleSaveEdit = (commentId) => {
        if (editContent.trim()) {
            updateComment(commentId, editContent.trim());
            setEditingComment(null);
            setEditContent('');
        }
    };
    const handleCancelEdit = () => {
        setEditingComment(null);
        setEditContent('');
    };
    const getCommentIcon = (type) => {
        switch (type) {
            case 'issue':
                return <lucide_react_1.AlertTriangle className="w-4 h-4 text-red-500"/>;
            case 'question':
                return <lucide_react_1.HelpCircle className="w-4 h-4 text-blue-500"/>;
            case 'praise':
                return <lucide_react_1.Heart className="w-4 h-4 text-pink-500"/>;
            default:
                return <lucide_react_1.MessageCircle className="w-4 h-4 text-gray-500"/>;
        }
    };
    const getCommentTypeColor = (type) => {
        switch (type) {
            case 'issue':
                return 'border-l-red-500 bg-red-50';
            case 'question':
                return 'border-l-blue-500 bg-blue-50';
            case 'praise':
                return 'border-l-pink-500 bg-pink-50';
            default:
                return 'border-l-gray-300 bg-gray-50';
        }
    };
    const getTeamMemberName = (userId) => {
        const member = currentTeam?.members.find(m => m.id === userId);
        return member?.name || 'Unknown User';
    };
    const formatTimestamp = (timestamp) => {
        const now = Date.now();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        if (minutes < 1)
            return 'Just now';
        if (minutes < 60)
            return `${minutes}m ago`;
        if (hours < 24)
            return `${hours}h ago`;
        return new Date(timestamp).toLocaleDateString();
    };
    if (!currentUser || !currentTeam) {
        return (<div className={`${className}`}>
        <div className="text-center py-8 text-gray-500">
          <lucide_react_1.MessageCircle className="w-8 h-8 mx-auto mb-2 text-gray-400"/>
          <p className="text-sm">Join a team to view and add comments</p>
        </div>
      </div>);
    }
    return (<div className={`${className}`}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <lucide_react_1.MessageCircle className="w-5 h-5 text-gray-600"/>
        <h3 className="font-medium text-gray-900">
          Comments ({traceComments.length})
        </h3>
      </div>

      {/* Comments List */}
      <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
        {traceComments.length === 0 ? (<div className="text-center py-6 text-gray-500">
            <lucide_react_1.MessageCircle className="w-6 h-6 mx-auto mb-2 text-gray-400"/>
            <p className="text-sm">No comments yet. Be the first to comment!</p>
          </div>) : (traceComments.map((comment) => (<div key={comment.id} className={`border-l-4 pl-4 py-3 rounded-r-lg ${getCommentTypeColor(comment.type)} ${comment.isResolved ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 mb-2">
                  {getCommentIcon(comment.type)}
                  <span className="font-medium text-sm text-gray-900">
                    {getTeamMemberName(comment.userId)}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatTimestamp(comment.timestamp)}
                  </span>
                  {comment.type !== 'comment' && (<span className="text-xs px-2 py-1 bg-white rounded-full capitalize font-medium">
                      {comment.type}
                    </span>)}
                  {comment.isResolved && (<span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full flex items-center gap-1">
                      <lucide_react_1.Check className="w-3 h-3"/>
                      Resolved
                    </span>)}
                </div>

                {/* Comment Actions */}
                {(currentUser.id === comment.userId || currentUser.role === 'admin') && (<div className="flex items-center gap-1">
                    {comment.type === 'issue' && (<button onClick={() => resolveComment(comment.id)} className="p-1 text-gray-400 hover:text-green-600 transition-colors" title={comment.isResolved ? 'Mark as unresolved' : 'Mark as resolved'}>
                        <lucide_react_1.Check className="w-4 h-4"/>
                      </button>)}
                    <button onClick={() => handleEditComment(comment)} className="p-1 text-gray-400 hover:text-blue-600 transition-colors" title="Edit comment">
                      <lucide_react_1.Edit className="w-4 h-4"/>
                    </button>
                    <button onClick={() => deleteComment(comment.id)} className="p-1 text-gray-400 hover:text-red-600 transition-colors" title="Delete comment">
                      <lucide_react_1.Trash2 className="w-4 h-4"/>
                    </button>
                  </div>)}
              </div>

              {/* Comment Content */}
              {editingComment === comment.id ? (<div className="space-y-2">
                  <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" rows={2} placeholder="Edit your comment..."/>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleSaveEdit(comment.id)} className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors">
                      Save
                    </button>
                    <button onClick={handleCancelEdit} className="px-3 py-1 text-gray-600 hover:text-gray-800 transition-colors text-sm">
                      Cancel
                    </button>
                  </div>
                </div>) : (<p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.content}</p>)}
            </div>)))}
      </div>

      {/* Add Comment Form */}
      <div className="border-t border-gray-200 pt-4">
        <div className="flex items-center gap-2 mb-2">
          <select value={commentType} onChange={(e) => setCommentType(e.target.value)} className="text-xs border border-gray-300 rounded px-2 py-1">
            <option value="comment">Comment</option>
            <option value="question">Question</option>
            <option value="issue">Issue</option>
            <option value="praise">Praise</option>
          </select>
        </div>

        <div className="flex gap-2">
          <textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Add a comment..." className="flex-1 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" rows={3} onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                handleSubmitComment();
            }
        }}/>
          <button onClick={handleSubmitComment} disabled={!newComment.trim()} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2">
            <lucide_react_1.Send className="w-4 h-4"/>
            Send
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Press Ctrl+Enter to send quickly
        </p>
      </div>
    </div>);
};
exports.Comments = Comments;
