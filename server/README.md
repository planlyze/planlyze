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

### Transactions (`/api/transactions`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get transaction history |
| POST | `/` | Create transaction record |

### Payment Methods (`/api/payment-methods`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List payment methods |
| POST | `/` | Create payment method (admin) |
| PUT | `/<id>` | Update payment method (admin) |
| DELETE | `/<id>` | Delete payment method (admin) |

### Discount Codes (`/api/discount-codes`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List discount codes (admin) |
| POST | `/` | Create discount code (admin) |
| PUT | `/<id>` | Update discount code (admin) |
| DELETE | `/<id>` | Delete discount code (admin) |
| POST | `/validate` | Validate discount code |
| GET | `/<id>/users` | Get users who used code |

### Roles (`/api/roles`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List all roles |
| POST | `/` | Create role (admin) |
| GET | `/<id>` | Get role details |
| PUT | `/<id>` | Update role (admin) |
| DELETE | `/<id>` | Delete role (admin) |

### Notifications (`/api/notifications`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get user notifications |
| POST | `/` | Create notification |
| POST | `/<id>/read` | Mark notification as read |
| POST | `/mark-all-read` | Mark all as read |
| DELETE | `/<id>` | Delete notification |

### Report Shares (`/api/report-shares`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List shared reports |
| POST | `/` | Create share link |
| GET | `/public/<token>` | Get public shared report |

### Referrals (`/api/referrals`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get user's referrals |
| POST | `/apply` | Apply referral code |

### Partners (`/api/partners`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List partners (public) |
| POST | `/` | Create partner (admin) |
| PUT | `/<id>` | Update partner (admin) |
| DELETE | `/<id>` | Delete partner (admin) |

### Public Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/landing-stats` | Get landing page statistics |
| POST | `/contact` | Submit contact form |
| GET | `/social-media` | Get social media links |

### Admin Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/contact-messages` | List contact messages |
| PUT | `/contact-messages/<id>/read` | Mark message as read |
| DELETE | `/contact-messages/<id>` | Delete message |
| GET | `/audit-logs` | Get audit logs |
| POST | `/audit-logs` | Create audit log |
| GET | `/api-request-logs` | Get API request logs |
| GET | `/api-request-logs/<id>` | Get specific log |
| GET | `/system-settings` | Get system settings |
| GET | `/system-settings/<key>` | Get specific setting |
| PUT | `/system-settings/<key>` | Update setting |
| GET | `/activity-feed` | Get activity feed |
| POST | `/activity-feed` | Create activity entry |

### Chat Conversations (`/api/chat-conversations`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List conversations |
| GET | `/<id>` | Get conversation |
| POST | `/` | Create conversation |
| PUT | `/<id>` | Update conversation |

### Settings (`/api/settings`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get public settings |
| GET | `/<key>` | Get specific setting |
| POST | `/` | Update settings (admin) |

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
