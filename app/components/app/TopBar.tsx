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


const TopBar = ({ pageTitle }: TopBarProps) => {
  const [supervisorInfo, setSupervisorInfo] = useState<SupervisorInfo | null>(null);
  const [currentTime, setCurrentTime] = useState<string>("");
  const [currentDate, setCurrentDate] = useState<string>("");
  const [showUserMenu, setShowUserMenu] = useState<boolean>(false);
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
      if (name) breadcrumbs.push({ name, path: currentPath });
    });

    return breadcrumbs;
  };

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