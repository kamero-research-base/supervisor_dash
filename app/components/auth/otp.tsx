"use client";

import React, { useEffect, useState } from "react";
import ChangePassword from "./change-password";
import AlertNotification from "../app/notify";
import Preloader from "../app/buttonPreloader";
import { useRouter } from "next/navigation";

interface FormData {
  hashed_id: string;
  code: string;
}

interface Props {
  hashed: string;
  email: string;
  type: string;
}

const VerifyOtpForm = ({ hashed, email, type }: Props) => {
  const [focus, setFocus] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState<FormData>({
    hashed_id: hashed,
    code: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false); // Add this state to track verification
  const [timer, setTimer] = useState(false);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120); // Make timeLeft a state variable
  const router = useRouter();

  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 10000); // Hide after 10 seconds
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  // Fixed timer logic
  useEffect(() => {
    const holder = document.getElementById('counter') as HTMLDivElement;
    if (!holder) return;

    const timerInterval = setInterval(() => {
      setTimeLeft((prevTime) => {
        const newTime = prevTime - 1;
        const minutes = Math.floor(newTime / 60);
        const seconds = newTime % 60;
        
        holder.textContent = newTime > 0 ? `${minutes}:${seconds < 10 ? "0" : ""}${seconds}` : "";
        
        if (newTime <= 0) {
          clearInterval(timerInterval);
          setTimer(true);
          return 0;
        }
        
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timerInterval);
  }, []);

  const handleFocus = (field: string) =>
    setFocus((prev) => ({ ...prev, [field]: true }));

  const handleBlur = (field: string, value: string) =>
    setFocus((prev) => ({ ...prev, [field]: value.trim().length > 0 }));

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { id, value } = e.target;
    // Only allow digits and limit to 6 characters
    if (/^\d*$/.test(value) && value.length <= 6) {
      setFormData((prev) => ({ ...prev, [id]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.code.length !== 6) {
      setError("Please enter all 6 digits");
      return;
    }

    setLoading(true);

    const payload = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (value) payload.append(key, value as string);
    });

    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        body: payload,
      });

      if (response.ok) {
        setSuccess("OTP verified! ✅");
        setIsVerified(true); // Set verification state to true
        setLoading(false);
        
        // The JWT token is now stored as an HTTP-only cookie by the server
        // No need to store anything in localStorage for authentication
        
        // If not forgotten password, redirect after a short delay
        if (type !== 'forgotten-password') {
          setTimeout(() => {
            router.push("/");
          }, 2000);
        }
      } else {
        const error = await response.json();
        setError(error.message);
        setLoading(false);
      }
    } catch (error) {
      setLoading(false);
      setError(`Verification failed! ${(error as Error).message}`);
    }
  };

  const handleResendCode = async () => {
    setLoading(true);
    setTimer(false);
    setTimeLeft(120); // Reset timer
    
    try {
      const response = await fetch("/api/auth/resend-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ hashed_id: hashed }),
      });

      if (response.ok) {
        setLoading(false);
        setSuccess("OTP sent successfully ✅");
        setFormData(prev => ({ ...prev, code: "" }));
      } else {
        const error = await response.json();
        setError(error.message);
        setLoading(false);
      }
    } catch (error) {
      setLoading(false);
      setError(`Resend failed! Try again ${(error as Error).message}`);
    }
  };

  // Updated conditional rendering using isVerified state instead of success message
  if (isVerified && hashed !== "" && type === 'forgotten-password') {
    return <ChangePassword hashed={hashed} />;
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
              {/* Company Logo */}
              <div className="bg-white p-2 rounded-full">
                <img src="/logo.svg" alt="Company Logo" className="w-18 h-18" />
              </div>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white">Email Verification</h1>
          <p className="text-white/90 mt-1 text-sm">We've sent a code to {email}</p>
        </div>

        <div className="p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>

            {/* OTP Input Field */}
            <div className="relative">
              <input
                id="code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                className="w-full px-4 py-3 bg-white/90 rounded-lg border border-teal-100 focus:border-teal-400 focus:ring-2 focus:ring-teal-200 focus:outline-none transition-all duration-300 text-gray-800 placeholder-gray-400 text-center text-2xl font-bold tracking-[0.5em]"
                onFocus={() => handleFocus("code")}
                onBlur={(e) => handleBlur("code", e.target.value)}
                value={formData.code}
                onChange={handleChange}
                required
                placeholder=" "
              />
              <label
                htmlFor="code"
                className={`absolute left-4 text-gray-500 transition-all duration-300 pointer-events-none ${
                  focus["code"] || formData.code
                    ? "top-[-10px] text-xs bg-gradient-to-r from-teal-600 to-cyan-500 text-white px-2 py-0.5 rounded-md"
                    : "top-3 text-base"
                }`}
              >
                Enter 6-digit code
              </label>
              
              {/* Progress dots */}
              <div className="flex justify-center mt-4 space-x-2">
                {[...Array(6)].map((_, index) => (
                  <div
                    key={index}
                    className={`h-2 w-2 rounded-full transition-all duration-300 ${
                      index < formData.code.length
                        ? 'bg-teal-600'
                        : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Timer and Resend */}
            <div className="flex justify-center items-center">
              <div className="text-center">
                {!timer ? (
                  <p className="text-gray-600 text-sm">
                    Resend code in <span className="font-semibold text-teal-700" id="counter"></span>
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={loading}
                    className="text-teal-600 hover:text-teal-700 font-medium text-sm transition-colors flex items-center space-x-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                    </svg>
                    <span>Resend Code</span>
                  </button>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || formData.code.length !== 6}
              className="w-full bg-gradient-to-r from-teal-700 to-cyan-700 hover:from-teal-600 hover:to-cyan-600 text-white py-3 rounded-lg font-medium flex items-center justify-center space-x-2 shadow-lg hover:shadow-teal-200 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Preloader />
              ) : (
                <>
                  <span>Verify Code</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              Didn't receive the code?{" "}
              <span className="text-teal-600 font-medium">
                Check your spam folder
              </span>
            </p>
          </div>
        </div>

        <div className="bg-teal-50 p-4 text-center border-t border-teal-100">
          <p className="text-xs text-gray-500">
            &copy; {new Date().getFullYear()} Kamero Research Base. All rights reserved.
          </p>
        </div>
      </div>
      
      {/* Add CSS for blob animation */}
      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
    </div>
  );
};

export default VerifyOtpForm;