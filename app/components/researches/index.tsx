//supervisor researches listings
"use client";

import { useEffect, useState, useMemo } from "react";
import ViewResearch from "../toggles/viewResearch";
interface ResearchHeaderProps {}

interface Analytics {
  total_researches: number;
  pending_researches: number;
  total_approved: number;
  total_rejected: number;
  total_onhold: number;
  total_published: number;
  total_downloads: number;
  my_uploads: number;
  students_count: number;
  percentage_change: {
    total_researches: number;
    pending_researches: number;
    total_approved: number;
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

const Header = ({}: ResearchHeaderProps) => {
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


  return (
    <div className="space-y-4">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-medium text-gray-700">Student Research Materials {"("}{analytics?.total_researches || 0}{")"}</h1>
        <div className="flex items-center gap-2">
          <button 
            className="flex items-center justify-center w-9 h-9 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            title="Download Research summary"
          >
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Analytics Cards - Grid for 4 cards */}
      <div className="grid grid-cols-4 gap-3">

        {/* Approved Card */}
        <div className="bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
          <div className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-green-100 border border-green-200 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900">Approved</h3>
                <p className="text-xs text-gray-500">Ready for publication</p>
              </div>
            </div>
            <div className="text-2xl font-bold text-green-600 mb-1">{analytics?.total_approved || 0}</div>
            <p className="text-xs text-gray-500">research materials approved</p>
          </div>
        </div>

        {/* Pending Card */}
        <div className="bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
          <div className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-yellow-100 border border-yellow-200 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900">Pending</h3>
                <p className="text-xs text-gray-500">Awaiting your review</p>
              </div>
            </div>
            <div className="text-2xl font-bold text-yellow-600 mb-1">{analytics?.pending_researches || 0}</div>
            <p className="text-xs text-gray-500">research materials to review</p>
          </div>
        </div>

        {/* On Hold Card */}
        <div className="bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
          <div className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-orange-100 border border-orange-200 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a1 1 0 011 1v3a1 1 0 11-2 0V6a1 1 0 011-1zM9 13a1 1 0 112 0 1 1 0 01-2 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900">On Hold</h3>
                <p className="text-xs text-gray-500">Paused by you</p>
              </div>
            </div>
            <div className="text-2xl font-bold text-orange-600 mb-1">{analytics?.total_onhold || 0}</div>
            <p className="text-xs text-gray-500">research materials paused</p>
          </div>
        </div>

        {/* Rejected Card */}
        <div className="bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
          <div className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-red-100 border border-red-200 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900">Rejected</h3>
                <p className="text-xs text-gray-500">Needs improvement</p>
              </div>
            </div>
            <div className="text-2xl font-bold text-red-600 mb-1">{analytics?.total_rejected || 0}</div>
            <p className="text-xs text-gray-500">research materials rejected</p>
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
  const [userInfo, setUserInfo] = useState<any | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Fetch research materials from assigned students only
  useEffect(() => {
    const fetchResearches = async () => {
      try {
        setLoading(true);
        const userSession = JSON.parse(localStorage.getItem("supervisorSession") || "{}");
        setUserInfo(userSession);
        // This API call fetches research materials from students assigned to the current supervisor
        const response = await fetch(`/api/research`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ supervisor_id: userSession.id })
        });
        if (!response.ok) throw new Error("Failed to fetch student research");
        const data = await response.json();
        
        // Handle both paginated and non-paginated API responses
        if (data.success && data.data) {
          setAllResearches(data.data.researches || data.data);
        } else {
          setAllResearches(data.researches || data);
        }
      } catch (error) {
        setError("An error occurred while fetching student research materials.");
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

  // Function to handle research view
  const handleResearchView = (hashedId: string) => {
    setView(hashedId);
    setDropdownOpen(null);
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
            <i>No student research found</i>
            <p className="text-sm text-gray-500 mt-2">Your assigned students haven't uploaded any research materials yet.</p>
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
                  <i>No student research found</i>
            <p className="text-sm text-gray-500 mt-2">Your assigned students haven't uploaded any research materials yet.</p>
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

    </>
  );
};

// Main Component
export default Header;

export { ResearchList };