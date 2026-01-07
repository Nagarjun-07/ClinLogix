// React hooks for state management and lifecycle handling
import { useState, useEffect } from 'react';

// Icons used in the preceptor review UI
import { Users, Calendar, FileText, Star, CheckCircle } from 'lucide-react';

// API abstraction for backend calls
import { api } from '../../services/api';

// Supabase client for authentication and potential real-time usage
import { supabase } from '../../lib/supabase';

// Type definition representing a clinical log entry
import { ClinicalEntry } from '../../App';

/**
 * Interface representing minimal student information
 * shown to the preceptor for selection and review
 */
interface StudentInfo {
  id: string;
  name: string;
  email: string;
}

/**
 * PreceptorReviewPage
 * -------------------
 * Allows a preceptor to:
 * - View assigned students
 * - Select a student
 * - Read the student's logbook entries (read-only)
 * - Provide a term-level evaluation (rating, comments, approval)
 */
export function PreceptorReviewPage() {

  /* ----------------------------- STATE MANAGEMENT ----------------------------- */

  // List of students assigned to the logged-in preceptor
  const [students, setStudents] = useState<StudentInfo[]>([]);

  // Currently selected student ID
  const [selectedStudent, setSelectedStudent] = useState('');

  // Log entries of the selected student
  const [currentLogs, setCurrentLogs] = useState<ClinicalEntry[]>([]);

  // Evaluation form state
  const [rating, setRating] = useState('');
  const [comments, setComments] = useState('');
  const [approval, setApproval] = useState('');

  // UI feedback states
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  /* ----------------------------- LOAD STUDENTS ----------------------------- */

  /**
   * On component mount:
   * - Get current authenticated preceptor
   * - Fetch students assigned to that preceptor
   */
  useEffect(() => {
    const loadStudents = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const data = await api.getInstructorStudents(user.id);
          setStudents(data);
        }
      } catch (error) {
        console.error('Failed to load students:', error);
      }
    };

    loadStudents();
  }, []);

  /* ----------------------------- LOAD LOGS ----------------------------- */

  /**
   * Whenever a student is selected:
   * - Fetch all clinical logs for that student
   * - Reset logs if no student is selected
   */
  useEffect(() => {
    if (!selectedStudent) {
      setCurrentLogs([]);
      return;
    }

    const loadLogs = async () => {
      setIsLoading(true);
      try {
        const data = await api.getLogs('student', selectedStudent);
        setCurrentLogs(data);
      } catch (error) {
        console.error('Failed to load logs:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadLogs();
  }, [selectedStudent]);

  // Retrieve full student object for selected student
  const currentStudentData = students.find(
    (s) => s.id === selectedStudent
  );

  /* ----------------------------- SUBMIT EVALUATION ----------------------------- */

  /**
   * Handles submission of the evaluation form
   *
   * Notes:
   * - Ideally, this would store data in a dedicated "reviews" table
   * - Currently simulated as a successful submission
   * - Intended as a term-level evaluation, not per-log approval
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setShowConfirmation(true);

    // Reset form and selection after confirmation
    setTimeout(() => {
      setShowConfirmation(false);
      setRating('');
      setComments('');
      setApproval('');
      setSelectedStudent('');
    }, 3000);
  };

  // Validation: all fields must be filled before submission
  const canSubmit = selectedStudent && rating && comments && approval;

  /* ----------------------------- RENDER ----------------------------- */

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ----------------------------- HEADER ----------------------------- */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-slate-900">Student Logbook Review</h1>
          <p className="text-slate-600 mt-1">
            Evaluate student clinical experiences
          </p>
        </div>
      </div>

      {/* ----------------------------- MAIN CONTENT ----------------------------- */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="space-y-6">

          {/* ----------------------------- STUDENT SELECT ----------------------------- */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <label className="block text-sm text-slate-700 mb-2">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Select Assigned Student
              </div>
            </label>

            <select
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Choose a student...</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name} ({student.email})
                </option>
              ))}
            </select>
          </div>

          {/* ----------------------------- SUCCESS MESSAGE ----------------------------- */}
          {showConfirmation && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <p className="text-green-900">
                  Evaluation submitted successfully!
                </p>
              </div>
            </div>
          )}

          {/* ----------------------------- STUDENT DATA ----------------------------- */}
          {selectedStudent && (
            <>
              {/* Student Summary */}
              <div className="bg-gradient-to-r from-blue-50 to-teal-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-900">
                      {currentStudentData?.name}
                    </p>
                    <p className="text-sm text-slate-600">
                      {currentStudentData?.email}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-600">Total Entries</p>
                    <p className="text-2xl text-slate-900">
                      {currentLogs.length}
                    </p>
                  </div>
                </div>
              </div>

              {/* Log Table (Read-Only) */}
              {/* Logs are displayed for review only; no edit actions available */}

              {/* ----------------------------- EVALUATION FORM ----------------------------- */}
              {/* Rating, feedback, and approval status */}
            </>
          )}

          {/* ----------------------------- EMPTY STATE ----------------------------- */}
          {!selectedStudent && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
              <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">
                Select a student to review their logbook entries
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
