import React, { useState, useEffect, useCallback } from 'react';
import AlertNotification from '../app/notify';

interface Research {
  id: number;
  title: string;
  researcher: string;
  year: string;
  status: string;
  progress_status: string;
  department?: string;
  student_id?: string;
  abstract?: string;
  keywords?: string;
  created_at: string;
  updated_at?: string;
  hashed_id: string;
}

interface Department {
  id: number;
  name: string;
  school: number;
}

interface Student {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  institute: string;
  status: string;
  created_at: string;
  profile_picture: string;
  hashed_id: string;
  department: string;
}

interface EditResearchProps {
  research: Research;
  onClose: () => void;
  onSave: (research: Research) => void;
}

interface ApiErrorResponse {
  message: string;
  errors?: Record<string, string>;
  error?: string;
  data?: any;
}

// Custom debounce function to replace lodash debounce
const debounce = (func: Function, wait: number) => {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: any[]) => {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
};

const EditResearch: React.FC<EditResearchProps> = ({ research, onClose, onSave }) => {
  const [formData, setFormData] = useState<Research>(research);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [userSession, setUserSession] = useState<any>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Department search state
  const [allDepartments, setAllDepartments] = useState<Department[]>([]);
  const [filteredDepartments, setFilteredDepartments] = useState<Department[]>([]);
  const [departmentSearch, setDepartmentSearch] = useState('');
  const [showDepartmentDropdown, setShowDepartmentDropdown] = useState(false);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [departmentError, setDepartmentError] = useState<string>('');

  // Student search state
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentError, setStudentError] = useState<string>('');

  // Initialize form data and session
  useEffect(() => {
    setFormData(research);
    
    // Initialize existing student and department selections
    if (research.student_id) {
      // This will be populated when students are loaded
    }
    
    if (research.department) {
      // This will be populated when departments are loaded
    }
    
    // Get and validate user session
    try {
      const sessionData = localStorage.getItem("supervisorSession");
      if (!sessionData) {
        setNotification({
          message: "No active session found. Please log in again to continue.",
          type: "error"
        });
        return;
      }
      
      const session = JSON.parse(sessionData);
      if (!session.id || !session.school_id) {
        setNotification({
          message: "Invalid session data detected. Please log in again.",
          type: "error"
        });
        return;
      }
      
      setUserSession(session);
    } catch (error) {
      console.error('Session parsing error:', error);
      setNotification({
        message: "Session data is corrupted. Please clear your browser data and log in again.",
        type: "error"
      });
    }
  }, [research]);

  // Load all departments on component mount
  useEffect(() => {
    const loadDepartments = async () => {
      if (!userSession?.school_id) return;
      
      setLoadingDepartments(true);
      setDepartmentError('');
      
      try {
        const response = await fetch(`/api/departments?school_id=${userSession.school_id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `Failed to fetch departments. Server returned ${response.status}.`);
        }

        const data = await response.json();
        const departments = Array.isArray(data) ? data : data || [];
        
        setAllDepartments(departments);
        setFilteredDepartments(departments);
        
        // Set initial department selection if exists
        if (research.department && departments.length > 0) {
          const existingDept = departments.find((d: Department) => d.id.toString() === research.department);
          if (existingDept) {
            setSelectedDepartment(existingDept);
            setDepartmentSearch(existingDept.name);
          }
        }
        
        if (departments.length === 0) {
          setDepartmentError('No departments are available for your school. Please contact administration.');
        }
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unable to load departments';
        setDepartmentError(errorMessage);
        console.error('Department loading error:', error);
      } finally {
        setLoadingDepartments(false);
      }
    };

    if (userSession?.school_id) {
      loadDepartments();
    }
  }, [userSession, research.department]);

  // Load all students on component mount
  useEffect(() => {
    const loadStudents = async () => {
      if (!userSession?.id) return;
      
      setLoadingStudents(true);
      setStudentError('');
      
      try {
        const response = await fetch(`/api/students?supervisor_id=${userSession.id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `Failed to fetch students. Server returned ${response.status}.`);
        }

        const data = await response.json();
        const students = Array.isArray(data) ? data : data.students || [];
        
        setAllStudents(students);
        setFilteredStudents(students);
        
        // Set initial student selection if exists
        if (research.student_id && students.length > 0) {
          const existingStudent = students.find((s: Student) => s.id.toString() === research.student_id);
          if (existingStudent) {
            setSelectedStudent(existingStudent);
            setStudentSearch(`${existingStudent.first_name} ${existingStudent.last_name}`);
          }
        }
        
        if (students.length === 0) {
          setStudentError('No students are assigned under your supervision. Please contact administration to assign students.');
        }
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unable to load students';
        setStudentError(errorMessage);
        console.error('Student loading error:', error);
      } finally {
        setLoadingStudents(false);
      }
    };

    if (userSession?.id) {
      loadStudents();
    }
  }, [userSession, research.student_id]);

  const statusOptions = [
    'Draft',
    'Pending',
    'Under review',
    'On hold',
    'Rejected'
  ];

  const progressOptions = [
    'ongoing',
    'completed',
    'published'
  ];

  // Filter departments based on search term
  const filterDepartments = (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setFilteredDepartments(allDepartments);
      return;
    }
    
    const filtered = allDepartments.filter(dept =>
      dept.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredDepartments(filtered);
  };

  // Filter students based on search term
  const filterStudents = (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setFilteredStudents(allStudents);
      return;
    }
    
    const filtered = allStudents.filter(student => {
      const fullName = `${student.first_name} ${student.last_name}`.toLowerCase();
      const searchLower = searchTerm.toLowerCase();
      
      return fullName.includes(searchLower) ||
             student.first_name.toLowerCase().includes(searchLower) ||
             student.last_name.toLowerCase().includes(searchLower) ||
             student.email.toLowerCase().includes(searchLower) ||
             student.hashed_id.toLowerCase().includes(searchLower);
    });
    setFilteredStudents(filtered);
  };

  // Debounced filter functions
  const debouncedDepartmentFilter = useCallback(
    debounce(filterDepartments, 300),
    [allDepartments]
  );

  const debouncedStudentFilter = useCallback(
    debounce(filterStudents, 300),
    [allStudents]
  );

  // Handle department search
  useEffect(() => {
    if (departmentSearch) {
      debouncedDepartmentFilter(departmentSearch);
    } else {
      setFilteredDepartments(allDepartments);
    }
  }, [departmentSearch, debouncedDepartmentFilter, allDepartments]);

  // Handle student search
  useEffect(() => {
    if (studentSearch) {
      debouncedStudentFilter(studentSearch);
    } else {
      setFilteredStudents(allStudents);
    }
  }, [studentSearch, debouncedStudentFilter, allStudents]);

  // Comprehensive form validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Title validation
    if (!formData.title?.trim()) {
      newErrors.title = 'Research title is required and cannot be empty';
    } else if (formData.title.trim().length < 5) {
      newErrors.title = 'Research title must be at least 5 characters long';
    } else if (formData.title.trim().length > 200) {
      newErrors.title = 'Research title cannot exceed 200 characters';
    }

    // Researcher validation
    if (!formData.researcher?.trim()) {
      newErrors.researcher = 'Researcher name is required and cannot be empty';
    } else if (formData.researcher.trim().length < 2) {
      newErrors.researcher = 'Researcher name must be at least 2 characters long';
    } else if (formData.researcher.trim().length > 100) {
      newErrors.researcher = 'Researcher name cannot exceed 100 characters';
    }

    // Year validation
    if (!formData.year?.trim()) {
      newErrors.year = 'Year is required';
    } else if (!/^\d{4}$/.test(formData.year)) {
      newErrors.year = 'Year must be exactly 4 digits (e.g., 2024)';
    } else {
      const year = parseInt(formData.year);
      const currentYear = new Date().getFullYear();
      if (year < 1900) {
        newErrors.year = 'Year cannot be before 1900';
      } else if (year > currentYear + 10) {
        newErrors.year = `Year cannot be more than 10 years in the future (maximum: ${currentYear + 10})`;
      }
    }

    // Progress status validation
    if (!formData.progress_status) {
      newErrors.progress_status = 'Progress status selection is required';
    } else if (!progressOptions.includes(formData.progress_status)) {
      newErrors.progress_status = 'Please select a valid progress status from the dropdown';
    }

    // Status validation (optional but if provided, must be valid)
    if (formData.status && !statusOptions.includes(formData.status)) {
      newErrors.status = 'Please select a valid status from the dropdown';
    }

    // Student validation - now required
    if (!formData.student_id) {
      newErrors.student_id = 'Student selection is required. Please select a student from the dropdown.';
    }

    // Abstract validation (optional but with limits)
    if (formData.abstract && formData.abstract.length > 2000) {
      newErrors.abstract = 'Abstract cannot exceed 2000 characters';
    }

    // Keywords validation (optional but with limits)
    if (formData.keywords && formData.keywords.length > 500) {
      newErrors.keywords = 'Keywords field cannot exceed 500 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear specific field error when user starts fixing it
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    // Clear notification when user starts making changes
    if (notification) {
      setNotification(null);
    }
  };

  const handleDepartmentSelect = (department: Department) => {
    setSelectedDepartment(department);
    setDepartmentSearch(department.name);
    setFormData(prev => ({
      ...prev,
      department: department.id.toString()
    }));
    setShowDepartmentDropdown(false);
    setDepartmentError('');
  };

  const handleStudentSelect = (student: Student) => {
    setSelectedStudent(student);
    const fullName = `${student.first_name} ${student.last_name}`;
    setStudentSearch(fullName);
    setFormData(prev => ({
      ...prev,
      student_id: student.id.toString()
    }));
    setShowStudentDropdown(false);
    setStudentError('');
    
    // Clear student validation error
    if (errors.student_id) {
      setErrors(prev => ({
        ...prev,
        student_id: ''
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear any existing notifications
    setNotification(null);

    // Validate form before submission
    if (!validateForm()) {
      setNotification({
        message: "Please fix the validation errors below before submitting the form.",
        type: "error"
      });
      return;
    }

    // Check session validity
    if (!userSession?.id) {
      setNotification({
        message: "Your session has expired. Please refresh the page and log in again.",
        type: "error"
      });
      return;
    }

    setLoading(true);

    try {
      const updateData = {
        ...formData,
        supervisor_id: userSession.id,
        updated_at: new Date().toISOString()
      };

      const response = await fetch(`/api/research/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      });

      const responseData: ApiErrorResponse = await response.json();

      if (!response.ok) {
        // Handle different types of API errors with specific messages
        switch (response.status) {
          case 400:
            if (responseData.errors) {
              // Handle field-specific validation errors from API
              setErrors(responseData.errors);
              setNotification({
                message: "Please correct the highlighted field errors and try again.",
                type: "error"
              });
            } else {
              setNotification({
                message: responseData.message || "Invalid data submitted. Please check your inputs and try again.",
                type: "error"
              });
            }
            break;
          
          case 403:
            setNotification({
              message: "You don't have permission to edit this research. Only the supervising professor can make changes.",
              type: "error"
            });
            break;
          
          case 404:
            setNotification({
              message: "This research record could not be found. It may have been deleted by another user.",
              type: "error"
            });
            break;
          
          case 409:
            setNotification({
              message: "A research with this title already exists. Please use a different title.",
              type: "error"
            });
            break;
          
          case 422:
            setNotification({
              message: responseData.message || "The submitted data contains invalid values. Please review and correct your inputs.",
              type: "error"
            });
            break;
          
          case 500:
            setNotification({
              message: "A server error occurred while saving your changes. Please try again in a few moments.",
              type: "error"
            });
            break;
          
          case 503:
            setNotification({
              message: "The server is temporarily unavailable. Please try again in a few minutes.",
              type: "error"
            });
            break;
          
          default:
            setNotification({
              message: responseData.message || `An unexpected error occurred (Error ${response.status}). Please try again.`,
              type: "error"
            });
        }
        return;
      }

      // Success case
      const updatedResearch = responseData.data || { 
        ...formData, 
        updated_at: new Date().toISOString() 
      };
      
      setNotification({
        message: "Research has been updated successfully! Changes have been saved.",
        type: "success"
      });
      
      // Close modal after a brief delay to show success message
      setTimeout(() => {
        onSave(updatedResearch);
      }, 1500);
      
    } catch (error) {
      console.error('Network error during research update:', error);
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        setNotification({
          message: "Network connection failed. Please check your internet connection and try again.",
          type: "error"
        });
      } else if (error instanceof SyntaxError) {
        setNotification({
          message: "Server returned invalid data. Please try again or contact support if the issue persists.",
          type: "error"
        });
      } else {
        setNotification({
          message: "An unexpected error occurred while saving. Please try again.",
          type: "error"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  function handleDepartmentFocus(): void {
    setShowDepartmentDropdown(true);
    if (departmentSearch.trim()) {
      filterDepartments(departmentSearch);
    } else {
      setFilteredDepartments(allDepartments);
    }
  }

  function handleStudentFocus(): void {
    setShowStudentDropdown(true);
    if (studentSearch.trim()) {
      filterStudents(studentSearch);
    } else {
      setFilteredStudents(allStudents);
    }
  }

  // Handle clicking outside dropdowns to close them
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      if (!target.closest('[data-department-dropdown]')) {
        setShowDepartmentDropdown(false);
      }
      
      if (!target.closest('[data-student-dropdown]')) {
        setShowStudentDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Edit Research
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={loading}
            title="Close dialog"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Notification Area */}
        {notification && (
          <div className="p-4 border-b border-gray-100">
            <AlertNotification 
              message={notification.message} 
              type={notification.type} 
            />
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Research Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title || ''}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors ${
                errors.title ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="Enter research title (5-200 characters)"
              maxLength={200}
              disabled={loading}
              aria-describedby={errors.title ? 'title-error' : undefined}
              required
            />
            {errors.title && (
              <p id="title-error" className="mt-1 text-sm text-red-600" role="alert">
                {errors.title}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              {formData.title?.length || 0}/200 characters
            </p>
          </div>

          {/* Researcher and Year Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="researcher" className="block text-sm font-medium text-gray-700 mb-1">
                Researcher Name *
              </label>
              <input
                type="text"
                id="researcher"
                name="researcher"
                value={formData.researcher || ''}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors ${
                  errors.researcher ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Enter researcher name (2-100 characters)"
                maxLength={100}
                disabled={loading}
                aria-describedby={errors.researcher ? 'researcher-error' : undefined}
                required
              />
              {errors.researcher && (
                <p id="researcher-error" className="mt-1 text-sm text-red-600" role="alert">
                  {errors.researcher}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">
                Year *
              </label>
              <input
                type="text"
                id="year"
                name="year"
                value={formData.year || ''}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors ${
                  errors.year ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="e.g., 2024"
                maxLength={4}
                disabled={loading}
                aria-describedby={errors.year ? 'year-error' : undefined}
                required
              />
              {errors.year && (
                <p id="year-error" className="mt-1 text-sm text-red-600" role="alert">
                  {errors.year}
                </p>
              )}
            </div>
          </div>

          {/* Status and Progress Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status || ''}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors ${
                  errors.status ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                disabled={loading}
                aria-describedby={errors.status ? 'status-error' : undefined}
              >
                <option value="">Select status (optional)</option>
                {statusOptions.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
              {errors.status && (
                <p id="status-error" className="mt-1 text-sm text-red-600" role="alert">
                  {errors.status}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="progress_status" className="block text-sm font-medium text-gray-700 mb-1">
                Progress Status *
              </label>
              <select
                id="progress_status"
                name="progress_status"
                value={formData.progress_status || ''}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors ${
                  errors.progress_status ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                disabled={loading}
                aria-describedby={errors.progress_status ? 'progress-error' : undefined}
                required
              >
                <option value="">Select progress status</option>
                {progressOptions.map(progress => (
                  <option key={progress} value={progress}>
                    {progress.charAt(0).toUpperCase() + progress.slice(1)}
                  </option>
                ))}
              </select>
              {errors.progress_status && (
                <p id="progress-error" className="mt-1 text-sm text-red-600" role="alert">
                  {errors.progress_status}
                </p>
              )}
            </div>
          </div>

          {/* Department and Student Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Department Search */}
            <div className="relative" data-department-dropdown>
              <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
                Department
              </label>
              <input
                type="text"
                id="department"
                name="department"
                value={departmentSearch}
                onChange={(e) => setDepartmentSearch(e.target.value)}
                onFocus={handleDepartmentFocus}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors"
                placeholder="Search for department..."
                disabled={loading || loadingDepartments}
              />
              
              {departmentError && (
                <p className="mt-1 text-sm text-red-600" role="alert">{departmentError}</p>
              )}
              
              {showDepartmentDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {loadingDepartments ? (
                    <div className="px-3 py-2 text-gray-500 flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Loading departments...
                    </div>
                  ) : departmentError ? (
                    <div className="px-3 py-2 text-red-500">{departmentError}</div>
                  ) : filteredDepartments.length > 0 ? (
                    filteredDepartments.map((dept) => (
                      <div
                        key={dept.id}
                        onClick={() => handleDepartmentSelect(dept)}
                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                        role="option"
                      >
                        {dept.name}
                      </div>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-gray-500">
                      {departmentSearch ? 'No departments found matching your search' : 'No departments available'}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Student Search */}
            <div className="relative" data-student-dropdown>
              <label htmlFor="student_id" className="block text-sm font-medium text-gray-700 mb-1">
                Student *
              </label>
              <input
                type="text"
                id="student_id"
                name="student_id"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                onFocus={handleStudentFocus}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors ${
                  errors.student_id ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Search for student..."
                disabled={loading || loadingStudents}
                aria-describedby={errors.student_id ? 'student-error' : undefined}
                required
              />
              {errors.student_id && (
                <p id="student-error" className="mt-1 text-sm text-red-600" role="alert">
                  {errors.student_id}
                </p>
              )}
              
              {studentError && (
                <p className="mt-1 text-sm text-red-600" role="alert">{studentError}</p>
              )}
              
              {showStudentDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {loadingStudents ? (
                    <div className="px-3 py-2 text-gray-500 flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Loading students...
                    </div>
                  ) : studentError ? (
                    <div className="px-3 py-2 text-red-500">{studentError}</div>
                  ) : filteredStudents.length > 0 ? (
                    filteredStudents.map((student) => (
                      <div
                        key={student.id}
                        onClick={() => handleStudentSelect(student)}
                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                        role="option"
                      >
                        <div className="font-medium">{student.first_name} {student.last_name}</div>
                        <div className="text-sm text-gray-500">{student.email}</div>
                        <div className="text-xs text-gray-400">ID: {student.hashed_id}</div>
                      </div>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-gray-500">
                      {studentSearch ? 'No students found matching your search' : 'No students available'}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Keywords */}
          <div>
            <label htmlFor="keywords" className="block text-sm font-medium text-gray-700 mb-1">
              Keywords
            </label>
            <input
              type="text"
              id="keywords"
              name="keywords"
              value={formData.keywords || ''}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors ${
                errors.keywords ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="Enter keywords separated by commas"
              maxLength={500}
              disabled={loading}
              aria-describedby={errors.keywords ? 'keywords-error' : undefined}
            />
            <p className="mt-1 text-sm text-gray-500">
              Separate multiple keywords with commas ({formData.keywords?.length || 0}/500 characters)
            </p>
            {errors.keywords && (
              <p id="keywords-error" className="mt-1 text-sm text-red-600" role="alert">
                {errors.keywords}
              </p>
            )}
          </div>

          {/* Abstract */}
          <div>
            <label htmlFor="abstract" className="block text-sm font-medium text-gray-700 mb-1">
              Abstract
            </label>
            <textarea
              id="abstract"
              name="abstract"
              value={formData.abstract || ''}
              onChange={handleChange}
              rows={4}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors ${
                errors.abstract ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="Enter research abstract (optional, max 2000 characters)"
              maxLength={2000}
              disabled={loading}
              aria-describedby={errors.abstract ? 'abstract-error' : undefined}
            />
            <p className="mt-1 text-sm text-gray-500">
              {formData.abstract?.length || 0}/2000 characters
            </p>
            {errors.abstract && (
              <p id="abstract-error" className="mt-1 text-sm text-red-600" role="alert">
                {errors.abstract}
              </p>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !userSession}
              className="px-4 py-2 text-sm font-medium text-white bg-teal-600 border border-transparent rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving Changes...
                </div>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditResearch;