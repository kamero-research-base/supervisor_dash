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

  return (
    <div className="space-y-4">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-medium text-gray-700">Students</h1>
        <div className="flex items-center gap-2">
          <button 
            className="flex items-center justify-center w-9 h-9 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            title="Download Student summary"
          >
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
          </button>
          <button 
            onClick={onAddStudentClick}
            className="flex items-center gap-2 px-3 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Student
          </button>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-5 gap-3">
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between p-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-orange-100 border border-orange-200 rounded flex items-center justify-center">
                <svg className="w-3 h-3 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-700">Total Students</span>
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
            <div className="text-2xl font-semibold text-gray-800">{analytics?.total_students}</div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between p-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-teal-100 border border-teal-200 rounded flex items-center justify-center">
                <svg className="w-3 h-3 text-teal-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-700">Active</span>
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
            <div className="text-2xl font-semibold text-gray-800">{analytics?.total_active}</div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between p-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-red-100 border border-red-200 rounded flex items-center justify-center">
                <svg className="w-3 h-3 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-700">Unverified</span>
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
            <div className="text-2xl font-semibold text-gray-800">{analytics?.total_unverified}</div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between p-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gray-100 border border-gray-200 rounded flex items-center justify-center">
                <svg className="w-3 h-3 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-700">Inactive</span>
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
            <div className="text-2xl font-semibold text-gray-800">{analytics?.total_inactive}</div>
          </div>
        </div>

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
            <div className="text-2xl font-semibold text-gray-800">{analytics?.total_pending}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StudentList = () => {
  const [activeId, setActiveId] = useState(1);
  const [dropdownOpen, setDropdownOpen] = useState<number | null>(null);
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
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${statusStyles[status as keyof typeof statusStyles] || statusStyles.Inactive}`}>
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
    <div className="bg-white border border-gray-200 rounded-lg mt-4">
      {/* Table Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <h4 className="text-base font-medium text-gray-800">Student List</h4>
        
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
                className="pl-10 pr-4 py-2 w-64 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profile</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedStudents.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                  No students found
                </td>
              </tr>
            ) : (
              paginatedStudents.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="w-8 h-8 rounded-full border border-gray-200 overflow-hidden">
                      <img 
                        src={student.profile_picture} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {getStatusBadge(student.status)}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {student.first_name} {student.last_name}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {student.email}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {student.department}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {student.phone}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {timeAgo(student.created_at)}
                  </td>
                  <td className="px-4 py-3 text-center relative">
                    <button
                      className="inline-flex items-center justify-center w-8 h-8 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                      onClick={() => toggleDropdown(student.id)}
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path d="M10 4a2 2 0 100-4 2 2 0 000 4z" />
                        <path d="M10 20a2 2 0 100-4 2 2 0 000 4z" />
                      </svg>
                    </button>
                    
                    {dropdownOpen === student.id && (
                      <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                        <div className="py-1">
                          <button className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors" onClick={() => setView(""+student.id)}>
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
      {view && <UserOverview userId={view} onClose={() => setView(null)} />}
    </div>
  );
};

// Main Component
export default Header;

export { StudentList };