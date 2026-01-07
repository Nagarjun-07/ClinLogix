import { Search, Filter, UserPlus, Mail, Phone, MoreVertical } from 'lucide-react';
import { useState } from 'react';

interface Student {
  id: string;
  name: string;
  email: string;
  phone: string;
  program: string;
  preceptor: string;
  entriesCount: number;
  totalHours: number;
  status: 'active' | 'inactive' | 'completed';
}

const mockStudents: Student[] = [
  { id: '1', name: 'Sarah Johnson', email: 'sarah.j@medical.edu', phone: '(555) 123-4567', program: 'Medical School', preceptor: 'Dr. Michael Chen', entriesCount: 24, totalHours: 192, status: 'active' },
  { id: '2', name: 'James Mitchell', email: 'james.m@medical.edu', phone: '(555) 234-5678', program: 'Nursing', preceptor: 'Dr. Amanda Rodriguez', entriesCount: 18, totalHours: 144, status: 'active' },
  { id: '3', name: 'Emily Chen', email: 'emily.c@medical.edu', phone: '(555) 345-6789', program: 'Medical School', preceptor: 'Dr. Robert Thompson', entriesCount: 31, totalHours: 248, status: 'active' },
  { id: '4', name: 'Michael Brown', email: 'michael.b@medical.edu', phone: '(555) 456-7890', program: 'Physician Assistant', preceptor: 'Dr. Lisa Park', entriesCount: 15, totalHours: 120, status: 'active' },
  { id: '5', name: 'Jessica Davis', email: 'jessica.d@medical.edu', phone: '(555) 567-8901', program: 'Medical School', preceptor: 'Dr. Michael Chen', entriesCount: 28, totalHours: 224, status: 'completed' },
];

export function StudentsTab() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'completed'>('all');

  const filteredStudents = mockStudents.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         student.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || student.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-slate-900">Students Management</h2>
          <p className="text-slate-600 mt-1">Manage and monitor all student accounts</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-lg hover:from-blue-700 hover:to-teal-700 transition-all shadow-md hover:shadow-lg">
          <UserPlus className="w-5 h-5" />
          Add Student
        </button>
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
              placeholder="Search students..."
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
              <option value="all">All Students</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs text-slate-600 uppercase tracking-wider">Student</th>
                <th className="px-6 py-3 text-left text-xs text-slate-600 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-left text-xs text-slate-600 uppercase tracking-wider">Program</th>
                <th className="px-6 py-3 text-left text-xs text-slate-600 uppercase tracking-wider">Preceptor</th>
                <th className="px-6 py-3 text-left text-xs text-slate-600 uppercase tracking-wider">Progress</th>
                <th className="px-6 py-3 text-left text-xs text-slate-600 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs text-slate-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredStudents.map((student) => (
                <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-teal-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm">{student.name.split(' ').map(n => n[0]).join('')}</span>
                      </div>
                      <div>
                        <p className="text-slate-900">{student.name}</p>
                        <p className="text-sm text-slate-500">ID: {student.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-slate-700">
                        <Mail className="w-4 h-4 text-slate-400" />
                        {student.email}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-700">
                        <Phone className="w-4 h-4 text-slate-400" />
                        {student.phone}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-900">{student.program}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-700">{student.preceptor}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <p className="text-sm text-slate-900">{student.entriesCount} entries</p>
                      <p className="text-sm text-slate-500">{student.totalHours} hours</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs ${
                      student.status === 'active' 
                        ? 'bg-green-100 text-green-700'
                        : student.status === 'completed'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
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
        </div>
      </div>
    </div>
  );
}
