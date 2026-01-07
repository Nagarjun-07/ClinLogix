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


# Export all viewsets for URL routing
__all__ = [
    'MeView',
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
