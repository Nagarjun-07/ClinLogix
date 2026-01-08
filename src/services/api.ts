import { supabase } from '../lib/supabase';
import { ClinicalEntry, UserRole } from '../App';

export interface Profile {
    id: string;
    email: string;
    full_name: string;
    role: UserRole;
    institution_id?: string;
}

export const api = {
    async getAuthorizedUsers(role: 'student' | 'instructor', institutionId?: string) {
        let query = supabase
            .from('authorized_users')
            .select('*')
            .eq('role', role);

        if (institutionId) {
            query = query.eq('institution_id', institutionId);
        }

        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    },

    async getCurrentUser() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        return profile as Profile;
    },

    async signOut() {
        await supabase.auth.signOut();
    },

    // Logs
    async getLogs(role: UserRole, userId: string) {
        let query = supabase.from('log_entries').select('*, profiles(full_name)');

        if (role === 'student') {
            query = query.eq('student_id', userId);
        }

        // Instructors/Admins see all (or filtered by RLS policies we set up)
        const { data, error } = await query.order('date', { ascending: false });

        if (error) throw error;

        // Map database snake_case to app camelCase if necessary, 
        // or just assume we align them. For now, let's map manually to be safe.
        return data.map((d: any) => ({
            id: d.id,
            studentId: d.student_id,
            studentName: d.profiles?.full_name || 'Unknown',
            date: d.date,
            location: d.location,
            specialty: d.specialty,
            hours: Number(d.hours),
            activities: d.activities,
            learningObjectives: d.learning_objectives,
            reflection: d.reflection,
            supervisorName: d.supervisor_name,
            status: d.status,
            feedback: d.feedback,
            submittedAt: d.submitted_at,
            patientsSeen: (d.patients_seen || 0)
        })) as ClinicalEntry[];
    },

    async createLog(entry: Omit<ClinicalEntry, 'id' | 'status' | 'submittedAt' | 'studentName'>) {
        const { data, error } = await supabase
            .from('log_entries')
            .insert([{
                student_id: entry.studentId,
                date: entry.date,
                location: entry.location,
                specialty: entry.specialty,
                hours: entry.hours,
                activities: entry.activities,
                learning_objectives: entry.learningObjectives,
                reflection: entry.reflection,
                supervisor_name: entry.supervisorName,
                patients_seen: entry.patientsSeen,
                status: 'pending'
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async updateLogStatus(id: string, status: 'approved' | 'rejected', feedback?: string) {
        const { data, error } = await supabase
            .from('log_entries')
            .update({ status, feedback })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },



    // User Management (Invites)
    async inviteUser(email: string, name: string, role: 'student' | 'instructor', institutionId?: string) {
        const { data: { user } } = await supabase.auth.getUser();

        const { data, error } = await supabase
            .from('authorized_users')
            .insert([{
                email,
                role,
                full_name: name,
                institution_id: institutionId,
                invited_by: user?.id
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async checkInvite(email: string) {
        const { data, error } = await supabase
            .from('authorized_users')
            .select('*')
            .eq('email', email)
            .single();

        if (error) return null; // Not found or error
        return data;
    },

    // ----------------------------------------------------------------------
    // PATIENTS & ASSIGNMENTS (New Architecture)
    // ----------------------------------------------------------------------

    /**
     * Fetch all patients for an institution (Admin/Preceptor view)
     */
    async getInstitutionPatients(institutionId: string) {
        const { data, error } = await supabase
            .from('patients')
            .select('*')
            .eq('institution_id', institutionId)
            .order('reference_id');

        if (error) throw error;
        return data;
    },

    /**
     * Create a new anonymized patient
     */
    async createPatient(patientData: { referenceId: string, ageGroup: string, gender: string, clinicalCategory: string, institutionId: string }) {
        const { data, error } = await supabase
            .from('patients')
            .insert([{
                reference_id: patientData.referenceId,
                age_group: patientData.ageGroup,
                gender: patientData.gender,
                clinical_category: patientData.clinicalCategory,
                institution_id: patientData.institutionId
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Assign a student to a preceptor (Enforces Max 5 limit via DB Trigger)
     */
    async assignStudentToPreceptor(studentId: string, preceptorId: string) {
        // First check if already assigned to THIS preceptor to avoid error
        // (Optional optimization: let DB handle it)

        const { data, error } = await supabase
            .from('student_preceptor_assignments')
            .insert([{
                student_id: studentId,
                preceptor_id: preceptorId,
                status: 'active'
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async assignPatientToStudent(studentId: string, patientId: string) {
        const { data: { user } } = await supabase.auth.getUser(); // assigned_by

        const { data, error } = await supabase
            .from('student_patient_assignments')
            .insert([{
                student_id: studentId,
                patient_id: patientId,
                assigned_by: user?.id
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Fetch patients assigned to a specific student
     */
    async getPreceptorsWithLoad(institutionId?: string) {
        let query = supabase
            .from('profiles')
            .select('*, student_preceptor_assignments(count)')
            .eq('role', 'instructor');

        if (institutionId) {
            query = query.eq('institution_id', institutionId);
        }

        const { data, error } = await query;
        if (error) throw error;

        // Transform to friendly format
        return data.map((p: any) => ({
            id: p.id,
            name: p.full_name,
            email: p.email,
            phone: p.phone || 'N/A', // Assuming phone exists in profile or we expect it
            specialty: p.specialty || 'General',
            institution: p.institution_id || 'N/A',
            studentsCount: p.student_preceptor_assignments?.[0]?.count || 0,
            status: 'active' // hardcoded or derive from authorized_users status
        }));
    },

    async getAdminStats(_institutionId?: string) {
        // Run queries in parallel
        const [students, preceptors, logs] = await Promise.all([
            supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
            supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'instructor'),
            supabase.from('log_entries').select('*', { count: 'exact', head: true })
        ]);

        return {
            totalStudents: students.count || 0,
            totalPreceptors: preceptors.count || 0,
            totalEntries: logs.count || 0,
            activeSupervisors: 0 // Placeholder or would need complex query
        };
    },

    async getStudentPatients(studentId: string) {
        // Join through the assignment table
        const { data, error } = await supabase
            .from('student_patient_assignments')
            .select('*, patients(*)')
            .eq('student_id', studentId);

        if (error) throw error;
        // Flatten the response
        return data.map((d: any) => d.patients);
    },

    async getInstructorStudents(instructorId: string) {
        const { data, error } = await supabase
            .from('student_preceptor_assignments')
            .select('student_id, profiles!student_preceptor_assignments_student_id_fkey(*)')
            .eq('preceptor_id', instructorId)
            .eq('status', 'active');

        if (error) throw error;
        // Transform for easier usage
        return data.map((d: any) => ({
            id: d.student_id,
            name: d.profiles?.full_name || 'Unknown',
            email: d.profiles?.email
        }));
    },

    // ----------------------------------------------------------------------
    // LOCKS & LOGBOOK MANAGEMENT
    // ----------------------------------------------------------------------

    async getStudentLogbookStats(institutionId?: string) {
        // This is a complex query. Simulating with multiple queries for now.
        // 1. Get all students
        const students = await this.getAuthorizedUsers('student', institutionId);

        // 2. Get active locks
        const { data: locks } = await supabase.from('term_locks').select('*');

        // 3. Get log counts (approximate via simple fetch for demo, or rpc in real app)
        // For real-time dashboard efficiency, we usually use a view or RPC.
        // We'll fetch all logs for now since we are in dev/demo scale.
        const { data: allLogs } = await supabase.from('log_entries').select('student_id, hours, date');

        return students?.map((s: any) => {
            const studentLogs = allLogs?.filter((l: any) => l.student_id === s.id) || []; // id mapping might need check if s is from auth_users or profiles
            // We need to match email from authorized_users to profile ID? 
            // authorized_users table doesn't have ID until they register.
            // Let's assume we are listing REGISTERED students from profiles.

            // Re-strategy: Get profiles directly
            return {
                ...s, // placeholder, will fix in step 2 below if needed
                totalEntries: studentLogs.length,
                totalHours: studentLogs.reduce((sum: number, l: any) => sum + (l.hours || 0), 0),
                lastEntry: studentLogs.length > 0 ? studentLogs.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date : null,
                isLocked: locks?.some((l: any) => l.student_id === s.id), // Simplified check. Ideally check specific term.
                term: 'Summer 2026' // Default term
            };
        });
    },

    /**
     * Better implementation of student stats fetching using profiles
     */
    async getLogbookStats() {
        // Get profiles with role student
        const { data: students, error: sErr } = await supabase
            .from('profiles')
            .select('*')
            .eq('role', 'student');

        if (sErr) throw sErr;

        const { data: locks } = await supabase.from('term_locks').select('*');
        const { data: allLogs } = await supabase.from('log_entries').select('student_id, hours, date');

        return students.map(s => {
            const studentLogs = allLogs?.filter((l: any) => l.student_id === s.id) || [];
            const lock = locks?.find((l: any) => l.student_id === s.id);

            return {
                id: s.id,
                studentName: s.full_name,
                studentEmail: s.email,
                term: lock?.term || 'Summer 2026',
                totalEntries: studentLogs.length,
                totalHours: studentLogs.reduce((sum: number, l: any) => sum + (l.hours || 0), 0),
                lastEntry: studentLogs.length > 0 ? studentLogs.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date : null,
                isLocked: !!lock,
                lockedDate: lock?.locked_at
            };
        });
    },

    async toggleLockLogbook(studentId: string, term: string, shouldLock: boolean) {
        if (shouldLock) {
            const { data: { user } } = await supabase.auth.getUser();
            const { error } = await supabase.from('term_locks').insert({
                student_id: studentId,
                term,
                locked_by: user?.id
            });
            if (error) throw error;
        } else {
            const { error } = await supabase
                .from('term_locks')
                .delete()
                .eq('student_id', studentId)
                .eq('term', term);
            if (error) throw error;
        }
    },

    async isLogbookLocked(studentId: string) {
        const { data, error } = await supabase
            .from('term_locks')
            .select('*')
            .eq('student_id', studentId)
            // .eq('term', currentTerm) // In production, pass term
            .single();

        if (error && error.code !== 'PGRST116') return false; // PGRST116 is "no rows found"
        return !!data;
    }
};
