# Code Style Guide

Professional coding standards and conventions for Planlyze.

## Python (Backend)

### Naming Conventions
```python
# Functions and variables: snake_case
def get_user_by_id(user_id):
    pass

# Classes: PascalCase
class UserService:
    pass

# Constants: UPPER_SNAKE_CASE
MAX_ATTEMPTS = 3
DEFAULT_TIMEOUT = 30

# Private methods/attributes: _leading_underscore
def _validate_email(email):
    pass
```

### Code Style
```python
# Use type hints
def create_user(email: str, password: str) -> User:
    """Create a new user with email and password."""
    # Implementation
    pass

# Use docstrings for functions and classes
class AnalysisService:
    """Service for managing analysis operations."""
    
    @staticmethod
    def generate_report(analysis_id: int) -> dict:
        """
        Generate a report for the given analysis.
        
        Args:
            analysis_id: The ID of the analysis
            
        Returns:
            Generated report data as dictionary
            
        Raises:
            ResourceNotFoundError: If analysis doesn't exist
        """
        pass

# Use context managers
with app.app_context():
    db.session.query(User).all()

# Use list/dict comprehensions
user_names = [user.name for user in users]
user_dict = {user.id: user.name for user in users}
```

### Import Organization
```python
# 1. Standard library
import os
import json
from datetime import datetime

# 2. Third-party
from flask import Flask, request
from sqlalchemy import Column, Integer

# 3. Local imports
from server.models import User, db
from server.exceptions import ValidationError
from server.utils.validators import Validator
```

### Error Handling
```python
# Use custom exceptions
try:
    user = User.query.get(user_id)
    if not user:
        raise ResourceNotFoundError('User', user_id)
except APIException:
    raise  # Re-raise custom exceptions
except Exception as e:
    logger.error(f"Unexpected error: {str(e)}")
    raise InternalServerError()

# Use try-except for specific exceptions
try:
    response = httpClient.get(url)
except HTTPError as e:
    raise ExternalServiceError('External API', str(e))
```

## JavaScript (Frontend)

### Naming Conventions
```javascript
// Variables and functions: camelCase
const getUserById = (userId) => {
  const userData = {};
  return userData;
};

// Components: PascalCase
function UserCard({ user }) {
  return <div>{user.name}</div>;
}

// Constants: UPPER_SNAKE_CASE
const API_BASE_URL = '/api';
const MAX_RETRIES = 3;

// Private functions: _leading underscore or nested scope
function _validateEmail(email) {
  return email.includes('@');
}
```

### Code Style
```javascript
// Use arrow functions for callbacks
const handleClick = () => {
  doSomething();
};

// Use const/let, not var
const immutableValue = 'constant';
let mutableValue = 'variable';

// Use destructuring
const { user, isLoading } = useAuth();
const { id, name, email } = user;

// Use template literals
const message = `User ${user.name} logged in`;

// Use async/await
async function fetchData() {
  try {
    const response = await api.get('/data');
    return response;
  } catch (error) {
    logger.error('Failed to fetch:', error);
  }
}
```

### JSDoc Comments
```javascript
/**
 * Fetch user by ID from the API
 * 
 * @param {number} userId - The user's unique identifier
 * @returns {Promise<Object>} User data
 * @throws {APIError} If user doesn't exist
 * 
 * @example
 * const user = await fetchUser(123);
 * console.log(user.name);
 */
function fetchUser(userId) {
  return api.get(`/users/${userId}`);
}
```

### React Components
```javascript
// Functional components with hooks
function UserProfile({ userId }) {
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    loadUser();
  }, [userId]);

  const loadUser = async () => {
    try {
      const data = await userService.getById(userId);
      setUser(data);
    } catch (error) {
      console.error('Failed to load user:', error);
    }
  };

  if (!user) return <LoadingSpinner />;

  return (
    <div className="profile">
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
}

UserProfile.propTypes = {
  userId: PropTypes.number.isRequired,
};

export default UserProfile;
```

## Git Commit Messages

### Format
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Examples
```
feat(auth): Add JWT token refresh endpoint

Implement automatic token refresh mechanism to improve user experience
when tokens are about to expire.

Closes #123

fix(database): Prevent duplicate user emails

Add unique constraint on email column in users table.

chore(deps): Update Flask to 3.1.2

refactor(api): Extract validation logic into separate service

docs(readme): Add deployment instructions
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style changes
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding tests
- `chore`: Build, dependencies, etc.

## Code Organization

### Backend Route Structure
```python
# routes/users.py
from flask import Blueprint
from server.utils.auth import token_required
from server.utils.response import APIResponse
from server.models import User

bp = Blueprint('users', __name__)

@bp.route('/', methods=['GET'])
@token_required
def list_users():
    """List all users (admin only)"""
    users = User.query.all()
    return APIResponse.success([u.to_dict() for u in users])

@bp.route('/<int:user_id>', methods=['GET'])
@token_required
def get_user(user_id):
    """Get specific user"""
    user = User.query.get(user_id)
    if not user:
        return APIResponse.error('User not found', 404)
    return APIResponse.success(user.to_dict())
```

### Frontend Component Structure
```javascript
// components/features/dashboard/Dashboard.jsx
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks';
import { analysisService } from '@/api';
import DashboardCard from './DashboardCard';
import LoadingSpinner from '@/components/common/LoadingSpinner';

function Dashboard() {
  const { user } = useAuth();
  const [analyses, setAnalyses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAnalyses();
  }, []);

  const loadAnalyses = async () => {
    try {
      const data = await analysisService.getAll();
      setAnalyses(data);
    } catch (error) {
      console.error('Failed to load analyses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>
      <p>Welcome, {user?.name}</p>
      <div className="grid">
        {analyses.map(analysis => (
          <DashboardCard key={analysis.id} analysis={analysis} />
        ))}
      </div>
    </div>
  );
}

export default Dashboard;
```

## Documentation Standards

### README Files
- Clear overview of purpose
- Quick start instructions
- Installation steps
- Usage examples
- Directory structure
- Troubleshooting

### Code Comments
```python
# Good: Explains WHY, not WHAT
# User's credits are reduced by 2x because premium features use double resources
credits = credits - (amount * 2)

# Bad: Explains obvious
# Multiply amount by 2
credits = credits - (amount * 2)
```

```javascript
// Good: Explains the reasoning
// Retry up to 3 times because external API can have temporary issues
const maxRetries = 3;

// Bad: Just repeats the code
// Set maxRetries to 3
const maxRetries = 3;
```

### API Documentation
```python
@bp.route('/analyses/<int:analysis_id>/generate-report', methods=['POST'])
@token_required
def generate_report(analysis_id):
    """
    Generate a comprehensive report for the given analysis.
    
    Request Body:
    {
        "format": "pdf|json",
        "include_charts": boolean,
        "include_recommendations": boolean
    }
    
    Response (200):
    {
        "success": true,
        "data": {
            "report_id": "string",
            "url": "string",
            "created_at": "datetime"
        }
    }
    
    Errors:
    - 404: Analysis not found
    - 403: User doesn't have access to this analysis
    - 500: Report generation failed
    """
    pass
```

## Linting and Formatting

### Python
```bash
# Install tools
pip install black flake8 pylint

# Format code
black server/

# Check style
flake8 server/
pylint server/
```

### JavaScript
```bash
# Install tools
npm install --save-dev eslint prettier

# Format code
prettier --write src/

# Check style
eslint src/
```

## Testing Standards

### Python Tests
```python
# tests/test_auth.py
import pytest
from server.models import User
from server.exceptions import ValidationError

class TestAuth:
    def test_login_with_valid_credentials(self):
        # Arrange
        user = User(email='test@example.com', name='Test')
        
        # Act
        result = authService.login('test@example.com', 'password')
        
        # Assert
        assert result['token'] is not None
        assert result['user']['id'] == user.id
    
    def test_login_fails_with_wrong_password(self):
        # Arrange & Act & Assert
        with pytest.raises(AuthenticationError):
            authService.login('test@example.com', 'wrong')
```

### JavaScript Tests
```javascript
// src/api/__tests__/authService.test.js
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { authService } from '@/api';

describe('authService', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should login successfully with valid credentials', async () => {
    // Arrange
    const credentials = { email: 'test@example.com', password: 'password' };

    // Act
    const result = await authService.login(credentials.email, credentials.password);

    // Assert
    expect(result).toHaveProperty('data.token');
    expect(localStorage.getItem('auth_token')).toBeDefined();
  });
});
```

## Performance Guidelines

### Backend
- Use `.only()` to select specific columns: `User.query.with_entities(User.id, User.name)`
- Index frequently queried columns
- Use pagination for large queries
- Cache expensive computations
- Use database transactions for atomic operations

### Frontend
- Memoize expensive computations with `useMemo`
- Use `useCallback` for event handlers
- Lazy load components with `React.lazy()`
- Avoid inline object/function creation in render
- Use keys when rendering lists

## Security Practices

### Backend
```python
# Validate all inputs
Validator.validate_email(email)
Validator.validate_password(password)

# Use parameterized queries (SQLAlchemy does this)
user = User.query.filter_by(email=email).first()

# Hash passwords with bcrypt
from bcrypt import hashpw
hashed = hashpw(password.encode(), salt)

# Check authentication on protected routes
@token_required
def protected_route():
    pass
```

### Frontend
```javascript
// Don't store sensitive data in localStorage
// localStorage is vulnerable to XSS

// Use HTTPS only
// Use Content Security Policy headers

// Validate user input before submission
if (!Validator.isValidEmail(email)) {
  throw new ValidationError('Invalid email');
}

// Don't expose API keys in frontend code
// Keep secrets in environment variables
```

---

These standards ensure code quality, maintainability, and consistency across the Planlyze project.
