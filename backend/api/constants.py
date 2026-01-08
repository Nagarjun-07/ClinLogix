"""
Application-wide constants
"""

# User Roles
class UserRoles:
    STUDENT = 'student'
    INSTRUCTOR = 'instructor'
    ADMIN = 'admin'
    
    CHOICES = [
        (STUDENT, 'Student'),
        (INSTRUCTOR, 'Instructor'),
        (ADMIN, 'Administrator'),
    ]


# Log Entry Status
class LogStatus:
    PENDING = 'pending'
    APPROVED = 'approved'
    REJECTED = 'rejected'
    
    CHOICES = [
        (PENDING, 'Pending Review'),
        (APPROVED, 'Approved'),
        (REJECTED, 'Rejected'),
    ]


# Assignment Status
class AssignmentStatus:
    ACTIVE = 'active'
    INACTIVE = 'inactive'
    COMPLETED = 'completed'
    
    CHOICES = [
        (ACTIVE, 'Active'),
        (INACTIVE, 'Inactive'),
        (COMPLETED, 'Completed'),
    ]


# Invitation Status
class InvitationStatus:
    PENDING = 'pending'
    REGISTERED = 'registered'
    
    CHOICES = [
        (PENDING, 'Pending'),
        (REGISTERED, 'Registered'),
    ]


# API Response Messages
class Messages:
    # Success messages
    LOGIN_SUCCESS = "Login successful"
    LOGOUT_SUCCESS = "Logout successful"
    CREATED_SUCCESS = "Created successfully"
    UPDATED_SUCCESS = "Updated successfully"
    DELETED_SUCCESS = "Deleted successfully"
    
    # Error messages
    UNAUTHORIZED = "Unauthorized access"
    NOT_FOUND = "Resource not found"
    VALIDATION_ERROR = "Validation error"
    PERMISSION_DENIED = "Permission denied"
    ALREADY_EXISTS = "Resource already exists"
    
    # Log entry messages
    LOG_APPROVED = "Log entry approved successfully"
    LOG_REJECTED = "Log entry rejected"
    LOG_SUBMITTED = "Log entry submitted for review"
    
    # Assignment messages
    STUDENT_ASSIGNED = "Student assigned successfully"
    PATIENT_ASSIGNED = "Patient assigned successfully"


# Pagination
class Pagination:
    DEFAULT_PAGE_SIZE = 20
    MAX_PAGE_SIZE = 100


# Date/Time Formats
class DateTimeFormats:
    DATE_FORMAT = '%Y-%m-%d'
    DATETIME_FORMAT = '%Y-%m-%d %H:%M:%S'
    TIME_FORMAT = '%H:%M:%S'
