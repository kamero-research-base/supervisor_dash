
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

  // Department search state
  const [allDepartments, setAllDepartments] = useState<Department[]>([]);
  const [filteredDepartments, setFilteredDepartments] = useState<Department[]>([]);
  const [departmentSearch, setDepartmentSearch] = useState('');
  const [showDepartmentDropdown, setShowDepartmentDropdown] = useState(false);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);

  // Student search state
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  useEffect(() => {
    setFormData(research);
    // Get user session
    const session = JSON.parse(localStorage.getItem("supervisorSession") || "{}");
    setUserSession(session);
  }, [research]);

  // Load all departments on component mount
  useEffect(() => {
    const loadDepartments = async () => {
      if (!userSession?.school_id) return;
      
      setLoadingDepartments(true);
      try {
        const response = await fetch(`/api/departments?school_id=${userSession.school_id}`);
        if (response.ok) {
          const data = await response.json();
          const departments = data || [];
          setAllDepartments(departments);
          setFilteredDepartments(departments);
        }
      } catch (error) {
        console.error('Error fetching departments:', error);
      } finally {
        setLoadingDepartments(false);
      }
    };

    if (userSession?.school_id) {
      loadDepartments();
    }
  }, [userSession]);

  // Load all students on component mount
  useEffect(() => {
    const loadStudents = async () => {
      if (!userSession?.id) return;
      
      setLoadingStudents(true);
      try {
        const response = await fetch(`/api/students?supervisor_id=${userSession.id}`);
        if (response.ok) {
          const data = await response.json();
          const students = data || [];
          setAllStudents(students);
          setFilteredStudents(students);
        }
      } catch (error) {
        console.error('Error fetching students:', error);
      } finally {
        setLoadingStudents(false);
      }
    };

    if (userSession?.id) {
      loadStudents();
    }
  }, [userSession]);

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

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.researcher.trim()) {
      newErrors.researcher = 'Researcher name is required';
    }

    if (!formData.year.trim()) {
      newErrors.year = 'Year is required';
    } else if (!/^\d{4}$/.test(formData.year)) {
      newErrors.year = 'Year must be a 4-digit number';
    }

    if (!formData.progress_status) {
      newErrors.progress_status = 'Progress status is required';
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

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
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
  };

  const handleStudentSelect = (student: Student) => {
    setSelectedStudent(student);
    const fullName = `${student.first_name} ${student.last_name}`;
    setStudentSearch(`${fullName}`);
    setFormData(prev => ({
      ...prev,
      student_id: student.id.toString()
    }));
    setShowStudentDropdown(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/research/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          supervisor_id: userSession.id,
          updated_at: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update research');
      }

      const updatedResearch = await response.json();
      
      onSave(updatedResearch.data || { ...formData, updated_at: new Date().toISOString() });
      
    } catch (error) {
      console.error('Error updating research:', error);
      setErrors({ submit: 'Failed to update research. Please try again.' + error });
    } finally {
      setLoading(false);
    }
  };

      function handleDepartmentFocus(event: React.FocusEvent<HTMLInputElement, Element>): void {
        setShowDepartmentDropdown(true);
        // Optionally, re-filter departments if search is not empty
        if (departmentSearch.trim()) {
            filterDepartments(departmentSearch);
        } else {
            setFilteredDepartments(allDepartments);
        }
    }

    function handleStudentFocus(event: React.FocusEvent<HTMLInputElement, Element>): void {
        setShowStudentDropdown(true);
        // Optionally, re-filter students if search is not empty
        if (studentSearch.trim()) {
            filterStudents(studentSearch);
        } else {
            setFilteredStudents(allStudents);
        }
    }

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
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {errors.submit && (
            <AlertNotification message={errors.submit} type="error" />
          )}

          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Research Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                errors.title ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Enter research title"
            />
            {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
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
                value={formData.researcher}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                  errors.researcher ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter researcher name"
              />
              {errors.researcher && <p className="mt-1 text-sm text-red-600">{errors.researcher}</p>}
            </div>

            <div>
              <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">
                Year *
              </label>
              <input
                type="text"
                id="year"
                name="year"
                value={formData.year}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                  errors.year ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="e.g., 2024"
                maxLength={4}
              />
              {errors.year && <p className="mt-1 text-sm text-red-600">{errors.year}</p>}
            </div>
          </div>

          {/* Status and Progress Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Status *
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                  errors.status ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Select status</option>
                {statusOptions.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
              {errors.status && <p className="mt-1 text-sm text-red-600">{errors.status}</p>}
            </div>

            <div>
              <label htmlFor="progress_status" className="block text-sm font-medium text-gray-700 mb-1">
                Progress Status *
              </label>
              <select
                id="progress_status"
                name="progress_status"
                value={formData.progress_status}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                  errors.progress_status ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Select progress</option>
                {progressOptions.map(progress => (
                  <option key={progress} value={progress}>{progress}</option>
                ))}
              </select>
              {errors.progress_status && <p className="mt-1 text-sm text-red-600">{errors.progress_status}</p>}
            </div>
          </div>

          {/* Department and Student Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Department Search */}
            <div className="relative">
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="Search for department..."
              />
              
              {showDepartmentDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {loadingDepartments ? (
                    <div className="px-3 py-2 text-gray-500">Loading...</div>
                  ) : filteredDepartments.length > 0 ? (
                    filteredDepartments.map((dept) => (
                      <div
                        key={dept.id}
                        onClick={() => handleDepartmentSelect(dept)}
                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                      >
                        {dept.name}
                      </div>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-gray-500">No departments found</div>
                  )}
                </div>
              )}
            </div>

            {/* Student Search */}
            <div className="relative">
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
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                  errors.student_id ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Search for student..."
              />
              {errors.student_id && <p className="mt-1 text-sm text-red-600">{errors.student_id}</p>}
              
              {showStudentDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {loadingStudents ? (
                    <div className="px-3 py-2 text-gray-500">Loading...</div>
                  ) : filteredStudents.length > 0 ? (
                    filteredStudents.map((student) => (
                      <div
                        key={student.id}
                        onClick={() => handleStudentSelect(student)}
                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                      >
                        <div className="font-medium">{student.first_name} {student.last_name}</div>
                        <div className="text-sm text-gray-500">• {student.email}</div>
                      </div>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-gray-500">No students found</div>
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              placeholder="Enter keywords separated by commas"
            />
            <p className="mt-1 text-sm text-gray-500">Separate multiple keywords with commas</p>
          </div>

          {/* Abstract */}
          <div>
            <label htmlFor="abstract" className="block text-sm font-medium text-gray-700 mb-1">
              Abstract *
            </label>
            <textarea
              id="abstract"
              name="abstract"
              value={formData.abstract || ''}
              onChange={handleChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              placeholder="Enter research abstract"
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-teal-600 border border-transparent rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
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