"use client";
import React, { useState, useEffect } from "react";
import { X, FileText, User, Building2, Calendar, Tag, GraduationCap, Clock, ExternalLink, Check, AlertTriangle, Pause, Eye, Download } from "lucide-react";

// MODIFIED: Interface updated to include the new is_public field
interface FormData {
  title: string;
  researcher: string;
  category: string;
  institute: string;
  status: string;
  progress_status: string;
  school: string;
  year: string;
  abstract: string;
  document: string;
  document_type: string;
  hashed_id: string;
  is_public: boolean; // NEW: Add visibility field
  created_at: string;
}

const buttons = [
  { name: "overview", icon: Eye },
  { name: "details", icon: FileText },
  { name: "supervisors", icon: User },
  { name: "institution", icon: Building2 },
];

interface ViewResearchProps {
  ResearchId: string;
  onClose: () => void;
}

function formatDate(dateString: any) {
  const date = new Date(dateString);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  
  const year = date.getFullYear();
  const month = months[date.getMonth()];
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  
  return `${month}, ${day} ${year} ${hours}:${minutes}:${seconds}`;
}

function truncateText(text: string, maxLength: number) {
  if (text.length > maxLength) {
    return text.slice(0, maxLength) + "...";
  }
  return text;
  return text;
}

const ViewResearch: React.FC<ViewResearchProps> = ({ ResearchId, onClose }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [research, setResearch] = useState<FormData | null>(null);
  const [loading, setLoading] = useState(false);

   const handleActive = (id: number) => {
    setActiveId(id);
   }
   
    useEffect(() => {
      if (error || success) {
        const timer = setTimeout(() => {
          setError(null);
          setSuccess(null);
        }, 10000);
        return () => clearTimeout(timer);
      }
    }, [error, success]);

  // Fetch Research
  useEffect(() => {
    const fetchResearch = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/research/view`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ id: ResearchId }),
          body: JSON.stringify({ id: ResearchId }),
        });
        if (!response.ok) throw new Error("Failed to fetch researches");
        const data = await response.json();
        setResearch(data);
        setLoading(false);
      } catch (error) {
        setError("An error occurred while fetching researches.");
        setLoading(false);
      }
    };
    fetchResearch();
  }, []);

  }, [ResearchId]);
 
  useEffect(() => {
    if (typeof window !== "undefined") {
    if (typeof window !== "undefined") {
      const abstract = document.getElementById("abstract") as HTMLDivElement;
      if (abstract && research?.abstract) {
        abstract.innerHTML = research.abstract;
      }
    }
  }, [research]);
  }, [research]);

  const handleApprove = async (id: any) => {
    setLoading(true);
    const response = await fetch(`/api/research/approve`, {
      method: 'PUT',
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ id: id }),
    });

    if (!response.ok) {
      setLoading(false);
      let errorData;
      try {
        errorData = await response.json();
        setError(errorData.message)
      } catch (err) {
        setError("Failed to approve. Server returned an error without JSON.");
        return;
      }
      setError(errorData.message || "Failed to approve");
      return;
    } else {
      setLoading(false);
      setSuccess("Request approved!")
    }
    // ... function logic remains the same
  };

  const handleReject = async (id: any) => {
    setLoading(true);
    const response = await fetch(`/api/research/reject`, {
      method: 'PUT',
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ id: id }),
    });

    if (!response.ok) {
      setLoading(false);
      let errorData;
      try {
        errorData = await response.json();
        setError(errorData.message)
      } catch (err) {
        setError("Failed to reject. Server returned an error without JSON.");
        return;
      }
      setError(errorData.message || "Failed to reject");
      return;
    } else {
      setLoading(false);
      setSuccess("Request rejected!")
    }
    // ... function logic remains the same
  };

  const handleReview = async (id: any) => {
    // ... function logic remains the same
  };

  const handleHold = async (id: any) => {
    setLoading(true);
    const response = await fetch(`/api/research/hold`, {
      method: 'PUT',
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ id: id }),
    });

    if (!response.ok) {
      setLoading(false);
      let errorData;
      try {
        errorData = await response.json();
        setError(errorData.message)
      } catch (err) {
        setError("Failed to hold. Server returned an error without JSON.");
        return;
      }
      setError(errorData.message || "Failed to hold");
      return;
    } else {
      setLoading(false);
      setSuccess("Request put on hold!")
    }
    // ... function logic remains the same
  };

  const handleReview = async (id: any) => {
    setLoading(true);
    const response = await fetch(`/api/research/review`, {
      method: 'PUT',
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ id: id }),
    });

    if (!response.ok) {
      setLoading(false);
      let errorData;
      try {
        errorData = await response.json();
        setError(errorData.message)
      } catch (err) {
        setError("Failed to review. Server returned an error without JSON.");
        return;
      }
      setError(errorData.message || "Failed to review");
      return;
    } else {
      setLoading(false);
      setSuccess("Request under review!")
    }
  };

  // Auto review for pending/draft status
  useEffect(() => {
    if (research?.status === "Pending" || research?.status === "Draft") {
      handleReview(ResearchId);
    }
  }, [research, ResearchId]);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved': return 'bg-blue-500 text-white';
      case 'under review': return 'bg-amber-500 text-white';
      case 'rejected': return 'bg-orange-500 text-white';
      case 'on hold': return 'bg-teal-500 text-white';
      default: return 'bg-slate-500 text-white';
    }
  };

  const handleAction = (action: string) => {
    if (action === 'approve') handleApprove(research?.hashed_id);
    if (action === 'reject') handleReject(research?.hashed_id);
    if (action === 'hold') handleHold(research?.hashed_id);
  };

  const handleDelete = async (id: any) => {
    // ... function logic remains the same
  };

  if(research?.status === "Pending" || research?.status === "Draft"){
    handleReview(ResearchId);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-400 backdrop-blur-sm bg-opacity-40"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-4xl bg-white rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        
        {/* Header */}
        <div className="relative bg-slate-700 p-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-teal-50 hover:text-white hover:bg-teal-500 rounded-full transition-all"
          >
            <X size={20} />
          </button>
          
          <div className="pr-12">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="text-slate-300" size={18} />
              <span className="text-slate-300 text-xs font-medium uppercase tracking-wider">Research Paper</span>
            </div>
            <h1 className="text-xl font-bold text-white leading-tight mb-3">
              {research?.title}
            </h1>
            <div className="flex items-center gap-4 text-slate-300 text-sm">
              <span className="flex items-center gap-1">
                <User size={14} />
                {research?.researcher}
              </span>
              <span className="flex items-center gap-1">
                <Building2 size={14} />
                {research?.institute}
              </span>
            </div>
          </div>
        </h4>
        <div className="flex space-x-4 px-3">
          {buttons.map((button, index) => (
            <button key={index} onClick={() => handleActive(index)} className={`py-[6px] px-4 border-b capitalize hover:border-teal-500 ${activeId === index ? 'border-teal-500': ''}`}>{button.name}</button>
          ))}
        </div>

        {/* Success Message */}
        {success && (
          <div className="bg-green-100 border-l-4 border-green-300 p-3">
            <div className="flex items-center gap-2 text-green-500 text-sm">
              <Check size={16} />
              {success}
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border-l-4 border-red-300 p-3">
            <div className="flex items-center gap-2 text-red-500 text-sm">
              <AlertTriangle size={16} />
              {error}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="bg-slate-50 border-b px-6">
          <div className="flex space-x-6">
            {buttons.map((button, index) => {
              const Icon = button.icon;
              return (
                <button
                  key={index}
                  onClick={() => setActiveTab(index)}
                  className={`flex items-center gap-2 py-3 text-sm font-medium capitalize transition-colors border-b-2 ${
                    activeTab === index
                      ? 'border-teal-500 text-teal-600'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Icon size={16} />
                  {button.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex h-96">
          {/* Main Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {activeTab === 0 && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-slate-800 mb-2">Abstract</h3>
                  <div 
                    className="text-slate-700 text-sm leading-relaxed bg-slate-50 p-4 rounded-lg"
                    id="abstract"
                  ></div>
                </div>
                
                <div>
                  <h3 className="font-semibold text-slate-800 mb-2">Document</h3>
                  <div className="flex items-center gap-3 p-3 bg-teal-50 rounded-lg border border-teal-200">
                    <FileText className="text-teal-600" size={20} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-teal-900">{truncateText(research?.document ?? "", 60)}</p>
                      <p className="text-xs text-teal-600">{research?.document_type}</p>
                    </div>
                    <button className="p-2 text-teal-600 hover:bg-teal-100 rounded-lg transition-colors">
                      <Download size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 1 && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-slate-800 mb-3">Research Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-slate-500 uppercase tracking-wide">Category</label>
                        <p className="text-sm font-medium text-slate-700">{research?.category}</p>
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 uppercase tracking-wide">Year</label>
                        <p className="text-sm font-medium text-slate-700">{research?.year}</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-slate-500 uppercase tracking-wide">School</label>
                        <p className="text-sm font-medium text-slate-700">{research?.school}</p>
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 uppercase tracking-wide">Uploaded</label>
                        <p className="text-sm font-medium text-slate-700">{formatDate(research?.created_at)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {(activeTab === 2 || activeTab === 3) && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-slate-500">
                  <FileText size={48} className="mx-auto mb-3 text-slate-300" />
                  <p className="text-sm">Content for {buttons[activeTab].name} will be displayed here</p>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="w-72 bg-slate-50 border-l p-6">
            <div className="space-y-4">
              {/* Status */}
              <div className="text-center">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(research?.progress_status ?? "")}`}>
                  {research?.progress_status}
                </span>
              </div>

              {/* Quick Info */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Researcher</span>
                  <span className="font-medium text-slate-700">{research?.researcher}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Category</span>
                  <span className="font-medium text-slate-700">{research?.category}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Year</span>
                  <span className="font-medium text-slate-700">{research?.year}</span>
                </div>
              </div>

              <hr className="border-slate-200" />

              {/* Actions */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-slate-700 mb-3">Actions</h4>
                <button
                  onClick={() => handleAction('approve')}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  <Check size={16} />
                  Approve
                </button>
                <button
                  onClick={() => handleAction('reject')}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-amber-900 hover:bg-amber-800 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  <X size={16} />
                  Reject
                </button>
                <button
                  onClick={() => handleAction('hold')}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  <Pause size={16} />
                  Hold
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-white/90 flex items-center justify-center">
            <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-lg shadow-lg border">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-teal-500 border-t-transparent"></div>
              <span className="text-slate-700 font-medium text-sm">Processing...</span>
            </div>
          </div>
        )}
        <form className="space-y-2 max-h-[70vh] overflow-hidden overflow-y-visible">
          <div className="flex justify-between p-2 space-x-3">
            <div className="w-5/6 bg-white rounded-lg p-5">
              <div className="w-full flex items-center justify-center bg-slate-100 p-2">
                <i className="bi bi-search text-5xl text-slate-400"></i>
              </div>
              <div className="space-y-6 px-1">
                <div className="relative">
                  <h4 className="font-medium pt-2">Title</h4>
                  <div className={`relative text-gray-700 transition-all duration-300`}>
                  {research?.title}
                  </div>
                </div>
                <div className="relative">
                  <h4 className="font-medium">Abstract </h4>
                  <div className={`relative text-gray-700 transition-all duration-300`} id="abstract"></div>
                </div>
                <div className="relative">
                  <h4 className="font-medium pt-2">Document</h4>
                  {/* MODIFIED: This is the core logic change. It conditionally renders the link or a "private" message. */}
                  <div className={`relative text-gray-700 transition-all duration-300`}>
                    {research?.is_public ? (
                      <Link href={research?.document ?? ""} className="text-teal-600 underline" target="_blank" rel="noopener noreferrer">
                        {truncateText(research?.document ?? "", 80)}
                      </Link>
                    ) : (
                      <div className="flex items-center space-x-2 p-2 rounded-md bg-gray-100 text-gray-600">
                        <i className="bi bi-lock-fill"></i>
                        <span>This research is private. The document is not available for public view.</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="w-2/6 bg-white rounded-lg p-5 space-y-2 h-max">
              <h1 className="text-lg text-slate-600 font-semibold">Research Details</h1>
              <div className="space-y-1">
                <h4 className="text-xs text-slate-500">Status</h4>
                <div className="text-sm tex-slate-600">{research?.progress_status}</div>
              </div>
              <div className="space-y-1">
                <h4 className="text-xs text-slate-500">Researcher</h4>
                <div className="text-sm tex-slate-600">{research?.researcher}</div>
              </div>
              <div className="space-y-1">
                <h4 className="text-xs text-slate-500">University</h4>
                <div className="text-sm tex-slate-600">{research?.institute}</div>
              </div>
              <div className="space-y-1">
                <h4 className="text-xs text-slate-500">Category</h4>
                <div className="text-sm tex-slate-600">{research?.category}</div>
              </div>
              <div className="space-y-1">
                <h4 className="text-xs text-slate-500">Year</h4>
                <div className="text-sm tex-slate-600">{research?.year}</div>
              </div>
              <div className="space-y-1">
                <h4 className="text-xs text-slate-500">School </h4>
                <div className="text-sm tex-slate-600">{research?.school}</div>
              </div>
              <div className="space-y-1">
                <h4 className="text-xs text-slate-500">Document Type</h4>
                <div className="text-sm tex-slate-600">{research?.document_type}</div>
              </div>
              <div className="space-y-1">
                <h4 className="text-xs text-slate-500">Uploaded at</h4>
                <div className="text-sm tex-slate-600">{formatDate(research?.created_at)}</div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ViewResearch;