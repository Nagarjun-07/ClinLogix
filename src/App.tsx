import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';

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
  isLocked?: boolean;
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; email: string; institutionId?: string, role: UserRole } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('access_token');
    if (token) {
      try {
        const profile = await api.getCurrentUser();
        if (profile) {
          initializeUser(profile);
        } else {
          handleLogout();
        }
      } catch {
        handleLogout();
      }
    } else {
      setIsLoading(false);
    }
  };

  const initializeUser = (profile: Profile) => {
    setCurrentUser({
      id: profile.id,
      name: profile.full_name || profile.email,
      email: profile.email,
      institutionId: profile.institution_id,
      role: profile.role
    });
    setIsAuthenticated(true);
    setIsLoading(false);
  };

  const handleLogout = async () => {
    await api.signOut();
    setIsAuthenticated(false);
    setCurrentUser(null);
    setIsLoading(false); // Ensure loading stops
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Layout wrapper (Private Route)
  const PrivateLayout = ({ role, children }: { role?: UserRole, children: React.ReactNode }) => {
    if (!isAuthenticated || !currentUser) {
      return <Navigate to="/login" replace state={{ from: location }} />;
    }

    if (role && currentUser.role !== role) {
      // Redirect to their own dashboard
      return <Navigate to={`/${currentUser.role}/dashboard`} replace />;
    }

    return (
      <div className="min-h-screen bg-background flex flex-col">
        <AppHeader
          currentUser={currentUser}
          currentRole={currentUser.role}
          onSignOut={handleLogout}
        />
        <main className="flex-1 container mx-auto p-4 md:p-8">
          {children}
        </main>
      </div>
    );
  };

  return (
    <Routes>
      <Route path="/login" element={
        !isAuthenticated ? <LoginPage /> : <Navigate to={`/${currentUser?.role}/dashboard`} replace />
      } />

      {/* Student Routes */}
      <Route path="/student/*" element={
        <PrivateLayout role="student">
          <Routes>
            <Route path="dashboard" element={<StudentDashboard currentUser={currentUser!} onViewChange={() => { }} />} />
            <Route path="logbook" element={<StudentLogbookPage />} />
            <Route path="*" element={<Navigate to="dashboard" replace />} />
          </Routes>
        </PrivateLayout>
      } />

      {/* Instructor Routes */}
      <Route path="/instructor/*" element={
        <PrivateLayout role="instructor">
          <Routes>
            <Route path="dashboard" element={<InstructorDashboard currentUser={currentUser!} />} />
            <Route path="review" element={<PreceptorReviewPage />} />
            <Route path="*" element={<Navigate to="dashboard" replace />} />
          </Routes>
        </PrivateLayout>
      } />

      {/* Admin Routes */}
      <Route path="/admin/*" element={
        <PrivateLayout role="admin">
          <Routes>
            <Route path="dashboard" element={<DashboardTab />} />
            <Route path="students" element={<UserManagementTab institutionId={currentUser?.institutionId} />} />
            <Route path="preceptors" element={<PreceptorsTab />} />
            <Route path="assign" element={<AssignPreceptorTab />} />
            <Route path="lock" element={<LockLogbookTab />} />
            <Route path="*" element={<Navigate to="dashboard" replace />} />
          </Routes>
        </PrivateLayout>
      } />

      {/* Root redirect */}
      <Route path="/" element={
        isAuthenticated ? <Navigate to={`/${currentUser?.role}/dashboard`} replace /> : <Navigate to="/login" replace />
      } />

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;