"use client";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { X, FileText, User, Building2, Check, AlertTriangle, Pause, Eye, Download, MessageCircle, Send, MoreVertical, Edit, Trash2, Reply, Heart, Flag, CheckCircle, File, BookOpen, ExternalLink } from "lucide-react";

// Interface updated to include the new is_public field
interface FormData {
  title: string;
  researcher: string;
  author_name: string;
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
  revoke_approval_reason?: string;
  approval_revoked_at?: string;
  revoker_supervisor_id?: string;
  revoker_supervisor_name?: string;
  rejection_reason?: string;
  rejected_at?: string;
  rejected_by_id?: string;
  rejected_by_supervisor_name?: string;
  unreject_reason?: string;
  unrejected_at?: string;
  unrejected_by_id?: string;
  unrejected_by_supervisor_name?: string;
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
  const [showDocumentViewer, setShowDocumentViewer] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showHoldModal, setShowHoldModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [holdReason, setHoldReason] = useState("");
  const [submittingReject, setSubmittingReject] = useState(false);
  const [submittingHold, setSubmittingHold] = useState(false);
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [revokeReason, setRevokeReason] = useState("");
  const [submittingRevoke, setSubmittingRevoke] = useState(false);
  const [showUnrejectModal, setShowUnrejectModal] = useState(false);
  const [unrejectReason, setUnrejectReason] = useState("");
  const [submittingUnreject, setSubmittingUnreject] = useState(false);

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

  // Debug: Log research data to see if revocation fields are present
  useEffect(() => {
    if (research) {
      console.log('Research data:', {
        status: research.status,
        revoke_approval_reason: research.revoke_approval_reason,
        approval_revoked_at: research.approval_revoked_at,
        full_research: research
      });
    }
  }, [research]);

  // Helper function to truncate text
  const truncateText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Helper function to format date
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  // Handle download from viewer
  const handleDownloadFromViewer = () => {
    if (research?.document) {
      const link = document.createElement('a');
      link.href = research.document;
      link.download = research.title || 'Research Document';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Handle quick actions
  const handleAction = (action: string) => {
    if (action === 'reject') {
      setShowRejectModal(true);
    } else if (action === 'hold') {
      setShowHoldModal(true);
    } else if (action === 'approve') {
      approveResearch();
    } else if (action === 'review') {
      // Handle review action if needed
      console.log('Review action triggered');
    }
  };

  // Approve research function
  const approveResearch = async () => {
    if (!research || !sessionId) return;
    
    setApprovingResearch(true);
    try {
      const response = await fetch('/api/research/approve', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: research.hashed_id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to approve");
      }

      setSuccess("Research approved successfully!");
      // Update the research status locally
      setResearch(prev => prev ? {...prev, status: 'Approved'} : null);
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error approving research:', error);
      setError(error instanceof Error ? error.message : "Failed to approve research");
      setTimeout(() => setError(null), 5000);
    } finally {
      setApprovingResearch(false);
    }
  };

  // Reject research with reason
  const submitRejectReason = async () => {
    if (!research || !sessionId || !rejectReason.trim()) return;
    
    setSubmittingReject(true);
    try {
      const response = await fetch('/api/research/reject', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: research.hashed_id,
          reason: rejectReason.trim(),
          supervisor_id: sessionId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to reject");
      }

      setSuccess(`Research rejected successfully! Reason: ${rejectReason.trim()}`);
      // Update the research status locally
      setResearch(prev => prev ? {...prev, status: 'Rejected'} : null);
      
      // Close modal and reset
      setShowRejectModal(false);
      setRejectReason("");
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error rejecting research:', error);
      setError(error instanceof Error ? error.message : "Failed to reject research");
      setTimeout(() => setError(null), 5000);
    } finally {
      setSubmittingReject(false);
    }
  };

  // Hold research with reason
  const submitHoldReason = async () => {
    if (!research || !sessionId || !holdReason.trim()) return;
    
    setSubmittingHold(true);
    try {
      const response = await fetch('/api/research/hold', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: research.hashed_id,
          reason: holdReason.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to hold");
      }

      setSuccess(`Research put on hold successfully! Reason: ${holdReason.trim()}`);
      // Update the research status locally
      setResearch(prev => prev ? {...prev, status: 'On hold'} : null);
      
      // Close modal and reset
      setShowHoldModal(false);
      setHoldReason("");
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error holding research:', error);
      setError(error instanceof Error ? error.message : "Failed to hold research");
      setTimeout(() => setError(null), 5000);
    } finally {
      setSubmittingHold(false);
    }
  };

  // Revoke approval function
  const submitRevokeReason = async () => {
    if (!research || !sessionId || !revokeReason.trim()) return;
    
    setSubmittingRevoke(true);
    try {
      const response = await fetch('/api/research/revoke', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: research.hashed_id,
          reason: revokeReason.trim(),
          supervisor_id: sessionId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to revoke approval");
      }

      setSuccess(`Approval revoked successfully! Reason: ${revokeReason.trim()}`);
      // Update the research status locally back to pending
      setResearch(prev => prev ? {...prev, status: 'Pending'} : null);
      
      // Close modal and reset
      setShowRevokeModal(false);
      setRevokeReason("");
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error revoking approval:', error);
      setError(error instanceof Error ? error.message : "Failed to revoke approval");
      setTimeout(() => setError(null), 5000);
    } finally {
      setSubmittingRevoke(false);
    }
  };

  // Unreject function
  const submitUnrejectReason = async () => {
    if (!research || !sessionId || !unrejectReason.trim()) return;
    
    setSubmittingUnreject(true);
    try {
      const response = await fetch('/api/research/unreject', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: research.hashed_id,
          reason: unrejectReason.trim(),
          supervisor_id: sessionId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to reverse rejection");
      }

      setSuccess(`Rejection reversed successfully! Reason: ${unrejectReason.trim()}`);
      // Update the research status locally back to pending
      setResearch(prev => prev ? {...prev, status: 'Pending'} : null);
      
      // Close modal and reset
      setShowUnrejectModal(false);
      setUnrejectReason("");
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error reversing rejection:', error);
      setError(error instanceof Error ? error.message : "Failed to reverse rejection");
      setTimeout(() => setError(null), 5000);
    } finally {
      setSubmittingUnreject(false);
    }
  };

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
                  <div className="flex items-center gap-2">
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
                    {research?.revoke_approval_reason && research?.approval_revoked_at && (
                      <div 
                        className="px-3 py-1 rounded-full text-xs font-semibold shadow-md bg-amber-500 text-white"
                        title={`Approval revoked: ${research.revoke_approval_reason}`}
                      >
                        Revoked
                      </div>
                    )}
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
              {research?.status?.toLowerCase() === 'approved' ? (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500 rounded-full">
                      <Check className="text-white" size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-emerald-800">Research Approved</h3>
                      <p className="text-sm text-emerald-600">This research has been approved by the supervisor</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowRevokeModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition-colors"
                  >
                    <AlertTriangle size={16} />
                    Revoke Approval
                  </button>
                </div>
              ) : research?.status?.toLowerCase() === 'rejected' ? (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8 p-4 bg-gradient-to-r from-red-50 to-rose-50 rounded-xl border border-red-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-500 rounded-full">
                      <AlertTriangle className="text-white" size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-red-800">Research Rejected</h3>
                      <p className="text-sm text-red-600">This research has been rejected by the supervisor</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowUnrejectModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 text-white text-sm font-medium rounded-lg hover:bg-green-600 transition-colors"
                  >
                    <Check size={16} />
                    Change Mind
                  </button>
                </div>
              ) : (
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
              )}

              {/* Revocation History Alert */}
              {research?.revoke_approval_reason && research?.approval_revoked_at && (
                <div className="mb-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-amber-500 rounded-full flex-shrink-0">
                      <AlertTriangle className="text-white" size={18} />
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>
                          <h4 className="font-semibold text-amber-800 mb-1">
                            Approval Previously Revoked
                          </h4>
                          <p className="text-sm text-amber-700 mb-2">
                            This research was previously approved but approval was revoked on{' '}
                            <span className="font-medium">{formatDate(research.approval_revoked_at)}</span>
                            {research.revoker_supervisor_name && (
                              <span> by <span className="font-medium">{research.revoker_supervisor_name}</span></span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="bg-amber-100 rounded-lg p-3 mt-3">
                        <p className="text-sm font-medium text-amber-800 mb-1">Revocation Reason:</p>
                        <p className="text-sm text-amber-700 italic">"{research.revoke_approval_reason}"</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Rejection History Alert */}
              {research?.rejection_reason && research?.rejected_at && (
                <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-rose-50 rounded-xl border border-red-200">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-red-500 rounded-full flex-shrink-0">
                      <AlertTriangle className="text-white" size={18} />
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>
                          <h4 className="font-semibold text-red-800 mb-1">
                            Research Previously Rejected
                          </h4>
                          <p className="text-sm text-red-700 mb-2">
                            This research was rejected on{' '}
                            <span className="font-medium">{formatDate(research.rejected_at)}</span>
                            {research.rejected_by_supervisor_name && (
                              <span> by <span className="font-medium">{research.rejected_by_supervisor_name}</span></span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="bg-red-100 rounded-lg p-3 mt-3">
                        <p className="text-sm font-medium text-red-800 mb-1">Rejection Reason:</p>
                        <p className="text-sm text-red-700 italic">"{research.rejection_reason}"</p>
                      </div>
                      {research.unreject_reason && research.unrejected_at && (
                        <div className="bg-green-100 rounded-lg p-3 mt-3 border border-green-200">
                          <p className="text-sm font-medium text-green-800 mb-1">
                            Later reversed on {formatDate(research.unrejected_at)}
                            {research.unrejected_by_supervisor_name && (
                              <span> by {research.unrejected_by_supervisor_name}</span>
                            )}:
                          </p>
                          <p className="text-sm text-green-700 italic">"{research.unreject_reason}"</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

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
                              <button
                                onClick={() => setShowDocumentViewer(true)}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors"
                              >
                                <Eye size={16} />
                                View Document
                              </button>
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
                            {research?.revoke_approval_reason && research?.approval_revoked_at && (
                              <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-4">
                                <div className="text-center mb-2">
                                  <div className="text-lg font-bold text-amber-600 mb-1">⚠️</div>
                                  <p className="text-xs text-amber-700 font-medium">Approval Revoked</p>
                                </div>
                                <div className="text-xs text-amber-600 space-y-1">
                                  <p><strong>Date:</strong> {formatDate(research.approval_revoked_at)}</p>
                                  {research.revoker_supervisor_name && (
                                    <p><strong>Revoked by:</strong> {research.revoker_supervisor_name}</p>
                                  )}
                                  <p><strong>Reason:</strong> <span className="italic">"{research.revoke_approval_reason}"</span></p>
                                </div>
                              </div>
                            )}
                            {research?.rejection_reason && research?.rejected_at && (
                              <div className="bg-gradient-to-br from-red-50 to-rose-50 border border-red-200 rounded-lg p-4">
                                <div className="text-center mb-2">
                                  <div className="text-lg font-bold text-red-600 mb-1">❌</div>
                                  <p className="text-xs text-red-700 font-medium">Research Rejected</p>
                                </div>
                                <div className="text-xs text-red-600 space-y-1">
                                  <p><strong>Date:</strong> {formatDate(research.rejected_at)}</p>
                                  {research.rejected_by_supervisor_name && (
                                    <p><strong>Rejected by:</strong> {research.rejected_by_supervisor_name}</p>
                                  )}
                                  <p><strong>Reason:</strong> <span className="italic">"{research.rejection_reason}"</span></p>
                                  {research.unreject_reason && research.unrejected_at && (
                                    <div className="mt-2 pt-2 border-t border-red-300">
                                      <p className="text-green-700 font-medium">Later Reversed:</p>
                                      <p><strong>Date:</strong> {formatDate(research.unrejected_at)}</p>
                                      {research.unrejected_by_supervisor_name && (
                                        <p><strong>Reversed by:</strong> {research.unrejected_by_supervisor_name}</p>
                                      )}
                                      <p><strong>Reason:</strong> <span className="italic">"{research.unreject_reason}"</span></p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
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
                            <p className="text-lg font-semibold text-cyan-800">{research?.created_at ? formatDate(research.created_at) : 'N/A'}</p>
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

      {/* Reject Reason Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
            {/* Modal Header */}
            <div className="bg-red-500 text-white p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <X className="text-red-200" size={24} />
                  <h3 className="text-lg font-bold">Reject Research</h3>
                </div>
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectReason("");
                  }}
                  className="p-1 hover:bg-red-600 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            
            {/* Modal Content */}
            <div className="p-6">
              <p className="text-gray-700 mb-4">
                Please provide a reason for rejecting this research. This will help the student understand what needs to be improved.
              </p>
              
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter your reason for rejecting this research..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
                rows={4}
                disabled={submittingReject}
              />
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectReason("");
                  }}
                  disabled={submittingReject}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={submitRejectReason}
                  disabled={submittingReject || !rejectReason.trim()}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submittingReject ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Rejecting...
                    </>
                  ) : (
                    'Reject Research'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hold Reason Modal */}
      {showHoldModal && (
        <div className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
            {/* Modal Header */}
            <div className="bg-orange-500 text-white p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Pause className="text-orange-200" size={24} />
                  <h3 className="text-lg font-bold">Hold Research</h3>
                </div>
                <button
                  onClick={() => {
                    setShowHoldModal(false);
                    setHoldReason("");
                  }}
                  className="p-1 hover:bg-orange-600 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            
            {/* Modal Content */}
            <div className="p-6">
              <p className="text-gray-700 mb-4">
                Please provide a reason for putting this research on hold. This will help clarify what needs to be addressed before proceeding.
              </p>
              
              <textarea
                value={holdReason}
                onChange={(e) => setHoldReason(e.target.value)}
                placeholder="Enter your reason for holding this research..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
                rows={4}
                disabled={submittingHold}
              />
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowHoldModal(false);
                    setHoldReason("");
                  }}
                  disabled={submittingHold}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={submitHoldReason}
                  disabled={submittingHold || !holdReason.trim()}
                  className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submittingHold ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Hold Research'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Revoke Approval Modal */}
      {showRevokeModal && (
        <div className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
            {/* Modal Header */}
            <div className="bg-orange-500 text-white p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="text-orange-200" size={24} />
                  <h3 className="text-lg font-bold">Revoke Approval</h3>
                </div>
                <button
                  onClick={() => {
                    setShowRevokeModal(false);
                    setRevokeReason("");
                  }}
                  className="p-1 hover:bg-orange-600 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            
            {/* Modal Content */}
            <div className="p-6">
              <p className="text-gray-700 mb-4">
                Please provide a reason for revoking the approval of this research. This will help document the decision change and inform the student.
              </p>
              
              <textarea
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                placeholder="Enter your reason for revoking approval..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
                rows={4}
                disabled={submittingRevoke}
              />
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowRevokeModal(false);
                    setRevokeReason("");
                  }}
                  disabled={submittingRevoke}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={submitRevokeReason}
                  disabled={submittingRevoke || !revokeReason.trim()}
                  className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submittingRevoke ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Revoking...
                    </>
                  ) : (
                    'Revoke Approval'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Unreject Modal */}
      {showUnrejectModal && (
        <div className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
            {/* Modal Header */}
            <div className="bg-green-500 text-white p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Check className="text-green-200" size={24} />
                  <h3 className="text-lg font-bold">Change Mind - Reverse Rejection</h3>
                </div>
                <button
                  onClick={() => {
                    setShowUnrejectModal(false);
                    setUnrejectReason("");
                  }}
                  className="p-1 hover:bg-green-600 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            
            {/* Modal Body */}
            <div className="p-6">
              <p className="text-gray-700 mb-4">
                This research was previously rejected. Please provide a reason for reversing the rejection:
              </p>
              
              <textarea
                value={unrejectReason}
                onChange={(e) => setUnrejectReason(e.target.value)}
                placeholder="Enter your reason for reversing the rejection..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
                rows={4}
              />
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowUnrejectModal(false);
                    setUnrejectReason("");
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={submitUnrejectReason}
                  disabled={submittingUnreject || !unrejectReason.trim()}
                  className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submittingUnreject ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Reversing...
                    </>
                  ) : (
                    'Reverse Rejection'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Document Viewer Modal */}
      {showDocumentViewer && research?.document && (
        <div className="fixed inset-0 z-[60] bg-white/20 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full h-full max-w-7xl max-h-[95vh] bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 text-white" style={{ background: 'linear-gradient(to right, #009688, #00695c)' }}>
              <div className="flex items-center gap-3">
                {/* Conditional icon based on document type */}
                {research.document_type?.toLowerCase().includes('pdf') ? (
                  <File size={24} className="text-red-100" />
                ) : research.document_type?.toLowerCase().includes('word') || research.document_type?.toLowerCase().includes('docx') ? (
                  <BookOpen size={24} className="text-blue-100" />
                ) : (
                  <FileText size={24} />
                )}
                <div>
                  <h3 className="font-bold text-lg">
                    {(() => {
                      if (!research?.title) return "Research Document";
                      const year = research.year ? ` (${research.year})` : '';
                      const researcher = research.researcher ? ` - ${research.researcher.split(' ')[0]}` : '';
                      const cleanTitle = research.title
                        .replace(/[^\w\s-]/g, '')
                        .replace(/\s+/g, ' ')
                        .trim();
                      const documentName = `${cleanTitle}${year}${researcher}`;
                      return truncateText(documentName, 50);
                    })()}
                  </h3>
                  <p className="text-sm text-white/80">{research.document_type || 'PDF Document'}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Show download button for DOCX files */}
                {(research.document_type?.toLowerCase().includes('word') || research.document_type?.toLowerCase().includes('docx')) && (
                  <button
                    onClick={handleDownloadFromViewer}
                    className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                    aria-label="Download document"
                  >
                    <Download size={18} />
                  </button>
                )}
                <button
                  onClick={() => setShowDocumentViewer(false)}
                  className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                  aria-label="Close viewer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            
            {/* Document Content */}
            <div className="w-full h-full bg-gray-100 relative">
              {research.document_type?.toLowerCase().includes('pdf') ? (
                // PDF Viewer with fallback options
                <div className="w-full h-full">
                  <embed
                    src={`${research.document}#toolbar=1&navpanes=1&scrollbar=1`}
                    type="application/pdf"
                    className="w-full h-full"
                    title="Research Document"
                    onError={() => {
                      // Show fallback options if embed fails
                      const embed = document.querySelector('embed[title="Research Document"]') as HTMLEmbedElement;
                      const fallback = document.getElementById('pdf-fallback');
                      if (embed && fallback) {
                        embed.style.display = 'none';
                        fallback.classList.remove('hidden');
                      }
                    }}
                  />
                  {/* Fallback message - only show if document fails to load */}
                  <div className="absolute inset-0 hidden" id="pdf-fallback">
                    <div className="w-full h-full flex flex-col items-center justify-center bg-white">
                    <FileText size={48} className="text-gray-400 mb-4" />
                    <p className="text-gray-600 text-center mb-4 max-w-md">
                      Unable to display the document. Try these options:
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => window.open(research.document, '_blank')}
                        className="flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-colors"
                        style={{ backgroundColor: '#009688' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#00695c'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#009688'}
                      >
                        <ExternalLink size={16} />
                        Open in New Tab
                      </button>
                      <button
                        onClick={handleDownloadFromViewer}
                        className="flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-colors"
                        style={{ backgroundColor: '#009688' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#00695c'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#009688'}
                      >
                        <Download size={16} />
                        Download PDF
                      </button>
                    </div>
                    </div>
                  </div>
                </div>
              ) : research.document_type?.toLowerCase().includes('word') || research.document_type?.toLowerCase().includes('docx') ? (
                // For DOCX/Word documents - use Office 365 viewer
                <div className="w-full h-full relative">
                  {/* Loading state */}
                  <div className="absolute inset-0 flex items-center justify-center bg-white" id="docx-loading">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto mb-2"></div>
                      <p className="text-gray-600">Loading document...</p>
                    </div>
                  </div>
                  
                  <iframe
                    src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(research.document)}`}
                    className="w-full h-full border-0"
                    title="Research Document"
                    onLoad={() => {
                      // Hide loading state once iframe loads
                      const loading = document.getElementById('docx-loading');
                      if (loading) loading.style.display = 'none';
                    }}
                    onError={() => {
                      // Show fallback options if viewer fails
                      const loading = document.getElementById('docx-loading');
                      const fallback = document.getElementById('docx-fallback');
                      if (loading) loading.style.display = 'none';
                      if (fallback) {
                        fallback.classList.remove('hidden');
                        fallback.style.display = 'flex';
                      }
                    }}
                  />
                  
                  {/* Fallback message for DOCX files */}
                  <div className="absolute inset-0 hidden items-center justify-center bg-white" id="docx-fallback">
                    <div className="text-center max-w-md px-4">
                      <FileText size={48} className="text-gray-400 mb-4 mx-auto" />
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">Document Viewer Unavailable</h3>
                      <p className="text-gray-600 text-center mb-6">
                        The online document viewer couldn't load this Word document. You can still access it using the options below:
                      </p>
                      <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <button
                          onClick={() => window.open(`https://docs.google.com/gview?url=${encodeURIComponent(research.document)}`, '_blank')}
                          className="flex items-center justify-center gap-2 px-4 py-2 text-white rounded-lg transition-colors"
                          style={{ backgroundColor: '#009688' }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#00695c'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#009688'}
                        >
                          <ExternalLink size={16} />
                          Google Viewer
                        </button>
                        <button
                          onClick={() => window.open(research.document, '_blank')}
                          className="flex items-center justify-center gap-2 px-4 py-2 text-white rounded-lg transition-colors"
                          style={{ backgroundColor: '#009688' }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#00695c'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#009688'}
                        >
                          <Download size={16} />
                          Download
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                // For other document types
                <iframe
                  src={research.document}
                  className="w-full h-full border-0"
                  title="Research Document"
                  sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewResearch;