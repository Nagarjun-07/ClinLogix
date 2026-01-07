import { BookOpen, LayoutDashboard, FileCheck } from 'lucide-react';

interface ViewSwitcherProps {
  currentRole: 'student' | 'instructor';
  currentView: 'dashboard' | 'logbook' | 'review';
  onViewChange: (view: 'dashboard' | 'logbook' | 'review') => void;
}

export function ViewSwitcher({ currentRole, currentView, onViewChange }: ViewSwitcherProps) {
  if (currentRole === 'student') {
    return (
      <div className="flex gap-2 bg-white rounded-lg p-1 border border-slate-200">
        <button
          onClick={() => onViewChange('dashboard')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
            currentView === 'dashboard'
              ? 'bg-gradient-to-r from-blue-600 to-teal-600 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          Dashboard
        </button>
        <button
          onClick={() => onViewChange('logbook')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
            currentView === 'logbook'
              ? 'bg-gradient-to-r from-blue-600 to-teal-600 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          My Logbook
        </button>
      </div>
    );
  }

  if (currentRole === 'instructor') {
    return (
      <div className="flex gap-2 bg-white rounded-lg p-1 border border-slate-200">
        <button
          onClick={() => onViewChange('dashboard')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
            currentView === 'dashboard'
              ? 'bg-gradient-to-r from-blue-600 to-teal-600 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          Dashboard
        </button>
        <button
          onClick={() => onViewChange('review')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
            currentView === 'review'
              ? 'bg-gradient-to-r from-blue-600 to-teal-600 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          Review Logbooks
        </button>
      </div>
    );
  }

  return null;
}
