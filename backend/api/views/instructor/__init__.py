"""
Instructor-specific views with enterprise-level structure
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

from api.models import LogEntries, Profiles, StudentPreceptorAssignments
from api.serializers import LogEntrySerializer, ProfileSerializer
from api.permissions import IsInstructor, IsAssignedInstructor
from api.mixins import UserProfileMixin, FilterByUserMixin, ResponseMixin
from api.exceptions import ProfileNotFoundError, ValidationError
from api.constants import Messages, LogStatus, AssignmentStatus
from api.utils import log_audit, send_notification_email


class InstructorReviewViewSet(FilterByUserMixin, ResponseMixin, viewsets.ModelViewSet):
    """
    ViewSet for instructors to review student log entries
    
    Endpoints:
        - GET /api/instructor/reviews/ - List student logs
        - GET /api/instructor/reviews/{id}/ - Get specific log
        - POST /api/instructor/reviews/{id}/approve/ - Approve log
        - POST /api/instructor/reviews/{id}/reject/ - Reject log
        - GET /api/instructor/reviews/pending/ - Get pending reviews
    """
    serializer_class = LogEntrySerializer
    permission_classes = [IsInstructor]
    queryset = LogEntries.objects.all()

    def filter_queryset_by_profile(self, queryset, profile):
        """Filter logs to show only assigned students' entries"""
        # Get all students assigned to this instructor
        assignments = StudentPreceptorAssignments.objects.filter(
            preceptor=profile,
            status=AssignmentStatus.ACTIVE
        )
        student_ids = assignments.values_list('student_id', flat=True)
        return queryset.filter(student_id__in=student_ids).order_by('-submitted_at')

    def get_permissions(self):
        """Add object-level permission for approve/reject actions"""
        if self.action in ['approve', 'reject']:
            return [IsInstructor(), IsAssignedInstructor()]
        return super().get_permissions()

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """
        Approve a log entry
        
        Request body:
            - feedback: Optional feedback message
        """
        log_entry = self.get_object()
        feedback = request.data.get('feedback', '')
        
        # Update log entry
        log_entry.status = LogStatus.APPROVED
        log_entry.feedback = feedback
        log_entry.save()
        
        # Log the action
        profile = self.get_user_profile()
        log_audit(
            actor_id=profile.id,
            action='approve',
            entity_type='log_entry',
            entity_id=log_entry.id,
            metadata={'feedback': feedback}
        )
        
        # Send notification email to student
        send_notification_email(
            to_email=log_entry.student.email,
            subject='Log Entry Approved',
            message=f'Your log entry for {log_entry.date} has been approved.\\n\\nFeedback: {feedback}'
        )
        
        return self.success_response(
            data=self.get_serializer(log_entry).data,
            message=Messages.LOG_APPROVED
        )

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """
        Reject a log entry
        
        Request body:
            - feedback: Required feedback message
        """
        log_entry = self.get_object()
        feedback = request.data.get('feedback')
        
        if not feedback:
            raise ValidationError("Feedback is required when rejecting a log entry")
        
        # Update log entry
        log_entry.status = LogStatus.REJECTED
        log_entry.feedback = feedback
        log_entry.save()
        
        # Log the action
        profile = self.get_user_profile()
        log_audit(
            actor_id=profile.id,
            action='reject',
            entity_type='log_entry',
            entity_id=log_entry.id,
            metadata={'feedback': feedback}
        )
        
        # Send notification email to student
        send_notification_email(
            to_email=log_entry.student.email,
            subject='Log Entry Requires Revision',
            message=f'Your log entry for {log_entry.date} needs revision.\\n\\nFeedback: {feedback}'
        )
        
        return self.success_response(
            data=self.get_serializer(log_entry).data,
            message=Messages.LOG_REJECTED
        )

    @action(detail=False, methods=['get'])
    def pending(self, request):
        """Get all pending log entries for review"""
        queryset = self.get_queryset().filter(status=LogStatus.PENDING)
        serializer = self.get_serializer(queryset, many=True)
        
        return self.success_response(
            data=serializer.data,
            message=f"Found {queryset.count()} pending entries"
        )


class InstructorStudentViewSet(FilterByUserMixin, ResponseMixin, viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for instructors to view their assigned students
    
    Endpoints:
        - GET /api/instructor/students/ - List assigned students
        - GET /api/instructor/students/{id}/ - Get specific student
    """
    serializer_class = ProfileSerializer
    permission_classes = [IsInstructor]
    queryset = Profiles.objects.all()

    def filter_queryset_by_profile(self, queryset, profile):
        """Filter to show only assigned students"""
        assignments = StudentPreceptorAssignments.objects.filter(
            preceptor=profile,
            status=AssignmentStatus.ACTIVE
        )
        student_ids = assignments.values_list('student_id', flat=True)
        return queryset.filter(id__in=student_ids)
