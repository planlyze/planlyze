# Planlyze - AI Business Analysis Platform

## Overview
Planlyze is a full-stack, bilingual (Arabic/English) web application offering AI-powered business analysis tools. It aims to provide comprehensive business insights through AI, supporting users from idea validation to detailed market, financial, and strategic analysis. The platform's ambition is to empower entrepreneurs and businesses with accessible and accurate AI-driven analytical capabilities.

## User Preferences
I prefer clear and direct communication. When suggesting code changes, please provide concise explanations of the rationale. For complex features, I appreciate a high-level architectural overview before diving into implementation details. I prefer an iterative development approach, where features are built and reviewed in small, manageable increments. Please ask for confirmation before making significant architectural changes or refactoring large portions of the codebase. I expect the agent to maintain the existing code style and conventions. Do not make changes to the `server/seed.py` file without explicit instructions to increment seed versions.

## System Architecture
Planlyze utilizes a React 18/Vite frontend with TailwindCSS and shadcn/ui for a modern, responsive user interface, emphasizing a mobile-first design. The backend is built with Flask, Flask-SQLAlchemy, and PostgreSQL, providing a robust API and data persistence layer. Key architectural decisions include a 6-tab lazy-loaded report structure for AI analysis results, a credit-based system for premium features, and comprehensive internationalization (i18n) for Arabic/English support. The system incorporates an admin notification system for critical events and a user notification system with customizable preferences. All legal pages (Privacy Policy, Terms of Service, Idea Security) are designed to meet compliance standards for an AI tech startup, featuring strong data privacy and security guarantees. A multi-currency payment system with automatic exchange rate conversion is integrated. Database seeding is version-controlled to protect user data across deployments. Frontend development runs on port 5000 and the Flask API on port 3000.

### Tab Processing Timeout Detection
The AI report generation system includes robust timeout detection for stuck tabs:
- **Backend**: Tracks processing start times in `tab_processing_started` JSON field, with 5-minute timeout threshold
- **API Endpoints**: `generate-tab-content` returns processing/stuck status; `check-tab-status` for polling
- **Frontend**: Polls every 5 seconds when a tab is processing, transitions to stuck UI with regenerate button after timeout
- **Force Retry**: Users can force regenerate stuck tabs via the `force` parameter

### Dynamic Credit System
Admin-configurable credit settings stored in SystemSettings table:
- **Premium Report Cost**: Credits deducted per premium report (default: 1, minimum: 1)
- **Referral Bonus**: Credits awarded to referrer when referred user generates first premium report (default: 1, minimum: 0)
- **Settings Service**: `server/services/settings_service.py` retrieves settings with validation and defaults
- **Referral Flow**: Signup sets referral status='pending' → First premium report completion → Award bonus to referrer + send notification
- **Admin UI**: "Credit Settings" tab in Admin Settings page for managing these values

### NGO Dashboard
The platform includes an NGO (Non-Governmental Organization) dashboard feature for verified organizations:
- **Request System**: Users can submit NGO status requests with organization name, description, website, phone (required), and contact information
- **Database Model**: `NGORequest` model stores requests with status tracking (pending/approved/rejected) and admin review fields
- **User Status**: `ngo_status` field on User model tracks approval status (none/pending/approved/rejected)
- **Admin Management**: Admins with `view_ngo_requests` or `manage_ngo_requests` permissions can view and process requests
- **Permission Checks**: Backend uses `has_permission()` helper with eager-loaded role data via `joinedload(User.role)`
- **API Endpoints**: POST/GET `/api/ngo/request`, GET/PUT `/api/ngo/requests` (admin)
- **Frontend Pages**: `NGODashboard.jsx` (user-facing with locked/unlocked states), `AdminNGORequests.jsx` (admin management)
- **Navigation**: NGO Dashboard shows lock icon when not approved, pending badge when under review

### Project Vouchers (NGO Feature)
Approved NGOs can manage project vouchers to support beneficiary ideas:
- **Database Model**: `ProjectVoucher` model with name, description, activation_start, activation_end, linked_ideas_count, is_active, code (unique 8-char format: ORGNAME_123)
- **Voucher Code Format**: Generated as `ORGNAME_123` - org name prefix (up to 10 chars) + underscore + 3 random digits
- **API Endpoints**: CRUD operations at `/api/ngo/vouchers` (requires approved NGO status)
- **Date Validation**: ISO format (YYYY-MM-DD) with proper error handling returning 400 on invalid formats
- **Frontend UI**: Voucher management table, add/edit dialog, delete confirmation, statistics card showing total/active counts
- **Access Control**: Only users with approved NGO status can access voucher endpoints
- **Credit Validation**: Users must have enough credits for premium report before using voucher code (validated after voucher existence check)
- **Profile Requirement**: Users must complete their profile (full name and phone number) before using a voucher code

### Voucher Reports Page (NGO Feature)
NGOs can view and manage analyses linked to their vouchers:
- **Separate Page**: `/ngo-dashboard/voucher/:voucherId` shows card-based report listing
- **Report Cards Display**: Business idea, category, Market Fit %, Months to Build, Competitors count, Starting Cost
- **User Details**: Clickable user name shows modal with user info (email, name, phone number)
- **NGO Actions**: Favourite toggle (star), Archive with confirmation, Unlink with confirmation
- **Archive Filter**: Toggle switch to show/hide archived reports
- **Search & Filters**: Search by business idea/user name, filter by favourite status, category, sort by metrics (Market Fit, Build Time, Competitors, Cost - high/low)
- **Analysis Model Fields**: `is_ngo_favourite`, `is_ngo_archived` boolean flags
- **API Endpoints**: 
  - GET `/api/ngo/vouchers/<id>/analyses` - detailed list with overview data
  - PUT `/api/ngo/analyses/<id>/favourite` - toggle favourite
  - PUT `/api/ngo/analyses/<id>/archive` - toggle archive  
  - PUT `/api/ngo/analyses/<id>/unlink` - remove voucher link

### NGO Email Notifications
Automated email notifications for NGO-related events:
- **Admin Notification**: Sent to all admins when a new NGO request is submitted
- **Status Change Email**: Sent to NGO user when their request is approved or rejected (bilingual support)
- **Report Linked Email**: Sent to NGO owner when a beneficiary links a report to their voucher
- **Template System**: Uses `EmailTemplate` model with `template_key` for database-stored templates
- **Variable Substitution**: Templates support `{{variable}}` placeholders and `{{#if condition}}...{{/if}}` conditional blocks
- **Error Handling**: All email sending wrapped in try-catch to prevent blocking core operations

### Syrian Competitors Analysis
Enhanced competitor analysis using hardcoded Syrian competitor data:
- **Data Source**: `server/services/competitor_service.py` contains hardcoded competitor data (20 Syrian apps/services across delivery, e-commerce, jobs, taxi, health, real estate, etc.)
- **Data Structure**: Each competitor includes app name, cities, social media links (Facebook, Instagram, WhatsApp, Telegram), app links (Android, iOS, Website), and enabled features
- **No Industry Filtering**: All competitors are provided to AI regardless of user's industry - AI determines relevance based on business idea
- **AI Matching**: Claude AI analyzes which competitors are relevant to the user's idea based on feature overlap and generates descriptions, pros, cons, and relevance explanations
- **Market Uniqueness**: AI identifies market gaps, differentiation opportunities, recommended features, and competitive advantages
- **Frontend Display**: `MarketSection.jsx` renders competitor cards with clickable app/social links, relevance badges, and uniqueness recommendations

## External Dependencies
- **AI**: Anthropic Claude API (claude-sonnet-4-5)
- **Database**: PostgreSQL
- **Email**: ZeptoMail API (for email verification)
- **UI Components**: shadcn/ui
- **Styling**: TailwindCSS
- **Internationalization**: i18next
- **Excel Export**: `xlsx` library
- **API Documentation**: Flasgger (Swagger UI)