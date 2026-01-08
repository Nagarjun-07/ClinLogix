"""
Profile management views
"""
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from api.models import Profiles
from api.serializers import ProfileSerializer
from api.permissions import IsAdmin
from api.mixins import ResponseMixin


class ProfileViewSet(ResponseMixin, viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing user profiles (actual registered users)
    
    This is different from authorized_users which is just the invitation list.
    Profiles are created when users actually register.
    """
    serializer_class = ProfileSerializer
    permission_classes = [IsAdmin]
    queryset = Profiles.objects.all()

    def get_queryset(self):
        """Filter profiles by role if specified"""
        queryset = self.queryset
        role = self.request.query_params.get('role')
        if role:
            queryset = queryset.filter(role=role)
        return queryset.order_by('-created_at')
