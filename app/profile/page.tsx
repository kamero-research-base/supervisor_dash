"use client";

import { useState, useEffect } from "react";

interface UserProfile {
  id: number;
  full_name: string;
  role: string;
  bio: string;
  email: string;
  phone_number: string;
  photo_url: string;
  username: string;
  last_login: string;
  status: boolean;
  created_at: string;
  updated_at: string;
}

export default function ProfilePage() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  // Mock user data for demonstration
  const mockUserProfile: UserProfile = {
    id: 12345,
    full_name: "John Doe",
    role: "Research Student",
    bio: "Passionate researcher focusing on AI and machine learning applications in education. Currently pursuing advanced studies in computer science with a focus on developing innovative solutions for modern educational challenges.",
    email: "john.doe@university.edu",
    phone_number: "+250 788 123 456",
    photo_url: "",
    username: "johndoe",
    last_login: "2024-01-20T10:30:00Z",
    status: true,
    created_at: "2023-09-15T08:00:00Z",
    updated_at: "2024-01-18T14:20:00Z",
  };

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        // Try to get user info from localStorage, but don't require it
        const userInfo = localStorage.getItem('userInfo');
        
        if (userInfo) {
          const userData = JSON.parse(userInfo);
          
          // Try to fetch real profile data
          const response = await fetch(`/api/auth/profile/${userData.id}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const result = await response.json();
            if (result.success) {
              setUserProfile(result.user);
            } else {
              // Fall back to mock data if API fails
              setUserProfile(mockUserProfile);
            }
          } else {
            // Fall back to mock data if API fails
            setUserProfile(mockUserProfile);
          }
        } else {
          // Use mock data if no user info in localStorage
          setUserProfile(mockUserProfile);
        }
      } catch (err) {
        console.log('Using mock data for demonstration');
        // Always fall back to mock data instead of showing error
        setUserProfile(mockUserProfile);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePhotoUpload = async () => {
    if (!selectedFile || !userProfile) return;

    const formData = new FormData();
    formData.append('photo', selectedFile);
    formData.append('userId', userProfile.id.toString());

    try {
      const response = await fetch('/api/auth/upload-photo', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      
      if (result.success) {
        setUserProfile({
          ...userProfile,
          photo_url: result.photo_url
        });
        setUploadSuccess('Photo uploaded successfully!');
        setSelectedFile(null);
        setPreviewUrl(null);
        
        setTimeout(() => setUploadSuccess(null), 3000);
      } else {
        setError(result.message || 'Failed to upload photo');
      }
    } catch (err) {
      setError('Error uploading photo. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 bg-gradient-to-br from-teal-50 to-emerald-50 min-h-screen flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin w-8 h-8 border-2 border-teal-300 border-t-teal-600 rounded-full mr-3"></div>
            <span className="text-gray-700">Loading profile...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-gradient-to-br from-teal-50 to-emerald-50 min-h-screen flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="bi bi-exclamation-triangle text-red-500 text-2xl"></i>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Profile</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white px-6 py-2 rounded-xl font-semibold transition-all"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return null;
  }

  return (
    <div className="p-6 bg-gradient-to-br from-teal-50 to-emerald-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                My Profile
              </h1>
              <p className="text-gray-600">
                View and manage your account information
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => window.history.back()}
                className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <i className="bi bi-arrow-left mr-2"></i>
                Back
              </button>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="flex items-center px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-lg hover:from-teal-700 hover:to-emerald-700 transition-all transform hover:scale-105 shadow-lg"
              >
                <i className={`bi ${isEditing ? 'bi-x-lg' : 'bi-pencil'} mr-2`}></i>
                {isEditing ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              {/* Profile Header */}
              <div className="bg-gradient-to-r from-teal-600 to-emerald-600 p-6 text-center">
                <h3 className="text-white text-lg font-semibold mb-4">Profile Picture</h3>
                
                {/* Profile Picture */}
                <div className="relative mb-6">
                  {previewUrl || userProfile.photo_url ? (
                    <img
                      src={previewUrl || userProfile.photo_url}
                      alt={userProfile.full_name}
                      className="w-24 h-24 rounded-full mx-auto border-4 border-white/30 shadow-lg object-cover"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-white/20 rounded-full mx-auto border-4 border-white/30 shadow-lg flex items-center justify-center">
                      <span className="text-white text-2xl font-bold">
                        {getInitials(userProfile.full_name)}
                      </span>
                    </div>
                  )}
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-emerald-400 border-4 border-white rounded-full flex items-center justify-center">
                    <i className="bi bi-check text-white text-sm"></i>
                  </div>
                </div>

                {/* Photo Upload Section */}
                {isEditing && (
                  <div className="space-y-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="photo-upload"
                    />
                    <label
                      htmlFor="photo-upload"
                      className="block bg-white/20 hover:bg-white/30 border border-white/30 text-white px-4 py-2 rounded-lg font-medium transition-all cursor-pointer"
                    >
                      <i className="bi bi-camera mr-2"></i>
                      Choose Photo
                    </label>
                    
                    {selectedFile && (
                      <div className="space-y-2">
                        <p className="text-white/80 text-sm">{selectedFile.name}</p>
                        <button
                          onClick={handlePhotoUpload}
                          className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium transition-all"
                        >
                          <i className="bi bi-upload mr-2"></i>
                          Upload Photo
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {uploadSuccess && (
                  <div className="mt-3 bg-emerald-500/20 border border-emerald-400/30 text-emerald-100 px-3 py-2 rounded-lg text-sm">
                    <i className="bi bi-check-circle mr-2"></i>
                    {uploadSuccess}
                  </div>
                )}
              </div>

              <div className="p-6">
                {/* Basic Info */}
                <div className="text-center mb-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-1">
                    {userProfile.full_name}
                  </h2>
                  <p className="text-teal-600 font-medium mb-1">
                    {userProfile.role}
                  </p>
                  <p className="text-gray-500 text-sm mb-4">
                    @{userProfile.username}
                  </p>

                  {/* Status Badge */}
                  <div className="inline-flex items-center gap-2 bg-emerald-100 border border-emerald-200 text-emerald-700 px-3 py-1 rounded-full text-sm font-medium">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    Active Account
                  </div>
                </div>

                {/* Bio */}
                {userProfile.bio && (
                  <div>
                    <h3 className="text-gray-900 font-semibold mb-2">About</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {userProfile.bio}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Details Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-teal-600 to-emerald-600 p-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white">Personal Information</h3>
                  {!isEditing && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="bg-white/20 hover:bg-white/30 border border-white/30 text-white px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2"
                    >
                      <i className="bi bi-pencil"></i>
                      Edit
                    </button>
                  )}
                </div>
              </div>

              <div className="p-6">
                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-gray-700 text-sm font-semibold mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={userProfile.full_name}
                      disabled={!isEditing}
                      className={`w-full border rounded-lg px-4 py-3 transition-colors ${
                        isEditing 
                          ? 'border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent' 
                          : 'bg-gray-50 border-gray-200 text-gray-600 cursor-not-allowed'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 text-sm font-semibold mb-2">
                      Username
                    </label>
                    <input
                      type="text"
                      value={userProfile.username}
                      disabled={!isEditing}
                      className={`w-full border rounded-lg px-4 py-3 transition-colors ${
                        isEditing 
                          ? 'border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent' 
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
                      value={userProfile.email}
                      disabled={!isEditing}
                      className={`w-full border rounded-lg px-4 py-3 transition-colors ${
                        isEditing 
                          ? 'border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent' 
                          : 'bg-gray-50 border-gray-200 text-gray-600 cursor-not-allowed'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 text-sm font-semibold mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={userProfile.phone_number || 'Not provided'}
                      disabled={!isEditing}
                      className={`w-full border rounded-lg px-4 py-3 transition-colors ${
                        isEditing 
                          ? 'border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent' 
                          : 'bg-gray-50 border-gray-200 text-gray-600 cursor-not-allowed'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 text-sm font-semibold mb-2">
                      Role
                    </label>
                    <input
                      type="text"
                      value={userProfile.role}
                      disabled
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-600 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 text-sm font-semibold mb-2">
                      User ID
                    </label>
                    <input
                      type="text"
                      value={`#${userProfile.id}`}
                      disabled
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-600 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <label className="block text-gray-700 text-sm font-semibold mb-2">
                    Bio
                  </label>
                  <textarea
                    value={userProfile.bio || 'No bio provided'}
                    disabled={!isEditing}
                    rows={4}
                    className={`w-full border rounded-lg px-4 py-3 transition-colors resize-none ${
                      isEditing 
                        ? 'border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent' 
                        : 'bg-gray-50 border-gray-200 text-gray-600 cursor-not-allowed'
                    }`}
                  />
                </div>

                {isEditing && (
                  <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      className="px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-lg hover:from-teal-700 hover:to-emerald-700 transition-all transform hover:scale-105 shadow-lg"
                    >
                      Save Changes
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Account Activity */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-teal-600 to-emerald-600 p-6">
                <h3 className="text-xl font-bold text-white">Account Activity</h3>
              </div>
              
              <div className="p-6">
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                        <i className="bi bi-clock text-white"></i>
                      </div>
                      <div>
                        <h4 className="text-gray-900 font-semibold">Last Login</h4>
                        <p className="text-gray-600 text-sm">
                          {formatDate(userProfile.last_login)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 border border-emerald-200 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-emerald-500 rounded-lg flex items-center justify-center">
                        <i className="bi bi-calendar-plus text-white"></i>
                      </div>
                      <div>
                        <h4 className="text-gray-900 font-semibold">Member Since</h4>
                        <p className="text-gray-600 text-sm">
                          {formatDate(userProfile.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-200 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-amber-500 rounded-lg flex items-center justify-center">
                        <i className="bi bi-pencil-square text-white"></i>
                      </div>
                      <div>
                        <h4 className="text-gray-900 font-semibold">Last Updated</h4>
                        <p className="text-gray-600 text-sm">
                          {formatDate(userProfile.updated_at)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-teal-50 to-teal-100 border border-teal-200 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-teal-500 rounded-lg flex items-center justify-center">
                        <i className="bi bi-shield-check text-white"></i>
                      </div>
                      <div>
                        <h4 className="text-gray-900 font-semibold">Account Status</h4>
                        <p className="text-gray-600 text-sm">
                          {userProfile.status ? 'Active & Verified' : 'Inactive'}
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