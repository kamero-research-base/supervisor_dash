//app/assignments/page.tsx
"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import AddAssignment from "../toggles/addAssignment";
import ViewAssignment from "../../components/toggles/viewAssignment";

// Inline types (no external type files needed)
interface Analytics {
  total_assignments: number;
  active_assignments: number;
  inactive_assignments: number;
  completed_assignments: number;
  pending_submissions: number;
  total_submissions: number;
  overdue_assignments: number;
  students_invited: number;
  average_score: number;
  percentage_change: {
    total_assignments: number;
    active_assignments: number;
    inactive_assignments: number;
    completed_assignments: number;
    pending_submissions: number;
    total_submissions: number;
    overdue_assignments: number;
    students_invited: number;
    average_score: number;
  };
}

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
  submissions_count?: number;
  invited_students_count?: number;
  average_score?: number;
}

interface UserSession {
  id: string;
  [key: string]: any;
}

// Inline utility functions (no external util files needed)
const timeAgo = (dateString: string): string => {
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return `Just now`;
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`;
  
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) return `${diffInWeeks} week${diffInWeeks === 1 ? '' : 's'} ago`;
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) return `${diffInMonths} month${diffInMonths === 1 ? '' : 's'} ago`;
  
  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears} year${diffInYears === 1 ? '' : 's'} ago`;
};

const formatDueDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  
  // Format date as dd/mm/yyyy
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  
  // Format time as HH:MM
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  
  return `${day}/${month}/${year} - ${hours}:${minutes}`;
};

const getStatusBadge = (assignment: Assignment) => {
  const now = new Date();
  const dueDate = new Date(assignment.due_date);
  
  // If assignment is not active, show as inactive
  if (!assignment.is_active) {
    return <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border bg-gray-50 text-gray-700 border-gray-200">Inactive</span>;
  }
  
  // If assignment is active but overdue, show as past due
  if (assignment.is_active && dueDate < now) {
    return <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border bg-red-50 text-red-700 border-red-200">Past Due</span>;
  }
  
  // If assignment is active and not overdue, show as active
  return <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border bg-green-50 text-green-700 border-green-200">Active</span>;
};

// Header Component - Updated with Inactive Analytics
const Header = ({ onAddAssignmentClick }: { onAddAssignmentClick: () => void }) => {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const userSessionData = localStorage.getItem("supervisorSession");
        if (!userSessionData) {
          console.error("No supervisor session found");
          return;
        }

        const userSession: UserSession = JSON.parse(userSessionData);
        
        const response = await fetch(`/api/assignments/analytics`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ supervisor_id: parseInt(userSession.id) })
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (data.success && data.data) {
          setAnalytics(data.data);
        } else {
          console.error("Invalid analytics data structure:", data);
        }
      } catch (error) {
        console.error("Error fetching analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const renderPercentageChange = (value: number) => {
    if (value === 0) return null;
    const isPositive = value > 0;
    return (
      <div className={`text-xs font-medium flex items-center gap-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        ) : (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        )}
        {Math.abs(value)}%
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-6 w-48 bg-gray-200 rounded animate-pulse"></div>
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 bg-gray-200 rounded-lg animate-pulse"></div>
            <div className="h-9 w-32 bg-gray-200 rounded-lg animate-pulse"></div>
          </div>
        </div>
        <div className="grid grid-cols-6 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-lg">
              <div className="p-3 border-b border-gray-100">
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="p-3">
                <div className="h-8 w-12 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-medium text-gray-700">
          Assignments ({analytics?.total_assignments || 0})
        </h1>
        <div className="flex items-center gap-2">
          <button 
            className="flex items-center justify-center w-9 h-9 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            title="Download assignments summary"
          >
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
          </button>
          <button 
            onClick={onAddAssignmentClick}
            className="flex items-center gap-2 px-3 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Create Assignment
          </button>
        </div>
      </div>

      {/* Analytics Cards - Updated Order */}
      <div className="grid grid-cols-6 gap-3">
        {/* Active Assignments Card */}
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between p-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-green-100 border border-green-200 rounded flex items-center justify-center">
                <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-700">Active</span>
            </div>
          </div>
          <div className="p-3">
            <div className="flex items-center justify-between">
              <div className="text-2xl font-semibold text-gray-800">{analytics?.active_assignments || 0}</div>
              {analytics && renderPercentageChange(analytics.percentage_change.active_assignments)}
            </div>
          </div>
        </div>

        {/* Inactive Assignments Card - NEW */}
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between p-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gray-100 border border-gray-200 rounded flex items-center justify-center">
                <svg className="w-3 h-3 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-700">Inactive</span>
            </div>
          </div>
          <div className="p-3">
            <div className="flex items-center justify-between">
              <div className="text-2xl font-semibold text-gray-800">{analytics?.inactive_assignments || 0}</div>
              {analytics && renderPercentageChange(analytics.percentage_change.inactive_assignments)}
            </div>
          </div>
        </div>

        {/* Completed Assignments Card */}
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between p-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-100 border border-blue-200 rounded flex items-center justify-center">
                <svg className="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-700">Completed</span>
            </div>
          </div>
          <div className="p-3">
            <div className="flex items-center justify-between">
              <div className="text-2xl font-semibold text-gray-800">{analytics?.completed_assignments || 0}</div>
              {analytics && renderPercentageChange(analytics.percentage_change.completed_assignments)}
            </div>
          </div>
        </div>

    {/* Pending Assignments Card - Updated label to reflect real data */}
<div className="bg-white border border-gray-200 rounded-lg">
  <div className="flex items-center justify-between p-3 border-b border-gray-100">
    <div className="flex items-center gap-2">
      <div className="w-6 h-6 bg-yellow-100 border border-yellow-200 rounded flex items-center justify-center">
        <svg className="w-3 h-3 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
      </div>
      <span className="text-sm font-medium text-gray-700">Pending</span>
    </div>
  </div>
  <div className="p-3">
    <div className="flex items-center justify-between">
      <div className="text-2xl font-semibold text-gray-800">{analytics?.pending_submissions || 0}</div>
      {analytics && renderPercentageChange(analytics.percentage_change.pending_submissions)}
    </div>
  </div>
</div>

        {/* Overdue Assignments Card */}
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between p-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-red-100 border border-red-200 rounded flex items-center justify-center">
                <svg className="w-3 h-3 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-700">Overdue</span>
            </div>
          </div>
          <div className="p-3">
            <div className="flex items-center justify-between">
              <div className="text-2xl font-semibold text-gray-800">{analytics?.overdue_assignments || 0}</div>
              {analytics && renderPercentageChange(analytics.percentage_change.overdue_assignments)}
            </div>
          </div>
        </div>

        {/* Students Invited Card */}
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between p-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-indigo-100 border border-indigo-200 rounded flex items-center justify-center">
                <svg className="w-3 h-3 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-700">Students</span>
            </div>
          </div>
          <div className="p-3">
            <div className="flex items-center justify-between">
              <div className="text-2xl font-semibold text-gray-800">{analytics?.students_invited || 0}</div>
              {analytics && renderPercentageChange(analytics.percentage_change.students_invited)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Updated Assignment List Component with Activity Toggle
const AssignmentList = ({ refreshTrigger, onEditAssignment, onViewAssignment }: { refreshTrigger: number, onEditAssignment: (assignment: Assignment) => void, onViewAssignment: (assignment: Assignment) => void }) => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [sort, setSort] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState<number | null>(null);
  const [togglingStatus, setTogglingStatus] = useState<number | null>(null);
  
  // Add ref for dropdown detection
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const buttons = [
  { "id": 1, "name": "" },
  { "id": 2, "name": "Active" },
  { "id": 3, "name": "Inactive" },
  { "id": 4, "name": "Completed" },
  { "id": 5, "name": "Pending" },
  { "id": 6, "name": "Overdue" },
];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      setError(null);

      const userSessionData = localStorage.getItem("supervisorSession");
      if (!userSessionData) {
        throw new Error("No supervisor session found");
      }

      const userSession: UserSession = JSON.parse(userSessionData);
      
      const response = await fetch(`/api/assignments/list`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ supervisor_id: parseInt(userSession.id) })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        setAssignments(data.data.assignments || []);
      } else {
        throw new Error(data.message || "Failed to fetch assignments");
      }
    } catch (error) {
      console.error("Error fetching assignments:", error);
      setError(error instanceof Error ? error.message : "An error occurred while fetching assignments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  useEffect(() => {
    if (refreshTrigger > 0) {
      fetchAssignments();
    }
  }, [refreshTrigger]);

  const filteredAndSortedAssignments = useMemo(() => {
  let result = [...assignments];

  // Apply status filter with real submission-based logic
  if (filter && filter !== "") {
    const now = new Date();
    result = result.filter(assignment => {
      const dueDate = new Date(assignment.due_date);
      const invitedStudents = assignment.invited_students_count || 0;
      const submissions = assignment.submissions_count || 0;
      
      switch (filter.toLowerCase()) {
case 'active':
  // Active: assignment is active and missing submissions (same as pending)
  return assignment.is_active && (invitedStudents === 0 || submissions < invitedStudents);
          
        case 'inactive':
          // Inactive: assignment manually set to inactive
          return !assignment.is_active;
          
        case 'completed':
          // Completed: all invited students have submitted
          return assignment.is_active && invitedStudents > 0 && submissions >= invitedStudents;
          
        case 'overdue':
          // Overdue: due date passed and not all students submitted
          return assignment.is_active && dueDate < now && invitedStudents > 0 && submissions < invitedStudents;
          
        case 'pending':
          // Pending: due date not reached and some students haven't submitted
          return assignment.is_active && dueDate >= now && invitedStudents > 0 && submissions < invitedStudents;
          
        default:
          return true;
      }
    });
  }

  // Apply search filter (unchanged)
  if (search.trim() !== "") {
    const searchTerm = search.toLowerCase();
    result = result.filter(assignment =>
      assignment.title.toLowerCase().includes(searchTerm) ||
      assignment.description.toLowerCase().includes(searchTerm)
    );
  }

  // Apply sorting (unchanged)
  if (sort) {
    result.sort((a, b) => {
      switch (sort) {
        case 'title_asc':
          return a.title.localeCompare(b.title);
        case 'title_desc':
          return b.title.localeCompare(a.title);
        case 'due_date_asc':
          return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        case 'due_date_desc':
          return new Date(b.due_date).getTime() - new Date(a.due_date).getTime();
        case 'created_asc':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'created_desc':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        default:
          return 0;
      }
    });
  }

  return result;
}, [assignments, filter, search, sort]);

  // Pagination logic
  const paginatedAssignments = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAndSortedAssignments.slice(startIndex, endIndex);
  }, [filteredAndSortedAssignments, currentPage, itemsPerPage]);

  const totalCount = filteredAndSortedAssignments.length;
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const handleActive = (id: number, name: string) => {
    setFilter(name);
    setCurrentPage(1);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const handleSort = (sortType: string) => {
    setSort(sortType);
    setCurrentPage(1);
  };

  const toggleDropdown = (id: number) => {
    setDropdownOpen(dropdownOpen === id ? null : id);
  };

  // New toggle status handler
  const handleToggleStatus = async (assignment: Assignment) => {
    setTogglingStatus(assignment.id);
    setDropdownOpen(null);
    
    try {
      const userSessionData = localStorage.getItem("supervisorSession");
      if (!userSessionData) {
        throw new Error("No supervisor session found");
      }

      const userSession: UserSession = JSON.parse(userSessionData);
      const newStatus = !assignment.is_active;

      const response = await fetch(`/api/assignments/toggle-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: assignment.id,
          supervisor_id: parseInt(userSession.id),
          is_active: newStatus
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Update local state
        setAssignments(prev => 
          prev.map(a => 
            a.id === assignment.id 
              ? { ...a, is_active: newStatus }
              : a
          )
        );
        
        // Refresh parent analytics
        window.location.reload();
      } else {
        throw new Error(data.message || 'Failed to toggle assignment status');
      }
    } catch (error) {
      console.error('Error toggling assignment status:', error);
      alert(error instanceof Error ? error.message : 'Failed to update assignment status');
    } finally {
      setTogglingStatus(null);
    }
  };

  const handleViewAssignment = (assignment: Assignment) => {
    console.log('View assignment details:', assignment.title);
    setDropdownOpen(null);
    onViewAssignment(assignment);
  };

  const handleEditAssignment = (assignment: Assignment) => {
    console.log('Edit assignment:', assignment.title);
    setDropdownOpen(null);
    onEditAssignment(assignment);
  };

  const handleDeleteAssignment = async (assignmentId: number) => {
    if (window.confirm('Are you sure you want to delete this assignment?')) {
      try {
        const userSessionData = localStorage.getItem("supervisorSession");
        if (!userSessionData) {
          throw new Error("No supervisor session found");
        }

        const userSession: UserSession = JSON.parse(userSessionData);

        const response = await fetch(`/api/assignments/delete`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: assignmentId,
            supervisor_id: parseInt(userSession.id)
          })
        });

        const data = await response.json();

        if (response.ok && data.success) {
          setAssignments(prev => prev.filter(a => a.id !== assignmentId));
          setDropdownOpen(null);
        } else {
          throw new Error(data.message || 'Failed to delete assignment');
        }
      } catch (error) {
        console.error('Error deleting assignment:', error);
        alert(error instanceof Error ? error.message : 'Failed to delete assignment');
      }
    }
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const getPaginationRange = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots.filter((item, index, arr) => arr.indexOf(item) === index);
  };

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg mt-4">
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="p-4">
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg mt-4">
        <div className="px-4 py-8 text-center">
          <div className="text-red-500 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Assignments</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={fetchAssignments}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg mt-4">
      {/* Table Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h4 className="text-base font-medium text-gray-800">Assignment List</h4>
          
          {/* View Mode Toggle */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  viewMode === 'table'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                Table
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                Grid
              </button>
            </div>
          </div>
        </div>
        
        {/* Filters and Search */}
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-1">
            {buttons.map((btn) => (
              <button 
                key={btn.id} 
                className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                  filter === btn.name 
                    ? 'bg-gray-100 border-gray-300 text-gray-700' 
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`} 
                onClick={() => handleActive(btn.id, btn.name)}
              >
                {btn.name === "" ? 'All' : btn.name}
              </button>
            ))}
          </div>
          
          <div className="flex items-center gap-2">
            {/* Sort dropdown */}
            <div className="relative">
              <select 
                value={sort} 
                onChange={(e) => handleSort(e.target.value)}
                className="flex items-center justify-center w-auto h-8 px-2 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors text-xs bg-white"
              >
                <option value="">Sort by</option>
                <option value="title_asc">Title (A-Z)</option>
                <option value="title_desc">Title (Z-A)</option>
                <option value="due_date_asc">Due Date (Earliest)</option>
                <option value="due_date_desc">Due Date (Latest)</option>
                <option value="created_asc">Created (Oldest)</option>
                <option value="created_desc">Created (Newest)</option>
              </select>
            </div>
            
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input 
                type="search" 
                name="search" 
                value={search}
                onChange={handleSearch}
                placeholder="Search assignments..." 
                className="pl-10 pr-4 py-2 w-64 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      {viewMode === 'table' ? (
        // Table View with updated actions
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date & Time</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Max Score</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submissions</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Students</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedAssignments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    <div className="flex flex-col justify-center items-center opacity-65">
                      <div className="img w-[150px] h-[150px]">
                        <img src="/delete.png" alt="" className="w-full h-full object-contain"/>
                      </div>
                      <i>No assignments found</i>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedAssignments.map((assignment) => (
                  <tr key={assignment.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      {getStatusBadge(assignment)}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 max-w-xs">
                      <div className="truncate" title={assignment.title}>
                        {assignment.title}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                    <div className="flex flex-col">
                      <span className="font-medium">{formatDueDateTime(assignment.due_date)}</span>
                      </div>
                      </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {assignment.max_score} pts
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {assignment.submissions_count || 0}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {assignment.invited_students_count || 0}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {timeAgo(assignment.created_at)}
                    </td>
                    <td className="px-4 py-3 text-center relative">
                      <button
                        className="inline-flex items-center justify-center w-8 h-8 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                        onClick={() => toggleDropdown(assignment.id)}
                      >
                        {togglingStatus === assignment.id ? (
                          <div className="w-4 h-4 border-2 border-gray-300 border-t-teal-500 rounded-full animate-spin"></div>
                        ) : (
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                            <path d="M10 4a2 2 0 100-4 2 2 0 000 4z" />
                            <path d="M10 20a2 2 0 100-4 2 2 0 000 4z" />
                          </svg>
                        )}
                      </button>
                      
                      {dropdownOpen === assignment.id && (
                        <div ref={dropdownRef} className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                          <div className="py-1">
                            <button 
                              className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                              onClick={() => handleViewAssignment(assignment)}
                            >
                              <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              View Details
                            </button>
                            <button 
                              className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                              onClick={() => handleEditAssignment(assignment)}
                            >
                              <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              Edit
                            </button>
                            <button 
                              className={`flex items-center w-full px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${
                                assignment.is_active ? 'text-orange-600' : 'text-green-600'
                              }`}
                              onClick={() => handleToggleStatus(assignment)}
                              disabled={togglingStatus === assignment.id}
                            >
                              {assignment.is_active ? (
                                <>
                                  <svg className="w-4 h-4 mr-2 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18 12M6 6l12 12" />
                                  </svg>
                                  Mark Inactive
                                </>
                              ) : (
                                <>
                                  <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  Mark Active
                                </>
                              )}
                            </button>
                            <button 
                              className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                              onClick={() => handleDeleteAssignment(assignment.id)}
                            >
                              <svg className="w-4 h-4 mr-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        // Grid View with updated actions
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
          {paginatedAssignments.length === 0 ? (
            <div className="col-span-full text-center text-gray-500 py-8">
              <div className="flex flex-col justify-center items-center opacity-65">
                <div className="img w-[150px] h-[150px]">
                  <img src="/delete.png" alt="" className="w-full h-full object-contain"/>
                </div>
                <i>No assignments found</i>
              </div>
            </div>
          ) : (
            paginatedAssignments.map((assignment) => (
              <div key={assignment.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  {getStatusBadge(assignment)}
                  <div className="relative">
                    <button
                      className="inline-flex items-center justify-center w-8 h-8 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                      onClick={() => toggleDropdown(assignment.id)}
                    >
                      {togglingStatus === assignment.id ? (
                        <div className="w-4 h-4 border-2 border-gray-300 border-t-teal-500 rounded-full animate-spin"></div>
                      ) : (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                          <path d="M10 4a2 2 0 100-4 2 2 0 000 4z" />
                          <path d="M10 20a2 2 0 100-4 2 2 0 000 4z" />
                        </svg>
                      )}
                    </button>
                    
                    {dropdownOpen === assignment.id && (
                      <div ref={dropdownRef} className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                        <div className="py-1">
                          <button 
                            className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            onClick={() => handleViewAssignment(assignment)}
                          >
                            <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            View Details
                          </button>
                          <button 
                            className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            onClick={() => handleEditAssignment(assignment)}
                          >
                            <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit
                          </button>
                          <button 
                            className={`flex items-center w-full px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${
                              assignment.is_active ? 'text-orange-600' : 'text-green-600'
                            }`}
                            onClick={() => handleToggleStatus(assignment)}
                            disabled={togglingStatus === assignment.id}
                          >
                            {assignment.is_active ? (
                              <>
                                <svg className="w-4 h-4 mr-2 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18 12M6 6l12 12" />
                                </svg>
                                Mark Inactive
                              </>
                            ) : (
                              <>
                                <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Mark Active
                              </>
                            )}
                          </button>
                          <button 
                            className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                            onClick={() => handleDeleteAssignment(assignment.id)}
                          >
                            <svg className="w-4 h-4 mr-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <h3 className="font-medium text-gray-900 mb-2 line-clamp-2" title={assignment.title}>
                  {assignment.title}
                </h3>
                
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex flex-col">
  <div className="flex items-center mb-1">
    <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2z" />
    </svg>
    <span className="text-xs text-gray-500 uppercase tracking-wider">Due Date & Time:</span>
  </div>
  <span className="text-sm font-medium ml-6">{formatDueDateTime(assignment.due_date)}</span>
</div>
                  
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                    {assignment.max_score} points
                  </div>
                  
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    {assignment.invited_students_count || 0} students
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-4">
                  <span className="text-xs text-gray-500">
                    {timeAgo(assignment.created_at)}
                  </span>
                  <span className="text-xs text-gray-500">
                    {assignment.submissions_count || 0} submissions
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
          <div className="flex items-center text-sm text-gray-700">
            <span>
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} results
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors duration-200"
            >
              Previous
            </button>
            
            {getPaginationRange().map((page, index) => (
              <span key={index}>
                {page === '...' ? (
                  <span className="px-3 py-2 text-sm text-gray-500">...</span>
                ) : (
                  <button
                    onClick={() => handlePageChange(page as number)}
                    className={`px-3 py-2 text-sm border rounded-lg transition-colors duration-200 ${
                      currentPage === page
                        ? 'bg-teal-600 text-white border-teal-600'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                )}
              </span>
            ))}
            
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors duration-200"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Main Component - No changes needed
const AssignmentPage = () => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [viewingAssignment, setViewingAssignment] = useState<Assignment | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleAddAssignment = () => {
    setEditingAssignment(null);
    setShowCreateForm(true);
  };

  const handleEditAssignment = (assignment: Assignment) => {
    setEditingAssignment(assignment);
    setShowCreateForm(true);
  };

  const handleViewAssignment = (assignment: Assignment) => {
    setViewingAssignment(assignment);
  };

  const handleCloseForm = () => {
    setShowCreateForm(false);
    setEditingAssignment(null);
  };

  const handleCloseViewModal = () => {
    setViewingAssignment(null);
  };

  const handleFormSuccess = () => {
    setShowCreateForm(false);
    setEditingAssignment(null);
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="space-y-4">
      <Header onAddAssignmentClick={handleAddAssignment} />
      <AssignmentList 
        refreshTrigger={refreshTrigger} 
        onEditAssignment={handleEditAssignment}
        onViewAssignment={handleViewAssignment}
      />
      
      {/* Assignment Creation/Edit Modal */}
      {showCreateForm && (
        <AddAssignment 
          assignment={editingAssignment}
          onClose={handleCloseForm}
          onSuccess={handleFormSuccess}
        />
      )}

      {/* Assignment View Modal */}
      {viewingAssignment && (
        <ViewAssignment 
          assignment={viewingAssignment}
          onClose={handleCloseViewModal}
        />
      )}
    </div>
  );
};

export default AssignmentPage;