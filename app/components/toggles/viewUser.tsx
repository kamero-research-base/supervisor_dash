"use client";
import React, { useState, useEffect } from "react";
import { User, Mail, Phone, Building, Calendar, FileText, Award, CheckCircle, XCircle, Clock, AlertTriangle, X } from "lucide-react";

interface StudentData {
  first_name: string;
  last_name: string;
  email: string;
  status: string;
  phone: string;
  department: string;
  unique_id: string;
  profile_picture: string;
  password: string;
  created_at: string;
  updated_at: string;
}

interface ResearchData {
  id: string;
  title: string;
  status: string; // Contains review status like "Approved", "On Hold", "Rejected"
  progress_status?: string; // Contains progress values like "completed", "ongoing"
  created_at: string;
  category: string;
}

const tabs = [
  { 
    id: "overview", 
    name: "Overview", 
    icon: User,
    color: "from-blue-500 to-indigo-600"
  },
  { 
    id: "research", 
    name: "Research", 
    icon: FileText,
    color: "from-purple-500 to-violet-600"
  },
  { 
    id: "activity", 
    name: "Activity", 
    icon: Clock,
    color: "from-emerald-500 to-teal-600"
  },
];

interface UserOverviewProps {
  userId: string;
  onClose: () => void;
}

function formatDate(dateString: any) {
  const date = new Date(dateString);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  
  const year = date.getFullYear();
  const month = months[date.getMonth()];
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  
  return `${month} ${day}, ${year}`;
}

function truncateText(text: string, maxLength: number) {
  if (text.length > maxLength) {
    return text.slice(0, maxLength) + "...";
  }
  return text;
}

const UserOverview: React.FC<UserOverviewProps> = ({ userId, onClose }) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [student, setStudent] = useState<StudentData | null>(null);
  const [recentResearches, setRecentResearches] = useState<ResearchData[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch Student Data
  useEffect(() => {
    const fetchStudent = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/students/view`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ id: userId }),
        });
        if (!response.ok) throw new Error("Failed to fetch student");
        const data = await response.json();
        setStudent(data);
        console.log('=== DEBUG: Student Data ===', data);
        setLoading(false);
      } catch (error) {
        setError("An error occurred while fetching student data.");
        setLoading(false);
      }
    };
    
    const fetchRecentResearches = async () => {
      try {
        const response = await fetch(`/api/students/researches`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ userId: userId }),
        });
        if (!response.ok) throw new Error("Failed to fetch researches");
        const data = await response.json();
        setRecentResearches(data.researches); // Get last 5 researches
      } catch (error) {
        console.error("Error fetching researches:", error);
      }
    };
    
    fetchStudent();
    fetchRecentResearches();
  }, [userId]);


  const getStatusConfig = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active': 
        return { 
          color: 'bg-gradient-to-r from-emerald-500 to-green-600', 
          textColor: 'text-white',
          icon: CheckCircle,
          bg: 'bg-emerald-50',
          border: 'border-emerald-200'
        };
      case 'disabled': 
        return { 
          color: 'bg-gradient-to-r from-red-500 to-rose-600', 
          textColor: 'text-white',
          icon: XCircle,
          bg: 'bg-red-50',
          border: 'border-red-200'
        };
      case 'pending': 
        return { 
          color: 'bg-gradient-to-r from-amber-500 to-yellow-600', 
          textColor: 'text-white',
          icon: Clock,
          bg: 'bg-amber-50',
          border: 'border-amber-200'
        };
      case 'unverified': 
        return { 
          color: 'bg-gradient-to-r from-orange-500 to-red-500', 
          textColor: 'text-white',
          icon: AlertTriangle,
          bg: 'bg-orange-50',
          border: 'border-orange-200'
        };
      default: 
        return { 
          color: 'bg-gradient-to-r from-gray-500 to-slate-600', 
          textColor: 'text-white',
          icon: XCircle,
          bg: 'bg-gray-50',
          border: 'border-gray-200'
        };
    }
  };

  const getResearchStatusConfig = (research: ResearchData) => {
    // Use the same logic as research listing - status field for categorization
    const status = research.status?.toLowerCase();
    switch (status) {
      case 'approved': return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' };
      case 'under review': return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' };
      case 'rejected': return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' };
      case 'on hold': return { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' };
      default: return { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' };
    }
  };

  const currentTab = tabs.find(tab => tab.id === activeTab) || tabs[0];
  const statusConfig = getStatusConfig(student?.status || '');
  const StatusIcon = statusConfig.icon;


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-6xl max-h-[95vh] bg-white rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-500">
        
        {/* Header with Gradient */}
        <div className={`relative bg-gradient-to-br ${currentTab.color} p-4 sm:p-6`}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-full transition-all duration-200 backdrop-blur-sm"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pr-12">
            {/* Profile Image */}
            <div className="relative">
              <div className="w-16 sm:w-20 h-16 sm:h-20 rounded-2xl bg-white/20 backdrop-blur-sm border-2 border-white/30 overflow-hidden flex-shrink-0">
                {student?.profile_picture ? (
                  <img 
                    src={student.profile_picture} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="w-8 h-8 text-white/60" />
                  </div>
                )}
              </div>
              <div className={`absolute -bottom-2 -right-2 w-6 h-6 ${statusConfig.color} rounded-full flex items-center justify-center shadow-lg`}>
                <StatusIcon className="w-3 h-3 text-white" />
              </div>
            </div>

            {/* Student Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <User className="w-4 h-4 text-white/80" />
                <span className="text-white/80 text-xs font-medium uppercase tracking-wider">Student Profile</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-white leading-tight mb-2">
                {student?.first_name} {student?.last_name}
              </h1>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-white/90 text-sm">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-4 h-4" />
                  <span className="truncate">{student?.email}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Building className="w-4 h-4" />
                  <span>{student?.department}</span>
                </span>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="hidden lg:flex flex-col gap-2">
              <div className="text-center bg-white/20 backdrop-blur-sm rounded-xl p-3 border border-white/30">
                <div className="text-2xl font-bold text-white">{recentResearches.length}</div>
                <div className="text-xs text-white/80 uppercase tracking-wide">Research Papers</div>
              </div>
            </div>
          </div>
        </div>

        {/* Status Message */}
        {(success || error) && (
          <div className={`p-3 ${success ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'} border-l-4`}>
            <div className={`flex items-center gap-2 text-sm font-medium ${success ? 'text-emerald-800' : 'text-red-800'}`}>
              {success ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
              {success || error}
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="bg-gray-50 border-b overflow-x-auto">
          <div className="flex min-w-max px-4 sm:px-6">
            {tabs.map((tab) => {
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-4 px-3 sm:px-4 text-sm font-medium transition-all duration-200 border-b-2 whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-teal-500 text-teal-600 bg-white shadow-sm'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <TabIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col lg:flex-row max-h-[calc(95vh-240px)]">
          {/* Main Content */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
            {activeTab === "overview" && (
              <div className="space-y-6">
                {/* Key Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-4 border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-blue-600">Research Papers</p>
                        <p className="text-2xl font-bold text-blue-900">{recentResearches.length}</p>
                      </div>
                      <div className="p-2 bg-blue-500 rounded-xl">
                        <FileText className="w-5 h-5 text-white" />
                      </div>
                    </div>
                  </div>
                  
                  <div className={`rounded-2xl p-4 border ${statusConfig.bg} ${statusConfig.border}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Account Status</p>
                        <p className="text-2xl font-bold text-gray-900">{student?.status}</p>
                      </div>
                      <div className={`p-2 ${statusConfig.color} rounded-xl`}>
                        <StatusIcon className="w-5 h-5 text-white" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-purple-50 to-violet-100 rounded-2xl p-4 border border-purple-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-purple-600">Member Since</p>
                        <p className="text-lg font-bold text-purple-900">{formatDate(student?.created_at)}</p>
                      </div>
                      <div className="p-2 bg-purple-500 rounded-xl">
                        <Calendar className="w-5 h-5 text-white" />
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Student Information Card */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <User className="w-5 h-5 text-teal-600" />
                      Personal Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Full Name</label>
                          <p className="text-sm font-medium text-gray-900 mt-1">{student?.first_name} {student?.last_name}</p>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Email Address</label>
                          <p className="text-sm font-medium text-gray-900 mt-1 break-all">{student?.email}</p>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Phone Number</label>
                          <p className="text-sm font-medium text-gray-900 mt-1">{student?.phone || "Not provided"}</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Department</label>
                          <p className="text-sm font-medium text-gray-900 mt-1">{student?.department}</p>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Student ID</label>
                          <p className="text-sm font-medium text-gray-900 mt-1 font-mono">
                            {student?.unique_id || student?.hashed_id || student?.id || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Registration Date</label>
                          <p className="text-sm font-medium text-gray-900 mt-1">{formatDate(student?.created_at)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Recent Research Activities */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Award className="w-5 h-5 text-teal-600" />
                      Recent Research Activities
                    </h3>
                    <div className="space-y-3">
                      {recentResearches.length > 0 ? (
                        recentResearches.slice(0, 3).map((research) => {
                          const statusConfig = getResearchStatusConfig(research);
                          return (
                            <div key={research.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                              <div className="flex-shrink-0">
                                <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-blue-600 rounded-xl flex items-center justify-center">
                                  <FileText className="w-5 h-5 text-white" />
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-medium text-gray-900 truncate">{research.title}</h4>
                                <p className="text-xs text-gray-500 mt-1">{research.category} • {formatDate(research.created_at)}</p>
                              </div>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}>
                                {research.status}
                              </span>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-12 text-gray-500">
                          <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                          <h4 className="text-sm font-medium text-gray-700 mb-1">No Research Papers</h4>
                          <p className="text-xs text-gray-500">This student hasn't uploaded any research papers yet.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}


            {activeTab === "research" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Research Portfolio</h3>
                  <p className="text-sm text-gray-600">All research papers submitted by this student</p>
                </div>
                
                <div className="grid gap-4">
                  {recentResearches.length > 0 ? (
                    recentResearches.map((research) => {
                      const statusConfig = getResearchStatusConfig(research);
                      return (
                        <div key={research.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 p-6">
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                            <div className="flex items-start gap-4">
                              <div className="flex-shrink-0">
                                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center">
                                  <FileText className="w-6 h-6 text-white" />
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-base font-semibold text-gray-900 mb-2">{research.title}</h4>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-600">
                                  <span className="flex items-center gap-1">
                                    <Award className="w-4 h-4" />
                                    {research.category}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    {formatDate(research.created_at)}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <span className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border} whitespace-nowrap`}>
                              {research.status}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-16">
                      <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <FileText className="w-12 h-12 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No Research Papers</h3>
                      <p className="text-gray-600 max-w-md mx-auto">This student hasn't submitted any research papers yet. Encourage them to upload their work!</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "activity" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Account Activity</h3>
                  <p className="text-sm text-gray-600">Track student account status and timeline</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                    <h4 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Clock className="w-5 h-5 text-teal-600" />
                      Account Timeline
                    </h4>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Account Created</p>
                          <p className="text-xs text-gray-500">{formatDate(student?.created_at)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Last Updated</p>
                          <p className="text-xs text-gray-500">{formatDate(student?.updated_at)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${student?.status === 'Active' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Current Status</p>
                          <p className="text-xs text-gray-500">{student?.status}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - Hidden on mobile, visible on desktop */}
          <div className="hidden lg:block w-80 bg-gray-50 border-l p-6 overflow-y-auto">
            <div className="space-y-6">
              {/* Profile Card */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                <div className="text-center">
                  <div className="relative inline-block">
                    <div className="w-20 h-20 rounded-2xl bg-gray-200 flex items-center justify-center overflow-hidden">
                      {student?.profile_picture ? (
                        <img 
                          src={student.profile_picture} 
                          alt="Profile" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-10 h-10 text-gray-400" />
                      )}
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mt-4">
                    {student?.first_name} {student?.last_name}
                  </h3>
                  <p className="text-sm text-gray-600">{student?.department}</p>
                </div>

                <div className="mt-6 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Student ID</span>
                    <span className="font-mono font-medium text-gray-900">
                      {student?.unique_id || student?.hashed_id || student?.id || 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Email</span>
                    <span className="font-medium text-gray-900 truncate ml-2">{student?.email}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Phone</span>
                    <span className="font-medium text-gray-900">{student?.phone || "N/A"}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Research Count</span>
                    <span className="font-medium text-gray-900">{recentResearches.length}</span>
                  </div>
                </div>
              </div>

              {/* Status Card */}
              <div className={`rounded-2xl p-4 border ${statusConfig.bg} ${statusConfig.border}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 ${statusConfig.color} rounded-xl flex items-center justify-center`}>
                    <StatusIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Account Status</p>
                    <p className="text-lg font-bold text-gray-900">{student?.status}</p>
                  </div>
                </div>
              </div>

              {/* Read-Only Notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-800 mb-1">Supervisor View</h4>
                    <p className="text-sm text-blue-700">You are viewing this student's profile in read-only mode. Contact an administrator for any account modifications.</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-sm flex items-center justify-center rounded-2xl sm:rounded-3xl">
            <div className="flex items-center gap-3 px-6 py-4 bg-white rounded-2xl shadow-xl border border-gray-200">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-teal-500 border-t-transparent"></div>
              <span className="text-gray-700 font-medium">Processing request...</span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default UserOverview;