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
            
            # Update Institution if provided
            institution_id = request.data.get('institution_id')
            if institution_id is not None:
                # Validate if empty string = clear institution? Or allow explicit null
                if institution_id == "":
                     auth_user.institution_id = None
                else:
                     auth_user.institution_id = institution_id

            if new_name:
                auth_user.full_name = new_name
            
            # Email update logic
            if new_email and new_email != email:
                if AuthorizedUsers.objects.filter(email=new_email).exists():
                    return Response({'error': 'Email already exists'}, status=status.HTTP_400_BAD_REQUEST)
                auth_user.email = new_email
                
                # Update Profiles in bulk
                update_kwargs = {'email': new_email}
                if new_name: update_kwargs['full_name'] = new_name
                if institution_id is not None: 
                    update_kwargs['institution_id'] = None if institution_id == "" else institution_id
                
                Profiles.objects.filter(email=email).update(**update_kwargs)
            else:
                # Update Profiles without email change
                update_kwargs = {}
                if new_name: update_kwargs['full_name'] = new_name
                if institution_id is not None:
                    update_kwargs['institution_id'] = None if institution_id == "" else institution_id
                
                if update_kwargs:
                     Profiles.objects.filter(email=email).update(**update_kwargs)
                
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
                'status': status,
                'institution_name': p.institution.name if p.institution else None,
                'institution_id': str(p.institution.id) if p.institution else None
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
    def institution_stats(self, request):
        """
        Get aggregated statistics per institution
        """
        from django.db.models import Count, Sum, Q
        
        # We need to aggregate based on Profiles and Logs
        # Since relation is Institution -> Profile -> LogEntries
        
        insts = Institutions.objects.all()
        
        data = []
        for inst in insts:
            # 1. Get Profiles in this institution
            # We filter by institution directly (safe single-table filter)
            student_qs = Profiles.objects.filter(institution=inst, role='student')
            student_count = student_qs.count()
            
            instructor_qs = Profiles.objects.filter(institution=inst, role='instructor')
            instructor_count = instructor_qs.count()

            # 2. Get Logs for these students (Manual Join)
            # Fetch IDs to avoid complex cross-table joins on managed=False models
            student_ids = student_qs.values_list('id', flat=True)
            
            # Use student_id__in or student__in
            logs_qs = LogEntries.objects.filter(student__in=student_qs)
            total_logs = logs_qs.count()
            approved_logs = logs_qs.filter(status='approved').count()
            pending_logs = logs_qs.filter(status='pending').count()
            
            # 3. Count assigned students (Manual Join)
            from api.models import StudentPreceptorAssignments
            assigned_students = StudentPreceptorAssignments.objects.filter(
                student__in=student_qs,
                status='active'
            ).values('student').distinct().count()
            
            data.append({
                'id': str(inst.id),
                'name': inst.name,
                'students': student_count,
                'instructors': instructor_count,
                'assigned_students': assigned_students,
                'total_logs': total_logs,
                'approved_logs': approved_logs,
                'pending_logs': pending_logs
            })
            
        return self.success_response(data)

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

    @action(detail=False, methods=['get'])
    def recent_activity(self, request):
        """
        Get recent log activity for dashboard (Robust replacement for raw DB query)
        """
        from api.models import Profiles
        # Fetch last 5 logs
        recent_logs = LogEntries.objects.all().order_by('-submitted_at')[:5]
        
        data = []
        for log in recent_logs:
            student_name = "Unknown Student"
            if log.student:
                 try:
                     student_name = log.student.full_name
                 except: 
                     pass
            
            action_text = "submitted a new entry"
            type_code = "entry"
            
            if log.status == 'approved':
                action_text = "entry was approved"
                type_code = "approval"
            elif log.status == 'rejected':
                action_text = "entry needs revision"
                type_code = "rejection"
            elif log.status == 'pending':
                action_text = "submitted for review"
                type_code = "request"

            data.append({
                'id': str(log.id),
                'student_name': student_name,
                'action': action_text,
                'time': log.submitted_at, # Frontend works out "time ago"
                'type': type_code,
                'status': log.status
            })
            
        return self.success_response(data)

    @action(detail=False, methods=['get'])
    def chart_data(self, request):
        """
        Get aggregated chart data for activity and specialty
        """
        from django.db.models import Count, Sum
        from django.db.models.functions import TruncMonth

        # Activity Data (Entries & Hours per Month)
        # SQLite/Postgres compatible TruncMonth
        activity_qs = LogEntries.objects.annotate(
            month=TruncMonth('date')
        ).values('month').annotate(
            entries=Count('id'),
            hours=Sum('hours')
        ).order_by('month')

        activity_data = []
        for item in activity_qs:
            if item['month']:
                activity_data.append({
                    'month': item['month'].strftime('%b'),
                    'entries': item['entries'],
                    'hours': float(item['hours'] or 0)
                })

        # Specialty Data
        specialty_qs = LogEntries.objects.values('specialty').annotate(
            value=Count('id')
        ).order_by('-value')

        specialty_data = []
        for item in specialty_qs:
            if item['specialty']:
                specialty_data.append({
                    'name': item['specialty'],
                    'value': item['value']
                })

        return self.success_response({
            'activity': activity_data,
            'specialty': specialty_data
        })
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        Get aggregated counts for dashboard stats cards
        """
        total_students = Profiles.objects.filter(role='student').count()
        total_preceptors = Profiles.objects.filter(role='instructor').count()
        total_entries = LogEntries.objects.count()
        pending_reviews = LogEntries.objects.filter(status='pending').count()
        approved_count = LogEntries.objects.filter(status='approved').count()
        
        # Calculate total hours manually to be safe with Decimal/Float types
        all_logs = LogEntries.objects.all()
        total_hours = sum(entry.hours or 0 for entry in all_logs)

        return self.success_response({
            'totalStudents': total_students,
            'totalPreceptors': total_preceptors,
            'totalEntries': total_entries,
            'pendingReviews': pending_reviews,
            'totalHours': round(float(total_hours), 2),
            'approvedCount': approved_count
        })


    @action(detail=True, methods=['get'])
    def download_report(self, request, pk=None):
        """
        Generate and download a detailed professional PDF report.
        """
        import io
        from django.http import HttpResponse
        from reportlab.lib import colors
        from reportlab.lib.pagesizes import letter
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
        from reportlab.lib.units import inch
        from reportlab.lib.enums import TA_CENTER, TA_LEFT
        from api.models import Profiles, Institutions

        try:
            entry = LogEntries.objects.get(pk=pk)
        except LogEntries.DoesNotExist:
            return self.error_response("Log entry not found", status=404)

        # distinct manual lookups for safety
        student_name = "Unknown Student"
        hospital_name = "Unknown Institution"
        
        if entry.student_id:
            try:
                 student = Profiles.objects.get(id=entry.student_id)
                 student_name = student.full_name or "Unknown"
                 if student.institution_id:
                     try:
                         inst = Institutions.objects.get(id=student.institution_id)
                         hospital_name = inst.name
                     except Institutions.DoesNotExist:
                         pass
            except Profiles.DoesNotExist:
                pass

        # Specialty Context Data
        SPECIALTY_DESC = {
            "Internal Medicine": "Focuses on the comprehensive care of adult patients, dealing with the prevention, diagnosis, and treatment of adult diseases.",
            "Surgery": "Involves the treatment of injuries, diseases, and deformities through physical operation and instrumentation.",
            "Pediatrics": "Dedicated to the medical care of infants, children, and adolescents.",
            "Family Medicine": "Provides continuing and comprehensive health care for the individual and family across all ages, genders, diseases, and parts of the body.",
            "Psychiatry": "Focuses on the diagnosis, treatment, and prevention of mental, emotional, and behavioral disorders.",
            "Obstetrics and Gynecology": "Specializes in female reproductive health and childbirth.",
            "Neurology": "Deals with disorders of the nervous system, including the brain, spinal cord, and nerves.",
            "Emergency Medicine": "Focuses on the immediate decision making and action necessary to prevent death or any further disability."
        }
        spec_desc = SPECIALTY_DESC.get(entry.specialty, f"Clinical rotation in the field of {entry.specialty}.")

        # Create PDF buffer
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=72, leftMargin=72, topMargin=50, bottomMargin=50)
        
        styles = getSampleStyleSheet()
        Normal = styles['Normal']
        
        # Custom Styles
        HeaderStyle = ParagraphStyle('Header', parent=styles['Heading1'], alignment=TA_CENTER, fontSize=18, spaceAfter=20, textColor=colors.darkblue)
        SubHeaderStyle = ParagraphStyle('SubHeader', parent=styles['Heading2'], alignment=TA_CENTER, fontSize=14, spaceAfter=20, textColor=colors.grey)
        SectionTitle = ParagraphStyle('SectionTitle', parent=styles['Heading3'], fontSize=12, spaceBefore=15, spaceAfter=6, textColor=colors.black, borderWidth=0, borderColor=colors.black)
        
        LabelStyle = ParagraphStyle('Label', parent=Normal, fontName='Helvetica-Bold', fontSize=10)
        ValueStyle = ParagraphStyle('Value', parent=Normal, fontSize=10)
        DescStyle = ParagraphStyle('Desc', parent=Normal, fontSize=10, leading=14, textColor=colors.darkslategrey)
        
        story = []

        # 1. Header: Hospital Name (Centered)
        story.append(Paragraph(hospital_name.upper(), HeaderStyle))
        story.append(Paragraph("Clinical Rotation Log Report", SubHeaderStyle))
        story.append(Spacer(1, 0.1*inch))
        
        # 2. Key Details Box (Table)
        # We put Student, ID, Date, Specialty in a prominent box
        meta_data = [
            [Paragraph("Student Name:", LabelStyle), Paragraph(student_name, ValueStyle), Paragraph("Log Date:", LabelStyle), Paragraph(str(entry.date), ValueStyle)],
            [Paragraph("Total Hours:", LabelStyle), Paragraph(f"{entry.hours or 0} Hours", ValueStyle), Paragraph("Specialty:", LabelStyle), Paragraph(entry.specialty or "N/A", ValueStyle)],
        ]
        
        t_meta = Table(meta_data, colWidths=[1.2*inch, 2.3*inch, 1.2*inch, 2.3*inch])
        t_meta.setStyle(TableStyle([
            ('GRID', (0,0), (-1,-1), 0.5, colors.lightgrey),
            ('BACKGROUND', (0,0), (-1,-1), colors.aliceblue),
            ('PADDING', (0,0), (-1,-1), 8),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ]))
        story.append(t_meta)
        
        # 3. Specialty Context
        story.append(Spacer(1, 0.2*inch))
        story.append(Paragraph(f"About {entry.specialty}", SectionTitle))
        story.append(Paragraph(spec_desc, DescStyle))
        
        # 4. Clinical Activities
        story.append(Spacer(1, 0.1*inch))
        story.append(Paragraph("Clinical Activities & Observations", SectionTitle))
        story.append(Paragraph(entry.activities or "No activities recorded.", Normal))
        
        # 5. Reflection
        if entry.reflection:
            story.append(Spacer(1, 0.1*inch))
            story.append(Paragraph("Student Reflection", SectionTitle))
            story.append(Paragraph(entry.reflection, Normal))
            
        # 6. Instructor Evaluation (Highlighted Box)
        story.append(Spacer(1, 0.3*inch))
        story.append(Paragraph("Instructor Evaluation Record", SectionTitle))
        
        eval_data = [
            [Paragraph("Evaluator:", LabelStyle), Paragraph(entry.supervisor_name or "Unknown Instructor", ValueStyle)],
            [Paragraph("Approval Status:", LabelStyle), Paragraph(f"<b>{entry.status.upper()}</b>", ValueStyle)],
            [Paragraph("Feedback:", LabelStyle), Paragraph(f"<i>{entry.feedback or 'No feedback provided.'}</i>", ValueStyle)],
        ]
        
        t_eval = Table(eval_data, colWidths=[1.5*inch, 5.5*inch])
        t_eval.setStyle(TableStyle([
            ('BOX', (0,0), (-1,-1), 1, colors.grey),
            ('BACKGROUND', (0,0), (0,-1), colors.whitesmoke), # Label col background
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('PADDING', (0,0), (-1,-1), 10),
            ('GRID', (0,0), (-1,-1), 0.5, colors.lightgrey),
        ]))
        story.append(t_eval)
        
        # Footer / Sign-off
        story.append(Spacer(1, 0.5*inch))
        story.append(Paragraph(f"Verified by {hospital_name} Clinical Education System", ParagraphStyle('Footer', parent=Normal, fontSize=8, textColor=colors.grey, alignment=TA_CENTER)))

        doc.build(story)
        buffer.seek(0)
        
        response = HttpResponse(buffer, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="Report_{entry.date}_{student_name.replace(" ", "_")}.pdf"'
        return response


    @action(detail=True, methods=['get'])
    @action(detail=True, methods=['get'])
    def fhir(self, request, pk=None):
        """
        Get FHIR format of the log entry (Strict Mapping)
        """
        try:
            entry = LogEntries.objects.get(id=pk)
        except LogEntries.DoesNotExist:
            return self.error_response("Log entry not found", status.HTTP_404_NOT_FOUND)

        from datetime import datetime
        
        # 1. Participants (Student & Supervisor)
        participants = []
        
        # Student (Performer)
        participants.append({
            "type": [
                {
                    "coding": [
                        {
                            "system": "http://terminology.hl7.org/CodeSystem/v3-ParticipationType",
                            "code": "PPRF",
                            "display": "primary performer"
                        }
                    ]
                }
            ],
            "individual": {
                "reference": f"Practitioner/{entry.student_id}",
                "display": entry.student.full_name if hasattr(entry.student, 'full_name') else "Student"
            }
        })

        # Supervisor (Verifier)
        if entry.supervisor_name:
            participants.append({
                "type": [
                    {
                        "coding": [
                            {
                                "system": "http://terminology.hl7.org/CodeSystem/v3-ParticipationType",
                                "code": "ATND",
                                "display": "attender"
                            }
                        ]
                    }
                ],
                "individual": {
                    "display": entry.supervisor_name
                    # Note: If we had a preceptor ID, we would use "reference": f"Practitioner/{id}"
                }
            })

        # 2. Extensions (Hours, Reflection)
        extensions = [
            {
                "url": "http://clinlogix.org/fhir/StructureDefinition/clinical-hours",
                "valueDecimal": float(entry.hours or 0)
            }
        ]
        if entry.reflection:
            extensions.append({
                "url": "http://clinlogix.org/fhir/StructureDefinition/student-reflection",
                "valueString": entry.reflection
            })

        # Prepare Subject (conditionally to avoid reference: null)
        subject_data = {
            "display": f"Patient Reference ID: {entry.patient.reference_id}" if entry.patient else (f"Patient Count: {entry.patients_seen}" if entry.patients_seen else "Unknown Patient")
        }
        if entry.patient:
            subject_data["reference"] = f"Patient/{entry.patient.id}"

        # Resource: Encounter (The Clinical Log)
        encounter_resource = {
            "resourceType": "Encounter",
            "id": str(entry.id),
            "text": {
                "status": "generated",
                "div": f"<div xmlns=\"http://www.w3.org/1999/xhtml\">Encounter for student log: {entry.specialty} on {entry.date}</div>"
            },
            "status": "finished" if entry.status == 'approved' else "planned",
            "class": {
                "system": "http://terminology.hl7.org/CodeSystem/v3-ActCode",
                "code": "AMB",
                "display": "ambulatory"
            },
            "subject": subject_data,
            "participant": participants,
            "period": {
                "start": str(entry.date)
            },
            "reasonCode": [
                {
                    "text": entry.activities or "No activities recorded"
                }
            ],
            "serviceType": {
                "text": entry.specialty or "Clinical"
            },
            "location": [
                {
                    "location": {
                        "display": entry.location or "Unknown Location"
                    }
                }
            ],
            "extension": extensions
        }
        
        # Assemble Bundle
        bundle = {
            "resourceType": "Bundle",
            "type": "collection",
            "timestamp": datetime.utcnow().isoformat() + "+00:00",
            "identifier": {
                "system": "http://clinlogix.org/fhir/student-logs",
                "value": str(entry.id)
            },
            "entry": [
                {
                    "fullUrl": f"urn:uuid:{entry.id}",
                    "resource": encounter_resource
                }
            ]
        }
        
        return self.success_response(bundle)
