"use client";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { X, FileText, User, Building2, Check, AlertTriangle, Pause, Eye, Download, MessageCircle, Send, MoreVertical, Edit, Trash2, Reply, Heart, Flag } from "lucide-react";

// Interface updated to include the new is_public field
interface FormData {
  title: string;
  researcher: string;
  category: string;
  institute: string;
  status: string;
  progress_status: string;
  school: string;
  year: string;
  abstract: string;
  document: string;
  document_type: string;
  hashed_id: string;
  is_public: boolean;
  created_at: string;
}

// Comment interface
interface Comment {
  id: number;
  content: string;
  user_id: number;
  research_id: number;
  parent_id?: number;
  identifier: string;
  created_at: string;
  updated_at: string;
  is_edited: boolean;
  is_deleted: boolean;
  first_name?: string;
  last_name?: string;
  user_email?: string;
}

const buttons = [
  { name: "overview", icon: Eye },
  { name: "details", icon: FileText },
  { name: "comments", icon: MessageCircle },
];

interface ViewResearchProps {
  ResearchId: string;
  onClose: () => void;
  sessionId?: string;
}

function formatDate(dateString: any) {
  const date = new Date(dateString);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  
  const year = date.getFullYear();
  const month = months[date.getMonth()];
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  
  return `${month}, ${day} ${year} ${hours}:${minutes}:${seconds}`;
}

function truncateText(text: string, maxLength: number) {
  if (text.length > maxLength) {
    return text.slice(0, maxLength) + "...";
  }
  return text;
}

const ViewResearch: React.FC<ViewResearchProps> = ({ ResearchId, onClose }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [research, setResearch] = useState<FormData | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Comment-related state
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [postingComment, setPostingComment] = useState(false);
  
  // Comment action states
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [editingComment, setEditingComment] = useState(false);
  const [replyingToId, setReplyingToId] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [postingReply, setPostingReply] = useState(false);
  const [showActionsId, setShowActionsId] = useState<number | null>(null);
  const [deletingComment, setDeletingComment] = useState<number | null>(null);
  const [likingComment, setLikingComment] = useState<number | null>(null);

  // Action loading states
  const [approvingResearch, setApprovingResearch] = useState(false);
  const [rejectingResearch, setRejectingResearch] = useState(false);
  const [holdingResearch, setHoldingResearch] = useState(false);
  const [reviewingResearch, setReviewingResearch] = useState(false);

  const [sessionId, setSessionId] = useState<string | null>(null);

  // Ref to handle click outside for dropdowns
  const dropdownRef = useRef<HTMLDivElement>(null);

  //session fetching
  useEffect(() => {
    const fetchSession = async () => {
      try {
       const userSession = JSON.parse(localStorage.getItem("supervisorSession") || "{}");
        setSessionId(userSession.id);
      } catch (error) {
        setError("An error occurred while fetching session.");
      }
    };
    fetchSession();
  }, [ResearchId, newComment]);

  // Clear messages after 10 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  // Handle click outside to close dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowActionsId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch Research
  useEffect(() => {
    const fetchResearch = async () => {
      setLoading(true);
      try {
        // Get supervisor session for access control
        const userSession = JSON.parse(localStorage.getItem("supervisorSession") || "{}");
        const response = await fetch(`/api/research/view`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ 
            id: ResearchId,
            supervisor_id: userSession.id 
          }),
        });
        if (!response.ok) throw new Error("Failed to fetch research");
        const data = await response.json();
        setResearch(data);
      } catch (error) {
        setError("An error occurred while fetching research.");
      } finally {
        setLoading(false);
      }
    };
    fetchResearch();
  }, [ResearchId]);

  // Fetch Comments when comments tab is active
  useEffect(() => {
    if (activeTab === 2 && research) {
      fetchComments();
    }
  }, [activeTab, research]);
 
  // Set abstract content in DOM
  useEffect(() => {
    if (typeof window !== "undefined") {
      const abstract = document.getElementById("abstract") as HTMLDivElement;
      if (abstract && research?.abstract) {
        abstract.innerHTML = research.abstract;
      }
    }
  }, [research]);

  // Fetch comments function
  const fetchComments = async () => {
    if (!research || !sessionId) return;
    
    setCommentsLoading(true);
    try {
      const response = await fetch(`/api/research/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ 
          session_id: sessionId,
          research_id: research.hashed_id 
        }),
      });
      
      if (!response.ok) throw new Error("Failed to fetch comments");
      const data = await response.json();
      setComments(data);
    } catch (error) {
      setError("Failed to fetch comments.");
    } finally {
      setCommentsLoading(false);
    }
  };

  // Post new comment
  const handlePostComment = async () => {
   
    if (!newComment.trim() || !research || !sessionId) return;
    
    setPostingComment(true);
    try {
      const response = await fetch(`/api/add/comment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          content: newComment.trim(),
          session_id: sessionId,
          research_id: research.hashed_id,
          identifier: sessionId
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to post comment");
      }

      setNewComment("");
      setSuccess("Comment posted successfully!");
      await fetchComments();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to post comment.");
    } finally {
      setPostingComment(false);
    }
  };

  // Edit comment
  const handleEditComment = async (commentId: number, newContent: string) => {
    if (!newContent.trim() || !sessionId) return;

    setEditingComment(true);
    try {
      const response = await fetch(`/api/research/comments/manage`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          comment_id: commentId,
          content: newContent.trim(),
          session_id: sessionId,
        }),
      });

      if (!response.ok) throw new Error("Failed to edit comment");

      setEditingCommentId(null);
      setEditingContent("");
      setSuccess("Comment updated successfully!");
      await fetchComments();
    } catch (error) {
      setError("Failed to edit comment.");
    } finally {
      setEditingComment(false);
    }
  };

  // Delete comment
  const handleDeleteComment = async (commentId: number) => {
    if (!sessionId) return;

    setDeletingComment(commentId);
    try {
      const response = await fetch(`/api/research/comments/manage`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          comment_id: commentId,
          session_id: sessionId,
        }),
      });

      if (!response.ok) throw new Error("Failed to delete comment");

      setSuccess("Comment deleted successfully!");
      await fetchComments();
    } catch (error) {
      setError("Failed to delete comment.");
    } finally {
      setDeletingComment(null);
      setShowActionsId(null);
    }
  };

  // Reply to comment
  const handleReplyToComment = async (parentId: number) => {
    if (!replyContent.trim() || !research || !sessionId) return;

    setPostingReply(true);
    try {
      const response = await fetch(`/api/add/comment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          content: replyContent.trim(),
          session_id: sessionId,
          research_id: research.hashed_id,
          parent_id: parentId,
          identifier: sessionId,
        }),
      });

      if (!response.ok) throw new Error("Failed to post reply");

      setReplyingToId(null);
      setReplyContent("");
      setSuccess("Reply posted successfully!");
      await fetchComments();
    } catch (error) {
      setError("Failed to post reply.");
    } finally {
      setPostingReply(false);
    }
  };

  const startEdit = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditingContent(comment.content);
    setShowActionsId(null);
  };

  const startReply = (commentId: number) => {
    setReplyingToId(commentId);
    setShowActionsId(null);
  };

  // Research action handlers with loading states
  const handleApprove = async (id: any) => {
    setApprovingResearch(true);
    try {
      const response = await fetch(`/api/research/approve`, {
        method: 'PUT',
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ id: id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to approve");
      }
      
      setSuccess("Request approved!");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to approve research.");
    } finally {
      setApprovingResearch(false);
    }
  };

  const handleReject = async (id: any) => {
    setRejectingResearch(true);
    try {
      const response = await fetch(`/api/research/reject`, {
        method: 'PUT',
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ id: id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to reject");
      }
      
      setSuccess("Request rejected!");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to reject research.");
    } finally {
      setRejectingResearch(false);
    }
  };

  const handleReview = async (id: any) => {
    setReviewingResearch(true);
    try {
      const response = await fetch(`/api/research/review`, {
        method: 'PUT',
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ id: id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to review");
      }
      
      setSuccess("Request under review!");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to put under review.");
    } finally {
      setReviewingResearch(false);
    }
  };

  const handleHold = async (id: any) => {
    setHoldingResearch(true);
    try {
      const response = await fetch(`/api/research/hold`, {
        method: 'PUT',
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ id: id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to hold");
      }
      
      setSuccess("Request put on hold!");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to put on hold.");
    } finally {
      setHoldingResearch(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved': return 'bg-blue-500 text-white';
      case 'under review': return 'bg-amber-500 text-white';
      case 'rejected': return 'bg-orange-500 text-white';
      case 'on hold': return 'bg-teal-500 text-white';
      default: return 'bg-slate-500 text-white';
    }
  };

  const handleAction = (action: string) => {
    if (action === 'approve') handleApprove(research?.hashed_id);
    if (action === 'reject') handleReject(research?.hashed_id);
    if (action === 'hold') handleHold(research?.hashed_id);
    if (action === 'review' && research?.status.toLocaleLowerCase() === 'pending') handleReview(research?.hashed_id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-400 backdrop-blur-sm bg-opacity-40"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-4xl bg-white rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        
        {/* Header */}
        <div className="relative bg-slate-700 p-6">
          <button
            onClick={() => {onClose(); handleAction("review")}}
            className="absolute top-4 right-4 p-1.5 text-teal-50 hover:text-white hover:bg-teal-500 rounded-full transition-all"
          >
            <X size={20} />
          </button>
          
          <div className="pr-12">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="text-slate-300" size={18} />
              <span className="text-slate-300 text-xs font-medium uppercase tracking-wider">Research Paper</span>
            </div>
            <h1 className="text-xl font-bold text-white leading-tight mb-3">
              {research?.title}
            </h1>
            <div className="flex items-center gap-4 text-slate-300 text-sm">
              <span className="flex items-center gap-1">
                <User size={14} />
                {research?.researcher}
              </span>
              <span className="flex items-center gap-1">
                <Building2 size={14} />
                {research?.institute}
              </span>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="bg-green-100 border-l-4 border-green-300 p-3">
            <div className="flex items-center gap-2 text-green-500 text-sm">
              <Check size={16} />
              {success}
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border-l-4 border-red-300 p-3">
            <div className="flex items-center gap-2 text-red-500 text-sm">
              <AlertTriangle size={16} />
              {error}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="bg-slate-50 border-b px-6">
          <div className="flex space-x-6">
            {buttons.map((button, index) => {
              const Icon = button.icon;
              return (
                <button
                  key={index}
                  onClick={() => setActiveTab(index)}
                  className={`flex items-center gap-2 py-3 text-sm font-medium capitalize transition-colors border-b-2 ${
                    activeTab === index
                      ? 'border-teal-500 text-teal-600'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Icon size={16} />
                  {button.name}
                  {button.name === 'comments' && comments.length > 0 && (
                    <span className="bg-teal-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[1.2rem] text-center">
                      {comments.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex h-96">
          {/* Main Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {activeTab === 0 && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-slate-800 mb-2">Abstract</h3>
                  <div 
                    className="text-slate-700 text-sm leading-relaxed bg-slate-50 p-4 rounded-lg"
                    id="abstract"
                  ></div>
                </div>
                
                <div>
                  <h3 className="font-semibold text-slate-800 mb-2">Document</h3>
                  {research?.is_public ? (
                    <div className="flex items-center gap-3 p-3 bg-teal-50 rounded-lg border border-teal-200">
                      <FileText className="text-teal-600" size={20} />
                      <div className="flex-1">
                        <Link 
                          href={research?.document ?? ""} 
                          className="text-sm font-medium text-teal-900 hover:underline" 
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          {truncateText(research?.document ?? "", 60)}
                        </Link>
                        <p className="text-xs text-teal-600">{research?.document_type}</p>
                      </div>
                      <button className="p-2 text-teal-600 hover:bg-teal-100 rounded-lg transition-colors">
                        <Download size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <FileText className="text-gray-400" size={20} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-600">This research is private</p>
                        <p className="text-xs text-gray-500">Document not available for public view</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 1 && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-slate-800 mb-3">Research Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-slate-500 uppercase tracking-wide">Category</label>
                        <p className="text-sm font-medium text-slate-700">{research?.category}</p>
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 uppercase tracking-wide">Year</label>
                        <p className="text-sm font-medium text-slate-700">{research?.year}</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-slate-500 uppercase tracking-wide">School</label>
                        <p className="text-sm font-medium text-slate-700">{research?.school}</p>
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 uppercase tracking-wide">Uploaded</label>
                        <p className="text-sm font-medium text-slate-700">{formatDate(research?.created_at)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Enhanced Comments Tab */}
            {activeTab === 2 && (
              <div className="space-y-4 h-full flex flex-col">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-slate-800">Comments</h3>
                  <span className="text-xs text-slate-500">{comments.length} comment{comments.length !== 1 ? 's' : ''}</span>
                </div>

                {/* Add Comment Form */}
                <div className="bg-slate-50 p-4 rounded-lg border">
                  <div className="space-y-3">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment as supervisor..."
                      className="w-full p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                      rows={3}
                      disabled={postingComment}
                    />
                    <div className="flex justify-end">
                      <button
                        onClick={handlePostComment}
                        disabled={!newComment.trim() || postingComment}
                        className="flex items-center gap-2 px-4 py-2 bg-teal-500 hover:bg-teal-600 disabled:bg-slate-300 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        {postingComment ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        ) : (
                          <Send size={16} />
                        )}
                        {postingComment ? 'Posting...' : 'Post Comment'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Comments List */}
                <div className="flex-1 space-y-3 overflow-y-auto">
                  {commentsLoading ? (
                    <div className="flex items-center justify-center h-32">
                      <div className="animate-spin rounded-full h-6 w-6 border-2 border-teal-500 border-t-transparent"></div>
                    </div>
                  ) : comments.length === 0 ? (
                    <div className="text-center text-slate-500 py-8">
                      <MessageCircle size={32} className="mx-auto mb-2 text-slate-300" />
                      <p className="text-sm">No comments yet</p>
                      <p className="text-xs mt-1">Be the first to comment on this research</p>
                    </div>
                  ) : (
                    comments
                      .filter(comment => !comment.parent_id)
                      .map((comment) => (
                        <div key={comment.id} className="bg-white rounded-lg border">
                          <div className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 bg-teal-100 rounded-full flex items-center justify-center">
                                  <User size={14} className="text-teal-600" />
                                </div>
                                <span className="text-sm font-medium text-slate-700">
                                  {comment.first_name ? `${comment.first_name} ${comment.last_name}` : `${research?.researcher}`}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-500">
                                  {formatDate(comment.created_at)}
                                  {comment.is_edited && <span className="ml-1">(edited)</span>}
                                </span>
                                {/* Actions Dropdown */}
                                <div className="relative" ref={dropdownRef}>
                                  <button
                                    onClick={() => setShowActionsId(showActionsId === comment.id ? null : comment.id)}
                                    className="p-1 hover:bg-slate-100 rounded transition-colors"
                                  >
                                    <MoreVertical size={14} className="text-slate-400" />
                                  </button>
                                  {showActionsId === comment.id && (
                                    <div className="absolute right-0 top-6 bg-white rounded-lg shadow-lg border py-1 z-10 min-w-[120px]">
                                      <button
                                        onClick={() => startReply(comment.id)}
                                        className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                      >
                                        <Reply size={14} />
                                        Reply
                                      </button>
                                      <button
                                        onClick={() => startEdit(comment)}
                                        className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                      >
                                        <Edit size={14} />
                                        Edit
                                      </button>
                                      <button
                                        onClick={() => handleDeleteComment(comment.id)}
                                        disabled={deletingComment === comment.id}
                                        className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 disabled:opacity-50"
                                      >
                                        {deletingComment === comment.id ? (
                                          <div className="animate-spin rounded-full h-3 w-3 border border-red-600 border-t-transparent"></div>
                                        ) : (
                                          <Trash2 size={14} />
                                        )}
                                        {deletingComment === comment.id ? 'Deleting...' : 'Delete'}
                                      </button>
                                      <hr className="my-1" />
                                      <button
                                        onClick={() => setShowActionsId(null)}
                                        className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                      >
                                        <Flag size={14} />
                                        Report
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Comment Content */}
                            <div className="ml-8">
                              {editingCommentId === comment.id ? (
                                <div className="space-y-2">
                                  <textarea
                                    value={editingContent}
                                    onChange={(e) => setEditingContent(e.target.value)}
                                    className="w-full p-2 border rounded resize-none focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                                    rows={2}
                                    disabled={editingComment}
                                  />
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => handleEditComment(comment.id, editingContent)}
                                      disabled={editingComment || !editingContent.trim()}
                                      className="flex items-center gap-1 px-3 py-1 bg-teal-500 text-white text-xs rounded hover:bg-teal-600 disabled:opacity-50"
                                    >
                                      {editingComment ? (
                                        <>
                                          <div className="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent"></div>
                                          Saving...
                                        </>
                                      ) : (
                                        'Save'
                                      )}
                                    </button>
                                    <button
                                      onClick={() => {
                                        setEditingCommentId(null);
                                        setEditingContent("");
                                      }}
                                      disabled={editingComment}
                                      className="px-3 py-1 bg-slate-300 text-slate-700 text-xs rounded hover:bg-slate-400 disabled:opacity-50"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-sm text-slate-700 leading-relaxed">
                                  {comment.is_deleted ? (
                                    <em className="text-slate-400">This comment has been deleted</em>
                                  ) : (
                                    comment.content
                                  )}
                                </div>
                              )}

                              {/* Reply Form */}
                              {replyingToId === comment.id && (
                                <div className="mt-3 space-y-2">
                                  <textarea
                                    value={replyContent}
                                    onChange={(e) => setReplyContent(e.target.value)}
                                    placeholder={`Reply to ${comment.first_name || 'user'}...`}
                                    className="w-full p-2 border rounded resize-none focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                                    rows={2}
                                    disabled={postingReply}
                                  />
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => handleReplyToComment(comment.id)}
                                      disabled={postingReply || !replyContent.trim()}
                                      className="flex items-center gap-1 px-3 py-1 bg-teal-500 text-white text-xs rounded hover:bg-teal-600 disabled:opacity-50"
                                    >
                                      {postingReply ? (
                                        <>
                                          <div className="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent"></div>
                                          Replying...
                                        </>
                                      ) : (
                                        'Reply'
                                      )}
                                    </button>
                                    <button
                                      onClick={() => {
                                        setReplyingToId(null);
                                        setReplyContent("");
                                      }}
                                      disabled={postingReply}
                                      className="px-3 py-1 bg-slate-300 text-slate-700 text-xs rounded hover:bg-slate-400 disabled:opacity-50"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              )}

                              {/* Action Buttons */}
                              <div className="flex items-center gap-3 mt-2 text-xs">
                                <button 
                                  onClick={() => startReply(comment.id)}
                                  className="text-slate-500 hover:text-teal-600 flex items-center gap-1"
                                >
                                  <Reply size={12} />
                                  Reply
                                </button>
                                <button 
                                  onClick={() => setLikingComment(comment.id)}
                                  disabled={likingComment === comment.id}
                                  className="text-slate-500 hover:text-red-500 flex items-center gap-1 disabled:opacity-50"
                                >
                                  {likingComment === comment.id ? (
                                    <div className="animate-spin rounded-full h-3 w-3 border border-red-500 border-t-transparent"></div>
                                  ) : (
                                    <Heart size={12} />
                                  )}
                                  Like
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Show nested replies */}
                          {comments.filter(reply => reply.parent_id === comment.id).length > 0 && (
                            <div className="pl-10 pb-4 space-y-2">
                              {comments
                                .filter(reply => reply.parent_id === comment.id)
                                .map(reply => (
                                  <div key={reply.id} className="bg-slate-50 p-3 rounded border-l-2 border-teal-200">
                                    <div className="flex items-center justify-between mb-1">
                                      <div className="flex items-center gap-2">
                                        <div className="w-5 h-5 bg-teal-100 rounded-full flex items-center justify-center">
                                          <User size={12} className="text-teal-600" />
                                        </div>
                                        <span className="text-xs font-medium text-slate-700">
                                          {reply.first_name ? `${reply.first_name} ${reply.last_name}` : `User ${reply.user_id}`}
                                        </span>
                                      </div>
                                      <span className="text-xs text-slate-500">
                                        {formatDate(reply.created_at)}
                                      </span>
                                    </div>
                                    <div className="text-xs text-slate-700 ml-7">
                                      {reply.is_deleted ? (
                                        <em className="text-slate-400">This reply has been deleted</em>
                                      ) : (
                                        reply.content
                                      )}
                                    </div>
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>
                      ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="w-72 bg-slate-50 border-l p-6">
            <div className="space-y-4">
              {/* Status */}
              <div className="text-center">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(research?.progress_status ?? "")}`}>
                  {research?.progress_status}
                </span>
              </div>

              {/* Quick Info */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Researcher</span>
                  <span className="font-medium text-slate-700">{research?.researcher}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Category</span>
                  <span className="font-medium text-slate-700">{research?.category}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Year</span>
                  <span className="font-medium text-slate-700">{research?.year}</span>
                </div>
              </div>

              <hr className="border-slate-200" />

              {/* Actions */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-slate-700 mb-3">Actions</h4>
                <button
                  onClick={() => handleAction('approve')}
                  disabled={approvingResearch}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  {approvingResearch ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Approving...
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      Approve
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleAction('reject')}
                  disabled={rejectingResearch}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-amber-900 hover:bg-amber-800 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  {rejectingResearch ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Rejecting...
                    </>
                  ) : (
                    <>
                      <X size={16} />
                      Reject
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleAction('hold')}
                  disabled={holdingResearch}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  {holdingResearch ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Holding...
                    </>
                  ) : (
                    <>
                      <Pause size={16} />
                      Hold
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-white/90 flex items-center justify-center">
            <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-lg shadow-lg border">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-teal-500 border-t-transparent"></div>
              <span className="text-slate-700 font-medium text-sm">Processing...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewResearch;