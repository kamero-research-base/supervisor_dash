"use client";

import React, { useState, useEffect } from "react";
import Preloader from "../app/buttonPreloader";
import AlertNotification from "../app/notify";
import VerifyOtpForm from "./otp";

interface FormData {
  email: string;
}

const VerifyForm = () => { 
  const [focus, setFocus] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState<FormData>({
    email: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [hashedId, setHashedId] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOtpForm, setShowOtpForm] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setLoading(false);
        setSuccess("Email verified successfully! ✅");
        const data = await response.json();
        setHashedId(data.user.hashed_id);
        // Show OTP form
        setTimeout(() => {
          setShowOtpForm(true);
        }, 3000);
      } else {
        setLoading(false);
        const errorData = await response.json();
        setError(errorData.message || "An error occurred");
      }
    } catch (error) {
      setLoading(false);
      setError(`Email does not exist! ${(error as Error).message}`);
    }
  };

   // Show OTP form after successful login
   if (showOtpForm) {
    return <VerifyOtpForm 
      hashed={hashedId}
      email={formData.email}
      type=""
    />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-cyan-50 to-sky-100 p-4">
        {error && <AlertNotification message={error} type="error" />}
          {success && <AlertNotification message={success} type="success" />}

      {/* Animated Background Elements */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute bottom-20 right-10 w-72 h-72 bg-cyan-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
      
      {/* Glassmorphism Card */}
      <div className="w-full max-w-md bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-teal-100/50 overflow-hidden z-10 transition-all duration-500 hover:shadow-xl hover:border-teal-200">
        
        {/* Teal Gradient Header */}
        <div className="bg-gradient-to-r from-teal-600 to-cyan-900 p-6 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center shadow-lg">
              {/* Email Verification Icon */}
              <div className="bg-white p-2 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white">Verify Your Email</h1>
          <p className="text-white/90 mt-1">Enter your email address to continue</p>
        </div>

        <div className="p-8">
        
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="relative">
              <input
                id="email"
                type="email"
                className="w-full px-4 py-3 bg-white/90 rounded-lg border border-teal-100 focus:border-teal-400 focus:ring-2 focus:ring-teal-200 focus:outline-none transition-all duration-300 text-gray-800 placeholder-gray-400"
                onFocus={() => handleFocus("email")}
                onBlur={(e) => handleBlur("email", e.target.value)}
                value={formData.email}
                onChange={handleChange}
                required
                placeholder=" "
              />
              <label
                htmlFor="email"
                className={`absolute left-4 text-gray-500 transition-all duration-300 pointer-events-none ${
                  focus["email"] || formData.email
                    ? "top-[-10px] text-xs bg-gradient-to-r from-teal-600 to-cyan-500 text-white px-2 py-0.5 rounded-md"
                    : "top-3 text-base"
                }`}
              >
                Enter email address
                <span className="text-red-300 ml-1">*</span>
              </label>
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
                  <span>Verify Email</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              Want to login? <button
                onClick={() => window.location.assign('/auth/login')}
                className="text-teal-600 font-medium hover:text-teal-700 transition-colors"
              >
                Back to Login
              </button>
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

export default VerifyForm;