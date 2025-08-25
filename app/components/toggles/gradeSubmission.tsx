// app/components/toggles/gradeSubmission.tsx
"use client";
import React, { useState, useEffect } from "react";
import { X, Award, MessageCircle, CheckCircle, XCircle, AlertTriangle, Save } from "lucide-react";

// Import TinyMCE React Editor
import { Editor } from '@tinymce/tinymce-react';

interface Submission {
  id: number;
  student_id: number;
  student_name: string;
  student_email: string;
  submission_text: string;
  attachments: string[];
  status: string;
  score: number | null;
  feedback: string;
  submitted_at: string;
  graded_at: string | null;
}

interface Assignment {
  id: number;
  title: string;
  max_score: number;
}

interface GradeSubmissionProps {
  submission: Submission;
  assignment: Assignment;
  onClose: () => void;
  onSuccess: () => void;
}

// TinyMCE Editor Component
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
        licenseKey="gpl"
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
          base_url: '/tinymce',
          suffix: '.min',
        }}
        value={value}
        onEditorChange={(content: string) => onChange(content)}
      />
    </div>
  );
};

const GradeSubmission: React.FC<GradeSubmissionProps> = ({ submission, assignment, onClose, onSuccess }) => {
  const [score, setScore] = useState<string>(submission.score?.toString() || '');
  const [feedback, setFeedback] = useState(submission.feedback || '');
  const [status, setStatus] = useState<'approved' | 'changes_required' | 'rejected'>(
    (submission.status as 'approved' | 'changes_required' | 'rejected') || 'approved'
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Get supervisor ID from localStorage
  const [supervisorId, setSupervisorId] = useState<string | null>(null);

  useEffect(() => {
    const userSessionData = localStorage.getItem('supervisorSession');
    if (userSessionData) {
      try {
        const userSession = JSON.parse(userSessionData);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!supervisorId) {
      setError("No supervisor session found. Please log in again.");
      return;
    }

    // Validation
    const scoreNum = parseFloat(score);
    if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > assignment.max_score) {
      setError(`Score must be between 0 and ${assignment.max_score}`);
      return;
    }

    if (!feedback.trim()) {
      setError("Feedback is required");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/assignments/grade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          submission_id: submission.id,
          supervisor_id: supervisorId,
          score: scoreNum,
          feedback: feedback,
          status: status
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess("Submission graded successfully! 🎉");
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1500);
      } else {
        setError(data.message || data.error || "Failed to grade submission");
      }
    } catch (error) {
      console.error("Error grading submission:", error);
      setError("Failed to grade submission. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (statusType: string) => {
    switch (statusType) {
      case 'approved':
        return <CheckCircle className="text-green-600" size={20} />;
      case 'changes_required':
        return <AlertTriangle className="text-yellow-600" size={20} />;
      case 'rejected':
        return <XCircle className="text-red-600" size={20} />;
      default:
        return <CheckCircle className="text-green-600" size={20} />;
    }
  };

  const getStatusColor = (statusType: string) => {
    switch (statusType) {
      case 'approved':
        return 'border-green-200 bg-green-50 text-green-800';
      case 'changes_required':
        return 'border-yellow-200 bg-yellow-50 text-yellow-800';
      case 'rejected':
        return 'border-red-200 bg-red-50 text-red-800';
      default:
        return 'border-green-200 bg-green-50 text-green-800';
    }
  };

  return (
    <>
      <style jsx>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scale-in { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.4s ease-out; }
        .animate-scale-in { animation: scale-in 0.3s ease-out; }
        .glass-effect { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.18); }
        .gradient-border { background: linear-gradient(135deg, #14b8a6 0%, #0891b2 50%, #6366f1 100%); padding: 2px; border-radius: 1rem; }
      `}</style>

      {/* Error/Success Messages */}
      {error && (
        <div className="fixed top-4 right-4 z-50 p-4 rounded-lg border bg-red-50 border-red-200 text-red-700">
          <div className="flex items-center gap-2">
            <XCircle size={20} />
            {error}
          </div>
        </div>
      )}
      {success && (
        <div className="fixed top-4 right-4 z-50 p-4 rounded-lg border bg-green-50 border-green-200 text-green-700">
          <div className="flex items-center gap-2">
            <CheckCircle size={20} />
            {success}
          </div>
        </div>
      )}
      
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 flex items-center justify-center p-4 animate-fade-in">
        <div className="gradient-border w-full max-w-2xl max-h-[90vh] animate-scale-in">
          <div className="glass-effect rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="relative bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-500 p-6 text-white">
              <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-all duration-300 hover:scale-110" type="button">
                <X size={20} />
              </button>
              
              <div className="pr-12">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-3 bg-white/20 rounded-full">
                    <Award size={28} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Grade Submission</h2>
                    <p className="text-white/80 text-sm">{assignment.title}</p>
                  </div>
                </div>
                
                <div className="text-white/80 text-sm">
                  <p><strong>Student:</strong> {submission.student_name}</p>
                  <p><strong>Submitted:</strong> {new Date(submission.submitted_at).toLocaleString()}</p>
                </div>
              </div>
            </div>
            
            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              {/* Student's Submission */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Student's Submission</h3>
                {submission.submission_text && (
                  <div className="mb-4">
                    <div 
                      className="prose prose-sm max-w-none text-gray-700"
                      dangerouslySetInnerHTML={{ __html: submission.submission_text }}
                    />
                  </div>
                )}
                
                {submission.attachments && submission.attachments.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Attachments:</h4>
                    <div className="space-y-2">
                      {submission.attachments.map((attachment, index) => (
                        <a 
                          key={index}
                          href={attachment} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-teal-600 hover:text-teal-700 transition-colors text-sm"
                        >
                          <Award size={16} />
                          View Attachment {index + 1}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Grading Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Score Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Score <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max={assignment.max_score}
                      step="0.1"
                      value={score}
                      onChange={(e) => setScore(e.target.value)}
                      className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-teal-500 transition-all duration-300"
                      placeholder="Enter score"
                      required
                    />
                    <span className="text-gray-600 font-medium">/ {assignment.max_score}</span>
                  </div>
                </div>

                {/* Status Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: 'approved', label: 'Approved', description: 'Meets requirements' },
                      { value: 'changes_required', label: 'Changes Required', description: 'Needs improvements' },
                      { value: 'rejected', label: 'Rejected', description: 'Does not meet requirements' }
                    ].map((statusOption) => (
                      <button
                        key={statusOption.value}
                        type="button"
                        onClick={() => setStatus(statusOption.value as 'approved' | 'changes_required' | 'rejected')}
                        className={`p-3 border-2 rounded-lg transition-all duration-300 ${
                          status === statusOption.value 
                            ? getStatusColor(statusOption.value) 
                            : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          {getStatusIcon(statusOption.value)}
                          <span className="font-medium text-sm">{statusOption.label}</span>
                        </div>
                        <p className="text-xs opacity-80">{statusOption.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Feedback */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Feedback <span className="text-red-500">*</span>
                  </label>
                  <TinyMCEEditor 
                    id="feedback-editor" 
                    value={feedback} 
                    onChange={setFeedback}
                    placeholder="Provide detailed feedback for the student..."
                  />
                </div>

                {/* Submit Button */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !score || !feedback.trim()}
                    className={`px-8 py-3 rounded-lg font-medium transition-all duration-300 flex items-center gap-2 ${
                      (!loading && score && feedback.trim())
                        ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white hover:shadow-lg hover:scale-105'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Grading...
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        Save Grade
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default GradeSubmission;