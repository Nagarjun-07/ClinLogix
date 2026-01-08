import { Search, Lock, Unlock, AlertCircle, Calendar } from 'lucide-react';
import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useToast } from '../ui/Toast';

interface Logbook {
  id: string; // student ID
  studentName: string;
  studentEmail: string;
  term: string;
  totalEntries: number;
  totalHours: number;
  lastEntry: string | null;
  isLocked: boolean;
  lockedDate?: string;
}

export function LockLogbookTab() {
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [logbooks, setLogbooks] = useState<Logbook[]>([]);
  const [selectedLogbooks, setSelectedLogbooks] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await api.getLogbookStats();
      setLogbooks(data);
    } catch (error) {
      console.error('Failed to load logbook stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredLogbooks = logbooks.filter(logbook =>
    (logbook.studentName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (logbook.studentEmail || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleLock = async (id: string, currentStatus: boolean, term: string) => {
    try {
      await api.toggleLockLogbook(id, term, !currentStatus);

      // Update local state directly for responsiveness, or reload
      setLogbooks(logbooks.map(logbook =>
        logbook.id === id
          ? {
            ...logbook,
            isLocked: !currentStatus,
            lockedDate: !currentStatus ? new Date().toISOString() : undefined
          }
          : logbook
      ));
    } catch (error) {
      console.error('Failed to toggle lock:', error);
      showToast('Failed to update lock status', 'error');
    }
  };

  const handleBulkLock = async () => {
    try {
      // Process in parallel
      await Promise.all(selectedLogbooks.map(async (studentId) => {
        const student = logbooks.find(l => l.id === studentId);
        if (student && !student.isLocked) {
          await api.toggleLockLogbook(studentId, student.term, true);
        }
      }));

      // Refresh
      await loadData();
      setSelectedLogbooks([]);
    } catch (error) {
      console.error('Bulk lock failed:', error);
      showToast('Failed to process some locks', 'error');
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedLogbooks(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-slate-900">Lock Logbook</h2>
        <p className="text-slate-600 mt-1">Manage logbook access and lock completed terms</p>
      </div>

      {/* Info Alert */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-amber-900">
              Locking a logbook prevents students from adding or editing entries. This action should be performed at the end of each term.
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <p className="text-sm text-slate-600 mb-1">Total Logbooks</p>
          <p className="text-2xl text-slate-900">{logbooks.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <p className="text-sm text-slate-600 mb-1">Locked</p>
          <p className="text-2xl text-purple-600">{logbooks.filter(l => l.isLocked).length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <p className="text-sm text-slate-600 mb-1">Active</p>
          <p className="text-2xl text-green-600">{logbooks.filter(l => !l.isLocked).length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <p className="text-sm text-slate-600 mb-1">Selected</p>
          <p className="text-2xl text-blue-600">{selectedLogbooks.length}</p>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search logbooks..."
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={handleBulkLock}
            disabled={selectedLogbooks.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Lock className="w-5 h-5" />
            Lock Selected ({selectedLogbooks.length})
          </button>
        </div>
      </div>

      {/* Logbooks Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-8 text-center text-slate-500">Loading logbook settings...</div>
          ) : (
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedLogbooks.length === logbooks.filter(l => !l.isLocked).length && logbooks.filter(l => !l.isLocked).length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedLogbooks(logbooks.filter(l => !l.isLocked).map(l => l.id));
                        } else {
                          setSelectedLogbooks([]);
                        }
                      }}
                      className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-2 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs text-slate-600 uppercase tracking-wider">Student</th>
                  <th className="px-6 py-3 text-left text-xs text-slate-600 uppercase tracking-wider">Term</th>
                  <th className="px-6 py-3 text-left text-xs text-slate-600 uppercase tracking-wider">Progress</th>
                  <th className="px-6 py-3 text-left text-xs text-slate-600 uppercase tracking-wider">Last Entry</th>
                  <th className="px-6 py-3 text-left text-xs text-slate-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs text-slate-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredLogbooks.map((logbook) => (
                  <tr key={logbook.id} className={`hover:bg-slate-50 transition-colors ${logbook.isLocked ? 'bg-slate-25' : ''}`}>
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedLogbooks.includes(logbook.id)}
                        onChange={() => toggleSelection(logbook.id)}
                        disabled={logbook.isLocked}
                        className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-slate-900">{logbook.studentName}</p>
                        <p className="text-sm text-slate-500">{logbook.studentEmail}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-700">{logbook.term}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <p className="text-sm text-slate-900">{logbook.totalEntries} entries</p>
                        <p className="text-sm text-slate-500">{logbook.totalHours} hours</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {logbook.lastEntry && <Calendar className="w-4 h-4 text-slate-400" />}
                        <span className="text-sm text-slate-700">
                          {logbook.lastEntry ? new Date(logbook.lastEntry).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Never'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {logbook.isLocked ? (
                        <div>
                          <span className="inline-flex px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
                            Locked
                          </span>
                          {logbook.lockedDate && (
                            <p className="text-xs text-slate-500 mt-1">
                              {new Date(logbook.lockedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleLock(logbook.id, logbook.isLocked, logbook.term)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${logbook.isLocked
                          ? 'text-green-600 hover:bg-green-50'
                          : 'text-purple-600 hover:bg-purple-50'
                          }`}
                      >
                        {logbook.isLocked ? (
                          <>
                            <Unlock className="w-4 h-4" />
                            <span className="text-sm">Unlock</span>
                          </>
                        ) : (
                          <>
                            <Lock className="w-4 h-4" />
                            <span className="text-sm">Lock</span>
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
