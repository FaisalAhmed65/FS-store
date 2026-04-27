# Quick Deployment Checklist & Reference

## Pre-Deployment (1-2 days before)

### Hardware & Infrastructure
- [ ] Rent server (DigitalOcean, Linode, AWS, Google Cloud, etc.)
- [ ] Domain name registered and verified
- [ ] SSL certificate provisioned (Let's Encrypt recommended)
- [ ] Backup storage configured
- [ ] Monitoring tools installed

### Code Preparation
- [ ] All code committed to Git repository
- [ ] Environment variables documented (.env.example)
- [ ] Database migrations tested locally
- [ ] Static files collected and tested
- [ ] Frontend build tested locally
- [ ] Security audit completed

---

## Deployment Day (2-4 hours)

### Step 1: Initial Server Setup (15 mins)
```bash
ssh root@your_server_ip
sudo apt update && sudo apt upgrade -y
# Follow "Server Setup" section in DEPLOYMENT_GUIDE.md
```

### Step 2: Install Dependencies (20 mins)
```bash
# Install Python, Node.js, PostgreSQL, Redis, Nginx
# Follow "Server Setup" steps 2-6
```

### Step 3: Clone Repository (5 mins)
```bash
cd /var/www/trd-store
git clone https://github.com/your-username/trd-store.git .
```

### Step 4: Backend Setup (20 mins)
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install gunicorn
# Copy .env file
nano .env  # Add production variables
python manage.py migrate
python manage.py createsuperuser
python manage.py collectstatic --noinput
```

### Step 5: Frontend Setup (15 mins)
```bash
cd ../frontend
npm install
# Copy .env.production.local
nano .env.production.local  # Add production variables
npm run build
```

### Step 6: Configure Services (15 mins)
```bash
# Create systemd service files
# Follow "Backend Deployment" step 6 & "Frontend Deployment" step 4
sudo systemctl start trd-store-backend.service
sudo systemctl start trd-store-frontend.service
```

### Step 7: Configure Nginx (10 mins)
```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/trd-store
# Copy configuration from DEPLOYMENT_GUIDE.md
sudo ln -s /etc/nginx/sites-available/trd-store /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Step 8: SSL Certificate (5 mins)
```bash
sudo certbot certonly --nginx -d your-domain.com -d www.your-domain.com
```

### Step 9: Testing (10 mins)
```bash
# Test all endpoints
curl https://your-domain.com/
curl https://your-domain.com/api/v1/categories/
curl https://your-domain.com/admin/
```

---

## Post-Deployment (Ongoing)

### Daily Tasks
- [ ] Monitor error logs
- [ ] Check disk space usage
- [ ] Verify backup completion
- [ ] Monitor service health

### Weekly Tasks
- [ ] Review performance metrics
- [ ] Update security patches
- [ ] Test backup restoration
- [ ] Check SSL certificate expiry

### Monthly Tasks
- [ ] Full security audit
- [ ] Database optimization
- [ ] Review and optimize queries
- [ ] Update dependencies

---

## Hosting Provider Quick Start

### DigitalOcean
```bash
# 1. Create Ubuntu 20.04 LTS droplet (2GB RAM, 50GB SSD)
# 2. SSH into droplet
# 3. Follow server setup steps above
# 4. Add domain to Spaces for media storage (optional)
```

### AWS EC2
```bash
# 1. Launch t3.small EC2 instance (Ubuntu 20.04)
# 2. Configure security group (allow 80, 443, 22)
# 3. Associate Elastic IP
# 4. Point domain to Elastic IP
# 5. SSH and follow setup steps
```

### Google Cloud Platform
```bash
# 1. Create Compute Engine instance (e2-small, Ubuntu 20.04)
# 2. Configure firewall rules
# 3. Reserve static IP
# 4. Point domain to IP
# 5. SSH and follow setup steps
```

### Linode
```bash
# 1. Create Linode (Nanode 1GB or larger)
# 2. Configure firewall
# 3. Reserve IP address
# 4. Point domain to IP
# 5. SSH and follow setup steps
```

---

## Common Issues & Quick Fixes

### Backend Won't Start
```bash
# Check logs
sudo journalctl -u trd-store-backend.service -n 50

# Common fixes
sudo chown -R www-data:www-data /var/www/trd-store
sudo chmod -R 755 /var/www/trd-store
python manage.py migrate
```

### Frontend Not Responsive
```bash
# Restart frontend
sudo systemctl restart trd-store-frontend.service

# Check Nginx config
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### Database Connection Error
```bash
# Check PostgreSQL
sudo systemctl status postgresql

# Test connection
sudo -u postgres psql -d trd_store

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### SSL Certificate Issues
```bash
# Renew certificate
sudo certbot renew --force-renewal

# Check certificate validity
sudo certbot certificates
```

---

## Monitoring Commands

```bash
# View real-time logs
tail -f /var/log/nginx/error.log
tail -f /var/log/trd-store/gunicorn-error.log

# Check service status
sudo systemctl status trd-store-backend.service
sudo systemctl status trd-store-frontend.service

# Monitor resources
htop
df -h
free -h

# Check listening ports
sudo ss -tulpn

# Check running processes
ps aux | grep trd-store
```

---

## Scaling Checklist (When You Need to Grow)

- [ ] Set up load balancer (HAProxy, AWS ELB, Google Cloud LB)
- [ ] Configure auto-scaling groups
- [ ] Set up read replicas for PostgreSQL
- [ ] Implement CDN for static content (Cloudflare, AWS CloudFront)
- [ ] Configure Redis cluster for caching
- [ ] Set up message queue (Celery + RabbitMQ) for async tasks
- [ ] Implement rate limiting and DDoS protection
- [ ] Set up centralized logging (ELK stack, Datadog)
- [ ] Configure distributed tracing
- [ ] Plan database sharding strategy

---

## Backup & Recovery

### Create Backup
```bash
sudo /usr/local/bin/backup-trd-store.sh
```

### Restore from Backup
```bash
# Stop services
sudo systemctl stop trd-store-backend.service

# Restore database
gunzip < /var/backups/trd-store/trd_store_20260427_120000.sql.gz | \
  sudo -u postgres psql trd_store

# Start services
sudo systemctl start trd-store-backend.service
```

---

## Support & Help

### Documentation
- Django: https://docs.djangoproject.com/
- Next.js: https://nextjs.org/docs
- PostgreSQL: https://www.postgresql.org/docs/

### Community
- Django Forum: https://forum.djangoproject.com/
- Next.js Discussions: https://github.com/vercel/next.js/discussions
- Stack Overflow: Tag your questions with django, nextjs, postgresql

### Commercial Support
- DigitalOcean Support
- AWS Support
- Google Cloud Support

---

**Last Updated:** April 2026
**Version:** 1.0
