import { UserRole } from '../App';
import { GraduationCap, UserCircle, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { ViewSwitcher } from './ViewSwitcher';

interface HeaderProps {
  currentRole: UserRole;
  currentUser: { id: string; name: string; email: string };
  onRoleChange: (role: UserRole) => void;
  currentView?: 'dashboard' | 'logbook' | 'review';
  onViewChange?: (view: 'dashboard' | 'logbook' | 'review') => void;
}

export function Header({ currentRole, currentUser, onRoleChange, currentView = 'dashboard', onViewChange }: HeaderProps) {
  const [showDropdown, setShowDropdown] = useState(false);

  const roleLabels: Record<UserRole, string> = {
    student: 'Student',
    instructor: 'Instructor',
    admin: 'Administrator'
  };

  return (
    <header className="bg-white border-b border-slate-200 shadow-sm">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-600 to-teal-600 rounded-lg">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-slate-900">Clinical Logbook</h1>
              <p className="text-xs text-slate-500">Management System</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* View Switcher */}
            {(currentRole === 'student' || currentRole === 'instructor') && onViewChange && (
              <ViewSwitcher
                currentRole={currentRole as 'student' | 'instructor'}
                currentView={currentView}
                onViewChange={onViewChange}
              />
            )}

            {/* Role Selector - Demo purposes */}
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <span className="text-sm text-slate-600">View as: {roleLabels[currentRole]}</span>
                <ChevronDown className="w-4 h-4 text-slate-500" />
              </button>
              
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-2 z-50">
                  {(['student', 'instructor', 'admin'] as UserRole[]).map((role) => (
                    <button
                      key={role}
                      onClick={() => {
                        onRoleChange(role);
                        setShowDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition-colors ${
                        currentRole === role ? 'text-blue-600 bg-blue-50' : 'text-slate-700'
                      }`}
                    >
                      {roleLabels[role]}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
              <div className="text-right">
                <p className="text-sm text-slate-900">{currentUser.name}</p>
                <p className="text-xs text-slate-500">{currentUser.email}</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-teal-600 rounded-full flex items-center justify-center">
                <UserCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}