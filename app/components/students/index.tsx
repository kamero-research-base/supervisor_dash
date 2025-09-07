"use client";

import { User } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import UserOverview from "../toggles/viewUser";

interface StudentHeaderProps{
  onAddStudentClick: () => void;
}

interface Analytics {
  total_students: number;
  total_active: number;
  total_pending: number;
  total_unverified: number;
  total_inactive: number;
}

interface Student {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  password: string;
  institute: string;
  status: string;
  created_at: string;
  profile_picture: string;
  hashed_id: string;
  department: string;
}

const Header = ({ onAddStudentClick }: StudentHeaderProps) => {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  
  useEffect(() => {
    const userSession = JSON.parse(localStorage?.getItem('supervisorSession') || '{}');
    let id = "";
    if(userSession && userSession.id){
      id = userSession.id;
    }
    const fetchSupervisors = async () => {
      try {
        const response = await fetch(`/api/analytics/students`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ supervisor_id: id })
        });
        if (!response.ok) throw new Error("Failed to fetch supervisors");
        const data = await response.json();
        setAnalytics(data);
      } catch (error) {
        console.log("An error occurred while fetching supervisors.");
      }
    };
    fetchSupervisors();
  }, []);

  const getActivePercentage = () => {
    if (!analytics?.total_students || analytics.total_students === 0) return 0;
    return Math.round((analytics.total_active / analytics.total_students) * 100);
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-gray-900">Students Overview</h1>
          <p className="text-sm text-gray-600">Manage and monitor your students' progress</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            className="flex items-center justify-center w-10 h-10 border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 shadow-sm"
            title="Export student data"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
          </button>
          <button 
            onClick={onAddStudentClick}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-teal-600 to-teal-700 text-white text-sm font-semibold rounded-xl hover:from-teal-700 hover:to-teal-800 transform hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span className="hidden sm:inline">Add Student</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>

      {/* Main Statistics Card */}
      <div className="bg-gradient-to-br from-teal-50 via-white to-blue-50 border border-teal-100 rounded-2xl p-6 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Primary Metric */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-teal-100 rounded-2xl">
                <User className="w-8 h-8 text-teal-600" />
              </div>
              <div>
                <h2 className="text-sm font-medium text-gray-600 uppercase tracking-wide">Total Students Enrolled</h2>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-gray-900">{analytics?.total_students || 0}</span>
                  <span className="text-sm text-gray-500">students</span>
                </div>
              </div>
            </div>
            
            {/* Active Rate Progress */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Active Participation Rate</span>
                <span className="text-sm font-semibold text-teal-600">{getActivePercentage()}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-teal-500 to-teal-600 h-2 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${getActivePercentage()}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>{analytics?.total_active || 0} active</span>
                <span>{(analytics?.total_students || 0) - (analytics?.total_active || 0)} inactive</span>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Quick Stats</h3>
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-3">
              <div className="bg-white rounded-xl p-3 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Active</span>
                  </div>
                  <span className="font-semibold text-gray-900">{analytics?.total_active || 0}</span>
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-3 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Pending</span>
                  </div>
                  <span className="font-semibold text-gray-900">{analytics?.total_pending || 0}</span>
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-3 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Unverified</span>
                  </div>
                  <span className="font-semibold text-gray-900">{analytics?.total_unverified || 0}</span>
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-3 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    <span className="text-sm text-gray-600">Inactive</span>
                  </div>
                  <span className="font-semibold text-gray-900">{analytics?.total_inactive || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StudentList = () => {
  const [activeId, setActiveId] = useState(1);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<string | null>(null);
  const [sort, setSort] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Fetch all students once
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const userSession = JSON.parse(localStorage?.getItem('supervisorSession') || '{}');
        let id = "";
        if(userSession && userSession.id){
          id = userSession.id;
        }

        setLoading(true);
        // Only send supervisor_id to API, no search/filter/sort params
        const response = await fetch(`/api/students?supervisor_id=${id}`);
        if (!response.ok) throw new Error("Failed to fetch students");
        const data = await response.json();
        
        // Handle both paginated and non-paginated API responses
        if (data.students) {
          setAllStudents(data.students);
        } else {
          setAllStudents(data);
        }
      } catch (error) {
        setError("An error occurred while fetching students.");
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, []); // Only fetch once on component mount

  // Frontend filtering, searching, and sorting logic
  const filteredAndSortedStudents = useMemo(() => {
    let result = [...allStudents];

    // Apply status filter
    if (filter && filter !== "") {
      result = result.filter(student => 
        student.status.toLowerCase() === filter.toLowerCase()
      );
    }

    // Apply search filter
    if (search.trim() !== "") {
      const searchTerm = search.toLowerCase();
      result = result.filter(student =>
        student.first_name.toLowerCase().includes(searchTerm) ||
        student.last_name.toLowerCase().includes(searchTerm) ||
        student.email.toLowerCase().includes(searchTerm) ||
        student.department.toLowerCase().includes(searchTerm) ||
        student.phone.includes(searchTerm)
      );
    }

    // Apply sorting
    if (sort) {
      result.sort((a, b) => {
        switch (sort) {
          case 'name_asc':
            return (a.first_name + a.last_name).localeCompare(b.first_name + b.last_name);
          case 'name_desc':
            return (b.first_name + b.last_name).localeCompare(a.first_name + a.last_name);
          case 'email_asc':
            return a.email.localeCompare(b.email);
          case 'email_desc':
            return b.email.localeCompare(a.email);
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
  }, [allStudents, filter, search, sort]);

  // Pagination logic for filtered results
  const paginatedStudents = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAndSortedStudents.slice(startIndex, endIndex);
  }, [filteredAndSortedStudents, currentPage, itemsPerPage]);

  const totalCount = filteredAndSortedStudents.length;
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const buttons = [
    { "id": 1, "name": "" },
    { "id": 2, "name": "Active" },
    { "id": 3, "name": "Inactive" },
    { "id": 4, "name": "Locked" },
    { "id": 5, "name": "Unverified" },
    { "id": 6, "name": "Pending" },
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
      'Active': 'bg-green-50 text-green-700 border-green-200',
      'Pending': 'bg-yellow-50 text-yellow-700 border-yellow-200',
      'Locked': 'bg-red-50 text-red-700 border-red-200',
      'Unverified': 'bg-orange-50 text-orange-700 border-orange-200',
      'Inactive': 'bg-gray-50 text-gray-700 border-gray-200'
    };
    
    const statusIcons = {
      'Active': (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      ),
      'Pending': (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
        </svg>
      ),
      'Locked': (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      ),
      'Unverified': (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      ),
      'Inactive': (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      )
    };
    
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${statusStyles[status as keyof typeof statusStyles] || statusStyles.Inactive}`}>
        {statusIcons[status as keyof typeof statusIcons]}
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

  if (loading) {
    return <div className="text-center text-gray-500 py-8">Loading...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500 py-8">{error}</div>;
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl mt-6 shadow-sm overflow-hidden">
      {/* Table Header */}
      <div className="px-4 sm:px-6 py-4 bg-gray-50 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-lg font-semibold text-gray-900">Student Directory</h4>
            <p className="text-sm text-gray-600 mt-1">Total: {totalCount} students</p>
          </div>
        </div>
        
        {/* Filters and Search */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mt-4">
          <div className="flex flex-wrap items-center gap-2">
            {buttons.map((btn) => (
              <button 
                key={btn.id} 
                className={`px-4 py-2 text-sm font-medium rounded-xl border transition-all duration-200 ${
                  activeId === btn.id 
                    ? 'bg-teal-100 border-teal-300 text-teal-700 shadow-sm' 
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'
                }`} 
                onClick={() => handleActive(btn.id, btn.name)}
              >
                {btn.name === "" ? 'All' : btn.name}
              </button>
            ))}
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Sort dropdown */}
            <div className="relative">
              <select 
                value={sort} 
                onChange={(e) => handleSort(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                <option value="">Sort by</option>
                <option value="name_asc">Name (A-Z)</option>
                <option value="name_desc">Name (Z-A)</option>
                <option value="email_asc">Email (A-Z)</option>
                <option value="email_desc">Email (Z-A)</option>
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
                placeholder="Search students..." 
                className="pl-10 pr-4 py-2 w-full sm:w-64 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent hover:border-gray-300 transition-colors"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Card View / Desktop Table */}
      <div className="hidden lg:block">
        <table className="w-full">
          <thead className="bg-white border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Student</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Contact</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Department</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Joined</th>
              <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {paginatedStudents.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <User className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 font-medium">No students found</p>
                    <p className="text-sm text-gray-400 mt-1">Try adjusting your search or filters</p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedStudents.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl border-2 border-gray-200 overflow-hidden bg-gray-50">
                        <img 
                          src={student.profile_picture} 
                          alt="Profile" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">
                          {student.first_name} {student.last_name}
                        </div>
                        <div className="text-xs text-gray-500">
                          ID: {student.hashed_id}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(student.status)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="text-sm text-gray-900">{student.email}</div>
                      <div className="text-xs text-gray-500">{student.phone}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {student.department}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {timeAgo(student.created_at)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-teal-600 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 hover:border-teal-300 transition-all duration-200"
                      onClick={() => setView(""+student.id)}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <span className="hidden sm:inline">View</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden divide-y divide-gray-100">
        {paginatedStudents.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <div className="flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <User className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium">No students found</p>
              <p className="text-sm text-gray-400 mt-1">Try adjusting your search or filters</p>
            </div>
          </div>
        ) : (
          paginatedStudents.map((student) => (
            <div key={student.id} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl border-2 border-gray-200 overflow-hidden bg-gray-50 flex-shrink-0">
                  <img 
                    src={student.profile_picture} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-gray-900 truncate">
                        {student.first_name} {student.last_name}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">{student.department}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2 ml-2">
                      {getStatusBadge(student.status)}
                      <button
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-teal-600 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 hover:border-teal-300 transition-all duration-200"
                        onClick={() => setView(""+student.id)}
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        View
                      </button>
                    </div>
                  </div>
                  <div className="mt-2 space-y-1">
                    <p className="text-xs text-gray-600">{student.email}</p>
                    <p className="text-xs text-gray-600">{student.phone}</p>
                    <p className="text-xs text-gray-500">Joined {timeAgo(student.created_at)}</p>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between px-4 sm:px-6 py-4 border-t border-gray-100 bg-gray-50">
          <div className="flex items-center text-sm text-gray-700 mb-3 sm:mb-0">
            <span>
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} results
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white hover:border-gray-400 transition-all duration-200 bg-white"
            >
              Previous
            </button>
            
            <div className="hidden sm:flex items-center space-x-1">
              {getPaginationRange().map((page, index) => (
                <span key={index}>
                  {page === '...' ? (
                    <span className="px-3 py-2 text-sm text-gray-500">...</span>
                  ) : (
                    <button
                      onClick={() => handlePageChange(page as number)}
                      className={`px-3 py-2 text-sm font-medium border rounded-xl transition-all duration-200 ${
                        currentPage === page
                          ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                          : 'border-gray-300 hover:bg-white hover:border-gray-400 bg-white'
                      }`}
                    >
                      {page}
                    </button>
                  )}
                </span>
              ))}
            </div>
            
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white hover:border-gray-400 transition-all duration-200 bg-white"
            >
              Next
            </button>
          </div>
        </div>
      )}
      {view && <UserOverview userId={view} onClose={() => setView(null)} />}
    </div>
  );
};

// Main Component
export default Header;

export { StudentList };