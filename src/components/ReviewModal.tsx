import { useState } from 'react';
import { X, CheckCircle, XCircle, Calendar, MapPin, Clock, User } from 'lucide-react';
import { ClinicalEntry } from '../App';

interface ReviewModalProps {
  entry: ClinicalEntry;
  onClose: () => void;
  onSubmit: (entryId: string, status: 'approved' | 'rejected', feedback: string) => void;
}

export function ReviewModal({ entry, onClose, onSubmit }: ReviewModalProps) {
  const [feedback, setFeedback] = useState('');
  const [reviewStatus, setReviewStatus] = useState<'approved' | 'rejected' | null>(null);

  const handleSubmit = () => {
    if (!reviewStatus) return;
    onSubmit(entry.id, reviewStatus, feedback);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <h3 className="text-slate-900">Review Log Entry</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Entry Details */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-slate-400" />
              <div>
                <p className="text-xs text-slate-500">Student</p>
                <p className="text-sm text-slate-900">{entry.studentName}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <div>
                <p className="text-xs text-slate-500">Date</p>
                <p className="text-sm text-slate-900">
                  {new Date(entry.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-slate-400" />
              <div>
                <p className="text-xs text-slate-500">Location</p>
                <p className="text-sm text-slate-900">{entry.location}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <div>
                <p className="text-xs text-slate-500">Hours</p>
                <p className="text-sm text-slate-900">{entry.hours} hours</p>
              </div>
            </div>
          </div>

          <div>
            <p className="text-sm text-slate-600 mb-2">Specialty</p>
            <span className="inline-flex px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm">
              {entry.specialty}
            </span>
          </div>

          <div>
            <p className="text-sm text-slate-600 mb-2">Supervisor</p>
            <p className="text-slate-900">{entry.supervisorName}</p>
          </div>

          <div>
            <p className="text-sm text-slate-600 mb-2">Clinical Activities</p>
            <p className="text-slate-700 leading-relaxed">{entry.activities}</p>
          </div>

          <div>
            <p className="text-sm text-slate-600 mb-2">Learning Objectives</p>
            <p className="text-slate-700 leading-relaxed">{entry.learningObjectives}</p>
          </div>

          <div>
            <p className="text-sm text-slate-600 mb-2">Student Reflection</p>
            <p className="text-slate-700 leading-relaxed">{entry.reflection}</p>
          </div>

          {/* Review Section */}
          <div className="border-t border-slate-200 pt-6">
            <p className="text-sm text-slate-900 mb-3">Your Feedback</p>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={4}
              placeholder="Provide constructive feedback for the student..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setReviewStatus('rejected')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-all ${
                reviewStatus === 'rejected'
                  ? 'bg-red-50 border-red-500 text-red-700'
                  : 'border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <XCircle className="w-5 h-5" />
              Request Revision
            </button>
            <button
              onClick={() => setReviewStatus('approved')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-all ${
                reviewStatus === 'approved'
                  ? 'bg-green-50 border-green-500 text-green-700'
                  : 'border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <CheckCircle className="w-5 h-5" />
              Approve Entry
            </button>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!reviewStatus}
            className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-lg hover:from-blue-700 hover:to-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Submit Review
          </button>
        </div>
      </div>
    </div>
  );
}
