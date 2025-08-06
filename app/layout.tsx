"use client";
import { useState, ReactNode, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import NavBar from "./pages/navBar";
import TopBar from "./components/app/TopBar";
import "../app/styles/globals.css";
import 'bootstrap-icons/font/bootstrap-icons.css';

interface RootLayoutProps {
  children: ReactNode;
}

const manipulateUrl = (url: string) => {
  // Remove the '/i/' prefix
  if (url.startsWith('/auth/')) {
    url = url.replace('/auth/', '');
  } else if (url.startsWith('/users/')) {
    url = url.replace('/users/', '');
  } else if (url.startsWith('/')){
    url = url.replace('/', '');
  } else {
    url = "Dashboard";
  }

  if(url === "") {
    url = "Dashboard";
  }
  url += "";
  // Capitalize the first letter of the remaining word
  const capitalized = url.charAt(0).toUpperCase() + url.slice(1);
  return capitalized;
};

const hideNav = (url: string): boolean => {
  return url.startsWith('/auth');
};

export default function RootLayout({ children }: RootLayoutProps) {
  const path = usePathname();
  const [pageTitle, setPageTitle] = useState<string>("");
  const router = useRouter();

  // Function to update page title when navigating
  const handlePageChange = (newPage: string) => {
    setPageTitle(newPage);
  };

  // Update page title when path changes
  useEffect(() => {
    const title = manipulateUrl(path);
    setPageTitle(title);
    
    // Update document title
    document.title = `${title}`;
  }, [path]);

  const hide = hideNav(path);

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="shortcut icon" href="/logo.svg" type="image/x-icon" />
      </head>
      <body className="bg-gray-50">
        {!hide ? (
          // Main app layout with proper structure
          <div className="min-h-screen flex">
            {/* Sidebar Navigation - Fixed Position */}
            <NavBar onNavigate={handlePageChange} />
            
            {/* Main Content Wrapper - Accounts for sidebar width */}
            <div className="flex-1 lg:ml-80 transition-all duration-300">
              {/* TopBar - Fixed at top of content area */}
              <TopBar pageTitle={pageTitle} />
              
              {/* Scrollable Content Area - Below TopBar */}
              <main className="min-h-[calc(100vh-73px)]">
                <div className="p-6">
                  {/* Content Container with max width for better readability */}
                  <div className="max-w-7xl mx-auto">
                    {children}
                  </div>
                </div>
              </main>
              
              {/* Optional Footer */}
              <footer className="bg-white border-t border-gray-200 py-4 px-6">
                <div className="max-w-7xl mx-auto">
                  <div className="flex flex-col sm:flex-row justify-between items-center text-sm text-gray-500">
                    <p>&copy; {new Date().getFullYear()} Kamero Research Base. All rights reserved.</p>
                    <div className="flex items-center space-x-4 mt-2 sm:mt-0">
                      <a href="/terms" className="hover:text-teal-600 transition-colors">Terms</a>
                      <a href="/privacy" className="hover:text-teal-600 transition-colors">Privacy</a>
                      <a href="/support" className="hover:text-teal-600 transition-colors">Support</a>
                    </div>
                  </div>
                </div>
              </footer>
            </div>
          </div>
        ) : (
          // Auth pages layout (no navigation)
          <div className="min-h-screen flex items-center justify-center">
            <div className="w-full">
              {children}
            </div>
          </div>
        )}
        
        {/* Mobile Overlay Background - Only visible when sidebar is open on mobile */}
        <style jsx global>{`
          @media (max-width: 1023px) {
            body {
              overflow-x: hidden;
            }
          }
        `}</style>
      </body>
    </html>
  );
}