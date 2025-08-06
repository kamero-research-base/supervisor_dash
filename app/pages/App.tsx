"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import AddResearch from "../components/toggles/addResearch";

interface DashboardStats {
  totalStudents: number;
  activeAssignments: number;
  pendingReviews: number;
  attendanceRate: number;
  researchProjects: number;
  unreadMessages: number;
}

interface RecentActivity {
  id: number;
  type: 'assignment' | 'research' | 'attendance' | 'message';
  title: string;
  description: string;
  time: string;
  status?: 'completed' | 'pending' | 'urgent';
}

interface UpcomingDeadline {
  id: number;
  title: string;
  course: string;
  dueDate: string;
  submissions: number;
  total: number;
}

export default function App() {
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    activeAssignments: 0,
    pendingReviews: 0,
    attendanceRate: 0,
    researchProjects: 0,
    unreadMessages: 0
  });
  const [showAddResearch, setShowAddResearch] = useState(false);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<UpcomingDeadline[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading data
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  }, []);

  const getActivityIcon = (type: string) => {
    switch(type) {
      case 'assignment': return 'bi-clipboard-check';
      case 'research': return 'bi-journal-text';
      case 'attendance': return 'bi-calendar-check';
      case 'message': return 'bi-envelope';
      default: return 'bi-activity';
    }
  };

  const getStatusColor = (status?: string) => {
    switch(status) {
      case 'completed': return 'text-green-600 bg-green-50';
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      case 'urgent': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

    const toggleAddResearch = () => {
    setShowAddResearch(true);
  }
  const closeAddResearch = () => {
    setShowAddResearch(false);
  }

  return (
    <div className="space-y-6">

       {showAddResearch && (
        <AddResearch onClose={closeAddResearch} />
      )}

      {/* Welcome Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome back, Supervisor!</h1>
            <p className="text-gray-600 mt-1">Here's an overview of your institution's activities</p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center space-x-3">
            {/** <button className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-2" >
              <i className="bi bi-plus-lg"></i>
              New Assignment
            </button>
            */}
            <button className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2" onClick={toggleAddResearch}>
              <i className="bi bi-plus-circle text-lg"></i>
              New Research
            </button>
          </div>
        </div>
      </div>

     

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2">
        {/* Total Students */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <i className="bi bi-people text-blue-600 text-xl"></i>
            </div>
            <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
              +12%
            </span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{stats.totalStudents || "245"}</h3>
          <p className="text-sm text-gray-600 mt-1">Total Students</p>
        </div>

        {/* Active Assignments */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
              <i className="bi bi-clipboard-check text-teal-600 text-xl"></i>
            </div>
            <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
              Active
            </span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{stats.activeAssignments || "18"}</h3>
          <p className="text-sm text-gray-600 mt-1">Assignments</p>
        </div>

        {/* Pending Reviews */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <i className="bi bi-hourglass-split text-orange-600 text-xl"></i>
            </div>
            <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
              Urgent
            </span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{stats.pendingReviews || "32"}</h3>
          <p className="text-sm text-gray-600 mt-1">Pending Reviews</p>
        </div>

        {/* Attendance Rate */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <i className="bi bi-calendar-check text-green-600 text-xl"></i>
            </div>
            <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded-full">
              -3%
            </span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{stats.attendanceRate || "87"}%</h3>
          <p className="text-sm text-gray-600 mt-1">Attendance Rate</p>
        </div>

        {/* Research Projects */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <i className="bi bi-journal-text text-purple-600 text-xl"></i>
            </div>
            <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
              Ongoing
            </span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{stats.researchProjects || "24"}</h3>
          <p className="text-sm text-gray-600 mt-1">Research Projects</p>
        </div>

        {/* Messages */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              <i className="bi bi-envelope text-indigo-600 text-xl"></i>
            </div>
            <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">
              New
            </span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{stats.unreadMessages || "7"}</h3>
          <p className="text-sm text-gray-600 mt-1">Unread Messages</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activities - 2 columns wide */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Recent Activities</h2>
              <Link href="/supervisor/activity" className="text-sm text-teal-600 hover:text-teal-700 font-medium">
                View All
              </Link>
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
            ) : recentActivities.length > 0 ? (
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      activity.type === 'assignment' ? 'bg-blue-100' :
                      activity.type === 'research' ? 'bg-purple-100' :
                      activity.type === 'attendance' ? 'bg-orange-100' :
                      'bg-green-100'
                    }`}>
                      <i className={`bi ${getActivityIcon(activity.type)} ${
                        activity.type === 'assignment' ? 'text-blue-600' :
                        activity.type === 'research' ? 'text-purple-600' :
                        activity.type === 'attendance' ? 'text-orange-600' :
                        'text-green-600'
                      }`}></i>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                          <p className="text-sm text-gray-600 mt-0.5">{activity.description}</p>
                          <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                        </div>
                        {activity.status && (
                          <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(activity.status)}`}>
                            {activity.status}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <i className="bi bi-inbox text-4xl text-gray-300"></i>
                <p className="mt-2 text-sm text-gray-500">No recent activities</p>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Deadlines - 1 column wide */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Upcoming Deadlines</h2>
              <Link href="/supervisor/assignments" className="text-sm text-teal-600 hover:text-teal-700 font-medium">
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
        <Link href="/assignments/new" className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow group cursor-pointer">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center group-hover:bg-teal-200 transition-colors">
              <i className="bi bi-plus-lg text-teal-600 text-xl"></i>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Create Assignment</h3>
              <p className="text-sm text-gray-600">Add new task</p>
            </div>
          </div>
        </Link>

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