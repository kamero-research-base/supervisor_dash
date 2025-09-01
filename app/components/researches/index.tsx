//supervisor researches listings
"use client";

import { useEffect, useState, useMemo } from "react";
import ViewResearch from "../toggles/viewResearch";
import EditResearch from "../toggles/editResearch";

interface ResearchHeaderProps {
  onAddResearchClick: () => void;
}

interface Analytics {
  total_researches: number;
  pending_researches: number;
  total_rejected: number;
  total_onhold: number;
  total_published: number;
  total_downloads: number;
  my_uploads: number;
  students_count: number;
  percentage_change: {
    total_researches: number;
    pending_researches: number;
    total_rejected: number;
    total_onhold: number;
    total_published: number;
    total_downloads: number;
    my_uploads: number;
    students_count: number;
  };
}

interface Research {
  id: number;
  status: string;
  title: string;
  researcher: string;
  year: string;
  progress_status: string;
  created_at: string;
  hashed_id: string;
  department?: string;
  supervisor?: string;
  downloads?: number;
  material_status?: string;
  visibility?: string;
}

const Header = ({ onAddResearchClick }: ResearchHeaderProps) => {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        // Get userSession from localStorage
        const userSession = JSON.parse(localStorage.getItem("supervisorSession") || "{}");
        
        const response = await fetch(`/api/analytics/researches`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ supervisor_id: userSession.id })
        });
        if (!response.ok) throw new Error("Failed to fetch analytics");
        const data = await response.json();
        if (data.success && data.data) {
          setAnalytics(data.data);
        }
      } catch (error) {
        console.log("An error occurred while fetching analytics.");
      }
    };
    fetchAnalytics();
  }, []);

  // Helper function to render percentage change
  const renderPercentageChange = (value: number) => {
    if (value === 0) return null;
    const isPositive = value > 0;
    return (
      <div className={`text-xs font-medium flex items-center gap-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        ) : (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        )}
        {Math.abs(value)}%
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-medium text-gray-700">Research Materials {"("}{analytics?.total_researches || 0}{")"}</h1>
        <div className="flex items-center gap-2">
          <button 
            className="flex items-center justify-center w-9 h-9 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            title="Download Research summary"
          >
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
          </button>
          <button 
            onClick={onAddResearchClick}
            className="flex items-center gap-2 px-3 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Research
          </button>
        </div>
      </div>

      {/* Analytics Cards - Updated grid for 7 cards */}
      <div className="grid grid-cols-6 gap-3">
        {/* My Uploads Card */}
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between p-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-purple-100 border border-purple-200 rounded flex items-center justify-center">
                <svg className="w-3 h-3 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-700">My Uploads</span>
            </div>
            <button className="text-gray-400 hover:text-gray-600">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path d="M10 4a2 2 0 100-4 2 2 0 000 4z" />
                <path d="M10 20a2 2 0 100-4 2 2 0 000 4z" />
              </svg>
            </button>
          </div>
          <div className="p-3">
            <div className="flex items-center justify-between">
              <div className="text-2xl font-semibold text-gray-800">{analytics?.my_uploads || 0}</div>
              {analytics && renderPercentageChange(analytics.percentage_change.my_uploads)}
            </div>
          </div>
        </div>

        {/* Students Card */}
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between p-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-indigo-100 border border-indigo-200 rounded flex items-center justify-center">
                <svg className="w-3 h-3 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-700">Students</span>
            </div>
            <button className="text-gray-400 hover:text-gray-600">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path d="M10 4a2 2 0 100-4 2 2 0 000 4z" />
                <path d="M10 20a2 2 0 100-4 2 2 0 000 4z" />
              </svg>
            </button>
          </div>
          <div className="p-3">
            <div className="text-2xl font-semibold text-gray-800">{analytics?.students_count || 0}</div>
          </div>
        </div>

        {/* Published Card */}
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between p-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-teal-100 border border-teal-200 rounded flex items-center justify-center">
                <svg className="w-3 h-3 text-teal-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-700">Published</span>
            </div>
            <button className="text-gray-400 hover:text-gray-600">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path d="M10 4a2 2 0 100-4 2 2 0 000 4z" />
                <path d="M10 20a2 2 0 100-4 2 2 0 000 4z" />
              </svg>
            </button>
          </div>
          <div className="p-3">
            <div className="flex items-center justify-between">
              <div className="text-2xl font-semibold text-gray-800">{analytics?.total_published || 0}</div>
              {analytics && renderPercentageChange(analytics.percentage_change.total_published)}
            </div>
          </div>
        </div>

        {/* Pending Card */}
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between p-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-yellow-100 border border-yellow-200 rounded flex items-center justify-center">
                <svg className="w-3 h-3 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-700">Pending</span>
            </div>
            <button className="text-gray-400 hover:text-gray-600">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path d="M10 4a2 2 0 100-4 2 2 0 000 4z" />
                <path d="M10 20a2 2 0 100-4 2 2 0 000 4z" />
              </svg>
            </button>
          </div>
          <div className="p-3">
            <div className="flex items-center justify-between">
              <div className="text-2xl font-semibold text-gray-800">{(analytics?.pending_researches || 0) + (analytics?.total_onhold || 0)}</div>
              {analytics && renderPercentageChange(analytics.percentage_change.pending_researches)}
            </div>
          </div>
        </div>

        {/* Rejected Card */}
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between p-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-red-100 border border-red-200 rounded flex items-center justify-center">
                <svg className="w-3 h-3 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-700">Rejected</span>
            </div>
            <button className="text-gray-400 hover:text-gray-600">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path d="M10 4a2 2 0 100-4 2 2 0 000 4z" />
                <path d="M10 20a2 2 0 100-4 2 2 0 000 4z" />
              </svg>
            </button>
          </div>
          <div className="p-3">
            <div className="flex items-center justify-between">
              <div className="text-2xl font-semibold text-gray-800">{analytics?.total_rejected || 0}</div>
              {analytics && renderPercentageChange(analytics.percentage_change.total_rejected)}
            </div>
          </div>
        </div>

        {/* Downloads Card */}
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between p-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-100 border border-blue-200 rounded flex items-center justify-center">
                <svg className="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-700">Downloads</span>
            </div>
            <button className="text-gray-400 hover:text-gray-600">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path d="M10 4a2 2 0 100-4 2 2 0 000 4z" />
                <path d="M10 20a2 2 0 100-4 2 2 0 000 4z" />
              </svg>
            </button>
          </div>
          <div className="p-3">
            <div className="flex items-center justify-between">
              <div className="text-2xl font-semibold text-gray-800">{analytics?.total_downloads?.toLocaleString() || '0'}</div>
              {analytics && renderPercentageChange(analytics.percentage_change.total_downloads)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ResearchList = () => {
  const [activeId, setActiveId] = useState(1);
  const [dropdownOpen, setDropdownOpen] = useState<number | null>(null);
  const [allResearches, setAllResearches] = useState<Research[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<string | null>(null);
  const [sort, setSort] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingResearch, setEditingResearch] = useState<Research | null>(null);
  const [userInfo, setUserInfo] = useState<any | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Fetch all researches once
  useEffect(() => {
    const fetchResearches = async () => {
      try {
        setLoading(true);
        const userSession = JSON.parse(localStorage.getItem("supervisorSession") || "{}");
        setUserInfo(userSession);
        const response = await fetch(`/api/research`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ supervisor_id: userSession.id })
        });
        if (!response.ok) throw new Error("Failed to fetch researches");
        const data = await response.json();
        
        // Handle both paginated and non-paginated API responses
        if (data.success && data.data) {
          setAllResearches(data.data.researches || data.data);
        } else {
          setAllResearches(data.researches || data);
        }
      } catch (error) {
        setError("An error occurred while fetching researches.");
      } finally {
        setLoading(false);
      }
    };
    fetchResearches();
  }, []); // Only fetch once on component mount

  // Frontend filtering, searching, and sorting logic
  const filteredAndSortedResearches = useMemo(() => {
    let result = [...allResearches];

    // Apply status filter
    if (filter && filter !== "") {
      result = result.filter(research => 
        research.status.toLowerCase() === filter.toLowerCase()
      );
    }

    // Apply search filter
    if (search.trim() !== "") {
      const searchTerm = search.toLowerCase();
      result = result.filter(research =>
        research.title.toLowerCase().includes(searchTerm) ||
        research.researcher.toLowerCase().includes(searchTerm) ||
        research.year.includes(searchTerm) ||
        research.department?.toLowerCase().includes(searchTerm) ||
        research.supervisor?.toLowerCase().includes(searchTerm)
      );
    }

    // Apply sorting
    if (sort) {
      result.sort((a, b) => {
        switch (sort) {
          case 'title_asc':
            return a.title.localeCompare(b.title);
          case 'title_desc':
            return b.title.localeCompare(a.title);
          case 'researcher_asc':
            return a.researcher.localeCompare(b.researcher);
          case 'researcher_desc':
            return b.researcher.localeCompare(a.researcher);
          case 'year_asc':
            return a.year.localeCompare(b.year);
          case 'year_desc':
            return b.year.localeCompare(a.year);
          case 'created_asc':
            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          case 'created_desc':
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          default:
            return 0;
        }
      });
    }

    return result;
  }, [allResearches, filter, search, sort]);

  // Pagination logic for filtered results
  const paginatedResearches = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAndSortedResearches.slice(startIndex, endIndex);
  }, [filteredAndSortedResearches, currentPage, itemsPerPage]);

  const totalCount = filteredAndSortedResearches.length;
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const buttons = [
    { "id": 1, "name": "" },
    { "id": 2, "name": "Published" },
    { "id": 3, "name": "Rejected" },
    { "id": 4, "name": "On hold" },
    { "id": 5, "name": "Under review" },
    { "id": 6, "name": "Draft" },
    { "id": 7, "name": "Pending" },
  ];

  const timeAgo = (createdDate: string): string => {
    const now = new Date();
    const created = new Date(createdDate);
    const diffInSeconds = Math.floor((now.getTime() - created.getTime()) / 1000);

    if (diffInSeconds < 60) return `Now`;
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) return `${diffInDays}d ago`;
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) return `${diffInMonths}mo ago`;
    const diffInYears = Math.floor(diffInMonths / 12);
    return `${diffInYears}y ago`;
  };

  const getStatusBadge = (status: string) => {
    const statusStyles = {
      'Published': 'bg-green-50 text-green-700 border-green-200',
      'Under review': 'bg-blue-50 text-blue-700 border-blue-200',
      'On hold': 'bg-orange-50 text-orange-700 border-orange-200',
      'Draft': 'bg-gray-50 text-gray-700 border-gray-200',
      'Pending': 'bg-yellow-50 text-yellow-700 border-yellow-200',
      'Rejected': 'bg-red-50 text-red-700 border-red-200'
    };
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${statusStyles[status as keyof typeof statusStyles] || statusStyles.Draft}`}>
        {status}
      </span>
    );
  };

  const getProgressBadge = (status: string) => {
    const progressStyles = {
      'completed': 'bg-green-50 text-green-700 border-green-200 capitalize',
      'ongoing': 'bg-blue-50 text-blue-700 border-blue-200 capitalize',
      'paused': 'bg-orange-50 text-orange-700 border-orange-200 capitalize'
    };
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${progressStyles[status as keyof typeof progressStyles] || progressStyles.ongoing}`}>
        {status}
      </span>
    );
  };

  const handleActive = (id: number, name: string) => {
    setActiveId(id);
    setFilter(name);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setCurrentPage(1); // Reset to first page when search changes
  };

  const handleSort = (sortType: string) => {
    setSort(sortType);
    setCurrentPage(1); // Reset to first page when sort changes
  };

  const toggleDropdown = (id: number) => {
    setDropdownOpen(dropdownOpen === id ? null : id);
  };

  const handleEdit = (research: Research) => {
    setEditingResearch(research);
    setEditModalOpen(true);
    setDropdownOpen(null);
  };

  const handleCloseEdit = () => {
    setEditModalOpen(false);
    setEditingResearch(null);
  };

  const handleSaveEdit = (research: Research) => {
    // Update the research in the state
    setAllResearches(prev =>
      prev.map(r => (r.id === research.id ? research : r))
    );
    handleCloseEdit();
  };

  // Function to handle research view
  const handleResearchView = (hashedId: string) => {
    setView(hashedId);
    setDropdownOpen(null);
  };

  // Function to handle research deletion
  const handleDeleteResearch = async (researchId: number) => {
    if (window.confirm('Are you sure you want to delete this research?')) {
      try {
        // Add your delete API call here
        // const response = await fetch(`/api/research/${researchId}`, { method: 'DELETE' });
        // if (response.ok) {
          setAllResearches(prev => prev.filter(r => r.id !== researchId));
          setDropdownOpen(null);
        // }
      } catch (error) {
        console.error('Error deleting research:', error);
      }
    }
  };

  // Pagination handlers
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const getPaginationRange = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots.filter((item, index, arr) => arr.indexOf(item) === index);
  };

  // Grid View Component
  const GridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
      {paginatedResearches.length === 0 ? (
        <div className="col-span-full text-center text-gray-500 py-8">
          <div className="flex flex-col justify-center items-center opacity-65">
            <div className="img w-[150px] h-[150px]">
              <img src="/delete.png" alt="" className="w-full h-full object-contain"/>
            </div>
            <i>No researches found</i>
          </div>
        </div>
      ) : (
        paginatedResearches.map((research) => (
          <div key={research.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              {getStatusBadge(research.status)}
              <div className="relative">
                <button
                  className="inline-flex items-center justify-center w-8 h-8 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                  onClick={() => toggleDropdown(research.id)}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path d="M10 4a2 2 0 100-4 2 2 0 000 4z" />
                    <path d="M10 20a2 2 0 100-4 2 2 0 000 4z" />
                  </svg>
                </button>
                
                {dropdownOpen === research.id && (
                  <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                    <div className="py-1">
                      <button 
                        className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors" 
                        onClick={() => handleResearchView(""+research.id)}
                      >
                        <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        View Details
                      </button>
                      <button 
                        className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => handleEdit(research)}
                      >
                        <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                      </button>
                      <button 
                        className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        onClick={() => handleDeleteResearch(research.id)}
                      >
                        <svg className="w-4 h-4 mr-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <h3 className="font-medium text-gray-900 mb-2 line-clamp-2" title={research.title}>
              {research.title}
            </h3>
            
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                {research.researcher}
              </div>
              
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {research.year}
              </div>
              
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                {research.department || userInfo?.department_name}
              </div>
            </div>
            
            <div className="flex items-center justify-between mt-4">
              {getProgressBadge(research.progress_status)}
              <span className="text-xs text-gray-500">
                {timeAgo(research.created_at)}
              </span>
            </div>
          </div>
        ))
      )}
    </div>
  );

  // Table View Component  
  const TableView = () => (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Researcher</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {paginatedResearches.length === 0 ? (
            <tr>
              <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                <div className="flex flex-col justify-center items-center opacity-65">
                  <div className="img w-[150px] h-[150px]">
                    <img src="/delete.png" alt="" className="w-full h-full object-contain"/>
                  </div>
                  <i>No researches found</i>
                </div>
              </td>
            </tr>
          ) : (
            paginatedResearches.map((research) => (
              <tr key={research.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  {getStatusBadge(research.status)}
                </td>
                <td className="px-4 py-3 text-sm font-medium text-gray-900 max-w-xs">
                  <div className="truncate" title={research.title}>
                    {research.title}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {research.researcher}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {research.year}
                </td>
                <td className="px-4 py-3">
                  {getProgressBadge(research.progress_status)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {research.department || userInfo?.department_name}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {timeAgo(research.created_at)}
                </td>
                <td className="px-4 py-3 text-center relative">
                  <button
                    className="inline-flex items-center justify-center w-8 h-8 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                    onClick={() => toggleDropdown(research.id)}
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path d="M10 4a2 2 0 100-4 2 2 0 000 4z" />
                      <path d="M10 20a2 2 0 100-4 2 2 0 000 4z" />
                    </svg>
                  </button>
                  
                  {dropdownOpen === research.id && (
                    <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                      <div className="py-1">
                        <button 
                          className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors" 
                          onClick={() => handleResearchView(""+research.id)}
                        >
                          <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          View Details
                        </button>
                        <button 
                          className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          onClick={() => handleEdit(research)}
                        >
                          <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit
                        </button>
                        <button 
                          className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                          onClick={() => handleDeleteResearch(research.id)}
                        >
                          <svg className="w-4 h-4 mr-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  if (loading) {
    return <div className="text-center text-gray-500 py-8">Loading...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500 py-8">{error}</div>;
  }

  // Show ViewResearch component if view state is set
  if (view) {
    return <ViewResearch ResearchId={view} onClose={() => setView(null)} />;
  }

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-lg mt-4">
        {/* Table Header */}
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h4 className="text-base font-medium text-gray-800">Research List</h4>
            
            {/* View Mode Toggle */}
            <div className="flex items-center space-x-2">
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('table')}
                  className={`flex items-center px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    viewMode === 'table'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                  Table
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`flex items-center px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                  Grid
                </button>
              </div>
            </div>
          </div>
          
          {/* Filters and Search */}
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-1">
              {buttons.map((btn) => (
                <button 
                  key={btn.id} 
                  className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                    activeId === btn.id 
                      ? 'bg-gray-100 border-gray-300 text-gray-700' 
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`} 
                  onClick={() => handleActive(btn.id, btn.name)}
                >
                  {btn.name === "" ? 'All' : btn.name}
                </button>
              ))}
            </div>
            
            <div className="flex items-center gap-2">
              {/* Sort dropdown */}
              <div className="relative">
                <select 
                  value={sort} 
                  onChange={(e) => handleSort(e.target.value)}
                  className="flex items-center justify-center w-auto h-8 px-2 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors text-xs bg-white"
                >
                  <option value="">Sort by</option>
                  <option value="title_asc">Title (A-Z)</option>
                  <option value="title_desc">Title (Z-A)</option>
                  <option value="researcher_asc">Researcher (A-Z)</option>
                  <option value="researcher_desc">Researcher (Z-A)</option>
                  <option value="year_asc">Year (Oldest)</option>
                  <option value="year_desc">Year (Newest)</option>
                  <option value="created_asc">Created (Oldest)</option>
                  <option value="created_desc">Created (Newest)</option>
                </select>
              </div>
              
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input 
                  type="search" 
                  name="search" 
                  value={search}
                  onChange={handleSearch}
                  placeholder="Search researches..." 
                  className="pl-10 pr-4 py-2 w-64 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        {viewMode === 'table' ? <TableView /> : <GridView />}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <div className="flex items-center text-sm text-gray-700">
              <span>
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} results
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors duration-200"
              >
                Previous
              </button>
              
              {getPaginationRange().map((page, index) => (
                <span key={index}>
                  {page === '...' ? (
                    <span className="px-3 py-2 text-sm text-gray-500">...</span>
                  ) : (
                    <button
                      onClick={() => handlePageChange(page as number)}
                      className={`px-3 py-2 text-sm border rounded-lg transition-colors duration-200 ${
                        currentPage === page
                          ? 'bg-teal-600 text-white border-teal-600'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  )}
                </span>
              ))}
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors duration-200"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editModalOpen && editingResearch && (
        <EditResearch
          research={editingResearch}
          onClose={handleCloseEdit}
          onSave={handleSaveEdit}
        />
      )}
    </>
  );
};

// Main Component
export default Header;

export { ResearchList };