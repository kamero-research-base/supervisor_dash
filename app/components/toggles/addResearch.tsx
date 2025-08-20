"use client";
import React, { useEffect, useState, useRef, ChangeEvent, FormEvent } from "react";
import { X, Upload, FileText, CheckCircle, AlertCircle, Sparkles, BookOpen, Building, Calendar, School, FileUp } from "lucide-react";
import AlertNotification from "../app/notify";

// Type definitions
interface FormData {
  title: string;
  researcher: string;
  category: string;
  status: string;
  school: string;
  department: string;
  year: string;
  abstract: string;
}

interface School {
  id: string;
  name: string;
  institute: string;
}

interface Department {
  id: string;
  name: string;
  school: string;
  institute: string;
}

interface UserSession {
  id: string;
  [key: string]: any;
}

interface AddResearchProps {
  onClose?: () => void;
}

interface ApiError {
  error: string;
}

const researchTopics: string[] = [
  "Health Research",
  "Agriculture and Environmental Research",
  "Education and Social Sciences",
  "Energy and Infrastructure",
  "Information and Communication Technology (ICT)",
  "Industry and Manufacturing",
  "Natural and Basic Sciences",
  "Tourism and Cultural Heritage",
  "Policy and Governance",
  "Innovation and Technology Transfer"
];

const AddResearch: React.FC<AddResearchProps> = ({ onClose = () => {} }) => {
  const [formData, setFormData] = useState<FormData>({
    title: "",
    researcher: "",
    category: "",
    status: "",
    school: "",
    department: "",
    year: "",
    abstract: "",
  });
  
  const [departments, setDepartments] = useState<Department[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [institution, setInstitution] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [focusedField, setFocusedField] = useState<string>("");
  const [showModal, setShowModal] = useState<boolean>(true);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [schoolSearchTerm, setSchoolSearchTerm] = useState<string>("");
  const [departmentSearchTerm, setDepartmentSearchTerm] = useState<string>("");
  const [showSchoolDropdown, setShowSchoolDropdown] = useState<boolean>(false);
  const [showDepartmentDropdown, setShowDepartmentDropdown] = useState<boolean>(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const schoolDropdownRef = useRef<HTMLDivElement>(null);
  const departmentDropdownRef = useRef<HTMLDivElement>(null);

  // Get institution ID from localStorage
  useEffect(() => {
    const userSessionData = localStorage.getItem('institutionSession');
    if (userSessionData) {
      try {
        const userSession: UserSession = JSON.parse(userSessionData);
        if (userSession && userSession.id) {
          setInstitution(userSession.id);
        }
      } catch (error) {
        console.error('Error parsing user session:', error);
      }
    }
  }, []);

  // Fetch schools
  useEffect(() => {
    const fetchSchools = async (): Promise<void> => {
      if (!institution) return;
      
      setLoading(true);
      try {
        const response = await fetch(`/api/schools/view_by_institution?institution_id=${institution}`);
        if (!response.ok) throw new Error("Failed to fetch schools.");
        const data: School[] = await response.json();
        setSchools(data);
      } catch (error) {
        setError("Failed to load schools.");
        console.error('Error fetching schools:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (institution) {
      fetchSchools();
    }
  }, [institution]);

  // Fetch departments
  useEffect(() => {
    const selectedSchoolId = formData.school;
    const fetchDepartments = async (): Promise<void> => {
      if (!institution || !selectedSchoolId) {
        setDepartments([]);
        return;
      }
      
      setLoading(true);
      try {
        const response = await fetch(`/api/departments?school_id=${selectedSchoolId}`);
        if (!response.ok) throw new Error("Failed to fetch departments.");
        const data: Department[] = await response.json();
        setDepartments(data);
      } catch (error) {
        setError("Failed to load departments.");
        console.error('Error fetching departments:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (institution && formData.school) {
      fetchDepartments();
    }
  }, [institution, formData.school]);

  // Clear messages after timeout
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  // Handle clicks outside dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      const target = event.target as Node;
      if (schoolDropdownRef.current && !schoolDropdownRef.current.contains(target)) {
        setShowSchoolDropdown(false);
      }
      if (departmentDropdownRef.current && !departmentDropdownRef.current.contains(target)) {
        setShowDepartmentDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>): void => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError("File size must be less than 10MB");
        return;
      }
      const allowedTypes = [
        'application/pdf', 
        'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];
      if (!allowedTypes.includes(selectedFile.type)) {
        setError("Only PDF, DOC, DOCX, TXT, PPT, PPTX, XLS, XLSX files are allowed");
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement>): Promise<void> => {
    e.preventDefault();
    
    if (!file) {
      setError("Please upload a document");
      return;
    }

    setSubmitting(true);
    setLoading(true);
    setError(null);
    
    try {
      const payload = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value) payload.append(key, value);
      });
      
      if (file) {
        payload.append("document", file);
      }
      
      if (institution) {
        payload.append("institution", institution);
      }

      const response = await fetch("/api/add/research", {
        method: "POST",
        body: payload,
      });

      if (response.ok) {
        setSuccess("Research added successfully! 🎉");
        setFormData({
          title: "",
          researcher: "",
          category: "",
          status: "",
          school: "",
          department: "",
          year: "",
          abstract: "",
        });
        setSchoolSearchTerm("");
        setDepartmentSearchTerm("");
        setFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        const errorData: ApiError = await response.json();
        setError(`${errorData.error}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setError(`${errorMessage}`);
    } finally {
      setSubmitting(false);
      setLoading(false);
    }
  };

  const isStepValid = (step: number): boolean => {
    switch(step) {
      case 1:
        return formData.title !== "" && formData.researcher !== "" && formData.category !== "";
      case 2:
        return formData.status !== "" && formData.year !== "" && formData.school !== "" && formData.department !== "";
      case 3:
        return formData.abstract !== "" && file !== null;
      default:
        return false;
    }
  };

  const maskFileName = (filename: string): string => {
    if (!filename || filename.length <= 10) {
      return filename;
    }
    
    const extension = filename.split('.').pop() || '';
    const nameWithoutExt = filename.substring(0, filename.lastIndexOf('.'));
    
    if (nameWithoutExt.length <= 6) {
      return filename;
    }
    
    const firstPart = nameWithoutExt.substring(0, 3);
    const lastPart = nameWithoutExt.substring(nameWithoutExt.length - 3);
    return `${firstPart}***${lastPart}.${extension}`;
  };

  const filteredSchools = schools.filter((school: School) =>
    school.name.toLowerCase().includes(schoolSearchTerm.toLowerCase())
  );

  const filteredDepartments = departments.filter((department: Department) =>
    `${department.name} ${department.school} ${department.institute}`
      .toLowerCase()
      .includes(departmentSearchTerm.toLowerCase())
  );

  const handleSchoolSelect = (school: School) => (e: React.MouseEvent): void => {
    e.preventDefault();
    setSchoolSearchTerm(school.name);
    setDepartmentSearchTerm("");
    setFormData({ ...formData, school: school.id, department: "" });
    setDepartments([]);
    setShowSchoolDropdown(false);
  };

  const handleDepartmentSelect = (department: Department) => (e: React.MouseEvent): void => {
    e.preventDefault();
    setDepartmentSearchTerm(department.name);
    setFormData({ ...formData, department: department.id });
    setShowDepartmentDropdown(false);
  };

  return (
    <>
      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes scale-in {
          from {
            transform: scale(0.9);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        
        @keyframes shimmer {
          0% {
            background-position: -1000px 0;
          }
          100% {
            background-position: 1000px 0;
          }
        }
        
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
        
        .animate-fade-in {
          animation: fade-in 0.4s ease-out;
        }
        
        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
        
        .shimmer {
          background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%);
          background-size: 1000px 100%;
          animation: shimmer 2s infinite;
        }
        
        .gradient-border {
          background: linear-gradient(135deg, #14b8a6 0%, #0891b2 50%, #6366f1 100%);
          padding: 2px;
          border-radius: 1rem;
        }
        
        .glass-effect {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.18);
        }
        
        .floating {
          animation: float 3s ease-in-out infinite;
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
      `}</style>

      {error && <AlertNotification message={error} type="error" />}
      {success && <AlertNotification message={success} type="success" />}
      
      <div className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center p-4 ${showModal ? 'animate-fade-in' : ''}`}>
        <div ref={modalRef} className="gradient-border w-full max-w-4xl max-h-[90vh] animate-scale-in">
          <div className="glass-effect rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="relative bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-500 p-6 text-white">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-all duration-300 hover:scale-110"
                type="button"
              >
                <X size={20} />
              </button>
              
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-white/20 rounded-full floating">
                  <BookOpen size={28} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Upload Research Material</h2>
                  <p className="text-white/80 text-sm">Share your knowledge with the community</p>
                </div>
              </div>
              
              {/* Progress Steps */}
              <div className="flex items-center justify-center gap-2 mt-6">
                {[1, 2, 3].map((step: number) => (
                  <div key={step} className="flex items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all duration-300 ${
                      currentStep >= step ? 'bg-white text-teal-600 scale-110' : 'bg-white/20 text-white/60'
                    }`}>
                      {currentStep > step ? <CheckCircle size={20} /> : step}
                    </div>
                    {step < 3 && (
                      <div className={`w-16 h-1 mx-2 rounded transition-all duration-500 ${
                        currentStep > step ? 'bg-white' : 'bg-white/20'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Form Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              {/* Step 1: Basic Information */}
              {currentStep === 1 && (
                <div className="space-y-6 animate-fade-in">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="relative group">
                      <input
                        id="title"
                        type="text"
                        value={formData.title}
                        onChange={handleChange}
                        onFocus={() => setFocusedField('title')}
                        onBlur={() => setFocusedField('')}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-teal-500 focus:outline-none transition-all duration-300 peer"
                        placeholder=" "
                        required
                      />
                      <label htmlFor="title" className="absolute left-4 top-3 text-gray-500 transition-all duration-300 peer-focus:text-teal-500 peer-focus:-top-2.5 peer-focus:bg-white peer-focus:px-2 peer-focus:text-sm peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-[:not(:placeholder-shown)]:-top-2.5 peer-[:not(:placeholder-shown)]:bg-white peer-[:not(:placeholder-shown)]:px-2 peer-[:not(:placeholder-shown)]:text-sm pointer-events-none">
                        Research Title <span className="text-red-500">*</span>
                      </label>
                      {focusedField === 'title' && <div className="absolute inset-0 rounded-lg shimmer pointer-events-none" />}
                    </div>
                    
                    <div className="relative group">
                      <input
                        id="researcher"
                        type="text"
                        value={formData.researcher}
                        onChange={handleChange}
                        onFocus={() => setFocusedField('researcher')}
                        onBlur={() => setFocusedField('')}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-teal-500 focus:outline-none transition-all duration-300 peer"
                        placeholder=" "
                        required
                      />
                      <label htmlFor="researcher" className="absolute left-4 top-3 text-gray-500 transition-all duration-300 peer-focus:text-teal-500 peer-focus:-top-2.5 peer-focus:bg-white peer-focus:px-2 peer-focus:text-sm peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-[:not(:placeholder-shown)]:-top-2.5 peer-[:not(:placeholder-shown)]:bg-white peer-[:not(:placeholder-shown)]:px-2 peer-[:not(:placeholder-shown)]:text-sm pointer-events-none">
                        Researcher Name <span className="text-red-500">*</span>
                      </label>
                      {focusedField === 'researcher' && <div className="absolute inset-0 rounded-lg shimmer pointer-events-none" />}
                    </div>
                  </div>
                  
                  <div className="relative group">
                    <select
                      id="category"
                      value={formData.category}
                      onChange={handleChange}
                      onFocus={() => setFocusedField('category')}
                      onBlur={() => setFocusedField('')}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-teal-500 focus:outline-none transition-all duration-300 appearance-none peer"
                      required
                    >
                      <option value=""></option>
                      {researchTopics.map((topic: string, i: number) => (
                        <option key={i} value={topic}>{topic}</option>
                      ))}
                    </select>
                    <label htmlFor="category" className="absolute left-4 top-3 text-gray-500 transition-all duration-300 peer-focus:text-teal-500 peer-focus:-top-2.5 peer-focus:bg-white peer-focus:px-2 peer-focus:text-sm peer-[:not(:placeholder-shown)]:-top-2.5 peer-[:not(:placeholder-shown)]:bg-white peer-[:not(:placeholder-shown)]:px-2 peer-[:not(:placeholder-shown)]:text-sm pointer-events-none">
                      Research Category <span className="text-red-500">*</span>
                    </label>
                    {focusedField === 'category' && <div className="absolute inset-0 rounded-lg shimmer pointer-events-none" />}
                  </div>
                </div>
              )}
              
              {/* Step 2: Research Details with School and Department */}
              {currentStep === 2 && (
                <div className="space-y-6 animate-fade-in">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="relative group">
                      <select
                        id="status"
                        value={formData.status}
                        onChange={handleChange}
                        onFocus={() => setFocusedField('status')}
                        onBlur={() => setFocusedField('')}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-teal-500 focus:outline-none transition-all duration-300 appearance-none peer"
                        required
                      >
                        <option value=""></option>
                        <option value="ongoing">🔄 Ongoing</option>
                        <option value="completed">✅ Completed</option>
                        <option value="pending">🔶 Pending</option>
                      </select>
                      <label htmlFor="status" className="absolute left-4 top-3 text-gray-500 transition-all duration-300 peer-focus:text-teal-500 peer-focus:-top-2.5 peer-focus:bg-white peer-focus:px-2 peer-focus:text-sm peer-[:not(:placeholder-shown)]:-top-2.5 peer-[:not(:placeholder-shown)]:bg-white peer-[:not(:placeholder-shown)]:px-2 peer-[:not(:placeholder-shown)]:text-sm pointer-events-none">
                        Progress Status <span className="text-red-500">*</span>
                      </label>
                      {focusedField === 'status' && <div className="absolute inset-0 rounded-lg shimmer pointer-events-none" />}
                    </div>
                    
                    <div className="relative group">
                      <input
                        id="year"
                        type="text"
                        value={formData.year}
                        onChange={handleChange}
                        onFocus={() => setFocusedField('year')}
                        onBlur={() => setFocusedField('')}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-teal-500 focus:outline-none transition-all duration-300 peer"
                        placeholder=" "
                        pattern="[0-9]{4}"
                        maxLength={4}
                        required
                      />
                      <label htmlFor="year" className="absolute left-4 top-3 text-gray-500 transition-all duration-300 peer-focus:text-teal-500 peer-focus:-top-2.5 peer-focus:bg-white peer-focus:px-2 peer-focus:text-sm peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-[:not(:placeholder-shown)]:-top-2.5 peer-[:not(:placeholder-shown)]:bg-white peer-[:not(:placeholder-shown)]:px-2 peer-[:not(:placeholder-shown)]:text-sm pointer-events-none">
                        <Calendar size={16} className="inline mr-1" />
                        Year <span className="text-red-500">*</span>
                      </label>
                      {focusedField === 'year' && <div className="absolute inset-0 rounded-lg shimmer pointer-events-none" />}
                    </div>
                  </div>

                  {/* School Selection */}
                  <div ref={schoolDropdownRef} className="relative group">
                    <input
                      type="text"
                      id="school"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-teal-500 focus:outline-none transition-all duration-300 peer"
                      onFocus={() => {
                        setFocusedField('school');
                        setShowSchoolDropdown(true);
                      }}
                      onBlur={() => setFocusedField('')}
                      value={schoolSearchTerm}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => {
                        setSchoolSearchTerm(e.target.value);
                        setShowSchoolDropdown(true);
                      }}
                      placeholder=" "
                      required
                    />
                    <label htmlFor="school" className="absolute left-4 top-3 text-gray-500 transition-all duration-300 peer-focus:text-teal-500 peer-focus:-top-2.5 peer-focus:bg-white peer-focus:px-2 peer-focus:text-sm peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-[:not(:placeholder-shown)]:-top-2.5 peer-[:not(:placeholder-shown)]:bg-white peer-[:not(:placeholder-shown)]:px-2 peer-[:not(:placeholder-shown)]:text-sm pointer-events-none">
                      <School size={16} className="inline mr-1" />
                      School <span className="text-red-500">*</span>
                    </label>
                    {showSchoolDropdown && (
                      <div className="absolute w-full bg-white border border-gray-300 rounded-md mt-1 shadow-lg z-20 max-h-48 overflow-y-auto">
                        {filteredSchools.length > 0 ? (
                          <ul>
                            {filteredSchools.map((school: School) => (
                              <li
                                key={school.id}
                                className="px-3 py-2 hover:bg-gray-200 cursor-pointer border-b border-gray-100 last:border-b-0"
                                onMouseDown={handleSchoolSelect(school)}
                              >
                                <div className="font-medium">{school.name}</div>
                                <div className="text-sm text-gray-500">{school.institute}</div>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <div className="px-4 py-3 text-gray-500 text-center">
                            No schools found
                          </div>
                        )}
                      </div>
                    )}
                    {focusedField === 'school' && <div className="absolute inset-0 rounded-lg shimmer pointer-events-none" />}
                  </div>

                  {/* Department Selection */}
                  <div ref={departmentDropdownRef} className="relative group">
                    <input
                      type="text"
                      id="department"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-teal-500 focus:outline-none transition-all duration-300 peer disabled:bg-gray-100 disabled:cursor-not-allowed"
                      onFocus={() => {
                        if (formData.school) {
                          setFocusedField('department');
                          setShowDepartmentDropdown(true);
                        }
                      }}
                      onBlur={() => setFocusedField('')}
                      value={departmentSearchTerm}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => {
                        setDepartmentSearchTerm(e.target.value);
                        setShowDepartmentDropdown(true);
                      }}
                      placeholder={!formData.school ? "Select a school first" : " "}
                      disabled={!formData.school}
                      required
                    />
                    <label htmlFor="department" className="absolute left-4 top-3 text-gray-500 transition-all duration-300 peer-focus:text-teal-500 peer-focus:-top-2.5 peer-focus:bg-white peer-focus:px-2 peer-focus:text-sm peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-[:not(:placeholder-shown)]:-top-2.5 peer-[:not(:placeholder-shown)]:bg-white peer-[:not(:placeholder-shown)]:px-2 peer-[:not(:placeholder-shown)]:text-sm pointer-events-none peer-disabled:text-gray-400">
                      <Building size={16} className="inline mr-1" />
                      Department <span className="text-red-500">*</span>
                    </label>
                    {showDepartmentDropdown && formData.school && (
                      <div className="absolute w-full bg-white border border-gray-300 rounded-md mt-1 shadow-lg z-10 max-h-48 overflow-y-auto">
                        {filteredDepartments.length > 0 ? (
                          <ul>
                            {filteredDepartments.map((department: Department) => (
                              <li
                                key={department.id}
                                className="px-3 py-2 hover:bg-gray-200 cursor-pointer border-b border-gray-100 last:border-b-0"
                                onMouseDown={handleDepartmentSelect(department)}
                              >
                                <div className="font-medium">{department.name}</div>
                                <div className="text-sm text-gray-500">{department.school} - {department.institute}</div>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <div className="px-4 py-3 text-gray-500 text-center">
                            No departments found
                          </div>
                        )}
                      </div>
                    )}
                    {focusedField === 'department' && <div className="absolute inset-0 rounded-lg shimmer pointer-events-none" />}
                  </div>
                </div>
              )}
              
              {/* Step 3: Document & Abstract */}
              {currentStep === 3 && (
                <div className="space-y-6 animate-fade-in">
                  <div className="relative">
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileChange}
                      className="hidden"
                      accept=".pdf,.doc,.docx,.txt,.ppt,.pptx,.xls,.xlsx"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full p-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-teal-500 transition-all duration-300 group overflow-hidden"
                    >
                      <div className="flex flex-col items-center gap-3">
                        <div className="p-4 bg-teal-50 rounded-full group-hover:bg-teal-100 transition-colors">
                          {file ? (
                            <CheckCircle size={32} className="text-teal-600" />
                          ) : (
                            <FileUp size={32} className="text-teal-600" />
                          )}
                        </div>
                        <div>
                          <p className="text-lg font-medium text-gray-700 truncate">
                            {file ? maskFileName(file.name) : "Click to upload document"}
                          </p>
                          <p className="text-sm text-gray-500">PDF, DOC, DOCX, TXT, PPT, PPTX, XLS, XLSX (Max 10MB)</p>
                        </div>
                      </div>
                    </button>
                  </div>
                  
                  <div className="relative">
                    <textarea
                      id="abstract"
                      value={formData.abstract}
                      onChange={handleChange}
                      onFocus={() => setFocusedField('abstract')}
                      onBlur={() => setFocusedField('')}
                      rows={6}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-teal-500 focus:outline-none transition-all duration-300 resize-none peer"
                      placeholder=" "
                      required
                    />
                    <label htmlFor="abstract" className="absolute left-4 top-3 text-gray-500 transition-all duration-300 peer-focus:text-teal-500 peer-focus:-top-2.5 peer-focus:bg-white peer-focus:px-2 peer-focus:text-sm peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-[:not(:placeholder-shown)]:-top-2.5 peer-[:not(:placeholder-shown)]:bg-white peer-[:not(:placeholder-shown)]:px-2 peer-[:not(:placeholder-shown)]:text-sm pointer-events-none">
                      Abstract <span className="text-red-500">*</span>
                    </label>
                    {focusedField === 'abstract' && <div className="absolute inset-0 rounded-lg shimmer pointer-events-none" />}
                  </div>
                </div>
              )}
              
              {/* Navigation Buttons */}
              <div className="flex justify-between items-center mt-8 pt-6 border-t">
                <button
                  type="button"
                  onClick={() => currentStep > 1 ? setCurrentStep(currentStep - 1) : onClose()}
                  className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  {currentStep === 1 ? 'Cancel' : 'Previous'}
                </button>
                
                <div className="flex items-center gap-4">
                  {currentStep < 3 ? (
                    <button
                      type="button"
                      onClick={() => setCurrentStep(currentStep + 1)}
                      disabled={!isStepValid(currentStep)}
                      className={`px-8 py-3 rounded-lg font-medium transition-all duration-300 flex items-center gap-2 ${
                        isStepValid(currentStep)
                          ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white hover:shadow-lg hover:scale-105'
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      Next
                      <Sparkles size={16} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={!isStepValid(3) || loading || submitting}
                      onClick={handleSubmit}
                      className={`px-8 py-3 rounded-lg font-medium transition-all duration-300 flex items-center gap-2 ${
                        isStepValid(3) && !loading && !submitting
                          ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white hover:shadow-lg hover:scale-105'
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {loading || submitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload size={16} />
                          Upload Research
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AddResearch;