# From Base44 App To flask
# go to server folder (README/FLASK_SETUP.md recommend this)
cd server

# create & activate virtualenv
python3 -m venv venv
source venv/bin/activate

# install dependencies (use requirements.txt or minimal list from README)
pip install Flask Flask-SQLAlchemy psycopg2-binary python-dotenv Flask-CORS

# 1. Clean up and unlink the service
brew services stop postgresql@18
brew unlink postgresql@18

# 2. Fix the data directory permissions just in case
# IMPORTANT: Replace 'lana' with your actual username if it's different!
sudo chown -R lana:admin /opt/homebrew/var/postgresql@18

# 3. Relink and attempt to start
brew link postgresql@18
brew services start postgresql@18

psql -U planlyze -h localhost -p 5433 -d planlyze

# set env vars (adjust values)
export DATABASE_URL="postgresql://planlyze:secret@localhost:5432/planlyze"
export FLASK_APP=main.py
export FLASK_ENV=development
# start flask on port 8000 (vite proxy expects backend on 8000)
flask run --host=0.0.0.0 --port=8000