import { useState, useEffect } from 'react';
import { Users, ClipboardCheck, Clock, AlertCircle } from 'lucide-react';
import { ClinicalEntry } from '../App';
import { StatsCard } from './StatsCard';
import { EntriesTable } from './EntriesTable';
import { ReviewModal } from './ReviewModal';
import { api } from '../services/api';
import { supabase } from '../lib/supabase';

interface InstructorDashboardProps {
  currentUser: { id: string; name: string; email: string };
}

export function InstructorDashboard({ currentUser }: InstructorDashboardProps) {
  const [entries, setEntries] = useState<ClinicalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<ClinicalEntry | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [studentCount, setStudentCount] = useState(0);

  useEffect(() => {
    loadData();

    // Real-time subscription for new submissions
    const subscription = supabase
      .channel('instructor_dashboard')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'log_entries'
        },
        () => {
          loadData();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [currentUser.id]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [logsData, studentsData] = await Promise.all([
        api.getLogs('instructor', currentUser.id),
        api.getInstructorStudents(currentUser.id)
      ]);
      setEntries(logsData);
      setStudentCount(studentsData?.length || 0);
    } catch (error) {
      console.error('Failed to load dashboard data', error);
    } finally {
      setIsLoading(false);
    }
  };

  const pendingCount = entries.filter(e => e.status === 'pending').length;
  const approvedCount = entries.filter(e => e.status === 'approved').length;
  const totalHours = entries.reduce((sum, entry) => sum + (entry.hours || 0), 0);
  const uniqueStudents = studentCount; // Use the real fetched count

  const filteredEntries = filterStatus === 'all'
    ? entries
    : entries.filter(e => e.status === filterStatus);

  const handleReview = async (entryId: string, status: 'approved' | 'rejected', feedback: string) => {
    try {
      await api.updateLogStatus(entryId, status, feedback);

      // Update local state to reflect change immediately
      setEntries(entries.map(entry =>
        entry.id === entryId
          ? { ...entry, status, feedback }
          : entry
      ));
      setSelectedEntry(null);
    } catch (error) {
      console.error('Failed to update log status:', error);
      alert('Failed to submit review');
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-slate-900">Instructor Dashboard</h2>
        <p className="text-slate-600 mt-1">Review and approve student clinical log entries</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Active Students"
          value={uniqueStudents.toString()}
          icon={<Users className="w-6 h-6" />}
          color="blue"
        />
        <StatsCard
          title="Pending Reviews"
          value={pendingCount.toString()}
          icon={<AlertCircle className="w-6 h-6" />}
          color="amber"
        />
        <StatsCard
          title="Approved Entries"
          value={approvedCount.toString()}
          icon={<ClipboardCheck className="w-6 h-6" />}
          color="green"
        />
        <StatsCard
          title="Total Hours Logged"
          value={totalHours.toString()}
          icon={<Clock className="w-6 h-6" />}
          color="teal"
        />
      </div>

      {/* Entries Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <h3 className="text-slate-900">Student Submissions</h3>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Needs Revision</option>
            </select>
          </div>
        </div>
        <EntriesTable
          entries={filteredEntries}
          showStudent={true}
          onReview={(entry) => setSelectedEntry(entry)}
        />
      </div>

      {selectedEntry && (
        <ReviewModal
          entry={selectedEntry}
          onClose={() => setSelectedEntry(null)}
          onSubmit={handleReview}
        />
      )}
    </div>
  );
}
