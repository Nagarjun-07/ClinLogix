import { useState, useEffect } from 'react';
import { Plus, BookOpen, Clock, CheckCircle, AlertCircle, Filter, Loader2 } from 'lucide-react';
import { ClinicalEntry } from '../App';
import { StatsCard } from './StatsCard';
import { EntriesTable } from './EntriesTable';
import { AddEntryModal } from './AddEntryModal';
import { api } from '../services/api';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

import { supabase } from '../lib/supabase';

interface StudentDashboardProps {
  currentUser: { id: string; name: string; email: string };
  onViewChange: (view: string) => void;
}

export function StudentDashboard({ currentUser, onViewChange }: StudentDashboardProps) {
  const [entries, setEntries] = useState<ClinicalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  useEffect(() => {
    loadEntries();

    // Subscribe to real-time changes
    const subscription = supabase
      .channel('student_dashboard_logs')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'log_entries',
          filter: `student_id=eq.${currentUser.id}`,
        },
        () => {
          loadEntries();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [currentUser.id]);

  const loadEntries = async () => {
    try {
      setIsLoading(true);
      const data = await api.getLogs('student', currentUser.id);
      setEntries(data || []);
    } catch (error) {
      console.error('Failed to load logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const totalHours = entries.reduce((sum, entry) => sum + entry.hours, 0);
  const approvedEntries = entries.filter(e => e.status === 'approved').length;
  const pendingEntries = entries.filter(e => e.status === 'pending').length;

  const filteredEntries = filterStatus === 'all'
    ? entries
    : entries.filter(e => e.status === filterStatus);

  const handleAddEntry = async (newEntry: Omit<ClinicalEntry, 'id' | 'studentId' | 'studentName' | 'status' | 'submittedAt'>) => {
    try {
      // Create new entry
      await api.createLog({
        ...newEntry,
        studentId: currentUser.id,
      });

      // Refresh list
      await loadEntries();
      setShowAddModal(false);
    } catch (error) {
      console.error('Failed to create log:', error);
      alert('Failed to create entry. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Student Dashboard</h2>
          <p className="text-muted-foreground mt-1">Track your clinical experiences and hours</p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Entry
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Entries"
          value={entries.length.toString()}
          icon={<BookOpen className="w-5 h-5" />}
          color="blue"
        />
        <StatsCard
          title="Total Hours"
          value={totalHours.toString()}
          icon={<Clock className="w-5 h-5" />}
          color="teal"
        />
        <StatsCard
          title="Approved"
          value={approvedEntries.toString()}
          icon={<CheckCircle className="w-5 h-5" />}
          color="green"
        />
        <StatsCard
          title="Pending Review"
          value={pendingEntries.toString()}
          icon={<AlertCircle className="w-5 h-5" />}
          color="amber"
        />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Clinical Log Entries</CardTitle>
            <CardDescription>Recent entries from your clinical rotations</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select
              value={filterStatus}
              onValueChange={(value: string) => setFilterStatus(value as any)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Needs Revision</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <EntriesTable entries={filteredEntries} showStudent={false} />
        </CardContent>
      </Card>

      {showAddModal && (
        <AddEntryModal
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddEntry}
        />
      )}
    </div>
  );
}
