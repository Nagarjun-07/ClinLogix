import { useState, useEffect } from 'react';
import { Search, UserPlus, Mail, User, MoreVertical } from 'lucide-react';
import { AddUserModal } from './AddUserModal';
import { api } from '../../services/api';

interface AuthorizedUser {
  email: string;
  full_name: string;
  role: 'student' | 'instructor';
  status: 'pending' | 'registered';
  created_at: string;
  institution_id: string; // Add other fields as needed from DB
}

export function UserManagementTab({ institutionId }: { institutionId?: string }) {
  const [activeTab, setActiveTab] = useState<'students' | 'preceptors'>('students');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Real data state
  const [students, setStudents] = useState<AuthorizedUser[]>([]);
  const [preceptors, setPreceptors] = useState<AuthorizedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch data on load and when tab/institution changes
  useEffect(() => {
    loadUsers();
  }, [institutionId]);

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

  const handleAddUser = async (userData: { name: string; email: string }) => {
    try {
      const role = activeTab === 'students' ? 'student' : 'instructor';
      await api.inviteUser(userData.email, userData.name, role, institutionId);

      // Refresh data instead of manual append to ensure consistency
      await loadUsers();

      setShowAddModal(false);
      alert(`${activeTab === 'students' ? 'Student' : 'Preceptor'} invited successfully! They can now register with this email.`);
    } catch (error: any) {
      console.error('Failed to invite user:', error);
      alert('Failed to invite user: ' + error.message);
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
          ) : filteredData.length === 0 ? (
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
                {filteredData.map((user) => (
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
                    <td className="px-6 py-4">
                      <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                        <MoreVertical className="w-5 h-5 text-slate-600" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showAddModal && (
        <AddUserModal
          userType={activeTab === 'students' ? 'Student' : 'Preceptor'}
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddUser}
        />
      )}
    </div>
  );
}
