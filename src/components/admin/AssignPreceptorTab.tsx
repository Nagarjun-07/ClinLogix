import { Search, CheckCircle, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { supabase } from '../../lib/supabase';

interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: string;
}

export function AssignPreceptorTab() {
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedPreceptor, setSelectedPreceptor] = useState('');
  const [students, setStudents] = useState<Profile[]>([]);
  const [preceptors, setPreceptors] = useState<Profile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      // In a real app, you might want to filter out students who are ALREADY assigned
      // or show their current assignment status. For now, we fetch all.
      const { data: sData } = await supabase.from('profiles').select('*').eq('role', 'student');
      const { data: pData } = await supabase.from('profiles').select('*').eq('role', 'instructor');
      if (sData) setStudents(sData);
      if (pData) setPreceptors(pData);
    };
    fetchData();
  }, []);

  const handleAssignment = async () => {
    setError(null);
    setSuccess(null);
    if (selectedStudent && selectedPreceptor) {
      try {
        await api.assignStudentToPreceptor(selectedStudent, selectedPreceptor);
        setSuccess('Successfully assigned student to preceptor.');
        setSelectedStudent('');
        setSelectedPreceptor('');
      } catch (err: any) {
        // Check for specific database trigger error
        if (err.message && err.message.includes('Preceptor limit reached')) {
          setError('Error: This Preceptor has reached the limit of 5 students.');
        } else if (err.message && err.message.includes('duplicate key')) {
          setError('Error: This student is already assigned to this preceptor.');
        } else {
          setError('Failed to assign: ' + err.message);
        }
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-slate-900">Assign Preceptor</h2>
        <p className="text-slate-600 mt-1">Match students with clinical preceptors</p>
      </div>

      {/* Assignment Form */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-slate-900 mb-4">Create New Assignment</h3>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-sm text-green-700">{success}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Select Student */}
          <div className="space-y-3">
            <label className="block text-sm text-slate-700">Select Student</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <select
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Choose a student...</option>
                {students.map(s => (
                  <option key={s.id} value={s.id}>{s.full_name} ({s.email})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Select Preceptor */}
          <div className="space-y-3">
            <label className="block text-sm text-slate-700">Select Preceptor</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <select
                value={selectedPreceptor}
                onChange={(e) => setSelectedPreceptor(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Choose a preceptor...</option>
                {preceptors.map(p => (
                  <option key={p.id} value={p.id}>{p.full_name} ({p.email})</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={() => {
              setSelectedStudent('');
              setSelectedPreceptor('');
              setError(null);
            }}
            className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Clear
          </button>
          <button
            onClick={handleAssignment}
            disabled={!selectedStudent || !selectedPreceptor}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-lg hover:from-blue-700 hover:to-teal-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCircle className="w-5 h-5" />
            Assign Preceptor
          </button>
        </div>
      </div>
    </div>
  );
}
