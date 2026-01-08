"""
Main API views package - imports from organized role-based modules
"""
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from api.models import Profiles
from api.serializers import UserSerializer, ProfileSerializer

# Import role-specific views
from .student import StudentLogViewSet, StudentPatientViewSet
from .instructor import InstructorReviewViewSet, InstructorStudentViewSet
from .admin import (
    AdminUserManagementViewSet, AdminInstitutionViewSet, 
    AdminPatientViewSet, AdminAssignmentViewSet, AdminDashboardViewSet
)
from .profiles import ProfileViewSet


class MeView(APIView):
    """
    Get current authenticated user's profile
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            user_serializer = UserSerializer(request.user)
            try:
                profile = Profiles.objects.get(email=request.user.email)
                profile_serializer = ProfileSerializer(profile)
                return Response({
                    'user': user_serializer.data,
                    'profile': profile_serializer.data
                })
            except Profiles.DoesNotExist:
                return Response({
                    'user': user_serializer.data,
                    'profile': None
                }, status=status.HTTP_200_OK)
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({
                'error': str(e),
                'detail': 'Error fetching user profile'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class RegisterView(APIView):
    """
    Register a new user who was invited by admin.
    Checks if the email exists in AuthorizedUsers with status='pending'.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        from django.contrib.auth.models import User
        from api.models import AuthorizedUsers
        
        email = request.data.get('email')
        password = request.data.get('password')
        name = request.data.get('name', '')
        
        if not email or not password:
            return Response({
                'error': 'Email and password are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if user is authorized (invited by admin)
        try:
            authorized = AuthorizedUsers.objects.get(email=email)
        except AuthorizedUsers.DoesNotExist:
            return Response({
                'error': 'This email is not authorized. Please contact your administrator for an invitation.'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Check if already registered
        if authorized.status == 'registered':
            return Response({
                'error': 'This email is already registered. Please login instead.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if Django user already exists
        if User.objects.filter(email=email).exists():
            return Response({
                'error': 'An account with this email already exists.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Create Django User
        try:
            user = User.objects.create_user(
                username=email,  # Use email as username
                email=email,
                password=password,
                first_name=name or authorized.full_name or ''
            )
            
            # Update AuthorizedUsers status
            authorized.status = 'registered'
            authorized.save()
            
            # Update Profile if it exists (should have been created by admin invite)
            try:
                profile = Profiles.objects.get(email=email)
                # Profile already exists from admin invite - just ensure it's linked
            except Profiles.DoesNotExist:
                # Create profile if it doesn't exist
                import uuid
                from django.utils import timezone
                Profiles.objects.create(
                    id=uuid.uuid4(),
                    email=email,
                    full_name=name or authorized.full_name,
                    role=authorized.role,
                    institution=authorized.institution,
                    created_at=timezone.now()
                )
            
            return Response({
                'success': True,
                'message': 'Registration successful! You can now login.',
                'role': authorized.role
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({
                'error': f'Registration failed: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# Export all viewsets for URL routing
__all__ = [
    'MeView',
    'RegisterView',
    'StudentLogViewSet',
    'StudentPatientViewSet',
    'InstructorReviewViewSet',
    'InstructorStudentViewSet',
    'AdminUserManagementViewSet',
    'AdminInstitutionViewSet',
    'AdminPatientViewSet',
    'AdminAssignmentViewSet',
    'AdminDashboardViewSet',
    'ProfileViewSet',
]
