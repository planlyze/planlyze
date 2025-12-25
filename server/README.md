# Planlyze Backend API

Flask REST API backend for the Planlyze AI business analysis platform.

## Tech Stack

- **Framework**: Flask 3.1
- **ORM**: Flask-SQLAlchemy with PostgreSQL
- **Migrations**: Flask-Migrate (Alembic)
- **Authentication**: JWT tokens (PyJWT)
- **API Docs**: Flasgger (Swagger UI)
- **AI**: Anthropic Claude API
- **Email**: ZeptoMail API

## Project Structure

```
server/
├── routes/                 # API endpoint blueprints
│   ├── auth.py            # Authentication endpoints
│   ├── entities.py        # CRUD endpoints for all entities
│   └── ai.py              # AI analysis and chat endpoints
├── services/               # Business logic services
│   ├── analysis_service.py    # Analysis generation
│   ├── email_service.py       # Email sending
│   ├── admin_notification_service.py
│   └── user_notification_service.py
├── utils/                  # Utility functions
│   ├── auth.py            # Authentication helpers
│   ├── response.py        # Response formatting
│   ├── translations.py    # i18n message helpers
│   └── validators.py      # Input validation
├── app.py                  # Flask app factory
├── config.py               # Configuration management
├── models.py               # SQLAlchemy models
├── seed.py                 # Database seeding
└── exceptions.py           # Custom exceptions
```

## API Endpoints

### Authentication (`/api/auth`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/register` | Register new user |
| POST | `/verify-email` | Verify email with code |
| POST | `/resend-verification` | Resend verification email |
| POST | `/login` | Login and get JWT token |
| GET | `/me` | Get current user profile |
| PUT | `/me` | Update current user profile |
| POST | `/change-password` | Change user password |
| POST | `/logout` | Logout (invalidate token) |

### Analyses (`/api/analyses`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get user's analyses |
| GET | `/all` | Get all analyses (admin) |
| GET | `/<id>` | Get specific analysis |
| POST | `/generate` | Create new analysis entry |
| POST | `/validate-idea` | Validate business idea with AI |
| PUT | `/<id>` | Update analysis |
| DELETE | `/<id>` | Delete analysis |
| POST | `/<id>/upgrade-premium` | Upgrade to premium |

### AI (`/api/ai`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/generate-analysis` | Generate full AI analysis |
| POST | `/generate-tab-content` | Generate specific tab content |
| POST | `/chat` | AI chat conversation |
| POST | `/invoke-llm` | Direct LLM invocation |
| POST | `/fail-analysis` | Mark analysis as failed |

### Credit Packages (`/api/credit-packages`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List active packages |
| POST | `/` | Create package (admin) |
| PUT | `/<id>` | Update package (admin) |
| DELETE | `/<id>` | Delete package (admin) |

### Payments (`/api/payments`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List payments |
| POST | `/` | Create payment request |
| POST | `/<id>/approve` | Approve payment (admin) |
| POST | `/<id>/reject` | Reject payment (admin) |

### Currencies (`/api/currencies`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List active currencies |
| GET | `/all` | List all currencies (admin) |
| POST | `/` | Create currency (admin) |
| PUT | `/<id>` | Update currency (admin) |
| DELETE | `/<id>` | Delete currency (admin) |

### Users (`/api/users`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List all users (admin) |
| PUT | `/<id>` | Update user (admin) |
| POST | `/<id>/adjust-credits` | Adjust user credits (admin) |

### Other Endpoints
- `/api/transactions` - Transaction history
- `/api/payment-methods` - Payment method management
- `/api/discount-codes` - Discount code management
- `/api/roles` - Role management
- `/api/notifications` - User notifications
- `/api/report-shares` - Report sharing
- `/api/referrals` - Referral system
- `/api/partners` - Partner management
- `/api/landing-stats` - Public landing page stats
- `/api/contact` - Contact form submissions
- `/api/audit-logs` - Audit logging (admin)

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

Tokens are obtained from the `/api/auth/login` endpoint and expire after 24 hours.

## Swagger Documentation

Access Swagger UI at `/api/apidocs` when the server is running.

## Database Models

### Core Models
- `User` - User accounts with credits, roles, preferences
- `Analysis` - Business analysis reports with lazy-loaded content
- `Transaction` - Credit transaction history
- `Payment` - Payment requests and approvals

### Support Models
- `Role` - User roles with permissions
- `CreditPackage` - Credit purchase packages
- `PaymentMethod` - Available payment methods
- `Currency` - Supported currencies with exchange rates
- `DiscountCode` - Discount codes for payments
- `Notification` - User notifications
- `Referral` - User referral tracking

## Environment Variables

Required:
- `DATABASE_URL` - PostgreSQL connection string
- `SECRET_KEY` - Flask secret key
- `JWT_SECRET_KEY` - JWT signing key

Optional:
- `ANTHROPIC_API_KEY` - Claude API key for AI features
- `ZEPTOMAIL_API_KEY` - Email service API key
- `ADMIN_EMAIL` - Admin notification email

## Development

```bash
# Install dependencies
pip install -r requirements.txt

# Run development server (port 3000)
python wsgi.py

# Run database migrations
FLASK_APP=server.app:create_app flask db migrate -m "description"
FLASK_APP=server.app:create_app flask db upgrade

# Seed database
python server/seed.py
```

## Production

```bash
# Build frontend first
npm run build

# Run with gunicorn
gunicorn --bind=0.0.0.0:5000 --reuse-port wsgi:app
```

The production server serves both the Flask API and the built React frontend.

## Code Conventions

- Use decorators for authentication: `@require_auth`, `@require_admin`
- Return JSON responses with `jsonify()`
- Use proper HTTP status codes (200, 201, 400, 401, 403, 404, 500)
- Add Swagger docstrings to all public endpoints
- Log errors with `print()` for debugging (use proper logging in production)
