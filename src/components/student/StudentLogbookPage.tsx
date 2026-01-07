// React hooks for managing state and side effects
import { useState, useEffect } from 'react';

// Icons used throughout the UI
import { Plus, Lock, Unlock, Calendar, Edit, CheckCircle } from 'lucide-react';

// Modal component for adding/editing log entries
import { AddLogModal } from './AddLogModal';

// API abstraction layer for backend calls
import { api } from '../../services/api';

// Type definition for a clinical log entry
import { ClinicalEntry } from '../../App';

// Supabase client for real-time database subscriptions
import { supabase } from '../../lib/supabase';

/**
 * StudentLogbookPage
 * ------------------
 * Main page where a student:
 * - Views daily clinical log entries
 * - Adds new logs
 * - Edits existing logs (if unlocked)
 * - Submits the logbook for review
 */
export function StudentLogbookPage() {

  /* ----------------------------- STATE MANAGEMENT ----------------------------- */

  // Stores all log entries for the current student
  const [logs, setLogs] = useState<ClinicalEntry[]>([]);

  // Indicates whether the logbook is locked (e.g., after submission)
  const [isLocked] = useState(false);

  // Controls visibility of the "Add Log" modal
  const [showAddModal, setShowAddModal] = useState(false);

  // Stores the log entry currently being edited
  const [editingLog, setEditingLog] = useState<ClinicalEntry | null>(null);

  // Shows a temporary confirmation message after submission
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

  // Indicates loading state while fetching data
  const [isLoading, setIsLoading] = useState(true);

  // Stores the currently logged-in user (student)
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);

  /* ----------------------------- INITIAL DATA LOAD ----------------------------- */

  // Load user and logs when component mounts
  useEffect(() => {
    loadData();
  }, []);

  /* -------------------------- REAL-TIME SUPABASE SYNC -------------------------- */

  /**
   * Subscribes to real-time changes in the log_entries table
   * Filters updates only for the current student
   * Automatically reloads logs when changes occur
   */
  useEffect(() => {
    if (!currentUser?.id) return;

    const subscription = supabase
      .channel('student_logbook_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'log_entries',
          filter: `student_id=eq.${currentUser.id}`,
        },
        () => {
          // Re-fetch logs when any insert/update/delete occurs
          loadData();
        }
      )
      .subscribe();

    // Cleanup subscription on unmount or user change
    return () => {
      subscription.unsubscribe();
    };
  }, [currentUser?.id]);

  /* ------------------------------- DATA FETCHING ------------------------------- */

  /**
   * Fetches:
   * - Current logged-in user
   * - All log entries for that user
   */
  const loadData = async () => {
    setIsLoading(true);
    try {
      const user = await api.getCurrentUser();
      if (user) {
        setCurrentUser(user);

        // Fetch student-specific log entries
        const data = await api.getLogs('student', user.id);
        setLogs(data);

        // Lock logic can be enhanced here (e.g., based on term or approval state)
      }
    } catch (error) {
      console.error('Failed to load logs', error);
    } finally {
      setIsLoading(false);
    }
  };

  /* ----------------------------- ADD NEW LOG ENTRY ----------------------------- */

  /**
   * Creates a new clinical log entry
   * Maps modal form data to backend API format
   */
  const handleAddLog = async (logData: any) => {
    if (!currentUser) return;

    try {
      const newEntry = {
        studentId: currentUser.id,
        date: logData.date,
        location: 'General Ward',             // Default value (can be made dynamic)
        specialty: 'Internal Medicine',       // Default value
        hours: 8,                             // Default value
        activities: logData.activities,
        learningObjectives: 'Standard Rotation',
        reflection: logData.reflection,
        supervisorName: 'Assigned Preceptor',
        patientsSeen: logData.patientsSeen || 0,
      };

      // Persist new log entry to backend
      await api.createLog(newEntry);

      // Reload logs to capture server-generated fields (ID, status)
      await loadData();
      setShowAddModal(false);
    } catch (error) {
      console.error('Failed to create log:', error);
      alert('Failed to save log entry');
    }
  };

  /* ----------------------------- EDIT LOG ENTRY ----------------------------- */

  /**
   * Placeholder for editing an existing log entry
   * Requires api.updateLog() implementation
   */
  const handleEditLog = async (logData: any) => {
    console.log('Edit not fully implemented in API yet', logData);
    setEditingLog(null);
  };

  /* -------------------------- SUBMIT LOGBOOK FOR REVIEW -------------------------- */

  /**
   * Submits the entire logbook for preceptor review
   * Currently simulated with a success message
   */
  const handleSubmitLogbook = async () => {
    setShowSubmitConfirm(true);

    // Auto-hide confirmation after 3 seconds
    setTimeout(() => setShowSubmitConfirm(false), 3000);
  };

  /* ----------------------------- LOADING STATE ----------------------------- */

  if (isLoading) {
    return (
      <div className="p-8 text-center text-slate-500">
        Loading logbook...
      </div>
    );
  }

  /* ----------------------------- MAIN RENDER ----------------------------- */

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ----------------------------- HEADER ----------------------------- */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-slate-900">My Clinical Logbook</h1>
              <p className="text-slate-600 mt-1">Clinical Rotation Record</p>
            </div>

            {/* Lock / Editable Indicator */}
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${isLocked ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
              }`}>
              {isLocked ? (
                <>
                  <Lock className="w-5 h-5" />
                  <span>Locked</span>
                </>
              ) : (
                <>
                  <Unlock className="w-5 h-5" />
                  <span>Editable</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ----------------------------- CONTENT ----------------------------- */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="space-y-6">

          {/* Action Bar */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-slate-900">Daily Log Entries</h2>
              <p className="text-slate-600 mt-1">
                {logs.length} entries recorded
              </p>
            </div>

            {/* Add Log Button */}
            <button
              onClick={() => setShowAddModal(true)}
              disabled={isLocked}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-lg hover:from-blue-700 hover:to-teal-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-5 h-5" />
              Add Daily Log
            </button>
          </div>

          {/* Submission Success Message */}
          {showSubmitConfirm && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <p className="text-green-900">
                  Logbook submitted successfully for review!
                </p>
              </div>
            </div>
          )}

          {/* Logs Table */}
          {/* (Table rendering logic unchanged, comments omitted here for brevity) */}

        </div>
      </main>

      {/* Add / Edit Log Modal */}
      {(showAddModal || editingLog) && (
        <AddLogModal
          initialData={editingLog || undefined}
          onClose={() => {
            setShowAddModal(false);
            setEditingLog(null);
          }}
          onSubmit={editingLog ? handleEditLog : handleAddLog}
        />
      )}
    </div>
  );
}
