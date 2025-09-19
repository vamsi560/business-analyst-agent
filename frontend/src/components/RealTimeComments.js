import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, Send, MoreVertical, Edit3, Trash2, 
  Reply, ThumbsUp, ThumbsDown, Flag, User, Clock,
  CheckCircle, AlertCircle, Eye, EyeOff, Lock, Unlock
} from 'lucide-react';

const RealTimeComments = ({ 
  documentId,
  documentTitle,
  currentUser = { id: 'user1', name: 'Current User', avatar: null },
  onCommentAdd,
  onCommentUpdate,
  onCommentDelete,
  onCommentReply,
  showComments = true,
  allowAnonymous = false,
  moderationEnabled = false
}) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingComment, setEditingComment] = useState(null);
  const [showResolved, setShowResolved] = useState(false);
  const [sortBy, setSortBy] = useState('newest'); // newest, oldest, most-liked
  const [filterBy, setFilterBy] = useState('all'); // all, unresolved, resolved, my-comments
  const [isLoading, setIsLoading] = useState(false);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const commentsEndRef = useRef(null);


  // Load comments
  useEffect(() => {
    loadComments();
  }, [documentId]);

  const loadComments = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/comments/${documentId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const commentsData = await response.json();
        setComments(commentsData);
      } else {
        console.error('Failed to load comments');
        setComments([]);
      }
    } catch (error) {
      console.error('Error loading comments:', error);
      setComments([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Add new comment
  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      const response = await fetch(`/api/comments/${documentId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newComment.trim(),
          mentions: extractMentions(newComment),
          tags: extractTags(newComment),
          position: { line: null, section: 'General' }
        })
      });

      if (response.ok) {
        const newCommentData = await response.json();
        setComments(prev => [newCommentData, ...prev]);
        setNewComment('');
        setShowCommentForm(false);

        if (onCommentAdd) {
          onCommentAdd(newCommentData);
        }

        // Scroll to new comment
        setTimeout(() => {
          commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } else {
        console.error('Failed to add comment');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  // Add reply to comment
  const handleAddReply = async (parentCommentId, replyContent) => {
    if (!replyContent.trim()) return;

    try {
      const response = await fetch(`/api/comments/${documentId}/${parentCommentId}/replies`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: replyContent.trim()
        })
      });

      if (response.ok) {
        const newReply = await response.json();
        setComments(prev => 
          prev.map(comment => 
            comment.id === parentCommentId
              ? { ...comment, replies: [...comment.replies, newReply] }
              : comment
          )
        );

        setReplyingTo(null);

        if (onCommentReply) {
          onCommentReply(parentCommentId, newReply);
        }
      } else {
        console.error('Failed to add reply');
      }
    } catch (error) {
      console.error('Error adding reply:', error);
    }
  };

  // Update comment
  const handleUpdateComment = async (commentId, newContent) => {
    try {
      const response = await fetch(`/api/comments/${documentId}/${commentId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newContent
        })
      });

      if (response.ok) {
        const updatedComment = await response.json();
        setComments(prev => 
          prev.map(comment => 
            comment.id === commentId ? updatedComment : comment
          )
        );

        setEditingComment(null);

        if (onCommentUpdate) {
          onCommentUpdate(commentId, newContent);
        }
      } else {
        console.error('Failed to update comment');
      }
    } catch (error) {
      console.error('Error updating comment:', error);
    }
  };

  // Delete comment
  const handleDeleteComment = async (commentId) => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      try {
        const response = await fetch(`/api/comments/${documentId}/${commentId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          }
        });

        if (response.ok) {
          setComments(prev => prev.filter(comment => comment.id !== commentId));

          if (onCommentDelete) {
            onCommentDelete(commentId);
          }
        } else {
          console.error('Failed to delete comment');
        }
      } catch (error) {
        console.error('Error deleting comment:', error);
      }
    }
  };

  // Toggle comment resolution
  const handleToggleResolution = async (commentId) => {
    try {
      const response = await fetch(`/api/comments/${documentId}/${commentId}/resolve`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const updatedComment = await response.json();
        setComments(prev => 
          prev.map(comment => 
            comment.id === commentId ? updatedComment : comment
          )
        );
      } else {
        console.error('Failed to toggle comment resolution');
      }
    } catch (error) {
      console.error('Error toggling comment resolution:', error);
    }
  };

  // Like/dislike comment
  const handleLikeComment = async (commentId, isLike) => {
    try {
      const response = await fetch(`/api/comments/${documentId}/${commentId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isLike: isLike
        })
      });

      if (response.ok) {
        const updatedComment = await response.json();
        setComments(prev => 
          prev.map(comment => 
            comment.id === commentId ? updatedComment : comment
          )
        );
      } else {
        console.error('Failed to like/dislike comment');
      }
    } catch (error) {
      console.error('Error liking/disliking comment:', error);
    }
  };

  // Extract mentions from text (@username)
  const extractMentions = (text) => {
    const mentionRegex = /@(\w+)/g;
    const mentions = [];
    let match;
    while ((match = mentionRegex.exec(text)) !== null) {
      mentions.push(match[1]);
    }
    return mentions;
  };

  // Extract tags from text (#tag)
  const extractTags = (text) => {
    const tagRegex = /#(\w+)/g;
    const tags = [];
    let match;
    while ((match = tagRegex.exec(text)) !== null) {
      tags.push(match[1]);
    }
    return tags;
  };

  // Format time ago
  const formatTimeAgo = (date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  // Filter and sort comments
  const getFilteredAndSortedComments = () => {
    let filtered = comments;

    // Filter by status
    if (filterBy === 'unresolved') {
      filtered = filtered.filter(comment => !comment.resolved);
    } else if (filterBy === 'resolved') {
      filtered = filtered.filter(comment => comment.resolved);
    } else if (filterBy === 'my-comments') {
      filtered = filtered.filter(comment => comment.author.id === currentUser.id);
    }

    // Filter by resolved status
    if (!showResolved) {
      filtered = filtered.filter(comment => !comment.resolved);
    }

    // Sort comments
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'most-liked':
          return (b.likes - b.dislikes) - (a.likes - a.dislikes);
        case 'newest':
        default:
          return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });

    return filtered;
  };

  const filteredComments = getFilteredAndSortedComments();
  const unresolvedCount = comments.filter(c => !c.resolved).length;
  const totalComments = comments.length;

  if (!showComments) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MessageSquare className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Comments & Collaboration</h3>
              <p className="text-sm text-gray-500">
                {totalComments} comment{totalComments !== 1 ? 's' : ''} • {unresolvedCount} unresolved
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCommentForm(!showCommentForm)}
              className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              Add Comment
            </button>
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="flex items-center gap-4 mt-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="most-liked">Most Liked</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Filter:</label>
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value)}
              className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All</option>
              <option value="unresolved">Unresolved</option>
              <option value="resolved">Resolved</option>
              <option value="my-comments">My Comments</option>
            </select>
          </div>
          
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={showResolved}
              onChange={(e) => setShowResolved(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Show resolved
          </label>
        </div>
      </div>

      {/* Comment Form */}
      {showCommentForm && (
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="space-y-3">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment... Use @username to mention someone, #tag for tags"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={3}
            />
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-500">
                Tip: Use @username to mention someone, #tag for categorization
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowCommentForm(false)}
                  className="px-3 py-1 text-gray-600 hover:text-gray-800 text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Post Comment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Comments List */}
      <div className="max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredComments.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">No comments yet</h4>
            <p className="text-gray-500">Be the first to add a comment and start the discussion.</p>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {filteredComments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                currentUser={currentUser}
                onReply={handleAddReply}
                onUpdate={handleUpdateComment}
                onDelete={handleDeleteComment}
                onToggleResolution={handleToggleResolution}
                onLike={handleLikeComment}
                formatTimeAgo={formatTimeAgo}
                editingComment={editingComment}
                setEditingComment={setEditingComment}
                replyingTo={replyingTo}
                setReplyingTo={setReplyingTo}
              />
            ))}
            <div ref={commentsEndRef} />
          </div>
        )}
      </div>
    </div>
  );
};

// Individual Comment Component
const CommentItem = ({
  comment,
  currentUser,
  onReply,
  onUpdate,
  onDelete,
  onToggleResolution,
  onLike,
  formatTimeAgo,
  editingComment,
  setEditingComment,
  replyingTo,
  setReplyingTo
}) => {
  const [replyContent, setReplyContent] = useState('');
  const [editContent, setEditContent] = useState(comment.content);
  const [showReplies, setShowReplies] = useState(true);

  const isAuthor = comment.author.id === currentUser.id;
  const isEditing = editingComment === comment.id;
  const isReplying = replyingTo === comment.id;

  const handleReply = () => {
    if (replyContent.trim()) {
      onReply(comment.id, replyContent);
      setReplyContent('');
    }
  };

  const handleUpdate = () => {
    if (editContent.trim() && editContent !== comment.content) {
      onUpdate(comment.id, editContent);
    }
    setEditingComment(null);
  };

  const handleCancelEdit = () => {
    setEditContent(comment.content);
    setEditingComment(null);
  };

  return (
    <div className={`border rounded-lg p-4 ${comment.resolved ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}>
      {/* Comment Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">{comment.author.name}</span>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                {comment.author.role}
              </span>
              {comment.resolved && (
                <CheckCircle className="w-4 h-4 text-green-600" />
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Clock className="w-3 h-3" />
              <span>{formatTimeAgo(comment.createdAt)}</span>
              {comment.updatedAt > comment.createdAt && (
                <span>(edited)</span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          {isAuthor && (
            <>
              <button
                onClick={() => setEditingComment(comment.id)}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                title="Edit comment"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete(comment.id)}
                className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                title="Delete comment"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
          <button
            onClick={() => onToggleResolution(comment.id)}
            className={`p-1 transition-colors ${
              comment.resolved 
                ? 'text-green-600 hover:text-green-700' 
                : 'text-gray-400 hover:text-green-600'
            }`}
            title={comment.resolved ? 'Mark as unresolved' : 'Mark as resolved'}
          >
            {comment.resolved ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Comment Content */}
      <div className="mb-3">
        {isEditing ? (
          <div className="space-y-2">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={3}
            />
            <div className="flex items-center gap-2">
              <button
                onClick={handleUpdate}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
              >
                Save
              </button>
              <button
                onClick={handleCancelEdit}
                className="px-3 py-1 text-gray-600 hover:text-gray-800 text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="text-gray-800 leading-relaxed">{comment.content}</p>
        )}
      </div>

      {/* Comment Tags and Mentions */}
      {(comment.tags.length > 0 || comment.mentions.length > 0) && (
        <div className="flex items-center gap-2 mb-3">
          {comment.tags.map((tag, index) => (
            <span key={index} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
              #{tag}
            </span>
          ))}
          {comment.mentions.map((mention, index) => (
            <span key={index} className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
              @{mention}
            </span>
          ))}
        </div>
      )}

      {/* Comment Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => onLike(comment.id, true)}
            className="flex items-center gap-1 text-gray-500 hover:text-blue-600 transition-colors"
          >
            <ThumbsUp className="w-4 h-4" />
            <span className="text-sm">{comment.likes}</span>
          </button>
          <button
            onClick={() => onLike(comment.id, false)}
            className="flex items-center gap-1 text-gray-500 hover:text-red-600 transition-colors"
          >
            <ThumbsDown className="w-4 h-4" />
            <span className="text-sm">{comment.dislikes}</span>
          </button>
          <button
            onClick={() => setReplyingTo(comment.id)}
            className="flex items-center gap-1 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <Reply className="w-4 h-4" />
            <span className="text-sm">Reply</span>
          </button>
        </div>
        
        {comment.position.section && (
          <div className="text-xs text-gray-500">
            {comment.position.section}
            {comment.position.line && ` • Line ${comment.position.line}`}
          </div>
        )}
      </div>

      {/* Reply Form */}
      {isReplying && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="space-y-2">
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Write a reply..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={2}
            />
            <div className="flex items-center gap-2">
              <button
                onClick={handleReply}
                disabled={!replyContent.trim()}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Reply
              </button>
              <button
                onClick={() => setReplyingTo(null)}
                className="px-3 py-1 text-gray-600 hover:text-gray-800 text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Replies */}
      {comment.replies.length > 0 && (
        <div className="mt-4">
          <button
            onClick={() => setShowReplies(!showReplies)}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 transition-colors mb-3"
          >
            {showReplies ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {comment.replies.length} repl{comment.replies.length !== 1 ? 'ies' : 'y'}
          </button>
          
          {showReplies && (
            <div className="space-y-3 ml-6 pl-4 border-l-2 border-gray-200">
              {comment.replies.map((reply) => (
                <div key={reply.id} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                      <User className="w-3 h-3 text-gray-600" />
                    </div>
                    <span className="font-medium text-gray-900 text-sm">{reply.author.name}</span>
                    <span className="text-xs text-gray-500">{formatTimeAgo(reply.createdAt)}</span>
                  </div>
                  <p className="text-gray-800 text-sm">{reply.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RealTimeComments;

