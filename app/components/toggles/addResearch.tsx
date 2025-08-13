"use client";
import React, { useEffect, useState, useRef } from "react";
// IMPROVEMENT: Removed unused imports (FileText, AlertCircle) for cleaner code.
import { X, Upload, CheckCircle, Sparkles, BookOpen, Building, Calendar, School, FileUp } from "lucide-react";
import AlertNotification from "../app/notify";

const researchTopics = [
  "Pest surveillance and management",
  "Sustainable farming practices",
  "Crop diversification",
  "Food systems",
  "Biofortification",
  "HIV/AIDS and other sexually transmitted infections",
  "Reproductive health and family planning",
  "Infectious diseases (e.g., malaria, Ebola, Marburg virus)",
  "Occupational safety and health in agriculture",
  "Advanced surgical techniques",
  "Higher education development",
  "Access to education in rural areas",
  "Educational technology integration",
  "Curriculum development",
  "Electronic case management systems",
  "Digital transformation in public services",
  "Artificial intelligence applications",
  "Post-genocide reconciliation and justice",
  "Social equity in healthcare",
  "Gender studies",
  "Community development",
  "Climate change adaptation",
  "Biodiversity conservation",
  "Sustainable urban planning",
  "Water resource management",
  "Trade and market dynamics",
  "Infrastructure development",
  "Social protection programs",
  "Energy sector growth",
  "Policy strengthening in labor sectors",
  "Public administration reforms",
  "Legal system effectiveness"
];

interface Departments {
  id: number;
  name: string;
  institute: string;
  school: string;
}

interface Schools {
  id: number;
  name: string;
  institute: string;
}

interface FormData {
  title: string;
  researcher: string;
  category: string;
  status: string;
  school: string | number;
  department: string | number;
  year: string;
  abstract: string;
}

interface AddResearchProps {
  onClose: () => void;
}

const AddResearch: React.FC<AddResearchProps> = ({ onClose }) => {
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
  
  const [departments, setDepartments] = useState<Departments[]>([]);
  const [schools, setSchools] = useState<Schools[]>([]);
  const [institution, setInstitution] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  // IMPROVEMENT: Consolidated `loading` and `submitting` into a single state for simplicity.
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [focusedField, setFocusedField] = useState("");
  const [showModal, setShowModal] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [schoolSearchTerm, setSchoolSearchTerm] = useState<string>("");
  const [departmentSearchTerm, setDepartmentSearchTerm] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Get institution ID from localStorage
  useEffect(() => {
    const userSession = JSON.parse(localStorage.getItem('supervisorSession') || '{}');
    if (userSession && userSession.institution) {
      setInstitution(userSession.institution);
    }
  }, []);

  // Fetch schools
  useEffect(() => {
    const fetchSchools = async () => {
      if (!institution) return;
      
      setIsSubmitting(true);
      try {
        // BUG FIX: Corrected typo from `instution_id` to `institution_id`.
        const response = await fetch(`/itapi/schools/view_by_institution?institution_id=${institution}`);
        if (!response.ok) throw new Error("Failed to fetch schools.");
        const data = await response.json();
        setSchools(data);
      } catch (error) {
        setError("Failed to load schools.");
      } finally {
        setIsSubmitting(false);
      }
    };
    
    if (institution) {
      fetchSchools();
    }
  }, [institution]);

  // Fetch departments
  useEffect(() => {
    const selectedSchoolId = formData.school;
    const fetchDepartments = async () => {
      if (!institution || !selectedSchoolId) return;
      
      setIsSubmitting(true);
      try {
        const response = await fetch(`/api/departments?school_id=${selectedSchoolId}`);
        if (!response.ok) throw new Error("Failed to fetch departments.");
        const data = await response.json();
        setDepartments(data);
      } catch (error) {
        setError("Failed to load departments.");
      } finally {
        setIsSubmitting(false);
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    // Reset department if school changes
    if (id === 'school') {
      setFormData(prev => ({ ...prev, [id]: value, department: '' }));
      setDepartmentSearchTerm('');
    } else {
      setFormData(prev => ({ ...prev, [id]: value }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      setError(null); // Clear previous errors on new valid file
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      setError("Please upload a document");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    
    try {
      // IMPROVEMENT: Retrieve full session to get user ID.
      const userSession = JSON.parse(localStorage.getItem('supervisorSession') || '{}');
      if (!userSession.id || !institution) {
        setError("Your session has expired. Please log in again.");
        setIsSubmitting(false);
        return;
      }

      const payload = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value) payload.append(key, value as string);
      });
      
      payload.append("document", file);
      payload.append("institution", institution);
      payload.append("user_id", userSession.id); // IMPROVEMENT: Ensure user_id is sent to the backend.

      const response = await fetch("/api/add/research", {
        method: "POST",
        body: payload,
      });

      if (response.ok) {
        setSuccess("Research added successfully! 🎉");
        // Reset form state completely
        setFormData({ title: "", researcher: "", category: "", status: "", school: "", department: "", year: "", abstract: "" });
        setSchoolSearchTerm("");
        setDepartmentSearchTerm("");
        setFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        
        setTimeout(onClose, 2000);
      } else {
        const errorData = await response.json();
        // IMPROVEMENT: More robust error handling.
        setError(errorData.error || "An unknown error occurred during submission.");
      }
    } catch (error) {
      setError(`An error occurred: ${(error as Error).message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isStepValid = (step: number): boolean => {
    switch(step) {
      case 1:
        return formData.title.trim() !== "" && formData.researcher.trim() !== "" && formData.category !== "";
      case 2:
        return formData.status !== "" && /^\d{4}$/.test(formData.year) && formData.school !== "" && formData.department !== "";
      case 3:
        return formData.abstract.trim() !== "" && file !== null;
      default:
        return false;
    }
  };

  const maskFileName = (filename: string): string => {
    if (!filename) return "";
    const maxLength = 25; // Define a max length for the visible part
    if (filename.length <= maxLength) return filename;
  
    const lastDotIndex = filename.lastIndexOf('.');
    const extension = lastDotIndex !== -1 ? filename.substring(lastDotIndex) : '';
    const nameWithoutExt = lastDotIndex !== -1 ? filename.substring(0, lastDotIndex) : filename;
  
    return `${nameWithoutExt.substring(0, 10)}...${nameWithoutExt.substring(nameWithoutExt.length - 5)}${extension}`;
  };

  return (
    <>
      <style jsx>{`
        /* Keyframes and animations remain the same */
        @keyframes slide-in { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scale-in { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes shimmer { 0% { background-position: -1000px 0; } 100% { background-position: 1000px 0; } }
        .animate-slide-in { animation: slide-in 0.3s ease-out; }
        .animate-fade-in { animation: fade-in 0.4s ease-out; }
        .animate-scale-in { animation: scale-in 0.3s ease-out; }
        .shimmer { background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%); background-size: 1000px 100%; animation: shimmer 2s infinite; }
        .gradient-border { background: linear-gradient(135deg, #14b8a6 0%, #0891b2 50%, #6366f1 100%); padding: 2px; border-radius: 1rem; }
        .glass-effect { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.18); }
        .floating { animation: float 3s ease-in-out infinite; }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
      `}</style>

      {error && <AlertNotification message={error} type="error" />}
      {success && <AlertNotification message={success} type="success" />}
      
      <div className={`fixed inset-0 backdrop-blur-sm z-40 flex items-center justify-center p-4 ${showModal ? 'animate-fade-in' : ''}`}>
        <div ref={modalRef} className="gradient-border w-full max-w-4xl max-h-[90vh] animate-scale-in">
          <div className="glass-effect rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="relative bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-500 p-6 text-white">
              <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-all duration-300 hover:scale-110"><X size={20} /></button>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-white/20 rounded-full floating"><BookOpen size={28} /></div>
                <div>
                  <h2 className="text-2xl font-bold">Upload Research Material</h2>
                  <p className="text-white/80 text-sm">Share your knowledge with the community</p>
                </div>
              </div>
              <div className="flex items-center justify-center gap-2 mt-6">
                {[1, 2, 3].map((step) => (
                  <div key={step} className="flex items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all duration-300 ${currentStep >= step ? 'bg-white text-teal-600 scale-110' : 'bg-white/20 text-white/60'}`}>
                      {currentStep > step ? <CheckCircle size={20} /> : step}
                    </div>
                    {step < 3 && (<div className={`w-16 h-1 mx-2 rounded transition-all duration-500 ${currentStep > step ? 'bg-white' : 'bg-white/20'}`} />)}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Form Content */}
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              {/* Step 1: Basic Information */}
              {currentStep === 1 && (
                <div className="space-y-6 animate-fade-in">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="relative group">
                      <input id="title" type="text" value={formData.title} onChange={handleChange} onFocus={() => setFocusedField('title')} onBlur={() => setFocusedField('')} className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-teal-500 focus:outline-none transition-all duration-300 peer" placeholder=" " required />
                      {/* BUG FIX: Added `pointer-events-none` to allow clicks and `htmlFor` for accessibility. */}
                      <label htmlFor="title" className="absolute left-4 top-3 text-gray-500 transition-all duration-300 pointer-events-none peer-focus:text-teal-500 peer-focus:-top-2.5 peer-focus:bg-white peer-focus:px-2 peer-focus:text-sm peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-[:not(:placeholder-shown)]:-top-2.5 peer-[:not(:placeholder-shown)]:bg-white peer-[:not(:placeholder-shown)]:px-2 peer-[:not(:placeholder-shown)]:text-sm">
                        Research Title <span className="text-red-500">*</span>
                      </label>
                      {focusedField === 'title' && <div className="absolute inset-0 rounded-lg shimmer pointer-events-none" />}
                    </div>
                    <div className="relative group">
                      <input id="researcher" type="text" value={formData.researcher} onChange={handleChange} onFocus={() => setFocusedField('researcher')} onBlur={() => setFocusedField('')} className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-teal-500 focus:outline-none transition-all duration-300 peer" placeholder=" " required />
                      <label htmlFor="researcher" className="absolute left-4 top-3 text-gray-500 transition-all duration-300 pointer-events-none peer-focus:text-teal-500 peer-focus:-top-2.5 peer-focus:bg-white peer-focus:px-2 peer-focus:text-sm peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-[:not(:placeholder-shown)]:-top-2.5 peer-[:not(:placeholder-shown)]:bg-white peer-[:not(:placeholder-shown)]:px-2 peer-[:not(:placeholder-shown)]:text-sm">
                        Researcher Name <span className="text-red-500">*</span>
                      </label>
                      {focusedField === 'researcher' && <div className="absolute inset-0 rounded-lg shimmer pointer-events-none" />}
                    </div>
                  </div>
                  <div className="relative group">
                    <select id="category" value={formData.category} onChange={handleChange} onFocus={() => setFocusedField('category')} onBlur={() => setFocusedField('')} className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-teal-500 focus:outline-none transition-all duration-300 appearance-none peer" required>
                      <option value=""></option>
                      {researchTopics.map((topic, i) => (<option key={i} value={topic}>{topic}</option>))}
                    </select>
                    <label htmlFor="category" className="absolute left-4 top-3 text-gray-500 transition-all duration-300 pointer-events-none peer-focus:text-teal-500 peer-focus:-top-2.5 peer-focus:bg-white peer-focus:px-2 peer-focus:text-sm peer-[:not(:placeholder-shown)]:-top-2.5 peer-[:not(:placeholder-shown)]:bg-white peer-[:not(:placeholder-shown)]:px-2 peer-[:not(:placeholder-shown)]:text-sm">
                      Research Category <span className="text-red-500">*</span>
                    </label>
                    {focusedField === 'category' && <div className="absolute inset-0 rounded-lg shimmer pointer-events-none" />}
                  </div>
                </div>
              )}
              
              {/* Step 2: Research Details */}
              {currentStep === 2 && (
                <div className="space-y-6 animate-fade-in">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="relative group">
                      <select id="status" value={formData.status} onChange={handleChange} onFocus={() => setFocusedField('status')} onBlur={() => setFocusedField('')} className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-teal-500 focus:outline-none transition-all duration-300 appearance-none peer" required>
                        <option value=""></option>
                        <option value="ongoing">🔄 Ongoing</option>
                        <option value="completed">✅ Completed</option>
                        <option value="pending">🔶 Pending</option>
                      </select>
                      <label htmlFor="status" className="absolute left-4 top-3 text-gray-500 transition-all duration-300 pointer-events-none peer-focus:text-teal-500 peer-focus:-top-2.5 peer-focus:bg-white peer-focus:px-2 peer-focus:text-sm peer-[:not(:placeholder-shown)]:-top-2.5 peer-[:not(:placeholder-shown)]:bg-white peer-[:not(:placeholder-shown)]:px-2 peer-[:not(:placeholder-shown)]:text-sm">
                        Progress Status <span className="text-red-500">*</span>
                      </label>
                      {focusedField === 'status' && <div className="absolute inset-0 rounded-lg shimmer pointer-events-none" />}
                    </div>
                    <div className="relative group">
                      <input id="year" type="text" value={formData.year} onChange={handleChange} onFocus={() => setFocusedField('year')} onBlur={() => setFocusedField('')} className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-teal-500 focus:outline-none transition-all duration-300 peer" placeholder=" " pattern="[0-9]{4}" maxLength={4} required />
                      <label htmlFor="year" className="absolute left-4 top-3 text-gray-500 transition-all duration-300 pointer-events-none peer-focus:text-teal-500 peer-focus:-top-2.5 peer-focus:bg-white peer-focus:px-2 peer-focus:text-sm peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-[:not(:placeholder-shown)]:-top-2.5 peer-[:not(:placeholder-shown)]:bg-white peer-[:not(:placeholder-shown)]:px-2 peer-[:not(:placeholder-shown)]:text-sm">
                        <Calendar size={16} className="inline mr-1" /> Year <span className="text-red-500">*</span>
                      </label>
                      {focusedField === 'year' && <div className="absolute inset-0 rounded-lg shimmer pointer-events-none" />}
                    </div>
                  </div>

                  {/* School Selection */}
                  <div className="relative group">
                    <input type="text" id="school-search" className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-teal-500 focus:outline-none transition-all duration-300 peer" onFocus={() => setFocusedField('school')} onBlur={() => setTimeout(() => setFocusedField(''), 200)} value={schoolSearchTerm} onChange={(e) => setSchoolSearchTerm(e.target.value)} placeholder=" " autoComplete="off" required />
                    <label htmlFor="school-search" className="absolute left-4 top-3 text-gray-500 transition-all duration-300 pointer-events-none peer-focus:text-teal-500 peer-focus:-top-2.5 peer-focus:bg-white peer-focus:px-2 peer-focus:text-sm peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-[:not(:placeholder-shown)]:-top-2.5 peer-[:not(:placeholder-shown)]:bg-white peer-[:not(:placeholder-shown)]:px-2 peer-[:not(:placeholder-shown)]:text-sm">
                      <School size={16} className="inline mr-1" /> School <span className="text-red-500">*</span>
                    </label>
                    {focusedField === 'school' && (
                      <div className="absolute w-full bg-white border border-gray-300 rounded-md mt-1 shadow-lg z-20 max-h-48 overflow-y-auto">
                        <ul>
                          {schools.filter((school) => school.name.toLowerCase().includes(schoolSearchTerm.toLowerCase())).map((school) => (
                              <li key={school.id} className="px-3 py-2 hover:bg-gray-200 cursor-pointer border-b border-gray-100 last:border-b-0" onMouseDown={() => { setSchoolSearchTerm(school.name); setFormData({ ...formData, school: school.id, department: '' }); setDepartmentSearchTerm(''); }}>
                                <div className="font-medium">{school.name}</div>
                                <div className="text-sm text-gray-500">{school.institute}</div>
                              </li>
                            ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Department Selection */}
                  <div className="relative group">
                    <input type="text" id="department-search" className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-teal-500 focus:outline-none transition-all duration-300 peer" onFocus={() => setFocusedField('department')} onBlur={() => setTimeout(() => setFocusedField(''), 200)} value={departmentSearchTerm} onChange={(e) => setDepartmentSearchTerm(e.target.value)} placeholder=" " autoComplete="off" required disabled={!formData.school} />
                    <label htmlFor="department-search" className="absolute left-4 top-3 text-gray-500 transition-all duration-300 pointer-events-none peer-focus:text-teal-500 peer-focus:-top-2.5 peer-focus:bg-white peer-focus:px-2 peer-focus:text-sm peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-[:not(:placeholder-shown)]:-top-2.5 peer-[:not(:placeholder-shown)]:bg-white peer-[:not(:placeholder-shown)]:px-2 peer-[:not(:placeholder-shown)]:text-sm">
                      <Building size={16} className="inline mr-1" /> Department <span className="text-red-500">*</span>
                    </label>
                    {focusedField === 'department' && (
                      <div className="absolute w-full bg-white border border-gray-300 rounded-md mt-1 shadow-lg z-10 max-h-48 overflow-y-auto">
                        <ul>
                          {departments.filter((department) => department.name.toLowerCase().includes(departmentSearchTerm.toLowerCase())).map((department) => (
                              <li key={department.id} className="px-3 py-2 hover:bg-gray-200 cursor-pointer border-b border-gray-100 last:border-b-0" onMouseDown={() => { setDepartmentSearchTerm(department.name); setFormData({ ...formData, department: department.id }); }}>
                                <div className="font-medium">{department.name}</div>
                                <div className="text-sm text-gray-500">{department.school} - {department.institute}</div>
                              </li>
                            ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Step 3: Document & Abstract */}
              {currentStep === 3 && (
                <div className="space-y-6 animate-fade-in">
                  <div className="relative">
                    <input ref={fileInputRef} type="file" onChange={handleFileChange} className="hidden" accept=".pdf,.doc,.docx,.txt,.ppt,.pptx,.xls,.xlsx" />
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full p-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-teal-500 transition-all duration-300 group overflow-hidden">
                      <div className="flex flex-col items-center gap-3">
                        <div className="p-4 bg-teal-50 rounded-full group-hover:bg-teal-100 transition-colors">
                          {file ? (<CheckCircle size={32} className="text-teal-600" />) : (<FileUp size={32} className="text-teal-600" />)}
                        </div>
                        <div>
                          <p className="text-lg font-medium text-gray-700 truncate">{file ? maskFileName(file.name) : "Click to upload document"}</p>
                          <p className="text-sm text-gray-500">PDF, DOC, DOCX, TXT, PPT, etc. (Max 10MB)</p>
                        </div>
                      </div>
                    </button>
                  </div>
                  <div className="relative">
                    <textarea id="abstract" value={formData.abstract} onChange={handleChange} onFocus={() => setFocusedField('abstract')} onBlur={() => setFocusedField('')} rows={6} className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-teal-500 focus:outline-none transition-all duration-300 resize-none peer" placeholder=" " required />
                    <label htmlFor="abstract" className="absolute left-4 top-3 text-gray-500 transition-all duration-300 pointer-events-none peer-focus:text-teal-500 peer-focus:-top-2.5 peer-focus:bg-white peer-focus:px-2 peer-focus:text-sm peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-[:not(:placeholder-shown)]:-top-2.5 peer-[:not(:placeholder-shown)]:bg-white peer-[:not(:placeholder-shown)]:px-2 peer-[:not(:placeholder-shown)]:text-sm">
                      Abstract <span className="text-red-500">*</span>
                    </label>
                    {focusedField === 'abstract' && <div className="absolute inset-0 rounded-lg shimmer pointer-events-none" />}
                  </div>
                </div>
              )}
              
              {/* Navigation Buttons */}
              <div className="flex justify-between items-center mt-8 pt-6 border-t">
                <button type="button" onClick={() => currentStep > 1 ? setCurrentStep(currentStep - 1) : onClose()} className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors">
                  {currentStep === 1 ? 'Cancel' : 'Previous'}
                </button>
                <div className="flex items-center gap-4">
                  {currentStep < 3 ? (
                    <button type="button" onClick={() => setCurrentStep(currentStep + 1)} disabled={!isStepValid(currentStep)} className={`px-8 py-3 rounded-lg font-medium transition-all duration-300 flex items-center gap-2 ${isStepValid(currentStep) ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white hover:shadow-lg hover:scale-105' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
                      Next <Sparkles size={16} />
                    </button>
                  ) : (
                    <button type="submit" disabled={!isStepValid(3) || isSubmitting} className={`px-8 py-3 rounded-lg font-medium transition-all duration-300 flex items-center gap-2 ${isStepValid(3) && !isSubmitting ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white hover:shadow-lg hover:scale-105' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
                      {isSubmitting ? (<><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Uploading...</>) : (<><Upload size={16} /> Upload Research</>)}
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default AddResearch;