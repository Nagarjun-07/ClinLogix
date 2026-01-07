"""
Custom permission classes for role-based access control
"""
from rest_framework import permissions
from api.models import Profiles


class IsStudent(permissions.BasePermission):
    """
    Permission check for student role
    """
    message = "Only students can access this resource."

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        try:
            profile = Profiles.objects.get(email=request.user.email)
            return profile.role == 'student'
        except Profiles.DoesNotExist:
            return False


class IsInstructor(permissions.BasePermission):
    """
    Permission check for instructor role
    """
    message = "Only instructors can access this resource."

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        try:
            profile = Profiles.objects.get(email=request.user.email)
            return profile.role == 'instructor'
        except Profiles.DoesNotExist:
            return False


class IsAdmin(permissions.BasePermission):
    """
    Permission check for admin role
    """
    message = "Only administrators can access this resource."

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        try:
            profile = Profiles.objects.get(email=request.user.email)
            return profile.role == 'admin'
        except Profiles.DoesNotExist:
            return False


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Object-level permission to only allow owners to edit
    """
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed for any request
        if request.method in permissions.SAFE_METHODS:
            return True

        # Write permissions only for the owner
        return obj.student.email == request.user.email


class IsAssignedInstructor(permissions.BasePermission):
    """
    Permission to check if instructor is assigned to the student
    """
    message = "You are not assigned to this student."

    def has_object_permission(self, request, view, obj):
        if not request.user.is_authenticated:
            return False
        
        try:
            profile = Profiles.objects.get(email=request.user.email)
            # Check if this instructor is assigned to the student
            from api.models import StudentPreceptorAssignments
            return StudentPreceptorAssignments.objects.filter(
                student=obj.student,
                preceptor=profile,
                status='active'
            ).exists()
        except Profiles.DoesNotExist:
            return False
