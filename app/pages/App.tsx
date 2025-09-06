//app/pages/App.tsx
"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import AddAssignment from "../components/toggles/addAssignment";
import ViewAssignment from "../components/toggles/viewAssignment";
import ViewResearch from "../components/toggles/viewResearch";

interface DashboardStats {
  totalStudents: number;
  totalAssignments: number;
  researchProjects: number;
}

interface AssignmentAnalytics {
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

interface RecentItem {
  id: number;
  title: string;
  created_at: string;
  due_date?: string; // For assignments
  year?: number; // For research
  type: 'assignment' | 'research';
}


interface UserInfo {
  id: number;
  username: string;
  name: string;
  email: string;
}

interface RecentSubmission {
  id: number;
  assignmentId: number;
  assignmentTitle: string;
  studentName: string;
  submittedAt: string;
  status: string;
  score?: number;
}

interface UserSession {
  id: string;
  [key: string]: any;
}
interface TimeBasedGreeting {
  greeting: string;
  message: string;
  icon: string;
  bgColor: string;
  textColor: string;

}

export default function App() {
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalAssignments: 0,
    researchProjects: 0
  });
  
  const [assignmentAnalytics, setAssignmentAnalytics] = useState<AssignmentAnalytics | null>(null);
  const [showAddAssignment, setShowAddAssignment] = useState(false);
  const [showViewAssignment, setShowViewAssignment] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<any | null>(null);
  const [showViewResearch, setShowViewResearch] = useState(false);
  const [selectedResearchId, setSelectedResearchId] = useState<string | null>(null);
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);
  const [recentSubmissions, setRecentSubmissions] = useState<RecentSubmission[]>([]);
    const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [researchLoading, setResearchLoading] = useState(true);
  const [recentItemsLoading, setRecentItemsLoading] = useState(true);
  const [recentSubmissionsLoading, setRecentSubmissionsLoading] = useState(true);

  // Fetch assignment analytics
  const fetchAssignmentAnalytics = async () => {
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
        setAssignmentAnalytics(data.data);
        
        // Update the stats with real assignment data
        setStats(prev => ({
          ...prev,
          totalAssignments: data.data.total_assignments
        }));
      } else {
        console.error("Invalid analytics data structure:", data);
      }
    } catch (error) {
      console.error("Error fetching assignment analytics:", error);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  // Fetch students data
  const fetchStudentsData = async () => {
    try {
      setStudentsLoading(true);
      const userSessionData = localStorage.getItem("supervisorSession");
      if (!userSessionData) return;

      const userSession: UserSession = JSON.parse(userSessionData);
      
      const response = await fetch(`/api/students`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ supervisor_id: parseInt(userSession.id) })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.students) {
          setStats(prev => ({
            ...prev,
            totalStudents: data.students.length
          }));
        }
      }
    } catch (error) {
      console.error("Error fetching students data:", error);
    } finally {
      setStudentsLoading(false);
    }
  };

  // Fetch research data
  const fetchResearchData = async () => {
    try {
      setResearchLoading(true);
      const userSessionData = localStorage.getItem("supervisorSession");
      if (!userSessionData) return;

      const userSession: UserSession = JSON.parse(userSessionData);
      
      const response = await fetch(`/api/research`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ supervisor_id: parseInt(userSession.id) })
      });

      if (response.ok) {
        const data = await response.json();
        // The API now returns an array directly, not nested in data.data.researches
        if (Array.isArray(data)) {
          setStats(prev => ({
            ...prev,
            researchProjects: data.length
          }));
        }
      }
    } catch (error) {
      console.error("Error fetching research data:", error);
    } finally {
      setResearchLoading(false);
    }
  };

  // Fetch recent assignments and research
  const fetchRecentItems = async () => {
    try {
      setRecentItemsLoading(true);
      const userSessionData = localStorage.getItem("supervisorSession");
      if (!userSessionData) return;

      const userSession: UserSession = JSON.parse(userSessionData);
      const recentItems: RecentItem[] = [];

      // Fetch recent assignments
      try {
        const assignmentResponse = await fetch(`/api/assignments/list`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ supervisor_id: parseInt(userSession.id) })
        });

        if (assignmentResponse.ok) {
          const assignmentData = await assignmentResponse.json();
          if (assignmentData.success && assignmentData.data && assignmentData.data.assignments) {
            // Get the 5 most recent assignments
            const assignments = assignmentData.data.assignments
              .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
              .slice(0, 5)
              .map((assignment: any) => ({
                id: assignment.id,
                title: assignment.title,
                created_at: assignment.created_at,
                due_date: assignment.due_date,
                type: 'assignment' as const
              }));
            recentItems.push(...assignments);
          }
        }
      } catch (error) {
        console.error("Error fetching recent assignments:", error);
      }

      // Fetch recent research from assigned students
      try {
        const researchResponse = await fetch(`/api/research`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ supervisor_id: parseInt(userSession.id) })
        });

        if (researchResponse.ok) {
          const researchData = await researchResponse.json();
          // The API now returns an array directly
          if (Array.isArray(researchData)) {
            // Get the 5 most recent research projects from students
            const researches = researchData
              .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
              .slice(0, 5)
              .map((research: any) => ({
                id: research.id,
                title: research.title,
                created_at: research.created_at,
                year: research.year,
                type: 'research' as const
              }));
            recentItems.push(...researches);
          }
        }
      } catch (error) {
        console.error("Error fetching recent student research:", error);
      }

      // Sort all items by creation date and take the most recent 10
      const sortedItems = recentItems
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10);

      setRecentItems(sortedItems);

    } catch (error) {
      console.error("Error fetching recent items:", error);
    } finally {
      setRecentItemsLoading(false);
    }
  };

  // Fetch recent ungraded submissions (latest 10 ungraded submissions)
  const fetchRecentSubmissions = async () => {
    try {
      setRecentSubmissionsLoading(true);
      const userSessionData = localStorage.getItem("supervisorSession");
      if (!userSessionData) return;

      const userSession: UserSession = JSON.parse(userSessionData);
      
      const response = await fetch(`/api/assignments/submissions/recent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ supervisor_id: parseInt(userSession.id) })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data && data.data.submissions) {
          // Get the 10 most recent submissions
          const submissions = data.data.submissions
            .sort((a: any, b: any) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime())
            .slice(0, 10)
            .map((submission: any) => ({
              id: submission.id,
              assignmentId: submission.assignment_id,
              assignmentTitle: submission.assignment_title,
              studentName: submission.student_name,
              submittedAt: formatTimeAgo(submission.submitted_at),
              status: submission.status || 'submitted',
              score: submission.score
            }));

          setRecentSubmissions(submissions);
        }
      }
    } catch (error) {
      console.error("Error fetching recent submissions:", error);
    } finally {
      setRecentSubmissionsLoading(false);
    }
  };
    const [currentGreeting, setCurrentGreeting] = useState<TimeBasedGreeting>({
    greeting: "Welcome back",
    message: "Here's an overview of your institution's activities",
    icon: "👋",
    bgColor: "bg-blue-50",
    textColor: "text-blue-600"
  });

  // Function to get time-based greeting
  const getTimeBasedGreeting = (): TimeBasedGreeting => {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    const day = now.getDay(); // 0 = Sunday, 6 = Saturday

    // Weekend greetings
    if (day === 0 || day === 6) {
      if (hour >= 6 && hour < 12) {
        return {
          greeting: "Good morning",
          message: "Hope you're having a relaxing weekend! Here's what's happening",
          icon: "🌅",
          bgColor: "bg-orange-50",
          textColor: "text-orange-600"
        };
      } else if (hour >= 12 && hour < 17) {
        return {
          greeting: "Good afternoon",
          message: "Enjoying your weekend? Here's a quick update",
          icon: "☀️",
          bgColor: "bg-yellow-50",
          textColor: "text-yellow-600"
        };
      } else {
        return {
          greeting: "Good evening",
          message: "Weekend vibes! Here's what's happening at the institution",
          icon: "🌙",
          bgColor: "bg-purple-50",
          textColor: "text-purple-600"
        };
      }
    }

    // Special time-based messages
    if (hour === 7 && minute >= 0 && minute < 30) {
      return {
        greeting: "Rise and shine",
        message: "Early bird! Time to make today productive",
        icon: "🌅",
        bgColor: "bg-orange-50",
        textColor: "text-orange-600"
      };
    }

    if ((hour === 8 || hour === 9) || (hour === 14 || hour === 15)) {
      return {
        greeting: "Coffee time",
        message: "Perfect time for a coffee break! Here's your dashboard",
        icon: "☕",
        bgColor: "bg-amber-50",
        textColor: "text-amber-700"
      };
    }

    if (hour === 12 || (hour === 13 && minute < 30)) {
      return {
        greeting: "Lunch time",
        message: "Time for a well-deserved break! Quick check on activities",
        icon: "🍽️",
        bgColor: "bg-green-50",
        textColor: "text-green-600"
      };
    }

    if (hour >= 22 || hour < 6) {
      return {
        greeting: "Working late",
        message: "Burning the midnight oil? Here's your update",
        icon: "🌙",
        bgColor: "bg-indigo-50",
        textColor: "text-indigo-600"
      };
    }

    // Regular time-based greetings
    if (hour >= 5 && hour < 12) {
      return {
        greeting: "Good morning",
        message: "Ready to tackle the day? Here's your overview",
        icon: "🌅",
        bgColor: "bg-blue-50",
        textColor: "text-blue-600"
      };
    } else if (hour >= 12 && hour < 17) {
      return {
        greeting: "Good afternoon",
        message: "Hope your day is going well! Here's the latest",
        icon: "☀️",
        bgColor: "bg-yellow-50",
        textColor: "text-yellow-600"
      };
    } else if (hour >= 17 && hour < 21) {
      return {
        greeting: "Good evening",
        message: "Wrapping up the day? Here's your summary",
        icon: "🌆",
        bgColor: "bg-orange-50",
        textColor: "text-orange-600"
      };
    } else {
      return {
        greeting: "Good night",
        message: "Late night session? Here's what's happening",
        icon: "🌙",
        bgColor: "bg-purple-50",
        textColor: "text-purple-600"
      };
    }
  };

    useEffect(() => {
    if (typeof window !== "undefined") {
      const userInfoData = localStorage.getItem('supervisorSession');
      if (userInfoData) {
        try {
          const parsedUserInfo = JSON.parse(userInfoData);
          setUserInfo(parsedUserInfo);
        } catch (error) {
          console.error('Error parsing user info:', error);
        }
      } else {
        // Redirect to login if no user info found
        window.location.href = "/auth/login";
      }
    }
  }, []);

  // Update greeting every minute
  useEffect(() => {
    const updateGreeting = () => {
      setCurrentGreeting(getTimeBasedGreeting());
    };

    updateGreeting(); // Initial call
    const interval = setInterval(updateGreeting, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Fetch all data on component mount
    fetchAssignmentAnalytics();
    fetchStudentsData();
    fetchResearchData();
    fetchRecentItems();
    fetchRecentSubmissions();
  }, []);

  // Check if all data has loaded
  useEffect(() => {
    const allDataLoaded = !analyticsLoading && !studentsLoading && !researchLoading && !recentItemsLoading && !recentSubmissionsLoading;
    setIsLoading(!allDataLoaded);
  }, [analyticsLoading, studentsLoading, researchLoading, recentItemsLoading, recentSubmissionsLoading]);

  // Helper function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Helper function to format time ago
  const formatTimeAgo = (dateString: string): string => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    return `${Math.floor(diffInSeconds / 604800)} weeks ago`;
  };

  // Helper function to format due date
  const formatDueDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };


  // Skeleton Components
  const WelcomeSkeleton = () => (
    <div className="bg-gray-50 rounded-xl shadow-sm border border-gray-200 p-4 animate-pulse">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gray-200 rounded"></div>
          <div>
            <div className="h-6 bg-gray-200 rounded w-48 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-64"></div>
          </div>
        </div>
        <div className="mt-4 md:mt-0 flex items-center space-x-3">
          <div className="h-10 bg-gray-200 rounded-lg w-32"></div>
          <div className="h-10 bg-gray-200 rounded-lg w-32"></div>
        </div>
      </div>
    </div>
  );

  const StatCardSkeleton = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
      </div>
      <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-24"></div>
    </div>
  );

  const TableSkeleton = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 animate-pulse">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="h-6 bg-gray-200 rounded w-48"></div>
          <div className="flex items-center space-x-4">
            <div className="h-4 bg-gray-200 rounded w-24"></div>
            <div className="h-4 bg-gray-200 rounded w-24"></div>
          </div>
        </div>
      </div>
      <div className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-gray-200">
              <tr>
                {[1, 2, 3, 4].map((i) => (
                  <th key={i} className="text-left py-3 px-2">
                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[1, 2, 3, 4, 5].map((i) => (
                <tr key={i}>
                  {[1, 2, 3, 4].map((j) => (
                    <td key={j} className="py-3 px-2">
                      <div className="h-4 bg-gray-200 rounded w-20"></div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const RecentSubmissionsSkeleton = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 animate-pulse">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="h-6 bg-gray-200 rounded w-32"></div>
          <div className="h-4 bg-gray-200 rounded w-16"></div>
        </div>
        <div className="h-3 bg-gray-200 rounded w-64 mt-1"></div>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-3 border border-gray-100 rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-36 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-24 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-16"></div>
                </div>
                <div className="h-8 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const toggleAddAssignment = () => {
    setShowAddAssignment(true);
  }
  
  const closeAddAssignment = () => {
    setShowAddAssignment(false);
  }

  const handleAssignmentSuccess = () => {
    setShowAddAssignment(false);
    // Refresh assignment analytics after successful creation
    fetchAssignmentAnalytics();
    // No need to refresh submissions since new assignments won't have submissions yet
  }

  const handleReviewSubmission = async (assignmentId: number) => {
    try {
      // Fetch assignment details to pass to the ViewAssignment component
      const userSessionData = localStorage.getItem("supervisorSession");
      if (!userSessionData) return;

      const userSession = JSON.parse(userSessionData);
      
      const response = await fetch(`/api/assignments/list`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ supervisor_id: parseInt(userSession.id) })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data && data.data.assignments) {
          const assignment = data.data.assignments.find((a: any) => a.id === assignmentId);
          if (assignment) {
            setSelectedAssignment(assignment);
            setShowViewAssignment(true);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching assignment details:", error);
    }
  }

  const closeViewAssignment = () => {
    setShowViewAssignment(false);
    setSelectedAssignment(null);
  }

  // Function to handle assignment item clicks
  const handleAssignmentClick = async (assignmentId: number) => {
    try {
      // Fetch assignment details to pass to the ViewAssignment component
      const userSessionData = localStorage.getItem("supervisorSession");
      if (!userSessionData) return;

      const userSession = JSON.parse(userSessionData);
      
      const response = await fetch(`/api/assignments/list`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ supervisor_id: parseInt(userSession.id) })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data && data.data.assignments) {
          const assignment = data.data.assignments.find((a: any) => a.id === assignmentId);
          if (assignment) {
            setSelectedAssignment(assignment);
            setShowViewAssignment(true);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching assignment details:", error);
    }
  }

  // Function to handle research item clicks
  const handleResearchClick = async (researchId: number) => {
    try {
      // The ViewResearch component expects the regular ID, not hashed_id
      // Let's verify this research belongs to one of our students first
      const userSessionData = localStorage.getItem("supervisorSession");
      if (!userSessionData) return;

      const userSession = JSON.parse(userSessionData);
      const response = await fetch(`/api/research`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ supervisor_id: parseInt(userSession.id) })
      });

      if (response.ok) {
        const researches = await response.json();
        const selectedResearch = researches.find((r: any) => r.id === researchId);
        if (selectedResearch) {
          // Pass the regular ID as a string to ViewResearch
          setSelectedResearchId(researchId.toString());
          setShowViewResearch(true);
        }
      }
    } catch (error) {
      console.error("Error fetching research details:", error);
    }
  }

  const closeViewResearch = () => {
    setShowViewResearch(false);
    setSelectedResearchId(null);
  }

  // General handler for recent items table clicks
  const handleRecentItemClick = (item: RecentItem) => {
    if (item.type === 'assignment') {
      handleAssignmentClick(item.id);
    } else if (item.type === 'research') {
      handleResearchClick(item.id);
    }
  }


  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Welcome Section Skeleton */}
        <WelcomeSkeleton />

        {/* Statistics Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>

        {/* Main Content Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activities Table Skeleton - 2 columns wide */}
          <div className="lg:col-span-2">
            <TableSkeleton />
          </div>

          {/* Recent Submissions Skeleton - 1 column wide */}
          <RecentSubmissionsSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
       {showAddAssignment && (
        <AddAssignment 
          assignment={null} 
          onClose={closeAddAssignment} 
          onSuccess={handleAssignmentSuccess} 
        />
      )}

      {showViewAssignment && selectedAssignment && (
        <ViewAssignment 
          assignment={selectedAssignment}
          onClose={closeViewAssignment}
        />
      )}

      {showViewResearch && selectedResearchId && (
        <ViewResearch 
          ResearchId={selectedResearchId}
          onClose={closeViewResearch}
        />
      )}
       {/* Welcome Section with Time-Based Greeting */}
      <div className={`${currentGreeting.bgColor} rounded-xl shadow-sm border border-gray-200 p-4 transition-all duration-500 ease-in-out`}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="flex items-center space-x-3">
            
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {currentGreeting.greeting}, {userInfo?.name || "User"}!
              </h1>
              <p className={`${currentGreeting.textColor} mt-1 font-medium`}>
                {currentGreeting.message}
              </p>
              
            </div>
          </div>

          <div className="mt-4 md:mt-0 flex items-center space-x-3">
            <button 
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-2" 
              onClick={toggleAddAssignment}
            >
              <i className="bi bi-plus-lg"></i>
              New Assignment
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Grid - Updated with only 3 cards for better alignment */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Total Students */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <i className="bi bi-people text-blue-600 text-xl"></i>
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{stats.totalStudents || 0}</h3>
          <p className="text-sm text-gray-600 mt-1">Total Students</p>
        </div>

        {/* Total Assignments - Using Real Data */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
              <i className="bi bi-clipboard-check text-teal-600 text-xl"></i>
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">
            {stats.totalAssignments || 0}
          </h3>
          <p className="text-sm text-gray-600 mt-1">Total Assignments</p>
        </div>

        {/* Research Projects */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <i className="bi bi-journal-text text-purple-600 text-xl"></i>
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{stats.researchProjects || 0}</h3>
          <p className="text-sm text-gray-600 mt-1">Research Projects</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activities - 2 columns wide */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Recent Researches and Assignments</h2>
              <div className="flex items-center space-x-4">
                <Link href="/researches" className="text-sm text-teal-600 hover:text-teal-700 font-medium">
                  View Researches
                </Link>
                <Link href="/assignments" className="text-sm text-teal-600 hover:text-teal-700 font-medium">
                  View Assignments
                </Link>
              </div>
            </div>
          </div>
          <div className="p-6">
            {recentItems.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-gray-200">
                    <tr>
                      <th className="text-left py-3 px-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Title
                      </th>
                      <th className="text-left py-3 px-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Date Created
                      </th>
                      <th className="text-left py-3 px-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Date Due/Year
                      </th>
                      <th className="text-left py-3 px-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Type
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {recentItems.map((item) => (
                      <tr 
                        key={`${item.type}-${item.id}`} 
                        className="hover:bg-blue-50 transition-colors cursor-pointer group"
                        onClick={() => handleRecentItemClick(item)}
                      >
                        <td className="py-3 px-2">
                          <div className="flex items-center space-x-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              item.type === 'assignment' ? 'bg-blue-100' : 'bg-purple-100'
                            }`}>
                              <i className={`bi ${
                                item.type === 'assignment' ? 'bi-clipboard-check text-blue-600' : 'bi-journal-text text-purple-600'
                              } text-sm`}></i>
                            </div>
                            <span className="text-sm font-medium text-gray-900 group-hover:text-blue-600 truncate max-w-xs transition-colors" title={item.title}>
                              {item.title}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-sm text-gray-600">
                          {formatDate(item.created_at)}
                        </td>
                        <td className="py-3 px-2 text-sm text-gray-600">
                          {item.type === 'assignment' && item.due_date 
                            ? formatDueDate(item.due_date)
                            : item.type === 'research' && item.year
                            ? item.year.toString()
                            : 'N/A'
                          }
                        </td>
                        <td className="py-3 px-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            item.type === 'assignment' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-purple-100 text-purple-800'
                          }`}>
                            {item.type === 'assignment' ? 'Assignment' : 'Research'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <i className="bi bi-inbox text-4xl text-gray-300"></i>
                <p className="mt-2 text-sm text-gray-500">No recent items found</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Submissions - 1 column wide */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Pending Reviews</h2>
              <Link href="/assignments" className="text-sm text-teal-600 hover:text-teal-700 font-medium">
                View All
              </Link>
            </div>
            <p className="text-sm text-gray-500 mt-1">Ungraded submissions requiring your attention</p>
          </div>
          <div className="p-6">
            {recentSubmissions.length > 0 ? (
              <div className="space-y-4">
                {recentSubmissions.map((submission) => (
                  <div key={submission.id} className="p-3 border border-gray-100 rounded-lg hover:border-gray-200 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900">{submission.assignmentTitle}</h4>
                        <p className="text-xs text-gray-600 mt-0.5">By {submission.studentName}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{submission.submittedAt}</p>
                      </div>
                      <button 
                        className="px-3 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition-colors shadow-sm"
                        onClick={() => handleReviewSubmission(submission.assignmentId)}
                      >
                        <i className="bi bi-eye text-xs mr-1"></i>
                        Review
                      </button>
                    </div>
                    <div className="mt-2">
                      <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">
                        Pending Review
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <i className="bi bi-clipboard-check text-4xl text-gray-300"></i>
                <p className="mt-2 text-sm text-gray-500">No pending reviews</p>
                <p className="text-xs text-gray-400 mt-1">All submissions are up to date!</p>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}