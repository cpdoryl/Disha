# Disha v2.0 - Production Deployment Guide

**Economy-Focused Deployment on DigitalOcean**  
**Updated:** 2026-07-17 | **Version:** 1.0

---

## 📋 Pre-Deployment Checklist

- [ ] GitHub repository access
- [ ] DigitalOcean account ($5+ credit)
- [ ] Domain name registered
- [ ] SSL certificate plan (Let's Encrypt - free)
- [ ] Database backup strategy defined
- [ ] Monitoring tools selected
- [ ] Team access configured

---

## 🚀 Step 1: Create DigitalOcean Server

### **1.1 Create Droplet**

```
1. Go to DigitalOcean.com
2. Click "Create" → "Droplets"
3. Choose Image: Ubuntu 22.04 LTS
4. Choose Size: Standard - $12/month (2GB RAM, 1vCPU, 50GB SSD)
5. Region: Choose closest to your users
6. Authentication: SSH key (recommended)
7. Hostname: disha-prod-1
8. Click "Create Droplet"

Wait 1-2 minutes for server to boot...
```

### **1.2 Initial Server Setup**

```bash
# SSH into server
ssh root@<your-droplet-ip>

# Update system
apt-get update && apt-get upgrade -y

# Install essential tools
apt-get install -y curl wget git build-essential

# Create non-root user (security best practice)
adduser disha
usermod -aG sudo disha

# Configure sudo for password-less operation
echo "disha ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

# Switch to new user
su - disha
```

---

## 🐳 Step 2: Install Docker & Docker Compose

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker disha

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

---

## 📦 Step 3: Deploy Application

### **3.1 Clone Repository**

```bash
# Create app directory
mkdir -p /home/disha/apps
cd /home/disha/apps

# Clone repo
git clone https://github.com/cpdoryl/Disha.git
cd Disha

# Change ownership
sudo chown -R disha:disha /home/disha/apps
```

### **3.2 Create Production Environment**

```bash
# Create .env.production file
nano .env.production
```

**Add the following (customize for your setup):**

```env
# Application
NODE_ENV=production
LOG_LEVEL=info

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=disha_user
DB_PASSWORD=<STRONG_PASSWORD_HERE>
DB_NAME=disha_prod
DB_SYNC=false

# API
API_URL=https://disha.yourdomain.com
API_PORT=3001
FRONTEND_URL=https://disha.yourdomain.com

# JWT
JWT_SECRET=<GENERATE_STRONG_SECRET>
JWT_EXPIRATION=24h

# Frontend
NEXT_PUBLIC_API_URL=https://disha.yourdomain.com

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=<your-email>
SMTP_PASS=<your-password>

# Sentry (error tracking)
SENTRY_DSN=<get-from-sentry.io>

# Monitoring
PROMETHEUS_ENABLED=true
GRAFANA_PASSWORD=<STRONG_PASSWORD>
```

### **3.3 Generate JWT Secret**

```bash
# Generate a secure random string for JWT
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Save the output to JWT_SECRET in .env.production
```

### **3.4 Create Production Docker Compose**

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:16-alpine
    container_name: disha-db
    restart: always
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/backups:/backups
    environment:
      POSTGRES_DB: disha_prod
      POSTGRES_USER: disha_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    ports:
      - "127.0.0.1:5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U disha_user"]
      interval: 10s
      timeout: 5s
      retries: 5

  # NestJS Backend
  api:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: disha-api
    restart: always
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - ./backend:/app
      - ./logs/api:/app/logs
    environment:
      NODE_ENV: production
      DB_HOST: postgres
      DB_PORT: 5432
      DB_USERNAME: ${DB_USERNAME}
      DB_PASSWORD: ${DB_PASSWORD}
      DB_NAME: ${DB_NAME}
      JWT_SECRET: ${JWT_SECRET}
      API_URL: ${API_URL}
    ports:
      - "127.0.0.1:3001:3001"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/api/v2/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    networks:
      - disha-network

  # Next.js Frontend
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        NEXT_PUBLIC_API_URL: ${NEXT_PUBLIC_API_URL}
    container_name: disha-frontend
    restart: always
    depends_on:
      - api
    environment:
      NEXT_PUBLIC_API_URL: ${NEXT_PUBLIC_API_URL}
      NODE_ENV: production
    ports:
      - "127.0.0.1:3000:3000"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000"]
      interval: 30s
      timeout: 10s
      retries: 3
    networks:
      - disha-network

  # Prometheus Monitoring
  prometheus:
    image: prom/prometheus:latest
    container_name: disha-prometheus
    restart: always
    volumes:
      - ./config/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    ports:
      - "127.0.0.1:9090:9090"
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
    networks:
      - disha-network

  # Grafana Dashboards
  grafana:
    image: grafana/grafana:latest
    container_name: disha-grafana
    restart: always
    volumes:
      - grafana_data:/var/lib/grafana
    environment:
      GF_SECURITY_ADMIN_PASSWORD: ${GRAFANA_PASSWORD}
      GF_USERS_ALLOW_SIGN_UP: "false"
    ports:
      - "127.0.0.1:3002:3000"
    networks:
      - disha-network

volumes:
  postgres_data:
  prometheus_data:
  grafana_data:

networks:
  disha-network:
    driver: bridge
```

---

## 🌐 Step 4: Configure Nginx Reverse Proxy

### **4.1 Install Nginx**

```bash
sudo apt-get install -y nginx certbot python3-certbot-nginx
```

### **4.2 Create Nginx Configuration**

Create `/etc/nginx/sites-available/disha`:

```nginx
upstream api {
    server 127.0.0.1:3001;
}

upstream frontend {
    server 127.0.0.1:3000;
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name disha.yourdomain.com www.disha.yourdomain.com;
    
    location / {
        return 301 https://$host$request_uri;
    }
    
    # Let's Encrypt verification
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
}

# HTTPS Server
server {
    listen 443 ssl http2;
    server_name disha.yourdomain.com www.disha.yourdomain.com;
    
    # SSL Certificates
    ssl_certificate /etc/letsencrypt/live/disha.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/disha.yourdomain.com/privkey.pem;
    
    # SSL Security
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Add security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    gzip_min_length 1000;
    gzip_comp_level 6;
    
    # API Routes
    location /api/ {
        proxy_pass http://api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Rate limiting
        limit_req zone=api burst=20 nodelay;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Static Assets (cached)
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://frontend;
        proxy_cache_valid 200 7d;
        expires 7d;
        add_header Cache-Control "public, immutable";
    }
    
    # Frontend Routes
    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Health Check Endpoints (internal only)
    location ~ ^/(api/health|health) {
        access_log off;
        proxy_pass http://api;
    }
}

# Rate limiting zones
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
```

### **4.3 Enable Nginx Site**

```bash
# Create symlink
sudo ln -s /etc/nginx/sites-available/disha /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Start Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

---

## 🔒 Step 5: Setup SSL Certificate

### **5.1 Generate Let's Encrypt Certificate**

```bash
# Request certificate (replace domain)
sudo certbot certonly --standalone \
  -d disha.yourdomain.com \
  -d www.disha.yourdomain.com \
  --email admin@yourdomain.com \
  --agree-tos \
  --non-interactive

# Verify certificate
sudo certbot certificates
```

### **5.2 Auto-Renewal**

```bash
# Enable auto-renewal
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

# Test renewal
sudo certbot renew --dry-run
```

---

## 🚀 Step 6: Deploy Containers

### **6.1 Start Services**

```bash
cd /home/disha/apps/Disha

# Pull latest code
git pull origin main

# Start all services
docker-compose -f docker-compose.prod.yml up -d

# Verify services are running
docker-compose -f docker-compose.prod.yml ps

# Check logs
docker-compose -f docker-compose.prod.yml logs -f
```

### **6.2 Initialize Database**

```bash
# Run database migrations
docker-compose -f docker-compose.prod.yml exec api npm run typeorm migration:run

# Seed initial data (if available)
docker-compose -f docker-compose.prod.yml exec api npm run typeorm seed:run
```

---

## 💾 Step 7: Setup Database Backups

### **7.1 Create Backup Script**

Create `/home/disha/scripts/backup-db.sh`:

```bash
#!/bin/bash

# Backup configuration
BACKUP_DIR="/backups"
DB_CONTAINER="disha-db"
DB_NAME="disha_prod"
DB_USER="disha_user"
BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/disha_backup_$BACKUP_DATE.sql"
RETENTION_DAYS=30

# Create backup
echo "Starting database backup..."
docker-compose -f docker-compose.prod.yml exec -T postgres pg_dump \
  -U $DB_USER $DB_NAME > $BACKUP_FILE

if [ $? -eq 0 ]; then
  echo "✅ Backup created: $BACKUP_FILE"
  
  # Compress backup
  gzip $BACKUP_FILE
  
  # Upload to DigitalOcean Spaces (optional)
  # aws s3 cp $BACKUP_FILE.gz s3://disha-backups/
  
  # Cleanup old backups
  find $BACKUP_DIR -name "disha_backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete
  
  echo "✅ Backup retention: $RETENTION_DAYS days"
else
  echo "❌ Backup failed!"
  exit 1
fi
```

### **7.2 Schedule Backups**

```bash
# Make script executable
chmod +x /home/disha/scripts/backup-db.sh

# Add to crontab (daily at 2 AM)
crontab -e
```

**Add this line:**
```
0 2 * * * /home/disha/scripts/backup-db.sh >> /var/log/disha-backup.log 2>&1
```

---

## 📊 Step 8: Setup Monitoring

### **8.1 Configure Prometheus**

Create `/home/disha/config/prometheus.yml`:

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  # API Server
  - job_name: 'disha-api'
    static_configs:
      - targets: ['127.0.0.1:3001']
    metrics_path: '/api/v2/metrics'
    
  # Nginx
  - job_name: 'nginx'
    static_configs:
      - targets: ['127.0.0.1:9113']
    
  # PostgreSQL
  - job_name: 'postgres'
    static_configs:
      - targets: ['127.0.0.1:9187']

alerting:
  alertmanagers:
    - static_configs:
        - targets:
            - 'localhost:9093'
```

### **8.2 Access Dashboards**

- **Grafana:** `https://disha.yourdomain.com/grafana` (port 3002)
- **Prometheus:** `https://disha.yourdomain.com/prometheus` (port 9090)
- **Default Credentials:** 
  - Grafana: admin / `<GRAFANA_PASSWORD>`

---

## 🔄 Step 9: CI/CD Setup (GitHub Actions)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Run Tests
        run: |
          npm install
          npm run test
      
      - name: Build Images
        run: |
          docker build -t disha-api ./backend
          docker build -t disha-frontend ./frontend
      
      - name: Deploy to Server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SERVER_SSH_KEY }}
          script: |
            cd /home/disha/apps/Disha
            git pull origin main
            docker-compose -f docker-compose.prod.yml pull
            docker-compose -f docker-compose.prod.yml up -d
            docker-compose -f docker-compose.prod.yml exec -T api npm run typeorm migration:run
```

---

## 🧪 Step 10: Health Checks & Verification

### **10.1 Verify Services**

```bash
# Check all services
docker-compose -f docker-compose.prod.yml ps

# Check API health
curl https://disha.yourdomain.com/api/v2/health

# Check frontend
curl https://disha.yourdomain.com/

# Check logs for errors
docker-compose -f docker-compose.prod.yml logs api | tail -50
docker-compose -f docker-compose.prod.yml logs frontend | tail -50
```

### **10.2 Test SSL Certificate**

```bash
# Test SSL with SSL Labs
# Visit: https://www.ssllabs.com/ssltest/analyze.html?d=disha.yourdomain.com

# Or command line
openssl s_client -connect disha.yourdomain.com:443 -tls1_2
```

---

## 📈 Performance Tuning

### **Database Optimization**

```sql
-- Create indexes for common queries
CREATE INDEX idx_students_school ON students(school_id);
CREATE INDEX idx_assessments_school ON assessments(school_id);
CREATE INDEX idx_attendance_date ON attendance(attendance_date);

-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM students WHERE school_id = 1;
```

### **Nginx Caching**

Add to nginx config:

```nginx
# Cache configuration
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m max_size=1g inactive=60m;

location /api/v2/ {
    # Cache GET requests for 5 minutes
    proxy_cache api_cache;
    proxy_cache_valid 200 5m;
    proxy_cache_valid 404 1m;
    proxy_cache_key "$scheme$request_method$host$request_uri";
    add_header X-Cache-Status $upstream_cache_status;
}
```

---

## 🔒 Security Hardening

### **Firewall Rules**

```bash
# Install UFW
sudo apt-get install ufw

# Enable firewall
sudo ufw enable

# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Deny all other
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Check status
sudo ufw status
```

### **SSH Hardening**

Edit `/etc/ssh/sshd_config`:

```
Port 22
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
Protocol 2
X11Forwarding no
```

Restart SSH:
```bash
sudo systemctl restart sshd
```

---

## 📋 Monitoring Checklist

- [ ] Services starting automatically on reboot
- [ ] SSL certificate auto-renewing
- [ ] Daily backups running
- [ ] Prometheus collecting metrics
- [ ] Grafana dashboards accessible
- [ ] Error alerts configured
- [ ] Disk space monitoring active
- [ ] CPU usage under 80%
- [ ] Memory usage under 85%

---

## 🆘 Troubleshooting

### **Services Not Starting**

```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs

# Restart services
docker-compose -f docker-compose.prod.yml restart

# Rebuild containers
docker-compose -f docker-compose.prod.yml up -d --build
```

### **Database Connection Issues**

```bash
# Test database connection
docker-compose -f docker-compose.prod.yml exec api psql -h postgres -U disha_user disha_prod

# Check PostgreSQL logs
docker-compose -f docker-compose.prod.yml logs postgres
```

### **SSL Certificate Issues**

```bash
# Check certificate status
sudo certbot certificates

# Manually renew
sudo certbot renew --force-renewal

# Check Nginx error log
sudo tail -50 /var/log/nginx/error.log
```

---

## 📞 Support & Escalation

**Level 1 Issues (24-hour response):**
- Minor bugs
- Documentation errors
- Feature requests

**Level 2 Issues (4-hour response):**
- Database connection errors
- API response delays
- Performance degradation

**Level 3 Issues (1-hour response):**
- Service outages
- Data corruption
- Security breaches

---

## ✅ Post-Deployment

1. **Monitor for 24 hours** - Check logs, metrics, errors
2. **Collect feedback** - From pilot users
3. **Performance tune** - Based on real metrics
4. **Document learnings** - Update runbooks
5. **Scale if needed** - Add more resources

---

**Deployment Guide Version:** 1.0  
**Last Updated:** 2026-07-17  
**Next Review:** After pilot launch
