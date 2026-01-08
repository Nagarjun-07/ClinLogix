"""
Utility functions for common operations
"""
from django.core.mail import send_mail
from django.conf import settings
from api.models import Profiles, AuditLogs
import uuid
from datetime import datetime


def get_user_profile(user):
    """
    Get profile for a given user
    
    Args:
        user: Django User instance
        
    Returns:
        Profile instance or None
    """
    try:
        return Profiles.objects.get(email=user.email)
    except Profiles.DoesNotExist:
        return None


def has_role(user, role):
    """
    Check if user has a specific role
    
    Args:
        user: Django User instance
        role: Role string (student, instructor, admin)
        
    Returns:
        Boolean
    """
    profile = get_user_profile(user)
    return profile and profile.role == role


def log_audit(actor_id, action, entity_type, entity_id, metadata=None):
    """
    Create an audit log entry
    
    Args:
        actor_id: UUID of the user performing the action
        action: Action performed (create, update, delete, etc.)
        entity_type: Type of entity (log_entry, patient, etc.)
        entity_id: UUID of the entity
        metadata: Optional dict of additional data
    """
    AuditLogs.objects.create(
        id=uuid.uuid4(),
        actor_id=actor_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        metadata=metadata or {},
        created_at=datetime.now()
    )


def send_notification_email(to_email, subject, message):
    """
    Send notification email
    
    Args:
        to_email: Recipient email
        subject: Email subject
        message: Email body
    """
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[to_email],
            fail_silently=False,
        )
        return True
    except Exception as e:
        print(f"Email sending failed: {e}")
        return False


def generate_invitation_token():
    """
    Generate a unique invitation token
    
    Returns:
        String token
    """
    return str(uuid.uuid4())


def validate_hours(hours):
    """
    Validate clinical hours
    
    Args:
        hours: Number of hours
        
    Returns:
        Boolean
    """
    try:
        hours_float = float(hours)
        return 0 < hours_float <= 24
    except (ValueError, TypeError):
        return False


def calculate_total_hours(log_entries):
    """
    Calculate total hours from log entries
    
    Args:
        log_entries: QuerySet of LogEntries
        
    Returns:
        Float total hours
    """
    return sum(float(entry.hours) for entry in log_entries)


def format_date(date_obj, format_str='%Y-%m-%d'):
    """
    Format date object to string
    
    Args:
        date_obj: Date object
        format_str: Format string
        
    Returns:
        Formatted date string
    """
    if not date_obj:
        return None
    return date_obj.strftime(format_str)


def is_student_assigned_to_instructor(student_id, instructor_id):
    """
    Check if student is assigned to instructor
    
    Args:
        student_id: Student profile UUID
        instructor_id: Instructor profile UUID
        
    Returns:
        Boolean
    """
    from api.models import StudentPreceptorAssignments
    return StudentPreceptorAssignments.objects.filter(
        student_id=student_id,
        preceptor_id=instructor_id,
        status='active'
    ).exists()
