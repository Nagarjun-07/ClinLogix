import { Users, UserCheck, TrendingUp, BookOpen, Clock, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { StatsCard } from '../StatsCard';
import { ActivityChart } from '../ActivityChart';
import { SpecialtyDistribution } from '../SpecialtyDistribution';
import { supabase } from '../../lib/supabase';
import { api } from '../../services/api';
import { useToast } from '../ui/Toast';

interface Activity {
  id: string;
  student_name: string;
  action: string;
  time: string;
  type: 'entry' | 'approval' | 'rejection' | 'request';
}

interface DashboardStats {
  totalStudents: number;
  totalPreceptors: number;
  totalEntries: number;
  pendingReviews: number;
  totalHours: number;
  approvedCount: number;
}

export function DashboardTab() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalPreceptors: 0,
    totalEntries: 0,
    pendingReviews: 0,
    totalHours: 0,
    approvedCount: 0
  });
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [chartData, setChartData] = useState<{ activity: any[], specialty: any[] }>({ activity: [], specialty: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();

    // Subscribe to real-time updates
    const subscription = supabase
      .channel('admin_dashboard_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => fetchDashboardData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'log_entries' }, () => fetchDashboardData())
      .subscribe();

    return () => { subscription.unsubscribe(); };
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch counts from Supabase directly for accurate stats
      const [studentsRes, preceptorsRes, entriesRes, pendingRes, approvedRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact' }).eq('role', 'student'),
        supabase.from('profiles').select('id', { count: 'exact' }).eq('role', 'instructor'),
        supabase.from('log_entries').select('id, hours', { count: 'exact' }),
        supabase.from('log_entries').select('id', { count: 'exact' }).eq('status', 'pending'),
        supabase.from('log_entries').select('id', { count: 'exact' }).eq('status', 'approved'),
      ]);

      // Calculate total hours
      const { data: hoursData } = await supabase.from('log_entries').select('hours');
      const totalHours = hoursData?.reduce((sum, entry) => sum + (entry.hours || 0), 0) || 0;

      setStats({
        totalStudents: studentsRes.count || 0,
        totalPreceptors: preceptorsRes.count || 0,
        totalEntries: entriesRes.count || 0,
        pendingReviews: pendingRes.count || 0,
        totalHours: Math.round(totalHours),
        approvedCount: approvedRes.count || 0
      });

      // Fetch aggregated chart data from backend
      try {
        const charts = await api.getDashboardChartData();
        if (charts) {
          setChartData({
            activity: charts.activity || [],
            specialty: charts.specialty || []
          });
        }
      } catch (err) {
        console.error("Failed to load chart data", err);
      }

      // Fetch recent activity (latest log entries with student names)
      const { data: recentLogs } = await supabase
        .from('log_entries')
        .select('id, status, submitted_at, student:profiles!log_entries_student_fkey(full_name)')
        .order('submitted_at', { ascending: false })
        .limit(5);

      if (recentLogs) {
        const activities: Activity[] = recentLogs.map(log => {
          const studentName = (log.student as any)?.full_name || 'Unknown Student';
          const timeAgo = getTimeAgo(new Date(log.submitted_at));

          let action = 'submitted a new entry';
          let type: Activity['type'] = 'entry';

          if (log.status === 'approved') {
            action = 'entry was approved';
            type = 'approval';
          } else if (log.status === 'rejected') {
            action = 'entry needs revision';
            type = 'rejection';
          } else if (log.status === 'pending') {
            action = 'submitted for review';
            type = 'request';
          }

          return {
            id: log.id,
            student_name: studentName,
            action,
            time: timeAgo,
            type
          };
        });
        setRecentActivity(activities);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  const handleNavigate = (tab: string, message?: string) => {
    navigate(`/admin/${tab}`);
    if (message) {
      showToast(message, 'info');
    }
  };

  // Calculate completion rate
  const completionRate = stats.totalEntries > 0
    ? Math.round((stats.approvedCount / stats.totalEntries) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-slate-900">Dashboard Overview</h2>
        <p className="text-slate-600 mt-1">Welcome back! Here's what's happening today.</p>
      </div>

      {/* Summary Cards - Clickable */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatsCard
          title="Total Students"
          value={loading ? "..." : stats.totalStudents.toString()}
          icon={<Users className="w-6 h-6" />}
          color="blue"
          subtitle="Registered users"
          onClick={() => handleNavigate('students')}
        />
        <StatsCard
          title="Total Preceptors"
          value={loading ? "..." : stats.totalPreceptors.toString()}
          icon={<UserCheck className="w-6 h-6" />}
          color="teal"
          subtitle="Clinical supervisors"
          onClick={() => handleNavigate('preceptors')}
        />
        <StatsCard
          title="Total Log Entries"
          value={loading ? "..." : stats.totalEntries.toString()}
          icon={<BookOpen className="w-6 h-6" />}
          color="purple"
          subtitle="All time submissions"
          onClick={() => handleNavigate('students', 'Select a student to view their log entries')}
        />
      </div>

      {/* Secondary Stats - Clickable */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard
          title="Pending Reviews"
          value={loading ? "..." : stats.pendingReviews.toString()}
          icon={<AlertCircle className="w-6 h-6" />}
          color="amber"
          subtitle="Awaiting approval"
          onClick={() => handleNavigate('students', 'Check students with pending entries')}
        />
        <StatsCard
          title="Total Hours Logged"
          value={loading ? "..." : stats.totalHours.toLocaleString()}
          icon={<Clock className="w-6 h-6" />}
          color="green"
          subtitle="This semester"
        />
        <StatsCard
          title="Completion Rate"
          value={loading ? "..." : `${completionRate}%`}
          icon={<TrendingUp className="w-6 h-6" />}
          color="blue"
          subtitle={completionRate >= 80 ? "Above target" : "Needs improvement"}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActivityChart data={chartData.activity.length > 0 ? chartData.activity : [
          { month: 'No Data', entries: 0, hours: 0 }
        ]} />
        <SpecialtyDistribution data={chartData.specialty.length > 0 ? chartData.specialty : [
          { name: 'No Data', value: 1 }
        ]} />
      </div>

      {/* Recent Activity - Dynamic */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-slate-900">Recent Activity</h3>
          <span className="text-xs text-slate-500">Live updates</span>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="text-center py-8 text-slate-500">Loading activity...</div>
          ) : recentActivity.length === 0 ? (
            <div className="text-center py-8 text-slate-500">No recent activity</div>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${activity.type === 'entry' ? 'bg-blue-100' :
                      activity.type === 'approval' ? 'bg-green-100' :
                        activity.type === 'rejection' ? 'bg-red-100' :
                          'bg-amber-100'
                    }`}>
                    {activity.type === 'entry' && <BookOpen className="w-4 h-4 text-blue-600" />}
                    {activity.type === 'approval' && <UserCheck className="w-4 h-4 text-green-600" />}
                    {activity.type === 'rejection' && <AlertCircle className="w-4 h-4 text-red-600" />}
                    {activity.type === 'request' && <Clock className="w-4 h-4 text-amber-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-900">
                      <span className="font-medium">{activity.student_name}</span>{' '}
                      <span className="text-slate-600">{activity.action}</span>
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
