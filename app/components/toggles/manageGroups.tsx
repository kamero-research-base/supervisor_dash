// app/components/toggles/manageGroups.tsx
"use client";
import React, { useState, useEffect } from "react";
import { X, Users, Plus, Edit, Trash2, User, CheckCircle, AlertCircle, Search } from "lucide-react";
import AsyncSelect from 'react-select/async';
import { MultiValue } from 'react-select';

// Interfaces
interface Assignment {
  id: number;
  title: string;
  max_group_size: number;
  allow_students_create_groups: boolean;
}

interface Group {
  id: number;
  group_name: string;
  created_by: number;
  created_at: string;
  updated_at: string;
  members: GroupMember[];
  member_count: number;
  has_submission: boolean;
}

interface GroupMember {
  student_id: number;
  first_name: string;
  last_name: string;
  email: string;
  joined_at: string;
}

interface StudentOption {
  value: number;
  label: string;
  email: string;
  firstName: string;
  lastName: string;
}

interface UserSession {
  id: string;
  [key: string]: any;
}

interface ManageGroupsProps {
  assignment: Assignment;
  groups: Group[];
  onClose: () => void;
  onSuccess: () => void;
}

// Alert Notification Component
const AlertNotification = ({ message, type }: { message: string; type: 'error' | 'success' | 'info' }) => (
  <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg border ${
    type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 
    type === 'success' ? 'bg-green-50 border-green-200 text-green-700' :
    'bg-blue-50 border-blue-200 text-blue-700'
  }`}>
    <div className="flex items-center gap-2">
      {type === 'error' ? <AlertCircle size={20} /> : 
       type === 'success' ? <CheckCircle size={20} /> :
       <Users size={20} />}
      {message}
    </div>
  </div>
);

const ManageGroups: React.FC<ManageGroupsProps> = ({ assignment, groups, onClose, onSuccess }) => {
  const [allGroups, setAllGroups] = useState<Group[]>(groups);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    group_name: '',
    members: [] as StudentOption[]
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  // Get supervisor session
  const getSupervisorId = (): string | null => {
    const userSessionData = localStorage.getItem("supervisorSession");
    if (!userSessionData) return null;
    const userSession: UserSession = JSON.parse(userSessionData);
    return userSession.id;
  };

  // Load available students for group assignment
  const loadStudentOptions = async (inputValue: string): Promise<StudentOption[]> => {
    try {
      const supervisorId = getSupervisorId();
      if (!supervisorId) return [];

      const response = await fetch(`/api/students/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: inputValue, 
          supervisor_id: parseInt(supervisorId),
          assignment_id: assignment.id // Only students invited to this assignment
        })
      });

      if (!response.ok) return [];

      const data = await response.json();
      if (data.success && data.data) {
        return data.data.map((student: any) => ({
          value: student.id,
          label: `${student.first_name} ${student.last_name}`,
          email: student.email,
          firstName: student.first_name,
          lastName: student.last_name
        }));
      }
      return [];
    } catch (error) {
      console.error('Error loading students:', error);
      return [];
    }
  };

  const resetForm = () => {
    setFormData({
      group_name: '',
      members: []
    });
    setValidationErrors({});
    setEditingGroup(null);
    setShowCreateForm(false);
  };

  const handleCreate = () => {
    resetForm();
    setShowCreateForm(true);
  };

  const handleEdit = (group: Group) => {
    setFormData({
      group_name: group.group_name,
      members: group.members.map(member => ({
        value: member.student_id,
        label: `${member.first_name} ${member.last_name}`,
        email: member.email,
        firstName: member.first_name,
        lastName: member.last_name
      }))
    });
    setEditingGroup(group);
    setShowCreateForm(true);
  };

  const handleDelete = async (group: Group) => {
    if (group.has_submission) {
      setError("Cannot delete group that has submitted assignment");
      return;
    }

    if (!confirm(`Are you sure you want to delete group "${group.group_name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setLoading(true);
      const supervisorId = getSupervisorId();
      if (!supervisorId) throw new Error("No supervisor session found");

      const response = await fetch(`/api/groups/${group.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();
      
      if (data.success) {
        setAllGroups(prev => prev.filter(g => g.id !== group.id));
        setSuccess(`Group "${group.group_name}" deleted successfully`);
        onSuccess();
      } else {
        setError(data.message || 'Failed to delete group');
      }
    } catch (error) {
      console.error('Error deleting group:', error);
      setError('Failed to delete group');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const supervisorId = getSupervisorId();
    if (!supervisorId) {
      setError("No supervisor session found");
      return;
    }

    // Validation
    const newValidationErrors: Record<string, string> = {};
    if (!formData.group_name.trim()) {
      newValidationErrors.group_name = "Group name is required";
    }
    if (formData.members.length < 2) {
      newValidationErrors.members = "At least 2 members are required";
    }
    if (formData.members.length > assignment.max_group_size) {
      newValidationErrors.members = `Maximum ${assignment.max_group_size} members allowed`;
    }

    if (Object.keys(newValidationErrors).length > 0) {
      setValidationErrors(newValidationErrors);
      return;
    }

    try {
      setLoading(true);
      setValidationErrors({});

      const url = editingGroup ? `/api/groups/${editingGroup.id}` : '/api/groups';
      const method = editingGroup ? 'PUT' : 'POST';

      const requestData = {
        assignment_id: assignment.id.toString(),
        group_name: formData.group_name.trim(),
        members: formData.members.map(m => m.value.toString()),
        [editingGroup ? 'updated_by' : 'created_by']: supervisorId
      };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });

      const data = await response.json();
      
      if (data.success) {
        const updatedGroup = data.data.group;
        
        if (editingGroup) {
          setAllGroups(prev => prev.map(g => g.id === editingGroup.id ? updatedGroup : g));
          setSuccess(`Group "${formData.group_name}" updated successfully`);
        } else {
          setAllGroups(prev => [...prev, updatedGroup]);
          setSuccess(`Group "${formData.group_name}" created successfully`);
        }
        
        resetForm();
        onSuccess();
      } else {
        if (data.errors && typeof data.errors === 'object') {
          setValidationErrors(data.errors);
        } else {
          setError(data.message || 'Failed to save group');
        }
      }
    } catch (error) {
      console.error('Error saving group:', error);
      setError('Failed to save group');
    } finally {
      setLoading(false);
    }
  };

  const filteredGroups = allGroups.filter(group =>
    group.group_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <style jsx>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scale-in { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.4s ease-out; }
        .animate-scale-in { animation: scale-in 0.3s ease-out; }
        .gradient-border { background: linear-gradient(135deg, #059669 0%, #0891b2 50%, #6366f1 100%); padding: 2px; border-radius: 1rem; }
        .glass-effect { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.18); }
      `}</style>

      {error && <AlertNotification message={error} type="error" />}
      {success && <AlertNotification message={success} type="success" />}
      
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 flex items-center justify-center p-4 animate-fade-in">
        <div className="gradient-border w-full max-w-4xl max-h-[90vh] animate-scale-in">
          <div className="glass-effect rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="relative bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 p-6 text-white">
              <button 
                onClick={onClose} 
                className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-all duration-300 hover:scale-110" 
                type="button"
              >
                <X size={20} />
              </button>
              <div className="pr-16">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-white/20 rounded-full">
                    <Users size={28} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Manage Groups</h2>
                    <p className="text-white/80 text-sm">{assignment.title}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="bg-white/10 rounded-lg p-2 text-center">
                      <p className="text-xl font-bold">{allGroups.length}</p>
                      <p className="text-xs text-white/80">Groups</p>
                    </div>
                    <div className="bg-white/10 rounded-lg p-2 text-center">
                      <p className="text-xl font-bold">{assignment.max_group_size}</p>
                      <p className="text-xs text-white/80">Max Size</p>
                    </div>
                  </div>
                  <button
                    onClick={handleCreate}
                    className="bg-white text-teal-600 px-4 py-2 rounded-lg font-semibold hover:bg-white/90 transition-colors flex items-center gap-2"
                  >
                    <Plus size={16} />
                    Create Group
                  </button>
                </div>
              </div>
            </div>
            
            {/* Content */}
            <div className="p-6 max-h-[calc(90vh-200px)] overflow-y-auto">
              {showCreateForm ? (
                <div className="animate-fade-in">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {editingGroup ? 'Edit Group' : 'Create New Group'}
                    </h3>
                    <button
                      onClick={resetForm}
                      className="text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <label htmlFor="group_name" className="block text-sm font-medium text-gray-700 mb-2">
                        Group Name *
                      </label>
                      <input
                        type="text"
                        id="group_name"
                        value={formData.group_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, group_name: e.target.value }))}
                        className={`w-full px-3 py-2 border-2 rounded-lg focus:outline-none transition-all duration-200 ${
                          validationErrors.group_name ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-teal-500'
                        }`}
                        placeholder="Enter group name"
                      />
                      {validationErrors.group_name && (
                        <p className="mt-1 text-sm text-red-600">{validationErrors.group_name}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Group Members * (2-{assignment.max_group_size} students)
                      </label>
                      <AsyncSelect
                        isMulti
                        cacheOptions
                        loadOptions={loadStudentOptions}
                        value={formData.members}
                        onChange={(newValue: MultiValue<StudentOption>) => {
                          setFormData(prev => ({ ...prev, members: [...(newValue || [])] }));
                        }}
                        placeholder="Search and select students..."
                        noOptionsMessage={({ inputValue }) => 
                          inputValue ? `No students found matching "${inputValue}"` : "Type to search students"
                        }
                        className={validationErrors.members ? 'border-red-300' : ''}
                        styles={{
                          control: (provided: any, state: any) => ({
                            ...provided,
                            borderColor: validationErrors.members ? '#f87171' : state.isFocused ? '#14b8a6' : '#d1d5db',
                            borderWidth: '2px',
                            borderRadius: '0.5rem',
                            '&:hover': {
                              borderColor: validationErrors.members ? '#f87171' : '#14b8a6',
                            }
                          }),
                          multiValue: (provided: any) => ({ ...provided, backgroundColor: '#14b8a6' }),
                          multiValueLabel: (provided: any) => ({ ...provided, color: 'white' }),
                        }}
                      />
                      {validationErrors.members && (
                        <p className="mt-1 text-sm text-red-600">{validationErrors.members}</p>
                      )}
                      {formData.members.length > 0 && (
                        <p className="mt-2 text-sm text-gray-600">
                          {formData.members.length} of {assignment.max_group_size} members selected
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-end gap-4">
                      <button
                        type="button"
                        onClick={resetForm}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="bg-teal-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {loading ? 'Saving...' : (editingGroup ? 'Update Group' : 'Create Group')}
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="animate-fade-in">
                  {/* Search */}
                  <div className="mb-6">
                    <div className="relative">
                      <Search size={20} className="absolute left-3 top-3 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search groups..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-teal-500 transition-all duration-200"
                      />
                    </div>
                  </div>

                  {/* Groups List */}
                  {filteredGroups.length > 0 ? (
                    <div className="space-y-4">
                      {filteredGroups.map((group) => (
                        <div key={group.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-teal-100 rounded-full">
                                <Users size={20} className="text-teal-600" />
                              </div>
                              <div>
                                <h4 className="text-lg font-semibold text-gray-900">{group.group_name}</h4>
                                <p className="text-sm text-gray-500">{group.member_count} members</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {group.has_submission && (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-green-300">
                                  <CheckCircle size={14} className="mr-1" />
                                  Submitted
                                </span>
                              )}
                              <button
                                onClick={() => handleEdit(group)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Edit Group"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                onClick={() => handleDelete(group)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete Group"
                                disabled={group.has_submission}
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                          
                          <div className="border-t border-gray-200 pt-4">
                            <h5 className="text-sm font-semibold text-gray-900 mb-3">Members</h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {group.members.map((member, index) => (
                                <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                                  <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
                                    <User size={14} className="text-teal-600" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                      {member.first_name} {member.last_name}
                                    </p>
                                    <p className="text-xs text-gray-500 truncate">{member.email}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Users size={48} className="text-gray-300 mx-auto mb-3" />
                      <h3 className="text-lg font-medium text-gray-900 mb-1">
                        {searchTerm ? 'No groups found' : 'No groups yet'}
                      </h3>
                      <p className="text-gray-500">
                        {searchTerm ? 
                          `No groups match "${searchTerm}"` : 
                          'Create your first group to get started'
                        }
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ManageGroups;