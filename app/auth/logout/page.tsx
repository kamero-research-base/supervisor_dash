"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const Logout: React.FC = () => {
    const router = useRouter();
    const [isLoggingOut, setIsLoggingOut] = useState(true);

    useEffect(() => {
        const logoutUser = async () => {
            try {
                // Call the logout API endpoint to clear JWT tokens
                const response = await fetch('/api/auth/logout', {
                    method: 'POST',
                    credentials: 'include', // Include cookies
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                if (response.ok) {
                    // Clear any remaining localStorage data (though we no longer rely on it for auth)
                    localStorage.removeItem('supervisorSession');
                    localStorage.removeItem('userInfo');
                    localStorage.clear();
                    
                    setIsLoggingOut(false);
                    
                    // Redirect to login page after a short delay
                    setTimeout(() => {
                        router.push('/auth/login');
                    }, 1000);
                } else {
                    console.error("Logout failed:", await response.text());
                    // Still clear local storage and redirect even if API fails
                    localStorage.clear();
                    setIsLoggingOut(false);
                    setTimeout(() => {
                        router.push('/auth/login');
                    }, 1000);
                }
            } catch (error) {
                console.error("Error logging out:", error);
                // Clear local storage and redirect even on error
                localStorage.clear();
                setIsLoggingOut(false);
                setTimeout(() => {
                    router.push('/auth/login');
                }, 1000);
            }
        };

        logoutUser();
    }, [router]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 max-w-md w-full text-center border border-white/20">
                <div className="w-16 h-16 bg-gradient-to-r from-indigo-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    {isLoggingOut ? (
                        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                        <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    )}
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    {isLoggingOut ? 'Logging out...' : 'Logged out successfully'}
                </h1>
                <p className="text-gray-600">
                    {isLoggingOut ? 'Please wait while we securely log you out.' : 'Redirecting to login page...'}
                </p>
            </div>
        </div>
    );
};

export default Logout;
