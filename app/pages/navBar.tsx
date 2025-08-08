import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

interface NavBarProps {
  onNavigate: (page: string) => void;
}

interface UserInfo {
  id: number;
  username: string;
  name: string;
  email: string;
  institution: string;
}

const NavBar = ({ onNavigate }: NavBarProps) => {
  const [currentPath, setCurrentPath] = useState("");
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentPath(window.location.pathname);
      
      // Get user info from localStorage (adjust this based on your auth system)
      const userInfoData = JSON.parse(localStorage.getItem('supervisorSession') || '{}');

      if (userInfoData) {
        try {
          const parsedUserInfo = userInfoData;
          setUserInfo(parsedUserInfo);
        } catch (error) {
          console.error('Error parsing user info:', error);
        }
      } else {
        router.push("/auth/login");
      }
    }
  }, []);

  // Auto-hide navbar on mobile when user scrolls or touches outside
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) { // lg breakpoint
        setIsOpen(false);
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const sidebar = document.getElementById('sidebar');
      const toggleButton = document.getElementById('toggle-button');
      
      if (
        isOpen && 
        sidebar && 
        !sidebar.contains(target) && 
        toggleButton && 
        !toggleButton.contains(target) &&
        window.innerWidth < 1024
      ) {
        setIsOpen(false);
      }
    };

    const handleScroll = () => {
      if (isOpen && window.innerWidth < 1024) {
        setIsOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isOpen]);

  const menu = [
    { 
      name: "Dashboard", 
      url: "/", 
      icon: "bi bi-speedometer2",
    },
    { 
      name: "Assignments", 
      url: "/assignments", 
      icon: "bi bi-clipboard-check",
    },
    { 
      name: "Researches", 
      url: "/researches", 
      icon: "bi bi-journal-text",
    },
    { 
      name: "Attendances", 
      url: "/attendances", 
      icon: "bi bi-calendar-check",
    },
    { 
      name: "Messages", 
      url: "/messages", 
      icon: "bi bi-envelope",
    },
  ];

  const management = [
    { 
      name: "Students", 
      url: "/students", 
      icon: "bi bi-people"
    },
    { 
      name: "Reports", 
      url: "/reports", 
      icon: "bi bi-graph-up"
    },
    { 
      name: "Schedule", 
      url: "/schedule", 
      icon: "bi bi-calendar-week"
    },
  ];
 
  const settings = [
    { 
      name: "Profile", 
      url: "/profile", 
      icon: "bi bi-person-circle"
    },
    { 
      name: "Settings", 
      url: "/settings", 
      icon: "bi bi-gear"
    },
    { 
      name: "Log out", 
      url: "/auth/logout", 
      icon: "bi bi-box-arrow-right"
    },
  ];
  
  const maskEmail = (email:string) => {
    if (!email || !email.includes('@')) {
      return email;
    }
    
    const [localPart, domain] = email.split('@');
    
    if (localPart.length <= 3) {
      // For very short local parts, show first char + ***
      return localPart[0] + '***' + '@' + domain;
    } else {
      // Show first 3 chars + *** + last char before @
      const firstPart = localPart.substring(0, 3);
      const lastChar = localPart[localPart.length - 1];
      return firstPart + '***' + lastChar + '@' + domain;
    }
  };

  return (
    <>
      {/* Toggle Button - Mobile Only */}
      <button
        id="toggle-button"
        className="lg:hidden fixed top-4 right-4 z-50 bg-teal-700 text-white p-3 rounded-lg shadow-lg hover:bg-teal-800 transition-all duration-200"
        onClick={() => setIsOpen(!isOpen)}
      >
        <i className={`bi ${isOpen ? 'bi-x-lg' : 'bi-list'} text-xl`}></i>
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        id="sidebar"
        className={`fixed top-0 left-0 h-screen w-80 max-h-screen overflow-y-auto
          bg-white border-r border-gray-200 shadow-xl 
          text-gray-900 flex flex-col z-40
          transition-transform duration-300 ease-in-out
          ${
            isOpen
              ? "translate-x-0"
              : "translate-x-[-100%] lg:translate-x-0"
          }`}
      >

        {/* User Profile Section */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
              <i className="bi bi-person-fill text-teal-700 text-xl"></i>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {userInfo?.name || 'Supervisor'}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {userInfo?.institution ? userInfo.institution : 'Unknown Institution'}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 py-6">
          {/* Main Menu */}
          <div className="mb-8">
            <h2 className="px-2 mb-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Main Menu
            </h2>
            <ul className="space-y-1">
              {menu.map((item, index) => (
                <li key={index}>
                  <Link href={item.url}>
                    <div
                      onClick={() => {
                        onNavigate(item.name);
                        setIsOpen(false);
                      }}
                      className={`flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer transition-all duration-200 group
                        ${
                          pathname === item.url
                            ? "bg-teal-50 text-teal-700 font-medium"
                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                        }`}
                    >
                      <i className={`${item.icon} text-lg ${
                        pathname === item.url ? 'text-teal-600' : 'text-gray-400 group-hover:text-gray-600'
                      }`}></i>
                      <div className="flex-1">
                        <span className="block text-sm font-medium">{item.name}</span>
                      </div>
                      {pathname === item.url && (
                        <div className="w-1 h-6 bg-teal-600 rounded-full"></div>
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Management Section */}
          <div className="mb-8">
            <h2 className="px-2 mb-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Management
            </h2>
            <ul className="space-y-1">
              {management.map((item, index) => (
                <li key={index}>
                  <Link href={item.url}>
                    <div
                      onClick={() => {
                        onNavigate(item.name);
                        setIsOpen(false);
                      }}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 group
                        ${
                          pathname === item.url
                            ? "bg-teal-50 text-teal-700 font-medium"
                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                        }`}
                    >
                      <i className={`${item.icon} text-lg ${
                        pathname === item.url ? 'text-teal-600' : 'text-gray-400 group-hover:text-gray-600'
                      }`}></i>
                      <span className="text-sm font-medium">{item.name}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Settings Section */}
          <div>
            <h2 className="px-2 mb-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Account
            </h2>
            <ul className="space-y-1">
              {settings.map((item, index) => (
                <li key={index}>
                  <Link href={item.url}>
                    <div
                      onClick={() => {
                        onNavigate(item.name);
                        setIsOpen(false);
                      }}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 group
                        ${
                          pathname === item.url
                            ? "bg-teal-50 text-teal-700 font-medium"
                            : item.name === 'Log out' 
                              ? "text-gray-600 hover:bg-red-50 hover:text-red-600"
                              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                        }`}
                    >
                      <i className={`${item.icon} text-lg ${
                        pathname === item.url ? 'text-teal-600' : 
                        item.name === 'Log out' ? 'text-gray-400 group-hover:text-red-500' : 'text-gray-400 group-hover:text-gray-600'
                      }`}></i>
                      <span className="text-sm font-medium">{item.name}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-xs text-gray-500">System Online</span>
            </div>
            <p className="text-xs text-gray-400">v2.0.1</p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default NavBar;