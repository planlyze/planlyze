# Planlyze - AI Business Analysis Platform

## Overview
Planlyze is a full-stack bilingual (Arabic/English) web application that provides AI-powered business analysis tools. It features a React/Vite frontend with a Flask backend API, using PostgreSQL for data persistence and Claude API for AI analysis.

## Project Structure
```
├── src/                    # React frontend source
│   ├── api/               # API client and services
│   │   ├── client.js      # Main API client with auth
│   │   ├── http-client.js # HTTP client with interceptors
│   │   └── index.js       # API exports
│   ├── components/        # React components
│   │   ├── ui/           # Shadcn UI components
│   │   ├── results/      # Analysis result components
│   │   ├── dashboard/    # Dashboard widgets
│   │   ├── credits/      # Credit system components
│   │   └── admin/        # Admin components
│   ├── pages/             # Page components
│   ├── landing/           # Landing page components
│   ├── hooks/             # Custom React hooks
│   ├── i18n/              # Internationalization config
│   ├── locales/           # Translation files (ar.json, en.json)
│   ├── utils/             # Shared utilities (createPageUrl, safeFormatDate)
│   ├── config/            # App configuration (CTA classes, useAppTranslation)
│   └── lib/               # Context providers and utilities
├── server/                 # Flask backend
│   ├── routes/            # API endpoints (auth, entities, ai)
│   ├── services/          # Business logic (analysis_service)
│   ├── utils/             # Utilities (auth, response, validators)
│   ├── app.py             # Flask app factory
│   ├── config.py          # Configuration management
│   ├── models.py          # SQLAlchemy models
│   ├── seed.py            # Database seeding
│   └── exceptions.py      # Custom exceptions
├── migrations/             # Alembic database migrations
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
- **AI**: Anthropic Claude API (claude-sonnet-4-5) for business analysis
- **i18n**: i18next for Arabic/English localization

## Shared Utilities

### src/utils/index.ts
- `createPageUrl(pageName)` - Creates internal page URLs
- `safeFormatDate(dateValue, formatStr)` - Safe date formatting with null handling

### src/config/index.js
- `CTA_BUTTON_CLASS`, `CTA_SMALL_BUTTON_CLASS`, `HEADER_CTA_CLASS` - Shared button styles
- `useAppTranslation(namespace)` - Translation hook with proxy pattern

## API Documentation
Swagger UI available at `/api/apidocs` when backend is running.

## Production Deployment
- Build: `npm run build` (creates `dist/` folder)
- Run: Database seeding runs automatically, then `gunicorn --bind=0.0.0.0:5000 wsgi:app`
- Flask serves the static frontend from `dist/` folder
- **Auto-seeding**: On each deployment, the system automatically runs `server/seed.py`

## Seed Versioning
The seeding system uses versioning to prevent overwriting user modifications:
- **seed_versions table**: Tracks which seeds have been applied and at what version
- Seeds only run if: `applied_version < current_version`
- User-modified data (partners, payment methods, etc.) is preserved across deployments
- To force a seed to re-run: increment its version in `SEED_VERSIONS` dict in `server/seed.py`

Current seed versions are defined in `server/seed.py`:
```python
SEED_VERSIONS = {
    'roles': 1,
    'credit_packages': 1,
    'payment_methods': 1,
    'email_templates': 1,
    'system_settings': 1,
    'partners': 1,
}
```

## Environment Variables
- `DATABASE_URL` - PostgreSQL connection string (auto-provided)
- `SECRET_KEY` - Flask secret key
- `JWT_SECRET_KEY` - JWT signing key
- `ANTHROPIC_API_KEY` - Claude API key for AI features
- `ZEPTOMAIL_API_KEY` - ZeptoMail API token for email verification
- `ZEPTOMAIL_SENDER_EMAIL` - Verified sender email for ZeptoMail

## Landing Page Dynamic Content
The landing page displays dynamic content fetched from the database:

### Statistics
- **Users count**: Active users from database
- **Reports count**: Completed analyses from database
- **Syrian apps count**: Configurable via `system_settings` table (key: `syrian_apps_count`)

API Endpoint: `GET /api/landing-stats` (public, no auth required)

### Partners
Partners are stored in the `partners` table with bilingual support (name/name_ar), logo_url, website_url, color, and display_order.

API Endpoint: `GET /api/partners` (public, no auth required)

Admin endpoints for managing partners:
- `POST /api/partners` - Create partner (admin only)
- `PUT /api/partners/<id>` - Update partner (admin only)
- `DELETE /api/partners/<id>` - Delete partner (admin only)

## Roles and Permissions
- **super_admin**: Full system access with all permissions
- **admin**: Management access for users, analyses, payments
- **user**: Basic access for analyses and profile management

## AI Analysis Report Structure
6-tab lazy-loaded format:
1. **Overview**: Key metrics, executive summary, problem/solution
2. **Market**: Market opportunity, competitor analysis, target audience
3. **Business**: Business model, revenue streams, go-to-market
4. **Technical**: Tech stack suggestions, AI tools, development plan
5. **Financial**: Financial projections, funding recommendations
6. **Strategy**: SWOT analysis, risk mitigation, success metrics

Each tab generates content via separate Claude API calls on first access and caches in database.

## Analysis Credit System
- **Validation**: Business idea validated by AI (no credit cost)
- **Premium reports**: 1 credit per analysis
- **Free reports**: Limited analysis when user has no credits
- Transaction handling with pending/completed/refunded states

## Admin Notification System
The platform sends automated notifications to admins for important events:

### Events Triggering Notifications
1. **Contact Messages**: When users submit the contact form
2. **Failed Analyses**: When AI analysis fails for any reason
3. **New Payment Requests**: When users submit payment for credits
4. **Server Errors (500)**: When internal server errors occur
5. **New Ratings**: When users rate their analysis reports

### Notification Channels
- **Email**: All notifications sent to `info@planlyze.com`
- **In-App**: Notifications saved to database for all admin/super_admin users

### Implementation
- Service: `server/services/admin_notification_service.py`
- Functions: `notify_contact_message()`, `notify_failed_analysis()`, `notify_new_payment()`, `notify_server_error()`, `notify_new_rating()`

## User Notification System
The platform sends personalized notifications to users for important events. Notifications respect user preferences stored in `notification_preferences`.

### Events Triggering User Notifications
1. **Referral Joined**: When someone joins using the user's referral code
2. **Credits Added/Deducted**: When admin adjusts user credits
3. **Analysis Completed**: When AI analysis finishes successfully
4. **Payment Status Changed**: When payment is approved or rejected
5. **Low Credits**: When credits fall to 2 or below
6. **Shared Report Opened**: When someone views a shared report

### Notification Preferences
Users can control their notification preferences in their profile. Default preferences:
```python
{
    'email_notifications': True,
    'analysis_complete': True,
    'analysis_failed': True,
    'credits_low': True,
    'credits_added': True,
    'credits_deducted': True,
    'payment_approved': True,
    'payment_rejected': True,
    'referral_joined': True,
    'report_shared_opened': True,
    'system': True
}
```

### Implementation
- Service: `server/services/user_notification_service.py`
- Functions: `notify_referral_joined()`, `notify_credits_changed()`, `notify_analysis_completed()`, `notify_payment_status_changed()`, `notify_low_credits()`, `notify_shared_report_opened()`

## Recent Changes
- Added user notification system with preference controls
- Added admin notification system for contact messages, failed analyses, payments, server errors, and ratings
- Partners section now loads from database with bilingual support
- Dynamic landing page statistics from database
- Consolidated utility functions (safeFormatDate, createPageUrl)
- Removed dead code (ReportFooter, Home placeholder)
- Display name sync between navbar and Profile page
- Cleaned up redundant documentation files
