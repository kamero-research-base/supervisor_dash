"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";

interface ProfileData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  department: string;
  position: string;
  employeeId: string;
  bio: string;
  location: string;
  joinDate: string;
  profileImage: string;
}

interface NotificationSettings {
  emailNotifications: boolean;
  assignmentReminders: boolean;
  researchUpdates: boolean;
  messageAlerts: boolean;
  weeklyReports: boolean;
}

export default function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications'>('profile');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [profileData, setProfileData] = useState<ProfileData>({
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@university.edu",
    phone: "+1 234 567 8900",
    department: "Computer Science",
    position: "Senior Supervisor",
    employeeId: "EMP-2024-001",
    bio: "Experienced educator with over 10 years in academic supervision and research guidance. Passionate about fostering student growth and innovation in technology education.",
    location: "New York, USA",
    joinDate: "January 2020",
    profileImage: "/api/placeholder/150/150"
  });

  const [editedData, setEditedData] = useState<ProfileData>(profileData);
  
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    assignmentReminders: true,
    researchUpdates: false,
    messageAlerts: true,
    weeklyReports: false
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  useEffect(() => {
    // Simulate loading data
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  }, []);

  const handleEdit = () => {
    setIsEditing(true);
    setEditedData(profileData);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedData(profileData);
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
      setProfileData(editedData);
      setIsEditing(false);
      setIsSaving(false);
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    }, 1500);
  };

  const handleInputChange = (field: keyof ProfileData, value: string) => {
    setEditedData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // In a real app, you would upload this to a server
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditedData(prev => ({
          ...prev,
          profileImage: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNotificationToggle = (setting: keyof NotificationSettings) => {
    setNotificationSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  const handlePasswordChange = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert("Passwords don't match!");
      return;
    }
    // Handle password change logic
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 3000);
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {showSuccessMessage && (
        <div className="fixed top-4 right-4 z-50 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2">
          <i className="bi bi-check-circle-fill text-green-600"></i>
          <span>Changes saved successfully!</span>
        </div>
      )}

      {/* Header Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
            <p className="text-gray-600 mt-1">Manage your personal information and preferences</p>
          </div>
          <div className="mt-4 md:mt-0">
            {!isEditing ? (
              <button
                onClick={handleEdit}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-2"
              >
                <i className="bi bi-pencil"></i>
                Edit Profile
              </button>
            ) : (
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-lg"></i>
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <div className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'profile'
                  ? 'border-teal-600 text-teal-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <i className="bi bi-person mr-2"></i>
              Profile Information
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'security'
                  ? 'border-teal-600 text-teal-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <i className="bi bi-shield-lock mr-2"></i>
              Security
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'notifications'
                  ? 'border-teal-600 text-teal-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <i className="bi bi-bell mr-2"></i>
              Notifications
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {/* Profile Picture Section */}
              <div className="flex items-center space-x-6">
                <div className="relative">
                  <img
                    src={isEditing ? editedData.profileImage : profileData.profileImage}
                    alt="Profile"
                    className="w-24 h-24 rounded-full object-cover border-4 border-gray-200"
                  />
                  {isEditing && (
                    <>
                      <button
                        onClick={handleImageUpload}
                        className="absolute bottom-0 right-0 bg-teal-600 text-white rounded-full p-2 hover:bg-teal-700 transition-colors"
                      >
                        <i className="bi bi-camera text-sm"></i>
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {profileData.firstName} {profileData.lastName}
                  </h3>
                  <p className="text-sm text-gray-600">{profileData.position}</p>
                  <p className="text-xs text-gray-500 mt-1">Employee ID: {profileData.employeeId}</p>
                </div>
              </div>

              {/* Personal Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900 py-2">{profileData.firstName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900 py-2">{profileData.lastName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  {isEditing ? (
                    <input
                      type="email"
                      value={editedData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900 py-2">{profileData.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={editedData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900 py-2">{profileData.phone}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department
                  </label>
                  {isEditing ? (
                    <select
                      value={editedData.department}
                      onChange={(e) => handleInputChange('department', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    >
                      <option value="Computer Science">Computer Science</option>
                      <option value="Mathematics">Mathematics</option>
                      <option value="Physics">Physics</option>
                      <option value="Chemistry">Chemistry</option>
                      <option value="Biology">Biology</option>
                    </select>
                  ) : (
                    <p className="text-gray-900 py-2">{profileData.department}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Position
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedData.position}
                      onChange={(e) => handleInputChange('position', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900 py-2">{profileData.position}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900 py-2">{profileData.location}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Join Date
                  </label>
                  <p className="text-gray-900 py-2">{profileData.joinDate}</p>
                </div>
              </div>

              {/* Bio Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bio
                </label>
                {isEditing ? (
                  <textarea
                    value={editedData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                    placeholder="Tell us about yourself..."
                  />
                ) : (
                  <p className="text-gray-900 py-2">{profileData.bio}</p>
                )}
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <i className="bi bi-exclamation-triangle-fill text-yellow-600 text-xl mt-0.5"></i>
                  <div>
                    <h4 className="font-medium text-yellow-900">Password Requirements</h4>
                    <ul className="text-sm text-yellow-700 mt-1 space-y-1">
                      <li>• At least 8 characters long</li>
                      <li>• Include uppercase and lowercase letters</li>
                      <li>• Include at least one number</li>
                      <li>• Include at least one special character</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>

                <button
                  onClick={handlePasswordChange}
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                >
                  Update Password
                </button>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Two-Factor Authentication</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <i className="bi bi-shield-check text-green-600"></i>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Two-Factor Authentication</p>
                        <p className="text-sm text-gray-600">Add an extra layer of security</p>
                      </div>
                    </div>
                    <button className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                      Enable
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Email Notifications</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Email Notifications</p>
                      <p className="text-sm text-gray-600">Receive email updates about your account</p>
                    </div>
                    <button
                      onClick={() => handleNotificationToggle('emailNotifications')}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        notificationSettings.emailNotifications ? 'bg-teal-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          notificationSettings.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Assignment Reminders</p>
                      <p className="text-sm text-gray-600">Get notified about upcoming assignment deadlines</p>
                    </div>
                    <button
                      onClick={() => handleNotificationToggle('assignmentReminders')}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        notificationSettings.assignmentReminders ? 'bg-teal-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          notificationSettings.assignmentReminders ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Research Updates</p>
                      <p className="text-sm text-gray-600">Stay informed about research project progress</p>
                    </div>
                    <button
                      onClick={() => handleNotificationToggle('researchUpdates')}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        notificationSettings.researchUpdates ? 'bg-teal-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          notificationSettings.researchUpdates ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Message Alerts</p>
                      <p className="text-sm text-gray-600">Get notified when you receive new messages</p>
                    </div>
                    <button
                      onClick={() => handleNotificationToggle('messageAlerts')}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        notificationSettings.messageAlerts ? 'bg-teal-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          notificationSettings.messageAlerts ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Weekly Reports</p>
                      <p className="text-sm text-gray-600">Receive weekly summary of activities</p>
                    </div>
                    <button
                      onClick={() => handleNotificationToggle('weeklyReports')}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        notificationSettings.weeklyReports ? 'bg-teal-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          notificationSettings.weeklyReports ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <i className="bi bi-people text-blue-600 text-xl"></i>
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">245</h3>
          <p className="text-sm text-gray-600 mt-1">Students Supervised</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <i className="bi bi-journal-text text-purple-600 text-xl"></i>
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">24</h3>
          <p className="text-sm text-gray-600 mt-1">Research Projects</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <i className="bi bi-trophy text-green-600 text-xl"></i>
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">15</h3>
          <p className="text-sm text-gray-600 mt-1">Awards Received</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <i className="bi bi-star text-orange-600 text-xl"></i>
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">4.8</h3>
          <p className="text-sm text-gray-600 mt-1">Average Rating</p>
        </div>
      </div>
    </div>
  );
}