import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { api } from '../services/api';

interface AddEntryModalProps {
  onClose: () => void;
  onSubmit: (entry: any) => void;
  initialData?: any;
  readOnly?: boolean;
}

const specialties = [
  'Emergency Medicine',
  'Internal Medicine',
  'Surgery',
  'Pediatrics',
  'Obstetrics & Gynecology',
  'Psychiatry',
  'Family Medicine',
  'Cardiology',
  'Neurology',
  'Orthopedics'
];

export function AddEntryModal({ onClose, onSubmit, initialData, readOnly = false }: AddEntryModalProps) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    hours: 0,
    location: '',
    specialty: specialties[0],
    activities: '',
    learningObjectives: '',
    reflection: '',
    supervisorName: '',
    patientId: '',
    patientAge: '',
    patientGender: 'Male'
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        date: initialData.date.split('T')[0],
        hours: initialData.hours,
        location: initialData.location,
        specialty: initialData.specialty,
        activities: initialData.activities,
        learningObjectives: initialData.learning_objectives || initialData.learningObjectives || '',
        reflection: initialData.reflection || '',
        supervisorName: initialData.supervisor_name || initialData.supervisorName || '',
        patientId: initialData.patient_id || initialData.patientId || '',
        patientAge: initialData.patient_age || initialData.patientAge || '',
        patientGender: initialData.patient_gender || initialData.patientGender || 'Male'
      });
    } else {
      const fetchPreceptor = async () => {
        try {
          const preceptor = await api.getAssignedPreceptor();
          if (preceptor && preceptor.full_name) {
            setFormData(prev => ({ ...prev, supervisorName: preceptor.full_name }));
          }
        } catch (err) {
          console.error('Failed to fetch preceptor', err);
        }
      };
      fetchPreceptor();
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly) return;

    onSubmit({
      ...formData,
      hours: Number(formData.hours),
      patientId: formData.patientId,
      patientAge: formData.patientAge,
      patientGender: formData.patientGender
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <h3 className="text-slate-900">Add Clinical Log Entry</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-700 mb-1">Date</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-700 mb-1">Total Time (Hours)</label>
              <input
                type="number"
                required
                min="0"
                step="0.5"
                placeholder="e.g. 8.0"
                value={formData.hours || ''}
                onChange={(e) => setFormData({ ...formData, hours: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Patient Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
            <div className="md:col-span-1">
              <label className="block text-sm text-slate-700 mb-1">Patient ID/Ref</label>
              <input
                type="text"
                required
                placeholder="e.g. #12345"
                value={formData.patientId}
                onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            <div className="md:col-span-1">
              <label className="block text-sm text-slate-700 mb-1">Age Group</label>
              <select
                required
                value={formData.patientAge}
                onChange={(e) => setFormData({ ...formData, patientAge: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              >
                <option value="">Select...</option>
                <option value="infant">Infant (0-1 yr)</option>
                <option value="child">Child (1-18 yrs)</option>
                <option value="adult">Adult (19-64 yrs)</option>
                <option value="geriatric">Geriatric (65+ yrs)</option>
              </select>
            </div>
            <div className="md:col-span-1">
              <label className="block text-sm text-slate-700 mb-1">Gender</label>
              <select
                value={formData.patientGender}
                onChange={(e) => setFormData({ ...formData, patientGender: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-700 mb-1">Clinical Location</label>
            <input
              type="text"
              required
              placeholder="e.g., City General Hospital"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-700 mb-1">Specialty/Department</label>
            <select
              required
              value={formData.specialty}
              onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {specialties.map((specialty) => (
                <option key={specialty} value={specialty}>{specialty}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-slate-700 mb-1">Supervisor Name (Preceptor)</label>
            <input
              type="text"
              required
              readOnly
              placeholder="Loading assigned preceptor..."
              value={formData.supervisorName}
              onChange={(e) => setFormData({ ...formData, supervisorName: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-100 text-slate-600 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-700 mb-1">Clinical Activities</label>
            <textarea
              required
              rows={3}
              placeholder="Describe the clinical activities performed..."
              value={formData.activities}
              onChange={(e) => setFormData({ ...formData, activities: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-700 mb-1">Learning Objectives Met</label>
            <textarea
              required
              rows={3}
              placeholder="List the learning objectives achieved..."
              value={formData.learningObjectives}
              onChange={(e) => setFormData({ ...formData, learningObjectives: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-700 mb-1">Personal Reflection</label>
            <textarea
              required
              rows={3}
              placeholder="Reflect on your experience..."
              value={formData.reflection}
              onChange={(e) => setFormData({ ...formData, reflection: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Close
            </button>
            {!readOnly && (
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-lg hover:from-blue-700 hover:to-teal-700 transition-all"
              >
                Submit Entry
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
