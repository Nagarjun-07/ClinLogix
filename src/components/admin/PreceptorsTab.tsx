import { Search, Filter, UserPlus, Mail, Phone, Users, MoreVertical, X, Edit2, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useToast } from '../ui/Toast';
import { emailService } from '../../services/email';

interface Preceptor {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialty: string;
  institution: string;
  studentsCount: number;
  status: string;
}

export function PreceptorsTab() {
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [preceptors, setPreceptors] = useState<Preceptor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPreceptor, setNewPreceptor] = useState({ name: '', email: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit/Delete state
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [editingPreceptor, setEditingPreceptor] = useState<Preceptor | null>(null);
  const [originalEmail, setOriginalEmail] = useState<string>('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

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
    loadPreceptors();
  }, []);

  const loadPreceptors = async () => {
    setIsLoading(true);
    try {
      const data = await api.getPreceptorsWithLoad();
      setPreceptors(data);
    } catch (error) {
      console.error('Failed to load preceptors:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPreceptor = async () => {
    if (!newPreceptor.name || !newPreceptor.email) {
      showToast('Please fill in all fields', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.addPreceptor(newPreceptor.email, newPreceptor.name);

      // Send email using EmailJS
      const emailSent = await emailService.sendInvitation(newPreceptor.email, newPreceptor.name, 'instructor');

      showToast(emailSent ? 'Preceptor invite sent successfully!' : 'Preceptor invited (Email failed)', emailSent ? 'success' : 'warning');

      setShowAddModal(false);
      setNewPreceptor({ name: '', email: '' });
      loadPreceptors(); // Refresh list
    } catch (error: any) {
      console.error('Failed to add preceptor:', error);
      showToast(error.response?.data?.message || error.response?.data?.error || 'Failed to add preceptor', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditPreceptor = (preceptor: Preceptor) => {
    setEditingPreceptor(preceptor);
    setOriginalEmail(preceptor.email); // Store original email for API call
    setShowEditModal(true);
    setOpenMenuId(null);
  };

  const handleSaveEdit = async () => {
    if (!editingPreceptor) return;

    setIsSubmitting(true);
    try {
      await api.updatePreceptor(originalEmail, {
        name: editingPreceptor.name,
        email: editingPreceptor.email
      });
      showToast('Preceptor updated successfully!', 'success');
      setShowEditModal(false);
      setEditingPreceptor(null);
      loadPreceptors();
    } catch (error: any) {
      console.error('Failed to update preceptor:', error);
      showToast(error.response?.data?.error || 'Failed to update preceptor', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePreceptor = async (preceptorId: string) => {
    setIsSubmitting(true);
    try {
      await api.deletePreceptor(preceptorId);
      showToast('Preceptor deleted successfully!', 'success');
      setShowDeleteConfirm(null);
      loadPreceptors();
    } catch (error: any) {
      console.error('Failed to delete preceptor:', error);
      showToast(error.response?.data?.error || 'Failed to delete preceptor', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredPreceptors = preceptors.filter(preceptor => {
    const matchesSearch = (preceptor.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (preceptor.specialty || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' ||
      (filterStatus === 'active' && preceptor.status === 'active') ||
      (filterStatus === 'inactive' && preceptor.status !== 'active');
    return matchesSearch && matchesFilter;
  });

  // Pagination
  const totalPages = Math.ceil(filteredPreceptors.length / itemsPerPage);
  const paginatedPreceptors = filteredPreceptors.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalStudents = preceptors.reduce((sum, p) => sum + p.studentsCount, 0);
  const avgLoad = preceptors.length ? (totalStudents / preceptors.length).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-slate-900">Preceptors Management</h2>
          <p className="text-slate-600 mt-1">Manage clinical preceptors and supervisors</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-lg hover:from-blue-700 hover:to-teal-700 transition-all shadow-md hover:shadow-lg"
        >
          <UserPlus className="w-5 h-5" />
          Add Preceptor
        </button>
      </div>

      {/* Add Preceptor Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 className="text-slate-900 font-semibold">Add New Preceptor</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={newPreceptor.name}
                  onChange={(e) => setNewPreceptor({ ...newPreceptor, name: e.target.value })}
                  placeholder="Dr. John Smith"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={newPreceptor.email}
                  onChange={(e) => setNewPreceptor({ ...newPreceptor, email: e.target.value })}
                  placeholder="john.smith@hospital.edu"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <p className="text-sm text-slate-500">
                An invitation will be sent to this email. The preceptor can then register and access their dashboard.
              </p>
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-slate-200">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddPreceptor}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-lg hover:from-blue-700 hover:to-teal-700 disabled:opacity-50"
              >
                {isSubmitting ? 'Adding...' : 'Add Preceptor'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards - Clickable */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <button
          onClick={() => setFilterStatus('all')}
          className={`bg-white rounded-xl shadow-sm border p-4 text-left transition-all hover:shadow-md ${filterStatus === 'all' ? 'border-blue-500 ring-2 ring-blue-200' : 'border-slate-200'
            }`}
        >
          <p className="text-sm text-slate-600 mb-1">Total Preceptors</p>
          <p className="text-2xl text-slate-900">{preceptors.length}</p>
          {filterStatus === 'all' && <p className="text-xs text-blue-600 mt-1">✓ Showing all</p>}
        </button>
        <button
          onClick={() => setFilterStatus('active')}
          className={`bg-white rounded-xl shadow-sm border p-4 text-left transition-all hover:shadow-md ${filterStatus === 'active' ? 'border-green-500 ring-2 ring-green-200' : 'border-slate-200'
            }`}
        >
          <p className="text-sm text-slate-600 mb-1">Active</p>
          <p className="text-2xl text-green-600">{preceptors.filter(p => p.status === 'active').length}</p>
          {filterStatus === 'active' && <p className="text-xs text-green-600 mt-1">✓ Filtered</p>}
        </button>
        <button
          onClick={() => setFilterStatus('inactive')}
          className={`bg-white rounded-xl shadow-sm border p-4 text-left transition-all hover:shadow-md ${filterStatus === 'inactive' ? 'border-amber-500 ring-2 ring-amber-200' : 'border-slate-200'
            }`}
        >
          <p className="text-sm text-slate-600 mb-1">Pending/Inactive</p>
          <p className="text-2xl text-amber-600">{preceptors.filter(p => p.status !== 'active').length}</p>
          {filterStatus === 'inactive' && <p className="text-xs text-amber-600 mt-1">✓ Filtered</p>}
        </button>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <p className="text-sm text-slate-600 mb-1">Avg Students/Preceptor</p>
          <p className="text-2xl text-slate-900">{avgLoad}</p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search preceptors..."
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-slate-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Preceptors</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Preceptors Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto min-h-[200px]">
          {isLoading ? (
            <div className="p-8 text-center text-slate-500">Loading preceptors...</div>
          ) : filteredPreceptors.length === 0 ? (
            <div className="p-8 text-center text-slate-500">No preceptors found.</div>
          ) : (
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs text-slate-600 uppercase tracking-wider">Preceptor</th>
                  <th className="px-6 py-3 text-left text-xs text-slate-600 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-left text-xs text-slate-600 uppercase tracking-wider">Specialty</th>
                  <th className="px-6 py-3 text-left text-xs text-slate-600 uppercase tracking-wider">Institution</th>
                  <th className="px-6 py-3 text-left text-xs text-slate-600 uppercase tracking-wider">Students</th>
                  <th className="px-6 py-3 text-left text-xs text-slate-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs text-slate-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {paginatedPreceptors.map((preceptor) => (
                  <tr key={preceptor.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-teal-600 to-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm">{(preceptor.name || 'U').substring(0, 2).toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="text-slate-900">{preceptor.name}</p>
                          <p className="text-sm text-slate-500">ID: {preceptor.id.substring(0, 8)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-slate-700">
                          <Mail className="w-4 h-4 text-slate-400" />
                          {preceptor.email}
                        </div>
                        {preceptor.phone && preceptor.phone !== 'N/A' && (
                          <div className="flex items-center gap-2 text-sm text-slate-700">
                            <Phone className="w-4 h-4 text-slate-400" />
                            {preceptor.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                        {preceptor.specialty}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-700">{preceptor.institution}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-slate-400" />
                        <span className={`text-sm font-medium ${preceptor.studentsCount >= 5 ? 'text-red-600' : 'text-slate-900'}`}>
                          {preceptor.studentsCount} / 5
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs ${preceptor.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-slate-100 text-slate-700'
                        }`}>
                        {preceptor.status.charAt(0).toUpperCase() + preceptor.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 relative">
                      <button
                        onClick={() => setOpenMenuId(openMenuId === preceptor.id ? null : preceptor.id)}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <MoreVertical className="w-5 h-5 text-slate-600" />
                      </button>

                      {/* Dropdown Menu */}
                      {openMenuId === preceptor.id && (
                        <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-10 min-w-[120px]">
                          <button
                            onClick={() => handleEditPreceptor(preceptor)}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                          >
                            <Edit2 className="w-4 h-4" />
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              setShowDeleteConfirm(preceptor.email);
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
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredPreceptors.length)} of {filteredPreceptors.length}
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

      {/* Edit Preceptor Modal */}
      {showEditModal && editingPreceptor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 className="text-slate-900 font-semibold">Edit Preceptor</h3>
              <button onClick={() => { setShowEditModal(false); setEditingPreceptor(null); }} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={editingPreceptor.name}
                  onChange={(e) => setEditingPreceptor({ ...editingPreceptor, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={editingPreceptor.email}
                  onChange={(e) => setEditingPreceptor({ ...editingPreceptor, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-slate-200">
              <button
                onClick={() => { setShowEditModal(false); setEditingPreceptor(null); }}
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
              <h3 className="text-lg text-center text-slate-900 font-semibold mb-2">Delete Preceptor?</h3>
              <p className="text-sm text-center text-slate-600 mb-6">
                This action cannot be undone. The preceptor will be removed from the system.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeletePreceptor(showDeleteConfirm)}
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
