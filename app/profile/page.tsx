"use client";

import { useState, useEffect } from "react";

interface SupervisorProfile {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  profile_picture?: string;
  status: string;
  department_id?: number;
  department_name?: string;
  school_id?: number;
  school_name?: string;
  college_id?: number;
  college_name?: string;
  institution_id?: number;
  institution_name?: string;
  bio?: string;
  created_at: string;
  updated_at: string;
  last_login?: string;
}

interface UserInfo {
  id: number;
  name: string;
  hashed_id: string;
  profile: string;
  email: string;
}

export default function ProfilePage() {
  const [supervisorProfile, setSupervisorProfile] = useState<SupervisorProfile | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    bio: ''
  });

  useEffect(() => {
    const fetchSupervisorProfile = async () => {
      try {
        // Try to fetch profile data using the new secure API endpoint
        const response = await fetch('/api/auth/current-user', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include', // Important for including cookies
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.supervisor) {
            setSupervisorProfile(result.supervisor);
            // Initialize form data with fetched profile
            setFormData({
              first_name: result.supervisor.first_name || '',
              last_name: result.supervisor.last_name || '',
              phone: result.supervisor.phone || '',
              bio: result.supervisor.bio || ''
            });
          } else {
            // User not authenticated, redirect to login
            setError("Please log in to view your profile");
            setTimeout(() => {
              window.location.href = '/auth/login';
            }, 2000);
          }
        } else if (response.status === 401) {
          // Token expired or invalid, redirect to login
          setError("Session expired. Please log in again.");
          setTimeout(() => {
            window.location.href = '/auth/login';
          }, 2000);
        } else {
          // For development/demo purposes when no authentication is present
          console.log("Authentication not available, using demo data for development");
          const demoUserInfo: UserInfo = {
            id: 1,
            name: "Dr. Emmy Descholar",
            hashed_id: "demo_hash_123",
            profile: "",
            email: "emmy.descholar@kamero.ac.rw"
          };
          setUserInfo(demoUserInfo);
          const demoProfile = createProfileFromUserInfo(demoUserInfo);
          setSupervisorProfile({
            ...demoProfile,
            bio: "Experienced academic supervisor with over 10 years in research supervision. Specialized in computer science, artificial intelligence, and educational technology. Passionate about guiding students through their academic journey and fostering innovative research.",
            department_name: "Computer Science",
            school_name: "School of Technology",
            college_name: "College of Science and Technology",
            institution_name: "Kamero University"
          });
          setFormData({
            first_name: demoProfile.first_name,
            last_name: demoProfile.last_name,
            phone: "+250 788 123 456",
            bio: "Experienced academic supervisor with over 10 years in research supervision. Specialized in computer science, artificial intelligence, and educational technology. Passionate about guiding students through their academic journey and fostering innovative research."
          });
        }
      } catch (err) {
        console.error('Profile fetch error:', err);
        setError("Failed to load profile. Please try again.");
        // For development/demo purposes when network error occurs
        console.log("Network error, using demo data for development");
        const demoUserInfo: UserInfo = {
          id: 1,
          name: "Dr. Emmy Descholar",
          hashed_id: "demo_hash_123",
          profile: "",
          email: "emmy.descholar@kamero.ac.rw"
        };
        setUserInfo(demoUserInfo);
        const demoProfile = createProfileFromUserInfo(demoUserInfo);
        setSupervisorProfile({
          ...demoProfile,
          bio: "Experienced academic supervisor with over 10 years in research supervision. Specialized in computer science, artificial intelligence, and educational technology. Passionate about guiding students through their academic journey and fostering innovative research.",
          department_name: "Computer Science",
          school_name: "School of Technology", 
          college_name: "College of Science and Technology",
          institution_name: "Kamero University"
        });
        setFormData({
          first_name: demoProfile.first_name,
          last_name: demoProfile.last_name,
          phone: "+250 788 123 456",
          bio: "Experienced academic supervisor with over 10 years in research supervision. Specialized in computer science, artificial intelligence, and educational technology. Passionate about guiding students through their academic journey and fostering innovative research."
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSupervisorProfile();
  }, []);

  const createProfileFromUserInfo = (userInfo: UserInfo): SupervisorProfile => {
    const nameParts = userInfo.name.split(' ');
    return {
      id: userInfo.id,
      first_name: nameParts[0] || '',
      last_name: nameParts.slice(1).join(' ') || '',
      email: userInfo.email,
      phone: '',
      profile_picture: userInfo.profile,
      status: 'Active',
      bio: 'Dedicated supervisor committed to academic excellence and student success.',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  };

  const stripHtmlTags = (html: string | null | undefined): string => {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '');
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveProfile = async () => {
    if (!supervisorProfile) return;

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/auth/supervisor-profile/${supervisorProfile.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important for including cookies
        body: JSON.stringify(formData),
      });

      if (response.status === 401) {
        setError("Session expired. Please log in again.");
        setTimeout(() => {
          window.location.href = '/auth/login';
        }, 2000);
        return;
      }

      const result = await response.json();
      
      if (result.success) {
        setSupervisorProfile({
          ...supervisorProfile,
          ...formData,
          updated_at: new Date().toISOString()
        });
        setIsEditing(false);
        alert('Profile updated successfully!');
      } else {
        setError(result.message || 'Failed to update profile');
      }
    } catch (err) {
      setError('Error updating profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-gray-800 mb-1">Loading Profile</h3>
          <p className="text-gray-600 text-sm">Fetching your information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="bi bi-exclamation-triangle text-red-500 text-2xl"></i>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Profile</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white px-6 py-2 rounded-xl font-semibold transition-all transform hover:scale-105"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!supervisorProfile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold mb-2" style={{color: '#009688'}}>
                My Profile
              </h1>
              <p className="text-gray-600 text-sm sm:text-base">
                Manage your account information and preferences
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <button
                onClick={() => window.history.back()}
                className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <i className="bi bi-arrow-left mr-2"></i>
                Back
              </button>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="flex items-center justify-center px-4 py-2 text-white rounded-xl transition-all transform hover:scale-105 shadow-lg"
                style={{background: 'linear-gradient(to right, #009688, #00bcd4)'}}
              >
                <i className={`bi ${isEditing ? 'bi-x-lg' : 'bi-pencil'} mr-2`}></i>
                {isEditing ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              {/* Profile Header with Gradient */}
              <div className="p-8 text-center relative overflow-hidden" style={{background: 'linear-gradient(135deg, #009688, #00bcd4, #26a69a)'}}>
                <div className="relative z-10">
                  <h3 className="text-white text-lg font-semibold mb-6">Profile Information</h3>
                  
                  {/* Profile Picture */}
                  <div className="relative mb-6">
                    {supervisorProfile.profile_picture ? (
                      <img
                        src={supervisorProfile.profile_picture}
                        alt={`${supervisorProfile.first_name} ${supervisorProfile.last_name}`}
                        className="w-28 h-28 rounded-full mx-auto border-4 border-white/30 shadow-2xl object-cover"
                      />
                    ) : (
                      <div className="w-28 h-28 bg-white/20 rounded-full mx-auto border-4 border-white/30 shadow-2xl flex items-center justify-center backdrop-blur-sm">
                        <span className="text-white text-3xl font-bold">
                          {supervisorProfile.first_name?.charAt(0)}{supervisorProfile.last_name?.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-400 border-4 border-white rounded-full flex items-center justify-center">
                      <i className="bi bi-check text-white text-sm"></i>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {/* Basic Info */}
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {supervisorProfile.first_name} {supervisorProfile.last_name}
                  </h2>
                  <p className="font-semibold mb-2" style={{color: '#009688'}}>
                    Supervisor
                  </p>
                  <p className="text-gray-500 text-sm mb-4">
                    {supervisorProfile.email}
                  </p>

                  {/* Status Badge */}
                  <div className="inline-flex items-center gap-2 bg-green-100 border border-green-200 text-green-700 px-4 py-2 rounded-full text-sm font-medium">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    {supervisorProfile.status} Account
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Details Section */}
          <div className="lg:col-span-2 space-y-8">
            {/* Personal Information */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="p-6" style={{background: 'linear-gradient(to right, #009688, #00bcd4)'}}>
                <h3 className="text-xl font-bold text-white">Personal Information</h3>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-gray-700 text-sm font-semibold mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={isEditing ? formData.first_name : (supervisorProfile.first_name || '')}
                      onChange={(e) => handleInputChange('first_name', e.target.value)}
                      disabled={!isEditing}
                      className={`w-full border rounded-xl px-4 py-3 transition-all ${
                        isEditing 
                          ? 'bg-white focus:outline-none focus:ring-2 focus:border-transparent border-teal-500' 
                          : 'bg-gray-50 border-gray-200 text-gray-600 cursor-not-allowed'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 text-sm font-semibold mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={isEditing ? formData.last_name : (supervisorProfile.last_name || '')}
                      onChange={(e) => handleInputChange('last_name', e.target.value)}
                      disabled={!isEditing}
                      className={`w-full border rounded-xl px-4 py-3 transition-all ${
                        isEditing 
                          ? 'bg-white focus:outline-none focus:ring-2 focus:border-transparent border-teal-500' 
                          : 'bg-gray-50 border-gray-200 text-gray-600 cursor-not-allowed'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 text-sm font-semibold mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={supervisorProfile.email || ''}
                      disabled={true}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-600 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 text-sm font-semibold mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={isEditing ? formData.phone : (supervisorProfile.phone || 'Not provided')}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      disabled={!isEditing}
                      placeholder={isEditing ? 'Enter phone number' : ''}
                      className={`w-full border rounded-xl px-4 py-3 transition-all ${
                        isEditing 
                          ? 'bg-white focus:outline-none focus:ring-2 focus:border-transparent border-teal-500' 
                          : 'bg-gray-50 border-gray-200 text-gray-600 cursor-not-allowed'
                      }`}
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <label className="block text-gray-700 text-sm font-semibold mb-2">
                    Bio
                  </label>
                  <textarea
                    value={isEditing ? (formData.bio || '') : (stripHtmlTags(supervisorProfile.bio) || 'No bio provided')}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    disabled={!isEditing}
                    rows={4}
                    placeholder={isEditing ? 'Tell us about yourself and your expertise' : ''}
                    className={`w-full border rounded-xl px-4 py-3 transition-all resize-none ${
                      isEditing 
                        ? 'bg-white focus:outline-none focus:ring-2 focus:border-transparent border-teal-500' 
                        : 'bg-gray-50 border-gray-200 text-gray-600 cursor-not-allowed'
                    }`}
                  />
                </div>

                {isEditing && (
                  <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-6 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                      className="px-6 py-2 text-white rounded-xl transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      style={{background: isSaving ? '#ccc' : 'linear-gradient(to right, #009688, #00bcd4)'}}
                    >
                      {isSaving && (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      )}
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Institution Information */}
            {(supervisorProfile.department_name || supervisorProfile.school_name || supervisorProfile.college_name || supervisorProfile.institution_name) && (
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="p-6" style={{background: 'linear-gradient(to right, #009688, #00acc1)'}}>
                  <h3 className="text-xl font-bold text-white">Institution Information</h3>
                </div>
                
                <div className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {supervisorProfile.department_name && (
                      <div className="rounded-xl p-4" style={{background: 'linear-gradient(to right, #e0f2f1, #b2dfdb)', border: '1px solid #4db6ac'}}>
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{backgroundColor: '#009688'}}>
                            <i className="bi bi-building text-white"></i>
                          </div>
                          <div>
                            <h4 className="text-gray-900 font-semibold">Department</h4>
                            <p className="text-gray-600 text-sm">
                              {supervisorProfile.department_name}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {supervisorProfile.school_name && (
                      <div className="rounded-xl p-4" style={{background: 'linear-gradient(to right, #e0f7fa, #b2ebf2)', border: '1px solid #4dd0e1'}}>
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{backgroundColor: '#00acc1'}}>
                            <i className="bi bi-mortarboard text-white"></i>
                          </div>
                          <div>
                            <h4 className="text-gray-900 font-semibold">School</h4>
                            <p className="text-gray-600 text-sm">
                              {supervisorProfile.school_name}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {supervisorProfile.college_name && (
                      <div className="rounded-xl p-4" style={{background: 'linear-gradient(to right, #e8f5e8, #c8e6c9)', border: '1px solid #81c784'}}>
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{backgroundColor: '#26a69a'}}>
                            <i className="bi bi-bank text-white"></i>
                          </div>
                          <div>
                            <h4 className="text-gray-900 font-semibold">College</h4>
                            <p className="text-gray-600 text-sm">
                              {supervisorProfile.college_name}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {supervisorProfile.institution_name && (
                      <div className="rounded-xl p-4" style={{background: 'linear-gradient(to right, #e0f2f1, #b2dfdb)', border: '1px solid #4db6ac'}}>
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{backgroundColor: '#009688'}}>
                            <i className="bi bi-house-gear text-white"></i>
                          </div>
                          <div>
                            <h4 className="text-gray-900 font-semibold">Institution</h4>
                            <p className="text-gray-600 text-sm">
                              {supervisorProfile.institution_name}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Account Activity */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="p-6" style={{background: 'linear-gradient(to right, #009688, #26a69a)'}}>
                <h3 className="text-xl font-bold text-white">Account Activity</h3>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {supervisorProfile.last_login && (
                    <div className="rounded-xl p-4" style={{background: 'linear-gradient(to right, #e0f7fa, #b2ebf2)', border: '1px solid #4dd0e1'}}>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{backgroundColor: '#00acc1'}}>
                          <i className="bi bi-clock text-white"></i>
                        </div>
                        <div>
                          <h4 className="text-gray-900 font-semibold">Last Login</h4>
                          <p className="text-gray-600 text-sm">
                            {formatDate(supervisorProfile.last_login)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="rounded-xl p-4" style={{background: 'linear-gradient(to right, #e8f5e8, #c8e6c9)', border: '1px solid #81c784'}}>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{backgroundColor: '#26a69a'}}>
                        <i className="bi bi-calendar-plus text-white"></i>
                      </div>
                      <div>
                        <h4 className="text-gray-900 font-semibold">Member Since</h4>
                        <p className="text-gray-600 text-sm">
                          {formatDate(supervisorProfile.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl p-4" style={{background: 'linear-gradient(to right, #fff3e0, #ffe0b2)', border: '1px solid #ffb74d'}}>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{backgroundColor: '#ff9800'}}>
                        <i className="bi bi-pencil-square text-white"></i>
                      </div>
                      <div>
                        <h4 className="text-gray-900 font-semibold">Last Updated</h4>
                        <p className="text-gray-600 text-sm">
                          {formatDate(supervisorProfile.updated_at)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl p-4" style={{background: 'linear-gradient(to right, #e0f2f1, #b2dfdb)', border: '1px solid #4db6ac'}}>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{backgroundColor: '#009688'}}>
                        <i className="bi bi-shield-check text-white"></i>
                      </div>
                      <div>
                        <h4 className="text-gray-900 font-semibold">Account Status</h4>
                        <p className="text-gray-600 text-sm">
                          {supervisorProfile.status} & Verified
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}