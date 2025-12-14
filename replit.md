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
