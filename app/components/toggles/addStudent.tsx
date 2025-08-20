"use client";
import React, { useEffect, useState } from "react";
import Preloader from "../app/buttonPreloader";
import AlertNotification from "../app/notify";

interface FormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  department: string;
  institute?: string;
  uniqueid: string;
  year_of_study: string;
  course: string;
}

const AddStudent: React.FC<{ onClose: () => void; onStudentAdded?: () => void }> = ({
  onClose,
  onStudentAdded,
}) => {
  const [focus, setFocus] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState<FormData>({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    department: "",
    institute: "",
    uniqueid: "",
    year_of_study: "",
    course: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFocus = (field: string) => setFocus((prev) => ({ ...prev, [field]: true }));

  const handleBlur = (field: string, value: string) =>
    setFocus((prev) => ({ ...prev, [field]: value.trim().length > 0 }));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError(null);
  setSuccess(null);
  setLoading(true);

  try {
    // Mock localStorage for demo
    const userSession = JSON.parse(localStorage.getItem("supervisorSession") || "{}");
    const departmentId = userSession.department;
    const instituteId = userSession.institution_id;

  if (!userSession || !departmentId || !instituteId) {
    setError("You must have an access.");
    setLoading(false);
    return;
  } else {
    setFormData((prev) => ({ ...prev, department: departmentId, institute: instituteId }));
  }

 // Clear any previous errors first
setError("");

// Check each field individually and set specific error messages
if (!formData.first_name) {
  setError("First name is required");
  setLoading(false);
  return;
}

if (!formData.last_name) {
  setError("Last name is required");
  setLoading(false);
  return;
}

if (!formData.email) {
  setError("Email is required");
  setLoading(false);
  return;
}

if (!formData.phone) {
  setError("Phone number is required");
  setLoading(false);
  return;
}

if (!formData.uniqueid) {
  setError("Unique ID is required");
  setLoading(false);
  return;
}

if (!formData.course) {
  setError("Course is required");
  setLoading(false);
  return;
}

if (!formData.year_of_study) {
  setError("Year of study is required");
  setLoading(false);
  return;
}

  // Create FormData instead of JSON
  const submitFormData = new FormData();
  submitFormData.append('first_name', formData.first_name);
  submitFormData.append('last_name', formData.last_name);
  submitFormData.append('email', formData.email);
  submitFormData.append('phone', formData.phone);
  submitFormData.append('department', formData.department);
  submitFormData.append('institute', formData.institute || '');
  submitFormData.append('uniqueid', formData.uniqueid);
  submitFormData.append('supervisor_id', userSession.id);
  submitFormData.append('year_of_study', formData.year_of_study);
  submitFormData.append('course', formData.course);

  // Simulate API call
  
    
  const response = await fetch("/api/add/student", {
      method: "POST",
      // Remove Content-Type header - browser will set it automatically for FormData
      body: submitFormData,  // Send FormData instead of JSON
    });
    
    const data = await response.json(); 
    if (!response.ok) {
      setError(data.message || response.statusText);
      setLoading(false);
      return
    }

    setSuccess("Student added successfully!");
    setFormData({
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      uniqueid: "",
      department: "",
      institute: "",
      year_of_study: "",
      course: "",
    });

    if (onStudentAdded) {
      setTimeout(() => {
        onStudentAdded();
      }, 1500);
    }
  } catch (error) {
    setError(error instanceof Error ? error.message : "Unknown error");
    setLoading(false);
    return;
  }
  setLoading(false);
};

  return (
    <div className="fixed inset-0 flex justify-center items-center z-50">
      {/* Enhanced backdrop */}
      <div className="absolute inset-0 backdrop-blur-sm" />
      
      {/* Modal container - centered and compact */}
      <div className="relative w-full max-w-lg mx-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
        {/* Modal content */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header with gradient line */}
          <div className="relative">
            <div className="h-1 bg-gradient-to-r from-teal-400 via-teal-500 to-teal-400" />
            
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute right-4 top-4 w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-teal-600 hover:bg-teal-50 transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <h4 className="text-2xl font-bold text-center pt-6 pb-4 text-teal-600">
              Add New Student
            </h4>
          </div>

          {/* Form container */}
          <div className="px-6 pb-6">
            <div className="space-y-4">
              {success && (<AlertNotification message={success} type="success" />)}
              {error && (<AlertNotification message={error} type="error" />)}

              {/* Name fields */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: "first_name", label: "First Name", type: "text" },
                  { id: "last_name", label: "Other Names", type: "text" },
                ].map((field) => (
                  <div key={field.id} className="relative">
                    <label
                      htmlFor={field.id}
                      className={`absolute left-3 text-gray-500 transition-all duration-200 pointer-events-none ${
                        focus[field.id] || formData[field.id as keyof FormData]
                          ? "top-[-8px] text-xs bg-white px-1 text-teal-500"
                          : "top-2.5 text-sm"
                      }`}
                    >
                      {field.label}
                      <span className="text-red-400 ml-0.5">*</span>
                    </label>
                    <input
                      id={field.id}
                      type={field.type}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-400 focus:ring-1 focus:ring-teal-100 outline-none transition-all"
                      onFocus={() => handleFocus(field.id)}
                      onBlur={(e) => handleBlur(field.id, e.target.value)}
                      value={formData[field.id as keyof FormData]}
                      onChange={handleChange}
                      required
                    />
                  </div>
                ))}
              </div>

              {/* Email field */}
              <div className="relative">
                <label
                  htmlFor="email"
                  className={`absolute left-3 text-gray-500 transition-all duration-200 pointer-events-none ${
                    focus["email"] || formData.email
                      ? "top-[-8px] text-xs bg-white px-1 text-teal-500"
                      : "top-2.5 text-sm"
                  }`}
                >
                  Email<span className="text-red-400 ml-0.5">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-400 focus:ring-1 focus:ring-teal-100 outline-none transition-all"
                  onFocus={() => handleFocus("email")}
                  onBlur={(e) => handleBlur("email", e.target.value)}
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Course and Year of Study fields */}
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <label
                    htmlFor="course"
                    className={`absolute left-3 text-gray-500 transition-all duration-200 pointer-events-none ${
                      focus["course"] || formData.course
                        ? "top-[-8px] text-xs bg-white px-1 text-teal-500"
                        : "top-2.5 text-sm"
                    }`}
                  >
                    Course  <span className={`${focus["course"] ? "hidden" : "text-gray-400 text-xs"}`}>e.g., Computer Science</span><span className="text-red-400 ml-0.5">*</span>
                  </label>
                  <input
                    id="course"
                    type="text"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-400 focus:ring-1 focus:ring-teal-100 outline-none transition-all"
                    onFocus={() => handleFocus("course")}
                    onBlur={(e) => handleBlur("course", e.target.value)}
                    value={formData.course}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="relative">
                  <label
                    htmlFor="year_of_study"
                    className={`absolute left-3 text-gray-500 transition-all duration-200 pointer-events-none ${
                      focus["year_of_study"] || formData.year_of_study
                        ? "top-[-8px] text-xs bg-white px-1 text-teal-500"
                        : "top-2.5 text-sm"
                    }`}
                  >
                    {focus["year_of_study"] && <><span>Year of Study</span><span className="text-red-400 ml-0.5">*</span></>}
                    
                  </label>
                  <select
                    id="year_of_study"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-400 focus:ring-1 focus:ring-teal-100 outline-none transition-all bg-white"
                    onFocus={() => handleFocus("year_of_study")}
                    onBlur={(e) => handleBlur("year_of_study", e.target.value)}
                    value={formData.year_of_study}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Year</option>
                    <option value="1">Year 1</option>
                    <option value="2">Year 2</option>
                    <option value="3">Year 3</option>
                    <option value="4">Year 4</option>
                    <option value="5">Year 5</option>
                    <option value="6">Year 6</option>
                  </select>
                </div>
              </div>

              {/* Phone and ID fields */}
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <label
                    htmlFor="phone"
                    className={`absolute left-3 text-gray-500 transition-all duration-200 pointer-events-none ${
                      focus["phone"] || formData.phone
                        ? "top-[-8px] text-xs bg-white px-1 text-teal-500"
                        : "top-2.5 text-sm"
                    }`}
                  >
                    Phone<span className="text-red-400 ml-0.5">*</span>
                  </label>
                  <input
                    id="phone"
                    type="text"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-400 focus:ring-1 focus:ring-teal-100 outline-none transition-all"
                    onFocus={() => handleFocus("phone")}
                    onBlur={(e) => handleBlur("phone", e.target.value)}
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="relative">
                  <label
                    htmlFor="uniqueid"
                    className={`absolute left-3 text-gray-500 transition-all duration-200 pointer-events-none ${
                      focus["uniqueid"] || formData.uniqueid
                        ? "top-[-8px] text-xs bg-white px-1 text-teal-500"
                        : "top-2.5 text-sm"
                    }`}
                  >
                    Student ID<span className="text-red-400 ml-0.5">*</span>
                  </label>
                  <input
                    id="uniqueid"
                    type="text"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-400 focus:ring-1 focus:ring-teal-100 outline-none transition-all"
                    onFocus={() => handleFocus("uniqueid")}
                    onBlur={(e) => handleBlur("uniqueid", e.target.value)}
                    value={formData.uniqueid}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {/* Submit button */}
              <div className="pt-2">
                <button
                  onClick={handleSubmit}
                  className="w-full py-2.5 rounded-lg bg-gradient-to-r from-teal-500 to-teal-600 text-white font-medium 
                           hover:from-teal-600 hover:to-teal-700 focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 
                           transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]
                           disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                           flex items-center justify-center gap-2 text-sm shadow-lg shadow-teal-500/20"
                  disabled={loading}
                >
                  {loading && <Preloader />}
                  {loading ? 'Adding Student...' : 'Add Student'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddStudent;