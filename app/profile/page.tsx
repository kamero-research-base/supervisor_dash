//app/profile/page.tsx
"use client";

import { useState, useEffect } from "react";

// Import TinyMCE React Editor
import { Editor } from '@tinymce/tinymce-react';

interface SupervisorProfile {
  id: number;
  first_name: string;
  last_name: string;
  bio: string;
  email: string;
  phone_number: string;
  photo_url: string;
  last_login: string;
  status: boolean;
  created_at: string;
  updated_at: string;
  department_id: number;
  department_name: string;
  school_name: string;
  college_name: string;
  institution_name: string;
}

// TinyMCE Editor Component
const TinyMCEEditor = ({ value, onChange, placeholder, id, disabled = false }: { 
  value: string; 
  onChange: (content: string) => void; 
  placeholder: string;
  id: string;
  disabled?: boolean;
}) => {
  const [isTinyMCELoaded, setIsTinyMCELoaded] = useState(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);

  useEffect(() => {
    const loadTinyMCE = async () => {
      try {
        // Check if TinyMCE is already loaded
        if (typeof window !== 'undefined' && (window as any).tinymce) {
          setIsTinyMCELoaded(true);
          return;
        }

        // Dynamically load TinyMCE script
        const script = document.createElement('script');
        script.src = '/tinymce/tinymce.min.js';
        script.async = true;
        
        script.onload = () => {
          // Wait a bit for TinyMCE to initialize
          setTimeout(() => {
            if ((window as any).tinymce) {
              setIsTinyMCELoaded(true);
            } else {
              setLoadingError('TinyMCE failed to initialize');
            }
          }, 100);
        };
        
        script.onerror = () => {
          setLoadingError('Failed to load TinyMCE script. Please check if /tinymce/tinymce.min.js exists.');
        };
        
        document.head.appendChild(script);
        
        // Cleanup function
        return () => {
          if (document.head.contains(script)) {
            document.head.removeChild(script);
          }
        };
      } catch (error) {
        setLoadingError('Error loading TinyMCE: ' + (error as Error).message);
      }
    };

    if (!disabled) {
      loadTinyMCE();
    }
  }, [disabled]);

  if (disabled) {
    return (
      <div 
        className="w-full border rounded-lg px-4 py-3 bg-gray-50 border-gray-200 text-gray-600 cursor-not-allowed min-h-[100px] prose max-w-none"
        dangerouslySetInnerHTML={{ __html: value || 'No bio provided' }}
      />
    );
  }

  if (loadingError) {
    return (
      <div className="w-full h-[150px] border-2 border-red-200 rounded-lg flex items-center justify-center bg-red-50">
        <div className="text-red-600 text-center">
          <p className="font-medium">Editor Loading Error</p>
          <p className="text-sm mt-1">{loadingError}</p>
        </div>
      </div>
    );
  }

  if (!isTinyMCELoaded) {
    return (
      <div className="w-full h-[150px] border-2 border-gray-200 rounded-lg flex items-center justify-center">
        <div className="text-gray-500 flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-teal-500 rounded-full animate-spin"></div>
          Loading editor...
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <Editor
        licenseKey="gpl"
        init={{
          height: 150,
          menubar: false,
          branding: false,
          plugins: [
            'anchor', 'autolink', 'charmap', 'code', 'fullscreen', 'help',
            'link', 'lists', 'preview', 'searchreplace', 'visualblocks', 'wordcount'
          ],
          toolbar: 'undo redo | blocks | bold italic underline | link | align lineheight | numlist bullist | removeformat',
          content_style: `
            body { 
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; 
              font-size: 14px;
              line-height: 1.6;
              margin: 1rem;
            }
            p { margin: 0 0 1rem 0; }
          `,
          placeholder: placeholder,
          browser_spellcheck: true,
          contextmenu: false,
          skin: 'oxide',
          content_css: 'default',
          base_url: '/tinymce',
          suffix: '.min',
          setup: (editor: any) => {
            editor.on('focus', () => {
              const container = editor.getContainer();
              if (container) {
                container.style.borderColor = '#14b8a6';
              }
            });
            
            editor.on('blur', () => {
              const container = editor.getContainer();
              if (container) {
                container.style.borderColor = '#e5e7eb';
              }
            });
          }
        }}
        value={value}
        onEditorChange={(content: string) => onChange(content)}
      />
    </div>
  );
};

export default function SupervisorProfilePage() {
  const [supervisorProfile, setSupervisorProfile] = useState<SupervisorProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form state for editing
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    bio: ''
  });

  // Original form state to compare changes
  const [originalForm, setOriginalForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    bio: ''
  });

  // Modal states
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [newEmailForOtp, setNewEmailForOtp] = useState("");
  const [timeLeft, setTimeLeft] = useState(0);
  const [canResendOtp, setCanResendOtp] = useState(false);
  
  // Modal-specific error states
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);

  // Mock supervisor data for demonstration
  const mockSupervisorProfile: SupervisorProfile = {
    id: 12345,
    first_name: "Dr. Sarah",
    last_name: "Johnson",
    bio: "Experienced supervisor and researcher specializing in computer science education and AI applications. Currently leading multiple research projects and supervising graduate students in advanced computing technologies.",
    email: "sarah.johnson@university.edu",
    phone_number: "+250 788 567 890",
    photo_url: "",
    last_login: "2024-01-20T10:30:00Z",
    status: true,
    created_at: "2023-09-15T08:00:00Z",
    updated_at: "2024-01-18T14:20:00Z",
    department_id: 1,
    department_name: "Computer Science",
    school_name: "School of Engineering",
    college_name: "College of Science & Technology",
    institution_name: "University of Rwanda"
  };

  useEffect(() => {
    const fetchSupervisorProfile = async () => {
      try {
        // Try to get supervisor info from localStorage
        const supervisorInfo = localStorage.getItem('supervisorSession');
        
        if (supervisorInfo) {
          const supervisorData = JSON.parse(supervisorInfo);
          
          // Try to fetch real profile data
          const response = await fetch(`/api/auth/supervisor-profile/${supervisorData.id}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const result = await response.json();
            if (result.success) {
              setSupervisorProfile(result.supervisor);
              const formData = {
                first_name: result.supervisor.first_name,
                last_name: result.supervisor.last_name,
                email: result.supervisor.email,
                phone_number: result.supervisor.phone_number,
                bio: result.supervisor.bio
              };
              setEditForm(formData);
              setOriginalForm(formData);
            } else {
              // Fall back to mock data if API fails
              setSupervisorProfile(mockSupervisorProfile);
              const formData = {
                first_name: mockSupervisorProfile.first_name,
                last_name: mockSupervisorProfile.last_name,
                email: mockSupervisorProfile.email,
                phone_number: mockSupervisorProfile.phone_number,
                bio: mockSupervisorProfile.bio
              };
              setEditForm(formData);
              setOriginalForm(formData);
            }
          } else {
            // Fall back to mock data if API fails
            setSupervisorProfile(mockSupervisorProfile);
            const formData = {
              first_name: mockSupervisorProfile.first_name,
              last_name: mockSupervisorProfile.last_name,
              email: mockSupervisorProfile.email,
              phone_number: mockSupervisorProfile.phone_number,
              bio: mockSupervisorProfile.bio
            };
            setEditForm(formData);
            setOriginalForm(formData);
          }
        } else {
          // Use mock data if no supervisor info in localStorage
          setSupervisorProfile(mockSupervisorProfile);
          const formData = {
            first_name: mockSupervisorProfile.first_name,
            last_name: mockSupervisorProfile.last_name,
            email: mockSupervisorProfile.email,
            phone_number: mockSupervisorProfile.phone_number,
            bio: mockSupervisorProfile.bio
          };
          setEditForm(formData);
          setOriginalForm(formData);
        }
      } catch (err) {
        console.log('Using mock data for demonstration');
        // Always fall back to mock data instead of showing error
        setSupervisorProfile(mockSupervisorProfile);
        const formData = {
          first_name: mockSupervisorProfile.first_name,
          last_name: mockSupervisorProfile.last_name,
          email: mockSupervisorProfile.email,
          phone_number: mockSupervisorProfile.phone_number,
          bio: mockSupervisorProfile.bio
        };
        setEditForm(formData);
        setOriginalForm(formData);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSupervisorProfile();
  }, []);

  // OTP Timer
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && showOtpModal) {
      setCanResendOtp(true);
    }
  }, [timeLeft, showOtpModal]);

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

  const getInitials = (firstName: string, lastName: string) => {
    const firstInitial = firstName ? firstName[0] : '';
    const lastInitial = lastName ? lastName[0] : '';
    return (firstInitial + lastInitial).toUpperCase() || 'S';
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const handleBioChange = (content: string): void => {
    setEditForm(prev => ({ ...prev, bio: content }));
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
    if (!selectedFile || !supervisorProfile) return;

    const formData = new FormData();
    formData.append('photo', selectedFile);
    formData.append('supervisorId', supervisorProfile.id.toString());

    try {
      const response = await fetch('/api/auth/supervisor-upload-photo', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      
      if (result.success) {
        setSupervisorProfile({
          ...supervisorProfile,
          photo_url: result.photo_url
        });
        setUploadSuccess('Photo uploaded successfully!');
        setSelectedFile(null);
        setPreviewUrl(null);
        
        setTimeout(() => setUploadSuccess(null), 3000);
      } else {
        setError(result.message || 'Failed to upload photo');
        setTimeout(() => setError(null), 5000);
      }
    } catch (err) {
      setError('Error uploading photo. Please try again.');
      setTimeout(() => setError(null), 5000);
    }
  };

  // Modified handleSaveProfile to trigger password modal
  const handleSaveProfile = async () => {
    if (!supervisorProfile) return;

    // Check if any changes were made
    const hasChanges = Object.keys(editForm).some(key => 
      editForm[key as keyof typeof editForm] !== originalForm[key as keyof typeof originalForm]
    );

    if (!hasChanges) {
      setError("No changes detected");
      setTimeout(() => setError(null), 5000);
      return;
    }

    // Check if email was changed
    if (editForm.email !== originalForm.email) {
      setNewEmailForOtp(editForm.email);
    }

    // Show password modal instead of directly updating
    setShowPasswordModal(true);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordError(null);

    try {
      const response = await fetch("/api/auth/supervisor-verify-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supervisorId: supervisorProfile?.id,
          password: passwordInput
        })
      });

      const data = await response.json();

      if (data.success) {
        setPasswordLoading(false);
        setShowPasswordModal(false);
        setPasswordInput("");
        sendOtpToCurrentEmail();
      } else {
        setPasswordError(data.message);
        setPasswordLoading(false);
      }
    } catch (error) {
      setPasswordError("Failed to verify password");
      setPasswordLoading(false);
    }
  };

  const sendOtpToCurrentEmail = async () => {
    setShowOtpModal(true);
    setTimeLeft(120);
    setCanResendOtp(false);
    setOtpError(null);

    try {
      const emailToUse = newEmailForOtp || originalForm.email;
      
      const response = await fetch("/api/auth/supervisor-send-profile-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supervisorId: supervisorProfile?.id,
          newEmail: emailToUse,
          supervisorName: `${editForm.first_name} ${editForm.last_name}`
        })
      });

      const data = await response.json();

      if (data.success) {
        setUploadSuccess("OTP sent to your email address");
        setTimeout(() => setUploadSuccess(null), 3000);
      } else {
        setOtpError(data.message);
      }
    } catch (error) {
      setOtpError("Failed to send OTP");
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (otpInput.length !== 6) {
      setOtpError("Please enter all 6 digits");
      return;
    }

    setOtpLoading(true);
    setOtpError(null);

    try {
      const response = await fetch("/api/auth/supervisor-verify-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supervisorId: supervisorProfile?.id,
          otp: otpInput,
          newEmail: supervisorProfile?.email 
        })
      });

      const data = await response.json();

      if (data.success) {
        setOtpLoading(false);
        setShowOtpModal(false);
        setOtpInput("");
        await updateProfile();
      } else {
        setOtpError(data.message);
        setOtpLoading(false);
      }
    } catch (error) {
      setOtpError("Failed to verify OTP");
      setOtpLoading(false);
    }
  };

  // The actual profile update function
  const updateProfile = async () => {
    if (!supervisorProfile) return;

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/auth/supervisor-profile/${supervisorProfile.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      });

      const result = await response.json();
      
      if (result.success) {
        setSupervisorProfile(result.supervisor);
        setIsEditing(false);
        setUploadSuccess('Profile updated successfully!');
        setTimeout(() => setUploadSuccess(null), 3000);
        
        // Update form states
        const updatedFormData = {
          first_name: result.supervisor.first_name,
          last_name: result.supervisor.last_name,
          email: result.supervisor.email,
          phone_number: result.supervisor.phone_number,
          bio: result.supervisor.bio
        };
        setEditForm(updatedFormData);
        setOriginalForm(updatedFormData);
        
        // Clear modal states
        setNewEmailForOtp("");
        
        // Update localStorage
        const updatedSupervisorInfo = {
          name: `${result.supervisor.first_name} ${result.supervisor.last_name}`,
          email: result.supervisor.email, 
          id: result.supervisor.id,
          department: result.supervisor.department_id,
          department_name: result.supervisor.department_name,
          profile: result.supervisor.photo_url,
          school: result.supervisor.school_name,
          college: result.supervisor.college_name,
          institution: result.supervisor.institution_name
        };
        
        localStorage.setItem('supervisorSession', JSON.stringify(updatedSupervisorInfo));
        
        // Dispatch custom event to notify other components
        window.dispatchEvent(new CustomEvent('supervisorProfileUpdated', {
          detail: updatedSupervisorInfo
        }));
        
      } else {
        setError(result.message || 'Failed to update profile');
        setTimeout(() => setError(null), 5000);
      }
    } catch (err) {
      setError('Error updating profile. Please try again.');
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResendOtp = async () => {
    setCanResendOtp(false);
    setTimeLeft(120);
    setOtpError(null);
    await sendOtpToCurrentEmail();
  };

  const closeModals = () => {
    setShowPasswordModal(false);
    setShowOtpModal(false);
    setPasswordInput("");
    setOtpInput("");
    setNewEmailForOtp("");
    setPasswordError(null);
    setOtpError(null);
  };

  const handleCancelEdit = () => {
    // Reset form to original values
    if (supervisorProfile) {
      setEditForm({
        first_name: supervisorProfile.first_name,
        last_name: supervisorProfile.last_name,
        email: supervisorProfile.email,
        phone_number: supervisorProfile.phone_number,
        bio: supervisorProfile.bio
      });
    }
    setIsEditing(false);
    setError(null);
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

  if (!supervisorProfile) {
    return null;
  }

  return (
    <div className="p-6 bg-gradient-to-br from-teal-50 to-emerald-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Error/Success Messages */}
        {error && (
          <div className="mb-6 bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
            <i className="bi bi-exclamation-triangle mr-2"></i>
            {error}
          </div>
        )}
        
        {uploadSuccess && (
          <div className="mb-6 bg-emerald-100 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl">
            <i className="bi bi-check-circle mr-2"></i>
            {uploadSuccess}
          </div>
        )}

        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                My Profile
              </h1>
              <p className="text-gray-600">
                Manage your supervisor account information
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
                  {previewUrl || supervisorProfile.photo_url ? (
                    <img
                      src={previewUrl || supervisorProfile.photo_url}
                      alt={`${supervisorProfile.first_name} ${supervisorProfile.last_name}`}
                      className="w-24 h-24 rounded-full mx-auto border-4 border-white/30 shadow-lg object-cover"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-white/20 rounded-full mx-auto border-4 border-white/30 shadow-lg flex items-center justify-center">
                      <span className="text-white text-2xl font-bold">
                        {getInitials(supervisorProfile.first_name, supervisorProfile.last_name)}
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
              </div>

              <div className="p-6">
                {/* Basic Info */}
                <div className="text-center mb-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-1">
                    {`${supervisorProfile.first_name} ${supervisorProfile.last_name}`}
                  </h2>
                  <p className="text-teal-600 font-medium mb-2">
                    Supervisor
                  </p>

                  {/* Institution Hierarchy */}
                  <div className="text-sm text-gray-600 mb-4">
                    <p className="font-medium">{supervisorProfile.department_name}</p>
                    <p>{supervisorProfile.school_name}</p>
                    <p>{supervisorProfile.college_name}</p>
                    <p className="text-xs">{supervisorProfile.institution_name}</p>
                  </div>

                  {/* Status Badge */}
                  <div className="inline-flex items-center gap-2 bg-emerald-100 border border-emerald-200 text-emerald-700 px-3 py-1 rounded-full text-sm font-medium">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    Active Account
                  </div>
                </div>
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
                </div>
              </div>

              <div className="p-6">
                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-gray-700 text-sm font-semibold mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      name="first_name"
                      value={isEditing ? editForm.first_name : supervisorProfile.first_name}
                      onChange={handleInputChange}
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
                      Last Name
                    </label>
                    <input
                      type="text"
                      name="last_name"
                      value={isEditing ? editForm.last_name : supervisorProfile.last_name}
                      onChange={handleInputChange}
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
                      name="email"
                      value={isEditing ? editForm.email : supervisorProfile.email}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className={`w-full border rounded-lg px-4 py-3 transition-colors ${
                        isEditing 
                          ? 'border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent' 
                          : 'bg-gray-50 border-gray-200 text-gray-600 cursor-not-allowed'
                      }`}
                    />
                    {isEditing && (
                      <p className="text-sm text-blue-600 mt-1">
                        Profile updates require OTP verification
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-gray-700 text-sm font-semibold mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone_number"
                      value={isEditing ? editForm.phone_number : (supervisorProfile.phone_number || 'Not provided')}
                      onChange={handleInputChange}
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
                      Department
                    </label>
                    <input
                      type="text"
                      value={supervisorProfile.department_name}
                      disabled
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-600 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 text-sm font-semibold mb-2">
                      Supervisor ID
                    </label>
                    <input
                      type="text"
                      value={`#${supervisorProfile.id}`}
                      disabled
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-600 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <label className="block text-gray-700 text-sm font-semibold mb-2">
                    Bio
                  </label>
                  <TinyMCEEditor
                    id="bio-editor"
                    value={isEditing ? editForm.bio : (supervisorProfile.bio || '')}
                    onChange={handleBioChange}
                    placeholder="Tell us about your research interests and expertise..."
                    disabled={!isEditing}
                  />
                </div>

                {isEditing && (
                  <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                    <button
                      onClick={handleCancelEdit}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                      disabled={isSaving}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                      className="px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-lg hover:from-teal-700 hover:to-emerald-700 transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSaving ? (
                        <>
                          <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full mr-2 inline-block"></div>
                          Saving...
                        </>
                      ) : (
                        'Save Changes'
                      )}
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
                          {formatDate(supervisorProfile.last_login)}
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
                          {formatDate(supervisorProfile.created_at)}
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
                          {formatDate(supervisorProfile.updated_at)}
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
                          {supervisorProfile.status ? 'Active & Verified' : 'Inactive'}
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

      {/* Password Verification Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-6 lg:p-8">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-teal-100/50 w-full max-w-md mx-4 my-8">
            <div className="bg-gradient-to-r rounded-t-2xl from-teal-600 to-cyan-900 p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center">
                <i className="bi bi-shield-lock text-white text-2xl"></i>
              </div>
              <h2 className="text-2xl font-bold text-white">Verify Password</h2>
              <p className="text-white/90 mt-1">Enter your current password to continue</p>
            </div>

            <div className="p-6">
              {passwordError && (
                <div className="mb-4 bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  <i className="bi bi-exclamation-triangle mr-2"></i>
                  {passwordError}
                </div>
              )}
              
              <form onSubmit={handlePasswordSubmit} className="space-y-6">
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="w-full px-4 py-3 pr-12 border border-teal-100 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    placeholder="Enter your current password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-teal-600"
                  >
                    <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                  </button>
                </div>

                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={closeModals}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={passwordLoading}
                    className="flex-1 bg-gradient-to-r from-teal-600 to-cyan-600 text-white px-4 py-3 rounded-lg hover:from-teal-700 hover:to-cyan-700 font-medium flex items-center justify-center"
                  >
                    {passwordLoading ? (
                      <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full"></div>
                    ) : (
                      'Verify'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* OTP Verification Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-6 lg:p-8">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-teal-100/50 w-full max-w-md mx-4 my-8">
            <div className="bg-gradient-to-r rounded-t-2xl from-teal-600 to-cyan-900 p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center">
                <i className="bi bi-envelope-check text-white text-2xl"></i>
              </div>
              <h2 className="text-2xl font-bold text-white">
                {newEmailForOtp ? 'Verify New Email' : 'Verify Your Email'}
              </h2>
              <p className="text-white/90 mt-1">Enter the code sent to {newEmailForOtp || originalForm.email}</p>
            </div>

            <div className="p-6">
              {otpError && (
                <div className="mb-4 bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  <i className="bi bi-exclamation-triangle mr-2"></i>
                  {otpError}
                </div>
              )}
              
              <form onSubmit={handleOtpSubmit} className="space-y-6">
                <div>
                  <input
                    type="text"
                    value={otpInput}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setOtpInput(value);
                    }}
                    className="w-full px-4 py-3 border border-teal-100 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-center text-2xl font-bold tracking-widest"
                    placeholder="000000"
                    maxLength={6}
                    required
                  />
                  <div className="flex justify-center mt-4 space-x-2">
                    {[...Array(6)].map((_, index) => (
                      <div
                        key={index}
                        className={`h-2 w-2 rounded-full transition-all duration-300 ${
                          index < otpInput.length ? 'bg-teal-600' : 'bg-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div className="text-center">
                  {timeLeft > 0 ? (
                    <p className="text-sm text-gray-600">
                      Resend code in {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                    </p>
                  ) : canResendOtp ? (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      className="text-sm text-teal-600 hover:text-teal-700 font-medium"
                    >
                      Resend Code
                    </button>
                  ) : null}
                </div>

                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={closeModals}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={otpLoading || otpInput.length !== 6}
                    className="flex-1 bg-gradient-to-r from-teal-600 to-cyan-600 text-white px-4 py-3 rounded-lg hover:from-teal-700 hover:to-cyan-700 font-medium flex items-center justify-center disabled:opacity-50"
                  >
                    {otpLoading ? (
                      <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full"></div>
                    ) : (
                      'Verify'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}