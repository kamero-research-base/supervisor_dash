//app/pages/App.tsx
"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import AddResearch from "../components/toggles/addResearch";
import AddAssignment from "../components/toggles/addAssignment";

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

interface UpcomingDeadline {
  id: number;
  title: string;
  course: string;
  dueDate: string;
  submissions: number;
  total: number;
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
  const [showAddResearch, setShowAddResearch] = useState(false);
  const [showAddAssignment, setShowAddAssignment] = useState(false);
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<UpcomingDeadline[]>([]);
    const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

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
    }
  };

  // Fetch research data
  const fetchResearchData = async () => {
    try {
      const userSessionData = localStorage.getItem("supervisorSession");
      if (!userSessionData) return;

      const userSession: UserSession = JSON.parse(userSessionData);
      
      const response = await fetch(`/api/researches/list`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ supervisor_id: parseInt(userSession.id) })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data && data.data.researches) {
          setStats(prev => ({
            ...prev,
            researchProjects: data.data.researches.length
          }));
        }
      }
    } catch (error) {
      console.error("Error fetching research data:", error);
    }
  };

  // Fetch recent assignments and research
  const fetchRecentItems = async () => {
    try {
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

      // Fetch recent research
      try {
        const researchResponse = await fetch(`/api/researches/list`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ supervisor_id: parseInt(userSession.id) })
        });

        if (researchResponse.ok) {
          const researchData = await researchResponse.json();
          if (researchData.success && researchData.data && researchData.data.researches) {
            // Get the 5 most recent research projects
            const researches = researchData.data.researches
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
        console.error("Error fetching recent research:", error);
      }

      // Sort all items by creation date and take the most recent 10
      const sortedItems = recentItems
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10);

      setRecentItems(sortedItems);

    } catch (error) {
      console.error("Error fetching recent items:", error);
    }
  };

  // Fetch upcoming deadlines (assignments due in next 24 hours)
  const fetchUpcomingDeadlines = async () => {
    try {
      const userSessionData = localStorage.getItem("supervisorSession");
      if (!userSessionData) return;

      const userSession: UserSession = JSON.parse(userSessionData);
      
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
          const now = new Date();
          const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
          
          // Filter assignments due in the next 24 hours
          const upcomingAssignments = data.data.assignments
            .filter((assignment: any) => {
              if (!assignment.due_date) return false;
              const dueDate = new Date(assignment.due_date);
              return dueDate >= now && dueDate <= next24Hours;
            })
            .sort((a: any, b: any) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
            .slice(0, 10)
            .map((assignment: any) => ({
              id: assignment.id,
              title: assignment.title,
              course: assignment.course || "General",
              dueDate: new Date(assignment.due_date).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              }),
              submissions: assignment.total_submissions || 0,
              total: assignment.students_invited || 0
            }));

          setUpcomingDeadlines(upcomingAssignments);
        }
      }
    } catch (error) {
      console.error("Error fetching upcoming deadlines:", error);
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
    fetchUpcomingDeadlines();
    
    // Simulate loading other data
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  }, []);

  // Helper function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
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

  const toggleAddResearch = () => {
    setShowAddResearch(true);
  }
  
  const closeAddResearch = () => {
    setShowAddResearch(false);
  }

  const toggleAddAssignment = () => {
    setShowAddAssignment(true);
  }
  
  const closeAddAssignment = () => {
    setShowAddAssignment(false);
  }

  const handleAssignmentSuccess = () => {
    setShowAddAssignment(false);
    // Refresh assignment analytics and upcoming deadlines after successful creation
    fetchAssignmentAnalytics();
    fetchUpcomingDeadlines();
  }


  return (
    <div className="space-y-6">
      {showAddResearch && (
        <AddResearch onClose={closeAddResearch} />
      )}

       {showAddAssignment && (
        <AddAssignment 
          assignment={null} 
          onClose={closeAddAssignment} 
          onSuccess={handleAssignmentSuccess} 
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
            <button className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2" onClick={toggleAddResearch}>
              <i className="bi bi-plus-circle text-lg"></i>
              New Research
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
          {analyticsLoading ? (
            <div className="h-8 bg-gray-200 rounded animate-pulse mb-2"></div>
          ) : (
            <h3 className="text-2xl font-bold text-gray-900">
              {stats.totalAssignments || 0}
            </h3>
          )}
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
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2 mt-2"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : recentItems.length > 0 ? (
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
                      <tr key={`${item.type}-${item.id}`} className="hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-2">
                          <div className="flex items-center space-x-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              item.type === 'assignment' ? 'bg-blue-100' : 'bg-purple-100'
                            }`}>
                              <i className={`bi ${
                                item.type === 'assignment' ? 'bi-clipboard-check text-blue-600' : 'bi-journal-text text-purple-600'
                              } text-sm`}></i>
                            </div>
                            <span className="text-sm font-medium text-gray-900 truncate max-w-xs" title={item.title}>
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

        {/* Upcoming Deadlines - 1 column wide */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Upcoming Deadlines</h2>
              <Link href="/assignments" className="text-sm text-teal-600 hover:text-teal-700 font-medium">
                View All
              </Link>
            </div>
          </div>
          <div className="p-6">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2 mt-2"></div>
                    <div className="h-2 bg-gray-200 rounded-full mt-3"></div>
                  </div>
                ))}
              </div>
            ) : upcomingDeadlines.length > 0 ? (
              <div className="space-y-4">
                {upcomingDeadlines.map((deadline) => (
                  <div key={deadline.id} className="p-3 border border-gray-100 rounded-lg hover:border-gray-200 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900">{deadline.title}</h4>
                        <p className="text-xs text-gray-600 mt-0.5">{deadline.course}</p>
                      </div>
                      <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                        {deadline.dueDate}
                      </span>
                    </div>
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                        <span>Submissions</span>
                        <span>{deadline.submissions}/{deadline.total}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-teal-600 h-2 rounded-full" 
                          style={{ width: `${(deadline.submissions / deadline.total) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <i className="bi bi-calendar-x text-4xl text-gray-300"></i>
                <p className="mt-2 text-sm text-gray-500">No upcoming deadlines</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <button 
          onClick={toggleAddAssignment}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow group cursor-pointer text-left"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center group-hover:bg-teal-200 transition-colors">
              <i className="bi bi-plus-lg text-teal-600 text-xl"></i>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Create Assignment</h3>
              <p className="text-sm text-gray-600">Add new task</p>
            </div>
          </div>
        </button>

        <Link href="/students" className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow group cursor-pointer">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
              <i className="bi bi-person-plus text-blue-600 text-xl"></i>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Manage Students</h3>
              <p className="text-sm text-gray-600">View all students</p>
            </div>
          </div>
        </Link>

        <Link href="/reports" className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow group cursor-pointer">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
              <i className="bi bi-graph-up text-purple-600 text-xl"></i>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">View Reports</h3>
              <p className="text-sm text-gray-600">Analytics & insights</p>
            </div>
          </div>
        </Link>

        <Link href="/messages" className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow group cursor-pointer">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
              <i className="bi bi-chat-dots text-green-600 text-xl"></i>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Messages</h3>
              <p className="text-sm text-gray-600">Check inbox</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}