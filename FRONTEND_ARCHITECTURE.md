# Planlyze Frontend Architecture

Professional React + Vite frontend following best practices.

## Project Structure

```
src/
├── api/                    # API client and services
│   ├── http-client.js     # Core HTTP client with interceptors
│   ├── index.js           # Main API export
│   └── services/
│       ├── auth.js        # Authentication service
│       ├── user.js        # User management service
│       ├── analysis.js    # Analysis service
│       └── ai.js          # AI service
├── hooks/                  # Custom React hooks
│   ├── index.js
│   ├── useAsync.js        # Async state management
│   ├── useApi.js          # API calls with retry logic
│   ├── useAuth.js         # Authentication hook
│   └── use-mobile.js      # Mobile detection hook
├── lib/                    # Utilities and helpers
│   ├── AuthContext.jsx    # Authentication context
│   ├── utils.js           # General utilities
│   └── query-client.js    # React Query configuration
├── components/             # React components
│   ├── ui/                # Shadcn UI components
│   ├── common/            # Shared components
│   ├── features/          # Feature components
│   │   ├── dashboard/
│   │   ├── analysis/
│   │   ├── admin/
│   │   └── auth/
│   └── CONVENTIONS.md     # Component guidelines
├── pages/                  # Page components
│   ├── Login.jsx
│   ├── Register.jsx
│   ├── Dashboard.jsx
│   └── ...
├── assets/                 # Static assets
├── styles/                 # Global styles
├── App.jsx                # Root component
├── Layout.jsx             # Main layout
└── main.jsx               # Entry point
```

## Key Principles

### 1. API Client Architecture

The API client is structured with clear separation of concerns:

```javascript
// Import services
import { authService, userService, analysisService, aiService } from '@/api';

// Or use the unified API object
import api from '@/api';
api.auth.login(email, password);
```

**Features:**
- Global request/response interceptors
- Automatic token injection in headers
- Consistent error handling
- Retry logic for failed requests
- Multiple service modules for organization

### 2. Custom Hooks

All custom hooks follow React conventions and best practices:

```javascript
import { useAsync, useApi, useAuth } from '@/hooks';

// useAsync for generic async operations
const { execute, status, data, error } = useAsync(asyncFunction);

// useApi for API calls with retry logic
const { execute: fetchUsers, status, data, error } = useApi(() => userService.getAll());

// useAuth for authentication state
const { user, login, logout } = useAuth();
```

### 3. Error Handling

Consistent error handling throughout the app:

```javascript
try {
  const result = await authService.login(email, password);
} catch (error) {
  if (error.isUnauthorized()) {
    // Handle 401
  } else if (error.isForbidden()) {
    // Handle 403
  } else if (error.isNotFound()) {
    // Handle 404
  }
}
```

### 4. Component Organization

Components are organized by feature or type:

```
components/
├── ui/               # Reusable UI primitives (shadcn)
├── common/          # Shared across features
├── features/        # Feature-specific components
│   ├── dashboard/   # Dashboard page components
│   ├── analysis/    # Analysis feature components
│   └── admin/       # Admin feature components
└── error/           # Error boundaries
```

### 5. Authentication Flow

```javascript
// Login
const { login } = useAuth();
await login(email, password);
// Token automatically stored and used in requests

// Protected routes
function ProtectedPage() {
  const { user, isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  return <div>Welcome, {user.name}</div>;
}
```

## Usage Examples

### Making API Calls

```javascript
import { analysisService } from '@/api';

function AnalysisList() {
  const { execute: fetchAnalyses, status, data, error } = useApi(
    () => analysisService.getAll(),
    { immediate: true }
  );

  if (status === 'pending') return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div>
      {data?.map((analysis) => (
        <AnalysisCard key={analysis.id} analysis={analysis} />
      ))}
    </div>
  );
}
```

### Authentication

```javascript
import { useAuth } from '@/hooks';

function LoginPage() {
  const { login, isLoading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input 
        value={email} 
        onChange={(e) => setEmail(e.target.value)}
      />
      <input 
        type="password"
        value={password} 
        onChange={(e) => setPassword(e.target.value)}
      />
      <button disabled={isLoading}>
        {isLoading ? 'Loading...' : 'Login'}
      </button>
      {error && <p className="error">{error.message}</p>}
    </form>
  );
}
```

### Custom Hook

```javascript
// Create a custom hook for specific feature
function useUserProfile(userId) {
  const { execute: fetchUser, status, data: user, error } = useApi(
    () => userService.getById(userId),
    { immediate: !!userId }
  );

  const updateProfile = useCallback(async (updates) => {
    const result = await userService.update(userId, updates);
    await fetchUser();
    return result;
  }, [userId, fetchUser]);

  return { user, isLoading: status === 'pending', error, updateProfile };
}
```

## Environment Variables

Create `.env` file in project root:

```bash
VITE_API_BASE_URL=/api
VITE_APP_NAME=Planlyze
VITE_APP_VERSION=1.0.0
```

Access in code:

```javascript
const apiBase = import.meta.env.VITE_API_BASE_URL;
```

## Development Workflow

### Start Development Server
```bash
npm run dev
```

### Build for Production
```bash
npm run build
```

### Run Linter
```bash
npm run lint
```

### Type Checking
```bash
npm run typecheck
```

## Best Practices

1. **Always use custom hooks** - `useApi`, `useAuth`, `useAsync`
2. **Import from API services** - Don't make raw fetch calls
3. **Handle errors properly** - Check error types and show appropriate messages
4. **Use loading states** - Show spinners during API calls
5. **Validate user input** - Before sending to API
6. **Organize components** - By feature or type
7. **Reuse UI components** - From shadcn library
8. **Document complex logic** - Use JSDoc comments
9. **Test components** - Write unit and integration tests
10. **Monitor performance** - Use React DevTools profiler

## Common Patterns

### Loading States
```javascript
{status === 'pending' && <LoadingSpinner />}
{status === 'success' && <Content data={data} />}
{status === 'error' && <ErrorMessage error={error} />}
```

### Error Recovery
```javascript
const handleRetry = async () => {
  try {
    await execute();
  } catch (err) {
    toast.error('Failed to load. Please try again.');
  }
};
```

### Pagination
```javascript
const [page, setPage] = useState(1);
const { execute: fetchItems } = useApi(
  () => itemService.getAll(page, 20),
  { immediate: true }
);

// Re-fetch when page changes
useEffect(() => {
  fetchItems();
}, [page]);
```

## Troubleshooting

### Token Not Being Sent
- Ensure token is set: `authService.token.set(token)`
- Check Authorization header in Network tab
- Verify interceptor is registered

### API Errors on Protected Routes
- Check user is authenticated: `authService.isAuthenticated()`
- Verify token hasn't expired
- Check server logs for error details

### Infinite Loading
- Check for infinite useEffect loops
- Ensure error is thrown properly in API calls
- Verify API endpoint exists on backend
