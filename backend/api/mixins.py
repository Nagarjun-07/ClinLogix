"""
Reusable mixins for common functionality
These mixins are designed to be shared across multiple
views to avoid code duplication and enforce consistency.
"""

# Import DRF Response class for building HTTP responses
from rest_framework.response import Response

# Import HTTP status codes for standardized API responses
from rest_framework import status

# Import Profiles model to fetch user-related profile data
from api.models import Profiles


class UserProfileMixin:
    """
    Mixin to retrieve the currently authenticated user's profile.
    Intended to be used in views that require profile-level access.
    """

    def get_user_profile(self):
        """
        Fetch the profile associated with the authenticated user
        using the user's email address.
        """
        try:
            # Attempt to get the profile matching the logged-in user's email
            return Profiles.objects.get(email=self.request.user.email)
        except Profiles.DoesNotExist:
            # Return None if no profile is found for the user
            return None


class FilterByUserMixin(UserProfileMixin):
    """
    Mixin to automatically filter a queryset based on
    the currently authenticated user's profile.
    Inherits user profile retrieval logic.
    """

    def get_queryset(self):
        """
        Override default queryset behavior to apply
        profile-based filtering.
        """
        # Get the base queryset from the parent view
        queryset = super().get_queryset()

        # Retrieve the current user's profile
        profile = self.get_user_profile()
        
        # If no profile exists, return an empty queryset
        if not profile:
            return queryset.none()
        
        # Delegate filtering logic to a child-implemented method
        return self.filter_queryset_by_profile(queryset, profile)
    
    def filter_queryset_by_profile(self, queryset, profile):
        """
        Enforce implementation of custom filtering logic
        in child classes.
        """
        # Child classes must define how queryset is filtered
        raise NotImplementedError(
            "Subclasses must implement filter_queryset_by_profile"
        )


class AuditMixin:
    """
    Mixin to add audit trail support for create, update,
    and delete operations.
    """

    def perform_create(self, serializer):
        """
        Automatically set the created_by field during object creation
        and log the create action.
        """
        # Save instance with the current user as creator
        instance = serializer.save(created_by=self.request.user)

        # Log the create action
        self.log_action('create', instance)
        return instance
    
    def perform_update(self, serializer):
        """
        Automatically set the updated_by field during object updates
        and log the update action.
        """
        # Save instance with the current user as updater
        instance = serializer.save(updated_by=self.request.user)

        # Log the update action
        self.log_action('update', instance)
        return instance
    
    def perform_destroy(self, instance):
        """
        Log the delete action before permanently
        removing the object.
        """
        # Log the delete action
        self.log_action('delete', instance)

        # Delete the instance from the database
        instance.delete()
    
    def log_action(self, action, instance):
        """
        Hook method for audit logging.
        Intended to be overridden to store logs in an audit table
        or external logging system.
        """
        # Placeholder for custom audit logging implementation
        pass


class ResponseMixin:
    """
    Mixin to provide standardized success and error
    response structures across APIs.
    """

    def success_response(self, data=None, message="Success", status_code=status.HTTP_200_OK):
        """
        Build and return a consistent success response payload.
        """
        return Response(
            {
                'success': True,
                'message': message,
                'data': data
            },
            status=status_code
        )
    
    def error_response(self, message="Error occurred", errors=None, status_code=status.HTTP_400_BAD_REQUEST):
        """
        Build and return a consistent error response payload.
        """
        # Base error response structure
        response_data = {
            'success': False,
            'message': message
        }

        # Include detailed errors if provided
        if errors:
            response_data['errors'] = errors
        
        return Response(response_data, status=status_code)


class PaginationMixin:
    """
    Mixin to define consistent pagination settings
    across multiple list-based API views.
    """
    # Default number of records per page
    page_size = 20

    # Query parameter name to override page size
    page_size_query_param = 'page_size'

    # Maximum allowed page size to prevent abuse
    max_page_size = 100
