// Import icons from lucide-react for UI visuals
import { Users, UserCheck, Lock, TrendingUp, BookOpen, Clock } from 'lucide-react';

// Import React hooks
import { useState, useEffect } from 'react';

// Import reusable UI components
import { StatsCard } from '../StatsCard';
import { ActivityChart } from '../ActivityChart';
import { SpecialtyDistribution } from '../SpecialtyDistribution';

// Import API service for backend calls
import { api } from '../../services/api';

// Import Supabase client for realtime updates
import { supabase } from '../../lib/supabase';

// Dashboard main component
export function DashboardTab() {

  // State to store admin statistics
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalPreceptors: 0,
    totalEntries: 0
  });

  // State to handle loading status
  const [loading, setLoading] = useState(true);

  // useEffect runs when component loads
  useEffect(() => {

    // Function to fetch dashboard statistics
    const fetchStats = async () => {
      try {
        // API call to get admin statistics
        const data = await api.getAdminStats();
        setStats(data); // Update state with fetched data
      } catch (e) {
        console.error(e); // Log error if API fails
      } finally {
        setLoading(false); // Stop loading after API call
      }
    };

    // Call stats function on component load
    fetchStats();

    // Supabase realtime subscription for profiles and log entries
    const subscription = supabase
      .channel('admin_dashboard')

      // Listen for any changes in profiles table
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        () => fetchStats() // Refresh stats on change
      )

      // Listen for any changes in log_entries table
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'log_entries' },
        () => fetchStats() // Refresh stats on change
      )
      .subscribe();

    // Cleanup subscription when component unmounts
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Static monthly activity data (used for chart)
  const monthlyData = [
    { month: 'Aug', entries: 45, hours: 180 },
    { month: 'Sep', entries: 62, hours: 248 },
    { month: 'Oct', entries: 78, hours: 312 },
    { month: 'Nov', entries: 85, hours: 340 },
    { month: 'Dec', entries: 71, hours: 284 },
    { month: 'Jan', entries: 92, hours: 368 },
  ];

  // Specialty-wise distribution data (used for pie chart)
  const specialtyData = [
    { name: 'Emergency Medicine', value: 15 },
    { name: 'Internal Medicine', value: 12 },
    { name: 'Surgery', value: 8 },
    { name: 'Pediatrics', value: 10 },
    { name: 'Cardiology', value: 7 },
    { name: 'Psychiatry', value: 5 },
  ];

  // JSX returned to UI
  return (
    <div className="space-y-6">

      {/* Page Header */}
      <div>
        <h2 className="text-slate-900">Dashboard Overview</h2>
        <p className="text-slate-600 mt-1">
          Welcome back! Here's what's happening today.
        </p>
      </div>

      {/* Summary Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatsCard
          title="Total Students"
          value={loading ? "..." : stats.totalStudents.toString()}
          icon={<Users className="w-6 h-6" />}
          color="blue"
          subtitle="Registered users"
        />

        <StatsCard
          title="Total Preceptors"
          value={loading ? "..." : stats.totalPreceptors.toString()}
          icon={<UserCheck className="w-6 h-6" />}
          color="teal"
          subtitle="Clinical supervisors"
        />

        <StatsCard
          title="Total Log Entries"
          value={loading ? "..." : stats.totalEntries.toString()}
          icon={<BookOpen className="w-6 h-6" />}
          color="purple"
          subtitle="All time submissions"
        />
      </div>

      {/* Secondary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard
          title="Pending Reviews"
          value="36"
          icon={<BookOpen className="w-6 h-6" />}
          color="amber"
          subtitle="Awaiting approval"
        />

        <StatsCard
          title="Total Hours Logged"
          value="12,480"
          icon={<Clock className="w-6 h-6" />}
          color="green"
          subtitle="This semester"
        />

        <StatsCard
          title="Completion Rate"
          value="87%"
          icon={<TrendingUp className="w-6 h-6" />}
          color="blue"
          subtitle="Above target"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActivityChart data={monthlyData} />
        <SpecialtyDistribution data={specialtyData} />
      </div>

      {/* Recent Activity Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-slate-900">Recent Activity</h3>
        </div>

        <div className="p-6">
          <div className="space-y-4">

            {/* Loop through recent activities */}
            {[
              { student: 'Sarah Johnson', action: 'submitted new logbook entry', time: '2 hours ago', type: 'entry' },
              { student: 'Dr. Michael Chen', action: 'approved 3 entries', time: '4 hours ago', type: 'approval' },
              { student: 'Emily Chen', action: 'completed clinical rotation', time: '5 hours ago', type: 'completion' },
              { student: 'James Mitchell', action: 'requested logbook review', time: '1 day ago', type: 'request' },
            ].map((activity, index) => (

              // Individual activity card
              <div key={index} className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg">

                {/* Activity icon based on type */}
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    activity.type === 'entry'
                      ? 'bg-blue-100'
                      : activity.type === 'approval'
                      ? 'bg-green-100'
                      : activity.type === 'completion'
                      ? 'bg-purple-100'
                      : 'bg-amber-100'
                  }`}
                >
                  {activity.type === 'entry' && <BookOpen className="w-5 h-5 text-blue-600" />}
                  {activity.type === 'approval' && <UserCheck className="w-5 h-5 text-green-600" />}
                  {activity.type === 'completion' && <TrendingUp className="w-5 h-5 text-purple-600" />}
                  {activity.type === 'request' && <Clock className="w-5 h-5 text-amber-600" />}
                </div>

                {/* Activity text details */}
                <div className="flex-1">
                  <p className="text-slate-900">
                    <span className="font-medium">{activity.student}</span> {activity.action}
                  </p>
                  <p className="text-sm text-slate-500 mt-1">{activity.time}</p>
                </div>

              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
