//app/components/app/TopBar.tsx
"use client";
import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";

interface TopBarProps {
  pageTitle: string;
}

interface SupervisorInfo {
  id: number;
  name: string;
  email: string;
  department: number; // This is an ID
  department_name: string; // The actual department name
  school_id: number;
  school: string;
  college_id: number;
  college: string;
  institution_id: number;
  institution: string;
  profile?: string;
  session_id: string;
  hashed_id: string;
  loginTime: string;
}


const TopBar = ({ pageTitle }: TopBarProps) => {
  const [supervisorInfo, setSupervisorInfo] = useState<SupervisorInfo | null>(null);
  const [currentTime, setCurrentTime] = useState<string>("");
  const [currentDate, setCurrentDate] = useState<string>("");
  const [showUserMenu, setShowUserMenu] = useState<boolean>(false);
  const pathname = usePathname();
  const router = useRouter();

  // Add refs for dropdown containers
  const notificationsRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Sample notifications data - In real app, this would come from an API
  useEffect(() => {
    const sampleNotifications: Notification[] = [
      {
        id: 1,
        title: "New Research Submission",
        description: "Student John Doe submitted a research proposal for review",
        type: "research",
        time: "5 minutes ago",
        isRead: false,
        priority: "high"
      },
      {
        id: 2,
        title: "Assignment Deadline",
        description: "Machine Learning assignment is due tomorrow",
        type: "assignment", 
        time: "2 hours ago",
        isRead: false,
        priority: "medium"
      },
      {
        id: 3,
        title: "Student Message",
        description: "Sarah Johnson sent you a message about her thesis",
        type: "message",
        time: "1 day ago",
        isRead: true,
        priority: "low"
      }
    ];

    setNotifications(sampleNotifications);
  }, []);
  
  // Get current time and date
  useEffect(() => {
    const updateTimeAndDate = () => {
      const now = new Date();
      const timeString = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
      const dateString = now.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
      setCurrentTime(timeString);
      setCurrentDate(dateString);
    };

    updateTimeAndDate();
    const interval = setInterval(updateTimeAndDate, 1000);
    return () => clearInterval(interval);
  }, []);

  // Get supervisor info and listen for profile updates
  useEffect(() => {
    const loadSupervisorInfo = () => {
      if (typeof window !== "undefined") {
        const supervisorData = localStorage.getItem('supervisorSession');
        if (supervisorData) {
          try {
            const parsedInfo = JSON.parse(supervisorData);
            setSupervisorInfo(parsedInfo);
          } catch (error) {
            console.error('Error parsing supervisor info:', error);
          }
        } else {
          router.push('/auth/login');
        }
      }
    };

    // Load initial supervisor info
    loadSupervisorInfo();

    // Listen for profile updates from ProfilePage
    const handleProfileUpdate = (event: CustomEvent) => {
      console.log('Supervisor profile updated in TopBar:', event.detail);
      
      // Get current supervisorInfo to preserve other fields
      const currentSupervisorInfo = JSON.parse(localStorage.getItem('supervisorSession') || '{}');
      
      // Update the supervisorInfo state with new data
      const updatedSupervisorInfo = {
        ...currentSupervisorInfo,
        name: event.detail.name,
        email: event.detail.email,
        id: event.detail.id,
        profile: event.detail.profile,
        department: event.detail.department,
        department_name: event.detail.department_name,
        school: event.detail.school,
        college: event.detail.college,
        institution: event.detail.institution
      };
      
      setSupervisorInfo(updatedSupervisorInfo);
      
      // Update supervisorSession in localStorage to keep consistency
      localStorage.setItem('supervisorSession', JSON.stringify(updatedSupervisorInfo));
    };

    // Listen for storage changes (useful for multi-tab scenarios)
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'supervisorSession') {
        loadSupervisorInfo(); 
      }
    };

    window.addEventListener('supervisorProfileUpdated', handleProfileUpdate as EventListener);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('supervisorProfileUpdated', handleProfileUpdate as EventListener);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [router]);

  // Handle click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      // Check if click is outside notifications dropdown
      if (
        showNotifications &&
        notificationsRef.current &&
        !notificationsRef.current.contains(target)
      ) {
        setShowNotifications(false);
      }

      // Check if click is outside user menu dropdown
      if (
        showUserMenu &&
        userMenuRef.current &&
        !userMenuRef.current.contains(target)
      ) {
        setShowUserMenu(false);
      }
    };

    // Add event listener when any dropdown is open
    if (showNotifications || showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    // Cleanup
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications, showUserMenu]);

  // Generate breadcrumbs
  const generateBreadcrumbs = () => {
    const pathSegments = pathname.split('/').filter(segment => segment);
    const breadcrumbs = [{ name: 'Dashboard', path: '/' }];
    
    let currentPath = '';
    pathSegments.forEach(segment => {
      currentPath += `/${segment}`;
      let name = segment
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      // Handle special cases
      if (segment === 'supervisor') name = 'Supervisor';
      if (segment === 'components') name = '';
      if (name) breadcrumbs.push({ name, path: currentPath });
    });

    return breadcrumbs;
  };


  const getNotificationIcon = (type: string) => {
    switch(type) {
      case 'assignment': return 'bi-clipboard-check';
      case 'research': return 'bi-journal-text';
      case 'attendance': return 'bi-calendar-check';
      case 'message': return 'bi-envelope';
      case 'alert': return 'bi-exclamation-circle';
      default: return 'bi-bell';
    }
  };

  const getNotificationColor = (type: string) => {
    switch(type) {
      case 'assignment': return 'text-blue-600 bg-blue-50';
      case 'research': return 'text-purple-600 bg-purple-50';
      case 'attendance': return 'text-orange-600 bg-orange-50';
      case 'message': return 'text-green-600 bg-green-50';
      case 'alert': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  // Mark notification as read
  const markAsRead = (notificationId: number) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, isRead: true }
          : notification
      )
    );
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, isRead: true }))
    );
  };

  // Remove notification
  const removeNotification = (notificationId: number) => {
    setNotifications(prev => 
      prev.filter(notification => notification.id !== notificationId)
    );
  };

  // Handle notification click
  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    setShowNotifications(false);
  };

  // Toggle notifications dropdown
  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
    // Mark notifications as read when opened (optional behavior)
    if (!showNotifications && unreadCount > 0) {
      // Optionally auto-mark as read after a delay
      setTimeout(() => {
        const unreadNotifications = notifications.filter(n => !n.isRead);
        unreadNotifications.forEach(notification => {
          markAsRead(notification.id);
        });
      }, 2000); // 2 seconds delay
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const breadcrumbs = generateBreadcrumbs();

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
      <div className="flex items-center justify-between px-4 lg:px-6 py-3">
        {/* Left Section - Page Title & Breadcrumbs */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 text-sm text-gray-500 mb-1">
            {breadcrumbs.map((breadcrumb, index) => (
              <div key={breadcrumb.path} className="flex items-center">
                {index > 0 && <i className="bi bi-chevron-right mx-2 text-xs"></i>}
                <span className={index === breadcrumbs.length - 1 
                  ? 'text-teal-600 font-medium' 
                  : 'hover:text-teal-600 cursor-pointer transition-colors'}>
                  {breadcrumb.name}
                </span>
              </div>
            ))}

  const breadcrumbs = generateBreadcrumbs();

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
      <div className="px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Left Section - Page Title & Breadcrumbs */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 text-sm text-gray-500 mb-1">
              {breadcrumbs.map((breadcrumb, index) => (
                <div key={breadcrumb.path} className="flex items-center">
                  {index > 0 && <i className="bi bi-chevron-right mx-1.5 text-xs"></i>}
                  {index === breadcrumbs.length - 1 ? (
                    <span className="text-teal-600 font-medium">
                      {breadcrumb.name}
                    </span>
                  ) : (
                    <Link href={breadcrumb.path}>
                      <span className="hover:text-teal-600 cursor-pointer transition-colors">
                        {breadcrumb.name}
                      </span>
                    </Link>
                  )}
                </div>
              ))}
            </div>
            

          </div>
        </div>

        {/* Right Section - Actions & User */}
        <div className="flex items-center space-x-3 lg:space-x-4">
          {/* Time Display */}
          <div className="hidden lg:flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-gray-600 bg-gray-50/80 px-3 py-2 rounded-lg">
              <i className="bi bi-calendar3 text-teal-500"></i>
              <span>{currentDate}</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600 bg-gray-50/80 px-3 py-2 rounded-lg">
              <i className="bi bi-clock text-teal-500"></i>
              <span className="font-medium">{currentTime}</span>
            </div>
          </div>


          {/* Mobile Search Button */}
          <button className="md:hidden p-2 text-gray-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-all">
            <i className="bi bi-search text-xl"></i>
          </button>

          {/* Notifications */}
          <div className="relative" ref={notificationsRef}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleNotifications();
              }}
              className="relative p-2 text-gray-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-all"
            >
              <i className="bi bi-bell text-xl"></i>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div 
                className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50 max-h-96"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Notifications {unreadCount > 0 && (
                      <span className="ml-2 px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                        {unreadCount} new
                      </span>
                    )}
                  </h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-sm text-teal-600 hover:text-teal-700 font-medium"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                
                <div className="max-h-64 overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification)}
                        className={`px-4 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-b-0 cursor-pointer transition-all group ${
                          !notification.isRead ? 'bg-blue-50/50' : ''
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0 mt-1">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getNotificationColor(notification.type)}`}>
                              <i className={`${getNotificationIcon(notification.type)} text-sm`}></i>
                            </div>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className={`text-sm font-medium ${!notification.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                                {notification.title}
                              </p>
                              <div className="flex items-center space-x-2">
                                {!notification.isRead && (
                                  <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                                )}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeNotification(notification.id);
                                  }}
                                  className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all"
                                >
                                  <i className="bi bi-x text-sm"></i>
                                </button>
                              </div>
                            </div>
                            <p className="text-sm text-gray-500 truncate mt-1">
                              {notification.description}
                            </p>
                            <div className="flex items-center justify-between mt-2">
                              <p className="text-xs text-gray-400">{notification.time}</p>
                              {notification.priority === 'high' && (
                                <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-medium">
                                  High Priority
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-8 text-center">
                      <i className="bi bi-bell-slash text-gray-300 text-3xl mb-2"></i>
                      <p className="text-gray-500">No notifications</p>
                    </div>
                  )}
                </div>
                
                {notifications.length > 0 && (
                  <div className="px-4 py-3 border-t border-gray-100">
                    <button className="text-sm text-teal-600 hover:text-teal-700 font-medium w-full text-center">
                      View all notifications
                    </button>
          {/* Right Section - Actions & User */}
          <div className="flex items-center space-x-3">
            {/* User Profile */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-3 px-3 py-2 hover:bg-gray-50 rounded-lg transition-all"
              >
                {supervisorInfo?.profile ? (
                  <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-lg flex items-center justify-center">
                    <img src={supervisorInfo.profile} alt="Profile" className="w-full h-full object-cover rounded-lg" />
                  </div>
                ) : (
                  <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {supervisorInfo?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'SU'}
                    </span>

                  </div>
                )}
              </div>
            )}
          </div>

          {/* User Profile */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowUserMenu(!showUserMenu);
              }}
              className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg transition-all"
            >
              {supervisorInfo?.profile ? (
                <img
                  src={supervisorInfo.profile}
                  alt="Profile"
                  className="w-8 h-8 lg:w-10 lg:h-10 rounded-full object-cover border-2 border-white shadow-sm"
                />
              ) : (
                <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-r from-teal-400 to-teal-500 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                  <span className="text-white font-semibold text-sm">
                    {supervisorInfo?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'S'}
                  </span>
                </div>
              )}

              <div className="hidden lg:block text-left">
                <p className="text-sm font-semibold text-gray-900 truncate max-w-32">
                  {supervisorInfo?.name || 'Supervisor'}
                </p>
                <p className="text-xs text-teal-600 truncate max-w-32">
                  {supervisorInfo?.department_name || 'Department'}
                </p>
              </div>
              <i className="bi bi-chevron-down text-gray-400 text-sm hidden lg:block"></i>
            </button>

            {/* User Menu Dropdown */}
            {showUserMenu && (
              <div 
                className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="bg-gradient-to-r from-teal-600 to-emerald-600 px-4 py-4">
                  <div className="flex items-center space-x-3">
                    {supervisorInfo?.profile ? (
                      <img
                        src={supervisorInfo.profile}
                        alt="Profile"
                        className="w-14 h-14 rounded-lg object-cover border-4 border-white/30"
                      />
                    ) : (
                      <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-lg flex items-center justify-center border-4 border-white/30">
                        <span className="text-white font-bold text-lg">
                          {supervisorInfo?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'S'}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0 text-white">
                      <p className="text-base font-semibold truncate">
                        {supervisorInfo?.name || 'Supervisor'}
                      </p>
                      <p className="text-sm opacity-90 truncate">
                        {supervisorInfo?.email || 'supervisor@institution.edu'}
                      </p>
                      <p className="text-xs opacity-80 mt-0.5 truncate">
                        {[supervisorInfo?.department_name, supervisorInfo?.school, supervisorInfo?.institution]
                          .filter(Boolean)
                          .join(' • ')}
                      </p>
                    </div>
                  </div>

                  
                  <div className="py-2">
                    <Link href="/profile" className="flex items-center space-x-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      <i className="bi bi-person-circle text-gray-400"></i>
                      <span>My Profile</span>
                    </Link>
                    <div className="border-t border-gray-200 my-2"></div>
                    <Link href="https://www.kamero.rw/~/help" className="flex items-center space-x-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      <i className="bi bi-question-circle text-gray-400"></i>
                      <span>Help & Support</span>
                    </Link>
                    <Link href="/auth/logout" className="flex items-center space-x-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
                      <i className="bi bi-box-arrow-right text-red-500"></i>
                      <span>Sign Out</span>
                    </Link>
                  </div>

                </div>
                
                <div className="py-2">
                  <Link href="/profile" className="flex items-center space-x-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                    <i className="bi bi-person-gear text-teal-500"></i>
                    <span>My Profile</span>
                  </Link>
                  <Link href="/settings" className="flex items-center space-x-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                    <i className="bi bi-gear text-teal-500"></i>
                    <span>Settings</span>
                  </Link>
                  <Link href="/activity" className="flex items-center space-x-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                    <i className="bi bi-activity text-teal-500"></i>
                    <span>Activity Log</span>
                  </Link>
                  <div className="border-t border-gray-200 my-2"></div>
                  <Link href="/help" className="flex items-center space-x-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                    <i className="bi bi-question-circle text-gray-400"></i>
                    <span>Help & Support</span>
                  </Link>
                  <Link href="/auth/logout" className="flex items-center space-x-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
                    <i className="bi bi-box-arrow-right text-red-500"></i>
                    <span>Sign Out</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopBar;