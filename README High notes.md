# Planlyze

Professional Full-Stack Application for Data Analysis and Reporting
 
## Development

### Available Commands

**Backend**
source venv/bin/activate
```bash
# Run development server
FLASK_APP=server.app:create_app python -m flask run --port 3000

# Create migration
FLASK_APP=server.app:create_app python -m flask db migrate -m "add contact us"

# Apply migration
FLASK_APP=server.app:create_app python -m flask db upgrade


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

## Database

### Migrations
Database schema is managed with Alembic:

```bash
# Create a migration
FLASK_APP=server.app:create_app python -m flask db migrate -m "add contact us"

# Apply migrations
FLASK_APP=server.app:create_app python -m flask db upgrade

# Rollback
FLASK_APP=server.app:create_app python -m flask db downgrade
```