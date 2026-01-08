import { useState, useEffect } from 'react';
import { Search, CheckCircle, User, Calendar, Stethoscope, Clock, MessageSquare, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '../../services/api';

interface ApprovedEntry {
    id: string;
    student_name: string;
    date: string;
    specialty: string;
    hours: number;
    supervisor_name: string; // Instructor
    feedback: string;
    status: string;
    activities: string;
}

export function ReviewEntriesTab() {
    const [entries, setEntries] = useState<ApprovedEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Pagination State
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const PAGE_SIZE = 10;

    useEffect(() => {
        loadEntries();
    }, [page]); // Reload when page changes

    const loadEntries = async () => {
        setLoading(true);
        try {
            // Pass page and limit (and potentially search if backend supported it)
            const data = await api.getAdminApprovedReviews(page, PAGE_SIZE);

            // Use the response structure { results, total_count, num_pages, current_page }
            if (data && data.results) {
                setEntries(data.results);
                setTotalPages(data.num_pages);
                setTotalCount(data.total_count);
            } else {
                // Fallback if backend not ready
                setEntries(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error('Failed to load approved reviews:', error);
        } finally {
            setLoading(false);
        }
    };

    // Client-side filtering for current page (limited, but keeps existing functionality)
    const filteredEntries = entries.filter(entry =>
        entry.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.specialty?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.supervisor_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Review Approved Logs</h1>
                    <p className="text-slate-500">View all clinical logs approved by instructors</p>
                </div>
            </div>

            {/* Search */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search student, specialty, or instructor (current page)..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                {loading ? (
                    <div className="p-8 text-center text-slate-500">Loading approved entries...</div>
                ) : filteredEntries.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">No approved entries found.</div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200">
                                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Student</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Date & Specialty</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Details (Hours)</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Instructor</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Feedback</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredEntries.map((entry) => (
                                        <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium text-sm">
                                                        {entry.student_name ? entry.student_name.charAt(0) : '?'}
                                                    </div>
                                                    <span className="font-medium text-slate-900">{entry.student_name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2 text-slate-900">
                                                        <Stethoscope className="w-3.5 h-3.5 text-slate-400" />
                                                        <span className="font-medium">{entry.specialty || 'Unspecified'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm text-slate-500">
                                                        <Calendar className="w-3.5 h-3.5" />
                                                        <span>{entry.date}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <Clock className="w-4 h-4 text-slate-400" />
                                                    <span className="font-medium text-slate-900">{entry.hours} hrs</span>
                                                </div>
                                                <p className="text-xs text-slate-500 mt-1 line-clamp-1 max-w-[150px]" title={entry.activities}>
                                                    {entry.activities}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-slate-700">
                                                    <User className="w-4 h-4 text-slate-400" />
                                                    <span>{entry.supervisor_name || 'N/A'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {entry.feedback ? (
                                                    <div className="flex items-start gap-2 max-w-xs">
                                                        <MessageSquare className="w-4 h-4 text-emerald-500 mt-0.5" />
                                                        <span className="text-sm text-slate-600 line-clamp-2" title={entry.feedback}>
                                                            {entry.feedback}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-slate-400 italic">No feedback</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                                                    <CheckCircle className="w-3.5 h-3.5" />
                                                    Approved
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Controls */}
                        <div className="border-t border-slate-200 px-6 py-4 flex items-center justify-between">
                            <div className="text-sm text-slate-500">
                                Showing page <span className="font-medium text-slate-900">{page}</span> of <span className="font-medium text-slate-900">{totalPages}</span>
                                <span className="ml-2">({totalCount} total)</span>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
