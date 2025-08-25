// app/components/toggles/addAssignment.tsx
"use client";
import React, { useEffect, useState, useRef, ChangeEvent, FormEvent } from "react";
import { X, Upload, FileText, CheckCircle, AlertCircle, Sparkles, BookOpen, Calendar, Clock, FileUp, Trash2, Users } from "lucide-react";
import AsyncSelect from 'react-select/async';
import { MultiValue, ActionMeta } from 'react-select';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

// Import TinyMCE React Editor
import { Editor } from '@tinymce/tinymce-react';

// Student option type for react-select
interface StudentOption {
  value: number;
  label: string;
  email: string;
  firstName: string;
  lastName: string;
}

// Assignment interface for editing
interface Assignment {
  id: number;
  title: string;
  description: string;
  instructions: string;
  due_date: string;
  is_active: boolean;
  max_score: number;
  attachments: string[];
  created_at: string;
  updated_at: string;
  created_by: number;
  updated_by: number;
  hashed_id: string;
  submissions_count?: number;
  invited_students_count?: number;
  average_score?: number;
}

// Inline types and interfaces
interface FormData {
  title: string;
  description: string;
  instructions: string;
  due_date: Date | null; // Changed for react-datepicker
  due_time: string;
  is_active: boolean;
  max_score: string;
  selected_students: StudentOption[];
  keep_existing_files: boolean; // New flag for edit mode
}

interface UserSession {
  id: string;
  [key: string]: any;
}

interface AddAssignmentProps {
  assignment?: Assignment | null; // Optional assignment for editing
  onClose?: () => void;
  onSuccess?: () => void;
}

interface ApiError {
  error: string;
  message?: string;
  errors?: Record<string, string>;
  success?: boolean;
}

// Inline utility functions
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

const getMinDate = (): Date => {
  return new Date();
};

const getMinTime = (dueDate: Date | null): string => {
  if (dueDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(dueDate);
    selectedDate.setHours(0, 0, 0, 0);

    if (selectedDate.getTime() === today.getTime()) {
      const now = new Date();
      return now.toTimeString().slice(0, 5);
    }
  }
  return "00:00";
};

const isValidFileType = (file: File): boolean => {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  return allowedTypes.includes(file.type);
};

// Alert Notification Component
const AlertNotification = ({ message, type }: { message: string; type: 'error' | 'success' }) => (
  <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg border ${
    type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'
  }`}>
    <div className="flex items-center gap-2">
      {type === 'error' ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
      {message}
    </div>
  </div>
);

// TinyMCE Editor Component - Updated for Self-Hosted
const TinyMCEEditor = ({ value, onChange, placeholder, id }: { 
  value: string; 
  onChange: (content: string) => void; 
  placeholder: string;
  id: string;
}) => {
  const [isTinyMCELoaded, setIsTinyMCELoaded] = useState(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);

  useEffect(() => {
    const loadTinyMCE = async () => {
      try {
        // Check if TinyMCE is already loaded
        if (typeof window !== 'undefined' && (window as any).tinymce) {
          setIsTinyMCELoaded(true);
          return;
        }

        // Dynamically load TinyMCE script
        const script = document.createElement('script');
        script.src = '/tinymce/tinymce.min.js';
        script.async = true;
        
        script.onload = () => {
          // Wait a bit for TinyMCE to initialize
          setTimeout(() => {
            if ((window as any).tinymce) {
              setIsTinyMCELoaded(true);
            } else {
              setLoadingError('TinyMCE failed to initialize');
            }
          }, 100);
        };
        
        script.onerror = () => {
          setLoadingError('Failed to load TinyMCE script. Please check if /tinymce/tinymce.min.js exists.');
        };
        
        document.head.appendChild(script);
        
        // Cleanup function
        return () => {
          if (document.head.contains(script)) {
            document.head.removeChild(script);
          }
        };
      } catch (error) {
        setLoadingError('Error loading TinyMCE: ' + (error as Error).message);
      }
    };

    loadTinyMCE();
  }, []);

  if (loadingError) {
    return (
      <div className="w-full h-[200px] border-2 border-red-200 rounded-lg flex items-center justify-center bg-red-50">
        <div className="text-red-600 text-center">
          <p className="font-medium">Editor Loading Error</p>
          <p className="text-sm mt-1">{loadingError}</p>
        </div>
      </div>
    );
  }

  if (!isTinyMCELoaded) {
    return (
      <div className="w-full h-[200px] border-2 border-gray-200 rounded-lg flex items-center justify-center">
        <div className="text-gray-500 flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-teal-500 rounded-full animate-spin"></div>
          Loading editor...
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <Editor
        licenseKey="gpl" // Use licenseKey prop instead of in init
        init={{
          height: 200,
          menubar: false,
          branding: false,
          plugins: [
            'anchor', 'autolink', 'charmap', 'code', 'fullscreen', 'help',
            'image', 'insertdatetime', 'link', 'lists', 'preview',
            'searchreplace', 'table', 'template', 'visualblocks', 'wordcount'
          ],
          toolbar: 'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | link image table | align lineheight | checklist numlist bullist indent outdent | emoticons charmap | removeformat',
          content_style: `
            body { 
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; 
              font-size: 14px;
              line-height: 1.6;
              margin: 1rem;
            }
            p { margin: 0 0 1rem 0; }
          `,
          placeholder: placeholder,
          browser_spellcheck: true,
          contextmenu: false,
          skin: 'oxide',
          content_css: 'default',
          // Specify the base URL for TinyMCE assets
          base_url: '/tinymce',
          suffix: '.min',
          setup: (editor: any) => {
            editor.on('focus', () => {
              const container = editor.getContainer();
              if (container) {
                container.style.borderColor = '#14b8a6';
              }
            });
            
            editor.on('blur', () => {
              const container = editor.getContainer();
              if (container) {
                container.style.borderColor = '#e5e7eb';
              }
            });
          }
        }}
        value={value}
        onEditorChange={(content: string) => onChange(content)}
      />
    </div>
  );
};

const AddAssignment: React.FC<AddAssignmentProps> = ({ assignment = null, onClose = () => {}, onSuccess = () => {} }) => {
  const isEditMode = assignment !== null;
  
  // Initialize form data based on edit mode
  const initializeFormData = (): FormData => {
    if (isEditMode && assignment) {
      const dueDateTime = new Date(assignment.due_date);
      return {
        title: assignment.title,
        description: assignment.description,
        instructions: assignment.instructions,
        due_date: dueDateTime,
        due_time: dueDateTime.toTimeString().slice(0, 5),
        is_active: assignment.is_active,
        max_score: assignment.max_score.toString(),
        selected_students: [], // Will be populated after fetching
        keep_existing_files: true, // Default to keeping existing files
      };
    }
    return {
      title: "",
      description: "",
      instructions: "",
      due_date: null,
      due_time: "",
      is_active: true,
      max_score: "",
      selected_students: [],
      keep_existing_files: true,
    };
  };

  const [formData, setFormData] = useState<FormData>(initializeFormData());
  const [originalSelectedStudents, setOriginalSelectedStudents] = useState<StudentOption[]>([]);
  
  const [files, setFiles] = useState<File[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [focusedField, setFocusedField] = useState<string>("");
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [supervisorId, setSupervisorId] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Helper functions for student comparison
  const getStudentIds = (students: StudentOption[]): number[] => {
    return students.map(student => student.value);
  };

  const getStudentsToAdd = (original: StudentOption[], current: StudentOption[]): StudentOption[] => {
    const originalIds = getStudentIds(original);
    return current.filter(student => !originalIds.includes(student.value));
  };

  const getStudentsToRemove = (original: StudentOption[], current: StudentOption[]): StudentOption[] => {
    const currentIds = getStudentIds(current);
    return original.filter(student => !currentIds.includes(student.value));
  };

  const getStudentSelectionHelperText = (): string => {
    if (isEditMode) {
      if (formData.selected_students.length === 0) {
        return "No students currently assigned to this assignment.";
      }
      return "You can add or remove students. Changes will be applied when you save.";
    } else {
      return "Select at least one student to assign this assignment.";
    }
  };

  // Get supervisor ID from localStorage
  useEffect(() => {
    const userSessionData = localStorage.getItem('supervisorSession');
    if (userSessionData) {
      try {
        const userSession: UserSession = JSON.parse(userSessionData);
        if (userSession && userSession.id) {
          setSupervisorId(userSession.id);
        }
      } catch (error) {
        console.error('Error parsing user session:', error);
        setError('Invalid session data. Please log in again.');
      }
    } else {
      setError('No supervisor session found. Please log in.');
    }
  }, []);

  // Load assigned students and existing attachments when in edit mode
  useEffect(() => {
    const loadAssignedStudents = async () => {
      if (isEditMode && assignment && supervisorId) {
        try {
          // Fetch students assigned to this assignment
          const response = await fetch(`/api/assignments/view`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              id: assignment.id.toString(),
              supervisor_id: parseInt(supervisorId)
            })
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data) {
              // Set assigned students
              if (data.data.invitations) {
                const assignedStudents = data.data.invitations.map((invitation: any) => ({
                  value: invitation.student_id,
                  label: invitation.student_name,
                  email: invitation.student_email,
                  firstName: invitation.student_name.split(' ')[0],
                  lastName: invitation.student_name.split(' ').slice(1).join(' '),
                }));
                
                setFormData(prev => ({
                  ...prev,
                  selected_students: assignedStudents
                }));
                
                // Store original selection for comparison
                setOriginalSelectedStudents(assignedStudents);
              }
              
              // Set existing attachments
              if (data.data.attachments && Array.isArray(data.data.attachments)) {
                setExistingAttachments(data.data.attachments);
              }
            }
          }
        } catch (error) {
          console.error('Error loading assigned students:', error);
        }
      }
    };

    loadAssignedStudents();
  }, [isEditMode, assignment, supervisorId]);

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

  // Clear validation errors when moving between steps
  useEffect(() => {
    setValidationErrors({});
  }, [currentStep]);

  // Load students function for AsyncSelect
  const loadStudents = async (inputValue: string): Promise<StudentOption[]> => {
    if (!supervisorId) return [];

    try {
      const url = new URL('/api/students', window.location.origin);
      url.searchParams.append('supervisor_id', supervisorId);
      if (inputValue) {
        url.searchParams.append('search', inputValue);
      }

      const response = await fetch(url.toString(), {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch students');
      }

      const data = await response.json();
      
      return data.map((student: any) => ({
        value: student.id,
        label: `${student.first_name} ${student.last_name}`,
        email: student.email,
        firstName: student.first_name,
        lastName: student.last_name,
      }));

    } catch (error) {
      console.error('Error loading students:', error);
      return [];
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>): void => {
    const { id, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [id]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [id]: value }));
    }
    
    if (validationErrors[id]) {
      setValidationErrors(prev => {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      });
    }
  };

  const handleStudentChange = (newValue: MultiValue<StudentOption>, actionMeta: ActionMeta<StudentOption>) => {
    const students = newValue ? [...newValue] : [];
    setFormData(prev => ({ ...prev, selected_students: students }));
    
    if (validationErrors.selected_students) {
      setValidationErrors(prev => {
        const updated = { ...prev };
        delete updated.selected_students;
        return updated;
      });
    }
  };

  const handleDescriptionChange = (content: string): void => {
    setFormData(prev => ({ ...prev, description: content }));
    if (validationErrors.description) {
      setValidationErrors(prev => {
        const updated = { ...prev };
        delete updated.description;
        return updated;
      });
    }
  };

  const handleInstructionsChange = (content: string): void => {
    setFormData(prev => ({ ...prev, instructions: content }));
    if (validationErrors.instructions) {
      setValidationErrors(prev => {
        const updated = { ...prev };
        delete updated.instructions;
        return updated;
      });
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const selectedFiles = Array.from(e.target.files || []);
    
    // Calculate total files including existing ones
    const totalFilesAfterUpload = files.length + selectedFiles.length + (formData.keep_existing_files ? existingAttachments.length : 0);
    
    if (totalFilesAfterUpload > 3) {
      setError(`Maximum 3 files allowed total. You currently have ${formData.keep_existing_files ? existingAttachments.length : 0} existing file(s) and ${files.length} new file(s).`);
      return;
    }

    for (const file of selectedFiles) {
      if (file.size > 10 * 1024 * 1024) {
        setError("Each file must be less than 10MB");
        return;
      }
      
      if (!isValidFileType(file)) {
        setError("Only PDF, DOC, DOCX files are allowed");
        return;
      }
    }

    setFiles(prev => [...prev, ...selectedFiles]);
    
    if (validationErrors.attachments) {
      setValidationErrors(prev => {
        const updated = { ...prev };
        delete updated.attachments;
        return updated;
      });
    }
  };

  const removeFile = (index: number): void => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement>): Promise<void> => {
    e.preventDefault();
    
    if (!supervisorId) {
      setError("No supervisor session found. Please log in again.");
      return;
    }

    const newValidationErrors: Record<string, string> = {};
    if (!formData.title.trim()) newValidationErrors.title = "Assignment title is required";
    if (!formData.description.trim()) newValidationErrors.description = "Description is required";
    if (!formData.instructions.trim()) newValidationErrors.instructions = "Instructions are required";
    if (!formData.due_date) newValidationErrors.due_date = "Due date is required";
    if (!formData.due_time) newValidationErrors.due_time = "Due time is required";
    if (!formData.max_score) {
      newValidationErrors.max_score = "Max score is required";
    } else if (parseInt(formData.max_score) <= 0) {
      newValidationErrors.max_score = "Max score must be greater than 0";
    }
    
    // Only require students for new assignments
    if (!isEditMode && formData.selected_students.length === 0) {
      newValidationErrors.selected_students = "At least one student must be selected";
    }

    if (formData.due_date && formData.due_time) {
      const [hours, minutes] = formData.due_time.split(':');
      const dueDateTime = new Date(formData.due_date);
      dueDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      const now = new Date();
      
      // For editing, allow past dates if the assignment is completed/inactive
      if (!isEditMode && dueDateTime <= now) {
        newValidationErrors.due_date = "Due date and time must be in the future";
      }
    }

    if (Object.keys(newValidationErrors).length > 0) {
      setValidationErrors(newValidationErrors);
      setError("Please correct the validation errors and try again.");
      return;
    }

    setSubmitting(true);
    setLoading(true);
    setError(null);
    setValidationErrors({});
    
    try {
      // Prepare FormData for both create and update
      const payload = new FormData();
      
      if (formData.due_date && formData.due_time) {
        const [hours, minutes] = formData.due_time.split(':');
        const dueDateTime = new Date(formData.due_date);
        dueDateTime.setHours(parseInt(hours), parseInt(minutes));
        payload.append("due_date", dueDateTime.toISOString());
      }
      
      payload.append("title", formData.title.trim());
      payload.append("description", formData.description.trim());
      payload.append("instructions", formData.instructions.trim());
      payload.append("is_active", formData.is_active.toString());
      payload.append("max_score", formData.max_score);
      payload.append("created_by", supervisorId);
      payload.append("updated_by", supervisorId);

      if (isEditMode) {
        payload.append("id", assignment!.id.toString());
        payload.append("supervisor_id", supervisorId);
        payload.append("keep_existing_files", formData.keep_existing_files.toString());
      }

      files.forEach((file) => {
        payload.append("attachments", file);
      });

      const endpoint = isEditMode ? "/api/assignments/update" : "/api/assignments/create";
      const method = isEditMode ? "PUT" : "POST";

      const response = await fetch(endpoint, {
        method: method,
        body: payload,
      });

      const data: ApiError = await response.json();

      if (response.ok && data.success !== false) {
        let assignmentId = isEditMode ? assignment!.id : (data as any).data?.assignment?.id;
        
        // Handle student invitations for both create and edit modes
        if (assignmentId) {
          try {
            if (isEditMode) {
              // Compare old vs new student selections
              const studentsToAdd = getStudentsToAdd(originalSelectedStudents, formData.selected_students);
              const studentsToRemove = getStudentsToRemove(originalSelectedStudents, formData.selected_students);
              
              console.log('Student changes:', {
                original: originalSelectedStudents.map(s => s.label),
                current: formData.selected_students.map(s => s.label),
                toAdd: studentsToAdd.map(s => s.label),
                toRemove: studentsToRemove.map(s => s.label)
              });
              
              // Remove students who are no longer selected
              if (studentsToRemove.length > 0) {
                const removeResponse = await fetch("/api/assignments/uninvite", {
                  method: "POST",
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    assignment_id: assignmentId,
                    student_ids: studentsToRemove.map(student => student.value),
                    supervisor_id: parseInt(supervisorId)
                  })
                });
                
                if (!removeResponse.ok) {
                  const removeData = await removeResponse.json();
                  console.error("Error removing students:", removeData);
                  setError(`Warning: Assignment updated but failed to remove some students: ${removeData.message}`);
                }
              }
              
              // Add newly selected students
              if (studentsToAdd.length > 0) {
                const addResponse = await fetch("/api/assignments/invite", {
                  method: "POST",
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    assignment_id: assignmentId,
                    student_ids: studentsToAdd.map(student => student.value),
                    supervisor_id: parseInt(supervisorId)
                  })
                });
                
                if (!addResponse.ok) {
                  const addData = await addResponse.json();
                  console.error("Error adding students:", addData);
                  setError(`Warning: Assignment updated but failed to invite some students: ${addData.message}`);
                }
              }
            } else {
              // For new assignments, invite all selected students
              if (formData.selected_students.length > 0) {
                const studentIds = formData.selected_students.map(student => student.value);
                const inviteResponse = await fetch("/api/assignments/invite", {
                  method: "POST",
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    assignment_id: assignmentId,
                    student_ids: studentIds,
                    supervisor_id: parseInt(supervisorId)
                  })
                });
                
                if (!inviteResponse.ok) {
                  const inviteData = await inviteResponse.json();
                  console.error("Error inviting students:", inviteData);
                  setError(`Assignment created but failed to invite some students: ${inviteData.message}`);
                }
              }
            }
          } catch (inviteError) {
            console.error("Error managing student invitations:", inviteError);
            setError(`Assignment ${isEditMode ? 'updated' : 'created'} but there was an issue managing student invitations.`);
          }
        }

        if (!error) { // Only show success if no errors occurred with student management
          setSuccess(`Assignment ${isEditMode ? 'updated' : 'created'} successfully! 🎉`);
        }
        
        if (!isEditMode) {
          setFormData({
            title: "",
            description: "",
            instructions: "",
            due_date: null,
            due_time: "",
            is_active: true,
            max_score: "",
            selected_students: [],
            keep_existing_files: true,
          });
          setFiles([]);
          setCurrentStep(1);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }
        
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1500);
      } else {
        if (data.errors && typeof data.errors === 'object') {
          setValidationErrors(data.errors);
          setError("Please correct the validation errors and try again.");
        } else {
          setError(data.message || data.error || `Failed to ${isEditMode ? 'update' : 'create'} assignment`);
        }
      }
    } catch (error) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} assignment:`, error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setError(`Failed to ${isEditMode ? 'update' : 'create'} assignment: ${errorMessage}`);
    } finally {
      setSubmitting(false);
      setLoading(false);
    }
  };

  // Adjust validation logic for date object
  const isStepValid = (step: number): boolean => {
    switch(step) {
      case 1:
        const hasTitle = formData.title.trim() !== "";
        const hasValidScore = formData.max_score !== "" && parseInt(formData.max_score) > 0;
        const hasStudentsOrIsEdit = isEditMode || formData.selected_students.length > 0;
        
        return hasTitle && hasValidScore && hasStudentsOrIsEdit;
      case 2:
        return formData.description.trim() !== "" && 
               formData.instructions.trim() !== "";
      case 3:
        return formData.due_date !== null && 
               formData.due_time !== "";
      default:
        return false;
    }
  };

  const selectStyles = {
    control: (provided: any, state: any) => ({
      ...provided,
      borderColor: validationErrors.selected_students ? '#ef4444' : state.isFocused ? '#14b8a6' : '#d1d5db',
      borderWidth: '2px',
      borderRadius: '0.5rem',
      padding: '0.25rem',
      boxShadow: state.isFocused ? '0 0 0 0 transparent' : 'none',
      '&:hover': {
        borderColor: validationErrors.selected_students ? '#ef4444' : state.isFocused ? '#14b8a6' : '#9ca3af',
      }
    }),
    multiValue: (provided: any) => ({ ...provided, backgroundColor: '#14b8a6', borderRadius: '0.375rem' }),
    multiValueLabel: (provided: any) => ({ ...provided, color: 'white', fontSize: '0.875rem' }),
    multiValueRemove: (provided: any) => ({ ...provided, color: 'white', '&:hover': { backgroundColor: '#0f766e', color: 'white' } })
  };

  return (
    <>
      <style jsx>{`
        @keyframes slide-in { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scale-in { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes shimmer { 0% { background-position: -1000px 0; } 100% { background-position: 1000px 0; } }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        .animate-slide-in { animation: slide-in 0.3s ease-out; }
        .animate-fade-in { animation: fade-in 0.4s ease-out; }
        .animate-scale-in { animation: scale-in 0.3s ease-out; }
        .shimmer { background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%); background-size: 1000px 100%; animation: shimmer 2s infinite; }
        .gradient-border { background: linear-gradient(135deg, #14b8a6 0%, #0891b2 50%, #6366f1 100%); padding: 2px; border-radius: 1rem; }
        .glass-effect { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.18); }
        .floating { animation: float 3s ease-in-out infinite; }
      `}</style>

      {error && <AlertNotification message={error} type="error" />}
      {success && <AlertNotification message={success} type="success" />}
      
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 flex items-center justify-center p-4 animate-fade-in">
        <div ref={modalRef} className="gradient-border w-full max-w-5xl max-h-[90vh] animate-scale-in">
          <div className="glass-effect rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="relative bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-500 p-6 text-white">
              <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-all duration-300 hover:scale-110" type="button">
                <X size={20} />
              </button>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-white/20 rounded-full floating"><BookOpen size={28} /></div>
                <div>
                  <h2 className="text-2xl font-bold">{isEditMode ? 'Edit Assignment' : 'Create Assignment'}</h2>
                  <p className="text-white/80 text-sm">
                    {isEditMode ? 'Update assignment details and settings' : 'Design engaging assignments for your students'}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-center gap-2 mt-6">
                {[1, 2, 3].map((step: number) => (
                  <div key={step} className="flex items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all duration-300 ${currentStep >= step ? 'bg-white text-teal-600 scale-110' : 'bg-white/20 text-white/60'}`}>
                      {currentStep > step ? <CheckCircle size={20} /> : step}
                    </div>
                    {step < 3 && (<div className={`w-16 h-1 mx-2 rounded transition-all duration-500 ${currentStep > step ? 'bg-white' : 'bg-white/20'}`} />)}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              {/* Step 1: Basic Information & Student Selection */}
              {currentStep === 1 && (
                <div className="space-y-6 animate-fade-in">
                  <div className="relative group">
                    <input id="title" type="text" value={formData.title} onChange={handleChange} onFocus={() => setFocusedField('title')} onBlur={() => setFocusedField('')} className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-all duration-300 peer ${validationErrors.title ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-teal-500'}`} placeholder=" " required />
                    <label htmlFor="title" className={`absolute left-4 top-3 transition-all duration-300 peer-focus:text-teal-500 peer-focus:-top-2.5 peer-focus:bg-white peer-focus:px-2 peer-focus:text-sm peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-[:not(:placeholder-shown)]:-top-2.5 peer-[:not(:placeholder-shown)]:bg-white peer-[:not(:placeholder-shown)]:px-2 peer-[:not(:placeholder-shown)]:text-sm pointer-events-none ${validationErrors.title ? 'text-red-500' : 'text-gray-500'}`}>Assignment Title <span className="text-red-500">*</span></label>
                    {focusedField === 'title' && !validationErrors.title && <div className="absolute inset-0 rounded-lg shimmer pointer-events-none" />}
                    {validationErrors.title && (<p className="mt-1 text-sm text-red-600">{validationErrors.title}</p>)}
                  </div>
                  
                  <div className="relative group">
                    <input id="max_score" type="number" min="1" value={formData.max_score} onChange={handleChange} onFocus={() => setFocusedField('max_score')} onBlur={() => setFocusedField('')} className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-all duration-300 peer ${validationErrors.max_score ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-teal-500'}`} placeholder=" " required />
                    <label htmlFor="max_score" className={`absolute left-4 top-3 transition-all duration-300 peer-focus:text-teal-500 peer-focus:-top-2.5 peer-focus:bg-white peer-focus:px-2 peer-focus:text-sm peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-[:not(:placeholder-shown)]:-top-2.5 peer-[:not(:placeholder-shown)]:bg-white peer-[:not(:placeholder-shown)]:px-2 peer-[:not(:placeholder-shown)]:text-sm pointer-events-none ${validationErrors.max_score ? 'text-red-500' : 'text-gray-500'}`}>Maximum Score (Points) <span className="text-red-500">*</span></label>
                    {focusedField === 'max_score' && !validationErrors.max_score && <div className="absolute inset-0 rounded-lg shimmer pointer-events-none" />}
                    {validationErrors.max_score && (<p className="mt-1 text-sm text-red-600">{validationErrors.max_score}</p>)}
                  </div>
                  
                  {/* Student Selection - Now available in both create and edit modes */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${validationErrors.selected_students ? 'text-red-700' : 'text-gray-700'}`}>
                      <Users size={16} className="inline mr-1" />
                      {isEditMode ? 'Edit Assigned Students' : 'Select Students'} 
                      {!isEditMode && <span className="text-red-500">*</span>}
                    </label>
                    
                    <AsyncSelect 
                      isMulti 
                      value={formData.selected_students} 
                      onChange={handleStudentChange} 
                      loadOptions={loadStudents} 
                      placeholder={isEditMode ? "Search to add or remove students..." : "Search and select students..."} 
                      noOptionsMessage={({ inputValue }) => 
                        inputValue ? `No students found matching "${inputValue}"` : "Type to search students..."
                      } 
                      loadingMessage={() => "Loading students..."} 
                      styles={selectStyles} 
                      classNamePrefix="react-select" 
                      defaultOptions 
                      cacheOptions 
                    />
                    
                    {validationErrors.selected_students && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors.selected_students}</p>
                    )}
                    
                    {formData.selected_students.length > 0 && (
                      <div className="mt-3 p-3 bg-teal-50 border border-teal-200 rounded-lg">
                        <p className="text-sm text-teal-700 font-medium">
                          {formData.selected_students.length} student{formData.selected_students.length !== 1 ? 's' : ''} selected:
                        </p>
                        <div className="mt-1 text-xs text-teal-600">
                          {formData.selected_students.map(student => student.firstName + ' ' + student.lastName).join(', ')}
                        </div>
                        
                        {isEditMode && (
                          <div className="mt-2 text-xs text-blue-600">
                            <strong>Note:</strong> Adding students will send them new invitations. 
                            Removing students will cancel their existing invitations.
                          </div>
                        )}
                      </div>
                    )}
                    
                    <p className="mt-1 text-xs text-gray-500">{getStudentSelectionHelperText()}</p>
                  </div>
                </div>
              )}
              
              {/* Step 2: Content Creation */}
              {currentStep === 2 && (
                <div className="space-y-6 animate-fade-in">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${validationErrors.description ? 'text-red-700' : 'text-gray-700'}`}>Assignment Description <span className="text-red-500">*</span></label>
                    <TinyMCEEditor id="description-editor" value={formData.description} onChange={handleDescriptionChange} placeholder="Enter the assignment description..." />
                    {validationErrors.description && (<p className="mt-1 text-sm text-red-600">{validationErrors.description}</p>)}
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${validationErrors.instructions ? 'text-red-700' : 'text-gray-700'}`}>Assignment Instructions <span className="text-red-500">*</span></label>
                    <TinyMCEEditor id="instructions-editor" value={formData.instructions} onChange={handleInstructionsChange} placeholder="Enter detailed instructions for students..." />
                    {validationErrors.instructions && (<p className="mt-1 text-sm text-red-600">{validationErrors.instructions}</p>)}
                  </div>
                </div>
              )}
              
              {/* Step 3: Schedule & Attachments */}
              {currentStep === 3 && (
                <div className="space-y-6 animate-fade-in">
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* DatePicker Implementation */}
                    <div className="relative group w-full">
                      <DatePicker
                        id="due_date"
                        selected={formData.due_date}
                        onChange={(date: Date | null) => {
                          setFormData(prev => ({ ...prev, due_date: date }));
                          if (validationErrors.due_date) {
                            setValidationErrors(prev => {
                              const updated = { ...prev };
                              delete updated.due_date;
                              return updated;
                            });
                          }
                        }}
                        dateFormat="dd/MM/yyyy"
                        placeholderText="Select a date (dd/mm/yyyy)"
                        minDate={!isEditMode ? getMinDate() : undefined} // Allow past dates when editing
                        className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-all duration-300 ${
                          validationErrors.due_date ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-teal-500'
                        }`}
                        autoComplete="off"
                      />
                      <label htmlFor="due_date" className={`absolute left-4 -top-2.5 bg-white px-2 text-sm transition-all duration-300 pointer-events-none ${
                        validationErrors.due_date ? 'text-red-500' : 'text-gray-500'
                      }`}><Calendar size={16} className="inline mr-1" />Due Date <span className="text-red-500">*</span></label>
                      {validationErrors.due_date && (<p className="mt-1 text-sm text-red-600">{validationErrors.due_date}</p>)}
                    </div>
                    
                    <div className="relative group">
                      <input id="due_time" type="time" value={formData.due_time} onChange={handleChange} onFocus={() => setFocusedField('due_time')} onBlur={() => setFocusedField('')} className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-all duration-300 peer ${validationErrors.due_time ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-teal-500'}`} min={!isEditMode ? getMinTime(formData.due_date) : undefined} required />
                      <label htmlFor="due_time" className={`absolute left-4 -top-2.5 bg-white px-2 text-sm transition-all duration-300 pointer-events-none ${validationErrors.due_time ? 'text-red-500' : 'text-gray-500 peer-focus:text-teal-500'}`}><Clock size={16} className="inline mr-1" />Due Time <span className="text-red-500">*</span></label>
                      {focusedField === 'due_time' && !validationErrors.due_time && <div className="absolute inset-0 rounded-lg shimmer pointer-events-none" />}
                      {validationErrors.due_time && (<p className="mt-1 text-sm text-red-600">{validationErrors.due_time}</p>)}
                    </div>
                  </div>
                  
                  {/* Existing Files (Edit Mode Only) */}
                  {isEditMode && existingAttachments.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700">
                        Existing Attachments ({existingAttachments.length})
                      </label>
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            id="keep_existing_files"
                            checked={formData.keep_existing_files}
                            onChange={handleChange}
                            className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                          />
                          <label htmlFor="keep_existing_files" className="text-sm text-gray-700">
                            Keep existing attachments ({existingAttachments.length} files)
                          </label>
                        </div>
                        {formData.keep_existing_files && (
                          <div className="pl-7">
                            {existingAttachments.map((attachment, index) => (
                              <div key={index} className="flex items-center gap-2 text-xs text-gray-600 mb-1">
                                <FileText size={14} />
                                <span>Existing file {index + 1}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* File Upload */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${validationErrors.attachments ? 'text-red-700' : 'text-gray-700'}`}>
                      {isEditMode ? 'Add New Attachments (Optional)' : 'Attachments (Optional)'}
                    </label>
                    <input ref={fileInputRef} type="file" onChange={handleFileChange} className="hidden" accept=".pdf,.doc,.docx" multiple />
                    <button type="button" onClick={() => fileInputRef.current?.click()} className={`w-full p-6 border-2 border-dashed rounded-lg transition-all duration-300 group hover:border-teal-500 border-gray-300 ${validationErrors.attachments ? 'border-red-300' : ''}`} disabled={files.length + (formData.keep_existing_files ? existingAttachments.length : 0) >= 3}>
                      <div className="flex flex-col items-center gap-3">
                        <div className="p-3 rounded-full transition-colors bg-teal-50 group-hover:bg-teal-100"><FileUp size={24} className="text-teal-600" /></div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">
                            {files.length + (formData.keep_existing_files ? existingAttachments.length : 0) >= 3 ? "Maximum files reached" : `Click to upload new attachments`}
                          </p>
                          <p className="text-xs text-gray-500">PDF, DOC, DOCX (Max 3 files total, 10MB each)</p>
                          {isEditMode && (
                            <p className="text-xs text-blue-600 mt-1">
                              Current: {formData.keep_existing_files ? existingAttachments.length : 0} existing + {files.length} new = {files.length + (formData.keep_existing_files ? existingAttachments.length : 0)} total
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                    {validationErrors.attachments && (<p className="mt-1 text-sm text-red-600">{validationErrors.attachments}</p>)}
                    {files.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <h4 className="text-sm font-medium text-gray-700">New Attachments:</h4>
                        {files.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <FileText size={20} className="text-gray-500" />
                              <span className="text-sm text-gray-700">{maskFileName(file.name)}</span>
                              <span className="text-xs text-gray-500">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                            </div>
                            <button type="button" onClick={() => removeFile(index)} className="p-1 text-red-500 hover:text-red-700 transition-colors"><Trash2 size={16} /></button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Navigation Buttons */}
              <div className="flex justify-between items-center mt-8 pt-6 border-t">
                <button type="button" onClick={() => currentStep > 1 ? setCurrentStep(currentStep - 1) : onClose()} className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors">{currentStep === 1 ? 'Cancel' : 'Previous'}</button>
                <div className="flex items-center gap-4">
                  {currentStep < 3 ? (
                    <button type="button" onClick={() => setCurrentStep(currentStep + 1)} disabled={!isStepValid(currentStep)} className={`px-8 py-3 rounded-lg font-medium transition-all duration-300 flex items-center gap-2 ${isStepValid(currentStep) ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white hover:shadow-lg hover:scale-105' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>Next <Sparkles size={16} /></button>
                  ) : (
                    <button type="button" disabled={!isStepValid(3) || loading || submitting} onClick={handleSubmit} className={`px-8 py-3 rounded-lg font-medium transition-all duration-300 flex items-center gap-2 ${isStepValid(3) && !loading && !submitting ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white hover:shadow-lg hover:scale-105' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
                      {loading || submitting ? (<><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{isEditMode ? 'Updating...' : 'Creating...'}</>) : (<><Upload size={16} />{isEditMode ? 'Update Assignment' : 'Create Assignment'}</>)}
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

export default AddAssignment;