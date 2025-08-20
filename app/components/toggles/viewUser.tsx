"use client";
import React, { useState, useEffect } from "react";

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
  status: string;
  created_at: string;
  category: string;
}

const buttons = [
  { name: "overview", icon: "bi-grid-1x2" },
  { name: "profile", icon: "bi-person" },
  { name: "researches", icon: "bi-file-text" },
  { name: "settings", icon: "bi-gear" },
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
  
  return `${month}, ${day} ${year} ${hours}:${minutes}`;
}

function truncateText(text: string, maxLength: number) {
  if (text.length > maxLength) {
    return text.slice(0, maxLength) + "...";
  }
  return text;
}

const UserOverview: React.FC<UserOverviewProps> = ({ userId, onClose }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [student, setStudent] = useState<StudentData | null>(null);
  const [editedStudent, setEditedStudent] = useState<StudentData | null>(null);
  const [recentResearches, setRecentResearches] = useState<ResearchData[]>([]);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

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
        setEditedStudent(data);
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

  const handleInputChange = (field: keyof StudentData, value: string) => {
    if (editedStudent) {
      setEditedStudent({ ...editedStudent, [field]: value });
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await fetch(`/api/students/update`, {
        method: 'PUT',
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ ...editedStudent, id: userId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message || "Failed to update user");
      } else {
        const updatedData = await response.json();
        setStudent(updatedData);
        setSuccess("User account updated successfully!");
        setIsEditing(false);
      }
    } catch (error) {
      setError("An error occurred while updating the user.");
    } finally {
      setLoading(false);
    }
  };

  const handleDisableAccount = async () => {
    if (window.confirm("Are you sure you want to disable this account?")) {
      setLoading(true);
      try {
        const response = await fetch(`/api/students/block`, {
          method: 'PUT',
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ id: userId }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          setError(errorData.message || "Failed to disable account");
        } else {
          setSuccess("Account disabled successfully!");
          if (editedStudent) {
            setEditedStudent({ ...editedStudent, status: "Disabled" });
            setStudent({ ...student!, status: "Disabled" });
          }
        }
      } catch (error) {
        setError("An error occurred while disabling the account.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleEnableAccount = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/students/approve`, {
        method: 'PUT',
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ id: userId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message || "Failed to enable account");
      } else {
        setSuccess("Account enabled successfully!");
        if (editedStudent) {
          setEditedStudent({ ...editedStudent, status: "Active" });
          setStudent({ ...student!, status: "Active" });
        }
      }
    } catch (error) {
      setError("An error occurred while enabling the account.");
    } finally {
      setLoading(false);
    }
  };

    const handleDeleteAccount = async () => {
    setLoading(true);
    try {
      const permanentlyDelete = student?.status?.toLowerCase() === 'deleted' || student?.status?.toLowerCase() === 'locked' || student?.status?.toLowerCase() === 'unverified' ? true : false;
      const response = await fetch(`/api/students/delete`, {
        method: 'DELETE',
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ id: userId, permanently_delete: permanentlyDelete }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message || "Failed to delete account");
      } else {
        setSuccess("Account deleted successfully!");
        if (editedStudent) {
          setEditedStudent(null);
          setStudent(null);
        }
      }
    } catch (error) {
      setError("An error occurred while deleting the account.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'bg-green-500 text-white';
      case 'disabled': return 'bg-red-500 text-white';
      case 'pending': return 'bg-amber-500 text-white';
      case 'suspended': return 'bg-orange-500 text-white';
      default: return 'bg-slate-500 text-white';
    }
  };

  const getResearchStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved': return 'text-blue-600 bg-blue-50';
      case 'under review': return 'text-amber-600 bg-amber-50';
      case 'rejected': return 'text-red-600 bg-red-50';
      case 'on hold': return 'text-teal-600 bg-teal-50';
      default: return 'text-slate-600 bg-slate-50';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-400 backdrop-blur-sm bg-opacity-40"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-5xl bg-white rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        
        {/* Header */}
        <div className="relative bg-slate-700 p-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-teal-50 hover:text-white hover:bg-teal-500 rounded-full transition-all"
          >
            <i className="bi bi-x text-xl"></i>
          </button>
          
          <div className="pr-12">
            <div className="flex items-center gap-2 mb-2">
              <i className="bi bi-person-circle text-slate-300"></i>
              <span className="text-slate-300 text-xs font-medium uppercase tracking-wider">User Account</span>
            </div>
            <h1 className="text-xl font-bold text-white leading-tight mb-3">
              {student?.first_name} {student?.last_name}
            </h1>
            <div className="flex items-center gap-4 text-slate-300 text-sm">
              <span className="flex items-center gap-1">
                <i className="bi bi-envelope text-sm"></i>
                {student?.email}
              </span>
              <span className="flex items-center gap-1">
                <i className="bi bi-building text-sm"></i>
                {student?.department}
              </span>
              <span className="flex items-center gap-1">
                <i className="bi bi-card-text text-sm"></i>
                {student?.unique_id}
              </span>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="bg-green-100 border-l-4 border-green-300 p-3">
            <div className="flex items-center gap-2 text-green-500 text-sm">
              <i className="bi bi-check-circle"></i>
              {success}
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border-l-4 border-red-300 p-3">
            <div className="flex items-center gap-2 text-red-500 text-sm">
              <i className="bi bi-exclamation-triangle"></i>
              {error}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="bg-slate-50 border-b px-6">
          <div className="flex space-x-6">
            {buttons.map((button, index) => {
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
                  <i className={`bi ${button.icon}`}></i>
                  {button.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex h-[500px]">
          {/* Main Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {activeTab === 0 && (
              <div className="space-y-6">
                {/* User Info Summary */}
                <div>
                  <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                    <i className="bi bi-info-circle text-teal-600"></i>
                    Account Overview
                  </h3>
                  <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg">
                    <div className="space-y-2">
                      <div>
                        <label className="text-xs text-slate-500 uppercase tracking-wide">Full Name</label>
                        <p className="text-sm font-medium text-slate-700">{student?.first_name} {student?.last_name}</p>
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 uppercase tracking-wide">Email</label>
                        <p className="text-sm font-medium text-slate-700">{student?.email}</p>
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 uppercase tracking-wide">Phone</label>
                        <p className="text-sm font-medium text-slate-700">{student?.phone || "Not provided"}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <label className="text-xs text-slate-500 uppercase tracking-wide">Department</label>
                        <p className="text-sm font-medium text-slate-700">{student?.department}</p>
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 uppercase tracking-wide">Unique ID</label>
                        <p className="text-sm font-medium text-slate-700">{student?.unique_id}</p>
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 uppercase tracking-wide">Account Created</label>
                        <p className="text-sm font-medium text-slate-700">{formatDate(student?.created_at)}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Recent Researches */}
                <div>
                  <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                    <i className="bi bi-clock-history text-teal-600"></i>
                    Recent Uploaded Researches
                  </h3>
                  <div className="space-y-2">
                    {recentResearches.length > 0 ? (
                      recentResearches.map((research) => (
                        <div key={research.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                          <div className="flex items-center gap-3">
                            <i className="bi bi-file-text text-slate-400"></i>
                            <div>
                              <p className="text-sm font-medium text-slate-700">{truncateText(research.title, 50)}</p>
                              <p className="text-xs text-slate-500">{research.category} • {formatDate(research.created_at)}</p>
                            </div>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getResearchStatusColor(research.status)}`}>
                            {research.status}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-slate-500">
                        <i className="bi bi-file-x text-3xl mb-2"></i>
                        <p className="text-sm">No researches uploaded yet</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 1 && (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-slate-800">Profile Information</h3>
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      <i className="bi bi-pencil-square"></i>
                      Edit Profile
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={handleSave}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                      >
                        <i className="bi bi-check-lg"></i>
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setIsEditing(false);
                          setEditedStudent(student);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-500 hover:bg-slate-600 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        <i className="bi bi-x-lg"></i>
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">First Name</label>
                    <input
                      type="text"
                      value={editedStudent?.first_name || ''}
                      onChange={(e) => handleInputChange('first_name', e.target.value)}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Last Name</label>
                    <input
                      type="text"
                      value={editedStudent?.last_name || ''}
                      onChange={(e) => handleInputChange('last_name', e.target.value)}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={editedStudent?.email || ''}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={editedStudent?.phone || ''}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
                    <input
                      type="text"
                      value={editedStudent?.department || ''}
                      onChange={(e) => handleInputChange('department', e.target.value)}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Unique ID</label>
                    <input
                      type="text"
                      value={editedStudent?.unique_id || ''}
                      disabled
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-slate-100 cursor-not-allowed"
                    />
                  </div>
                </div>
                
                {isEditing && (
                  <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <i className="bi bi-info-circle text-amber-600 mt-0.5"></i>
                      <div className="text-sm text-amber-700">
                        <p className="font-medium mb-1">Password Reset</p>
                        <p>To reset the user's password, just go through the forgot password link on the login page.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 2 && (
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-800 mb-3">All Research Papers</h3>
                <div className="space-y-3">
                  {recentResearches.map((research) => (
                    <div key={research.id} className="p-4 bg-white border border-slate-200 rounded-lg hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium text-slate-800 mb-1">{research.title}</h4>
                          <div className="flex items-center gap-4 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <i className="bi bi-tag"></i>
                              {research.category}
                            </span>
                            <span className="flex items-center gap-1">
                              <i className="bi bi-calendar"></i>
                              {formatDate(research.created_at)}
                            </span>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getResearchStatusColor(research.status)}`}>
                          {research.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 3 && (
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-800 mb-3">Account Settings</h3>
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <h4 className="text-sm font-medium text-slate-700 mb-3">Account Status</h4>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <i className={`bi ${student?.status === 'Active' ? 'bi-check-circle-fill text-green-500' : 'bi-x-circle-fill text-red-500'} text-xl`}></i>
                        <div>
                          <p className="text-sm font-medium text-slate-700">Current Status</p>
                          <p className="text-xs text-slate-500">{student?.status}</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(student?.status || '')}`}>
                        {student?.status}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <h4 className="text-sm font-medium text-slate-700 mb-3">Last Activity</h4>
                    <div className="space-y-2 text-sm text-slate-600">
                      <div className="flex justify-between">
                        <span>Account Created:</span>
                        <span className="font-medium">{formatDate(student?.created_at)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Last Updated:</span>
                        <span className="font-medium">{formatDate(student?.updated_at)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="w-72 bg-slate-50 border-l p-6">
            <div className="space-y-4">
              {/* Profile Picture */}
              <div className="text-center">
                <div className="w-24 h-24 mx-auto mb-3 bg-slate-200 rounded-full flex items-center justify-center">
                  {student?.profile_picture ? (
                    <img 
                      src={student.profile_picture} 
                      alt="Profile" 
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <i className="bi bi-person-fill text-4xl text-slate-400"></i>
                  )}
                </div>
                <button className="text-xs text-teal-600 hover:text-teal-700 font-medium">
                  <i className="bi bi-camera"></i> Change Photo
                </button>
              </div>

              {/* Status */}
              <div className="text-center">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(student?.status ?? "")}`}>
                  {student?.status}
                </span>
              </div>

              {/* Quick Info */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">ID</span>
                  <span className="font-medium text-slate-700">{student?.unique_id}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Department</span>
                  <span className="font-medium text-slate-700">{student?.department}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Researches</span>
                  <span className="font-medium text-slate-700">{recentResearches.length}</span>
                </div>
              </div>

              <hr className="border-slate-200" />

              {/* Actions */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-slate-700 mb-3">Actions</h4>
                
                {student?.status === 'Active' ? (
                  <button
                    onClick={handleDisableAccount}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                  >
                    <i className="bi bi-x-circle"></i>
                    Disable Account
                  </button>
                ) : (
                  <button
                    onClick={handleEnableAccount}
                    disabled={loading || student?.status !== 'Active'}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                  >
                    <i className="bi bi-check-circle"></i>
                    Enable Account
                  </button>
                )} 

                {/** 
                <button
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-500 hover:bg-slate-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  <i className="bi bi-envelope"></i>
                  Send Email
                </button>
                
                <button
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  <i className="bi bi-download"></i>
                  Export Data
                </button>
                */}
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

export default UserOverview;