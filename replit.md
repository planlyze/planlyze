# Planlyze - AI Business Analysis Platform

## Overview
Planlyze is a full-stack web application that provides AI-powered business analysis tools. It features a React/Vite frontend with a Flask backend API, using PostgreSQL for data persistence.

## Project Structure
```
├── src/                    # React frontend source
│   ├── api/               # API client and services
│   ├── components/        # React components (UI, analysis, results, etc.)
│   ├── pages/             # Page components
│   ├── hooks/             # Custom React hooks
│   ├── i18n/              # Internationalization config
│   ├── locales/           # Translation files (ar.json, en.json)
│   └── lib/               # Utilities and context
├── server/                 # Flask backend
│   ├── routes/            # API endpoints (auth, entities, ai)
│   ├── utils/             # Utilities (auth, response, validators)
│   ├── app.py             # Flask app factory
│   ├── config.py          # Configuration management
│   ├── models.py          # SQLAlchemy models
│   └── exceptions.py      # Custom exceptions
├── migrations/             # Alembic database migrations
├── functions/              # Utility/cloud functions (TypeScript)
├── vite.config.js          # Vite configuration
├── wsgi.py                 # WSGI entry point
└── package.json            # Node.js dependencies
```

## Development Setup

### Workflows
- **Frontend**: `npm run dev` - Runs Vite dev server on port 5000
- **Backend API**: `python wsgi.py` - Runs Flask API on port 3000

### Database
- PostgreSQL database available via `DATABASE_URL` environment variable
- Uses Flask-SQLAlchemy for ORM
- Flask-Migrate (Alembic) for migrations

### Key Technologies
- **Frontend**: React 18, Vite, TailwindCSS, shadcn/ui components
- **Backend**: Flask, Flask-SQLAlchemy, Flask-CORS, Flasgger (Swagger)
- **AI**: Anthropic Claude API for business analysis
- **i18n**: i18next for Arabic/English localization

## API Documentation
Swagger UI available at `/api/apidocs` when backend is running.

## Production Deployment
- Build: `npm run build` (creates `dist/` folder)
- Run: `gunicorn --bind=0.0.0.0:5000 wsgi:app`
- Flask serves the static frontend from `dist/` folder

## Environment Variables
- `DATABASE_URL` - PostgreSQL connection string (auto-provided)
- `SECRET_KEY` - Flask secret key
- `JWT_SECRET_KEY` - JWT signing key
- `ANTHROPIC_API_KEY` - Claude API key for AI features
- `ZEPTOMAIL_API_KEY` - ZeptoMail API token for email verification
- `ZEPTOMAIL_SENDER_EMAIL` - Verified sender email for ZeptoMail

## Email Verification Flow
Users must verify their email before accessing the platform:
1. User registers → Verification email sent via ZeptoMail
2. User clicks verification link → Email verified, auto-login
3. Unverified users trying to login are redirected to verification page
4. Users can resend verification emails from the verification page

## Roles and Permissions
The platform uses a role-based access control system with the following roles:

### Roles Table Structure
- **super_admin**: Full system access with all permissions
- **admin**: Management access for users, analyses, payments
- **user**: Basic access for analyses and profile management

### Permissions Structure
Each role has a JSON permissions object with the following format:
```json
{
  "users": ["create", "read", "update", "delete", "manage_roles"],
  "analyses": ["create", "read", "update", "delete", "view_all"],
  "payments": ["create", "read", "update", "delete", "approve"],
  "settings": ["read", "update"],
  "roles": ["create", "read", "update", "delete"],
  "system": ["full_access"]
}
```

### User-Role Relationship
- Users have a `role_id` foreign key linking to the `roles` table
- New users are automatically assigned the "user" role
- Role changes are done by updating the `role_id` field

### Super Admin Seeding
Run `python server/seed.py` to:
1. Create/update all default roles with permissions
2. Create/update super admin user (admin@planlyze.com / Admin@123)

## API Audit Logging
The platform includes comprehensive API audit logging that captures every API request with:

### What is Logged
- **Request**: Method, path, URL, query params, headers (masked), body (masked)
- **Response**: Status code, body (truncated), error messages
- **User**: Email, role (extracted from JWT)
- **Metadata**: IP address, user agent, execution time (ms)

### Security Features
- Sensitive fields are automatically masked: passwords, tokens, API keys, credit cards, etc.
- Authorization headers are masked
- Large response bodies are truncated (max 10KB)
- Recursive data structures are limited to 10 levels deep

### Excluded Paths
- `/api/health`, `/api/ping` - Health checks
- `/api/apidocs`, `/flasgger_static` - Swagger docs
- `/static`, `/assets`, `/_next` - Static files
- Files with extensions: .js, .css, .png, .jpg, .gif, .svg, .ico, .woff

### Admin Endpoints
- `GET /api/api-request-logs` - List logs (supports filters: method, path, status, user_email, limit)
- `GET /api/api-request-logs/<id>` - Get specific log details

### Database Table
`api_request_logs` - Stores all captured API request/response data with automatic cleanup recommended for production
