"""
Reusable mixins for common functionality
"""
from rest_framework.response import Response
from rest_framework import status
from api.models import Profiles


class UserProfileMixin:
    """
    Mixin to get current user's profile
    """
    def get_user_profile(self):
        """Get the profile of the authenticated user"""
        try:
            return Profiles.objects.get(email=self.request.user.email)
        except Profiles.DoesNotExist:
            return None


class FilterByUserMixin(UserProfileMixin):
    """
    Mixin to automatically filter queryset by current user
    """
    def get_queryset(self):
        """Filter queryset based on user's profile"""
        queryset = super().get_queryset()
        profile = self.get_user_profile()
        
        if not profile:
            return queryset.none()
        
        # Override this method in child classes for custom filtering
        return self.filter_queryset_by_profile(queryset, profile)
    
    def filter_queryset_by_profile(self, queryset, profile):
        """
        Override this method to implement custom filtering logic
        """
        raise NotImplementedError("Subclasses must implement filter_queryset_by_profile")


class AuditMixin:
    """
    Mixin to add audit trail functionality
    """
    def perform_create(self, serializer):
        """Add created_by field on creation"""
        instance = serializer.save(created_by=self.request.user)
        self.log_action('create', instance)
        return instance
    
    def perform_update(self, serializer):
        """Add updated_by field on update"""
        instance = serializer.save(updated_by=self.request.user)
        self.log_action('update', instance)
        return instance
    
    def perform_destroy(self, instance):
        """Log deletion"""
        self.log_action('delete', instance)
        instance.delete()
    
    def log_action(self, action, instance):
        """
        Log the action to audit trail
        Override this method to implement custom logging
        """
        # This can be extended to log to AuditLogs model
        pass


class ResponseMixin:
    """
    Mixin for standardized API responses
    """
    def success_response(self, data=None, message="Success", status_code=status.HTTP_200_OK):
        """Return standardized success response"""
        return Response({
            'success': True,
            'message': message,
            'data': data
        }, status=status_code)
    
    def error_response(self, message="Error occurred", errors=None, status_code=status.HTTP_400_BAD_REQUEST):
        """Return standardized error response"""
        response_data = {
            'success': False,
            'message': message
        }
        if errors:
            response_data['errors'] = errors
        
        return Response(response_data, status=status_code)


class PaginationMixin:
    """
    Mixin for consistent pagination settings
    """
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100
