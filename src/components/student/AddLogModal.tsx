import { useState } from 'react';
import { X, Calendar, Users, FileText } from 'lucide-react';

interface LogEntry {
  date: string;
  activities: string;
  patientsSeen: number;
  reflection: string;
}

interface AddLogModalProps {
  initialData?: LogEntry;
  onClose: () => void;
  onSubmit: (logData: LogEntry) => void;
}

export function AddLogModal({ initialData, onClose, onSubmit }: AddLogModalProps) {
  const [formData, setFormData] = useState<LogEntry>(initialData || {
    date: new Date().toISOString().split('T')[0],
    activities: '',
    patientsSeen: 0,
    reflection: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <h3 className="text-slate-900">{initialData ? 'Edit' : 'Add'} Daily Log Entry</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Date Picker */}
          <div>
            <label className="block text-sm text-slate-700 mb-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Date
              </div>
            </label>
            <input
              type="date"
              required
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Patients Seen */}
          <div>
            <label className="block text-sm text-slate-700 mb-2">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Patients Seen
              </div>
            </label>
            <input
              type="number"
              required
              min="0"
              value={formData.patientsSeen}
              onChange={(e) => setFormData({ ...formData, patientsSeen: parseInt(e.target.value) })}
              placeholder="Number of patients"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Activities */}
          <div>
            <label className="block text-sm text-slate-700 mb-2">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Clinical Activities
              </div>
            </label>
            <textarea
              required
              rows={4}
              value={formData.activities}
              onChange={(e) => setFormData({ ...formData, activities: e.target.value })}
              placeholder="Describe the clinical activities performed today..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Reflection */}
          <div>
            <label className="block text-sm text-slate-700 mb-2">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Personal Reflection
              </div>
            </label>
            <textarea
              required
              rows={4}
              value={formData.reflection}
              onChange={(e) => setFormData({ ...formData, reflection: e.target.value })}
              placeholder="Reflect on your learning experiences and challenges..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-lg hover:from-blue-700 hover:to-teal-700 transition-all"
            >
              {initialData ? 'Update' : 'Save'} Entry
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
