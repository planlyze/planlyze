"""
Validators for request data validation.
"""
import re
from server.exceptions import ValidationError


class Validator:
    """Base validator class"""
    
    @staticmethod
    def validate_email(email):
        """Validate email format"""
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(pattern, email):
            raise ValidationError("Invalid email format")
        return email

    @staticmethod
    def validate_password(password):
        """Validate password requirements"""
        if len(password) < 8:
            raise ValidationError("Password must be at least 8 characters long")
        if not re.search(r'[A-Z]', password):
            raise ValidationError("Password must contain at least one uppercase letter")
        if not re.search(r'[a-z]', password):
            raise ValidationError("Password must contain at least one lowercase letter")
        if not re.search(r'[0-9]', password):
            raise ValidationError("Password must contain at least one number")
        return password

    @staticmethod
    def validate_required(value, field_name):
        """Validate that a value is provided"""
        if value is None or (isinstance(value, str) and not value.strip()):
            raise ValidationError(f"{field_name} is required")
        return value

    @staticmethod
    def validate_string(value, field_name, min_length=1, max_length=None):
        """Validate string format"""
        if not isinstance(value, str):
            raise ValidationError(f"{field_name} must be a string")
        if len(value) < min_length:
            raise ValidationError(f"{field_name} must be at least {min_length} characters")
        if max_length and len(value) > max_length:
            raise ValidationError(f"{field_name} must not exceed {max_length} characters")
        return value

    @staticmethod
    def validate_integer(value, field_name, min_value=None, max_value=None):
        """Validate integer format"""
        if not isinstance(value, int) or isinstance(value, bool):
            raise ValidationError(f"{field_name} must be an integer")
        if min_value is not None and value < min_value:
            raise ValidationError(f"{field_name} must be at least {min_value}")
        if max_value is not None and value > max_value:
            raise ValidationError(f"{field_name} must not exceed {max_value}")
        return value

    @staticmethod
    def validate_enum(value, field_name, allowed_values):
        """Validate value is in allowed list"""
        if value not in allowed_values:
            raise ValidationError(
                f"Invalid value for {field_name}",
                details={'allowed': allowed_values}
            )
        return value
