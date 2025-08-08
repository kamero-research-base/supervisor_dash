"use client";

import { useEffect, useState } from "react";

interface ResearchHeaderProps {
  onAddResearchClick: () => void;
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
}

interface Analytics {
  total_researches: number;
  pending_researches: number;
  total_rejected: number;
  total_onhold: number;
  total_published: number;
  total_downloads: number;
  percentage_change: {
    total_researches: number;
    pending_researches: number;
    total_rejected: number;
    total_onhold: number;
    total_published: number;
    total_downloads: number;
  };
}

interface ResearchListProps {
  onResearchView: (researchId: string) => void;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  timestamp: string;
}

// API service functions
const apiService = {
  async fetchAnalytics(): Promise<Analytics> {
    try {
      const response = await fetch('/api/research/analytics', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Add authorization header if needed
          // 'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
      });

      if (!response.ok) {
        throw new Error(`Analytics API error: ${response.status}`);
      }

      const result: ApiResponse<Analytics> = await response.json();
      
      if (!result.success || !result.data) {
        throw new Error(result.message || 'Failed to fetch analytics');
      }

      return result.data;
    } catch (error) {
      console.error('Error fetching analytics:', error);
      throw error;
    }
  },

  async fetchResearches(filters?: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ researches: Research[]; total: number }> {
    try {
      const params = new URLSearchParams();
      
      if (filters?.status) params.append('status', filters.status);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const url = `/api/research${params.toString() ? `?${params.toString()}` : ''}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Add authorization header if needed
          // 'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
      });

      if (!response.ok) {
        throw new Error(`Research API error: ${response.status}`);
      }

      const result: ApiResponse<{ researches: Research[]; total: number }> = await response.json();
      
      if (!result.success || !result.data) {
        throw new Error(result.message || 'Failed to fetch researches');
      }

      return result.data;
    } catch (error) {
      console.error('Error fetching researches:', error);
      throw error;
    }
  }
};

const Header = ({ onAddResearchClick }: ResearchHeaderProps) => {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);
        const analyticsData = await apiService.fetchAnalytics();
        setAnalytics(analyticsData);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load analytics';
        setError(errorMessage);
        console.error('Analytics loading error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, []);

  const cards = [
    {
      title: "Total Research",
      value: analytics?.total_researches || 0,
      change: analytics?.percentage_change.total_researches || 0,
      icon: "bi-search"
    },
    {
      title: "Downloads",
      value: analytics?.total_downloads?.toLocaleString() || '0',
      change: analytics?.percentage_change.total_downloads || 0,
      icon: "bi-download"
    },
    {
      title: "Pending",
      value: (Number(analytics?.total_onhold || 0) + Number(analytics?.pending_researches || 0)),
      change: (Number(analytics?.percentage_change.total_onhold || 0) + Number(analytics?.percentage_change.pending_researches || 0)),
      icon: "bi-clock"
    },
    {
      title: "Published",
      value: analytics?.total_published || 0,
      change: analytics?.percentage_change.total_published || 0,
      icon: "bi-check-circle"
    },
    {
      title: "Rejected",
      value: analytics?.total_rejected || 0,
      change: analytics?.percentage_change.total_rejected || 0,
      icon: "bi-x-circle"
    }
  ];

  if (loading) {
    return (
      <div className="bg-white">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-1 h-8 bg-teal-600 rounded-full"></div>
            <div>
              <h1 className="text-2xl font-bold text-teal-900">Research Materials</h1>
              <div className="flex items-center mt-1 space-x-2">
                <div className="w-2 h-2 bg-teal-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-slate-500">Loading Dashboard...</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button className="flex items-center justify-center px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors" title="Download summary">
              <i className="bi bi-download text-sm"></i>
            </button>
            <button 
              onClick={onAddResearchClick} 
              className="flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
            >
              <i className="bi bi-plus-circle mr-2"></i>
              <span className="font-medium">Add Research</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-4 mb-8">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="bg-white border border-slate-200 rounded-xl p-4 animate-pulse">
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 bg-slate-200 rounded-lg"></div>
                <div className="w-1 h-4 bg-slate-200 rounded-full"></div>
              </div>
              <div className="space-y-2">
                <div className="h-6 bg-slate-200 rounded w-12"></div>
                <div className="flex items-center justify-between">
                  <div className="h-4 bg-slate-200 rounded w-16"></div>
                  <div className="h-5 bg-slate-200 rounded w-12"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-1 h-8 bg-red-600 rounded-full"></div>
            <div>
              <h1 className="text-2xl font-bold text-red-900">Research Materials</h1>
              <div className="flex items-center mt-1 space-x-2">
                <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                <span className="text-sm text-red-500">Error Loading Dashboard</span>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
          <p className="text-red-700">Failed to load analytics: {error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-2 text-red-600 hover:text-red-800 text-sm underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className="w-1 h-8 bg-teal-600 rounded-full"></div>
          <div>
            <h1 className="text-2xl font-bold text-teal-900">Research Materials</h1>
            <div className="flex items-center mt-1 space-x-2">
              <div className="w-2 h-2 bg-teal-400 rounded-full"></div>
              <span className="text-sm text-slate-500">Live Dashboard</span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button className="flex items-center justify-center px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors" title="Download summary">
            <i className="bi bi-download text-sm"></i>
          </button>
          <button 
            onClick={onAddResearchClick} 
            className="flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            <i className="bi bi-plus-circle mr-2"></i>
            <span className="font-medium">Add Research</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-4 mb-8">
        {cards.map((card, index) => (
          <div key={index} className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="w-8 h-8 bg-teal-50 rounded-lg flex items-center justify-center">
                <i className={`${card.icon} text-teal-600 text-sm`}></i>
              </div>
              <div className="w-1 h-4 bg-teal-300 rounded-full"></div>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-teal-900">{card.value}</div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-600">{card.title}</span>
                <div className={`flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                  Number(card.change) > 0 
                    ? 'bg-teal-50 text-teal-700' 
                    : 'bg-red-50 text-red-600'
                }`}>
                  <i className={`bi ${Number(card.change) > 0 ? 'bi-arrow-up' : 'bi-arrow-down'} mr-1 text-xs`}></i>
                  {Math.abs(card.change || 0)}%
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const buttons = [
  { "id": 1, "name": "" },
  { "id": 3, "name": "Rejected" },
  { "id": 4, "name": "On hold" },
  { "id": 5, "name": "Under review" },
  { "id": 7, "name": "Published" },
  { "id": 8, "name": "Draft" },
  { "id": 9, "name": "Pending" },
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

const ResearchesList = ({ onResearchView }: ResearchListProps) => {
  const [activeId, setActiveId] = useState(1);
  const [dropdownOpen, setDropdownOpen] = useState<number | null>(null);
  const [researches, setResearches] = useState<Research[]>([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [totalResearches, setTotalResearches] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadResearches = async (filters?: {
    status?: string;
    search?: string;
    page?: number;
  }) => {
    try {
      setLoading(true);
      setError(null);
      
      const activeButton = buttons.find(button => button.id === activeId);
      const statusFilter = filters?.status || (activeButton?.name || '');
      
      const result = await apiService.fetchResearches({
        status: statusFilter === '' ? undefined : statusFilter,
        search: filters?.search || search,
        page: filters?.page || currentPage,
        limit: itemsPerPage
      });

      setResearches(result.researches);
      setTotalResearches(result.total);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load researches';
      setError(errorMessage);
      console.error('Research loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleActive = (id: number) => {
    setActiveId(id);
    setCurrentPage(1);
    
    const button = buttons.find(button => button.id === id);
    const statusFilter = button?.name || '';
    
    loadResearches({ 
      status: statusFilter === '' ? undefined : statusFilter,
      page: 1 
    });
  };

  const toggleDropdown = (id: number) => {
    setDropdownOpen(dropdownOpen === id ? null : id);
  };

  const handleFilter = (text: string) => {
    setCurrentPage(1);
    loadResearches({ 
      status: text === "" ? undefined : text,
      page: 1 
    });
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setSearch(value);
    setCurrentPage(1);
    
    // Debounce search to avoid too many API calls
    const timeoutId = setTimeout(() => {
      loadResearches({ 
        search: value,
        page: 1 
      });
    }, 500);

    return () => clearTimeout(timeoutId);
  };

  // Calculate pagination
  const totalPages = Math.ceil(totalResearches / itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    loadResearches({ page });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'published':
        return 'bg-teal-50 text-teal-700';
      case 'under review':
        return 'bg-amber-50 text-amber-700';
      case 'on hold':
        return 'bg-orange-50 text-orange-700';
      case 'draft':
        return 'bg-gray-100 text-gray-700';
      case 'pending':
        return 'bg-blue-50 text-blue-700';
      case 'rejected':
        return 'bg-red-50 text-red-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const getProgressColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-teal-50 text-teal-700';
      case 'ongoing':
        return 'bg-blue-50 text-blue-700';
      case 'paused':
        return 'bg-amber-50 text-amber-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  // Initial load
  useEffect(() => {
    loadResearches();
  }, []);

  if (loading && researches.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex space-x-2">
              {buttons.map((button) => (
                <button
                  key={button.id}
                  className="px-4 py-2 rounded-lg text-sm font-medium border border-slate-200 bg-slate-100 animate-pulse"
                >
                  {button.name || "All"}
                </button>
              ))}
            </div>
            <div className="w-64 h-10 bg-slate-200 rounded-lg animate-pulse"></div>
          </div>
          
          <div className="space-y-4">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="border border-slate-200 rounded-lg p-4 animate-pulse">
                <div className="flex justify-between items-start mb-3">
                  <div className="h-6 bg-slate-200 rounded w-2/3"></div>
                  <div className="h-5 bg-slate-200 rounded w-16"></div>
                </div>
                <div className="h-4 bg-slate-200 rounded w-1/3 mb-2"></div>
                <div className="flex justify-between items-center">
                  <div className="h-4 bg-slate-200 rounded w-20"></div>
                  <div className="h-4 bg-slate-200 rounded w-24"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200">
      <div className="p-6">
        {/* Filter buttons */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex space-x-2 flex-wrap">
            {buttons.map((button) => (
              <button
                key={button.id}
                onClick={() => handleActive(button.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeId === button.id
                    ? 'bg-teal-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {button.name || "All"}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <i className="bi bi-search absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"></i>
            <input
              type="text"
              placeholder="Search researches..."
              value={search}
              onChange={handleSearch}
              className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 w-64"
            />
          </div>
        </div>

        {/* Error state */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700">Error loading researches: {error}</p>
            <button 
              onClick={() => loadResearches()} 
              className="mt-2 text-red-600 hover:text-red-800 text-sm underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Research list */}
        <div className="space-y-4 mb-6">
          {researches.length === 0 && !loading ? (
            <div className="text-center py-12">
              <i className="bi bi-search text-4xl text-slate-300 mb-4"></i>
              <h3 className="text-lg font-medium text-slate-600 mb-2">No researches found</h3>
              <p className="text-slate-500">Try adjusting your filters or search terms.</p>
            </div>
          ) : (
            researches.map((research) => (
              <div
                key={research.id}
                className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => onResearchView(research.hashed_id)}
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-semibold text-slate-900 hover:text-teal-600 line-clamp-2">
                    {research.title}
                  </h3>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(research.status)}`}>
                      {research.status}
                    </span>
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleDropdown(research.id);
                        }}
                        className="p-1 hover:bg-slate-100 rounded"
                      >
                        <i className="bi bi-three-dots-vertical text-slate-400"></i>
                      </button>
                      {dropdownOpen === research.id && (
                        <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-10">
                          <button className="w-full text-left px-4 py-2 hover:bg-slate-50 text-sm">View Details</button>
                          <button className="w-full text-left px-4 py-2 hover:bg-slate-50 text-sm">Edit</button>
                          <button className="w-full text-left px-4 py-2 hover:bg-slate-50 text-sm text-red-600">Delete</button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="text-sm text-slate-600 mb-2">
                  By <span className="font-medium">{research.researcher}</span> • {research.year}
                </div>
                
                <div className="flex justify-between items-center">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getProgressColor(research.progress_status)}`}>
                    {research.progress_status}
                  </span>
                  <span className="text-xs text-slate-500">
                    {timeAgo(research.created_at)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-600">
              Showing {researches.length} of {totalResearches} results
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-slate-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
              >
                Previous
              </button>
              
              {[...Array(Math.min(5, totalPages))].map((_, index) => {
                const pageNum = currentPage <= 3 ? index + 1 : currentPage - 2 + index;
                if (pageNum > totalPages) return null;
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`px-3 py-1 border rounded-lg ${
                      currentPage === pageNum
                        ? 'bg-teal-600 text-white border-teal-600'
                        : 'border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-slate-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export { Header, ResearchesList };