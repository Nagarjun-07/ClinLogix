import { useState, useEffect } from 'react';
import { Search, UserPlus, Mail, User, MoreVertical, Edit2, Trash2, X } from 'lucide-react';
import { AddUserModal } from './AddUserModal';
import { api } from '../../services/api';
import { useToast } from '../ui/Toast';
import { emailService } from '../../services/email';

interface AuthorizedUser {
  email: string;
  full_name: string;
  role: 'student' | 'instructor';
  status: 'pending' | 'registered';
  created_at: string;
  institution_id: string;
}

export function UserManagementTab({ institutionId }: { institutionId?: string }) {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'students' | 'preceptors'>('students');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [students, setStudents] = useState<AuthorizedUser[]>([]);
  const [preceptors, setPreceptors] = useState<AuthorizedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Edit/Delete state
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<AuthorizedUser | null>(null);
  const [originalEmail, setOriginalEmail] = useState<string>('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    if (openMenuId) {
      setTimeout(() => document.addEventListener('click', handleClickOutside), 0);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openMenuId]);

  useEffect(() => {
    loadUsers();
  }, [institutionId]);

  // Reset page when changing tabs
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const [studentsData, instructorsData] = await Promise.all([
        api.getAuthorizedUsers('student', institutionId),
        api.getAuthorizedUsers('instructor', institutionId)
      ]);
      setStudents(studentsData || []);
      setPreceptors(instructorsData || []);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const currentData = activeTab === 'students' ? students : preceptors;
  const filteredData = currentData.filter(user =>
    (user.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleAddUser = async (userData: { name: string; email: string }) => {
    try {
      const role = activeTab === 'students' ? 'student' : 'instructor';
      await api.inviteUser(userData.email, userData.name, role, institutionId);

      // Send email using EmailJS
      const emailSent = await emailService.sendInvitation(userData.email, userData.name, role);

      await loadUsers();
      setShowAddModal(false);

      if (emailSent) {
        showToast(`${activeTab === 'students' ? 'Student' : 'Preceptor'} invited and email sent!`, 'success');
      } else {
        showToast(`${activeTab === 'students' ? 'Student' : 'Preceptor'} invited (Email sending failed)`, 'warning');
      }
    } catch (error: any) {
      console.error('Failed to invite user:', error);
      showToast('Failed to invite user: ' + error.message, 'error');
    }
  };

  const handleEditUser = (user: AuthorizedUser) => {
    setEditingUser(user);
    setOriginalEmail(user.email);
    setShowEditModal(true);
    setOpenMenuId(null);
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;

    setIsSubmitting(true);
    try {
      await api.updateStudent(originalEmail, {
        name: editingUser.full_name,
        email: editingUser.email
      });
      showToast('User updated successfully!', 'success');
      setShowEditModal(false);
      setEditingUser(null);
      loadUsers();
    } catch (error: any) {
      console.error('Failed to update user:', error);
      showToast(error.response?.data?.error || 'Failed to update user', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (email: string) => {
    setIsSubmitting(true);
    try {
      await api.deleteStudent(email);
      showToast('User deleted successfully!', 'success');
      setShowDeleteConfirm(null);
      loadUsers();
    } catch (error: any) {
      console.error('Failed to delete user:', error);
      showToast(error.response?.data?.error || 'Failed to delete user', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-slate-900">User Management</h2>
          <p className="text-slate-600 mt-1">Manage students and preceptors accounts</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-lg hover:from-blue-700 hover:to-teal-700 transition-all shadow-md hover:shadow-lg"
        >
          <UserPlus className="w-5 h-5" />
          Add {activeTab === 'students' ? 'Student' : 'Preceptor'}
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="border-b border-slate-200">
          <div className="flex gap-1 p-2">
            <button
              onClick={() => setActiveTab('students')}
              className={`flex-1 px-6 py-3 rounded-lg transition-all ${activeTab === 'students'
                ? 'bg-gradient-to-r from-blue-600 to-teal-600 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-50'
                }`}
            >
              students ({students.length})
            </button>
            <button
              onClick={() => setActiveTab('preceptors')}
              className={`flex-1 px-6 py-3 rounded-lg transition-all ${activeTab === 'preceptors'
                ? 'bg-gradient-to-r from-blue-600 to-teal-600 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-50'
                }`}
            >
              Preceptors ({preceptors.length})
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-slate-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${activeTab}...`}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto min-h-[300px]">
          {isLoading ? (
            <div className="flex items-center justify-center h-48 text-slate-400">Loading users...</div>
          ) : paginatedData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-slate-400">No users found.</div>
          ) : (
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs text-slate-600 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs text-slate-600 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs text-slate-600 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs text-slate-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs text-slate-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {paginatedData.map((user) => (
                  <tr key={user.email} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-teal-600 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-slate-900 font-medium">{user.full_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-slate-700">
                        <Mail className="w-4 h-4 text-slate-400" />
                        {user.email}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-700 capitalize">{user.role}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs ${user.status === 'registered'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                        }`}>
                        {user.status ? (user.status.charAt(0).toUpperCase() + user.status.slice(1)) : 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 relative">
                      <button
                        onClick={() => setOpenMenuId(openMenuId === user.email ? null : user.email)}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <MoreVertical className="w-5 h-5 text-slate-600" />
                      </button>

                      {/* Dropdown Menu */}
                      {openMenuId === user.email && (
                        <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-10 min-w-[120px]">
                          <button
                            onClick={() => handleEditUser(user)}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                          >
                            <Edit2 className="w-4 h-4" />
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              setShowDeleteConfirm(user.email);
                              setOpenMenuId(null);
                            }}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200">
            <div className="text-sm text-slate-600">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-slate-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1 rounded text-sm ${currentPage === page ? 'bg-blue-600 text-white' : 'border border-slate-300 hover:bg-slate-50'}`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-slate-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <AddUserModal
          userType={activeTab === 'students' ? 'Student' : 'Preceptor'}
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddUser}
        />
      )}

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 className="text-slate-900 font-semibold">Edit User</h3>
              <button onClick={() => { setShowEditModal(false); setEditingUser(null); }} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={editingUser.full_name}
                  onChange={(e) => setEditingUser({ ...editingUser, full_name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-slate-200">
              <button
                onClick={() => { setShowEditModal(false); setEditingUser(null); }}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-lg hover:from-blue-700 hover:to-teal-700 disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg text-center text-slate-900 font-semibold mb-2">Delete User?</h3>
              <p className="text-sm text-center text-slate-600 mb-6">
                This action cannot be undone. The user will be removed from the system.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteUser(showDeleteConfirm)}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
