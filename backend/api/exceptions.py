"""
Custom exception classes for better error handling
"""

# Import base exception class used by Django REST Framework
from rest_framework.exceptions import APIException

# Import HTTP status codes (404, 403, etc.)
from rest_framework import status


# ==========================
# Profile Not Found Error
# ==========================
class ProfileNotFoundError(APIException):
    # Raised when the requested user profile does not exist
    """Raised when user profile is not found"""

    # HTTP 404 response status
    status_code = status.HTTP_404_NOT_FOUND

    # Default error message returned in the API response
    default_detail = 'User profile not found.'

    # Internal error code for this exception
    default_code = 'profile_not_found'


# ==========================
# Unauthorized Access Error
# ==========================
class UnauthorizedAccessError(APIException):
    # Raised when a user tries to access a restricted resource
    """Raised when user tries to access unauthorized resource"""

    # HTTP 403 response status
    status_code = status.HTTP_403_FORBIDDEN

    # Default error message returned in the API response
    default_detail = 'You do not have permission to access this resource.'

    # Internal error code for this exception
    default_code = 'unauthorized_access'


# ==========================
# Invalid Role Error
# ==========================
class InvalidRoleError(APIException):
    # Raised when the user's role is not allowed to perform an operation
    """Raised when user has invalid role for the operation"""

    # HTTP 403 response status
    status_code = status.HTTP_403_FORBIDDEN

    # Default error message returned in the API response
    default_detail = 'Your role does not have permission for this operation.'

    # Internal error code for this exception
    default_code = 'invalid_role'


# ==========================
# Duplicate Entry Error
# ==========================
class DuplicateEntryError(APIException):
    # Raised when attempting to create a record that already exists
    """Raised when trying to create duplicate entry"""

    # HTTP 409 response status (Conflict)
    status_code = status.HTTP_409_CONFLICT

    # Default error message returned in the API response
    default_detail = 'This entry already exists.'

    # Internal error code for this exception
    default_code = 'duplicate_entry'


# ==========================
# Validation Error
# ==========================
class ValidationError(APIException):
    # Raised when request data fails validation
    """Custom validation error"""

    # HTTP 400 response status
    status_code = status.HTTP_400_BAD_REQUEST

    # Default error message returned in the API response
    default_detail = 'Validation failed.'

    # Internal error code for this exception
    default_code = 'validation_error'


# ==========================
# Resource Not Found Error
# ==========================
class ResourceNotFoundError(APIException):
    # Raised when a requested resource does not exist
    """Raised when requested resource is not found"""

    # HTTP 404 response status
    status_code = status.HTTP_404_NOT_FOUND

    # Default error message returned in the API response
    default_detail = 'The requested resource was not found.'

    # Internal error code for this exception
    default_code = 'resource_not_found'


# ==========================
# Business Logic Error
# ==========================
class BusinessLogicError(APIException):
    # Raised when application-specific business rules fail
    """Raised when business logic validation fails"""

    # HTTP 422 response status (Unprocessable Entity)
    status_code = status.HTTP_422_UNPROCESSABLE_ENTITY

    # Default error message returned in the API response
    default_detail = 'Business logic validation failed.'

    # Internal error code for this exception
    default_code = 'business_logic_error'
