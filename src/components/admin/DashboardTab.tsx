import { Users, UserCheck, TrendingUp, BookOpen, Clock, AlertCircle, FileJson, X, Copy, Check } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { StatsCard } from '../StatsCard';
import { ActivityChart } from './ActivityChart';
import { SpecialtyDistribution } from './SpecialtyDistribution';
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

  // FHIR Modal State
  const [fhirData, setFhirData] = useState<string | null>(null);
  const [isFhirModalOpen, setIsFhirModalOpen] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

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
      // 1. Fetch Stats from Backend (Secure & Accurate)
      try {
        const dashboardStats = await api.getAdminStats();
        if (dashboardStats) {
          setStats({
            totalStudents: dashboardStats.totalStudents || 0,
            totalPreceptors: dashboardStats.totalPreceptors || 0,
            totalEntries: dashboardStats.totalEntries || 0,
            pendingReviews: dashboardStats.pendingReviews || 0,
            totalHours: dashboardStats.totalHours || 0,
            approvedCount: dashboardStats.approvedCount || 0
          });
        }
      } catch (e) {
        console.error("Failed to fetch admin stats", e);
      }

      // 2. Fetch Aggregated Chart Data
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

      // 3. Fetch Recent Activity
      try {
        const activities = await api.getDashboardActivity();
        if (activities) {
          const formattedActivities = activities.map((act: any) => ({
            ...act,
            time: getTimeAgo(new Date(act.time))
          }));
          setRecentActivity(formattedActivities);
        }
      } catch (e) {
        console.error("Failed to load recent activity via API", e);
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

  const handleViewFHIR = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click if we had one
    try {
      const data = await api.getLogFHIR(id);
      setFhirData(JSON.stringify(data, null, 2));
      setIsFhirModalOpen(true);
      setCopySuccess(false);
    } catch (e) {
      console.error("Failed to fetch FHIR", e);
      showToast("Failed to load FHIR data", "error");
    }
  };

  const handleCopyFHIR = () => {
    if (fhirData) {
      navigator.clipboard.writeText(fhirData);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
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

      {/* Institution Analytics */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-slate-900">Hospital Analytics</h3>
          <span className="text-xs text-slate-500">Real-time stats</span>
        </div>
        <div className="p-6">
          <InstitutionAnalytics />
        </div>
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

                  {/* FHIR Button for Approvals/Entries */}
                  {(activity.type === 'approval' || activity.type === 'entry') && (
                    <button
                      onClick={(e) => handleViewFHIR(activity.id, e)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="View FHIR JSON"
                    >
                      <FileJson className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* FHIR Modal */}
      {isFhirModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <FileJson className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">FHIR Resource Bundle</h2>
                  <p className="text-xs text-slate-500">Standard Healthcare Interoperability Format</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyFHIR}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                >
                  {copySuccess ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copySuccess ? 'Copied' : 'Copy JSON'}
                </button>
                <button
                  onClick={() => setIsFhirModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto bg-slate-50 p-6">
              <pre className="text-xs font-mono text-slate-800 bg-white p-4 rounded-lg border border-slate-200 shadow-sm overflow-x-auto leading-relaxed">
                {fhirData}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Add imports at top
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function InstitutionAnalytics() {
  const [stats, setStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
    // Subscribe to relevant changes
    const sub = supabase
      .channel('inst-stats')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'log_entries' }, () => loadStats())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => loadStats())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'institutions' }, () => loadStats())
      .subscribe();

    return () => { sub.unsubscribe(); };
  }, []);

  const loadStats = async () => {
    try {
      const data = await api.getInstitutionStats();
      setStats(data || []);
    } catch (e) {
      console.error("Failed to load institution stats", e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6 text-center text-slate-500">Loading analytics...</div>;
  if (stats.length === 0) return <div className="p-6 text-center text-slate-500">No institution data available.</div>;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-200">
        <h3 className="text-slate-900">Hospital Analytics Overview</h3>
        <p className="text-xs text-slate-500 mt-1">Distribution across institutions</p>
      </div>
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((hospital) => {
          const chartData = [
            { name: 'Students', value: hospital.students },
            { name: 'Instructors', value: hospital.instructors },
            { name: 'Logs', value: hospital.total_logs },
          ];

          // Only render if there is some data, otherwise show empty state or just 0s
          const total = hospital.students + hospital.instructors + hospital.total_logs;

          return (
            <div key={hospital.id} className="h-[320px] bg-slate-50 rounded-lg p-4 border border-slate-100">
              <h4 className="text-sm font-semibold text-slate-800 text-center mb-1">{hospital.name}</h4>
              <p className="text-xs text-slate-500 text-center mb-4">Total Interactions: {total}</p>

              <ResponsiveContainer width="100%" height="80%">
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={5}
                  >
                    <Cell fill="#3b82f6" /> {/* Students - Blue */}
                    <Cell fill="#0d9488" /> {/* Instructors - Teal */}
                    <Cell fill="#8b5cf6" /> {/* Logs - Purple */}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          );
        })}
      </div>
    </div>
  );
}
