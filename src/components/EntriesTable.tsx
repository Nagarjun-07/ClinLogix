import { ClinicalEntry } from '../App';
import { Calendar, MapPin, Clock, Eye, Users } from 'lucide-react';

interface EntriesTableProps {
  entries: ClinicalEntry[];
  showStudent: boolean;
  onReview?: (entry: ClinicalEntry) => void;
}

const statusColors = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

const statusLabels = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Needs Revision',
};

export function EntriesTable({ entries, showStudent, onReview }: EntriesTableProps) {
  if (entries.length === 0) {
    return (
      <div className="p-12 text-center text-slate-500">
        <BookOpen className="w-12 h-12 mx-auto mb-3 text-slate-300" />
        <p>No entries found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="px-6 py-3 text-left text-xs text-slate-600 uppercase tracking-wider">Date</th>
            {showStudent && <th className="px-6 py-3 text-left text-xs text-slate-600 uppercase tracking-wider">Student</th>}
            <th className="px-6 py-3 text-left text-xs text-slate-600 uppercase tracking-wider">Location</th>
            <th className="px-6 py-3 text-left text-xs text-slate-600 uppercase tracking-wider">Specialty</th>
            <th className="px-6 py-3 text-left text-xs text-slate-600 uppercase tracking-wider">Patients Seen</th>
            <th className="px-6 py-3 text-left text-xs text-slate-600 uppercase tracking-wider">Hours</th>
            <th className="px-6 py-3 text-left text-xs text-slate-600 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3 text-left text-xs text-slate-600 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {entries.map((entry) => (
            <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-6 py-4">
                <div className="flex items-center gap-2 text-sm text-slate-900">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
              </td>
              {showStudent && (
                <td className="px-6 py-4">
                  <p className="text-sm text-slate-900">{entry.studentName}</p>
                </td>
              )}
              <td className="px-6 py-4">
                <div className="flex items-center gap-2 text-sm text-slate-700">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  {entry.location}
                </div>
              </td>
              <td className="px-6 py-4">
                <span className="inline-flex px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                  {entry.specialty}
                </span>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2 text-sm text-slate-700">
                  <Users className="w-4 h-4 text-slate-400" />
                  {entry.patientsSeen || 0}
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2 text-sm text-slate-700">
                  <Clock className="w-4 h-4 text-slate-400" />
                  {entry.hours}h
                </div>
              </td>
              <td className="px-6 py-4">
                <span className={`inline-flex px-2 py-1 rounded-full text-xs ${statusColors[entry.status]}`}>
                  {statusLabels[entry.status]}
                </span>
              </td>
              <td className="px-6 py-4">
                {onReview && showStudent && entry.status === 'pending' ? (
                  <button
                    onClick={() => onReview(entry)}
                    className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                  >
                    <Eye className="w-4 h-4" />
                    Review
                  </button>
                ) : (
                  <button
                    onClick={() => onReview && onReview(entry)}
                    className={`flex items-center gap-1 text-sm ${!onReview ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:text-blue-600 transition-colors'
                      }`}
                    disabled={!onReview}
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BookOpen({ className }: { className: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  );
}
