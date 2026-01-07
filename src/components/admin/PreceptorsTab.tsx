import { Search, Filter, UserPlus, Mail, Phone, Users, MoreVertical } from 'lucide-react';
import { useState, useEffect } from 'react';
import { api } from '../../services/api';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [preceptors, setPreceptors] = useState<Preceptor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  const filteredPreceptors = preceptors.filter(preceptor => {
    const matchesSearch = (preceptor.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (preceptor.specialty || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || preceptor.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const totalStudents = preceptors.reduce((sum, p) => sum + p.studentsCount, 0);
  const activeCount = preceptors.length; // Assuming all returned are active for now
  const avgLoad = preceptors.length ? (totalStudents / preceptors.length).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-slate-900">Preceptors Management</h2>
          <p className="text-slate-600 mt-1">Manage clinical preceptors and supervisors</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-lg hover:from-blue-700 hover:to-teal-700 transition-all shadow-md hover:shadow-lg">
          <UserPlus className="w-5 h-5" />
          Add Preceptor
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <p className="text-sm text-slate-600 mb-1">Total Preceptors</p>
          <p className="text-2xl text-slate-900">{preceptors.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <p className="text-sm text-slate-600 mb-1">Active</p>
          <p className="text-2xl text-green-600">{activeCount}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <p className="text-sm text-slate-600 mb-1">Total Assigned Students</p>
          <p className="text-2xl text-slate-900">{totalStudents}</p>
        </div>
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
                {filteredPreceptors.map((preceptor) => (
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
    </div>
  );
}
