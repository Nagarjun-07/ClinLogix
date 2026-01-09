"""
Student-specific views with enterprise-level structure
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

from api.models import LogEntries, Patients, StudentPatientAssignments
from api.serializers import LogEntrySerializer, PatientSerializer
from api.permissions import IsStudent
from api.mixins import UserProfileMixin, FilterByUserMixin, ResponseMixin
from api.exceptions import ProfileNotFoundError
from api.constants import Messages, LogStatus
from api.utils import calculate_total_hours, log_audit


class StudentLogViewSet(FilterByUserMixin, ResponseMixin, viewsets.ModelViewSet):
    """
    ViewSet for students to manage their clinical log entries
    
    Endpoints:
        - GET /api/student/logs/ - List all logs
        - POST /api/student/logs/ - Create new log
        - GET /api/student/logs/{id}/ - Get specific log
        - PUT /api/student/logs/{id}/ - Update log
        - DELETE /api/student/logs/{id}/ - Delete log
        - GET /api/student/logs/stats/ - Get statistics
    """
    serializer_class = LogEntrySerializer
    permission_classes = [IsStudent]
    queryset = LogEntries.objects.all()

    def filter_queryset_by_profile(self, queryset, profile):
        """Filter logs to show only student's own entries"""
        return queryset.filter(student=profile).order_by('-date')

    def create(self, request, *args, **kwargs):
        profile = self.get_user_profile()
        if not profile:
            raise ProfileNotFoundError()

        data = request.data.copy()
        
        # Default hours if missing (requested to remove from UI)
        if 'hours' not in data or not data['hours']:
            data['hours'] = 0

        # Handle patient creation on the fly
        patient_ref = data.get('patient_id')
        if patient_ref:
            from api.models import Patients
            import uuid
            from django.utils import timezone
            
            # Find or create patient
            # Need strict filtering by institution
            institution = profile.institution
            
            patient, created = Patients.objects.get_or_create(
                reference_id=patient_ref,
                institution=institution,
                defaults={
                    'id': uuid.uuid4(),
                    'age_group': data.get('patient_age'),
                    'gender': data.get('patient_gender'),
                    'created_at': timezone.now()
                }
            )
            data['patient'] = str(patient.id)

        serializer = self.get_serializer(data=data)
        if not serializer.is_valid():
            print("LOG ENTRY SERIALIZER ERRORS:", serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def perform_create(self, serializer):
        """Create log entry with student profile"""
        profile = self.get_user_profile()
        
        instance = serializer.save(
            student=profile,
            status=LogStatus.PENDING
        )
        
        # Log the action
        # log_audit(
        #     actor_id=profile.id,
        #     action='create',
        #     entity_type='log_entry',
        #     entity_id=instance.id,
        #     metadata={'date': str(instance.date)}
        # )

    def perform_update(self, serializer):
        """
        Update log entry:
        - Reset status to PENDING (so instructor sees it again)
        - Unlock the entry (if it was locked/approved/rejected)
        """
        instance = serializer.save(
            status=LogStatus.PENDING,
            is_locked=False
        )

    @action(detail=False, methods=['get'])
    def preceptor(self, request):
        """Get the assigned preceptor for the current student"""
        from api.models import StudentPreceptorAssignments
        
        profile = self.get_user_profile()
        assignment = StudentPreceptorAssignments.objects.filter(
            student=profile, 
            status='active'
        ).select_related('preceptor').first()
        
        if assignment:
            p = assignment.preceptor
            return self.success_response({
                'id': p.id,
                'full_name': p.full_name,
                'email': p.email
            })
        return self.success_response(None)

    @action(detail=False, methods=['get'])
    def instructors(self, request):
        """Get all instructors in the student's institution"""
        from api.models import Profiles
        
        profile = self.get_user_profile()
        institution = profile.institution
        
        if not institution:
            # Fallback (all instructors?) or empty?
            # User wants filtering, so maybe empty implies 'Assign an institution first'
            return self.success_response([], message="No institution assigned to student.")

        instructors = Profiles.objects.filter(
            role='instructor', 
            institution=institution
        ).order_by('full_name')
        
        data = [
            {
                'id': str(p.id),
                'full_name': p.full_name,
                'email': p.email
            }
            for p in instructors
        ]
        
        return self.success_response(data)

    @action(detail=False, methods=['post'])
    def bulk_submit(self, request):
        """Submit multiple logs (lock them)"""
        ids = request.data.get('ids', [])
        if not ids:
             return Response({'error': 'No IDs provided'}, status=status.HTTP_400_BAD_REQUEST)
             
        profile = self.get_user_profile()
        # Ensure we only update this student's logs
        queryset = self.get_queryset().filter(id__in=ids, student=profile)
        
        # Lock them
        updated_count = queryset.update(is_locked=True)
        
        return self.success_response({
            'updated_count': updated_count,
            'message': f'{updated_count} entries submitted successfully.'
        })

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        Get student's logbook statistics
        
        Returns:
            - total_entries: Total number of log entries
            - total_hours: Total clinical hours
            - pending_count: Number of pending entries
            - approved_count: Number of approved entries
            - rejected_count: Number of rejected entries
        """
        queryset = self.get_queryset()
        
        stats_data = {
            'total_entries': queryset.count(),
            'total_hours': calculate_total_hours(queryset),
            'pending_count': queryset.filter(status=LogStatus.PENDING).count(),
            'approved_count': queryset.filter(status=LogStatus.APPROVED).count(),
            'rejected_count': queryset.filter(status=LogStatus.REJECTED).count(),
        }
        
        return self.success_response(
            data=stats_data,
            message="Statistics retrieved successfully"
        )

    @action(detail=False, methods=['get'])
    def pending(self, request):
        """Get all pending log entries"""
        queryset = self.get_queryset().filter(status=LogStatus.PENDING)
        serializer = self.get_serializer(queryset, many=True)
        return self.success_response(data=serializer.data)


class StudentPatientViewSet(FilterByUserMixin, ResponseMixin, viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for students to view their assigned patients
    
    Endpoints:
        - GET /api/student/patients/ - List assigned patients
        - GET /api/student/patients/{id}/ - Get specific patient
    """
    serializer_class = PatientSerializer
    permission_classes = [IsStudent]
    queryset = Patients.objects.all()

    def filter_queryset_by_profile(self, queryset, profile):
        """Filter to show only assigned patients"""
        assignments = StudentPatientAssignments.objects.filter(student=profile)
        patient_ids = assignments.values_list('patient_id', flat=True)
        return queryset.filter(id__in=patient_ids)
