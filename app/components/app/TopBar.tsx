"use client";
import { useState, useEffect } from "react";
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

interface Notification {
  id: number;
  type: 'assignment' | 'research' | 'attendance' | 'message' | 'alert';
  title: string;
  description: string;
  time: string;
  isRead: boolean;
  priority?: 'high' | 'medium' | 'low';
}

const TopBar = ({ pageTitle }: TopBarProps) => {
  const [supervisorInfo, setSupervisorInfo] = useState<SupervisorInfo | null>(null);
  const [currentTime, setCurrentTime] = useState<string>("");
  const [currentDate, setCurrentDate] = useState<string>("");
  const [showUserMenu, setShowUserMenu] = useState<boolean>(false);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const pathname = usePathname();
  const router = useRouter();
  
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

  // Get supervisor info
  useEffect(() => {
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
  }, []);

  // Generate breadcrumbs
  const generateBreadcrumbs = () => {
    const pathSegments = pathname.split('/').filter(segment => segment);
    const breadcrumbs = [{ name: 'Home', path: '/' }];
    
    let currentPath = '';
    pathSegments.forEach(segment => {
      currentPath += `/${segment}`;
      let name = segment
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      // Handle special cases
      if (segment === 'supervisor') name = 'Supervisor';
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

  const unreadCount = notifications.filter(n => !n.isRead).length;
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
                  <span className={index === breadcrumbs.length - 1 
                    ? 'text-teal-600 font-medium' 
                    : 'hover:text-teal-600 cursor-pointer transition-colors'}>
                    {breadcrumb.name}
                  </span>
                </div>
              ))}
            </div>
            
          </div>

          {/* Center Section - Date & Time */}
          <div className="hidden lg:flex items-center space-x-4 mx-8">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <i className="bi bi-calendar3 text-teal-600"></i>
              <span>{currentDate}</span>
            </div>
            <div className="w-px h-5 bg-gray-300"></div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <i className="bi bi-clock text-teal-600"></i>
              <span className="font-medium">{currentTime}</span>
            </div>
          </div>

          {/* Right Section - Actions & User */}
          <div className="flex items-center space-x-3">
           


            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2.5 text-gray-500 hover:text-teal-600 hover:bg-gray-50 rounded-lg transition-all"
              >
                <i className="bi bi-bell text-lg"></i>
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs font-semibold rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
                  <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-semibold text-gray-900">Notifications</h3>
                      {unreadCount > 0 && (
                        <span className="text-sm text-gray-500">{unreadCount} unread</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center">
                        <i className="bi bi-bell-slash text-4xl text-gray-300"></i>
                        <p className="mt-2 text-sm text-gray-500">No new notifications</p>
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <div 
                          key={notification.id} 
                          className={`px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 cursor-pointer transition-colors ${
                            !notification.isRead ? 'bg-teal-50/30' : ''
                          }`}
                        >
                          <div className="flex items-start space-x-3">
                            <div className={`p-2 rounded-lg ${getNotificationColor(notification.type)}`}>
                              <i className={`bi ${getNotificationIcon(notification.type)}`}></i>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-900">
                                    {notification.title}
                                  </p>
                                  <p className="text-sm text-gray-600 mt-0.5">
                                    {notification.description}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-1">
                                    {notification.time}
                                  </p>
                                </div>
                                {notification.priority === 'high' && (
                                  <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-red-100 text-red-600 rounded">
                                    High
                                  </span>
                                )}
                              </div>
                            </div>
                            {!notification.isRead && (
                              <div className="w-2 h-2 bg-teal-500 rounded-full mt-2 flex-shrink-0"></div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  
                  {notifications.length > 0 && (
                    <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
                      <button className="text-sm text-teal-600 hover:text-teal-700 font-medium transition-colors">
                        View all notifications
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* User Profile */}
            <div className="relative ml-2">
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

                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-gray-900">
                    {supervisorInfo?.name || 'Supervisor'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {supervisorInfo?.department_name || 'Supervisor'}
                  </p>
                </div>
                <i className="bi bi-chevron-down text-gray-400 text-xs hidden md:block"></i>
              </button>

              {/* User Menu Dropdown */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
                  <div className="bg-teal-600 px-4 py-4">
                    <div className="flex items-center space-x-3">
                      {supervisorInfo?.profile ? (
                        <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-lg flex items-center justify-center">
                          <img src={supervisorInfo.profile} alt="Profile" className="w-full h-full object-cover rounded-lg" />
                        </div>
                      ) : (
                        <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-lg flex items-center justify-center">
                          <span className="text-white font-bold text-lg">
                            {supervisorInfo?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'SU'}
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
                  </div>
                  
                  <div className="py-2">
                    <Link href="/profile" className="flex items-center space-x-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      <i className="bi bi-person-circle text-gray-400"></i>
                      <span>My Profile</span>
                    </Link>
                    <Link href="/settings" className="flex items-center space-x-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      <i className="bi bi-gear text-gray-400"></i>
                      <span>Settings</span>
                    </Link>
                    <Link href="/activity" className="flex items-center space-x-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      <i className="bi bi-activity text-gray-400"></i>
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
      </div>
    </header>
  );
};

export default TopBar;