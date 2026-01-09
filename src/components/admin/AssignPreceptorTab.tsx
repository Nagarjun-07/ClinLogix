import { Search, CheckCircle, AlertCircle, UserCheck, Users, ChevronDown, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';
import { supabase } from '../../lib/supabase';
import { useToast } from '../ui/Toast';

interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: string;
  student_count?: number;
  institution_id?: string;
}

interface Assignment {
  id: string;
  student: string;
  preceptor: string;
  status: string;
}

export function AssignPreceptorTab() {
  const { showToast } = useToast();
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedPreceptor, setSelectedPreceptor] = useState('');
  const [students, setStudents] = useState<Profile[]>([]);
  const [preceptors, setPreceptors] = useState<Profile[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Dropdown state
  const [isPreceptorOpen, setIsPreceptorOpen] = useState(false);
  const [isStudentOpen, setIsStudentOpen] = useState(false);
  const [studentPage, setStudentPage] = useState(1);
  const [preceptorPage, setPreceptorPage] = useState(1);
  const preceptorRef = useRef<HTMLDivElement>(null);
  const studentRef = useRef<HTMLDivElement>(null);

  const ITEMS_PER_PAGE = 3;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (preceptorRef.current && !preceptorRef.current.contains(e.target as Node)) setIsPreceptorOpen(false);
      if (studentRef.current && !studentRef.current.contains(e.target as Node)) setIsStudentOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data: sData } = await supabase.from('profiles').select('*').eq('role', 'student').order('created_at', { ascending: false });
      if (sData) setStudents(sData);
      const pStats = await api.getPreceptorStats();
      setPreceptors(pStats || []);
      const assignmentsData = await api.getAssignments();
      setAssignments(assignmentsData || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStudentAssignment = (studentId: string) => assignments.find(a => a.student === studentId && a.status === 'active');
  const getPreceptorName = (preceptorId: string) => preceptors.find(p => p.id === preceptorId)?.full_name || 'Unknown';
  const getSelectedPreceptor = () => preceptors.find(p => p.id === selectedPreceptor);
  const getSelectedStudent = () => students.find(s => s.id === selectedStudent);

  // Sort: available first, then by capacity (ascending for preceptors)
  const sortedStudents = [...students].sort((a, b) => {
    const aAssigned = getStudentAssignment(a.id) ? 1 : 0;
    const bAssigned = getStudentAssignment(b.id) ? 1 : 0;
    return aAssigned - bAssigned;
  });

  const sortedPreceptors = [...preceptors].sort((a, b) => {
    const aFull = (a.student_count || 0) >= 5 ? 1 : 0;
    const bFull = (b.student_count || 0) >= 5 ? 1 : 0;
    if (aFull !== bFull) return aFull - bFull;
    return (a.student_count || 0) - (b.student_count || 0); // Less students first
  });

  // Pagination
  const studentTotalPages = Math.ceil(sortedStudents.length / ITEMS_PER_PAGE);
  const preceptorTotalPages = Math.ceil(sortedPreceptors.length / ITEMS_PER_PAGE);
  const paginatedStudents = sortedStudents.slice((studentPage - 1) * ITEMS_PER_PAGE, studentPage * ITEMS_PER_PAGE);
  const paginatedPreceptors = sortedPreceptors.slice((preceptorPage - 1) * ITEMS_PER_PAGE, preceptorPage * ITEMS_PER_PAGE);

  const handleAssignment = async () => {
    setError(null);
    setSuccess(null);
    if (selectedStudent && selectedPreceptor) {
      const existingAssignment = getStudentAssignment(selectedStudent);
      if (existingAssignment) {
        setError(`Already assigned to ${getPreceptorName(existingAssignment.preceptor)}`);
        return;
      }

      // Validate Institution Match
      const student = getSelectedStudent();
      const preceptor = getSelectedPreceptor();

      if (student && preceptor) {
        const sInst = String(student.institution_id || '');
        const pInst = String(preceptor.institution_id || '');

        if (!sInst || !pInst) {
          // If one is missing, stricly prevent assignment
          if (sInst !== pInst) {
            setError('Cannot assign: Student and Preceptor must belong to the same institution.');
            return;
          }
        } else if (sInst !== pInst) {
          setError('Cannot assign: Student and Preceptor must belong to the same institution.');
          return;
        }
      }

      try {
        await api.assignStudentToPreceptor(selectedStudent, selectedPreceptor);
        showToast('Assignment successful!', 'success');
        setSuccess('Assignment created successfully.');
        setSelectedStudent('');
        setSelectedPreceptor('');
        await fetchData();
      } catch (err: any) {
        const msg = err.response?.status === 409 ? 'Student already assigned' : 'Assignment failed';
        setError(msg);
        showToast(msg, 'error');
      }
    }
  };

  const assignedCount = students.filter(s => getStudentAssignment(s.id)).length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-slate-900">Assign Preceptor</h2>
        <p className="text-slate-600 mt-1">Match students with clinical preceptors</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-slate-900 mb-4">Create New Assignment</h3>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <p className="text-sm text-green-700">{success}</p>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-6 text-slate-500">Loading...</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Student Dropdown */}
              <div>
                <label className="block text-sm text-slate-600 mb-1">Student</label>
                <div ref={studentRef} className="relative">
                  <button
                    type="button"
                    onClick={() => { setIsStudentOpen(!isStudentOpen); setStudentPage(1); }}
                    className="w-full flex items-center justify-between px-3 py-2.5 bg-white border border-slate-300 rounded-lg hover:border-blue-400 transition text-sm"
                  >
                    {selectedStudent ? (
                      <span className="truncate">{getSelectedStudent()?.full_name}</span>
                    ) : (
                      <span className="text-slate-400">Select student...</span>
                    )}
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition ${isStudentOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isStudentOpen && (
                    <div className="absolute z-30 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg">
                      {paginatedStudents.map(s => {
                        const isAssigned = !!getStudentAssignment(s.id);
                        return (
                          <button
                            key={s.id}
                            onClick={() => { if (!isAssigned) { setSelectedStudent(s.id); setIsStudentOpen(false); setError(null); } }}
                            disabled={isAssigned}
                            className={`w-full flex items-center justify-between px-3 py-2 text-sm border-b border-slate-100 last:border-0 ${isAssigned ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : 'hover:bg-blue-50'
                              }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${isAssigned ? 'bg-slate-200 text-slate-500' : 'bg-blue-100 text-blue-600'
                                }`}>
                                {s.full_name?.[0] || '?'}
                              </div>
                              <span className="truncate">{s.full_name}</span>
                            </div>
                            {isAssigned && <span className="text-xs text-slate-400 ml-2">Assigned</span>}
                          </button>
                        );
                      })}

                      {/* Pagination */}
                      {studentTotalPages > 1 && (
                        <div className="flex items-center justify-between px-2 py-1.5 border-t border-slate-200 bg-slate-50">
                          <button
                            onClick={() => setStudentPage(p => Math.max(1, p - 1))}
                            disabled={studentPage === 1}
                            className="p-1 rounded hover:bg-slate-200 disabled:opacity-40"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <span className="text-xs text-slate-500">{studentPage}/{studentTotalPages}</span>
                          <button
                            onClick={() => setStudentPage(p => Math.min(studentTotalPages, p + 1))}
                            disabled={studentPage === studentTotalPages}
                            className="p-1 rounded hover:bg-slate-200 disabled:opacity-40"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Preceptor Dropdown */}
              <div>
                <label className="block text-sm text-slate-600 mb-1">Preceptor</label>
                <div ref={preceptorRef} className="relative">
                  <button
                    type="button"
                    onClick={() => { setIsPreceptorOpen(!isPreceptorOpen); setPreceptorPage(1); }}
                    className="w-full flex items-center justify-between px-3 py-2.5 bg-white border border-slate-300 rounded-lg hover:border-teal-400 transition text-sm"
                  >
                    {selectedPreceptor ? (
                      <div className="flex items-center gap-2">
                        <span className="truncate">{getSelectedPreceptor()?.full_name}</span>
                        <span className="text-xs text-slate-400">{getSelectedPreceptor()?.student_count || 0}/5</span>
                      </div>
                    ) : (
                      <span className="text-slate-400">Select preceptor...</span>
                    )}
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition ${isPreceptorOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isPreceptorOpen && (
                    <div className="absolute z-30 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg">
                      {paginatedPreceptors.map(p => {
                        const count = p.student_count || 0;
                        const isFull = count >= 5;
                        return (
                          <button
                            key={p.id}
                            onClick={() => { if (!isFull) { setSelectedPreceptor(p.id); setIsPreceptorOpen(false); } }}
                            disabled={isFull}
                            className={`w-full flex items-center justify-between px-3 py-2 text-sm border-b border-slate-100 last:border-0 ${isFull ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : 'hover:bg-teal-50'
                              }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${isFull ? 'bg-slate-200 text-slate-500' : 'bg-teal-100 text-teal-600'
                                }`}>
                                {p.full_name?.[0] || '?'}
                              </div>
                              <span className="truncate">{p.full_name}</span>
                            </div>
                            <span className={`text-xs ${isFull ? 'text-red-400' : 'text-slate-500'}`}>{count}/5</span>
                          </button>
                        );
                      })}

                      {/* Pagination */}
                      {preceptorTotalPages > 1 && (
                        <div className="flex items-center justify-between px-2 py-1.5 border-t border-slate-200 bg-slate-50">
                          <button
                            onClick={() => setPreceptorPage(p => Math.max(1, p - 1))}
                            disabled={preceptorPage === 1}
                            className="p-1 rounded hover:bg-slate-200 disabled:opacity-40"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <span className="text-xs text-slate-500">{preceptorPage}/{preceptorTotalPages}</span>
                          <button
                            onClick={() => setPreceptorPage(p => Math.min(preceptorTotalPages, p + 1))}
                            disabled={preceptorPage === preceptorTotalPages}
                            className="p-1 rounded hover:bg-slate-200 disabled:opacity-40"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => { setSelectedStudent(''); setSelectedPreceptor(''); setError(null); setSuccess(null); }}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 text-sm"
              >
                Clear
              </button>
              <button
                onClick={handleAssignment}
                disabled={!selectedStudent || !selectedPreceptor}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-lg hover:from-blue-700 hover:to-teal-700 disabled:opacity-50 text-sm shadow-sm"
              >
                Assign
              </button>
            </div>
          </>
        )}
      </div>

      {/* Current Assignments */}
      {assignedCount > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <h3 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-green-600" />
            Assigned ({assignedCount})
          </h3>
          <div className="flex flex-wrap gap-2">
            {students.filter(s => getStudentAssignment(s.id)).map(s => {
              const assignment = getStudentAssignment(s.id);
              return (
                <div key={s.id} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-green-50 border border-green-100 rounded-full text-xs">
                  <span className="font-medium text-slate-700">{s.full_name}</span>
                  <span className="text-slate-400">→</span>
                  <span className="text-green-600">{assignment ? getPreceptorName(assignment.preceptor) : ''}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
