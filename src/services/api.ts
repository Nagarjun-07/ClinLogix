import apiClient from './apiClient';
import { ClinicalEntry, UserRole } from '../App';

export interface Profile {
    id: string;
    email: string;
    full_name: string;
    role: UserRole;
    institution_id?: string;
}

export const api = {
    // Auth
    async login(email: string, password: string) {
        const response = await apiClient.post('token/', {
            username: email, // Django defaults to username, we'll use email as username
            password: password
        });
        const { access, refresh } = response.data;
        localStorage.setItem('access_token', access);
        localStorage.setItem('refresh_token', refresh);

        // Fetch profile it immediately
        return await this.getCurrentUser();
    },

    async signOut() {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
    },

    async register(email: string, password: string, name?: string) {
        const response = await apiClient.post('register/', {
            email,
            password,
            name
        });
        return response.data;
    },

    async getCurrentUser() {
        try {
            const response = await apiClient.get('me/');
            return response.data.profile as Profile;
        } catch (error) {
            console.error('Error fetching current user:', error);
            return null;
        }
    },

    async checkInvite(email: string) {
        try {
            const response = await apiClient.get(`admin/users/?email=${email}`);
            return response.data.length > 0 ? response.data[0] : null;
        } catch (error) {
            return null;
        }
    },

    // Logs
    async getLogs(role: UserRole, _userId: string) {
        let url = 'student/logs/';
        if (role === 'instructor') {
            url = 'instructor/reviews/';
        }
        // If admin, maybe generic logs? leaving as student/logs which might fail for admin 
        // but Admin usually doesn't use getLogs directly in this context (uses dashboard)

        const response = await apiClient.get(url);
        const data = response.data;

        return data.map((d: any) => ({
            id: d.id,
            studentId: d.student,
            studentName: d.student_name || 'Unknown',
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
            patientsSeen: (d.patients_seen || 0),
            isLocked: d.is_locked
        })) as ClinicalEntry[];
    },

    async createLog(entry: Omit<ClinicalEntry, 'id' | 'status' | 'submittedAt' | 'studentName'> & { patientId?: string, patientAge?: string, patientGender?: string }) {
        const response = await apiClient.post('student/logs/', {
            student: entry.studentId,
            date: entry.date,
            location: entry.location,
            specialty: entry.specialty,
            hours: entry.hours || 0,
            activities: entry.activities,
            learning_objectives: entry.learningObjectives,
            reflection: entry.reflection,
            supervisor_name: entry.supervisorName,
            patients_seen: entry.patientsSeen,
            status: 'pending',
            // Extended fields
            patient_id: entry.patientId,
            patient_age: entry.patientAge,
            patient_gender: entry.patientGender
        });
        return response.data;
    },

    async submitLogs(ids: string[]) {
        const response = await apiClient.post('student/logs/bulk_submit/', { ids });
        return response.data;
    },

    async getAssignedPreceptor() {
        const response = await apiClient.get('student/logs/preceptor/');
        return response.data.data;
    },


    async updateLogStatus(id: string, status: 'approved' | 'rejected', feedback?: string) {
        const response = await apiClient.patch(`instructor/reviews/${id}/`, { status, feedback });
        return response.data;
    },

    // User Management (Invites)
    async inviteUser(email: string, name: string, role: 'student' | 'instructor', institutionId?: string) {
        const response = await apiClient.post('admin/users/invite/', {
            email,
            role,
            full_name: name,
            institution_id: institutionId
        });
        return response.data;
    },

    async getAuthorizedUsers(role: 'student' | 'instructor', institutionId?: string) {
        // Fetch from admin/users endpoint (authorized_users table)
        const params = new URLSearchParams();
        if (institutionId) {
            params.append('institution_id', institutionId);
        }
        const url = `admin/users/?${params.toString()}`;
        const response = await apiClient.get(url);

        // Filter by role on client side since backend returns all
        return response.data.filter((user: any) => user.role === role);
    },

    async getInstructorStudents(_instructorId: string) {
        const response = await apiClient.get('instructor/students/');
        return response.data;
    },

    async getPreceptorsWithLoad() {
        // Get preceptors with their student load from admin assignments endpoint
        const response = await apiClient.get('admin/assignments/preceptor_stats/');
        const data = response.data.data || response.data;

        // Map to expected format
        return data.map((p: any) => ({
            id: p.id,
            name: p.full_name,
            email: p.email,
            phone: 'N/A',
            specialty: 'General', // Could be extended if profile has specialty field
            institution: 'N/A',
            studentsCount: p.student_count || 0,
            status: p.status === 'registered' ? 'active' : p.status // Map 'registered' to 'active' for display
        }));
    },

    async addPreceptor(email: string, name: string, institutionId?: string) {
        // Invite a new preceptor (instructor role)
        const response = await apiClient.post('admin/users/invite/', {
            email,
            full_name: name,
            role: 'instructor',
            institution_id: institutionId
        });
        return response.data;
    },

    async updatePreceptor(email: string, data: { name?: string, email?: string }) {
        // Update preceptor via admin users update endpoint
        const response = await apiClient.patch(`admin/users/update/${encodeURIComponent(email)}/`, {
            full_name: data.name,
            new_email: data.email
        });
        return response.data;
    },

    async deletePreceptor(email: string) {
        // Delete from authorized_users by email
        const response = await apiClient.delete(`admin/users/delete/${encodeURIComponent(email)}/`);
        return response.data;
    },

    async updateStudent(email: string, data: { name?: string, email?: string }) {
        // Update student via admin users update endpoint
        const response = await apiClient.patch(`admin/users/update/${encodeURIComponent(email)}/`, {
            full_name: data.name,
            new_email: data.email
        });
        return response.data;
    },

    async deleteStudent(email: string) {
        // Delete student from authorized_users by email
        const response = await apiClient.delete(`admin/users/delete/${encodeURIComponent(email)}/`);
        return response.data;
    },

    // PATIENTS & ASSIGNMENTS
    async getInstitutionPatients(institutionId: string) {
        // Use admin endpoint for now (assuming admin view)
        const response = await apiClient.get(`admin/patients/?institution=${institutionId}`);
        return response.data;
    },

    async createPatient(patientData: { referenceId: string, ageGroup: string, gender: string, clinicalCategory: string, institutionId: string }) {
        // Assuming admin creates patients. If student, this might fail (403).
        // For correct routing, we'd need to know the role.
        // Let's try 'admin/patients/' for now as it's the primary use case (setup).
        const response = await apiClient.post('admin/patients/', {
            reference_id: patientData.referenceId,
            age_group: patientData.ageGroup,
            gender: patientData.gender,
            clinical_category: patientData.clinicalCategory,
            institution: patientData.institutionId
        });
        return response.data;
    },

    async assignStudentToPreceptor(studentId: string, preceptorId: string) {
        const response = await apiClient.post('admin/assignments/assign_student_to_preceptor/', {
            student_id: studentId,
            preceptor_id: preceptorId
        });
        return response.data;
    },

    async getPreceptorStats() {
        const response = await apiClient.get('admin/assignments/preceptor_stats/');
        // Backend returns wrapped response { success: true, data: [...] }
        return response.data.data || [];
    },

    async getAssignments() {
        // Get all active student-preceptor assignments
        const response = await apiClient.get('admin/assignments/');
        return response.data.results || response.data || [];
    },


    async getAdminStats(_institutionId?: string) {
        // Use the new backend endpoint for stats
        const response = await apiClient.get('admin/dashboard/stats/');
        return response.data.data;
    },

    async getDashboardChartData() {
        const response = await apiClient.get('admin/dashboard/chart_data/');
        return response.data.data;
    },

    async getAdminApprovedReviews() {
        const response = await apiClient.get('admin/dashboard/approved_entries/');
        return response.data.data;
    }
};
