// Import React's useState hook for managing component state
import { useState } from 'react';

// Import icons from lucide-react for UI visuals
import { X, Calendar, Users, FileText } from 'lucide-react';

/**
 * Interface defining the shape of a single daily log entry
 * This ensures type safety across the component
 */
interface LogEntry {
  date: string;           // Date of the log entry (YYYY-MM-DD)
  activities: string;     // Description of clinical activities performed
  patientsSeen: number;  // Number of patients seen on that day
  reflection: string;    // Personal reflection for the day
}

/**
 * Props interface for the AddLogModal component
 */
interface AddLogModalProps {
  initialData?: LogEntry;             // Optional data for edit mode
  onClose: () => void;                // Callback to close the modal
  onSubmit: (logData: LogEntry) => void; // Callback to submit form data
}

/**
 * Modal component for adding or editing a daily clinical log
 */
export function AddLogModal({ initialData, onClose, onSubmit }: AddLogModalProps) {

  /**
   * State to store and manage form data
   * - If initialData exists, populate form for editing
   * - Otherwise, initialize with default values for new entry
   */
  const [formData, setFormData] = useState<LogEntry>(
    initialData || {
      date: new Date().toISOString().split('T')[0], // Default to today's date
      activities: '',                               // Empty activities field
      patientsSeen: 0,                              // Default patient count
      reflection: '',                               // Empty reflection
    }
  );

  /**
   * Handles form submission
   * - Prevents default browser refresh
   * - Passes collected form data to parent component
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    // Modal overlay covering the entire screen
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">

      {/* Modal container */}
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">

        {/* Modal header with title and close button */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <h3 className="text-slate-900">
            {initialData ? 'Edit' : 'Add'} Daily Log Entry
          </h3>

          {/* Close modal button */}
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form section */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">

          {/* Date Picker Field */}
          <div>
            <label className="block text-sm text-slate-700 mb-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Date
              </div>
            </label>

            {/* Date input */}
            <input
              type="date"
              required
              value={formData.date}
              onChange={(e) =>
                setFormData({ ...formData, date: e.target.value })
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Patients Seen Field */}
          <div>
            <label className="block text-sm text-slate-700 mb-2">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Patients Seen
              </div>
            </label>

            {/* Numeric input for patient count */}
            <input
              type="number"
              required
              min="0"
              value={formData.patientsSeen}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  patientsSeen: parseInt(e.target.value),
                })
              }
              placeholder="Number of patients"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Clinical Activities Field */}
          <div>
            <label className="block text-sm text-slate-700 mb-2">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Clinical Activities
              </div>
            </label>

            {/* Textarea for activities description */}
            <textarea
              required
              rows={4}
              value={formData.activities}
              onChange={(e) =>
                setFormData({ ...formData, activities: e.target.value })
              }
              placeholder="Describe the clinical activities performed today..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Personal Reflection Field */}
          <div>
            <label className="block text-sm text-slate-700 mb-2">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Personal Reflection
              </div>
            </label>

            {/* Textarea for personal reflection */}
            <textarea
              required
              rows={4}
              value={formData.reflection}
              onChange={(e) =>
                setFormData({ ...formData, reflection: e.target.value })
              }
              placeholder="Reflect on your learning experiences and challenges..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">

            {/* Cancel button closes the modal without saving */}
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>

            {/* Submit button saves or updates the log entry */}
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
