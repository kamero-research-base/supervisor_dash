"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";

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
    {"name": "details"},
    {"name": "supervisors"},
    {"name": "institution"},
  ];

interface ViewResearchProps{
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
}

const ViewResearch: React.FC<ViewResearchProps> = ({ResearchId, onClose }) => { 

  const [activeId, setActiveId] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [research, setResearch] = useState<FormData | null>(null);

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

  useEffect(() => {
    const fetchResearch = async () => {
      try {
        const response = await fetch(`/api/research/view`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ id: ResearchId }),
        });
        if (!response.ok) throw new Error("Failed to fetch researches");
        const data = await response.json();
        setResearch(data);
      } catch (error) {
        setError("An error occurred while fetching researches.");
      }
    };
    fetchResearch();
  }, [ResearchId]);
 
  useEffect(() => {
    if (typeof window !== "undefined") {
      const abstract = document.getElementById("abstract") as HTMLDivElement;
      if (abstract && research?.abstract) {
        abstract.innerHTML = research.abstract;
      }
    }
  }, [research]);

  const handleApprove = async (id: any) => {
    // ... function logic remains the same
  };

  const handleReject = async (id: any) => {
    // ... function logic remains the same
  };

  const handleReview = async (id: any) => {
    // ... function logic remains the same
  };

  const handleHold = async (id: any) => {
    // ... function logic remains the same
  };

  const handleDelete = async (id: any) => {
    // ... function logic remains the same
  };

  if(research?.status === "Pending" || research?.status === "Draft"){
    handleReview(ResearchId);
  }

  return (
    <div className="fixed flex justify-center items-center bg-slate-400 w-full h-full top-0 left-0 z-30 backdrop-blur-sm bg-opacity-40">
      <i
        onClick={onClose}
        className="bi bi-x absolute right-4 px-[6px] py-[2px] border top-7 text-2xl font-bold cursor-pointer text-teal-50 bg-teal-500 border-teal-300 hover:bg-teal-200 hover:border rounded-full"
      ></i>
      <div className="w-4/5 bg-slate-100 rounded-lg p-4">
        <h4 className="flex justify-between items-center p-3">
          <div>
           <h1 className="text-sm text-slate-400">RESEARCH HEADER</h1>
           <span className="text-2xl text-slate-700 font-medium">{truncateText(research?.title ?? "" , 40)} </span> 
          </div>
          <div className="space-x-3">
            <button className="border border-orange-800 py-[6px] px-6 rounded-md text-sm bg-orange-500 text-white text-center" onClick={() => {handleApprove(research?.hashed_id);}}>Approve</button>
            <button className="border border-amber-800 py-[6px] px-6 rounded-md text-sm bg-amber-900 text-white text-center" onClick={() => {handleReject(research?.hashed_id);}}>Reject</button>
            <button className="border border-orange-300 py-[6px] px-6 rounded-md text-sm text-orange-500 text-center" onClick={() => {handleHold(research?.hashed_id);}}>Hold</button>
          </div>
        </h4>
        <div className="flex space-x-4 px-3">
          {buttons.map((button, index) => (
            <button key={index} onClick={() => handleActive(index)} className={`py-[6px] px-4 border-b capitalize hover:border-teal-500 ${activeId === index ? 'border-teal-500': ''}`}>{button.name}</button>
          ))}
        </div>
        {success || error && (
          <div
          className={`${success ? 'bg-green-100 text-green-500 border-green-300' : 'bg-red-100 text-red-500 border-red-300'} p-4 rounded-md`}
          >
            {success ? success : error ? error : ""}
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
  )
}
export default ViewResearch;