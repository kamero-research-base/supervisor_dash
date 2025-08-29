"use client";
import React, { useEffect, useState, useRef, ChangeEvent, FormEvent, useCallback } from "react";
import { X, Upload, FileText, CheckCircle, AlertCircle, Sparkles, BookOpen, Building, Calendar, School, FileUp, Search, User, Eye, EyeOff, Clock } from "lucide-react";

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
  isPublic: boolean;
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
  name?: string;
  [key: string]: any;
}

interface AddResearchProps {
  onClose?: () => void;
}

interface ApiError {
  error: string;
}

interface ExistingResearch {
  title: string;
  abstract: string;
  researcher: string;
}

interface ResearcherInfo {
  researcher: string;
  institute?: string;
  school?: string;
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

// Enhanced similarity detection using multiple algorithms
const normalizeText = (text: string): string => {
  return text.toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/\b(the|a|an|and|or|of|in|on|at|to|for|with|by)\b/g, ''); // Remove common words
};

// Levenshtein distance
const levenshteinSimilarity = (str1: string, str2: string): number => {
  const s1 = normalizeText(str1);
  const s2 = normalizeText(str2);
  
  if (s1 === s2) return 100;
  if (s1.length === 0 || s2.length === 0) return 0;
  
  const matrix = Array(s2.length + 1).fill(null).map(() => Array(s1.length + 1).fill(null));
  
  for (let i = 0; i <= s1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= s2.length; j++) matrix[j][0] = j;
  
  for (let j = 1; j <= s2.length; j++) {
    for (let i = 1; i <= s1.length; i++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j - 1][i] + 1,
        matrix[j][i - 1] + 1,
        matrix[j - 1][i - 1] + cost
      );
    }
  }
  
  const maxLength = Math.max(s1.length, s2.length);
  return ((maxLength - matrix[s2.length][s1.length]) / maxLength) * 100;
};

// Jaccard similarity (word-based)
const jaccardSimilarity = (str1: string, str2: string): number => {
  const words1 = new Set(normalizeText(str1).split(' ').filter(w => w.length > 2));
  const words2 = new Set(normalizeText(str2).split(' ').filter(w => w.length > 2));
  
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  return union.size === 0 ? 0 : (intersection.size / union.size) * 100;
};

// Cosine similarity (character n-grams)
const cosineSimilarity = (str1: string, str2: string): number => {
  const getNGrams = (text: string, n: number = 3): Map<string, number> => {
    const ngrams = new Map<string, number>();
    const normalized = normalizeText(text);
    for (let i = 0; i <= normalized.length - n; i++) {
      const ngram = normalized.slice(i, i + n);
      ngrams.set(ngram, (ngrams.get(ngram) || 0) + 1);
    }
    return ngrams;
  };

  const ngrams1 = getNGrams(str1);
  const ngrams2 = getNGrams(str2);
  
  const allNgrams = new Set([...ngrams1.keys(), ...ngrams2.keys()]);
  
  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;
  
  for (const ngram of allNgrams) {
    const count1 = ngrams1.get(ngram) || 0;
    const count2 = ngrams2.get(ngram) || 0;
    
    dotProduct += count1 * count2;
    norm1 += count1 * count1;
    norm2 += count2 * count2;
  }
  
  return norm1 === 0 || norm2 === 0 ? 0 : (dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2))) * 100;
};

// Combined similarity score
const calculateSimilarity = (str1: string, str2: string): number => {
  const levenshtein = levenshteinSimilarity(str1, str2);
  const jaccard = jaccardSimilarity(str1, str2);
  const cosine = cosineSimilarity(str1, str2);
  
  // Weighted average (Levenshtein gets more weight as it's more strict)
  const combinedScore = (levenshtein * 0.5) + (jaccard * 0.3) + (cosine * 0.2);
  return Math.round(combinedScore);
};

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
    isPublic: true,
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
  
  // Enhanced validation states
  const [existingResearch, setExistingResearch] = useState<ExistingResearch[]>([]);
  const [researcherList, setResearcherList] = useState<ResearcherInfo[]>([]);
  const [validationErrors, setValidationErrors] = useState<{title?: string, abstract?: string}>({});
  const [isValidating, setIsValidating] = useState({title: false, abstract: false});
  const [validationStatus, setValidationStatus] = useState<{title?: 'pending' | 'valid' | 'invalid', abstract?: 'pending' | 'valid' | 'invalid'}>({});
  const [showResearcherDropdown, setShowResearcherDropdown] = useState(false);
  const [filteredResearchers, setFilteredResearchers] = useState<ResearcherInfo[]>([]);
  const [userSession, setUserSession] = useState<any>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const schoolDropdownRef = useRef<HTMLDivElement>(null);
  const departmentDropdownRef = useRef<HTMLDivElement>(null);
  const researcherRef = useRef<HTMLInputElement>(null);
  const titleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abstractTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Get user session on mount
  useEffect(() => {
    try {
      const session = JSON.parse(localStorage.getItem('userSession') || '{}');
      setUserSession(session);
      if (session && session.name) {
        setFormData(prev => ({ ...prev, researcher: session.name }));
      }
    } catch (error) {
      console.error("Error parsing user session:", error);
    }
  }, []);

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

  // Fetch existing research data for similarity checking
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch titles and abstracts
        const [titlesRes, abstractsRes, researchersRes] = await Promise.all([
          fetch('/api/research/similars/titles'),
          fetch('/api/research/similars/abstracts'),
          fetch('/api/research/similars/researchers')
        ]);
        
        const titles = await titlesRes.json();
        const abstracts = await abstractsRes.json();
        const researchers = await researchersRes.json();
        
        // Combine data
        const combinedData: ExistingResearch[] = [];
        const researcherMap = new Map();
        
        titles.forEach((item: any) => {
          if (!researcherMap.has(item.researcher)) {
            researcherMap.set(item.researcher, { titles: [], abstracts: [] });
          }
          researcherMap.get(item.researcher).titles.push(item.title);
        });
        
        abstracts.forEach((item: any) => {
          if (!researcherMap.has(item.researcher)) {
            researcherMap.set(item.researcher, { titles: [], abstracts: [] });
          }
          researcherMap.get(item.researcher).abstracts.push(item.abstract);
        });
        
        researcherMap.forEach((data, researcher) => {
          data.titles.forEach((title: string) => {
            data.abstracts.forEach((abstract: string) => {
              combinedData.push({ title, abstract, researcher });
            });
          });
        });
        
        setExistingResearch(combinedData);
        setResearcherList(researchers);
        setFilteredResearchers(researchers);
      } catch (error) {
        console.error("Error fetching research data:", error);
      }
    };
    
    fetchData();
  }, []);

  // Enhanced debounced validation function
  const debouncedValidation = useCallback((field: 'title' | 'abstract', value: string) => {
    if (!value.trim()) {
      setValidationErrors(prev => ({ ...prev, [field]: undefined }));
      setValidationStatus(prev => ({ ...prev, [field]: undefined }));
      return;
    }
    
    setIsValidating(prev => ({ ...prev, [field]: true }));
    setValidationStatus(prev => ({ ...prev, [field]: 'pending' }));
    
    setTimeout(() => {
      // Check for exact matches first (100% similarity)
      const exactMatches = existingResearch.filter(research => 
        normalizeText(research[field]) === normalizeText(value)
      );
      
      if (exactMatches.length > 0) {
        setValidationErrors(prev => ({
          ...prev,
          [field]: `🚫 EXACT MATCH FOUND: "${exactMatches[0][field]}" by ${exactMatches[0].researcher}. Please choose a different ${field}.`
        }));
        setValidationStatus(prev => ({ ...prev, [field]: 'invalid' }));
        setIsValidating(prev => ({ ...prev, [field]: false }));
        return;
      }
      
      // Cross-field validation: Check title against abstracts and vice versa
      const crossFieldMatches = existingResearch.filter(research => {
        const crossField = field === 'title' ? 'abstract' : 'title';
        return calculateSimilarity(value, research[crossField]) >= 75; // Higher threshold for cross-field
      });
      
      if (crossFieldMatches.length > 0) {
        const crossField = field === 'title' ? 'abstract' : 'title';
        const topCrossMatch = crossFieldMatches[0];
        setValidationErrors(prev => ({
          ...prev,
          [field]: `🚫 CROSS-FIELD SIMILARITY: Your ${field} is highly similar to an existing ${crossField}:\n"${topCrossMatch[crossField]}" by ${topCrossMatch.researcher}\nThis indicates potential duplicate research content.`
        }));
        setValidationStatus(prev => ({ ...prev, [field]: 'invalid' }));
        setIsValidating(prev => ({ ...prev, [field]: false }));
        return;
      }
      
      // Check for high similarity (70%+ threshold - blocking)
      const highSimilarities = existingResearch
        .map(research => ({
          ...research,
          similarity: calculateSimilarity(value, research[field])
        }))
        .filter(item => item.similarity >= 70)
        .sort((a, b) => b.similarity - a.similarity);
      
      if (highSimilarities.length > 0) {
        const topMatch = highSimilarities[0];
        setValidationErrors(prev => ({
          ...prev,
          [field]: `🚫 HIGH SIMILARITY DETECTED (${topMatch.similarity}%): "${topMatch[field]}" by ${topMatch.researcher}\nPlease make your ${field} more unique to proceed.`
        }));
        setValidationStatus(prev => ({ ...prev, [field]: 'invalid' }));
        setError(`${field} similarity too high. Please revise before submitting.`);
      } else {
        // Check for moderate similarity (50-69%) as warnings
        const moderateSimilarities = existingResearch
          .map(research => ({
            ...research,
            similarity: calculateSimilarity(value, research[field])
          }))
          .filter(item => item.similarity >= 50)
          .sort((a, b) => b.similarity - a.similarity);
        
        if (moderateSimilarities.length > 0) {
          const topMatch = moderateSimilarities[0];
          setValidationErrors(prev => ({
            ...prev,
            [field]: `⚡ MODERATE SIMILARITY (${topMatch.similarity}%): "${topMatch[field]}" by ${topMatch.researcher}\nConsider making your ${field} more distinctive, but submission is allowed.`
          }));
          setValidationStatus(prev => ({ ...prev, [field]: 'valid' }));
        } else {
          setValidationErrors(prev => ({ ...prev, [field]: undefined }));
          setValidationStatus(prev => ({ ...prev, [field]: 'valid' }));
        }
      }
      
      setIsValidating(prev => ({ ...prev, [field]: false }));
    }, 2000); // Reduced timeout for better UX
  }, [existingResearch]);

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

  // Cleanup timeouts
  useEffect(() => {
    return () => {
      if (titleTimeoutRef.current) clearTimeout(titleTimeoutRef.current);
      if (abstractTimeoutRef.current) clearTimeout(abstractTimeoutRef.current);
    };
  }, []);

  // Handle input changes with debounced validation
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>): void => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
    
    // Clear existing timeouts and validation states
    if (id === 'title') {
      if (titleTimeoutRef.current) clearTimeout(titleTimeoutRef.current);
      setValidationErrors(prev => ({ ...prev, title: undefined }));
      setValidationStatus(prev => ({ ...prev, title: undefined }));
    }
    if (id === 'abstract') {
      if (abstractTimeoutRef.current) clearTimeout(abstractTimeoutRef.current);
      setValidationErrors(prev => ({ ...prev, abstract: undefined }));
      setValidationStatus(prev => ({ ...prev, abstract: undefined }));
    }
    
    // Set new timeout for validation
    if (id === 'title' || id === 'abstract') {
      const timeoutId = setTimeout(() => {
        debouncedValidation(id as 'title' | 'abstract', value);
      }, 1000); // Shorter debounce for better UX
      
      if (id === 'title') {
        titleTimeoutRef.current = timeoutId;
      } else {
        abstractTimeoutRef.current = timeoutId;
      }
    }
    
    // Handle researcher field
    if (id === 'researcher') {
      const filtered = researcherList.filter(r => 
        r.researcher.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredResearchers(filtered);
      setShowResearcherDropdown(value.length > 0);
    }
  };

  const handleVisibilityChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, isPublic: e.target.value === 'true' }));
  };

  const handleResearcherSelect = (researcher: ResearcherInfo) => {
    setFormData(prev => ({ ...prev, researcher: researcher.researcher }));
    setShowResearcherDropdown(false);
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
        'text/plain'
      ];
      if (!allowedTypes.includes(selectedFile.type)) {
        setError("Only PDF, DOC, DOCX, TXT files are allowed");
        return;
      }
      setFile(selectedFile);
    }
  };

  // Enhanced validation checking
  const hasBlockingValidationErrors = (): any => {
    const titleBlocked = validationStatus.title === 'invalid' || 
                        validationErrors.title?.includes('🚫');
    const abstractBlocked = validationStatus.abstract === 'invalid' || 
                           validationErrors.abstract?.includes('🚫');
    return titleBlocked || abstractBlocked;
  };

  const isValidationInProgress = (): boolean => {
    return isValidating.title || isValidating.abstract || 
           validationStatus.title === 'pending' || 
           validationStatus.abstract === 'pending';
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement>): Promise<void> => {
    e.preventDefault();
    
    // Enhanced validation blocking
    if (hasBlockingValidationErrors()) {
      setError("Please resolve all similarity issues before submitting. High similarity (≥70%) and exact matches are not allowed.");
      return;
    }
    
    if (isValidationInProgress()) {
      setError("Please wait for similarity checking to complete before submitting.");
      return;
    }
    
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
        if (value !== null && value !== undefined) {
          payload.append(key, String(value));
        }
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
        setSuccess("Research added successfully!");
        setFormData({
          title: "",
          researcher: userSession?.name || "",
          category: "",
          status: "",
          school: "",
          department: "",
          year: "",
          abstract: "",
          isPublic: true,
        });
        setSchoolSearchTerm("");
        setDepartmentSearchTerm("");
        setValidationErrors({});
        setValidationStatus({});
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

  // Enhanced step validation
  const isStepValid = (step: number): boolean => {
    switch(step) {
      case 1:
        const titleValid = formData.title !== "" && 
                          validationStatus.title !== 'invalid' && 
                          !isValidating.title;
        return titleValid && 
               formData.researcher !== "" && 
               formData.category !== "";
      case 2:
        return formData.status !== "" && 
               formData.year !== "" && 
               formData.school !== "" && 
               formData.department !== "";
      case 3:
        const abstractValid = formData.abstract !== "" && 
                             validationStatus.abstract !== 'invalid' && 
                             !isValidating.abstract;
        return abstractValid && 
               file !== null && 
               !hasBlockingValidationErrors() &&
               !isValidationInProgress();
      default:
        return false;
    }
  };

  const getValidationIcon = (field: 'title' | 'abstract') => {
    if (isValidating[field]) {
      return <div className="w-5 h-5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />;
    }
    if (validationStatus[field] === 'valid') {
      return <CheckCircle size={20} className="text-green-500" />;
    }
    if (validationStatus[field] === 'invalid') {
      return <AlertCircle size={20} className="text-red-500" />;
    }
    return null;
  };

  const filteredSchools = schools.filter((school: School) =>
    school.name.toLowerCase().includes(schoolSearchTerm.toLowerCase())
  );

  const filteredDepartments = departments.filter((department: Department) =>
    department.name.toLowerCase().includes(departmentSearchTerm.toLowerCase())
  );

  return (
    <>
      <style jsx>{`
        @keyframes slide-in { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scale-in { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        .animate-slide-in { animation: slide-in 0.3s ease-out; }
        .animate-fade-in { animation: fade-in 0.4s ease-out; }
        .animate-scale-in { animation: scale-in 0.3s ease-out; }
        .animate-pulse { animation: pulse 2s infinite; }
      `}</style>

      {error && (
        <div className="fixed top-4 right-4 z-50 bg-red-500 text-white p-4 rounded-lg shadow-lg animate-slide-in">
          <div className="flex items-center gap-2">
            <AlertCircle size={20} />
            {error}
          </div>
        </div>
      )}
      
      {success && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white p-4 rounded-lg shadow-lg animate-slide-in">
          <div className="flex items-center gap-2">
            <CheckCircle size={20} />
            {success}
          </div>
        </div>
      )}
      
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center p-4 animate-fade-in">
        <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden animate-scale-in">
          {/* Header */}
          <div className="bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-500 p-6 text-white">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-all duration-300"
              type="button"
            >
              <X size={20} />
            </button>
            
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-white/20 rounded-full">
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
                    currentStep >= step ? 'bg-white text-teal-600' : 'bg-white/20 text-white/60'
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
            {/* Validation Status Banner */}
            {(hasBlockingValidationErrors() || isValidationInProgress()) && (
              <div className={`mb-6 p-4 rounded-lg border ${
                hasBlockingValidationErrors() 
                  ? 'bg-red-50 border-red-200' 
                  : 'bg-blue-50 border-blue-200'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {isValidationInProgress() ? (
                    <Clock size={16} className="text-blue-600" />
                  ) : (
                    <AlertCircle size={16} className="text-red-600" />
                  )}
                  <h3 className={`font-semibold ${
                    hasBlockingValidationErrors() ? 'text-red-800' : 'text-blue-800'
                  }`}>
                    {isValidationInProgress() 
                      ? 'Similarity Check in Progress...' 
                      : 'Submission Blocked - Similarity Issues Detected'
                    }
                  </h3>
                </div>
                <p className={`text-sm ${
                  hasBlockingValidationErrors() ? 'text-red-700' : 'text-blue-700'
                }`}>
                  {isValidationInProgress()
                    ? 'Please wait while we check your content for similarities with existing research.'
                    : 'High similarity or exact matches found. Please revise your content before submitting.'
                  }
                </p>
              </div>
            )}

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
                      className={`w-full px-4 py-3 pr-12 border-2 rounded-lg focus:outline-none transition-all duration-300 peer ${
                        validationStatus.title === 'invalid' ? 'border-red-500' : 
                        validationStatus.title === 'valid' ? 'border-green-500' :
                        'border-gray-200 focus:border-teal-500'
                      }`}
                      placeholder=" "
                      required
                    />
                    <label htmlFor="title" className="absolute left-4 top-3 text-gray-500 transition-all duration-300 peer-focus:text-teal-500 peer-focus:-top-2.5 peer-focus:bg-white peer-focus:px-2 peer-focus:text-sm peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-[:not(:placeholder-shown)]:-top-2.5 peer-[:not(:placeholder-shown)]:bg-white peer-[:not(:placeholder-shown)]:px-2 peer-[:not(:placeholder-shown)]:text-sm pointer-events-none">
                      Research Title <span className="text-red-500">*</span>
                    </label>
                    <div className="absolute right-3 top-3">
                      {getValidationIcon('title')}
                    </div>
                    {validationErrors.title && (
                      <div className={`mt-2 p-3 border rounded-lg ${
                        validationStatus.title === 'invalid' 
                          ? 'bg-red-50 border-red-200' 
                          : 'bg-yellow-50 border-yellow-200'
                      }`}>
                        <div className="flex items-start gap-2">
                          <AlertCircle size={16} className={`mt-0.5 flex-shrink-0 ${
                            validationStatus.title === 'invalid' ? 'text-red-500' : 'text-yellow-600'
                          }`} />
                          <div className={`text-sm whitespace-pre-line ${
                            validationStatus.title === 'invalid' ? 'text-red-700' : 'text-yellow-700'
                          }`}>
                            {validationErrors.title}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="relative group">
                    <input
                      ref={researcherRef}
                      id="researcher"
                      type="text"
                      value={formData.researcher}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-teal-500 focus:outline-none transition-all duration-300 peer"
                      placeholder=" "
                      required
                    />
                    <label htmlFor="researcher" className="absolute left-4 top-3 text-gray-500 transition-all duration-300 peer-focus:text-teal-500 peer-focus:-top-2.5 peer-focus:bg-white peer-focus:px-2 peer-focus:text-sm peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-[:not(:placeholder-shown)]:-top-2.5 peer-[:not(:placeholder-shown)]:bg-white peer-[:not(:placeholder-shown)]:px-2 peer-[:not(:placeholder-shown)]:text-sm pointer-events-none">
                      <User size={16} className="inline mr-1" />
                      Researcher Name <span className="text-red-500">*</span>
                    </label>
                  </div>
                </div>
                
                <div className="relative group">
                  <select
                    id="category"
                    value={formData.category}
                    onChange={handleChange}
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
                </div>
              </div>
            )}
            
            {/* Step 2: Research Details */}
            {currentStep === 2 && (
              <div className="space-y-6 animate-fade-in">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="relative group">
                    <select
                      id="status"
                      value={formData.status}
                      onChange={handleChange}
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
                  </div>
                  
                  <div className="relative group">
                    <input
                      id="year"
                      type="text"
                      value={formData.year}
                      onChange={handleChange}
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
                  </div>
                </div>

                {/* Visibility selection */}
                <div className="relative group">
                  <label className="block text-gray-500 mb-2">Visibility</label>
                  <div className="flex gap-4">
                    <label className={`flex-1 p-4 border-2 rounded-lg cursor-pointer transition-all duration-300 ${formData.isPublic ? 'border-teal-500 bg-teal-50' : 'border-gray-200'}`}>
                      <input
                        type="radio"
                        name="visibility"
                        value="true"
                        checked={formData.isPublic}
                        onChange={handleVisibilityChange}
                        className="sr-only"
                      />
                      <div className="flex items-center gap-3">
                        <Eye size={20} className="text-teal-600" />
                        <div>
                          <p className="font-semibold text-gray-800">Public</p>
                          <p className="text-sm text-gray-500">Visible to everyone</p>
                        </div>
                      </div>
                    </label>
                    <label className={`flex-1 p-4 border-2 rounded-lg cursor-pointer transition-all duration-300 ${!formData.isPublic ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'}`}>
                      <input
                        type="radio"
                        name="visibility"
                        value="false"
                        checked={!formData.isPublic}
                        onChange={handleVisibilityChange}
                        className="sr-only"
                      />
                      <div className="flex items-center gap-3">
                        <EyeOff size={20} className="text-indigo-600" />
                        <div>
                          <p className="font-semibold text-gray-800">Private</p>
                          <p className="text-sm text-gray-500">Description only</p>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* School and Department selection (simplified for demo) */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="relative group">
                    <select
                      id="school"
                      value={formData.school}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-teal-500 focus:outline-none transition-all duration-300 appearance-none peer"
                      required
                    >
                      <option value=""></option>
                      {schools.map((school) => (
                        <option key={school.id} value={school.id}>{school.name}</option>
                      ))}
                    </select>
                    <label htmlFor="school" className="absolute left-4 top-3 text-gray-500 transition-all duration-300 peer-focus:text-teal-500 peer-focus:-top-2.5 peer-focus:bg-white peer-focus:px-2 peer-focus:text-sm peer-[:not(:placeholder-shown)]:-top-2.5 peer-[:not(:placeholder-shown)]:bg-white peer-[:not(:placeholder-shown)]:px-2 peer-[:not(:placeholder-shown)]:text-sm pointer-events-none">
                      <School size={16} className="inline mr-1" />
                      School <span className="text-red-500">*</span>
                    </label>
                  </div>

                  <div className="relative group">
                    <select
                      id="department"
                      value={formData.department}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-teal-500 focus:outline-none transition-all duration-300 appearance-none peer disabled:bg-gray-100"
                      disabled={!formData.school}
                      required
                    >
                      <option value=""></option>
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                      ))}
                    </select>
                    <label htmlFor="department" className="absolute left-4 top-3 text-gray-500 transition-all duration-300 peer-focus:text-teal-500 peer-focus:-top-2.5 peer-focus:bg-white peer-focus:px-2 peer-focus:text-sm peer-[:not(:placeholder-shown)]:-top-2.5 peer-[:not(:placeholder-shown)]:bg-white peer-[:not(:placeholder-shown)]:px-2 peer-[:not(:placeholder-shown)]:text-sm pointer-events-none peer-disabled:text-gray-400">
                      <Building size={16} className="inline mr-1" />
                      Department <span className="text-red-500">*</span>
                    </label>
                  </div>
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
                    accept=".pdf,.doc,.docx,.txt"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full p-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-teal-500 transition-all duration-300 group"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div className="p-4 bg-teal-50 rounded-full group-hover:bg-teal-100">
                        {file ? (
                          <CheckCircle size={32} className="text-teal-600" />
                        ) : (
                          <FileUp size={32} className="text-teal-600" />
                        )}
                      </div>
                      <div>
                        <p className="text-lg font-medium text-gray-700">
                          {file ? file.name : "Click to upload document"}
                        </p>
                        <p className="text-sm text-gray-500">PDF, DOC, DOCX, TXT (Max 10MB)</p>
                      </div>
                    </div>
                  </button>
                </div>
                
                <div className="relative">
                  <textarea
                    id="abstract"
                    value={formData.abstract}
                    onChange={handleChange}
                    rows={6}
                    className={`w-full px-4 py-3 pr-12 border-2 rounded-lg focus:outline-none transition-all duration-300 resize-none peer ${
                      validationStatus.abstract === 'invalid' ? 'border-red-500' : 
                      validationStatus.abstract === 'valid' ? 'border-green-500' :
                      'border-gray-200 focus:border-teal-500'
                    }`}
                    placeholder=" "
                    required
                  />
                  <label htmlFor="abstract" className="absolute left-4 top-3 text-gray-500 transition-all duration-300 peer-focus:text-teal-500 peer-focus:-top-2.5 peer-focus:bg-white peer-focus:px-2 peer-focus:text-sm peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-[:not(:placeholder-shown)]:-top-2.5 peer-[:not(:placeholder-shown)]:bg-white peer-[:not(:placeholder-shown)]:px-2 peer-[:not(:placeholder-shown)]:text-sm pointer-events-none">
                    Abstract <span className="text-red-500">*</span>
                  </label>
                  <div className="absolute right-3 top-3">
                    {getValidationIcon('abstract')}
                  </div>
                  {validationErrors.abstract && (
                    <div className={`mt-2 p-3 border rounded-lg ${
                      validationStatus.abstract === 'invalid'
                        ? 'bg-red-50 border-red-200' 
                        : 'bg-yellow-50 border-yellow-200'
                    }`}>
                      <div className="flex items-start gap-2">
                        <AlertCircle size={16} className={`mt-0.5 flex-shrink-0 ${
                          validationStatus.abstract === 'invalid' ? 'text-red-500' : 'text-yellow-600'
                        }`} />
                        <div className={`text-sm whitespace-pre-line ${
                          validationStatus.abstract === 'invalid' ? 'text-red-700' : 'text-yellow-700'
                        }`}>
                          {validationErrors.abstract}
                        </div>
                      </div>
                    </div>
                  )}
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
                        ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white hover:shadow-lg'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    Next
                    <Sparkles size={16} />
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={!isStepValid(3) || loading || submitting || hasBlockingValidationErrors() || isValidationInProgress()}
                    onClick={handleSubmit}
                    className={`px-8 py-3 rounded-lg font-medium transition-all duration-300 flex items-center gap-2 ${
                      isStepValid(3) && !loading && !submitting && !hasBlockingValidationErrors() && !isValidationInProgress()
                        ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white hover:shadow-lg'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {loading || submitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Uploading...
                      </>
                    ) : isValidationInProgress() ? (
                      <>
                        <Clock size={16} />
                        Checking...
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
    </>
  );
};

export default AddResearch;