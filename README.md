# Planlyze - AI-Powered Business Analysis Platform

A bilingual (Arabic/English) business analysis platform that generates comprehensive AI-powered reports using Claude API.

## Overview

Planlyze helps entrepreneurs and business analysts transform their ideas into actionable business strategies with:

- AI-generated comprehensive business reports
- 6-tab analysis format (Overview, Market, Business, Technical, Financial, Strategy)
- Credit-based system with free/premium tiers
- Bilingual support (Arabic/English)
- Multi-currency payment support
- Responsive mobile-first design

## Tech Stack

- **Frontend**: React 18, Vite, TailwindCSS, Shadcn/UI
- **Backend**: Flask 3.1, SQLAlchemy, PostgreSQL
- **AI**: Anthropic Claude API (claude-sonnet-4-5)
- **Internationalization**: i18next
- **API Docs**: Flasgger (Swagger UI)

## Quick Start

### Development

```bash
# Frontend (port 5000)
npm run dev

# Backend API (port 3000)
python wsgi.py
```

### Environment Variables

Required:

- `DATABASE_URL` - PostgreSQL connection string
- `SECRET_KEY` - Flask secret key
- `JWT_SECRET_KEY` - JWT signing key
- `ANTHROPIC_API_KEY` - Claude API key for AI features

Optional:

- `ZEPTOMAIL_API_KEY` - Email verification
- `ADMIN_EMAIL` - Admin notification email

## Project Structure

```
├── src/                    # React frontend (see src/README.md)
│   ├── api/               # API client services
│   ├── components/        # UI components
│   ├── pages/             # Page components
│   ├── landing/           # Landing page components
│   ├── locales/           # Translation files (ar.json, en.json)
│   └── utils/             # Shared utilities
├── server/                 # Flask backend (see server/README.md)
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
- Floating AI assistant for follow-up questions

### Credit System

- Credit packages with dynamic pricing
- Multi-currency payment support (USD, EUR, SYP, SAR, AED, TRY)
- Transaction history tracking
- Discount codes with usage limits

### Admin Features

- User management with role-based access (Owner, Admin, User)
- Payment approval/rejection workflow
- Email template management
- Audit logging
- Excel export for all data tables

### User Features

- Referral system with bonus credits
- Notification preferences
- Profile customization
- Report sharing with public links

### Landing Page

- Dynamic statistics from database
- Pricing packages loaded from settings
- Partner showcase
- SEO optimization with structured data

## API Documentation

Swagger UI available at `/api/apidocs` when backend is running.

See `server/README.md` for complete API endpoint documentation.

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

Creates default roles, credit packages, payment methods, currencies, email templates, and system settings.

## Documentation

- **Frontend**: See `src/README.md` for component documentation
- **Backend**: See `server/README.md` for API documentation
- **Project**: See `replit.md` for development notes and conventions

---

Made with care by the Planlyze team
