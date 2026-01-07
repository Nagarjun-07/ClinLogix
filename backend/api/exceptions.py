"""
Custom exception classes for better error handling
"""
from rest_framework.exceptions import APIException
from rest_framework import status


class ProfileNotFoundError(APIException):
    """Raised when user profile is not found"""
    status_code = status.HTTP_404_NOT_FOUND
    default_detail = 'User profile not found.'
    default_code = 'profile_not_found'


class UnauthorizedAccessError(APIException):
    """Raised when user tries to access unauthorized resource"""
    status_code = status.HTTP_403_FORBIDDEN
    default_detail = 'You do not have permission to access this resource.'
    default_code = 'unauthorized_access'


class InvalidRoleError(APIException):
    """Raised when user has invalid role for the operation"""
    status_code = status.HTTP_403_FORBIDDEN
    default_detail = 'Your role does not have permission for this operation.'
    default_code = 'invalid_role'


class DuplicateEntryError(APIException):
    """Raised when trying to create duplicate entry"""
    status_code = status.HTTP_409_CONFLICT
    default_detail = 'This entry already exists.'
    default_code = 'duplicate_entry'


class ValidationError(APIException):
    """Custom validation error"""
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = 'Validation failed.'
    default_code = 'validation_error'


class ResourceNotFoundError(APIException):
    """Raised when requested resource is not found"""
    status_code = status.HTTP_404_NOT_FOUND
    default_detail = 'The requested resource was not found.'
    default_code = 'resource_not_found'


class BusinessLogicError(APIException):
    """Raised when business logic validation fails"""
    status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
    default_detail = 'Business logic validation failed.'
    default_code = 'business_logic_error'
