"""
Custom exception classes for the application.
Provides consistent error handling across the Flask application.
"""


class APIException(Exception):
    """Base exception for API errors"""
    def __init__(self, message, status_code=400, error_code=None, details=None):
        self.message = message
        self.status_code = status_code
        self.error_code = error_code or self.__class__.__name__
        self.details = details or {}
        super().__init__(self.message)

    def to_dict(self):
        """Convert exception to dictionary format for API response"""
        return {
            'error': self.message,
            'error_code': self.error_code,
            'status_code': self.status_code,
            'details': self.details
        }


class ValidationError(APIException):
    """Raised when request validation fails"""
    def __init__(self, message, details=None):
        super().__init__(message, status_code=400, details=details)


class AuthenticationError(APIException):
    """Raised when authentication fails"""
    def __init__(self, message="Authentication failed"):
        super().__init__(message, status_code=401)


class AuthorizationError(APIException):
    """Raised when user lacks required permissions"""
    def __init__(self, message="Insufficient permissions"):
        super().__init__(message, status_code=403)


class ResourceNotFoundError(APIException):
    """Raised when a requested resource doesn't exist"""
    def __init__(self, resource_type, resource_id=None):
        message = f"{resource_type} not found"
        if resource_id:
            message += f" (ID: {resource_id})"
        super().__init__(message, status_code=404)


class ConflictError(APIException):
    """Raised when there's a conflict (e.g., duplicate resource)"""
    def __init__(self, message):
        super().__init__(message, status_code=409)


class InternalServerError(APIException):
    """Raised for unexpected server errors"""
    def __init__(self, message="An unexpected error occurred"):
        super().__init__(message, status_code=500)


class ExternalServiceError(APIException):
    """Raised when external service (e.g., AI API) fails"""
    def __init__(self, service_name, message=None):
        msg = f"Error communicating with {service_name}"
        if message:
            msg += f": {message}"
        super().__init__(msg, status_code=502)
