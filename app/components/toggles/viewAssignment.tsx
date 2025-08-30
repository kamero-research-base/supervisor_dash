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
  const [activeTab, setActiveTab] = useState<'overview' | 'submissions' | 'students' | 'groups' | 'download'>('overview');
  const [gradingSubmission, setGradingSubmission] = useState<Submission | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [showManageGroups, setShowManageGroups] = useState(false);
  
  // Download states
  const [selectedColumns, setSelectedColumns] = useState<string[]>([
    'student_id', 'score'
  ]);
  const [fileFormat, setFileFormat] = useState<'xlsx' | 'pdf'>('xlsx');
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedColor, setSelectedColor] = useState('#009688'); // Default brand color
  const [showCustomColorPicker, setShowCustomColorPicker] = useState(false);
  const [customHue, setCustomHue] = useState(174); // Default hue for brand color #009688
  const [customSaturation, setCustomSaturation] = useState(100);
  const [customBrightness, setCustomBrightness] = useState(53);
  
  // Student filtering states
  const [studentFilters, setStudentFilters] = useState({
    searchTerm: '',
    submissionStatus: 'all', // all, submitted, not_submitted, graded, pending
    scoreRange: { min: 0, max: 100, enabled: false },
    dateRange: { start: '', end: '', enabled: false },
    groupFilter: 'all', // all, has_group, no_group, specific_group
    specificGroup: '',
    sortBy: 'name', // name, email, score, submission_date
    sortOrder: 'asc' // asc, desc
  });
  const [filteredStudents, setFilteredStudents] = useState<any[]>([]);
  
  // Color conversion utilities
  const hsvToHex = (h: number, s: number, v: number): string => {
    const c = (v / 100) * (s / 100);
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = (v / 100) - c;
    
    let r, g, b;
    if (h >= 0 && h < 60) {
      r = c; g = x; b = 0;
    } else if (h >= 60 && h < 120) {
      r = x; g = c; b = 0;
    } else if (h >= 120 && h < 180) {
      r = 0; g = c; b = x;
    } else if (h >= 180 && h < 240) {
      r = 0; g = x; b = c;
    } else if (h >= 240 && h < 300) {
      r = x; g = 0; b = c;
    } else {
      r = c; g = 0; b = x;
    }
    
    const red = Math.round((r + m) * 255);
    const green = Math.round((g + m) * 255);
    const blue = Math.round((b + m) * 255);
    
    return `#${red.toString(16).padStart(2, '0')}${green.toString(16).padStart(2, '0')}${blue.toString(16).padStart(2, '0')}`;
  };

  const hexToHsv = (hex: string): { h: number, s: number, v: number } => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const diff = max - min;

    let h = 0;
    if (diff !== 0) {
      if (max === r) {
        h = ((g - b) / diff) % 6;
      } else if (max === g) {
        h = (b - r) / diff + 2;
      } else {
        h = (r - g) / diff + 4;
      }
    }
    h = Math.round(h * 60);
    if (h < 0) h += 360;

    const s = max === 0 ? 0 : Math.round((diff / max) * 100);
    const v = Math.round(max * 100);

    return { h, s, v };
  };

  // Student filtering function
  const applyStudentFilters = () => {
    if (!assignmentDetail) {
      setFilteredStudents([]);
      return;
    }

    // Merge submissions with invitation data to get complete student info
    const allStudents = assignmentDetail.invitations?.map(invitation => {
      const submission = assignmentDetail.submissions?.find(sub => sub.student_id === invitation.student_id);
      return {
        // Base invitation data
        id: invitation.id,
        student_id: invitation.student_id,
        student_name: invitation.student_name,
        student_email: invitation.student_email,
        invitation_status: invitation.status,
        invited_at: invitation.invited_at,
        responded_at: invitation.responded_at,
        
        // Submission data (with safe defaults)
        submission_id: submission?.id,
        score: submission?.score || null,
        status: submission?.status || 'not_submitted',
        submitted_at: submission?.submitted_at || null,
        graded_at: submission?.graded_at || null,
        feedback: submission?.feedback || null,
        group_name: submission?.group_name || null,
        submission_text: submission?.submission_text || null,
        attachments: submission?.attachments || []
      };
    }) || [];

    let filtered = [...allStudents];

    // Search by name or email
    if (studentFilters.searchTerm) {
      const searchLower = studentFilters.searchTerm.toLowerCase();
      filtered = filtered.filter(student => 
        student.student_name?.toLowerCase().includes(searchLower) ||
        student.student_email?.toLowerCase().includes(searchLower)
      );
    }

    // Filter by status (includes invitation status and submission status)
    if (studentFilters.submissionStatus !== 'all') {
      filtered = filtered.filter(student => {
        switch (studentFilters.submissionStatus) {
          case 'invite_accepted':
            return student.invitation_status === 'accepted';
          case 'invite_pending':
            return student.invitation_status === 'pending' || !student.invitation_status;
          case 'not_submitted':
            return student.status === 'not_submitted';
          case 'approved':
            return student.status === 'approved';
          case 'pending':
            return student.status === 'pending';
          default:
            return true;
        }
      });
    }

    // Filter by score range
    if (studentFilters.scoreRange.enabled) {
      filtered = filtered.filter(student => {
        const score = student.score || 0;
        return score >= studentFilters.scoreRange.min && score <= studentFilters.scoreRange.max;
      });
    }

    // Filter by date range
    if (studentFilters.dateRange.enabled && studentFilters.dateRange.start && studentFilters.dateRange.end) {
      const startDate = new Date(studentFilters.dateRange.start);
      const endDate = new Date(studentFilters.dateRange.end);
      filtered = filtered.filter(student => {
        if (!student.submitted_at) return false;
        const submitDate = new Date(student.submitted_at);
        return submitDate >= startDate && submitDate <= endDate;
      });
    }

    // Filter by group membership
    if (studentFilters.groupFilter !== 'all' && assignmentDetail.assignment_type === 'group') {
      filtered = filtered.filter(student => {
        switch (studentFilters.groupFilter) {
          case 'has_group':
            return student.group_name;
          case 'no_group':
            return !student.group_name;
          case 'specific_group':
            return student.group_name === studentFilters.specificGroup;
          default:
            return true;
        }
      });
    }

    // Sort results
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (studentFilters.sortBy) {
        case 'name':
          aValue = a.student_name || '';
          bValue = b.student_name || '';
          break;
        case 'email':
          aValue = a.student_email || '';
          bValue = b.student_email || '';
          break;
        case 'score':
          aValue = a.score || 0;
          bValue = b.score || 0;
          break;
        case 'submission_date':
          aValue = a.submitted_at ? new Date(a.submitted_at).getTime() : 0;
          bValue = b.submitted_at ? new Date(b.submitted_at).getTime() : 0;
          break;
        default:
          aValue = a.student_name || '';
          bValue = b.student_name || '';
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return studentFilters.sortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      } else {
        return studentFilters.sortOrder === 'asc' 
          ? (aValue as number) - (bValue as number)
          : (bValue as number) - (aValue as number);
      }
    });

    setFilteredStudents(filtered);
  };

  // Apply filters whenever they change
  useEffect(() => {
    applyStudentFilters();
  }, [studentFilters, assignmentDetail]);
  
  // Color palette for PDF styling
  const colorPalette = [
    { name: 'Brand Teal', color: '#009688' },
    { name: 'Deep Blue', color: '#1976D2' },
    { name: 'Purple', color: '#7B1FA2' },
    { name: 'Indigo', color: '#303F9F' },
    { name: 'Green', color: '#388E3C' },
    { name: 'Orange', color: '#F57C00' },
    { name: 'Red', color: '#D32F2F' },
    { name: 'Pink', color: '#C2185B' },
    { name: 'Cyan', color: '#00ACC1' },
    { name: 'Brown', color: '#5D4037' },
    { name: 'Blue Grey', color: '#455A64' },
    { name: 'Amber', color: '#FFA000' },
    { name: 'Deep Purple', color: '#512DA8' },
    { name: 'Light Green', color: '#689F38' },
    { name: 'Deep Orange', color: '#E64A19' },
    { name: 'Lime', color: '#AFB42B' },
    { name: 'Teal Dark', color: '#00695C' },
    { name: 'Blue Dark', color: '#1565C0' },
    { name: 'Purple Dark', color: '#6A1B9A' },
    { name: 'Green Dark', color: '#2E7D32' }
  ];
  
  // Available columns for download
  const availableColumns = [
    { id: 'student_name', label: 'Student Name', description: 'Full name of the student' },
    { id: 'student_email', label: 'Student Email', description: 'Email address of the student' },
    { id: 'student_id', label: 'Student ID', description: 'Unique student identifier' },
    { id: 'invite_status', label: 'Invite Status', description: 'Whether student accepted or is pending invitation' },
    { id: 'score', label: 'Score', description: 'Assignment score or grade' },
    { id: 'percentage', label: 'Percentage', description: 'Score as percentage' },
    { id: 'status', label: 'Status', description: 'Submission status (submitted, graded, etc.)' },
    { id: 'submitted_at', label: 'Submission Date', description: 'When the assignment was submitted' },
    { id: 'graded_at', label: 'Graded Date', description: 'When the assignment was graded' },
    { id: 'feedback', label: 'Feedback', description: 'Instructor feedback' },
    { id: 'group_name', label: 'Group Name', description: 'Name of the group (for group assignments)' },
  ];

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

  // Column selection handlers

  // Required columns that can't be removed
  const requiredColumns = ['student_id', 'score'];
  
  // Get optional columns (all columns except required ones)
  const getOptionalColumns = () => {
    return availableColumns.filter(col => !requiredColumns.includes(col.id));
  };

  // Get ordered columns with student_id first, score last, and optional columns in between
  // Special rule: percentage always comes immediately after score when both are selected
  const getOrderedColumns = () => {
    const optionalSelected = selectedColumns.filter(col => !requiredColumns.includes(col));
    
    // Handle percentage column special positioning
    if (optionalSelected.includes('percentage')) {
      const otherOptional = optionalSelected.filter(col => col !== 'percentage');
      return ['student_id', ...otherOptional, 'score', 'percentage'];
    }
    
    return ['student_id', ...optionalSelected, 'score'];
  };

  const handleOptionalColumnToggle = (columnId: string) => {
    if (requiredColumns.includes(columnId)) return; // Can't toggle required columns
    
    setSelectedColumns(prev => {
      if (prev.includes(columnId)) {
        return prev.filter(id => id !== columnId);
      } else {
        return [...prev, columnId];
      }
    });
  };

  const handleSelectAllColumns = () => {
    setSelectedColumns([...requiredColumns, ...getOptionalColumns().map(col => col.id)]);
  };

  const handleDeselectAllColumns = () => {
    setSelectedColumns([...requiredColumns]); // Keep only required columns
  };

  // Drag and drop handlers for column reordering
  const handleDragStart = (e: React.DragEvent, columnId: string) => {
    if (requiredColumns.includes(columnId) || columnId === 'percentage') {
      e.preventDefault(); // Don't allow dragging required columns or percentage
      return;
    }
    e.dataTransfer.setData('text/plain', columnId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetColumnId: string) => {
    e.preventDefault();
    const draggedColumnId = e.dataTransfer.getData('text/plain');
    
    if (requiredColumns.includes(draggedColumnId) || requiredColumns.includes(targetColumnId) || 
        draggedColumnId === 'percentage' || targetColumnId === 'percentage') {
      return; // Don't allow reordering required columns or percentage
    }

    setSelectedColumns(prev => {
      const reorderableCols = prev.filter(col => !requiredColumns.includes(col) && col !== 'percentage');
      const draggedIndex = reorderableCols.indexOf(draggedColumnId);
      const targetIndex = reorderableCols.indexOf(targetColumnId);
      
      if (draggedIndex === -1 || targetIndex === -1) return prev;
      
      const newReorderableCols = [...reorderableCols];
      const [draggedItem] = newReorderableCols.splice(draggedIndex, 1);
      newReorderableCols.splice(targetIndex, 0, draggedItem);
      
      // Reconstruct the full array maintaining percentage position
      const hasPercentage = prev.includes('percentage');
      if (hasPercentage) {
        return [...requiredColumns, ...newReorderableCols, 'percentage'];
      } else {
        return [...requiredColumns, ...newReorderableCols];
      }
    });
  };

  // Download handler
  const handleDownloadMarks = async () => {
    if (selectedColumns.length === 0) {
      setError('Please select at least one column to download');
      return;
    }

    try {
      setIsDownloading(true);
      setError(null);

      const userSessionData = localStorage.getItem("supervisorSession");
      if (!userSessionData) {
        throw new Error("No supervisor session found");
      }

      const userSession: UserSession = JSON.parse(userSessionData);

      const response = await fetch('/api/assignments/download-marks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assignment_id: assignment.id,
          supervisor_id: parseInt(userSession.id),
          columns: getOrderedColumns(),
          format: fileFormat,
          color: selectedColor, // Include selected color for PDF styling
          filtered_students: filteredStudents.map(s => s.student_id) // Send only filtered student IDs
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to download marks');
      }

      // Handle file download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${assignment.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_marks.${fileFormat}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      // Show success message
      setError(null);
      // Could add a success state here if needed

    } catch (error) {
      console.error('Error downloading marks:', error);
      setError(error instanceof Error ? error.message : 'Failed to download marks');
    } finally {
      setIsDownloading(false);
    }
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
          <div className="bg-gradient-to-br from-teal-500 via-blue-500 to-indigo-500 p-0.5 rounded-2xl w-full max-w-6xl max-h-[90vh]">
            <div className="bg-white/95 backdrop-blur-lg border border-white/20 rounded-2xl overflow-hidden">
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
        
      </>
    );
  }

  if (!assignmentDetail) {
    return (
      <>
        {error && <AlertNotification message={error} type="error" />}
        
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-teal-500 via-blue-500 to-indigo-500 p-0.5 rounded-2xl w-full max-w-6xl max-h-[90vh]">
            <div className="bg-white/95 backdrop-blur-lg border border-white/20 rounded-2xl overflow-hidden">
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
        
      </>
    );
  }

  return (
    <>
      <div className="fixed inset-0 bg-gray-900 bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-90vh overflow-hidden z-50">
          <div>
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
            <div className="flex flex-col h-[calc(90vh-240px)] bg-white">
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
                <button
                  onClick={() => setActiveTab('download')}
                  className={`px-6 py-3 font-medium text-sm transition-colors ${
                    activeTab === 'download'
                      ? 'text-teal-600 border-b-2 border-teal-600 bg-white'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Download size={16} className="inline mr-2" />
                  Download Marks
                </button>
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-y-auto p-6 bg-white">
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

                {activeTab === 'download' && (
                  <div className="animate-fade-in space-y-6">
                    <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-green-100 rounded-full">
                          <Download size={24} className="text-green-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900 mb-2">Download Student Marks</h3>
                          <p className="text-gray-600 mb-4">
                            Export student marks and assignment data to Excel or PDF format. 
                            Customize which information to include and choose your preferred format.
                          </p>
                          
                          {/* Assignment Info Summary */}
                          <div className="bg-white/80 rounded-lg p-4 mb-6">
                            <h4 className="font-semibold text-gray-900 mb-2">Export Information</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-gray-500">Assignment:</span>
                                <p className="font-medium">{assignmentDetail.title}</p>
                              </div>
                              <div>
                                <span className="text-gray-500">Students:</span>
                                <p className="font-medium">{assignmentDetail.total_invitations} invited</p>
                              </div>
                              <div>
                                <span className="text-gray-500">Submissions:</span>
                                <p className="font-medium">{assignmentDetail.total_submissions} submitted</p>
                              </div>
                              <div>
                                <span className="text-gray-500">Graded:</span>
                                <p className="font-medium">{assignmentDetail.graded_submissions} graded</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Student Filtering */}
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-semibold text-gray-900">Filter Students</h4>
                        <div className="text-sm text-gray-600">
                          {filteredStudents.length} of {assignmentDetail?.invitations?.length || 0} students
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        {/* Search */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Search by Name or Email
                            </label>
                            <input
                              type="text"
                              placeholder="Enter student name or email..."
                              value={studentFilters.searchTerm}
                              onChange={(e) => setStudentFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            />
                          </div>
                          
                          {/* Status */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Status
                            </label>
                            <select
                              value={studentFilters.submissionStatus}
                              onChange={(e) => setStudentFilters(prev => ({ ...prev, submissionStatus: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            >
                              <option value="all">All Students</option>
                              <option value="invite_accepted">Invite Accepted</option>
                              <option value="invite_pending">Invite Pending</option>
                              <option value="not_submitted">Not Submitted</option>
                              <option value="approved">Approved/Graded</option>
                              <option value="pending">Pending Review</option>
                            </select>
                          </div>
                        </div>

                        {/* Score Range Filter */}
                        <div className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <input
                              type="checkbox"
                              id="enableScoreFilter"
                              checked={studentFilters.scoreRange.enabled}
                              onChange={(e) => setStudentFilters(prev => ({
                                ...prev,
                                scoreRange: { ...prev.scoreRange, enabled: e.target.checked }
                              }))}
                              className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                            />
                            <label htmlFor="enableScoreFilter" className="text-sm font-medium text-gray-700">
                              Filter by Score Range
                            </label>
                          </div>
                          
                          {studentFilters.scoreRange.enabled && (
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Minimum Score</label>
                                <input
                                  type="number"
                                  min="0"
                                  max={assignmentDetail?.max_score || 100}
                                  value={studentFilters.scoreRange.min}
                                  onChange={(e) => setStudentFilters(prev => ({
                                    ...prev,
                                    scoreRange: { ...prev.scoreRange, min: parseInt(e.target.value) || 0 }
                                  }))}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Maximum Score</label>
                                <input
                                  type="number"
                                  min="0"
                                  max={assignmentDetail?.max_score || 100}
                                  value={studentFilters.scoreRange.max}
                                  onChange={(e) => setStudentFilters(prev => ({
                                    ...prev,
                                    scoreRange: { ...prev.scoreRange, max: parseInt(e.target.value) || 100 }
                                  }))}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Date Range Filter */}
                        <div className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <input
                              type="checkbox"
                              id="enableDateFilter"
                              checked={studentFilters.dateRange.enabled}
                              onChange={(e) => setStudentFilters(prev => ({
                                ...prev,
                                dateRange: { ...prev.dateRange, enabled: e.target.checked }
                              }))}
                              className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                            />
                            <label htmlFor="enableDateFilter" className="text-sm font-medium text-gray-700">
                              Filter by Submission Date Range
                            </label>
                          </div>
                          
                          {studentFilters.dateRange.enabled && (
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">From Date</label>
                                <input
                                  type="date"
                                  value={studentFilters.dateRange.start}
                                  onChange={(e) => setStudentFilters(prev => ({
                                    ...prev,
                                    dateRange: { ...prev.dateRange, start: e.target.value }
                                  }))}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">To Date</label>
                                <input
                                  type="date"
                                  value={studentFilters.dateRange.end}
                                  onChange={(e) => setStudentFilters(prev => ({
                                    ...prev,
                                    dateRange: { ...prev.dateRange, end: e.target.value }
                                  }))}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Group Filter (only for group assignments) */}
                        {assignmentDetail?.assignment_type === 'group' && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Group Filter
                              </label>
                              <select
                                value={studentFilters.groupFilter}
                                onChange={(e) => setStudentFilters(prev => ({
                                  ...prev,
                                  groupFilter: e.target.value,
                                  specificGroup: e.target.value === 'specific_group' ? prev.specificGroup : ''
                                }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                              >
                                <option value="all">All Students</option>
                                <option value="has_group">Has Group</option>
                                <option value="no_group">No Group</option>
                                <option value="specific_group">Specific Group</option>
                              </select>
                            </div>
                            
                            {studentFilters.groupFilter === 'specific_group' && (
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Group Name
                                </label>
                                <select
                                  value={studentFilters.specificGroup}
                                  onChange={(e) => setStudentFilters(prev => ({ ...prev, specificGroup: e.target.value }))}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                >
                                  <option value="">Select a group...</option>
                                  {[...new Set(assignmentDetail?.submissions?.map(s => s.group_name).filter(Boolean))].map(groupName => (
                                    <option key={groupName} value={groupName}>{groupName}</option>
                                  ))}
                                </select>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Sort Options */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Sort By
                            </label>
                            <select
                              value={studentFilters.sortBy}
                              onChange={(e) => setStudentFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            >
                              <option value="name">Student Name</option>
                              <option value="email">Email</option>
                              <option value="score">Score</option>
                              <option value="submission_date">Submission Date</option>
                            </select>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Sort Order
                            </label>
                            <select
                              value={studentFilters.sortOrder}
                              onChange={(e) => setStudentFilters(prev => ({ ...prev, sortOrder: e.target.value as 'asc' | 'desc' }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            >
                              <option value="asc">Ascending</option>
                              <option value="desc">Descending</option>
                            </select>
                          </div>
                        </div>

                        {/* Clear Filters Button */}
                        <div className="flex justify-end pt-2">
                          <button
                            onClick={() => setStudentFilters({
                              searchTerm: '',
                              submissionStatus: 'all',
                              scoreRange: { min: 0, max: assignmentDetail?.max_score || 100, enabled: false },
                              dateRange: { start: '', end: '', enabled: false },
                              groupFilter: 'all',
                              specificGroup: '',
                              sortBy: 'name',
                              sortOrder: 'asc'
                            })}
                            className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                          >
                            Clear All Filters
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Column Selection */}
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-semibold text-gray-900">Select Columns to Include</h4>
                        <div className="flex gap-2">
                          <button
                            onClick={handleSelectAllColumns}
                            className="px-3 py-1 text-sm bg-teal-100 text-teal-700 rounded hover:bg-teal-200 transition-colors"
                          >
                            Add All Optional
                          </button>
                          <button
                            onClick={handleDeselectAllColumns}
                            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                          >
                            Remove All Optional
                          </button>
                        </div>
                      </div>

                      {/* Required Columns */}
                      <div className="mb-6">
                        <h5 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                          <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                          Required Columns (Always Included)
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {requiredColumns.map((columnId) => {
                            const column = availableColumns.find(col => col.id === columnId);
                            if (!column) return null;
                            
                            return (
                              <div
                                key={column.id}
                                className="flex items-start gap-3 p-3 rounded-lg border-2 border-red-200 bg-red-50"
                              >
                                <div className="w-4 h-4 mt-0.5 flex items-center justify-center">
                                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="font-medium text-sm text-red-700">{column.label}</p>
                                    <span className="text-xs bg-red-600 text-white px-1.5 py-0.5 rounded">
                                      {columnId === 'student_id' ? 'FIRST' : 'LAST'}
                                    </span>
                                  </div>
                                  <p className="text-xs text-red-600 mt-1">{column.description}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Optional Columns */}
                      <div>
                        <h5 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                          <span className="w-2 h-2 bg-teal-500 rounded-full"></span>
                          Optional Columns (Drag to Reorder)
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {(() => {
                            const optionalCols = getOptionalColumns();
                            const selectedOptional = selectedColumns.filter(colId => 
                              !requiredColumns.includes(colId) && colId !== 'percentage'
                            );
                            const unselectedOptional = optionalCols.filter(col => 
                              !selectedColumns.includes(col.id) && 
                              (col.id !== 'group_name' || assignmentDetail?.assignment_type === 'group')
                            );
                            
                            // Show percentage at the end if selected
                            const percentageCol = optionalCols.find(col => col.id === 'percentage');
                            const showPercentageLast = selectedColumns.includes('percentage');
                            
                            // Combine: selected (in order) + unselected + percentage (if selected)
                            const orderedCols = [
                              // Selected columns in their dragged order
                              ...selectedOptional.map(colId => optionalCols.find(col => col.id === colId)).filter(Boolean),
                              // Unselected columns
                              ...unselectedOptional,
                              // Percentage column at the end if selected
                              ...(showPercentageLast && percentageCol ? [percentageCol] : [])
                            ];
                            
                            return orderedCols.map((column) => {
                            // Filter out group-specific columns for individual assignments
                            if (column.id === 'group_name' && assignmentDetail.assignment_type !== 'group') {
                              return null;
                            }
                            
                            const isSelected = selectedColumns.includes(column.id);
                            const isOptionalSelected = selectedColumns.filter(col => !requiredColumns.includes(col));
                            const dragIndex = isOptionalSelected.indexOf(column.id);
                            const isPercentage = column.id === 'percentage';
                            const isDraggable = isSelected && !isPercentage;
                            
                            return (
                              <div
                                key={column.id}
                                draggable={isDraggable}
                                onDragStart={(e) => handleDragStart(e, column.id)}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, column.id)}
                                className={`flex items-start gap-3 p-3 rounded-lg border-2 transition-all duration-200 ${
                                  isSelected
                                    ? isPercentage 
                                      ? 'border-orange-500 bg-orange-50 text-orange-700'
                                      : 'border-teal-500 bg-teal-50 text-teal-700 cursor-move'
                                    : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 cursor-pointer'
                                }`}
                                onClick={() => !isSelected && handleOptionalColumnToggle(column.id)}
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleOptionalColumnToggle(column.id)}
                                  className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500 mt-0.5"
                                  onClick={(e) => e.stopPropagation()}
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="font-medium text-sm truncate">{column.label}</p>
                                    {isSelected && isPercentage && (
                                      <span className="text-xs bg-orange-600 text-white px-1.5 py-0.5 rounded">
                                        AFTER SCORE
                                      </span>
                                    )}
                                    {isSelected && dragIndex >= 0 && !isPercentage && (
                                      <span className="text-xs bg-teal-600 text-white px-1.5 py-0.5 rounded font-mono">
                                        #{dragIndex + 2}
                                      </span>
                                    )}
                                    {isSelected && !isPercentage && (
                                      <span className="text-xs text-teal-600">↕️</span>
                                    )}
                                    {isSelected && isPercentage && (
                                      <span className="text-xs text-orange-600">🔒</span>
                                    )}
                                  </div>
                                  <p className="text-xs text-gray-500 mt-1">
                                    {column.description}
                                    {isPercentage && isSelected && (
                                      <span className="block text-orange-600 font-medium">
                                        • Always appears after Score column
                                      </span>
                                    )}
                                  </p>
                                </div>
                              </div>
                            );
                            });
                          })()}
                        </div>
                      </div>

                      {/* Column Order Preview */}
                      {selectedColumns.length > 2 && (
                        <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                          <h6 className="text-sm font-semibold text-gray-700 mb-2">Column Order Preview:</h6>
                          <div className="flex flex-wrap gap-2">
                            {getOrderedColumns().map((columnId, index) => {
                              const column = availableColumns.find(col => col.id === columnId);
                              const isRequired = requiredColumns.includes(columnId);
                              return (
                                <div
                                  key={columnId}
                                  className={`px-2 py-1 text-xs rounded ${
                                    isRequired 
                                      ? 'bg-red-100 text-red-700 border border-red-300'
                                      : 'bg-teal-100 text-teal-700 border border-teal-300'
                                  }`}
                                >
                                  {index + 1}. {column?.label || columnId}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-700">
                          <strong>{selectedColumns.length} columns selected</strong>
                          <span className="ml-2 text-gray-600">
                            ({requiredColumns.length} required + {selectedColumns.length - requiredColumns.length} optional)
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Format Selection */}
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Choose File Format</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                          fileFormat === 'xlsx'
                            ? 'border-teal-500 bg-teal-50 text-teal-700'
                            : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                        }`}>
                          <input
                            type="radio"
                            value="xlsx"
                            checked={fileFormat === 'xlsx'}
                            onChange={(e) => setFileFormat(e.target.value as 'xlsx' | 'pdf')}
                            className="w-4 h-4 text-teal-600"
                          />
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded">
                              <FileText size={20} className="text-green-600" />
                            </div>
                            <div>
                              <p className="font-semibold">Excel Spreadsheet (.xlsx)</p>
                              <p className="text-sm text-gray-500">
                                Best for data analysis, calculations, and further editing
                              </p>
                            </div>
                          </div>
                        </label>

                        <label className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                          fileFormat === 'pdf'
                            ? 'border-teal-500 bg-teal-50 text-teal-700'
                            : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                        }`}>
                          <input
                            type="radio"
                            value="pdf"
                            checked={fileFormat === 'pdf'}
                            onChange={(e) => setFileFormat(e.target.value as 'xlsx' | 'pdf')}
                            className="w-4 h-4 text-teal-600"
                          />
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-100 rounded">
                              <FileText size={20} className="text-red-600" />
                            </div>
                            <div>
                              <p className="font-semibold">PDF Document (.pdf)</p>
                              <p className="text-sm text-gray-500">
                                Perfect for sharing, printing, and professional reports
                              </p>
                            </div>
                          </div>
                        </label>
                      </div>

                      {/* Color Picker for PDF - Only show when PDF is selected */}
                      {fileFormat === 'pdf' && (
                        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
                          <h5 className="text-md font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <div className="w-4 h-4 rounded" style={{ backgroundColor: selectedColor }}></div>
                            Choose PDF Theme Color
                          </h5>
                          <p className="text-sm text-gray-600 mb-4">
                            Select a color for the PDF headers, title, and styling. Default is your brand color.
                          </p>
                          
                          <div className="grid grid-cols-10 gap-2 mb-4">
                            {colorPalette.map((colorOption, index) => (
                              <button
                                key={index}
                                onClick={() => setSelectedColor(colorOption.color)}
                                className={`w-8 h-8 rounded-lg border-2 transition-all duration-200 hover:scale-110 ${
                                  selectedColor === colorOption.color 
                                    ? 'border-gray-800 scale-110 shadow-lg' 
                                    : 'border-gray-300 hover:border-gray-500'
                                }`}
                                style={{ backgroundColor: colorOption.color }}
                                title={colorOption.name}
                              />
                            ))}
                            {/* Custom Color Picker Button */}
                            <button
                              onClick={() => setShowCustomColorPicker(true)}
                              className="w-8 h-8 rounded-lg border-2 border-dashed border-gray-400 transition-all duration-200 hover:scale-110 hover:border-gray-600 flex items-center justify-center bg-white"
                              title="Custom Color"
                            >
                              <span className="text-gray-500 font-bold text-lg">+</span>
                            </button>
                          </div>
                          
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <span className="text-gray-600">Selected:</span>
                              <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-lg border border-gray-200">
                                <div className="w-3 h-3 rounded" style={{ backgroundColor: selectedColor }}></div>
                                <span className="font-medium text-gray-900">
                                  {colorPalette.find(c => c.color === selectedColor)?.name || 'Custom Color'}
                                </span>
                                <span className="text-gray-500 font-mono text-xs">{selectedColor}</span>
                              </div>
                            </div>
                            <button
                              onClick={() => setSelectedColor('#009688')}
                              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                            >
                              Reset to Brand Color
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Custom Color Picker Modal */}
                    {showCustomColorPicker && (
                      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">Custom Color Picker</h3>
                            <button
                              onClick={() => setShowCustomColorPicker(false)}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                          
                          <div className="space-y-4">
                            {/* Color Square (Saturation/Brightness) */}
                            <div className="relative w-full h-48 rounded-lg border border-gray-300 overflow-hidden cursor-crosshair"
                                 style={{
                                   background: `linear-gradient(to right, #ffffff, hsl(${customHue}, 100%, 50%)), linear-gradient(to top, #000000, transparent)`
                                 }}
                                 onClick={(e) => {
                                   const rect = e.currentTarget.getBoundingClientRect();
                                   const x = e.clientX - rect.left;
                                   const y = e.clientY - rect.top;
                                   const saturation = Math.round((x / rect.width) * 100);
                                   const brightness = Math.round(100 - (y / rect.height) * 100);
                                   setCustomSaturation(saturation);
                                   setCustomBrightness(brightness);
                                 }}
                            >
                              {/* Color Square Overlay */}
                              <div
                                className="absolute w-full h-full"
                                style={{
                                  background: `linear-gradient(to right, #ffffff, hsl(${customHue}, 100%, 50%))`
                                }}
                              >
                                <div
                                  className="absolute w-full h-full"
                                  style={{
                                    background: 'linear-gradient(to top, #000000, transparent)'
                                  }}
                                />
                              </div>
                              
                              {/* Selection Indicator */}
                              <div
                                className="absolute w-4 h-4 border-2 border-white rounded-full shadow-lg transform -translate-x-2 -translate-y-2 pointer-events-none"
                                style={{
                                  left: `${customSaturation}%`,
                                  top: `${100 - customBrightness}%`,
                                  backgroundColor: hsvToHex(customHue, customSaturation, customBrightness)
                                }}
                              />
                            </div>
                            
                            {/* Hue Slider */}
                            <div className="relative w-full h-6 rounded-lg overflow-hidden cursor-pointer"
                                 style={{
                                   background: 'linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)'
                                 }}
                                 onClick={(e) => {
                                   const rect = e.currentTarget.getBoundingClientRect();
                                   const x = e.clientX - rect.left;
                                   const hue = Math.round((x / rect.width) * 360);
                                   setCustomHue(hue);
                                 }}
                            >
                              {/* Hue Slider Indicator */}
                              <div
                                className="absolute w-1 h-full bg-white shadow-lg transform -translate-x-0.5"
                                style={{
                                  left: `${(customHue / 360) * 100}%`
                                }}
                              />
                            </div>
                            
                            {/* Color Preview and Values */}
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-12 h-12 rounded-lg border border-gray-300"
                                  style={{
                                    backgroundColor: hsvToHex(customHue, customSaturation, customBrightness)
                                  }}
                                />
                                <div className="text-sm">
                                  <div className="font-mono text-gray-700">
                                    {hsvToHex(customHue, customSaturation, customBrightness)}
                                  </div>
                                  <div className="text-gray-500 text-xs">
                                    H:{customHue}° S:{customSaturation}% V:{customBrightness}%
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-4">
                              <button
                                onClick={() => {
                                  setSelectedColor(hsvToHex(customHue, customSaturation, customBrightness));
                                  setShowCustomColorPicker(false);
                                }}
                                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                              >
                                Apply Color
                              </button>
                              <button
                                onClick={() => setShowCustomColorPicker(false)}
                                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Preview Section */}
                    {selectedColumns.length > 0 && (
                      <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Preview</h4>
                        <div className="overflow-x-auto">
                          <table className="min-w-full border border-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                {getOrderedColumns().map((columnId) => {
                                  const column = availableColumns.find(c => c.id === columnId);
                                  return (
                                    <th key={columnId} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                                      {column?.label || columnId}
                                    </th>
                                  );
                                })}
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {filteredStudents.slice(0, 3).map((submission, index) => (
                                <tr key={submission.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                  {getOrderedColumns().map((columnId) => {
                                    let value = '';
                                    switch (columnId) {
                                      case 'student_name':
                                        value = submission.student_name;
                                        break;
                                      case 'student_email':
                                        value = submission.student_email;
                                        break;
                                      case 'student_id':
                                        value = submission.student_id?.toString() || 'N/A';
                                        break;
                                      case 'invite_status':
                                        value = submission.invitation_status ? submission.invitation_status.charAt(0).toUpperCase() + submission.invitation_status.slice(1) : 'Pending';
                                        break;
                                      case 'score':
                                        value = (submission.score !== null && submission.score !== undefined) ? submission.score.toString() : 'Not Graded';
                                        break;
                                      case 'percentage':
                                        value = (submission.score !== null && submission.score !== undefined) ? Math.round((submission.score / assignmentDetail.max_score) * 100) + '%' : 'N/A';
                                        break;
                                      case 'status':
                                        value = submission.status ? submission.status.charAt(0).toUpperCase() + submission.status.slice(1) : 'No Status';
                                        break;
                                      case 'submitted_at':
                                        value = submission.submitted_at ? new Date(submission.submitted_at).toLocaleDateString() : 'Not Submitted';
                                        break;
                                      case 'graded_at':
                                        value = submission.graded_at ? new Date(submission.graded_at).toLocaleDateString() : 'Not Graded';
                                        break;
                                      case 'feedback':
                                        value = submission.feedback ? 'Has feedback' : 'No feedback';
                                        break;
                                      case 'group_name':
                                        value = submission.group_name || 'No Group';
                                        break;
                                      default:
                                        value = 'N/A';
                                    }
                                    return (
                                      <td key={columnId} className="px-3 py-2 text-sm text-gray-900 border-r border-gray-200 truncate max-w-32">
                                        {value}
                                      </td>
                                    );
                                  })}
                                </tr>
                              ))}
                              {filteredStudents.length > 3 && (
                                <tr>
                                  <td colSpan={selectedColumns.length} className="px-3 py-2 text-center text-sm text-gray-500 italic">
                                    ... and {filteredStudents.length - 3} more students
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          This preview shows the first 3 students from your filtered selection. The full download will include all {filteredStudents.length} filtered students.
                        </p>
                      </div>
                    )}

                    {/* Download Button */}
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900">Ready to Download</h4>
                          <p className="text-sm text-gray-500 mt-1">
                            Export {selectedColumns.length} columns for {filteredStudents.length} filtered students in {fileFormat.toUpperCase()} format
                          </p>
                          {assignmentDetail.submissions.length === 0 && (
                            <p className="text-sm text-amber-600 mt-1 flex items-center gap-1">
                              <AlertCircle size={14} />
                              No submissions yet - file will show invited students with empty grades
                            </p>
                          )}
                        </div>
                        
                        <button
                          onClick={handleDownloadMarks}
                          disabled={selectedColumns.length === 0 || isDownloading}
                          className={`inline-flex items-center gap-3 px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                            selectedColumns.length === 0 || isDownloading
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-gradient-to-r from-teal-600 to-blue-600 text-white hover:from-teal-700 hover:to-blue-700 shadow-lg hover:shadow-xl transform hover:scale-105'
                          }`}
                        >
                          {isDownloading ? (
                            <>
                              <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                              Generating {fileFormat.toUpperCase()}...
                            </>
                          ) : (
                            <>
                              <Download size={20} />
                              Download {fileFormat.toUpperCase()}
                            </>
                          )}
                        </button>
                      </div>
                    </div>
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