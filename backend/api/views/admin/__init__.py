"""
Admin-specific views with enterprise-level structure
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth.models import User
from django.db import transaction

from api.models import (
    Profiles, AuthorizedUsers, Institutions, Patients,
    StudentPreceptorAssignments, StudentPatientAssignments, LogEntries
)
from api.serializers import (
    ProfileSerializer, AuthorizedUserSerializer, InstitutionSerializer,
    PatientSerializer, StudentPreceptorAssignmentSerializer,
    StudentPatientAssignmentSerializer
)
from api.permissions import IsAdmin
from api.mixins import ResponseMixin, UserProfileMixin
from api.exceptions import ValidationError, DuplicateEntryError
from api.constants import Messages, LogStatus, AssignmentStatus, InvitationStatus
from api.utils import log_audit, send_notification_email, generate_invitation_token


class AdminUserManagementViewSet(ResponseMixin, viewsets.ModelViewSet):
    """
    ViewSet for admins to manage users and invitations
    
    Endpoints:
        - GET /api/admin/users/ - List all users
        - POST /api/admin/users/ - Create user
        - POST /api/admin/users/invite/ - Invite new user
        - GET /api/admin/users/{id}/ - Get specific user
        - PUT /api/admin/users/{id}/ - Update user
        - DELETE /api/admin/users/{id}/ - Delete user
    """
    serializer_class = AuthorizedUserSerializer
    permission_classes = [IsAdmin]
    queryset = AuthorizedUsers.objects.all()

    def get_queryset(self):
        """Return all authorized users ordered by creation date"""
        return self.queryset.order_by('-created_at')

    @action(detail=False, methods=['post'])
    @transaction.atomic
    def invite(self, request):
        """
        Invite a new user to the system
        
        Request body:
            - email: User email (required)
            - full_name: Full name (required)
            - role: User role (student/instructor/admin) (required)
            - institution_id: Institution UUID (optional)
        """
        email = request.data.get('email')
        full_name = request.data.get('full_name')
        role = request.data.get('role')
        institution_id = request.data.get('institution_id')
        
        # Validation
        if not all([email, full_name, role]):
            raise ValidationError("Email, full name, and role are required")
        
        # Check if user already exists
        if AuthorizedUsers.objects.filter(email=email).exists():
            raise DuplicateEntryError(f"User with email {email} already exists")
        
        # Create authorized user entry
        from django.utils import timezone
        authorized_user = AuthorizedUsers.objects.create(
            email=email,
            full_name=full_name,
            role=role,
            institution_id=institution_id,
            status='pending',  # Database only allows 'pending' or 'registered'
            created_at=timezone.now()
            # Note: invited_by references auth.users (Supabase), not Django's auth_user
            # We'll skip it for now or need to modify the database schema
        )
        
        # Auto-create Profile to allow immediate assignment
        # This allows Admin to assign students/preceptors even before they register
        import uuid
        if not Profiles.objects.filter(email=email).exists():
            Profiles.objects.create(
                id=uuid.uuid4(),
                email=email,
                full_name=full_name,
                role=role,
                institution_id=institution_id,
                created_at=timezone.now()
            )
        
        # Send invitation email
        invitation_token = generate_invitation_token()
        send_notification_email(
            to_email=email,
            subject='Invitation to Clinical Logbook System',
            message=f'You have been invited to join as {role}.\\n\\nPlease register using this email.'
        )
        
        # Log the action (commented out - entity_id expects UUID, not email)
        # profile = Profiles.objects.get(email=request.user.email)
        # log_audit(
        #     actor_id=profile.id,
        #     action='invite_user',
        #     entity_type='authorized_user',
        #     entity_id=email,
        #     metadata={'role': role, 'full_name': full_name}
        # )
        
        serializer = self.get_serializer(authorized_user)
        return self.success_response(
            data=serializer.data,
            message="User invited successfully",
            status_code=status.HTTP_201_CREATED
        )

    @action(detail=False, methods=['delete'], url_path='delete/(?P<email>[^/]+)')
    @transaction.atomic
    def delete_user(self, request, email=None):
        """
        Delete a user by email
        """
        if not email:
            return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Delete from AuthorizedUsers
            auth_user = AuthorizedUsers.objects.get(email=email)
            auth_user.delete()
            
            # Also delete from Profiles if exists
            Profiles.objects.filter(email=email).delete()
            
            # Delete Django User if exists
            from django.contrib.auth.models import User
            User.objects.filter(email=email).delete()
            
            return self.success_response(message=f"User {email} deleted successfully")
        except AuthorizedUsers.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['patch'], url_path='update/(?P<email>[^/]+)')
    @transaction.atomic  
    def update_user(self, request, email=None):
        """
        Update a user by email
        """
        if not email:
            return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            auth_user = AuthorizedUsers.objects.get(email=email)
            
            # Update fields
            new_name = request.data.get('full_name')
            new_email = request.data.get('new_email')  # Use new_email to avoid confusion
            
            if new_name:
                auth_user.full_name = new_name
            if new_email and new_email != email:
                # Check if new email already exists
                if AuthorizedUsers.objects.filter(email=new_email).exists():
                    return Response({'error': 'Email already exists'}, status=status.HTTP_400_BAD_REQUEST)
                auth_user.email = new_email
                # Update Profiles too
                Profiles.objects.filter(email=email).update(email=new_email, full_name=new_name or auth_user.full_name)
            elif new_name:
                Profiles.objects.filter(email=email).update(full_name=new_name)
                
            auth_user.save()
            
            serializer = self.get_serializer(auth_user)
            return self.success_response(data=serializer.data, message="User updated successfully")
        except AuthorizedUsers.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)


class AdminInstitutionViewSet(ResponseMixin, viewsets.ModelViewSet):
    """
    ViewSet for admins to manage institutions
    
    Endpoints:
        - GET /api/admin/institutions/ - List all institutions
        - POST /api/admin/institutions/ - Create institution
        - GET /api/admin/institutions/{id}/ - Get specific institution
        - PUT /api/admin/institutions/{id}/ - Update institution
        - DELETE /api/admin/institutions/{id}/ - Delete institution
    """
    serializer_class = InstitutionSerializer
    permission_classes = [IsAdmin]
    queryset = Institutions.objects.all()


class AdminPatientViewSet(ResponseMixin, viewsets.ModelViewSet):
    """
    ViewSet for admins to manage patients
    
    Endpoints:
        - GET /api/admin/patients/ - List all patients
        - POST /api/admin/patients/ - Create patient
        - GET /api/admin/patients/{id}/ - Get specific patient
        - PUT /api/admin/patients/{id}/ - Update patient
        - DELETE /api/admin/patients/{id}/ - Delete patient
    """
    serializer_class = PatientSerializer
    permission_classes = [IsAdmin]
    queryset = Patients.objects.all()


class AdminAssignmentViewSet(ResponseMixin, viewsets.ModelViewSet):
    """
    ViewSet for admins to manage student-preceptor assignments
    
    Endpoints:
        - GET /api/admin/assignments/ - List all assignments
        - POST /api/admin/assignments/ - Create assignment
        - POST /api/admin/assignments/assign_student_to_preceptor/ - Assign student to preceptor
        - POST /api/admin/assignments/assign_patient_to_student/ - Assign patient to student
    """
    serializer_class = StudentPreceptorAssignmentSerializer
    permission_classes = [IsAdmin]
    queryset = StudentPreceptorAssignments.objects.all()

    @action(detail=False, methods=['get'])
    def preceptor_stats(self, request):
        """
        Get list of preceptors with their current student count
        """
        from django.db.models import Count, Q
        
        # Count active assignments for each instructor, ordered by newest first
        preceptors = Profiles.objects.filter(role='instructor').annotate(
            student_count=Count(
                'studentpreceptorassignments_preceptor_set',
                filter=Q(studentpreceptorassignments_preceptor_set__status='active')
            )
        ).order_by('-created_at')
        
        data = []
        for p in preceptors:
            # Try to get status from AuthorizedUsers
            try:
                auth_user = AuthorizedUsers.objects.get(email=p.email)
                status = auth_user.status or 'pending'
            except AuthorizedUsers.DoesNotExist:
                status = 'active'  # If not in authorized_users, assume active
            
            data.append({
                'id': str(p.id),
                'full_name': p.full_name,
                'email': p.email,
                'student_count': p.student_count,
                'max_students': 5,
                'status': status
            })
            
        return self.success_response(data)

    @action(detail=False, methods=['post'])
    @transaction.atomic
    def assign_student_to_preceptor(self, request):
        """
        Assign a student to a preceptor
        
        Request body:
            - student_id: Student profile UUID (required)
            - preceptor_id: Preceptor profile UUID (required)
        """
        student_id = request.data.get('student_id')
        preceptor_id = request.data.get('preceptor_id')
        
        if not all([student_id, preceptor_id]):
            raise ValidationError("Student ID and Preceptor ID are required")
        
        # Check if assignment already exists
        if StudentPreceptorAssignments.objects.filter(
            student_id=student_id,
            preceptor_id=preceptor_id,
            status=AssignmentStatus.ACTIVE
        ).exists():
            raise DuplicateEntryError("This assignment already exists")

        # Check preceptor limit (Max 5)
        active_count = StudentPreceptorAssignments.objects.filter(
            preceptor_id=preceptor_id,
            status=AssignmentStatus.ACTIVE
        ).count()
        if active_count >= 5:
            raise ValidationError("Preceptor limit reached (Max 5 students).")
        
        # Create assignment
        import uuid
        from django.utils import timezone
        
        assignment = StudentPreceptorAssignments.objects.create(
            id=uuid.uuid4(),
            student_id=student_id,
            preceptor_id=preceptor_id,
            status=AssignmentStatus.ACTIVE,
            assigned_at=timezone.now()
        )
        
        # Log the action
        # profile = Profiles.objects.get(email=request.user.email)
        # log_audit(
        #     actor_id=profile.id,
        #     action='assign_student_to_preceptor',
        #     entity_type='assignment',
        #     entity_id=assignment.id,
        #     metadata={'student_id': str(student_id), 'preceptor_id': str(preceptor_id)}
        # )
        
        serializer = self.get_serializer(assignment)
        return self.success_response(
            data=serializer.data,
            message=Messages.STUDENT_ASSIGNED,
            status_code=status.HTTP_201_CREATED
        )

    @action(detail=False, methods=['post'])
    @transaction.atomic
    def assign_patient_to_student(self, request):
        """
        Assign a patient to a student
        
        Request body:
            - student_id: Student profile UUID (required)
            - patient_id: Patient UUID (required)
        """
        student_id = request.data.get('student_id')
        patient_id = request.data.get('patient_id')
        
        if not all([student_id, patient_id]):
            raise ValidationError("Student ID and Patient ID are required")
        
        # Check if assignment already exists
        if StudentPatientAssignments.objects.filter(
            student_id=student_id,
            patient_id=patient_id
        ).exists():
            raise DuplicateEntryError("This patient is already assigned to this student")
        
        # Create assignment
        assignment = StudentPatientAssignments.objects.create(
            student_id=student_id,
            patient_id=patient_id,
            assigned_by_id=request.user.id
        )
        
        # Log the action
        profile = Profiles.objects.get(email=request.user.email)
        log_audit(
            actor_id=profile.id,
            action='assign_patient_to_student',
            entity_type='patient_assignment',
            entity_id=assignment.id,
            metadata={'student_id': str(student_id), 'patient_id': str(patient_id)}
        )
        
        return self.success_response(
            message=Messages.PATIENT_ASSIGNED,
            status_code=status.HTTP_201_CREATED
        )


class AdminDashboardViewSet(ResponseMixin, viewsets.ViewSet):
    """
    ViewSet for admin dashboard statistics
    
    Endpoints:
        - GET /api/admin/dashboard/stats/ - Get system statistics
    """
    permission_classes = [IsAdmin]

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        Get overall system statistics
        
        Returns:
            - total_students: Total number of students
            - total_instructors: Total number of instructors
            - total_entries: Total log entries
            - pending_entries: Pending log entries
            - total_patients: Total patients
            - total_institutions: Total institutions
            - active_assignments: Active student-preceptor assignments
        """
        stats_data = {
            'total_students': Profiles.objects.filter(role='student').count(),
            'total_instructors': Profiles.objects.filter(role='instructor').count(),
            'total_entries': LogEntries.objects.count(),
            'pending_entries': LogEntries.objects.filter(status=LogStatus.PENDING).count(),
            'total_patients': Patients.objects.count(),
            'total_institutions': Institutions.objects.count(),
            'active_assignments': StudentPreceptorAssignments.objects.filter(
                status=AssignmentStatus.ACTIVE
            ).count(),
        }
        
        return self.success_response(
            data=stats_data,
            message="Statistics retrieved successfully"
        )

    @action(detail=False, methods=['get'])
    def chart_data(self, request):
        """
        Get data for dashboard charts (Activity Trends & Specialty Distribution)
        """
        from django.db.models import Count, Sum
        from django.db.models.functions import TruncMonth
        from django.utils import timezone
        import datetime

        # 1. Monthly Activity (Last 6 months)
        six_months_ago = timezone.now() - datetime.timedelta(days=180)
        
        monthly_stats = LogEntries.objects.filter(
            submitted_at__gte=six_months_ago
        ).annotate(
            month=TruncMonth('submitted_at')
        ).values('month').annotate(
            entries=Count('id'),
            hours=Sum('hours')
        ).order_by('month')
        
        # Format for frontend
        formatted_activity = []
        for stat in monthly_stats:
            if stat['month']:
                formatted_activity.append({
                    'month': stat['month'].strftime('%b'), # Jan, Feb
                    'entries': stat['entries'],
                    'hours': float(stat['hours'] or 0)
                })

        # 2. Specialty Distribution
        specialty_stats = LogEntries.objects.values('specialty').annotate(
            value=Count('id')
        ).order_by('-value')[:6] # Top 6
        
        formatted_specialty = [
            {'name': s['specialty'] or 'Unspecified', 'value': s['value']}
            for s in specialty_stats if s['value'] > 0
        ]
        
        # If no activity, provide at least empty structure or defaults if needed
        # But frontend should handle empty arrays

        return self.success_response({
            'activity': formatted_activity,
            'specialty': formatted_specialty
        })

    @action(detail=False, methods=['get'])
    def approved_entries(self, request):
        """
        Get all approved log entries for admin review with pagination
        """
        from api.models import Profiles
        from django.core.paginator import Paginator
        
        # Get pagination parameters
        page_number = request.query_params.get('page', 1)
        page_size = request.query_params.get('page_size', 10)
        
        # Optimize query with select_related if possible, or simple filter
        # Since managed=False, verify if relations work. If not, keeping as is but paginated.
        queryset = LogEntries.objects.filter(status='approved').order_by('-submitted_at')
        
        paginator = Paginator(queryset, page_size)
        page_obj = paginator.get_page(page_number)
        
        data = []
        for entry in page_obj:
            # Fetch student name manually or via related if available
            student_name = "Unknown"
            try:
                p = Profiles.objects.get(id=entry.student_id)
                student_name = p.full_name
            except Profiles.DoesNotExist:
                pass

            data.append({
                'id': str(entry.id),
                'student_name': student_name,
                'date': str(entry.date),
                'specialty': entry.specialty,
                'hours': entry.hours,
                'supervisor_name': entry.supervisor_name,
                'feedback': entry.feedback,
                'status': entry.status,
                'activities': entry.activities,
                'submitted_at': entry.submitted_at
            })
            
        return self.success_response({
            'results': data,
            'total_count': paginator.count,
            'num_pages': paginator.num_pages,
            'current_page': int(page_number)
        })
