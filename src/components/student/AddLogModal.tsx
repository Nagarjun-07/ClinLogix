import { useState, useEffect } from 'react';
import { X, Calendar, Users, FileText } from 'lucide-react';
import { api } from '../../services/api';

interface LogEntry {
  date: string;
  activities: string;
  patientsSeen: number;
  hours: number;
  reflection: string;
  supervisorName?: string;
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
    hours: 0,
    reflection: '',
    supervisorName: '',
  });

  const [supervisors, setSupervisors] = useState<any[]>([]);
  const [institutionName, setInstitutionName] = useState('Loading...');
  const [isPreceptorAssigned, setIsPreceptorAssigned] = useState(false);

  useEffect(() => {
    async function loadContext() {
      try {
        // 1. Get Institution Name
        const user = await api.getCurrentUser();
        setInstitutionName(user?.institution_name || 'No Institution Assigned');

        // 2. Get Supervisors
        const sups = await api.getInstitutionInstructors();
        setSupervisors(sups || []);

        // 3. Get Assigned Preceptor
        const assigned = await api.getAssignedPreceptor();
        if (assigned) {
          setIsPreceptorAssigned(true);
          // Only override if not editing or empty
          if (!initialData?.supervisorName) {
            setFormData(prev => ({ ...prev, supervisorName: assigned.full_name }));
          }
        }
      } catch (e) {
        console.error("Failed to load institution context", e);
        setInstitutionName('Error loading details');
      }
    }
    loadContext();
  }, []);

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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            {/* Total Hours - New Field */}
            <div>
              <label className="block text-sm text-slate-700 mb-2">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Total Time (Hours)
                </div>
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.5"
                value={formData.hours}
                onChange={(e) => setFormData({ ...formData, hours: parseFloat(e.target.value) })}
                placeholder="e.g. 8.0"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
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

          {/* Supervisor & Hospital */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-700 mb-2">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Hospital (Institution)
                </div>
              </label>
              <input
                type="text"
                readOnly
                value={institutionName}
                placeholder="Not assigned"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-700 mb-2">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Supervisor
                </div>
              </label>
              <select
                required
                value={formData.supervisorName}
                disabled={isPreceptorAssigned}
                onChange={(e) => setFormData({ ...formData, supervisorName: e.target.value })}
                className={`w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isPreceptorAssigned ? 'bg-slate-100 cursor-not-allowed' : ''}`}
              >
                <option value="">Select Supervisor</option>
                {supervisors.map((sup: any) => (
                  <option key={sup.id} value={sup.full_name}>
                    {sup.full_name}
                  </option>
                ))}
                {supervisors.length === 0 && <option value="Assigned Preceptor">Assigned Preceptor (Default)</option>}
                {/* Fallback if assigned preceptor is not in list (unexpected but possible) */}
                {isPreceptorAssigned && formData.supervisorName && !supervisors.find(s => s.full_name === formData.supervisorName) && (
                  <option value={formData.supervisorName}>{formData.supervisorName}</option>
                )}
              </select>
            </div>
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
