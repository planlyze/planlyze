# Planlyze

Professional Full-Stack Application for Data Analysis and Reporting

## Overview

Planlyze is a modern web application built with:
- **Frontend**: React 18 + Vite + TypeScript
- **Backend**: Flask 3.1 + PostgreSQL 13+
- **AI Integration**: Anthropic Claude API
- **Styling**: TailwindCSS + Shadcn UI

## Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL 13+

### Installation

1. **Clone and setup**
   ```bash
   git clone <repository-url>
   cd planlyze
   ```

2. **Backend setup**
   ```bash
   python -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Frontend setup**
   ```bash
   npm install
   ```

4. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Initialize database**
   ```bash
   createdb planlyze
   FLASK_APP=server.app:create_app python -m flask db upgrade
   ```

6. **Start development**
   ```bash
   # Terminal 1 - Backend
   FLASK_APP=server.app:acreate_apppp python -m flask run --port 3000
   
   # Terminal 2 - Frontend
   npm run dev
   ```

Access the application at http://localhost:3000

## Project Structure

```
planlyze/
├── server/                    # Flask backend
│   ├── routes/               # API endpoints
│   ├── models.py             # Database models
│   ├── config.py             # Configuration
│   ├── exceptions.py         # Custom exceptions
│   └── utils/                # Utilities
├── src/                       # React frontend
│   ├── api/                  # API client services
│   ├── components/           # React components
│   ├── hooks/                # Custom hooks
│   ├── pages/                # Page components
│   └── lib/                  # Utilities
├── migrations/                # Database migrations
├── BACKEND_ARCHITECTURE.md   # Backend design docs
├── FRONTEND_ARCHITECTURE.md  # Frontend design docs
└── DEVELOPMENT.md            # Development guide
```

## Features

- ✨ Modern, responsive UI with Shadcn components
- 🔐 JWT-based authentication
- 🗄️ PostgreSQL database with migrations
- 🤖 AI integration for analysis
- 📊 Data analysis and reporting
- 👥 User management with roles
- 💳 Credit system for usage tracking
- 📱 Mobile-friendly design
- 🎯 Professional error handling
- 📝 Comprehensive logging

## Architecture

### Backend Architecture
See [BACKEND_ARCHITECTURE.md](./BACKEND_ARCHITECTURE.md) for:
- Application factory pattern
- Blueprint organization
- Error handling and validation
- Database models and migrations
- Configuration management

### Frontend Architecture
See [FRONTEND_ARCHITECTURE.md](./FRONTEND_ARCHITECTURE.md) for:
- API client with interceptors
- Custom hooks (useAsync, useApi, useAuth)
- Component organization
- State management patterns
- Error handling strategies

## Development

### Available Commands

**Backend**
```bash
# Run development server
FLASK_APP=server.app:create_app python -m flask run

# Create migration
FLASK_APP=server.app:apcreate_appp python -m flask db migrate -m "message"

# Apply migration
FLASK_APP=server.app:create_app python -m flask db upgrade

# Run tests
pytest
```

**Frontend**
```bash
# Development server
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Lint code
npm run lint

# Type checking
npm run typecheck
```

### Environment Variables

Copy `.env.example` to `.env` and configure:

```env
FLASK_ENV=development
DATABASE_URL=postgresql://user:password@localhost/planlyze
SECRET_KEY=your-secret-key
JWT_SECRET_KEY=your-jwt-key
ANTHROPIC_API_KEY=your-anthropic-key
```

See `.env.example` for all available options.

## Landing (Frontend)

The landing pages and components live under `src/landing` and share translations under `src/locales/landing.*.json`.

- Shared landing styles and helpers are centralized in `src/config/index.js`.
- Landing-specific backward-compatible re-exports exist at `src/landing/config.js` and `src/landing/useLanding.js`, but new code should import from `src/config/index.js`.
- Landing translations are located in `src/locales/landing.en.json` and `src/locales/landing.ar.json`.

Quick tips:

```bash
# Start frontend dev server
npm run dev

# Default language for i18n is set in `src/i18n/config.js` (currently 'ar').
```

## API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/me` - Update user profile
- `POST /api/auth/change-password` - Change password

### User Endpoints
- `GET /api/users` - List users (admin)
- `GET /api/users/<id>` - Get user by ID
- `PUT /api/users/<id>` - Update user
- `DELETE /api/users/<id>` - Delete user

### Analysis Endpoints
- `GET /api/analyses` - List analyses
- `POST /api/analyses` - Create analysis
- `GET /api/analyses/<id>` - Get analysis
- `PUT /api/analyses/<id>` - Update analysis
- `DELETE /api/analyses/<id>` - Delete analysis
- `POST /api/analyses/<id>/generate-report` - Generate report

### AI Endpoints
- `POST /api/ai/invoke` - Invoke AI with prompt
- `POST /api/ai/generate-analysis` - Generate AI analysis

## Error Handling

The application uses consistent error responses:

```json
{
  "success": false,
  "error": "Error message",
  "error_code": "ERROR_TYPE",
  "status_code": 400,
  "timestamp": "2025-12-13T10:30:00.000000"
}
```

## Database

### Migrations
Database schema is managed with Alembic:

```bash
# Create a migration
FLASK_APP=server.app:create_app python -m flask db migrate -m "description"

# Apply migrations
FLASK_APP=server.app:create_app python -m flask db upgrade

# Rollback
FLASK_APP=server.app:create_app python -m flask db downgrade
```

### Models
All models are defined in `server/models.py` using SQLAlchemy ORM.

## Deployment

### Using Gunicorn
```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:8000 server.app:create_app
```

### Using Docker
```bash
docker build -t planlyze .
docker run -p 8000:8000 --env-file .env planlyze
```

See [DEVELOPMENT.md](./DEVELOPMENT.md) for detailed deployment instructions.

## Best Practices

### Backend
- Always validate input with Validator class
- Use APIResponse for consistent responses
- Throw APIException for errors
- Apply @token_required for protected routes
- Use database migrations for schema changes
- Log important events

### Frontend
- Use custom hooks (useAsync, useApi, useAuth)
- Import services from @/api
- Handle all error cases
- Show loading states
- Validate user input before submission
- Use TypeScript for type safety

## Performance

### Backend Optimization
- Database connection pooling
- Query optimization with indexes
- Caching for frequent data
- Pagination for large datasets

### Frontend Optimization
- Code splitting and lazy loading
- Image optimization
- CSS and JS minification (Vite)
- Component memoization
- React Query for caching

## Security

- JWT token-based authentication
- Password hashing with bcrypt
- CORS configuration
- SQL injection prevention via ORM
- Input validation on all endpoints
- Secure environment variable management

## Contributing

1. Create a feature branch
2. Make your changes
3. Ensure tests pass
4. Create a pull request

## License

This project is proprietary and confidential.

## Support

For issues and questions:
1. Check the relevant architecture document
2. Review error logs
3. See DEVELOPMENT.md for troubleshooting
4. Contact the development team

## Project Statistics

- **Frontend**: React 18, Vite, TypeScript, TailwindCSS
- **Backend**: Flask 3.1, SQLAlchemy, PostgreSQL
- **External Services**: Anthropic Claude API
- **Package Count**: 100+ dependencies
- **Database Tables**: 10+ models
- **API Endpoints**: 30+ endpoints

## Changelog

### Version 1.0.0 (2025-12-13)
- Professional architecture setup
- Complete API client with interceptors
- Custom React hooks
- Database migrations
- Comprehensive documentation
- Error handling and validation
- JWT authentication
- CORS configuration

---

Made with ❤️ by the Planlyze team
flask run --host=0.0.0.0 --port=8000

# 1. Make changes to server/models.py
# 2. Generate migration
FLASK_APP=server.app:create_app python -m flask db migrate -m "Description of changes"

# 3. Review migration file in migrations/versions/
# 4. Apply to database
FLASK_APP=server.app:create_app python -m flask db upgrade

# To rollback (undo last migration):
FLASK_APP=server.app:create_app python -m flask db downgrade