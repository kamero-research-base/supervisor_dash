"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import VerifyOtpForm from "./otp";
import Preloader from "../app/buttonPreloader";
import AlertNotification from "../app/notify";

interface FormData {
  login: string;
  password: string;
}

interface UserSession {
  id: string;
  name: string;
  department_id: string;
  profile: string;
  email: string;
  session_id?: string;
  hashed_id?: string;
  loginTime?: string;
}

// Session helper functions to use across your app
export const getSession = (): UserSession | null => {
  try {
    const sessionStr = localStorage.getItem('supervisorSession');
    if (!sessionStr) return null;
    return JSON.parse(sessionStr);
  } catch (error) {
    console.error('Error reading session:', error);
    return null;
  }
};

export const updateSession = (updates: Partial<UserSession>) => {
  const currentSession = getSession();
  if (!currentSession) return null;
  
  const updatedSession = { ...currentSession, ...updates };
  localStorage.setItem('supervisorSession', JSON.stringify(updatedSession));
  return updatedSession;
};

export const clearSession = () => {
  localStorage.removeItem('supervisorSession');
};

const LoginForm = () => { 
  const [focus, setFocus] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState<FormData>({
    login: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showOtpForm, setShowOtpForm] = useState(false);
  const [userSession, setUserSession] = useState<any>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const [hashedId, setHashedId] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  const handleFocus = (field: string) =>
    setFocus((prev) => ({ ...prev, [field]: true }));

  const handleBlur = (field: string, value: string) =>
    setFocus((prev) => ({ ...prev, [field]: value.trim().length > 0 }));

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
    
      if (!response.ok) {
        setLoading(false);
        const errorText = await response.json();
        throw new Error(`${errorText.message}`);
      }
    
      const data = await response.json();
      setLoading(false);
      setSuccess(data.message);
      
      // Create session object with all necessary data
      const sessionData: UserSession = {
        id: data.user.id,
        name: data.user.name,
        department_id: data.user.department_id,
        profile: data.user.profile,
        email: data.user.email,
        session_id: "",
        hashed_id: data.user.hashed_id || "",
        loginTime: new Date().toISOString(),
      };

      // Store user session data
      setUserSession(sessionData);
      localStorage.setItem('supervisorSession', JSON.stringify(sessionData));
      
      // Set the email and hashed ID for OTP component
      setUserEmail(formData.login);
      setHashedId(data.user.session_id || data.user.hashed_id || "");

      // Show OTP form
      setTimeout(() => {
        setShowOtpForm(true);
      }, 3000);

    } catch (error: any) {
      setLoading(false);
      setError(error.message);
    }
  };

  // Check if user successfully verified OTP
  useEffect(() => {
    // Check localStorage for successful OTP verification
    const storedSession = getSession();
    if (storedSession && showOtpForm) {
      if (storedSession.session_id === hashedId) {
       // router.push('/');
      }
    }
  }, [showOtpForm, hashedId, router]);

  if(error?.includes("not verified")){
          setTimeout(() => {
            router.push("/auth/verify-account")
          }, 3000);
  }

  // Show OTP form after successful login
  if (showOtpForm) {
    return <VerifyOtpForm 
      hashed={hashedId}
      email={userEmail}
      type=""
    />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-cyan-50 to-sky-100 p-4">
      {/* Animated Background Elements */}
      {error && <AlertNotification message={error} type="error" />}
      {success && <AlertNotification message={success} type="success" />}

      <div className="absolute top-10 left-10 w-72 h-72 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute bottom-20 right-10 w-72 h-72 bg-cyan-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
      
      {/* Glassmorphism Card */}
      <div className="w-full max-w-md bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-teal-100/50 overflow-hidden z-10 transition-all duration-500 hover:shadow-xl hover:border-teal-200">
        
        {/* Teal Gradient Header */}
        <div className="bg-gradient-to-r from-teal-600 to-cyan-900 p-6 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center shadow-lg">
              {/* Company Logo - Restored */}
              <div className="bg-white p-2 rounded-full">
                <img src="/logo.svg" alt="Company Logo" className="w-18 h-18" />
              </div>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white">Welcome Back</h1>
          <p className="text-white/90 mt-1">Sign in to continue to your dashboard</p>
        </div>

        <div className="p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Login Field */}
            <div className="relative">
              <input
                id="login"
                type="text"
                className="w-full px-4 py-3 bg-white/90 rounded-lg border border-teal-100 focus:border-teal-400 focus:ring-2 focus:ring-teal-200 focus:outline-none transition-all duration-300 text-gray-800 placeholder-gray-400"
                onFocus={() => handleFocus("login")}
                onBlur={(e) => handleBlur("login", e.target.value)}
                value={formData.login}
                onChange={handleChange}
                required
                placeholder=" "
              />
              <label
                htmlFor="login"
                className={`absolute left-4 text-gray-500 transition-all duration-300 pointer-events-none ${
                  focus.login || formData.login
                    ? "top-[-10px] text-xs bg-gradient-to-r from-teal-600 to-cyan-500 text-white px-2 py-0.5 rounded-md"
                    : "top-3 text-base"
                }`}
              >
                Email or phone
              </label>
            </div>

            {/* Password Field with Eye Icon */}
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                className="w-full px-4 py-3 pr-12 bg-white/90 rounded-lg border border-teal-100 focus:border-teal-400 focus:ring-2 focus:ring-teal-200 focus:outline-none transition-all duration-300 text-gray-800 placeholder-gray-400"
                onFocus={() => handleFocus("password")}
                onBlur={(e) => handleBlur("password", e.target.value)}
                value={formData.password}
                onChange={handleChange}
                required
                placeholder=" "
              />
              <label
                htmlFor="password"
                className={`absolute left-4 text-gray-500 transition-all duration-300 pointer-events-none ${
                  focus.password || formData.password
                    ? "top-[-10px] text-xs bg-gradient-to-r from-teal-600 to-cyan-500 text-white px-2 py-0.5 rounded-md"
                    : "top-3 text-base"
                }`}
              >
                Password
              </label>
              
              {/* Eye Icon Toggle Button */}
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-teal-600 focus:outline-none focus:text-teal-600 transition-colors duration-200"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  // Eye Off Icon (when password is visible)
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                ) : (
                  // Eye Icon (when password is hidden)
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <input
                  id="remember"
                  type="checkbox"
                  className="w-4 h-4 text-teal-600 bg-white border-gray-300 rounded focus:ring-teal-500"
                />
                <label htmlFor="remember" className="ml-2 text-sm text-gray-600">
                  Remember me
                </label>
              </div>
              <Link href="/auth/forgot-password" className="text-sm text-teal-600 hover:text-teal-700 transition-colors">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-teal-700 to-cyan-700 hover:from-teal-600 hover:to-cyan-600 text-white py-3 rounded-lg font-medium flex items-center justify-center space-x-2 shadow-lg hover:shadow-teal-200 transition-all duration-300"
            >
              {loading ? (
                <Preloader />
              ) : (
                <>
                  <span>Sign In</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Don't have an account?{" "}
              <Link href="/auth/register" className="text-teal-600 font-medium hover:text-teal-700 transition-colors">
                Contact Sales
              </Link>
            </p>
          </div>
        </div>

        <div className="bg-teal-50 p-4 text-center border-t border-teal-100">
          <p className="text-xs text-gray-500">
            &copy; {new Date().getFullYear()} Kamero Research Base. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;