# Development & Deployment Guide

Complete setup guide for local development and production deployment.

## Prerequisites

- Python 3.10+
- Node.js 18+
- PostgreSQL 13+
- Git

## Local Development Setup

### 1. Clone and Install Dependencies

```bash
# Clone repository
git clone <repository-url>
cd planlyze

# Create Python virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt

# Install Node dependencies
npm install
```

### 2. Environment Configuration

Create `.env` file in project root:

```env
# Flask Configuration
FLASK_ENV=development
FLASK_DEBUG=1

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/planlyze

# Security
SECRET_KEY=your-development-secret-key
JWT_SECRET_KEY=your-jwt-secret-key

# External Services
ANTHROPIC_API_KEY=your-anthropic-api-key

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:3000,http://127.0.0.1:3000

# Pagination
ITEMS_PER_PAGE=20

# JWT
JWT_ACCESS_TOKEN_EXPIRES=86400
```

### 3. Database Setup

```bash
# Navigate to project root
cd /Users/lana/Documents/Planlyze/Code/planlyze

# Create database
createdb planlyze

# Run migrations
FLASK_APP=server.app:app python -m flask db upgrade

export FLASK_APP=server.app:create_app python -m flask db upgrade
```

### 4. Start Development Servers

**Terminal 1 - Backend (Flask):**
```bash
FLASK_APP=server.app:create_app python -m flask run --port 3000

```

**Terminal 2 - Frontend (Vite):**
```bash
npm run dev
```

Access the app at `http://localhost:3000`

## Project Structure

```
planlyze/
├── server/                 # Flask backend
│   ├── app.py             # Application factory
│   ├── config.py          # Configuration
│   ├── models.py          # Database models
│   ├── exceptions.py      # Custom exceptions
│   ├── utils/             # Utilities
│   ├── routes/            # API routes
│   └── migrations/        # Database migrations
├── src/                   # React frontend
│   ├── api/              # API client
│   ├── components/       # React components
│   ├── hooks/            # Custom hooks
│   ├── pages/            # Page components
│   ├── lib/              # Utilities
│   └── App.jsx           # Root component
├── .env                  # Environment variables
├── package.json          # Node dependencies
├── requirements.txt      # Python dependencies
├── vite.config.js        # Vite configuration
├── BACKEND_ARCHITECTURE.md
└── FRONTEND_ARCHITECTURE.md
```

## Database Migrations

### Create a New Migration

After modifying models in `server/models.py`:

```bash
# Generate migration file
FLASK_APP=server.app:app python -m flask db migrate -m "Description of changes"

# Review generated migration
cat migrations/versions/XXXX_description.py

# Apply migration
FLASK_APP=server.app:app python -m flask db upgrade
```

### Rollback Migration

```bash
# Undo last migration
FLASK_APP=server.app:app python -m flask db downgrade

# Or downgrade to specific revision
FLASK_APP=server.app:app python -m flask db downgrade <revision>
```

## Testing

### Backend Tests

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=server

# Run specific test file
pytest server/tests/test_auth.py
```

### Frontend Tests

```bash
# Run tests
npm test

# Run with coverage
npm test -- --coverage
```

## Building for Production

### Backend

```bash
# Set production environment
export FLASK_ENV=production

# Ensure all dependencies are installed
pip install -r requirements.txt

# Run migrations
FLASK_APP=server.app:app python -m flask db upgrade

# Start with production server (e.g., Gunicorn)
gunicorn -w 4 -b 0.0.0.0:8000 server.app:app
```

### Frontend

```bash
# Build production bundle
npm run build

# Output is in dist/ directory
# Deploy dist/ to your web server
```

## Docker Deployment (Optional)

Create `Dockerfile`:

```dockerfile
FROM python:3.10-slim

WORKDIR /app

# Install Node
RUN apt-get update && apt-get install -y nodejs npm

# Copy files
COPY . .

# Install dependencies
RUN pip install -r requirements.txt
RUN npm install

# Build frontend
RUN npm run build

# Expose ports
EXPOSE 8000

# Run migrations and start server
CMD ["sh", "-c", "FLASK_APP=server.app:app flask db upgrade && gunicorn -w 4 -b 0.0.0.0:8000 server.app:app"]
```

Build and run:

```bash
docker build -t planlyze .
docker run -p 8000:8000 --env-file .env planlyze
```

## Troubleshooting

### Database Connection Error
```
Error: could not connect to server
```
- Verify PostgreSQL is running: `pg_isready`
- Check DATABASE_URL is correct
- Ensure database exists: `createdb planlyze`

### Import Errors in Flask
```
ModuleNotFoundError: No module named 'server'
```
- Activate virtual environment: `source venv/bin/activate`
- Install dependencies: `pip install -r requirements.txt`
- Run from project root directory

### CORS Errors
```
Access to XMLHttpRequest blocked by CORS policy
```
- Update CORS_ORIGINS in .env
- Restart Flask server
- Check backend logs

### Frontend Not Loading
```
[vite] http proxy error
```
- Ensure Flask backend is running on port 3000
- Check proxy configuration in vite.config.js
- Clear browser cache

## Monitoring & Logging

### Backend Logging
Check `server/app.py` for logging configuration:

```python
import logging
logger = logging.getLogger(__name__)
logger.info("Important event")
logger.error("Error occurred")
```

View logs:
```bash
# Follow logs in real-time
tail -f logs/app.log
```

### Frontend Errors
Use browser DevTools:
- Console tab for errors
- Network tab for API calls
- Performance tab for optimization

## Performance Optimization

### Backend
- Use connection pooling
- Add database indexes
- Cache frequent queries
- Use pagination for large datasets

### Frontend
- Code splitting with dynamic imports
- Image optimization
- CSS/JS minification (done by Vite)
- Lazy load components

## Security Checklist

Before deploying to production:

- [ ] Change all SECRET_KEY values
- [ ] Use strong JWT_SECRET_KEY
- [ ] Enable HTTPS only
- [ ] Set CORS_ORIGINS to specific domains
- [ ] Use environment variables for secrets
- [ ] Enable CSRF protection
- [ ] Validate all user inputs
- [ ] Use secure password hashing
- [ ] Enable database backups
- [ ] Set up monitoring and alerts

## Deployment Providers

### Heroku
```bash
# Create Procfile
echo "web: gunicorn server.app:app" > Procfile

# Push to Heroku
git push heroku main

# Set environment variables
heroku config:set FLASK_ENV=production
heroku config:set SECRET_KEY=your-key
```

### Railway
- Connect GitHub repository
- Add PostgreSQL plugin
- Set environment variables
- Deploy!

### DigitalOcean
See [DigitalOcean App Platform Docs](https://docs.digitalocean.com/products/app-platform/)

## Getting Help

- Check architecture documents: BACKEND_ARCHITECTURE.md, FRONTEND_ARCHITECTURE.md
- Review error logs in console
- Search GitHub issues for similar problems
- Contact development team
