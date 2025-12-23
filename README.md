# Planlyze - AI-Powered Business Analysis Platform

A bilingual (Arabic/English) business analysis platform that generates comprehensive AI-powered reports using Claude API.

## Overview

Planlyze helps entrepreneurs and business analysts transform their ideas into actionable business strategies with:
- AI-generated comprehensive business reports
- 6-tab analysis format (Overview, Market, Business, Technical, Financial, Strategy)
- Credit-based system with free/premium tiers
- Bilingual support (Arabic/English)

## Tech Stack

- **Frontend**: React 18, Vite, TailwindCSS, Shadcn/UI
- **Backend**: Flask 3.1, SQLAlchemy, PostgreSQL
- **AI**: Anthropic Claude API (claude-sonnet-4-5)
- **Internationalization**: i18next

## Quick Start

### Development

```bash
# Frontend (port 5000)
npm run dev

# Backend API (port 3000)
python wsgi.py
```

### Environment Variables

Required environment variables:
- `DATABASE_URL` - PostgreSQL connection string
- `SECRET_KEY` - Flask secret key
- `JWT_SECRET_KEY` - JWT signing key
- `ANTHROPIC_API_KEY` - Claude API key for AI features
- `ZEPTOMAIL_API_KEY` - Email verification (optional)

## Project Structure

```
├── src/                    # React frontend
│   ├── api/               # API client services
│   ├── components/        # UI components
│   ├── pages/             # Page components
│   ├── landing/           # Landing page components
│   ├── locales/           # Translation files (ar.json, en.json)
│   └── utils/             # Shared utilities
├── server/                 # Flask backend
│   ├── routes/            # API endpoints
│   ├── services/          # Business logic
│   ├── models.py          # SQLAlchemy models
│   └── seed.py            # Database seeding
├── migrations/             # Alembic database migrations
└── wsgi.py                # WSGI entry point
```

## Key Features

### Analysis System
- AI-powered business idea validation
- Lazy-loaded 6-tab report generation
- Premium and free report tiers
- Report rating and feedback

### Credit System
- Credit packages with dynamic pricing
- Transaction history tracking
- Pending transaction handling for report generation

### Admin Features
- User management with role-based access
- Payment and credit administration
- Email template management
- Audit logging

### Landing Page
- Dynamic statistics from database (users, reports, Syrian apps)
- Pricing packages loaded from settings
- SEO optimization with structured data

## API Documentation

Swagger UI available at `/api/apidocs` when backend is running.

## Deployment

```bash
# Build frontend
npm run build

# Run production server
gunicorn --bind=0.0.0.0:5000 --reuse-port wsgi:app
```

The seed script runs automatically on deployment to ensure default data exists.

## Database

### Migrations
```bash
FLASK_APP=server.app:create_app flask db migrate -m "description"
FLASK_APP=server.app:create_app flask db upgrade
```

### Seeding
```bash
python server/seed.py
```

Creates default roles, credit packages, payment methods, email templates, and system settings.

---

Made with care by the Planlyze team
