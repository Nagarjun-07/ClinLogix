"""
Custom exception classes for better error handling
These exceptions extend DRF's APIException to provide
clear, standardized API error responses.
"""

# Import base exception class from Django REST Framework
from rest_framework.exceptions import APIException

# Import HTTP status codes for proper API responses
from rest_framework import status


class ProfileNotFoundError(APIException):
    """
    Exception raised when a user's profile does not exist
    or cannot be found in the database.
    """
    # HTTP 404 indicates the requested resource was not found
    status_code = status.HTTP_404_NOT_FOUND

    # Default error message returned in the API response
    default_detail = 'User profile not found.'

    # Internal error code used for identifying the error type
    default_code = 'profile_not_found'


class UnauthorizedAccessError(APIException):
    """
    Exception raised when a user attempts to access
    a resource without sufficient permissions.
    """
    # HTTP 403 indicates forbidden access
    status_code = status.HTTP_403_FORBIDDEN

    # Message shown to the client
    default_detail = 'You do not have permission to access this resource.'

    # Error identifier
    default_code = 'unauthorized_access'


class InvalidRoleError(APIException):
    """
    Exception raised when a user's role does not allow
    the requested operation.
    """
    # HTTP 403 used for role-based access control violations
    status_code = status.HTTP_403_FORBIDDEN

    # Error message for invalid role usage
    default_detail = 'Your role does not have permission for this operation.'

    # Error code for role validation failures
    default_code = 'invalid_role'


class DuplicateEntryError(APIException):
    """
    Exception raised when attempting to create
    a record that already exists.
    """
    # HTTP 409 indicates a conflict with existing data
    status_code = status.HTTP_409_CONFLICT

    # Message returned when duplicate data is detected
    default_detail = 'This entry already exists.'

    # Code used to identify duplicate entry errors
    default_code = 'duplicate_entry'


class ValidationError(APIException):
    """
    Custom exception for general validation failures
    not covered by serializer-level validation.
    """
    # HTTP 400 indicates a bad request from the client
    status_code = status.HTTP_400_BAD_REQUEST

    # Default validation failure message
    default_detail = 'Validation failed.'

    # Validation error identifier
    default_code = 'validation_error'


class ResourceNotFoundError(APIException):
    """
    Exception raised when a requested resource
    cannot be located.
    """
    # HTTP 404 used when any generic resource is missing
    status_code = status.HTTP_404_NOT_FOUND

    # Message shown when resource lookup fails
    default_detail = 'The requested resource was not found.'

    # Resource not found error code
    default_code = 'resource_not_found'


class BusinessLogicError(APIException):
    """
    Exception raised when application-specific
    business rules are violated.
    """
    # HTTP 422 indicates the request is valid but cannot be processed
    status_code = status.HTTP_422_UNPROCESSABLE_ENTITY

    # Message explaining business rule failure
    default_detail = 'Business logic validation failed.'

    # Error code for business logic issues
    default_code = 'business_logic_error'
