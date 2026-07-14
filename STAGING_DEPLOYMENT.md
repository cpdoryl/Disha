# Staging Deployment Guide - Disha v2.0

Complete guide for deploying Disha to a staging environment with monitoring, health checks, and CI/CD integration.

## Table of Contents

1. [Staging Environment Setup](#staging-environment-setup)
2. [Pre-Deployment Verification](#pre-deployment-verification)
3. [Deployment Process](#deployment-process)
4. [Health Check Verification](#health-check-verification)
5. [Monitoring & Alerting](#monitoring--alerting)
6. [Troubleshooting](#troubleshooting)
7. [Rollback Procedure](#rollback-procedure)

## Staging Environment Setup

### Prerequisites

- Docker 20.10+ and Docker Compose 1.29+
- 4GB+ RAM available
- 20GB+ disk space
- Ubuntu 20.04 LTS or similar (Linux server)
- Domain/subdomain for staging (optional, can use localhost)

### Server Specifications (Recommended)

```
Staging Server:
- CPU: 2 cores minimum
- Memory: 4GB minimum (8GB recommended)
- Storage: 50GB SSD
- Network: 100 Mbps connection
- OS: Ubuntu 20.04 LTS or CentOS 8+
```

### Installation

#### 1. Install Docker and Docker Compose

```bash
# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

#### 2. Clone Repository

```bash
# Clone repo
git clone https://github.com/your-org/disha.git
cd disha

# Verify staging files exist
ls -la docker-compose.staging.yml
ls -la .env.staging
```

#### 3. Configure Environment

```bash
# Copy staging environment file
cp .env.staging .env.staging.local

# Edit with your values
nano .env.staging.local

# Important settings to customize:
# - DB_PASSWORD: Strong password for PostgreSQL
# - JWT_SECRET: Random 32+ character string
# - CORS_ORIGIN: Your staging domain
# - GRAFANA_PASSWORD: Admin password
# - SLACK_WEBHOOK_URL: For alerts (optional)
```

#### 4. Create Required Directories

```bash
# Monitoring configuration
mkdir -p monitoring

# Create Prometheus configuration
cat > monitoring/prometheus-staging.yml << 'EOF'
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'disha-api'
    static_configs:
      - targets: ['api-staging:3000']
    metrics_path: '/health/metrics'
    scrape_interval: 30s
    
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']
EOF

# Create Grafana datasource configuration
cat > monitoring/grafana-datasources.yml << 'EOF'
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus-staging:9090
    isDefault: true
    editable: true
EOF

# Create dashboards directory
mkdir -p monitoring/grafana-dashboards
```

## Pre-Deployment Verification

### Build Verification

```bash
# Check if backend builds successfully
cd backend
npm run build
npm run type-check

# Expected output:
# ✅ Build successful
# ✅ No TypeScript errors

# Check Docker image build
docker build -t disha-api:staging ./backend

# Expected:
# ✅ Successfully built image with tag disha-api:staging
```

### Configuration Verification

```bash
# Verify environment file
cat .env.staging.local | grep -E "^[A-Z_]+=" | head -10

# Verify files exist
test -f docker-compose.staging.yml && echo "✅ docker-compose.staging.yml exists"
test -f nginx-staging.conf && echo "✅ nginx-staging.conf exists"
test -f monitoring/prometheus-staging.yml && echo "✅ prometheus-staging.yml exists"
```

### Database Preparation

```bash
# Create migration script (if needed)
cd backend

# Run migrations locally to verify
npm run migration:run

# Expected: Migrations run successfully
```

## Deployment Process

### Step 1: Start Staging Services

```bash
# Navigate to project root
cd /path/to/disha

# Start all staging services
docker-compose -f docker-compose.staging.yml up -d

# Expected output:
# Creating disha-staging-postgres ... done
# Creating disha-staging-api ... done
# Creating disha-staging-nginx ... done
# Creating disha-staging-prometheus ... done
# Creating disha-staging-grafana ... done
# Creating disha-staging-redis ... done (if --profile with-cache enabled)
```

### Step 2: Verify Services Started

```bash
# Check container status
docker-compose -f docker-compose.staging.yml ps

# Expected output:
# NAME                    STATUS              PORTS
# disha-staging-postgres  Up 2 minutes        5432/tcp
# disha-staging-api       Up 1 minute         3000/tcp
# disha-staging-nginx     Up 1 minute         80/tcp, 443/tcp
# disha-staging-prometheus Up 1 minute        9090/tcp
# disha-staging-grafana   Up 1 minute         3001/tcp
```

### Step 3: Run Database Migrations

```bash
# Run migrations inside container
docker-compose -f docker-compose.staging.yml exec api-staging npm run migration:run

# Seed initial data (optional)
docker-compose -f docker-compose.staging.yml exec api-staging npm run seed:db

# Expected:
# ✅ Migrations completed
# ✅ Database seeded with test data
```

### Step 4: Verify API is Running

```bash
# Check API logs
docker-compose -f docker-compose.staging.yml logs api-staging --tail 20

# Expected: "Disha API Server Started"
```

### Step 5: Verify Health Checks

```bash
# Check health endpoint
curl -s http://localhost:3000/health | jq .

# Expected: 200 OK with health status
curl -s http://localhost:3000/health/ready | jq .

# Expected: 200 OK with ready status
curl -s http://localhost:3000/health/metrics | jq '.api'

# Expected: API metrics with request counts
```

## Health Check Verification

### Test All Health Probes

```bash
#!/bin/bash

echo "Testing Disha Staging Health Checks..."
echo ""

# Liveness probe
echo "1. Liveness Probe (/health/live)"
curl -s http://localhost:3000/health/live | jq . || echo "❌ Failed"

# Readiness probe
echo ""
echo "2. Readiness Probe (/health/ready)"
curl -s http://localhost:3000/health/ready | jq . || echo "❌ Failed"

# Startup probe
echo ""
echo "3. Startup Probe (/health/startup)"
curl -s http://localhost:3000/health/startup | jq . || echo "❌ Failed"

# Metrics
echo ""
echo "4. Metrics (/health/metrics)"
curl -s http://localhost:3000/health/metrics | jq '.api' || echo "❌ Failed"

# Deep check
echo ""
echo "5. Deep Check (/health/deep)"
curl -s http://localhost:3000/health/deep | jq '.checks' || echo "❌ Failed"

echo ""
echo "✅ All health checks completed"
```

Save as `verify-health-checks.sh` and run:
```bash
chmod +x verify-health-checks.sh
./verify-health-checks.sh
```

### Expected Results

All endpoints should return:
- ✅ HTTP 200 for healthy checks
- ✅ Status fields populated correctly
- ✅ Timestamp present and valid
- ✅ Uptime > 0 seconds
- ✅ Database connectivity confirmed
- ✅ Memory usage reported

## Monitoring & Alerting

### Access Monitoring Dashboards

**Prometheus (Metrics & Alerts)**
```
URL: http://localhost:9090
Purpose: Raw metrics and alerting rules
```

**Grafana (Dashboards)**
```
URL: http://localhost:3001
Username: admin
Password: (from .env.staging.local)

Default Dashboards:
- API Health Overview
- Request Performance
- Database Metrics
- System Resources
```

### Configure Alert Rules

Create `monitoring/prometheus-alerts.yml`:

```yaml
groups:
  - name: disha_api
    interval: 30s
    rules:
      # Alert if API is down
      - alert: DishAPIDown
        expr: up{job="disha-api"} == 0
        for: 5m
        annotations:
          summary: "Disha API is down"
          description: "API has been down for 5 minutes"

      # Alert if error rate too high
      - alert: HighErrorRate
        expr: |
          (
            rate(http_requests_total{status=~"5.."}[5m]) /
            rate(http_requests_total[5m])
          ) > 0.05
        for: 5m
        annotations:
          summary: "High error rate detected"
          description: "Error rate is above 5%"

      # Alert if memory usage high
      - alert: HighMemoryUsage
        expr: heap_usage_percent > 85
        for: 10m
        annotations:
          summary: "High memory usage"
          description: "Heap usage is above 85%"

      # Alert if database slow
      - alert: SlowDatabase
        expr: db_response_time_ms > 500
        for: 5m
        annotations:
          summary: "Database queries slow"
          description: "Database response time is above 500ms"
```

### Setup Slack Alerts

```bash
# Get Slack webhook URL
# 1. Go to https://api.slack.com/apps
# 2. Create new app or select existing
# 3. Enable Incoming Webhooks
# 4. Create webhook for your channel
# 5. Copy webhook URL

# Update .env.staging.local
nano .env.staging.local
# Set: SLACK_WEBHOOK_URL=https://hooks.slack.com/...

# Restart containers
docker-compose -f docker-compose.staging.yml restart api-staging
```

### Test Alert Integration

```bash
# Make API request to trigger metrics
for i in {1..100}; do
  curl -s http://localhost:3000/api/v2/schools >/dev/null 2>&1 &
done

# Wait for metrics to accumulate
sleep 30

# Check Prometheus for metrics
curl -s 'http://localhost:9090/api/v1/query?query=up{job="disha-api"}' | jq .

# Check Grafana dashboard
# Navigate to http://localhost:3001
# View "API Health" dashboard
```

## Performance Testing

### Load Test Endpoints

```bash
# Install Apache Bench (if not installed)
sudo apt-get install apache2-utils

# Test health endpoint (baseline, should be fast)
ab -n 100 -c 10 http://localhost:3000/health

# Test API endpoint
ab -n 100 -c 10 http://localhost:3000/api/v2/schools

# View results:
# - Requests per second: Should be >100
# - Mean time per request: Should be <100ms
# - Failed requests: Should be 0
```

### Monitor Performance

```bash
# Watch real-time metrics
watch -n 5 'curl -s http://localhost:3000/health/metrics | jq "{requests: .api.requestCount, errors: .api.errorCount, latency: .api.averageResponseTime}"'

# Check memory over time
watch -n 5 'curl -s http://localhost:3000/health/metrics | jq ".memory"'
```

## Troubleshooting

### Issue: Database Connection Failed

```bash
# Check PostgreSQL logs
docker-compose -f docker-compose.staging.yml logs postgres-staging

# Test database connectivity
docker-compose -f docker-compose.staging.yml exec api-staging psql -U staging_user -h postgres-staging -d disha_staging_db -c "SELECT 1"

# Verify network
docker network ls | grep staging
docker network inspect disha-staging-network
```

### Issue: API Won't Start

```bash
# Check API logs
docker-compose -f docker-compose.staging.yml logs api-staging --tail 50

# Check health
curl -v http://localhost:3000/health

# Restart API service
docker-compose -f docker-compose.staging.yml restart api-staging
```

### Issue: Health Check Failing

```bash
# Check database connectivity
curl http://localhost:3000/health/ready | jq '.checks.database'

# Check memory
curl http://localhost:3000/health/metrics | jq '.memory'

# Check database directly
docker-compose -f docker-compose.staging.yml exec postgres-staging pg_isready -U staging_user
```

### Issue: High Memory Usage

```bash
# Check current memory
curl http://localhost:3000/health/metrics | jq '.memory'

# Restart API with more memory
docker-compose -f docker-compose.staging.yml stop api-staging
docker-compose -f docker-compose.staging.yml up -d api-staging

# Monitor memory growth
watch -n 5 'curl -s http://localhost:3000/health/metrics | jq ".memory.percentage"'
```

### Issue: Slow Response Times

```bash
# Check response times
curl http://localhost:3000/health/metrics | jq '.api | {avg: .averageResponseTime, p95: .p95ResponseTime, p99: .p99ResponseTime}'

# Check database response time
curl http://localhost:3000/health/metrics | jq '.database'

# Check if rate limiting is active
curl -H "Authorization: Bearer invalid" http://localhost:3000/api/v2/schools

# View Grafana dashboards for trends
# http://localhost:3001
```

## Rollback Procedure

### Quick Rollback

```bash
# Stop staging services
docker-compose -f docker-compose.staging.yml stop

# Restart with previous version (if available)
docker-compose -f docker-compose.staging.yml up -d

# Verify health
curl -s http://localhost:3000/health | jq .status
```

### Database Rollback

```bash
# If migrations failed, rollback
docker-compose -f docker-compose.staging.yml exec api-staging npm run migration:revert

# Verify database state
docker-compose -f docker-compose.staging.yml exec postgres-staging psql -U staging_user -d disha_staging_db -c "SELECT * FROM migrations"
```

### Full Cleanup and Reset

```bash
# Stop all services
docker-compose -f docker-compose.staging.yml down

# Remove volumes (WARNING: Deletes all data)
docker-compose -f docker-compose.staging.yml down -v

# Restart fresh
docker-compose -f docker-compose.staging.yml up -d

# Re-run migrations and seed
docker-compose -f docker-compose.staging.yml exec api-staging npm run migration:run
docker-compose -f docker-compose.staging.yml exec api-staging npm run seed:db
```

## Maintenance

### Regular Tasks

```bash
# View logs
docker-compose -f docker-compose.staging.yml logs -f api-staging

# Update containers
docker-compose -f docker-compose.staging.yml pull
docker-compose -f docker-compose.staging.yml up -d

# Clean up old images
docker image prune -a

# Monitor disk space
df -h
du -sh docker_volumes/

# Backup database
docker-compose -f docker-compose.staging.yml exec postgres-staging pg_dump -U staging_user disha_staging_db > backup-$(date +%Y%m%d-%H%M%S).sql
```

### Weekly Checklist

- [ ] Check error rates in Grafana
- [ ] Review response time trends
- [ ] Check database size and growth
- [ ] Review storage usage
- [ ] Check for failed health checks
- [ ] Update dependencies
- [ ] Review security logs

### Monthly Tasks

- [ ] Full disaster recovery drill
- [ ] Database optimization (VACUUM, ANALYZE)
- [ ] Update base Docker images
- [ ] Review and update monitoring rules
- [ ] Capacity planning review
- [ ] Security updates

## Staging Deployment Checklist

### Pre-Deployment
- [ ] Backend builds successfully
- [ ] All tests passing
- [ ] No TypeScript errors
- [ ] Code reviewed and approved
- [ ] Environment file configured
- [ ] Database backups taken

### Deployment
- [ ] Services starting successfully
- [ ] All containers healthy
- [ ] Database migrations completed
- [ ] Health checks passing
- [ ] API responding to requests
- [ ] Monitoring active

### Post-Deployment
- [ ] Error rate < 0.1%
- [ ] Response times normal
- [ ] Database stable
- [ ] Memory usage acceptable
- [ ] All probes passing
- [ ] Monitoring dashboards visible

## Support & Monitoring

**Monitoring URL:** http://your-staging-domain/docs
**Metrics URL:** http://your-staging-domain/health/metrics
**Grafana URL:** http://your-staging-domain:3001

For issues or questions, check:
1. Docker logs: `docker-compose -f docker-compose.staging.yml logs`
2. Health checks: `curl http://localhost:3000/health/ready`
3. Grafana dashboards: http://localhost:3001
4. Prometheus alerts: http://localhost:9090

## Related Documentation

- [DEPLOYMENT.md](./DEPLOYMENT.md) - Production deployment guide
- [TESTING_GUIDE.md](./TESTING_GUIDE.md) - Integration testing
- [HEALTH_CHECK.md](./backend/HEALTH_CHECK.md) - Health probe details
