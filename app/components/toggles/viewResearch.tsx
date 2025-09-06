"use client";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { X, FileText, User, Building2, Check, AlertTriangle, Pause, Eye, Download, MessageCircle, Send, MoreVertical, Edit, Trash2, Reply, Heart, Flag, CheckCircle } from "lucide-react";

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
    <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-50 flex items-start sm:items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <style>{`
        @keyframes slideIn { 
          from { opacity: 0; transform: translateY(-20px); } 
          to { opacity: 1; transform: translateY(0); } 
        }
        @keyframes fadeInScale { 
          from { opacity: 0; transform: scale(0.95); } 
          to { opacity: 1; transform: scale(1); } 
        }
        .slide-in { animation: slideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1); }
        .fade-in-scale { animation: fadeInScale 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .research-card { 
          background: linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(148, 163, 184, 0.2);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }
        .status-badge {
          background: linear-gradient(135deg, var(--bg-from), var(--bg-to));
          border: 1px solid var(--border-color);
        }
      `}</style>

      {/* Success/Error Notifications */}
      {success && (
        <div className="fixed top-6 right-6 z-60 slide-in">
          <div className="bg-emerald-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3">
            <CheckCircle size={20} />
            <span className="font-medium">{success}</span>
          </div>
        </div>
      )}
      
      {error && (
        <div className="fixed top-6 right-6 z-60 slide-in">
          <div className="bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3">
            <AlertTriangle size={20} />
            <span className="font-medium">{error}</span>
          </div>
        </div>
      )}

      {/* Main Modal */}
      <div className="w-full max-w-6xl min-h-full sm:min-h-0 sm:max-h-[95vh] my-2 sm:my-auto fade-in-scale">
        <div className="research-card rounded-none sm:rounded-2xl overflow-hidden h-full sm:h-auto">
          
          {/* Header Section */}
          <div className="relative">
            {/* Status Bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-400 via-cyan-400 to-indigo-400"></div>
            
            {/* Header Content */}
            <div className="bg-gradient-to-br from-teal-700 via-teal-600 to-teal-800 text-white p-4 sm:p-8">
              {/* Close Button */}
              <button 
                onClick={onClose}
                className="absolute top-3 right-3 sm:top-6 sm:right-6 p-2.5 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-300 hover:rotate-90 group"
              >
                <X size={22} className="group-hover:scale-110 transition-transform" />
              </button>

              <div className="pr-12 sm:pr-16">
                {/* Research Type & Status */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-teal-500/20 rounded-lg">
                      <FileText size={24} className="text-teal-400" />
                    </div>
                    <div>
                      <p className="text-teal-300 text-sm font-medium uppercase tracking-wider">Research Paper</p>
                      <p className="text-white/60 text-xs">{research?.category}</p>
                    </div>
                  </div>
                  
                  {/* Status Badge */}
                  <div 
                    className="status-badge px-4 py-2 rounded-full text-sm font-semibold shadow-lg"
                    style={{
                      '--bg-from': research?.progress_status === 'approved' ? '#10b981' : 
                                 research?.progress_status === 'under review' ? '#f59e0b' :
                                 research?.progress_status === 'rejected' ? '#ef4444' : '#6b7280',
                      '--bg-to': research?.progress_status === 'approved' ? '#059669' : 
                               research?.progress_status === 'under review' ? '#d97706' :
                               research?.progress_status === 'rejected' ? '#dc2626' : '#4b5563',
                      '--border-color': research?.progress_status === 'approved' ? '#10b981' : 
                                     research?.progress_status === 'under review' ? '#f59e0b' :
                                     research?.progress_status === 'rejected' ? '#ef4444' : '#6b7280'
                    } as React.CSSProperties}
                  >
                    {research?.progress_status}
                  </div>
                </div>

                {/* Title */}
                <h1 className="text-3xl font-bold mb-4 leading-tight">
                  {research?.title}
                </h1>

                {/* Research Info */}
                <div className="flex flex-wrap items-center gap-6 text-white/80">
                  <div className="flex items-center gap-2">
                    <User size={18} />
                    <span className="font-medium">{research?.researcher}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 size={18} />
                    <span>{research?.institute}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm bg-white/10 px-3 py-1 rounded-full">
                      📅 {research?.year}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex flex-col lg:flex-row min-h-0 sm:min-h-[600px]">
            
            {/* Content Panel */}
            <div className="flex-1 p-4 sm:p-8 overflow-y-auto max-h-[70vh] sm:max-h-none">
              {/* Quick Actions Bar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6 sm:mb-8 p-3 sm:p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl border">
                <span className="text-sm font-semibold text-slate-700">Quick Actions:</span>
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                  {['approve', 'reject', 'hold', 'review'].map((action) => (
                    <button
                      key={action}
                      onClick={() => handleAction(action)}
                      disabled={
                        (action === 'approve' && approvingResearch) ||
                        (action === 'reject' && rejectingResearch) ||
                        (action === 'hold' && holdingResearch) ||
                        (action === 'review' && reviewingResearch)
                      }
                      className={`
                        flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 flex-1 sm:flex-none justify-center
                        ${action === 'approve' ? 'bg-emerald-500 hover:bg-emerald-600 text-white' :
                          action === 'reject' ? 'bg-red-500 hover:bg-red-600 text-white' :
                          action === 'hold' ? 'bg-orange-500 hover:bg-orange-600 text-white' :
                          'bg-blue-500 hover:bg-blue-600 text-white'}
                      `}
                    >
                      {action === 'approve' && approvingResearch ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : action === 'reject' && rejectingResearch ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : action === 'hold' && holdingResearch ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : action === 'review' && reviewingResearch ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          {action === 'approve' && <Check size={16} />}
                          {action === 'reject' && <X size={16} />}
                          {action === 'hold' && <Pause size={16} />}
                          {action === 'review' && <Eye size={16} />}
                        </>
                      )}
                      {action.charAt(0).toUpperCase() + action.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="flex gap-1 sm:gap-2 mb-6 p-1 sm:p-2 bg-slate-100 rounded-xl overflow-x-auto">
                {buttons.map((button, index) => {
                  const Icon = button.icon;
                  return (
                    <button
                      key={index}
                      onClick={() => setActiveTab(index)}
                      className={`
                        flex items-center gap-1 sm:gap-2 px-3 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-all duration-200 flex-1 justify-center whitespace-nowrap
                        ${activeTab === index 
                          ? 'bg-white text-teal-700 shadow-md border border-teal-200' 
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'}
                      `}
                    >
                      <Icon size={16} className="sm:w-[18px] sm:h-[18px]" />
                      <span className="capitalize">{button.name}</span>
                      {button.name === 'comments' && comments.length > 0 && (
                        <span className="bg-teal-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[1.5rem] text-center">
                          {comments.length}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Tab Content */}
              <div className="space-y-6">
                {/* Overview Tab */}
                {activeTab === 0 && (
                  <div className="slide-in">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Left Column - Abstract */}
                      <div className="space-y-4">
                        <div className="bg-white rounded-xl p-4 sm:p-6 border border-slate-200 shadow-sm h-fit">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-blue-100 rounded-lg">
                              <FileText className="text-blue-600" size={18} />
                            </div>
                            <h3 className="text-lg sm:text-xl font-semibold text-slate-800">Abstract</h3>
                          </div>
                          <div 
                            className="prose prose-sm sm:prose prose-slate max-w-none text-slate-700 leading-relaxed max-h-80 overflow-y-auto pr-2"
                            id="abstract"
                            dangerouslySetInnerHTML={{ 
                              __html: research?.abstract || "<p>No abstract available.</p>" 
                            }}
                          />
                        </div>
                      </div>

                      {/* Right Column - Document and Actions */}
                      <div className="space-y-4">
                        {/* Document Section */}
                        <div className="bg-white rounded-xl p-4 sm:p-6 border border-slate-200 shadow-sm">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-green-100 rounded-lg">
                              <Download className="text-green-600" size={20} />
                            </div>
                            <h3 className="text-lg sm:text-xl font-semibold text-slate-800">Research Document</h3>
                          </div>
                          
                          {research?.is_public ? (
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                                  <FileText className="text-red-600" size={20} />
                                </div>
                                <div>
                                  <h4 className="font-medium text-gray-900">
                                    {research?.title} ({research?.year}) - {research?.author_name}
                                  </h4>
                                  <p className="text-sm text-gray-500">
                                    {research?.document_type}
                                  </p>
                                </div>
                              </div>
                              <Link
                                href={research?.document ?? ""}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors"
                              >
                                <Eye size={16} />
                                View Document
                              </Link>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                  <FileText className="text-gray-400" size={20} />
                                </div>
                                <div>
                                  <h4 className="font-medium text-gray-900">
                                    {research?.title} ({research?.year}) - {research?.author_name}
                                  </h4>
                                  <p className="text-sm text-gray-500">
                                    Private Document
                                  </p>
                                </div>
                              </div>
                              <button
                                disabled
                                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-300 text-gray-500 text-sm font-medium rounded-lg cursor-not-allowed"
                              >
                                <Eye size={16} />
                                View Document
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Research Metrics */}
                        <div className="bg-white rounded-xl p-4 sm:p-6 border border-slate-200 shadow-sm">
                          <h3 className="text-lg sm:text-xl font-semibold text-slate-800 mb-4">Research Details</h3>
                          <div className="grid grid-cols-1 gap-3">
                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 text-center">
                              <div className="text-xl font-bold text-blue-600 mb-1">{research?.year}</div>
                              <p className="text-xs text-blue-700 font-medium">Research Year</p>
                            </div>
                            <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4 text-center">
                              <div className="text-xl font-bold text-purple-600 mb-1">📚</div>
                              <p className="text-xs text-purple-700 font-medium">{research?.category}</p>
                            </div>
                            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-lg p-4 text-center">
                              <div className="text-xl font-bold text-emerald-600 mb-1">
                                {research?.is_public ? '🌐' : '🔒'}
                              </div>
                              <p className="text-xs text-emerald-700 font-medium">
                                {research?.is_public ? 'Public' : 'Private'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Details Tab */}
                {activeTab === 1 && (
                  <div className="space-y-6 slide-in">
                    <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-indigo-100 rounded-lg">
                          <FileText className="text-indigo-600" size={20} />
                        </div>
                        <h3 className="text-xl font-semibold text-slate-800">Research Information</h3>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Left Column */}
                        <div className="space-y-6">
                          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                            <label className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2 block">
                              📚 Research Category
                            </label>
                            <p className="text-lg font-semibold text-blue-800">{research?.category}</p>
                          </div>
                          
                          <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                            <label className="text-xs font-semibold text-purple-600 uppercase tracking-wider mb-2 block">
                              📅 Publication Year
                            </label>
                            <p className="text-lg font-semibold text-purple-800">{research?.year}</p>
                          </div>
                          
                          <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg border border-emerald-200">
                            <label className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-2 block">
                              👤 Lead Researcher
                            </label>
                            <p className="text-lg font-semibold text-emerald-800">{research?.researcher}</p>
                          </div>
                        </div>
                        
                        {/* Right Column */}
                        <div className="space-y-6">
                          <div className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border border-orange-200">
                            <label className="text-xs font-semibold text-orange-600 uppercase tracking-wider mb-2 block">
                              🏫 Academic Institution
                            </label>
                            <p className="text-lg font-semibold text-orange-800">{research?.school}</p>
                          </div>
                          
                          <div className="p-4 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-lg border border-cyan-200">
                            <label className="text-xs font-semibold text-cyan-600 uppercase tracking-wider mb-2 block">
                              🕒 Upload Date
                            </label>
                            <p className="text-lg font-semibold text-cyan-800">{formatDate(research?.created_at)}</p>
                          </div>
                          
                          <div className="p-4 bg-gradient-to-r from-rose-50 to-pink-50 rounded-lg border border-rose-200">
                            <label className="text-xs font-semibold text-rose-600 uppercase tracking-wider mb-2 block">
                              🔍 Current Status
                            </label>
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full"
                                style={{
                                  backgroundColor: research?.progress_status === 'approved' ? '#10b981' : 
                                                 research?.progress_status === 'under review' ? '#f59e0b' :
                                                 research?.progress_status === 'rejected' ? '#ef4444' : '#6b7280'
                                }}
                              />
                              <p className="text-lg font-semibold text-rose-800">{research?.progress_status}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Comments Tab */}
                {activeTab === 2 && (
                  <div className="space-y-6 slide-in">
                    <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-pink-100 rounded-lg">
                            <MessageCircle className="text-pink-600" size={20} />
                          </div>
                          <h3 className="text-xl font-semibold text-slate-800">Discussion & Comments</h3>
                        </div>
                        <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-sm font-medium">
                          {comments.length} comment{comments.length !== 1 ? 's' : ''}
                        </span>
                      </div>

                      {/* Add Comment Form */}
                      <div className="bg-gradient-to-r from-slate-50 to-slate-100 p-6 rounded-xl border border-slate-200 mb-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full flex items-center justify-center">
                            <User size={20} className="text-white" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800">Add your comment as supervisor</p>
                            <p className="text-sm text-slate-500">Share your feedback on this research</p>
                          </div>
                        </div>
                        <textarea
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder="Write your feedback, suggestions, or questions about this research..."
                          className="w-full p-4 border border-slate-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm bg-white"
                          rows={4}
                          disabled={postingComment}
                        />
                        <div className="flex justify-end mt-4">
                          <button
                            onClick={handlePostComment}
                            disabled={!newComment.trim() || postingComment}
                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 disabled:from-slate-300 disabled:to-slate-400 text-white font-semibold rounded-xl transition-all duration-200 hover:scale-105 disabled:hover:scale-100"
                          >
                            {postingComment ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                Posting...
                              </>
                            ) : (
                              <>
                                <Send size={16} />
                                Post Comment
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Comments List */}
                      <div className="space-y-4">
                        {commentsLoading ? (
                          <div className="flex items-center justify-center py-12">
                            <div className="text-center">
                              <div className="animate-spin rounded-full h-8 w-8 border-4 border-teal-500 border-t-transparent mx-auto mb-3"></div>
                              <p className="text-slate-500 font-medium">Loading comments...</p>
                            </div>
                          </div>
                        ) : comments.length === 0 ? (
                          <div className="text-center py-12">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                              <MessageCircle size={32} className="text-slate-400" />
                            </div>
                            <p className="text-lg font-medium text-slate-600 mb-2">No comments yet</p>
                            <p className="text-sm text-slate-500">Be the first to share your thoughts on this research</p>
                          </div>
                        ) : (
                          comments
                            .filter(comment => !comment.parent_id)
                            .map((comment) => (
                              <div key={comment.id} className="bg-gradient-to-r from-white to-slate-50 rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-start gap-4">
                                  <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                                    <User size={20} className="text-white" />
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center justify-between mb-3">
                                      <div>
                                        <p className="font-semibold text-slate-800">
                                          {comment.first_name ? `${comment.first_name} ${comment.last_name}` : research?.researcher}
                                        </p>
                                        <p className="text-sm text-slate-500">
                                          {formatDate(comment.created_at)}
                                          {comment.is_edited && <span className="ml-2 text-xs bg-slate-200 px-2 py-1 rounded-full">edited</span>}
                                        </p>
                                      </div>
                                      <div className="relative" ref={dropdownRef}>
                                        <button
                                          onClick={() => setShowActionsId(showActionsId === comment.id ? null : comment.id)}
                                          className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                                        >
                                          <MoreVertical size={16} className="text-slate-400" />
                                        </button>
                                        {showActionsId === comment.id && (
                                          <div className="absolute right-0 top-10 bg-white rounded-lg shadow-xl border py-2 z-10 min-w-[140px]">
                                            <button
                                              onClick={() => startReply(comment.id)}
                                              className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                            >
                                              <Reply size={14} />
                                              Reply
                                            </button>
                                            <button
                                              onClick={() => startEdit(comment)}
                                              className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                            >
                                              <Edit size={14} />
                                              Edit
                                            </button>
                                            <button
                                              onClick={() => handleDeleteComment(comment.id)}
                                              disabled={deletingComment === comment.id}
                                              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 disabled:opacity-50"
                                            >
                                              {deletingComment === comment.id ? (
                                                <div className="animate-spin rounded-full h-3 w-3 border border-red-600 border-t-transparent"></div>
                                              ) : (
                                                <Trash2 size={14} />
                                              )}
                                              Delete
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    <div className="prose prose-sm max-w-none">
                                      {editingCommentId === comment.id ? (
                                        <div className="space-y-3">
                                          <textarea
                                            value={editingContent}
                                            onChange={(e) => setEditingContent(e.target.value)}
                                            className="w-full p-3 border border-slate-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                                            rows={3}
                                            disabled={editingComment}
                                          />
                                          <div className="flex gap-2">
                                            <button
                                              onClick={() => handleEditComment(comment.id, editingContent)}
                                              disabled={editingComment || !editingContent.trim()}
                                              className="flex items-center gap-2 px-4 py-2 bg-teal-500 text-white text-sm font-medium rounded-lg hover:bg-teal-600 disabled:opacity-50"
                                            >
                                              {editingComment ? (
                                                <div className="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent"></div>
                                              ) : (
                                                <Check size={14} />
                                              )}
                                              Save
                                            </button>
                                            <button
                                              onClick={() => {
                                                setEditingCommentId(null);
                                                setEditingContent("");
                                              }}
                                              disabled={editingComment}
                                              className="px-4 py-2 bg-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-300 disabled:opacity-50"
                                            >
                                              Cancel
                                            </button>
                                          </div>
                                        </div>
                                      ) : (
                                        <p className="text-slate-700 leading-relaxed">
                                          {comment.is_deleted ? (
                                            <em className="text-slate-400">This comment has been deleted</em>
                                          ) : (
                                            comment.content
                                          )}
                                        </p>
                                      )}
                                    </div>

                                    {/* Reply Form */}
                                    {replyingToId === comment.id && (
                                      <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                                        <textarea
                                          value={replyContent}
                                          onChange={(e) => setReplyContent(e.target.value)}
                                          placeholder={`Reply to ${comment.first_name || 'this comment'}...`}
                                          className="w-full p-3 border border-slate-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                                          rows={3}
                                          disabled={postingReply}
                                        />
                                        <div className="flex gap-2 mt-3">
                                          <button
                                            onClick={() => handleReplyToComment(comment.id)}
                                            disabled={postingReply || !replyContent.trim()}
                                            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 disabled:opacity-50"
                                          >
                                            {postingReply ? (
                                              <div className="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent"></div>
                                            ) : (
                                              <Reply size={14} />
                                            )}
                                            Reply
                                          </button>
                                          <button
                                            onClick={() => {
                                              setReplyingToId(null);
                                              setReplyContent("");
                                            }}
                                            disabled={postingReply}
                                            className="px-4 py-2 bg-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-300"
                                          >
                                            Cancel
                                          </button>
                                        </div>
                                      </div>
                                    )}

                                    {/* Show replies */}
                                    {comments.filter(reply => reply.parent_id === comment.id).length > 0 && (
                                      <div className="mt-4 pl-4 border-l-2 border-slate-200 space-y-3">
                                        {comments
                                          .filter(reply => reply.parent_id === comment.id)
                                          .map(reply => (
                                            <div key={reply.id} className="bg-white p-4 rounded-lg border border-slate-200">
                                              <div className="flex items-center gap-3 mb-2">
                                                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-teal-500 rounded-full flex items-center justify-center">
                                                  <User size={14} className="text-white" />
                                                </div>
                                                <div>
                                                  <p className="text-sm font-medium text-slate-800">
                                                    {reply.first_name ? `${reply.first_name} ${reply.last_name}` : 'Anonymous'}
                                                  </p>
                                                  <p className="text-xs text-slate-500">{formatDate(reply.created_at)}</p>
                                                </div>
                                              </div>
                                              <p className="text-sm text-slate-700 leading-relaxed">
                                                {reply.is_deleted ? (
                                                  <em className="text-slate-400">This reply has been deleted</em>
                                                ) : (
                                                  reply.content
                                                )}
                                              </p>
                                            </div>
                                          ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Loading Overlay */}
          {loading && (
            <div className="absolute inset-0 bg-white/95 backdrop-blur-sm flex items-center justify-center rounded-2xl">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-500 border-t-transparent mx-auto mb-4"></div>
                <p className="text-lg font-semibold text-slate-700 mb-2">Loading research details...</p>
                <p className="text-sm text-slate-500">Please wait while we fetch the information</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewResearch;