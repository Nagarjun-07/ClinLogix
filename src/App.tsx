import { useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { StudentDashboard } from './components/StudentDashboard';
import { InstructorDashboard } from './components/InstructorDashboard';
import { DashboardTab } from './components/admin/DashboardTab';
import { UserManagementTab } from './components/admin/UserManagementTab';
import { PreceptorsTab } from './components/admin/PreceptorsTab';
import { AssignPreceptorTab } from './components/admin/AssignPreceptorTab';
import { LockLogbookTab } from './components/admin/LockLogbookTab';
import { StudentLogbookPage } from './components/student/StudentLogbookPage';

import { AppHeader } from './components/AppHeader';
import { LoginPage } from './components/LoginPage';
import { PreceptorReviewPage } from './components/preceptor/PreceptorReviewPage';
import { supabase } from './lib/supabase';
import { api, Profile } from './services/api';

export type UserRole = 'student' | 'instructor' | 'admin';

export interface ClinicalEntry {
  id: string;
  studentId: string;
  studentName: string;
  date: string;
  location: string;
  specialty: string;
  hours: number;
  activities: string;
  learningObjectives: string;
  reflection: string;
  supervisorName: string;
  status: 'pending' | 'approved' | 'rejected';
  feedback?: string;
  submittedAt: string;
  patientsSeen: number;
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentRole, setCurrentRole] = useState<UserRole>('student');
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; email: string; institutionId?: string } | null>(null);
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        api.getCurrentUser().then((profile) => {
          if (profile) {
            initializeUser(profile);
          }
        });
      } else {
        setIsLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: string, session: Session | null) => {
      if (session) {
        api.getCurrentUser().then((profile) => {
          if (profile) {
            initializeUser(profile);
          }
        });
      } else {
        setIsAuthenticated(false);
        setCurrentUser(null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const initializeUser = (profile: Profile) => {
    setCurrentUser({
      id: profile.id,
      name: profile.full_name || profile.email,
      email: profile.email,
      institutionId: profile.institution_id
    });
    setCurrentRole(profile.role);
    // Set default view based on role
    if (profile.role === 'admin') {
      setCurrentView('admin-dashboard');
    } else {
      setCurrentView('dashboard');
    }
    setIsAuthenticated(true);
    setIsLoading(false);
  };

  // Also handle manual role change view reset
  const handleRoleChange = (role: UserRole) => {
    setCurrentRole(role);
    if (role === 'admin') {
      setCurrentView('admin-dashboard');
    } else {
      setCurrentView('dashboard');
    }
  };

  const handleSignOut = async () => {
    await api.signOut();
    setIsAuthenticated(false);
    setCurrentUser(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader
        currentUser={currentUser!}
        currentRole={currentRole}
        onRoleChange={handleRoleChange}
        currentView={currentView}
        onViewChange={setCurrentView}
        onSignOut={handleSignOut}
      />
      <main className="flex-1 container mx-auto p-4 md:p-8">
        {/* Student View */}
        {currentRole === 'student' && currentView === 'dashboard' && <StudentDashboard currentUser={currentUser!} onViewChange={setCurrentView} />}
        {currentRole === 'student' && currentView === 'logbook' && <StudentLogbookPage />}

        {/* Instructor View */}
        {currentRole === 'instructor' && currentView === 'dashboard' && <InstructorDashboard currentUser={currentUser!} />}
        {currentRole === 'instructor' && currentView === 'review' && <PreceptorReviewPage />}

        {/* Admin View */}
        {currentRole === 'admin' && (
          <>
            {currentView === 'admin-dashboard' && <DashboardTab />}
            {currentView === 'admin-students' && <UserManagementTab institutionId={currentUser?.institutionId} />}
            {currentView === 'admin-preceptors' && <PreceptorsTab />}
            {currentView === 'admin-assign' && <AssignPreceptorTab />}
            {currentView === 'admin-lock' && <LockLogbookTab />}
          </>
        )}
      </main>
    </div>
  );
}

export default App;