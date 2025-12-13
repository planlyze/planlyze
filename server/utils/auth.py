"""
JWT and authentication utilities.
"""
import jwt
from datetime import datetime, timedelta
from functools import wraps
from flask import request, current_app
from server.exceptions import AuthenticationError, AuthorizationError


def generate_token(user_id, expires_in=None):
    """Generate a JWT token for a user"""
    if expires_in is None:
        expires_in = current_app.config.get('JWT_ACCESS_TOKEN_EXPIRES', 86400)
    
    payload = {
        'user_id': user_id,
        'iat': datetime.utcnow(),
        'exp': datetime.utcnow() + timedelta(seconds=expires_in)
    }
    
    token = jwt.encode(
        payload,
        current_app.config['JWT_SECRET_KEY'],
        algorithm='HS256'
    )
    return token


def verify_token(token):
    """Verify and decode a JWT token"""
    try:
        payload = jwt.decode(
            token,
            current_app.config['JWT_SECRET_KEY'],
            algorithms=['HS256']
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise AuthenticationError("Token has expired")
    except jwt.InvalidTokenError:
        raise AuthenticationError("Invalid token")


def get_token_from_request():
    """Extract JWT token from request headers"""
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        raise AuthenticationError("Missing authorization header")
    
    parts = auth_header.split()
    if len(parts) != 2 or parts[0].lower() != 'bearer':
        raise AuthenticationError("Invalid authorization header format")
    
    return parts[1]


def token_required(f):
    """Decorator to require valid JWT token"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            token = get_token_from_request()
            payload = verify_token(token)
            request.user_id = payload['user_id']
            return f(*args, **kwargs)
        except AuthenticationError as e:
            return {'error': str(e)}, 401
    return decorated_function


def admin_required(f):
    """Decorator to require admin role"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            token = get_token_from_request()
            payload = verify_token(token)
            request.user_id = payload['user_id']
            
            # Import here to avoid circular imports
            from server.models import User
            user = User.query.get(payload['user_id'])
            
            if not user or user.role != 'admin':
                raise AuthorizationError("Admin access required")
            
            return f(*args, **kwargs)
        except (AuthenticationError, AuthorizationError) as e:
            return {'error': str(e)}, 401 if isinstance(e, AuthenticationError) else 403
    return decorated_function
