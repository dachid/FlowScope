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
exports.BookmarksPanel = void 0;
const react_1 = __importStar(require("react"));
const lucide_react_1 = require("lucide-react");
const bookmarks_1 = require("../../store/bookmarks");
const debugger_1 = require("../../store/debugger");
const BookmarksPanel = ({ onSelectTrace, selectedTraceId }) => {
    const { bookmarks, removeBookmark, updateBookmark, searchBookmarks, getBookmarksByTag, getBookmarksBySession } = (0, bookmarks_1.useBookmarkStore)();
    const { currentSession } = (0, debugger_1.useDebuggerStore)();
    const [searchQuery, setSearchQuery] = (0, react_1.useState)('');
    const [selectedTag, setSelectedTag] = (0, react_1.useState)('');
    const [editingBookmark, setEditingBookmark] = (0, react_1.useState)(null);
    const [editForm, setEditForm] = (0, react_1.useState)({ name: '', description: '', tags: '' });
    // Get filtered bookmarks
    const filteredBookmarks = react_1.default.useMemo(() => {
        let result = bookmarks;
        // Filter by current session if active
        if (currentSession) {
            result = getBookmarksBySession(currentSession.id);
        }
        // Apply search filter
        if (searchQuery) {
            result = searchBookmarks(searchQuery);
            if (currentSession) {
                result = result.filter(b => b.sessionId === currentSession.id);
            }
        }
        // Apply tag filter
        if (selectedTag) {
            result = getBookmarksByTag(selectedTag);
            if (currentSession) {
                result = result.filter(b => b.sessionId === currentSession.id);
            }
        }
        return result.sort((a, b) => b.createdAt - a.createdAt);
    }, [bookmarks, currentSession, searchQuery, selectedTag, searchBookmarks, getBookmarksByTag, getBookmarksBySession]);
    // Get all unique tags
    const allTags = react_1.default.useMemo(() => {
        const tags = new Set();
        bookmarks.forEach(bookmark => {
            bookmark.tags.forEach(tag => tags.add(tag));
        });
        return Array.from(tags).sort();
    }, [bookmarks]);
    const handleEditBookmark = (bookmark) => {
        setEditingBookmark(bookmark.id);
        setEditForm({
            name: bookmark.name,
            description: bookmark.description || '',
            tags: bookmark.tags.join(', ')
        });
    };
    const handleSaveEdit = () => {
        if (!editingBookmark)
            return;
        const tags = editForm.tags
            .split(',')
            .map(tag => tag.trim())
            .filter(tag => tag.length > 0);
        updateBookmark(editingBookmark, {
            name: editForm.name,
            description: editForm.description || undefined,
            tags
        });
        setEditingBookmark(null);
        setEditForm({ name: '', description: '', tags: '' });
    };
    const handleCancelEdit = () => {
        setEditingBookmark(null);
        setEditForm({ name: '', description: '', tags: '' });
    };
    const getTraceTypeColor = (type) => {
        switch (type) {
            case 'prompt':
                return 'bg-blue-100 text-blue-800';
            case 'response':
                return 'bg-green-100 text-green-800';
            case 'function_call':
            case 'tool_use':
                return 'bg-purple-100 text-purple-800';
            case 'error':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };
    return (<div className="h-full flex flex-col bg-white border-r border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <lucide_react_1.Bookmark className="w-5 h-5"/>
            Bookmarks
          </h3>
          <div className="text-sm text-gray-500">
            {filteredBookmarks.length} saved
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <lucide_react_1.Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"/>
          <input type="text" placeholder="Search bookmarks..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"/>
        </div>

        {/* Tag Filter */}
        {allTags.length > 0 && (<div className="flex items-center gap-2">
            <lucide_react_1.Filter className="w-4 h-4 text-gray-400"/>
            <select value={selectedTag} onChange={(e) => setSelectedTag(e.target.value)} className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All tags</option>
              {allTags.map(tag => (<option key={tag} value={tag}>{tag}</option>))}
            </select>
          </div>)}
      </div>

      {/* Bookmarks List */}
      <div className="flex-1 overflow-y-auto">
        {filteredBookmarks.length === 0 ? (<div className="flex items-center justify-center h-64 text-gray-500">
            <div className="text-center">
              <lucide_react_1.BookmarkCheck className="w-12 h-12 text-gray-300 mx-auto mb-2"/>
              <p className="text-sm">No bookmarks found</p>
              <p className="text-xs text-gray-400">
                {searchQuery || selectedTag ? 'Try adjusting your filters' : 'Bookmark traces to save them here'}
              </p>
            </div>
          </div>) : (<div className="p-2 space-y-2">
            {filteredBookmarks.map(bookmark => (<div key={bookmark.id} className={`p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer ${selectedTraceId === bookmark.traceId ? 'bg-blue-50 border-blue-300' : ''}`} onClick={() => onSelectTrace?.(bookmark.traceId)}>
                {editingBookmark === bookmark.id ? (<div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                    <input type="text" value={editForm.name} onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))} className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Bookmark name"/>
                    <textarea value={editForm.description} onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))} className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" placeholder="Description (optional)" rows={2}/>
                    <input type="text" value={editForm.tags} onChange={(e) => setEditForm(prev => ({ ...prev, tags: e.target.value }))} className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Tags (comma separated)"/>
                    <div className="flex gap-2">
                      <button onClick={handleSaveEdit} className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors">
                        Save
                      </button>
                      <button onClick={handleCancelEdit} className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-xs hover:bg-gray-400 transition-colors">
                        Cancel
                      </button>
                    </div>
                  </div>) : (<>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {bookmark.name}
                        </h4>
                        {bookmark.description && (<p className="text-xs text-gray-500 mt-1">
                            {bookmark.description}
                          </p>)}
                      </div>
                      <div className="flex items-center gap-1 ml-2" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => handleEditBookmark(bookmark)} className="p-1 text-gray-400 hover:text-gray-600 rounded">
                          <lucide_react_1.Edit className="w-3 h-3"/>
                        </button>
                        <button onClick={() => removeBookmark(bookmark.id)} className="p-1 text-gray-400 hover:text-red-600 rounded">
                          <lucide_react_1.Trash2 className="w-3 h-3"/>
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTraceTypeColor(bookmark.traceData.type)}`}>
                        {bookmark.traceData.type.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <lucide_react_1.Clock className="w-3 h-3"/>
                        {new Date(bookmark.traceData.timestamp).toLocaleString()}
                      </span>
                    </div>

                    <p className="text-xs text-gray-600 mb-2">
                      {bookmark.traceData.preview}
                    </p>

                    {bookmark.tags.length > 0 && (<div className="flex flex-wrap gap-1">
                        {bookmark.tags.map(tag => (<span key={tag} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                            <lucide_react_1.Tag className="w-2 h-2"/>
                            {tag}
                          </span>))}
                      </div>)}

                    <div className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                      <lucide_react_1.BookmarkCheck className="w-3 h-3"/>
                      Saved {new Date(bookmark.createdAt).toLocaleDateString()}
                    </div>
                  </>)}
              </div>))}
          </div>)}
      </div>
    </div>);
};
exports.BookmarksPanel = BookmarksPanel;
