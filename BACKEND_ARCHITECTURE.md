# Planlyze Backend Architecture

Professional Flask + PostgreSQL backend following best practices.

## Directory Structure

```
server/
├── __init__.py
├── app.py                 # Application factory and initialization
├── config.py              # Configuration management (dev, test, prod)
├── models.py              # SQLAlchemy ORM models
├── exceptions.py          # Custom exception classes
├── utils/
│   ├── __init__.py
│   ├── auth.py           # JWT token generation and verification
│   ├── validators.py     # Input validation utilities
│   └── response.py       # Consistent API response formatting
├── routes/
│   ├── __init__.py
│   ├── auth.py           # Authentication endpoints
│   ├── entities.py       # Entity management endpoints
│   └── ai.py             # AI integration endpoints
└── migrations/           # Alembic database migrations
    ├── alembic.ini
    ├── env.py
    ├── script.py.mako
    └── versions/
```

## Key Features

### Error Handling
- Custom `APIException` base class for consistent error responses
- Specific exception types: `ValidationError`, `AuthenticationError`, `ResourceNotFoundError`, etc.
- All errors return standardized JSON format with error codes

### Authentication
- JWT token-based authentication
- Token generation and verification utilities
- `@token_required` and `@admin_required` decorators
- Secure token extraction from Authorization headers

### Validation
- Centralized validator for common patterns
- Email, password, string, integer validation
- Enum and custom validation support
- Detailed validation error messages

### API Responses
- Standardized response format for all endpoints
- Success/error response wrapper
- Pagination support
- Consistent timestamps and status codes

### Database
- Flask-SQLAlchemy ORM with type safety
- Alembic migrations for schema management
- Model serialization with `to_dict()` methods
- Support for PostgreSQL-specific features

## Configuration

### Environment Variables

```bash
FLASK_ENV=development              # development, testing, or production
DATABASE_URL=postgresql://...      # PostgreSQL connection string
SECRET_KEY=...                     # Flask secret key
JWT_SECRET_KEY=...                 # JWT signing key
ANTHROPIC_API_KEY=...              # AI API key
CORS_ORIGINS=*                     # Allowed CORS origins
ITEMS_PER_PAGE=20                  # Pagination size
JWT_ACCESS_TOKEN_EXPIRES=86400     # Token expiry in seconds
```

## Running the Application

### Development
```bash
FLASK_ENV=development FLASK_APP=server.app:app flask run
```

### Production
```bash
FLASK_ENV=production gunicorn -w 4 server.app:app
```

## Database Migrations

### Create a migration
```bash
FLASK_APP=server.app:app python -m flask db migrate -m "Description"
```

### Apply migrations
```bash
FLASK_APP=server.app:app python -m flask db upgrade
```

### Rollback migration
```bash
FLASK_APP=server.app:app python -m flask db downgrade
```

## API Response Format

### Success Response
```json
{
  "success": true,
  "message": "Success",
  "data": { /* actual data */ },
  "timestamp": "2025-12-13T10:30:00.000000"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "error_code": "ERROR_TYPE",
  "status_code": 400,
  "details": { /* optional details */ },
  "timestamp": "2025-12-13T10:30:00.000000"
}
```

### Paginated Response
```json
{
  "success": true,
  "data": [ /* items */ ],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 100,
    "pages": 5
  },
  "timestamp": "2025-12-13T10:30:00.000000"
}
```

## Best Practices

1. **Always validate input** - Use `Validator` class for consistent validation
2. **Use APIResponse** - Return responses using `APIResponse.success()` or `APIResponse.error()`
3. **Throw APIException** - Use custom exceptions for error handling
4. **Document endpoints** - Include docstrings with request/response format
5. **Use decorators** - Apply `@token_required` for protected routes
6. **Handle edge cases** - Check for None values and empty data
7. **Log important events** - Use Python logging for debugging
8. **Test thoroughly** - Write unit and integration tests

## Adding a New Endpoint

1. Create a function in appropriate `routes/*.py` file
2. Add `@token_required` or `@admin_required` decorator if needed
3. Validate input using `Validator` class
4. Return response using `APIResponse.success()` or `APIResponse.error()`
5. Add error handling for external service calls
6. Document request/response format

Example:
```python
from flask import Blueprint, request
from server.utils.auth import token_required
from server.utils.response import APIResponse
from server.utils.validators import Validator
from server.exceptions import ValidationError
from server.models import db, User

bp = Blueprint('example', __name__)

@bp.route('/users/<int:user_id>', methods=['GET'])
@token_required
def get_user(user_id):
    """Get user by ID"""
    user = User.query.get(user_id)
    if not user:
        return APIResponse.error('User not found', status_code=404)
    
    return APIResponse.success(user.to_dict(), message='User retrieved')
```
