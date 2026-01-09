import { useState, useEffect } from 'react';
import { Plus, Lock, Unlock, Calendar, Edit, CheckCircle } from 'lucide-react';
import { AddLogModal } from './AddLogModal';
import { api } from '../../services/api';
import { ClinicalEntry } from '../../App';
import { supabase } from '../../lib/supabase';
import { useToast } from '../ui/Toast';

export function StudentLogbookPage() {
  const { showToast } = useToast();
  const [logs, setLogs] = useState<ClinicalEntry[]>([]);
  const [isLocked] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingLog, setEditingLog] = useState<ClinicalEntry | null>(null);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  // Real-time subscription
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
          // Re-fetch only logs, avoiding full user re-fetch if possible, 
          // but loadData does both. It's fine for now.
          loadData();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [currentUser?.id]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const user = await api.getCurrentUser();
      if (user) {
        setCurrentUser(user);
        const data = await api.getLogs('student', user.id);
        setLogs(data);

        // Check if any log is locked (simplistic check, ideally check term status)
        // or check if ALL logs are locked/approved
      }
    } catch (error) {
      console.error('Failed to load logs', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddLog = async (logData: any) => {
    if (!currentUser) return;
    try {
      const entryData = {
        studentId: currentUser.id,
        date: logData.date,
        location: 'General Ward',
        specialty: 'Internal Medicine', // Default for now, should come from form if available
        hours: logData.hours || 0,
        activities: logData.activities,
        learningObjectives: 'Standard Rotation',
        reflection: logData.reflection,
        supervisorName: 'Assigned Preceptor',
        patientsSeen: logData.patientsSeen || 0
      };

      if (editingLog) {
        await api.updateLog(editingLog.id, entryData);
        showToast('Log entry updated and resubmitted', 'success');
      } else {
        await api.createLog(entryData);
        showToast('Log entry created successfully', 'success');
      }

      await loadData();
      setShowAddModal(false);
      setEditingLog(null);
    } catch (error) {
      console.error('Failed to save log:', error);
      showToast('Failed to save log entry', 'error');
    }
  };

  const handleEditLog = async (logData: any) => {
    // Edit implementation would go here (need api.updateLog)
    // For now, just refresh
    console.log('Edit not fully implemented in API yet', logData);
    setEditingLog(null);
  };

  const handleSubmitLogbook = async () => {
    if (selectedIds.length === 0) return;

    try {
      await api.submitLogs(selectedIds);
      await loadData();
      setSelectedIds([]);
      setShowSubmitConfirm(true);
      setTimeout(() => setShowSubmitConfirm(false), 3000);
    } catch (e) {
      console.error('Submit failed', e);
      showToast('Failed to submit selected logs', 'error');
    }
  };

  if (isLoading) return <div className="p-8 text-center text-slate-500">Loading logbook...</div>;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-slate-900 font-bold tracking-tight">My Mediatlas</h1>
              <p className="text-slate-600 mt-1">Clinical Rotation Record</p>
            </div>
            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${isLocked
                ? 'bg-red-100 text-red-700'
                : 'bg-green-100 text-green-700'
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
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="space-y-6">
          {/* Action Bar */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-slate-900">Daily Log Entries</h2>
              <p className="text-slate-600 mt-1">{logs.length} entries recorded</p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              disabled={isLocked}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-lg hover:from-blue-700 hover:to-teal-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-5 h-5" />
              Add Daily Log
            </button>
          </div>

          {/* Success Message */}
          {showSubmitConfirm && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <p className="text-green-900">Logbook submitted successfully for review!</p>
              </div>
            </div>
          )}

          {/* Logs Table */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        onChange={(e) => {
                          if (e.target.checked) {
                            // Select all unlocked logs
                            setSelectedIds(logs.filter(l => !l.isLocked).map(l => l.id));
                          } else {
                            setSelectedIds([]);
                          }
                        }}
                        checked={logs.length > 0 && selectedIds.length === logs.filter(l => !l.isLocked).length && logs.some(l => !l.isLocked)}
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs text-slate-600 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs text-slate-600 uppercase tracking-wider">Activities</th>
                    <th className="px-6 py-3 text-left text-xs text-slate-600 uppercase tracking-wider">Patients Seen</th>
                    <th className="px-6 py-3 text-left text-xs text-slate-600 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs text-slate-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                        No log entries yet. Click "Add Daily Log" to start.
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id} className={`hover:bg-slate-50 transition-colors ${log.isLocked ? 'bg-slate-50/50' : ''}`}>
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            disabled={log.isLocked}
                            checked={selectedIds.includes(log.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedIds([...selectedIds, log.id]);
                              } else {
                                setSelectedIds(selectedIds.filter(id => id !== log.id));
                              }
                            }}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            <span className="text-sm text-slate-900">
                              {new Date(log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                            {log.isLocked && <Lock className="w-3 h-3 text-slate-400 ml-1" />}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-slate-700 line-clamp-2">{log.activities}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-slate-900">{log.patientsSeen}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs ${log.status === 'approved' // Example status check
                            ? 'bg-green-100 text-green-700'
                            : log.status === 'rejected'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-amber-100 text-amber-700'
                            }`}>
                            {log.status ? (log.status.charAt(0).toUpperCase() + log.status.slice(1)) : 'Pending'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {!log.isLocked && (
                            <button
                              onClick={() => setEditingLog(log)}
                              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                            >
                              <Edit className="w-4 h-4" />
                              Edit
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Submit Logbook Button */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-slate-900">Submit Logbook for Review</h3>
                <p className="text-sm text-slate-600 mt-1">
                  Select entries above to submit. {selectedIds.length} entries selected.
                </p>
              </div>
              <button
                onClick={handleSubmitLogbook}
                disabled={selectedIds.length === 0}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg hover:from-green-700 hover:to-teal-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Selected ({selectedIds.length})
              </button>
            </div>
          </div>
        </div>
      </main>

      {(showAddModal || editingLog) && (
        <AddLogModal
          initialData={editingLog || undefined}
          onClose={() => {
            setShowAddModal(false);
            setEditingLog(null);
          }}
          onSubmit={handleAddLog}
        />
      )}
    </div>
  );
}
