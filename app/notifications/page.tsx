"use client";

import { useEffect, useState } from "react";

interface NotificationAnalytics {
  total_notifications: number;
  unread_count: number;
  critical_count: number;
  warning_count: number;
  info_count: number;
  success_count: number;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'critical' | 'warning' | 'info' | 'success' | 'system';
  category: string;
  read: boolean;
  created_at: string;
  action_url?: string;
  sender?: {
    name: string;
    avatar?: string;
    role?: string;
  };
}

interface PaginationData {
  notifications: Notification[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

const NotificationsHeader = () => {
  const [analytics, setAnalytics] = useState<NotificationAnalytics | null>(null);
  
  useEffect(() => {
    // Simulated data fetch
    setAnalytics({
      total_notifications: 342,
      unread_count: 28,
      critical_count: 3,
      warning_count: 12,
      info_count: 45,
      success_count: 15
    });
  }, []);

  const handleMarkAllRead = () => {
    console.log("Marking all as read");
  };

  const handleClearAll = () => {
    console.log("Clearing all notifications");
  };

  return (
    <div className="space-y-4">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-medium text-gray-700">Notifications</h1>
          <p className="text-sm text-gray-500 mt-1">Stay updated with system alerts and important messages</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleMarkAllRead}
            className="flex items-center gap-2 px-3 py-2 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            Mark all as read
          </button>
          <button 
            onClick={handleClearAll}
            className="flex items-center gap-2 px-3 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Clear All
          </button>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-6 gap-3">
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between p-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-100 border border-blue-200 rounded flex items-center justify-center">
                <svg className="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-700">Total</span>
            </div>
          </div>
          <div className="p-3">
            <div className="text-2xl font-semibold text-gray-800">{analytics?.total_notifications}</div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between p-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-orange-100 border border-orange-200 rounded flex items-center justify-center">
                <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
              </div>
              <span className="text-sm font-medium text-gray-700">Unread</span>
            </div>
          </div>
          <div className="p-3">
            <div className="text-2xl font-semibold text-gray-800">{analytics?.unread_count}</div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between p-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-red-100 border border-red-200 rounded flex items-center justify-center">
                <svg className="w-3 h-3 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-700">Critical</span>
            </div>
          </div>
          <div className="p-3">
            <div className="text-2xl font-semibold text-gray-800">{analytics?.critical_count}</div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between p-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-yellow-100 border border-yellow-200 rounded flex items-center justify-center">
                <svg className="w-3 h-3 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 10-2 0 1 1 0 002 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-700">Warning</span>
            </div>
          </div>
          <div className="p-3">
            <div className="text-2xl font-semibold text-gray-800">{analytics?.warning_count}</div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between p-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-100 border border-blue-200 rounded flex items-center justify-center">
                <svg className="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-700">Info</span>
            </div>
          </div>
          <div className="p-3">
            <div className="text-2xl font-semibold text-gray-800">{analytics?.info_count}</div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between p-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-green-100 border border-green-200 rounded flex items-center justify-center">
                <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-700">Success</span>
            </div>
          </div>
          <div className="p-3">
            <div className="text-2xl font-semibold text-gray-800">{analytics?.success_count}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const NotificationsList = () => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(3);
  const [totalCount, setTotalCount] = useState(28);
  const [itemsPerPage] = useState(10);
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);

  // Mock data
  useEffect(() => {
    const mockNotifications: Notification[] = [
      {
        id: '1',
        title: 'System Maintenance Scheduled',
        message: 'The system will undergo maintenance on Friday, August 10, 2025 from 2:00 AM to 4:00 AM EST.',
        type: 'critical',
        category: 'System',
        read: false,
        created_at: '2025-08-08T10:30:00Z',
        sender: { name: 'System Admin', role: 'Administrator' }
      },
      {
        id: '2',
        title: 'New Supervisor Registration',
        message: 'John Doe has registered as a new supervisor and is pending approval.',
        type: 'info',
        category: 'Users',
        read: false,
        created_at: '2025-08-08T09:15:00Z',
        action_url: '/supervisors/pending',
        sender: { name: 'Registration System', role: 'System' }
      },
      {
        id: '3',
        title: 'Database Backup Completed',
        message: 'Daily database backup has been completed successfully.',
        type: 'success',
        category: 'Database',
        read: true,
        created_at: '2025-08-08T03:00:00Z',
        sender: { name: 'Backup Service', role: 'System' }
      },
      {
        id: '4',
        title: 'High Memory Usage Detected',
        message: 'Server memory usage has exceeded 85%. Consider scaling resources.',
        type: 'warning',
        category: 'Performance',
        read: false,
        created_at: '2025-08-07T22:45:00Z',
        sender: { name: 'Monitoring Service', role: 'System' }
      },
      {
        id: '5',
        title: 'Security Alert: Multiple Failed Login Attempts',
        message: 'Multiple failed login attempts detected from IP 192.168.1.100. Account temporarily locked.',
        type: 'critical',
        category: 'Security',
        read: false,
        created_at: '2025-08-07T18:20:00Z',
        sender: { name: 'Security System', role: 'System' }
      },
      {
        id: '6',
        title: 'Monthly Report Generated',
        message: 'The monthly supervisor activity report for July 2025 is now available.',
        type: 'info',
        category: 'Reports',
        read: true,
        created_at: '2025-08-01T00:00:00Z',
        action_url: '/reports/july-2025',
        sender: { name: 'Reporting Service', role: 'System' }
      },
      {
        id: '7',
        title: 'API Rate Limit Warning',
        message: 'API usage is approaching the monthly limit. 90% of quota consumed.',
        type: 'warning',
        category: 'API',
        read: false,
        created_at: '2025-08-07T14:30:00Z',
        sender: { name: 'API Gateway', role: 'System' }
      },
      {
        id: '8',
        title: 'Email Service Configuration Updated',
        message: 'Email service configuration has been successfully updated.',
        type: 'success',
        category: 'Configuration',
        read: true,
        created_at: '2025-08-06T11:00:00Z',
        sender: { name: 'Configuration Manager', role: 'System' }
      }
    ];

    // Filter based on activeFilter
    let filtered = [...mockNotifications];
    if (activeFilter === 'unread') {
      filtered = filtered.filter(n => !n.read);
    } else if (activeFilter !== 'all') {
      filtered = filtered.filter(n => n.type === activeFilter);
    }

    // Search filter
    if (search) {
      filtered = filtered.filter(n => 
        n.title.toLowerCase().includes(search.toLowerCase()) ||
        n.message.toLowerCase().includes(search.toLowerCase())
      );
    }

    setNotifications(filtered);
    setTotalCount(filtered.length);
    setTotalPages(Math.ceil(filtered.length / itemsPerPage));
  }, [activeFilter, search, itemsPerPage]);

  const filters = [
    { id: 'all', name: 'All', count: 28 },
    { id: 'unread', name: 'Unread', count: 12 },
    { id: 'critical', name: 'Critical', count: 3 },
    { id: 'warning', name: 'Warning', count: 5 },
    { id: 'info', name: 'Info', count: 8 },
    { id: 'success', name: 'Success', count: 4 },
    { id: 'system', name: 'System', count: 8 }
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

  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'critical':
        return (
          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'warning':
        return (
          <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 10-2 0 1 1 0 002 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'info':
        return (
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'success':
        return (
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
            </svg>
          </div>
        );
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedNotifications(notifications.map(n => n.id));
    } else {
      setSelectedNotifications([]);
    }
  };

  const handleSelectNotification = (id: string) => {
    if (selectedNotifications.includes(id)) {
      setSelectedNotifications(selectedNotifications.filter(nId => nId !== id));
    } else {
      setSelectedNotifications([...selectedNotifications, id]);
    }
  };

  const handleMarkAsRead = (id: string) => {
    console.log('Marking as read:', id);
  };

  const handleDelete = (id: string) => {
    console.log('Deleting:', id);
  };

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

  return (
    <div className="bg-white border border-gray-200 rounded-lg mt-4">
      {/* Table Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <h4 className="text-base font-medium text-gray-800">All Notifications</h4>
        
        {/* Filters and Search */}
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-1">
            {filters.map((filter) => (
              <button 
                key={filter.id} 
                className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                  activeFilter === filter.id 
                    ? 'bg-gray-100 border-gray-300 text-gray-700' 
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`} 
                onClick={() => setActiveFilter(filter.id)}
              >
                {filter.name}
                {filter.count > 0 && (
                  <span className="ml-1 text-gray-500">({filter.count})</span>
                )}
              </button>
            ))}
          </div>
          
          <div className="flex items-center gap-2">
            <button className="flex items-center justify-center w-8 h-8 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
              </svg>
            </button>
            
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
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search notifications..." 
                className="pl-10 pr-4 py-2 w-64 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="divide-y divide-gray-200">
        {selectedNotifications.length > 0 && (
          <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <span className="text-sm text-gray-600">{selectedNotifications.length} selected</span>
            <div className="flex items-center gap-2">
              <button className="text-sm text-teal-600 hover:text-teal-700">Mark as read</button>
              <button className="text-sm text-red-600 hover:text-red-700">Delete</button>
            </div>
          </div>
        )}
        
        {notifications.length === 0 ? (
          <div className="px-4 py-12 text-center text-gray-500">
            <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            No notifications found
          </div>
        ) : (
          notifications.map((notification) => (
            <div 
              key={notification.id} 
              className={`px-4 py-3 hover:bg-gray-50 transition-colors ${!notification.read ? 'bg-blue-50/30' : ''}`}
            >
              <div className="flex items-start gap-3">
                <input 
                  type="checkbox" 
                  checked={selectedNotifications.includes(notification.id)}
                  onChange={() => handleSelectNotification(notification.id)}
                  className="mt-1 w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                />
                
                {getTypeIcon(notification.type)}
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h5 className={`text-sm font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                          {notification.title}
                        </h5>
                        {!notification.read && (
                          <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-xs text-gray-500">{timeAgo(notification.created_at)}</span>
                        {notification.sender && (
                          <span className="text-xs text-gray-500">
                            From: {notification.sender.name}
                          </span>
                        )}
                        <span className="text-xs text-gray-500">
                          Category: {notification.category}
                        </span>
                        {notification.action_url && (
                          <a href={notification.action_url} className="text-xs text-teal-600 hover:text-teal-700">
                            View Details →
                          </a>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 ml-4">
                      <button 
                        onClick={() => handleMarkAsRead(notification.id)}
                        className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                        title="Mark as read"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                      <button 
                        onClick={() => handleDelete(notification.id)}
                        className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Delete"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
          <div className="flex items-center text-sm text-gray-700">
            <span>
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} notifications
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
  );
};

// Quick Actions Section
const QuickActions = () => {
  return (
    <div className="grid grid-cols-3 gap-4 mt-6">
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Notification Preferences</h3>
        <div className="space-y-2">
          <label className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Email notifications</span>
            <input type="checkbox" defaultChecked className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500" />
          </label>
          <label className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Push notifications</span>
            <input type="checkbox" defaultChecked className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500" />
          </label>
          <label className="flex items-center justify-between">
            <span className="text-sm text-gray-600">SMS alerts</span>
            <input type="checkbox" className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500" />
          </label>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Alert Categories</h3>
        <div className="space-y-2">
          <label className="flex items-center justify-between">
            <span className="text-sm text-gray-600">System alerts</span>
            <input type="checkbox" defaultChecked className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500" />
          </label>
          <label className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Security alerts</span>
            <input type="checkbox" defaultChecked className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500" />
          </label>
          <label className="flex items-center justify-between">
            <span className="text-sm text-gray-600">User activities</span>
            <input type="checkbox" defaultChecked className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500" />
          </label>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Digest Settings</h3>
        <div className="space-y-2">
          <select className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500">
            <option>Real-time</option>
            <option>Hourly digest</option>
            <option>Daily digest</option>
            <option>Weekly digest</option>
          </select>
          <button className="w-full px-3 py-2 bg-teal-600 text-white text-sm font-medium rounded-md hover:bg-teal-700 transition-colors">
            Update Settings
          </button>
        </div>
      </div>
    </div>
  );
};

// Main Page Component
export default function NotificationsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <NotificationsHeader />
        <NotificationsList />
        <QuickActions />
      </div>
    </div>
  );
}