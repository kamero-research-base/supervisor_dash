// app/components/modals/viewAssignment.tsx
"use client";
import React, { useEffect, useState } from "react";
import { X, Calendar, Clock, Users, FileText, CheckCircle, AlertCircle, User, Award, BookOpen, Eye, Download, Edit, Star, Settings } from "lucide-react";
import GradeSubmission from './gradeSubmission';
import ManageGroups from './manageGroups';

// Assignment interface
interface Assignment {
  id: number;
  title: string;
  description: string;
  instructions: string;
  due_date: string;
  is_active: boolean;
  max_score: number;
  attachments: string[];
  created_at: string;
  updated_at: string;
  created_by: number;
  updated_by: number;
  hashed_id: string;
  assignment_type?: string;
  max_group_size?: number;
  allow_students_create_groups?: boolean;
  submissions_count?: number;
  invited_students_count?: number;
  average_score?: number;
}

interface AssignmentDetail extends Assignment {
  creator_name: string;
  updater_name: string;
  total_submissions: number;
  pending_submissions: number;
  graded_submissions: number;
  total_invitations: number;
  accepted_invitations: number;
  submissions: Submission[];
  invitations: Invitation[];
  groups?: Group[];
  group_stats?: GroupStats;
}

interface Group {
  id: number;
  group_name: string;
  created_by: number;
  created_at: string;
  updated_at: string;
  members: GroupMember[];
  member_count: number;
  has_submission: boolean;
}

interface GroupMember {
  student_id: number;
  first_name: string;
  last_name: string;
  email: string;
  joined_at: string;
}

interface GroupStats {
  total_groups: number;
  groups_with_submissions: number;
  students_in_groups: number;
  students_without_groups: number;
}

interface Submission {
  id: number;
  student_id: number;
  student_name: string;
  student_email: string;
  submission_text: string;
  attachments: string[];
  status: string;
  score: number | null;
  feedback: string;
  submitted_at: string;
  graded_at: string | null;
  group_id?: number;
  group_name?: string;
}

interface Invitation {
  id: number;
  student_id: number;
  student_name: string;
  student_email: string;
  status: string;
  invited_at: string;
  responded_at: string;
}

interface UserSession {
  id: string;
  [key: string]: any;
}

interface ViewAssignmentProps {
  assignment: Assignment;
  onClose: () => void;
}

// Alert Notification Component
const AlertNotification = ({ message, type }: { message: string; type: 'error' | 'success' | 'info' }) => (
  <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg border ${
    type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 
    type === 'success' ? 'bg-green-50 border-green-200 text-green-700' :
    'bg-blue-50 border-blue-200 text-blue-700'
  }`}>
    <div className="flex items-center gap-2">
      {type === 'error' ? <AlertCircle size={20} /> : 
       type === 'success' ? <CheckCircle size={20} /> :
       <Eye size={20} />}
      {message}
    </div>
  </div>
);

const ViewAssignment: React.FC<ViewAssignmentProps> = ({ assignment, onClose }) => {
  const [assignmentDetail, setAssignmentDetail] = useState<AssignmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'submissions' | 'students' | 'groups'>('overview');
  const [gradingSubmission, setGradingSubmission] = useState<Submission | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [showManageGroups, setShowManageGroups] = useState(false);

  useEffect(() => {
    const fetchAssignmentDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        const userSessionData = localStorage.getItem("supervisorSession");
        if (!userSessionData) {
          throw new Error("No supervisor session found");
        }

        const userSession: UserSession = JSON.parse(userSessionData);
        
        const response = await fetch(`/api/assignments/view`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            id: assignment.id.toString(),
            supervisor_id: parseInt(userSession.id)
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.success && data.data) {
          setAssignmentDetail(data.data);
        } else {
          throw new Error(data.message || "Failed to fetch assignment details");
        }
      } catch (error) {
        console.error("Error fetching assignment details:", error);
        setError(error instanceof Error ? error.message : "An error occurred while fetching assignment details.");
      } finally {
        setLoading(false);
      }
    };

    fetchAssignmentDetails();
  }, [assignment.id]);

  // Clear error after timeout
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const getStatusBadge = (isActive: boolean, dueDate: string) => {
    const now = new Date();
    const due = new Date(dueDate);
    
    if (!isActive) {
      return <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 border border-gray-300">Inactive</span>;
    }
    
    if (due < now) {
      return <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 border border-red-300">Overdue</span>;
    }
    
    return <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-green-300">Active</span>;
  };

  const getSubmissionStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300' },
      graded: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' },
      submitted: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text} border ${config.border}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleGradeSubmission = (submission: Submission) => {
    setGradingSubmission(submission);
  };

  const handleCloseGrading = () => {
    setGradingSubmission(null);
  };

  const handleGradingSuccess = () => {
    // Refresh assignment details to get updated submission data
    const fetchAssignmentDetails = async () => {
      try {
        setError(null);

        const userSessionData = localStorage.getItem("supervisorSession");
        if (!userSessionData) {
          throw new Error("No supervisor session found");
        }

        const userSession: UserSession = JSON.parse(userSessionData);
        
        const response = await fetch(`/api/assignments/view`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            id: assignment.id.toString(),
            supervisor_id: parseInt(userSession.id)
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.success && data.data) {
          setAssignmentDetail(data.data);
          
          // Update selected submission with new data if it exists
          if (selectedSubmission) {
            const updatedSubmission = data.data.submissions.find(
              (sub: Submission) => sub.id === selectedSubmission.id
            );
            if (updatedSubmission) {
              setSelectedSubmission(updatedSubmission);
            }
          }
        }
      } catch (error) {
        console.error("Error refreshing assignment details:", error);
      }
    };

    fetchAssignmentDetails();
  };

  // Auto-select first submission when switching to submissions tab
  useEffect(() => {
    if (activeTab === 'submissions' && assignmentDetail && assignmentDetail.submissions && assignmentDetail.submissions.length > 0 && !selectedSubmission) {
      setSelectedSubmission(assignmentDetail.submissions[0]);
    }
  }, [activeTab, assignmentDetail, selectedSubmission]);

  if (loading) {
    return (
      <>
        {error && <AlertNotification message={error} type="error" />}
        
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 flex items-center justify-center p-4">
          <div className="gradient-border w-full max-w-6xl max-h-[90vh]">
            <div className="glass-effect rounded-2xl overflow-hidden">
              <div className="relative bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-500 p-6 text-white">
                <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-all duration-300 hover:scale-110" type="button">
                  <X size={20} />
                </button>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white/20 rounded-full"><Eye size={28} /></div>
                  <div>
                    <h2 className="text-2xl font-bold">Assignment Details</h2>
                    <p className="text-white/80 text-sm">Loading assignment information...</p>
                  </div>
                </div>
              </div>
              
              <div className="p-8 text-center">
                <div className="animate-spin w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-600">Loading assignment details...</p>
              </div>
            </div>
          </div>
        </div>
        
        <style jsx>{`
          .gradient-border { background: linear-gradient(135deg, #14b8a6 0%, #0891b2 50%, #6366f1 100%); padding: 2px; border-radius: 1rem; }
          .glass-effect { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.18); }
        `}</style>
      </>
    );
  }

  if (!assignmentDetail) {
    return (
      <>
        {error && <AlertNotification message={error} type="error" />}
        
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 flex items-center justify-center p-4">
          <div className="gradient-border w-full max-w-6xl max-h-[90vh]">
            <div className="glass-effect rounded-2xl overflow-hidden">
              <div className="relative bg-gradient-to-r from-red-500 via-pink-500 to-purple-500 p-6 text-white">
                <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-all duration-300 hover:scale-110" type="button">
                  <X size={20} />
                </button>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white/20 rounded-full"><AlertCircle size={28} /></div>
                  <div>
                    <h2 className="text-2xl font-bold">Error</h2>
                    <p className="text-white/80 text-sm">Failed to load assignment details</p>
                  </div>
                </div>
              </div>
              
              <div className="p-8 text-center">
                <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to Load Assignment</h3>
                <p className="text-gray-600 mb-4">{error || "The assignment details could not be loaded."}</p>
                <button 
                  onClick={onClose}
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <style jsx>{`
          .gradient-border { background: linear-gradient(135deg, #14b8a6 0%, #0891b2 50%, #6366f1 100%); padding: 2px; border-radius: 1rem; }
          .glass-effect { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.18); }
        `}</style>
      </>
    );
  }

  return (
    <>
      <style jsx>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scale-in { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        .animate-fade-in { animation: fade-in 0.4s ease-out; }
        .animate-scale-in { animation: scale-in 0.3s ease-out; }
        .gradient-border { background: linear-gradient(135deg, #14b8a6 0%, #0891b2 50%, #6366f1 100%); padding: 2px; border-radius: 1rem; }
        .glass-effect { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.18); }
        .floating { animation: float 3s ease-in-out infinite; }
      `}</style>

      {error && <AlertNotification message={error} type="error" />}
      
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 flex items-center justify-center p-4 animate-fade-in">
        <div className="gradient-border w-full max-w-6xl max-h-[90vh] animate-scale-in">
          <div className="glass-effect rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="relative bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-500 p-6 text-white">
              <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-all duration-300 hover:scale-110 z-10" type="button">
                <X size={20} />
              </button>
              <div className="pr-16"> {/* Added right padding to avoid close button collision */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="p-3 bg-white/20 rounded-full floating"><BookOpen size={28} /></div>
                    <div className="min-w-0 flex-1">
                      <h2 className="text-2xl font-bold truncate">{assignmentDetail.title}</h2>
                      <p className="text-white/80 text-sm">Assignment Details & Analytics</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                    {getStatusBadge(assignmentDetail.is_active, assignmentDetail.due_date)}
                    <div className="text-right">
                      <p className="text-sm text-white/80">Due Date</p>
                      <p className="font-semibold text-sm">{formatDateTime(assignmentDetail.due_date)}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Stats Overview */}
              <div className={`grid gap-4 mt-6 ${assignmentDetail.assignment_type === 'group' ? 'grid-cols-5' : 'grid-cols-4'}`}>
                <div className="bg-white/10 rounded-lg p-3 text-center">
                  <Users size={20} className="mx-auto mb-1" />
                  <p className="text-2xl font-bold">{assignmentDetail.total_invitations}</p>
                  <p className="text-sm text-white/80">Students Invited</p>
                </div>
                {assignmentDetail.assignment_type === 'group' && assignmentDetail.group_stats && (
                  <div className="bg-white/10 rounded-lg p-3 text-center">
                    <Users size={20} className="mx-auto mb-1" />
                    <p className="text-2xl font-bold">{assignmentDetail.group_stats.total_groups}</p>
                    <p className="text-sm text-white/80">Groups</p>
                  </div>
                )}
                <div className="bg-white/10 rounded-lg p-3 text-center">
                  <FileText size={20} className="mx-auto mb-1" />
                  <p className="text-2xl font-bold">{assignmentDetail.total_submissions}</p>
                  <p className="text-sm text-white/80">Submissions</p>
                </div>
                <div className="bg-white/10 rounded-lg p-3 text-center">
                  <Award size={20} className="mx-auto mb-1" />
                  <p className="text-2xl font-bold">{assignmentDetail.max_score}</p>
                  <p className="text-sm text-white/80">Max Score</p>
                </div>
                <div className="bg-white/10 rounded-lg p-3 text-center">
                  <CheckCircle size={20} className="mx-auto mb-1" />
                  <p className="text-2xl font-bold">{assignmentDetail.graded_submissions}</p>
                  <p className="text-sm text-white/80">Graded</p>
                </div>
              </div>
            </div>
            
            {/* Content */}
            <div className="flex flex-col h-[calc(90vh-240px)]">
              {/* Tab Navigation */}
              <div className="flex border-b border-gray-200 bg-gray-50">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`px-6 py-3 font-medium text-sm transition-colors ${
                    activeTab === 'overview'
                      ? 'text-teal-600 border-b-2 border-teal-600 bg-white'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('submissions')}
                  className={`px-6 py-3 font-medium text-sm transition-colors ${
                    activeTab === 'submissions'
                      ? 'text-teal-600 border-b-2 border-teal-600 bg-white'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Submissions ({assignmentDetail.total_submissions})
                </button>
                <button
                  onClick={() => setActiveTab('students')}
                  className={`px-6 py-3 font-medium text-sm transition-colors ${
                    activeTab === 'students'
                      ? 'text-teal-600 border-b-2 border-teal-600 bg-white'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Students ({assignmentDetail.total_invitations})
                </button>
                {assignmentDetail.assignment_type === 'group' && (
                  <button
                    onClick={() => setActiveTab('groups')}
                    className={`px-6 py-3 font-medium text-sm transition-colors ${
                      activeTab === 'groups'
                        ? 'text-teal-600 border-b-2 border-teal-600 bg-white'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Groups ({assignmentDetail.group_stats?.total_groups || 0})
                  </button>
                )}
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {activeTab === 'overview' && (
                  <div className="space-y-6 animate-fade-in">
                    {/* Assignment Info */}
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                          <div 
                            className="prose prose-sm max-w-none text-gray-700 bg-gray-50 rounded-lg p-4"
                            dangerouslySetInnerHTML={{ __html: assignmentDetail.description }}
                          />
                        </div>
                        
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">Instructions</h3>
                          <div 
                            className="prose prose-sm max-w-none text-gray-700 bg-gray-50 rounded-lg p-4"
                            dangerouslySetInnerHTML={{ __html: assignmentDetail.instructions }}
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="bg-white border border-gray-200 rounded-lg p-4">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">Assignment Details</h3>
                          <dl className="space-y-3">
                            <div className="flex justify-between items-center">
                              <dt className="text-sm font-medium text-gray-500">Status</dt>
                              <dd>{getStatusBadge(assignmentDetail.is_active, assignmentDetail.due_date)}</dd>
                            </div>
                            <div className="flex justify-between items-center">
                              <dt className="text-sm font-medium text-gray-500">Assignment Type</dt>
                              <dd className="text-sm text-gray-900 font-semibold">
                                {assignmentDetail.assignment_type === 'group' ? 'Group Assignment' : 'Individual Assignment'}
                              </dd>
                            </div>
                            {assignmentDetail.assignment_type === 'group' && (
                              <div className="flex justify-between items-center">
                                <dt className="text-sm font-medium text-gray-500">Max Group Size</dt>
                                <dd className="text-sm text-gray-900 font-semibold">{assignmentDetail.max_group_size} students</dd>
                              </div>
                            )}
                            <div className="flex justify-between items-center">
                              <dt className="text-sm font-medium text-gray-500">Maximum Score</dt>
                              <dd className="text-sm text-gray-900 font-semibold">{assignmentDetail.max_score} points</dd>
                            </div>
                            <div className="flex justify-between items-center">
                              <dt className="text-sm font-medium text-gray-500">Average Score</dt>
                              <dd className="text-sm text-gray-900 font-semibold">
                                {(assignmentDetail.average_score && assignmentDetail.average_score > 0) ? `${assignmentDetail.average_score.toFixed(1)} points` : 'No grades yet'}
                              </dd>
                            </div>
                            <div className="flex justify-between items-center">
                              <dt className="text-sm font-medium text-gray-500">Created</dt>
                              <dd className="text-sm text-gray-900">{formatDate(assignmentDetail.created_at)}</dd>
                            </div>
                            <div className="flex justify-between items-center">
                              <dt className="text-sm font-medium text-gray-500">Creator</dt>
                              <dd className="text-sm text-gray-900">{assignmentDetail.creator_name}</dd>
                            </div>
                            {assignmentDetail.updated_at !== assignmentDetail.created_at && (
                              <>
                                <div className="flex justify-between items-center">
                                  <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                                  <dd className="text-sm text-gray-900">{formatDate(assignmentDetail.updated_at)}</dd>
                                </div>
                                <div className="flex justify-between items-center">
                                  <dt className="text-sm font-medium text-gray-500">Updated By</dt>
                                  <dd className="text-sm text-gray-900">{assignmentDetail.updater_name}</dd>
                                </div>
                              </>
                            )}
                          </dl>
                        </div>

                        {assignmentDetail.attachments && assignmentDetail.attachments.length > 0 && (
                          <div className="bg-white border border-gray-200 rounded-lg p-4">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Attachments</h3>
                            <div className="space-y-2">
                              {assignmentDetail.attachments.map((attachment, index) => (
                                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                  <div className="flex items-center gap-2">
                                    <FileText size={16} className="text-gray-500" />
                                    <span className="text-sm text-gray-700">Attachment {index + 1}</span>
                                  </div>
                                  <a 
                                    href={attachment} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-teal-600 hover:text-teal-700 transition-colors"
                                  >
                                    <Download size={16} />
                                  </a>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'submissions' && (
                  <div className="animate-fade-in h-full">
                    {assignmentDetail.submissions.length > 0 ? (
                      <div className="flex gap-6 h-[calc(90vh-280px)]">
                        {/* Left Panel - Submissions List */}
                        <div className="w-1/3 bg-white border border-gray-200 rounded-lg overflow-hidden">
                          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                            <h3 className="font-semibold text-gray-900">Submissions ({assignmentDetail.submissions.length})</h3>
                          </div>
                          <div className="overflow-y-auto h-full">
                            {assignmentDetail.submissions.map((submission) => (
                              <div
                                key={submission.id}
                                onClick={() => setSelectedSubmission(submission)}
                                className={`p-4 border-b border-gray-100 cursor-pointer transition-colors hover:bg-gray-50 ${
                                  selectedSubmission?.id === submission.id ? 'bg-teal-50 border-l-4 border-l-teal-500' : ''
                                }`}
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <User size={16} className="text-gray-500 flex-shrink-0" />
                                    <div className="min-w-0 flex-1">
                                      <h4 className="font-medium text-gray-900 text-sm truncate">
                                        {assignmentDetail.assignment_type === 'group' && submission.group_name ? 
                                          `${submission.group_name} (${submission.student_name})` : 
                                          submission.student_name
                                        }
                                      </h4>
                                      <p className="text-xs text-gray-500 truncate">{submission.student_email}</p>
                                    </div>
                                  </div>
                                  <div className="flex-shrink-0 ml-2">
                                    {getSubmissionStatusBadge(submission.status)}
                                  </div>
                                </div>
                                
                                <div className="flex items-center justify-between text-xs text-gray-500">
                                  <span>{formatDateTime(submission.submitted_at)}</span>
                                  {submission.score !== null && (
                                    <span className="font-medium text-teal-600">
                                      {submission.score}/{assignmentDetail.max_score}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Right Panel - Selected Submission Details */}
                        <div className="flex-1 bg-white border border-gray-200 rounded-lg overflow-hidden">
                          {selectedSubmission ? (
                            <div className="h-full flex flex-col">
                              {/* Header */}
                              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                                <div className="flex items-start justify-between">
                                  <div className="flex items-center gap-3">
                                    <User size={20} className="text-gray-500" />
                                    <div>
                                      <h4 className="font-semibold text-gray-900">{selectedSubmission.student_name}</h4>
                                      <p className="text-sm text-gray-500">{selectedSubmission.student_email}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    {getSubmissionStatusBadge(selectedSubmission.status)}
                                    <div className="text-right text-sm">
                                      <p className="text-gray-500">Submitted</p>
                                      <p className="text-gray-900">{formatDateTime(selectedSubmission.submitted_at)}</p>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Content */}
                              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                {selectedSubmission.submission_text && (
                                  <div>
                                    <h5 className="text-base font-semibold text-gray-900 mb-3">Submission Content</h5>
                                    <div 
                                      className="prose prose-sm max-w-none text-gray-700 bg-gray-50 rounded-lg p-4 border border-gray-200"
                                      dangerouslySetInnerHTML={{ __html: selectedSubmission.submission_text }}
                                    />
                                  </div>
                                )}
                                
                                {selectedSubmission.attachments && selectedSubmission.attachments.length > 0 && (
                                  <div>
                                    <h5 className="text-base font-semibold text-gray-900 mb-3">Attachments ({selectedSubmission.attachments.length})</h5>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                      {selectedSubmission.attachments.map((attachment, idx) => (
                                        <a 
                                          key={idx}
                                          href={attachment} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                                        >
                                          <FileText size={20} className="text-gray-500" />
                                          <div>
                                            <p className="text-sm font-medium text-gray-900">Attachment {idx + 1}</p>
                                            <p className="text-xs text-gray-500">Click to view</p>
                                          </div>
                                        </a>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                
                                {selectedSubmission.feedback && (
                                  <div>
                                    <h5 className="text-base font-semibold text-gray-900 mb-3">Feedback</h5>
                                    <div 
                                      className="prose prose-sm max-w-none text-gray-700 bg-blue-50 rounded-lg p-4 border border-blue-200"
                                      dangerouslySetInnerHTML={{ __html: selectedSubmission.feedback }}
                                    />
                                  </div>
                                )}
                              </div>

                              {/* Footer - Grading Actions */}
                              <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
                                {selectedSubmission.score !== null ? (
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                      <div className="flex items-center gap-2">
                                        <Star size={18} className="text-yellow-500" />
                                        <span className="text-sm text-gray-600">Score:</span>
                                        <span className="text-lg font-bold text-teal-600">
                                          {selectedSubmission.score} / {assignmentDetail.max_score}
                                        </span>
                                      </div>
                                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                        selectedSubmission.status === 'approved' ? 'bg-green-100 text-green-800' :
                                        selectedSubmission.status === 'changes_required' ? 'bg-yellow-100 text-yellow-800' :
                                        selectedSubmission.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                        'bg-gray-100 text-gray-800'
                                      }`}>
                                        {selectedSubmission.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      {selectedSubmission.graded_at && (
                                        <span className="text-xs text-gray-500">Graded {formatDateTime(selectedSubmission.graded_at)}</span>
                                      )}
                                      <button
                                        onClick={() => setGradingSubmission(selectedSubmission)}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                                      >
                                        <Edit size={16} />
                                        Edit Grade
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-gray-600">
                                      <Clock size={18} />
                                      <span className="font-medium">This submission hasn't been graded yet</span>
                                    </div>
                                    <button
                                      onClick={() => setGradingSubmission(selectedSubmission)}
                                      className="inline-flex items-center gap-2 px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium"
                                    >
                                      <Star size={16} />
                                      Grade Submission
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="h-full flex items-center justify-center">
                              <div className="text-center">
                                <FileText size={48} className="text-gray-300 mx-auto mb-3" />
                                <h3 className="text-lg font-medium text-gray-900 mb-1">Select a Submission</h3>
                                <p className="text-gray-500">Choose a submission from the list to view details</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <FileText size={48} className="text-gray-300 mx-auto mb-3" />
                        <h3 className="text-lg font-medium text-gray-900 mb-1">No Submissions Yet</h3>
                        <p className="text-gray-500">Students haven't submitted their assignments yet.</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'students' && (
                  <div className="animate-fade-in">
                    {assignmentDetail.invitations && assignmentDetail.invitations.length > 0 ? (
                      <div className="space-y-3">
                        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <h4 className="text-sm font-medium text-blue-800">Student Invitation Summary</h4>
                          <p className="text-sm text-blue-600 mt-1">
                            {assignmentDetail.total_invitations} students invited • {assignmentDetail.accepted_invitations} accepted
                          </p>
                        </div>
                        {assignmentDetail.invitations.map((invitation) => (
                          <div key={invitation.id} className="bg-white border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <User size={20} className="text-gray-500" />
                                <div>
                                  <h4 className="font-medium text-gray-900">{invitation.student_name}</h4>
                                  <p className="text-sm text-gray-500">{invitation.student_email}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                  invitation.status === 'accepted' 
                                    ? 'bg-green-100 text-green-800 border border-green-300' 
                                    : invitation.status === 'pending'
                                    ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                                    : 'bg-gray-100 text-gray-800 border border-gray-300'
                                }`}>
                                  {invitation.status.charAt(0).toUpperCase() + invitation.status.slice(1)}
                                </span>
                                <div className="text-right text-sm">
                                  <p className="text-gray-500">Invited</p>
                                  <p className="text-gray-900">{formatDateTime(invitation.invited_at)}</p>
                                </div>
                              </div>
                            </div>
                            {invitation.responded_at && (
                              <div className="mt-3 pt-3 border-t border-gray-200">
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                  <CheckCircle size={14} />
                                  <span>Responded {formatDateTime(invitation.responded_at)}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Users size={48} className="text-gray-300 mx-auto mb-3" />
                        <h3 className="text-lg font-medium text-gray-900 mb-1">No Students Invited</h3>
                        <p className="text-gray-500">No students have been invited to this assignment yet.</p>
                        <p className="text-sm text-gray-400 mt-2">Students are automatically invited when creating assignments.</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'groups' && assignmentDetail.assignment_type === 'group' && (
                  <div className="animate-fade-in space-y-6">
                    {/* Group Statistics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                        <Users size={24} className="mx-auto mb-2 text-teal-500" />
                        <p className="text-2xl font-bold text-gray-900">{assignmentDetail.group_stats?.total_groups || 0}</p>
                        <p className="text-sm text-gray-500">Total Groups</p>
                      </div>
                      <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                        <CheckCircle size={24} className="mx-auto mb-2 text-green-500" />
                        <p className="text-2xl font-bold text-gray-900">{assignmentDetail.group_stats?.groups_with_submissions || 0}</p>
                        <p className="text-sm text-gray-500">Groups Submitted</p>
                      </div>
                      <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                        <User size={24} className="mx-auto mb-2 text-blue-500" />
                        <p className="text-2xl font-bold text-gray-900">{assignmentDetail.group_stats?.students_in_groups || 0}</p>
                        <p className="text-sm text-gray-500">Students in Groups</p>
                      </div>
                      <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                        <AlertCircle size={24} className="mx-auto mb-2 text-amber-500" />
                        <p className="text-2xl font-bold text-gray-900">{assignmentDetail.group_stats?.students_without_groups || 0}</p>
                        <p className="text-sm text-gray-500">Students Without Groups</p>
                      </div>
                    </div>

                    {/* Manage Groups Button */}
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">Groups</h3>
                      <button
                        onClick={() => setShowManageGroups(true)}
                        className="bg-teal-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-teal-700 transition-colors flex items-center gap-2"
                      >
                        <Settings size={16} />
                        Manage Groups
                      </button>
                    </div>

                    {/* Groups List */}
                    {assignmentDetail.groups && assignmentDetail.groups.length > 0 ? (
                      <div className="space-y-4">
                        <div className="grid gap-4">
                          {assignmentDetail.groups.map((group) => (
                            <div key={group.id} className="bg-white border border-gray-200 rounded-lg p-6">
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                  <div className="p-2 bg-teal-100 rounded-full">
                                    <Users size={20} className="text-teal-600" />
                                  </div>
                                  <div>
                                    <h4 className="text-lg font-semibold text-gray-900">{group.group_name}</h4>
                                    <p className="text-sm text-gray-500">{group.member_count} members</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  {group.has_submission ? (
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-green-300">
                                      <CheckCircle size={14} className="mr-1" />
                                      Submitted
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 border border-gray-300">
                                      <Clock size={14} className="mr-1" />
                                      Pending
                                    </span>
                                  )}
                                  <div className="text-right text-sm">
                                    <p className="text-gray-500">Created</p>
                                    <p className="text-gray-900">{formatDateTime(group.created_at)}</p>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="border-t border-gray-200 pt-4">
                                <h5 className="text-sm font-semibold text-gray-900 mb-3">Group Members</h5>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {group.members.map((member, index) => (
                                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                      <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
                                        <User size={16} className="text-teal-600" />
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-gray-900 truncate">
                                          {member.first_name} {member.last_name}
                                        </p>
                                        <p className="text-xs text-gray-500 truncate">{member.email}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Users size={48} className="text-gray-300 mx-auto mb-3" />
                        <h3 className="text-lg font-medium text-gray-900 mb-1">No Groups Yet</h3>
                        <p className="text-gray-500">Students haven't formed groups for this assignment yet.</p>
                        {assignmentDetail.allow_students_create_groups && (
                          <p className="text-sm text-gray-400 mt-2">Students can create their own groups.</p>
                        )}
                        <button
                          onClick={() => setShowManageGroups(true)}
                          className="mt-4 bg-teal-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-teal-700 transition-colors inline-flex items-center gap-2"
                        >
                          <Settings size={16} />
                          Create First Group
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grading Modal */}
      {gradingSubmission && (
        <GradeSubmission
          submission={gradingSubmission}
          assignment={assignment}
          onClose={handleCloseGrading}
          onSuccess={handleGradingSuccess}
        />
      )}

      {/* Manage Groups Modal */}
      {showManageGroups && assignmentDetail && (
        <ManageGroups
          assignment={{
            id: assignmentDetail.id,
            title: assignmentDetail.title,
            max_group_size: assignmentDetail.max_group_size || 4,
            allow_students_create_groups: assignmentDetail.allow_students_create_groups || false
          }}
          groups={assignmentDetail.groups || []}
          onClose={() => setShowManageGroups(false)}
          onSuccess={() => {
            // Refresh assignment details to get updated group data
            const fetchAssignmentDetails = async () => {
              try {
                const userSessionData = localStorage.getItem("supervisorSession");
                if (!userSessionData) return;

                const userSession = JSON.parse(userSessionData);
                
                const response = await fetch(`/api/assignments/view`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ 
                    id: assignment.id.toString(),
                    supervisor_id: parseInt(userSession.id)
                  })
                });

                if (response.ok) {
                  const data = await response.json();
                  if (data.success && data.data) {
                    setAssignmentDetail(data.data);
                  }
                }
              } catch (error) {
                console.error("Error refreshing assignment details:", error);
              }
            };

            fetchAssignmentDetails();
          }}
        />
      )}
    </>
  );
};

export default ViewAssignment;