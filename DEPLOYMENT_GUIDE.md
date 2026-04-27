# TRD Store - Complete Deployment Guide

## Table of Contents
1. [Pre-Deployment Requirements](#pre-deployment-requirements)
2. [Render One-Click Deployment](#render-one-click-deployment)
3. [Server Setup](#server-setup)
4. [Backend Deployment](#backend-deployment)
5. [Frontend Deployment](#frontend-deployment)
6. [Database Setup](#database-setup)
7. [SSL/HTTPS Configuration](#ssltls-configuration)
8. [Nginx Reverse Proxy](#nginx-reverse-proxy)
9. [Monitoring and Maintenance](#monitoring-and-maintenance)
10. [Troubleshooting](#troubleshooting)

---

## Render One-Click Deployment

This repository now includes [render.yaml](render.yaml) for Blueprint deployment on Render.

### Steps
1. Push this repository to GitHub.
2. In Render dashboard, choose **New > Blueprint**.
3. Select this repository; Render reads [render.yaml](render.yaml) and creates:
    - PostgreSQL database: `trd-store-db`
    - Redis service: `trd-store-redis`
    - Django backend service: `trd-store-backend`
    - Next.js frontend service: `trd-store-frontend`
4. In backend service env vars, set:
    - `SSLCZ_STORE_ID`
    - `SSLCZ_STORE_PASSWD`
    - `SSLCZ_IS_SANDBOX` (`True` for sandbox, `False` for live)
5. After first deploy, open backend and run migrations if needed (the start command already runs `python manage.py migrate`).

### SSLCommerz Variables
Use only the variable names that the backend code reads:
- `SSLCZ_STORE_ID`
- `SSLCZ_STORE_PASSWD`
- `SSLCZ_IS_SANDBOX`

Do not use `SSLCOMMERZ_STORE_ID` or `SSLCOMMERZ_STORE_PASSWORD` unless settings are changed.

---

## Pre-Deployment Requirements

### Server Requirements
- **OS:** Ubuntu 20.04 LTS or later (recommended for stability)
- **CPU:** Minimum 2 cores (4 cores recommended for production)
- **RAM:** Minimum 4GB (8GB recommended)
- **Storage:** Minimum 20GB (100GB+ for production with media files)
- **Bandwidth:** Adequate for expected traffic

### Required Software
- Python 3.10+ (for Django backend)
- Node.js 18+ (for Next.js frontend)
- PostgreSQL 13+ (production database)
- Nginx (reverse proxy and web server)
- Redis 6+ (caching and sessions)
- Git (for version control)

### Domain & SSL
- Domain name registered
- SSL certificate (Let's Encrypt is free)

---

## Server Setup

### Step 1: Connect to Your Server
```bash
# SSH into your server
ssh root@your_server_ip

# Update system packages
sudo apt update
sudo apt upgrade -y

# Install essential tools
sudo apt install -y build-essential libssl-dev libffi-dev python3-dev python3-pip python3-venv
sudo apt install -y git curl wget nano htop
```

### Step 2: Install Python 3.10+
```bash
# Check Python version
python3 --version

# If needed, install specific Python version
sudo apt install -y python3.10 python3.10-venv python3.10-dev
```

### Step 3: Install Node.js
```bash
# Install Node.js 18 (LTS)
curl -sL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version
npm --version
```

### Step 4: Install PostgreSQL
```bash
# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql << EOF
CREATE USER trd_store WITH PASSWORD 'secure_password_here';
CREATE DATABASE trd_store OWNER trd_store;
ALTER ROLE trd_store SET client_encoding TO 'utf8';
ALTER ROLE trd_store SET default_transaction_isolation TO 'read committed';
ALTER ROLE trd_store SET default_transaction_deferrable TO on;
ALTER ROLE trd_store SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE trd_store TO trd_store;
\q
EOF
```

### Step 5: Install Redis
```bash
# Install Redis
sudo apt install -y redis-server

# Start Redis service
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Verify Redis is running
redis-cli ping  # Should return PONG
```

### Step 6: Install Nginx
```bash
# Install Nginx
sudo apt install -y nginx

# Start Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### Step 7: Create Application Directory
```bash
# Create directory for the application
sudo mkdir -p /var/www/trd-store
sudo chown -R $USER:$USER /var/www/trd-store

# Navigate to directory
cd /var/www/trd-store

# Clone your repository (or upload via FTP/Git)
git clone https://github.com/your-username/trd-store.git .
# Or if pushing to server:
# git init
# git remote add origin <repository-url>
# git pull origin main
```

---

## Backend Deployment

### Step 1: Set Up Python Virtual Environment
```bash
cd /var/www/trd-store/backend

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Upgrade pip
pip install --upgrade pip setuptools wheel
```

### Step 2: Install Python Dependencies
```bash
# Install dependencies from requirements.txt
pip install -r requirements.txt

# Install production WSGI server
pip install gunicorn
pip install gunicorn[gevent]
```

### Step 3: Create Production Environment Variables
```bash
# Create .env file
nano /var/www/trd-store/backend/.env
```

Add the following content:
```
# Django Settings
DEBUG=False
SECRET_KEY=your-secret-key-here-generate-a-secure-one
ALLOWED_HOSTS=your-domain.com,www.your-domain.com,your-server-ip

# Database
DB_ENGINE=django.db.backends.postgresql
DB_NAME=trd_store
DB_USER=trd_store
DB_PASSWORD=secure_password_here
DB_HOST=localhost
DB_PORT=5432

# Redis Cache
REDIS_URL=redis://localhost:6379/0
CACHE_ENABLED=True

# Email Configuration (Optional - for sending emails)
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# SSLCommerz Payment Gateway
SSLCZ_STORE_ID=your-store-id
SSLCZ_STORE_PASSWD=your-store-password
SSLCZ_IS_SANDBOX=False
BACKEND_URL=https://api.your-domain.com
FRONTEND_URL=https://your-domain.com

# CORS Settings
CORS_ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com

# Security
SECURE_SSL_REDIRECT=True
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True
```

### Step 4: Run Database Migrations
```bash
cd /var/www/trd-store/backend

# Apply migrations
source venv/bin/activate
python manage.py migrate

# Create superuser for admin
python manage.py createsuperuser

# Collect static files
python manage.py collectstatic --noinput
```

### Step 5: Create Gunicorn Configuration
```bash
# Create gunicorn configuration
nano /var/www/trd-store/backend/gunicorn_config.py
```

Add:
```python
import multiprocessing

bind = "127.0.0.1:8000"
workers = multiprocessing.cpu_count() * 2 + 1
worker_class = "sync"
worker_connections = 1000
keepalive = 5
timeout = 30
max_requests = 1000
max_requests_jitter = 50
preload_app = True
daemon = False
errorlog = "/var/log/trd-store/gunicorn-error.log"
accesslog = "/var/log/trd-store/gunicorn-access.log"
loglevel = "info"
```

### Step 6: Create Systemd Service for Backend
```bash
# Create service file
sudo nano /etc/systemd/system/trd-store-backend.service
```

Add:
```ini
[Unit]
Description=TRD Store Django Backend
After=network.target postgresql.service redis-server.service

[Service]
Type=notify
User=www-data
Group=www-data
WorkingDirectory=/var/www/trd-store/backend
Environment="PATH=/var/www/trd-store/backend/venv/bin"
EnvironmentFile=/var/www/trd-store/backend/.env
ExecStart=/var/www/trd-store/backend/venv/bin/gunicorn \
    --config gunicorn_config.py \
    --bind 127.0.0.1:8000 \
    trd_backend.wsgi:application
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### Step 7: Enable and Start Backend Service
```bash
# Create log directory
sudo mkdir -p /var/log/trd-store
sudo chown www-data:www-data /var/log/trd-store

# Reload systemd daemon
sudo systemctl daemon-reload

# Enable service to start on boot
sudo systemctl enable trd-store-backend.service

# Start the service
sudo systemctl start trd-store-backend.service

# Check service status
sudo systemctl status trd-store-backend.service
```

---

## Frontend Deployment

### Step 1: Install Frontend Dependencies
```bash
cd /var/www/trd-store/frontend

# Install dependencies
npm install

# If needed, install PM2 process manager
npm install -g pm2
```

### Step 2: Create Production Environment Variables
```bash
# Create .env.production.local
nano /var/www/trd-store/frontend/.env.production.local
```

Add:
```
NEXT_PUBLIC_API_URL=https://your-domain.com/api
NEXT_PUBLIC_APP_NAME=TRD Store
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### Step 3: Build Next.js Application
```bash
cd /var/www/trd-store/frontend

# Build for production
npm run build

# Verify build completed successfully
ls -la .next
```

### Step 4: Create Systemd Service for Frontend
```bash
# Create service file
sudo nano /etc/systemd/system/trd-store-frontend.service
```

Add:
```ini
[Unit]
Description=TRD Store Next.js Frontend
After=network.target

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/var/www/trd-store/frontend
EnvironmentFile=/var/www/trd-store/frontend/.env.production.local
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### Step 5: Enable and Start Frontend Service
```bash
# Reload systemd daemon
sudo systemctl daemon-reload

# Enable service
sudo systemctl enable trd-store-frontend.service

# Start the service
sudo systemctl start trd-store-frontend.service

# Check status
sudo systemctl status trd-store-frontend.service
```

---

## Database Setup

### Step 1: Create Database Backup Strategy
```bash
# Create backup script
nano /usr/local/bin/backup-trd-store.sh
```

Add:
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/trd-store"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Backup PostgreSQL database
sudo -u postgres pg_dump trd_store | gzip > $BACKUP_DIR/trd_store_$DATE.sql.gz

# Keep only last 30 days of backups
find $BACKUP_DIR -name "trd_store_*.sql.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_DIR/trd_store_$DATE.sql.gz"
```

### Step 2: Make Script Executable and Add to Cron
```bash
# Make executable
chmod +x /usr/local/bin/backup-trd-store.sh

# Add to crontab (daily backup at 2 AM)
sudo crontab -e

# Add this line:
0 2 * * * /usr/local/bin/backup-trd-store.sh
```

### Step 3: Enable PostgreSQL Remote Access (if needed)
```bash
# Edit PostgreSQL configuration
sudo nano /etc/postgresql/13/main/postgresql.conf

# Find and change:
# listen_addresses = 'localhost'
# To:
listen_addresses = '*'

# Edit pg_hba.conf for remote connections
sudo nano /etc/postgresql/13/main/pg_hba.conf

# Add this line:
# host    all             all             0.0.0.0/0               md5

# Restart PostgreSQL
sudo systemctl restart postgresql
```

---

## SSL/TLS Configuration

### Step 1: Install Certbot
```bash
# Install Let's Encrypt Certbot
sudo apt install -y certbot python3-certbot-nginx

# Request SSL certificate
sudo certbot certonly --nginx -d your-domain.com -d www.your-domain.com
```

### Step 2: Configure Auto-Renewal
```bash
# Test automatic renewal
sudo certbot renew --dry-run

# Enable auto-renewal
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

---

## Nginx Reverse Proxy

### Step 1: Create Nginx Configuration
```bash
# Create Nginx configuration file
sudo nano /etc/nginx/sites-available/trd-store
```

Add:
```nginx
# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name your-domain.com www.your-domain.com;
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS server configuration
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL certificates
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # Security headers
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css text/xml text/javascript 
               application/x-javascript application/xml+rss 
               application/javascript application/json;
    gzip_min_length 1000;

    # Client upload size
    client_max_body_size 50M;

    # Logging
    access_log /var/log/nginx/trd-store-access.log;
    error_log /var/log/nginx/trd-store-error.log;

    # Backend API proxy
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Admin panel proxy
    location /admin/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static files
    location /static/ {
        alias /var/www/trd-store/backend/staticfiles/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Media files
    location /media/ {
        alias /var/www/trd-store/backend/media/;
        expires 7d;
        add_header Cache-Control "public";
    }

    # Frontend
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

### Step 2: Enable and Test Nginx Configuration
```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/trd-store /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

---

## Monitoring and Maintenance

### Step 1: Monitor Service Status
```bash
# Check service status
sudo systemctl status trd-store-backend.service
sudo systemctl status trd-store-frontend.service

# View recent logs
sudo journalctl -u trd-store-backend.service -n 50
sudo journalctl -u trd-store-frontend.service -n 50

# Real-time log streaming
sudo journalctl -u trd-store-backend.service -f
```

### Step 2: Monitor Server Health
```bash
# Check disk usage
df -h

# Check memory usage
free -h

# Check CPU usage
top

# Check processes
ps aux | grep trd-store
```

### Step 3: Set Up Automated Monitoring (Optional)
```bash
# Install Prometheus node exporter
wget https://github.com/prometheus/node_exporter/releases/download/v1.5.0/node_exporter-1.5.0.linux-amd64.tar.gz
tar xvfz node_exporter-1.5.0.linux-amd64.tar.gz
sudo mv node_exporter-1.5.0.linux-amd64/node_exporter /usr/local/bin/
sudo useradd -rs /bin/false node_exporter

# Create systemd service for node exporter
sudo nano /etc/systemd/system/node_exporter.service
```

### Step 4: Update Application
```bash
# Pull latest changes
cd /var/www/trd-store
git pull origin main

# Backend updates
cd backend
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput
sudo systemctl restart trd-store-backend.service

# Frontend updates
cd ../frontend
npm install
npm run build
sudo systemctl restart trd-store-frontend.service
```

---

## Troubleshooting

### Backend Issues

#### Error: "Connection refused" for database
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check PostgreSQL is listening on localhost:5432
sudo ss -tulpn | grep 5432

# Restart PostgreSQL
sudo systemctl restart postgresql
```

#### Error: "Permission denied" on media upload
```bash
# Fix permissions
sudo chown -R www-data:www-data /var/www/trd-store/backend/media
sudo chmod -R 755 /var/www/trd-store/backend/media
```

#### Error: "Gunicorn failed to start"
```bash
# Check logs
sudo journalctl -u trd-store-backend.service -n 100

# Test gunicorn manually
cd /var/www/trd-store/backend
source venv/bin/activate
gunicorn --bind 127.0.0.1:8000 trd_backend.wsgi:application
```

### Frontend Issues

#### Error: "Frontend not responding"
```bash
# Check service status
sudo systemctl status trd-store-frontend.service

# Check logs
sudo journalctl -u trd-store-frontend.service -n 100

# Restart service
sudo systemctl restart trd-store-frontend.service
```

#### Error: "API connection fails"
```bash
# Verify backend is running
sudo systemctl status trd-store-backend.service

# Check Nginx proxy settings
sudo nginx -t

# Verify firewall rules
sudo ufw status
```

### Common Commands Reference

```bash
# Service Management
sudo systemctl start trd-store-backend.service
sudo systemctl stop trd-store-backend.service
sudo systemctl restart trd-store-backend.service
sudo systemctl status trd-store-backend.service

# View Logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/trd-store/gunicorn-error.log

# Database Management
sudo -u postgres psql -d trd_store
\dt                    # List tables
\q                     # Quit

# Restart All Services
sudo systemctl restart nginx
sudo systemctl restart trd-store-backend.service
sudo systemctl restart trd-store-frontend.service

# Check Ports
sudo ss -tulpn
sudo netstat -tulpn
```

---

## Performance Optimization Tips

1. **Enable Caching**: Set up Redis caching for database queries
2. **Compress Assets**: Enable gzip compression in Nginx
3. **Use CDN**: Serve static files from CDN for faster delivery
4. **Database Indexing**: Create indexes on frequently queried columns
5. **Connection Pooling**: Use pgBouncer for PostgreSQL connection pooling
6. **Load Balancing**: Set up multiple backend instances behind a load balancer

---

## Post-Deployment Checklist

- [ ] Domain name pointing to server IP
- [ ] SSL certificate installed and auto-renewal configured
- [ ] Database backups configured
- [ ] Admin user created
- [ ] Email configuration tested
- [ ] Payment gateway credentials configured
- [ ] Monitoring and logging configured
- [ ] Firewall rules configured
- [ ] All services set to auto-start
- [ ] Performance tested under load
- [ ] Documentation updated
- [ ] Team trained on deployment process

---

## Support & Resources

- Django Documentation: https://docs.djangoproject.com/
- Next.js Documentation: https://nextjs.org/docs
- PostgreSQL Documentation: https://www.postgresql.org/docs/
- Nginx Documentation: http://nginx.org/en/docs/
- Let's Encrypt: https://letsencrypt.org/

---

**Last Updated:** April 2026
**Maintainer:** Your Team
