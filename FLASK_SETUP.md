# Flask Backend Setup Guide with PostgreSQL

## Prerequisites

- Python 3.10+ (you have 3.10.4 ✓)
- PostgreSQL installed and running
- pip package manager

## Step 1: Install PostgreSQL (if not already installed)

### On macOS (using Homebrew):
```bash
# Install PostgreSQL
brew install postgresql@18

# Start PostgreSQL service
brew services start postgresql@18

# Verify installation
psql --version
```

## Step 2: Create PostgreSQL Database

```bash
# Connect to PostgreSQL
psql postgres

# Inside psql, run these commands:
CREATE DATABASE planlyze;
CREATE USER planlyze WITH PASSWORD 'your_secure_password';
ALTER ROLE planlyze SET client_encoding TO 'utf8';
ALTER ROLE planlyze SET default_transaction_isolation TO 'read committed';
ALTER ROLE planlyze SET default_transaction_deferrable TO on;
ALTER ROLE planlyze SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE planlyze TO planlyze;
\q

# Verify the database was created
psql -U planlyze -d planlyze -c "SELECT 1;"
```

## Step 3: Set Up Python Environment

```bash
cd /Users/lana/Documents/Planlyze/Code/planlyze

# Create a virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Upgrade pip
pip install --upgrade pip

# Install dependencies from pyproject.toml
pip install -e .

# Or install individual packages if the above doesn't work:
# pip install flask flask-cors flask-sqlalchemy psycopg2-binary python-dotenv pyjwt anthropic bcrypt gunicorn
```

## Step 4: Configure Environment Variables

Create/update your `.env` file in the project root:

```env
# Flask Configuration
FLASK_APP=server.app
FLASK_ENV=development
FLASK_DEBUG=True

# Database Configuration
DATABASE_URL=postgresql://planlyze:your_secure_password@localhost:5433/planlyze

# API Keys
SECRET_KEY=your-secret-key-change-in-production
JWT_SECRET_KEY=your-jwt-secret-key-change-in-production
ANTHROPIC_API_KEY=your-anthropic-api-key

# Server Configuration
PORT=8000
```

## Step 5: Initialize Database

```bash
# From the project root with venv activated
cd /Users/lana/Documents/Planlyze/Code/planlyze

python3 -c "
from server.app import create_app
app = create_app()
with app.app_context():
    from server.models import db
    db.create_all()
    print('Database tables created successfully!')
"
```

## Step 6: Run the Flask Server

```bash
# Method 1: Direct Flask run
flask run

# Method 2: Using Python
python3 -m flask run

# Method 3: With specific port
flask run --port=8000

# Method 4: Using Gunicorn (production)
gunicorn -w 4 -b 0.0.0.0:8000 "server.app:app"
```

The server will be available at: `http://localhost:8000`

## Verify It's Working

```bash
# Test health endpoint
curl http://localhost:8000/api/health

# Should return: {"status":"ok"}
```

## Troubleshooting

### 1. Port Already in Use
```bash
# Find process using port 8000
lsof -i :8000

# Kill the process
kill -9 <PID>
```

### 2. Database Connection Error
- Verify PostgreSQL is running: `brew services list`
- Check DATABASE_URL in `.env` file
- Ensure database credentials are correct

### 3. Missing Dependencies
```bash
# Reinstall all dependencies
pip install --upgrade -e .
```

### 4. Flask Not Found
```bash
# Make sure venv is activated and Flask is installed
source venv/bin/activate
pip install flask
```

### 5. Python Module Not Found
```bash
# Set PYTHONPATH
export PYTHONPATH="${PYTHONPATH}:/Users/lana/Documents/Planlyze/Code/planlyze"
```

## Database Management

### Create a Database Migration (if needed)
```bash
# Install Flask-Migrate
pip install flask-migrate

# Initialize migrations folder
flask db init

# Create a migration
flask db migrate -m "Initial migration"

# Apply migrations
flask db upgrade
```

### Access Database Directly
```bash
# Connect to the database
psql -U planlyze -d planlyze

# Useful commands:
# \dt                 - List all tables
# \d table_name      - Describe table structure
# SELECT * FROM users; - Query data
# \q                 - Quit
```

## Development vs Production

### Development (Current Setup)
- Uses Flask development server
- Debug mode enabled
- Hot reload on file changes
- Use SQLite for testing if needed

### Production
```bash
# Use Gunicorn with multiple workers
gunicorn -w 4 -b 0.0.0.0:8000 --timeout 120 "server.app:app"

# Update .env:
# FLASK_ENV=production
# FLASK_DEBUG=False
```

## Next Steps

1. ✓ Create and configure PostgreSQL database
2. ✓ Set up Python virtual environment
3. ✓ Install dependencies
4. ✓ Configure `.env` file
5. ✓ Initialize database tables
6. ✓ Run Flask server
7. Connect frontend to backend API at `http://localhost:8000/api`
