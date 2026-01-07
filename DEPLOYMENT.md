# Planlyze VPS Deployment Guide

This guide covers deploying Planlyze to your own VPS with your own Claude API key.

## Minimum VPS Requirements

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| **CPU** | 1 vCPU | 2 vCPUs |
| **RAM** | 2 GB | 4 GB |
| **Storage** | 20 GB SSD | 40 GB SSD |
| **OS** | Ubuntu 22.04 LTS | Ubuntu 22.04/24.04 LTS |
| **Bandwidth** | 1 TB/month | 2+ TB/month |

### Estimated Monthly Costs
- **DigitalOcean/Vultr/Linode**: $12-24/month (2GB-4GB droplet)
- **Hetzner**: $5-10/month (excellent value in EU)
- **AWS Lightsail**: $10-20/month

## Prerequisites

Before starting, ensure you have:
1. A VPS with root/sudo access
2. A domain name pointed to your VPS IP (optional but recommended)
3. An Anthropic API key from https://console.anthropic.com/
4. (Optional) ZeptoMail API key for email verification

## Step 1: Initial Server Setup

```bash
# Connect to your VPS
ssh root@your-server-ip

# Update system packages
apt update && apt upgrade -y

# Install required system packages
apt install -y python3.11 python3.11-venv python3-pip nodejs npm postgresql postgresql-contrib nginx certbot python3-certbot-nginx git curl

# Install Node.js 20 (if not already at v20+)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt install -y nodejs

# Create application user
useradd -m -s /bin/bash planlyze
usermod -aG sudo planlyze
```

## Step 2: PostgreSQL Database Setup

```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user (replace 'your_secure_password' with a strong password)
CREATE USER planlyze WITH PASSWORD 'your_secure_password';
CREATE DATABASE planlyze_db OWNER planlyze;
GRANT ALL PRIVILEGES ON DATABASE planlyze_db TO planlyze;
\q
```

## Step 3: Clone and Configure Application

```bash
# Switch to planlyze user
su - planlyze

# Clone the repository (replace with your actual repo URL)
git clone https://github.com/your-username/planlyze.git ~/planlyze
cd ~/planlyze

# Create Python virtual environment
python3.11 -m venv venv
source venv/bin/activate

# Install Python dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Install Node.js dependencies
npm install

# Build frontend for production
npm run build
```

## Step 4: Environment Configuration

Create the `.env` file in the project root:

```bash
nano ~/planlyze/.env
```

Add the following configuration:

```env
# Flask Configuration
FLASK_ENV=production
SECRET_KEY=your_very_long_random_secret_key_here

# Database Configuration
DATABASE_URL=postgresql://planlyze:your_secure_password@localhost:5432/planlyze_db

# Anthropic Claude API Key (Required)
ANTHROPIC_API_KEY=sk-ant-api03-your-claude-api-key-here

# ZeptoMail Configuration (Optional - for email verification)
ZEPTOMAIL_API_KEY=your_zeptomail_api_key
ZEPTOMAIL_FROM_EMAIL=noreply@yourdomain.com

# Application Settings
APP_URL=https://yourdomain.com
FRONTEND_URL=https://yourdomain.com

# JWT Settings
JWT_SECRET_KEY=another_long_random_secret_key
JWT_ACCESS_TOKEN_EXPIRES=86400
```

Generate secure secret keys:
```bash
# Generate random secret keys
python3 -c "import secrets; print(secrets.token_hex(32))"
```

## Step 5: Initialize Database

```bash
cd ~/planlyze
source venv/bin/activate

# Run database migrations
flask db upgrade

# Seed initial data (optional)
python -c "from server.seed import seed_database; seed_database()"
```

## Step 6: Create Systemd Service Files

### Backend API Service

```bash
sudo nano /etc/systemd/system/planlyze-api.service
```

```ini
[Unit]
Description=Planlyze Flask API
After=network.target postgresql.service

[Service]
User=planlyze
Group=planlyze
WorkingDirectory=/home/planlyze/planlyze
Environment="PATH=/home/planlyze/planlyze/venv/bin"
EnvironmentFile=/home/planlyze/planlyze/.env
ExecStart=/home/planlyze/planlyze/venv/bin/gunicorn --workers 4 --bind 127.0.0.1:3000 --timeout 120 "server:create_app()"
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### Enable and Start Services

```bash
sudo systemctl daemon-reload
sudo systemctl enable planlyze-api
sudo systemctl start planlyze-api

# Check status
sudo systemctl status planlyze-api
```

## Step 7: Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/planlyze
```

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Root directory for frontend
    root /home/planlyze/planlyze/dist;
    index index.html;

    # Cache static assets (JS, CSS, images, fonts)
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        root /home/planlyze/planlyze/dist;
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    # Backend API proxy
    location /api/ {
        proxy_pass http://127.0.0.1:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 120s;
        proxy_connect_timeout 120s;
    }

    # Swagger API documentation
    location /apidocs {
        proxy_pass http://127.0.0.1:3000/apidocs;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://127.0.0.1:3000/health;
    }

    # Frontend - serve index.html for all other routes (SPA routing)
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/planlyze /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default  # Remove default site
sudo nginx -t  # Test configuration
sudo systemctl reload nginx
```

## Step 8: SSL Certificate (HTTPS)

```bash
# Install SSL certificate with Let's Encrypt
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal is set up automatically, but you can test it:
sudo certbot renew --dry-run
```

## Step 9: Firewall Configuration

```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

## Deployment Script

Create a deployment script for easy updates:

```bash
nano ~/planlyze/deploy.sh
```

```bash
#!/bin/bash
set -e

echo "=== Planlyze Deployment Script ==="

cd /home/planlyze/planlyze

echo "1. Pulling latest code..."
git pull origin main

echo "2. Activating virtual environment..."
source venv/bin/activate

echo "3. Installing Python dependencies..."
pip install -r requirements.txt

echo "4. Installing Node.js dependencies..."
npm install

echo "5. Building frontend..."
npm run build

echo "6. Running database migrations..."
flask db upgrade

echo "7. Restarting API service..."
sudo systemctl restart planlyze-api

echo "8. Checking service status..."
sleep 3
sudo systemctl status planlyze-api --no-pager

echo "=== Deployment Complete ==="
```

Make it executable:
```bash
chmod +x ~/planlyze/deploy.sh
```

## Syrian Competitors Data

The Syrian competitor data is hardcoded in `server/services/competitor_service.py`. This file contains 20+ Syrian apps/services including:

- **Delivery**: Syriantel Delivery, Talabat Syria
- **E-commerce**: Haraj Syria, Souq Syria
- **Payments**: Syriatel Pay, MTN Cash
- **Jobs**: Syria Jobs, Bayt Syria
- **Taxi**: Taxi Syria, Careem Syria
- **Real Estate**: Aqarmap Syria, Property Syria
- **Health**: Vezeeta Syria, Altibbi Syria
- **And more...**

### How It Works:
1. When generating the Market Analysis tab, the AI receives all competitor data
2. Claude AI analyzes which competitors are relevant based on the user's business idea
3. The AI generates relevance scores, descriptions, pros/cons, and differentiation recommendations
4. Results are displayed with clickable links to app stores and social media

### Adding New Competitors:
Edit `server/services/competitor_service.py` and add entries to the `SYRIAN_COMPETITORS` list:

```python
{
    "name": "Your Competitor Name",
    "features": ["Feature 1", "Feature 2", "Feature 3"],
    "social": {
        "facebook": "https://facebook.com/...",
        "instagram": "https://instagram.com/...",
        "whatsapp": "+963...",
        "telegram": "https://t.me/..."
    },
    "app_links": {
        "android": "https://play.google.com/store/apps/details?id=...",
        "ios": "https://apps.apple.com/app/...",
        "website": "https://..."
    },
    "cities": ["Damascus", "Aleppo", "Homs"]
}
```

## Claude API Costs

Planlyze uses Claude Sonnet 4.5 for AI analysis. Estimated costs:

| Usage | Tokens per Report | Cost per Report |
|-------|-------------------|-----------------|
| Full Analysis (6 tabs) | ~50,000-80,000 | ~$0.15-0.25 |
| Single Tab Regeneration | ~8,000-15,000 | ~$0.02-0.05 |

**Monthly estimates:**
- 100 reports/month: ~$15-25
- 500 reports/month: ~$75-125
- 1000 reports/month: ~$150-250

## Troubleshooting

### Check Service Logs
```bash
# API logs
sudo journalctl -u planlyze-api -f

# Nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

### Common Issues

**1. Database connection error:**
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Test connection
psql -U planlyze -d planlyze_db -h localhost
```

**2. API not responding:**
```bash
# Check if service is running
sudo systemctl status planlyze-api

# Restart service
sudo systemctl restart planlyze-api
```

**3. Frontend not loading:**
```bash
# Verify build files exist
ls -la /home/planlyze/planlyze/dist

# Rebuild if needed
cd ~/planlyze && npm run build
```

**4. SSL certificate issues:**
```bash
# Renew certificate manually
sudo certbot renew
```

## Backup Strategy

### Database Backup
```bash
# Create backup
pg_dump -U planlyze planlyze_db > backup_$(date +%Y%m%d).sql

# Automate with cron (daily at 2 AM)
crontab -e
# Add: 0 2 * * * pg_dump -U planlyze planlyze_db > /home/planlyze/backups/db_$(date +\%Y\%m\%d).sql
```

### Application Backup
```bash
# Backup entire application
tar -czvf planlyze_backup_$(date +%Y%m%d).tar.gz ~/planlyze
```

## Monitoring (Optional)

Consider setting up:
- **Uptime monitoring**: UptimeRobot (free tier available)
- **Log aggregation**: Papertrail, Logtail
- **APM**: New Relic, Sentry for error tracking

## Security Recommendations

1. **Keep systems updated**: `apt update && apt upgrade` regularly
2. **Use strong passwords**: For database, SSH, and all accounts
3. **Enable fail2ban**: Protect against brute force attacks
4. **Limit SSH access**: Use key-based authentication only
5. **Regular backups**: Automate daily database backups
6. **Monitor logs**: Check for unusual activity

## Support

For issues specific to:
- **Anthropic API**: https://docs.anthropic.com/
- **PostgreSQL**: https://www.postgresql.org/docs/
- **Nginx**: https://nginx.org/en/docs/
- **Flask**: https://flask.palletsprojects.com/
