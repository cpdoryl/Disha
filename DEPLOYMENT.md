# Disha v2.0 Deployment Guide

Complete deployment guide for Disha API backend - from local development to production.

## Table of Contents

1. [Local Development](#local-development)
2. [Docker Deployment](#docker-deployment)
3. [Environment Configuration](#environment-configuration)
4. [Database Setup](#database-setup)
5. [Production Deployment](#production-deployment)
6. [Monitoring & Logging](#monitoring--logging)
7. [Health Checks](#health-checks)
8. [Troubleshooting](#troubleshooting)

## Local Development

### Prerequisites

- Node.js 18+ (v20 recommended)
- npm 9+
- PostgreSQL 14+ (local or via Docker)
- Git

### Quick Start

```bash
# Clone repository
git clone https://github.com/cpdoryl/Disha.git
cd Disha/backend

# Install dependencies
npm install

# Create .env.local from template
cp .env.example .env.local

# Update .env.local with your values
nano .env.local

# Run database migrations
npm run migration:run

# Seed database with test data (optional)
npm run seed:db

# Start development server
npm run start:dev

# Server runs at http://localhost:3000
# API docs at http://localhost:3000/docs
```

### Development Commands

```bash
# Start in watch mode
npm run start:dev

# Build for production
npm run build

# Run tests
npm run test
npm run test:integration
npm run test:e2e

# Check types
npm run type-check

# Lint code
npm run lint

# Format code
npm run format
```

## Docker Deployment

### Docker Compose (Recommended for Local Dev)

```bash
# Start all services
docker-compose up -d

# Start with cache layer
docker-compose --profile with-cache up -d

# View logs
docker-compose logs -f api

# Stop services
docker-compose down

# Clean up volumes
docker-compose down -v
```

### Docker Build

```bash
# Build image
docker build -t disha-api:latest ./backend

# Run container
docker run -d \
  --name disha-api \
  -p 3000:3000 \
  -e DB_HOST=postgres \
  -e DB_PASSWORD=postgres \
  -e JWT_SECRET=your-secret \
  disha-api:latest

# View logs
docker logs -f disha-api

# Stop container
docker stop disha-api
docker rm disha-api
```

### Docker Compose File Structure

The `docker-compose.yml` includes:

**Services:**
- **postgres**: PostgreSQL 16 database
- **api**: Disha backend service
- **redis**: Optional Redis cache layer

**Features:**
- Health checks on all services
- Named volumes for persistence
- Docker network isolation
- Environment variable support

## Environment Configuration

### Configuration Hierarchy

Environment variables are loaded in this order:
1. `.env.local` (local overrides, not committed)
2. `.env.{NODE_ENV}` (environment-specific)
3. `.env` (default)

### Development Environment

```bash
# .env.local
NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=disha_db
JWT_SECRET=dev-secret-key
LOG_LEVEL=debug
```

### Production Environment

```bash
# .env.production
NODE_ENV=production
PORT=3000
DB_HOST=prod-postgres.example.com
DB_PORT=5432
DB_USERNAME=disha_prod
DB_PASSWORD=${SECURE_PASSWORD}
DB_NAME=disha_production
JWT_SECRET=${SECURE_JWT_SECRET}
LOG_LEVEL=info
CORS_ORIGIN=https://app.example.com
```

### Security Best Practices

1. **Never commit `.env.local`** - Add to `.gitignore`
2. **Use environment variables for secrets** - Never hardcode
3. **Rotate secrets regularly** - Change JWT_SECRET, DB passwords
4. **Use strong passwords** - 32+ character minimum
5. **Enable HTTPS in production** - Use reverse proxy (Nginx, CloudFlare)
6. **Restrict CORS origins** - Only allow your frontend domain

## Database Setup

### Local Setup

```bash
# Create database
createdb -U postgres -h localhost disha_db

# Run migrations
npm run migration:run

# Seed test data
npm run seed:db

# Verify setup
psql -U postgres -h localhost -d disha_db -c "SELECT * FROM schools LIMIT 1;"
```

### Docker Setup

```bash
# Database starts automatically with docker-compose
docker-compose up postgres

# Run migrations
docker-compose exec api npm run migration:run

# Seed database
docker-compose exec api npm run seed:db

# Access database
docker-compose exec postgres psql -U postgres -d disha_db
```

### Production Setup

```bash
# 1. Create managed database (RDS, CloudSQL, etc.)
# 2. Create database and user
psql -U postgres -h prod-db.example.com -c "CREATE DATABASE disha_production;"
psql -U postgres -h prod-db.example.com -c "CREATE USER disha_prod WITH PASSWORD 'strong-password';"
psql -U postgres -h prod-db.example.com -c "GRANT ALL PRIVILEGES ON DATABASE disha_production TO disha_prod;"

# 3. Run migrations
DB_HOST=prod-db.example.com DB_USERNAME=disha_prod DB_PASSWORD=... npm run migration:run

# 4. Seed initial data (optional)
npm run seed:db
```

## Production Deployment

### Recommended Architecture

```
┌─────────────────────┐
│   CloudFlare DNS    │
└──────────┬──────────┘
           │
┌──────────▼──────────┐
│   Load Balancer     │
│   (AWS ELB/ALB)     │
└──────────┬──────────┘
           │
    ┌──────┴──────┐
    │             │
┌───▼──┐    ┌────▼──┐
│ API 1│    │ API 2 │  (Auto-scaling group)
├──────┤    ├───────┤
│ Pod 1│    │ Pod 2 │
└──┬───┘    └───┬───┘
   │            │
   └──────┬─────┘
          │
   ┌──────▼──────┐
   │  PostgreSQL │  (RDS/managed)
   │   Primary   │
   ├─────────────┤
   │   Replica   │  (Read-only)
   └─────────────┘
```

### Kubernetes Deployment

```yaml
# disha-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: disha-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: disha-api
  template:
    metadata:
      labels:
        app: disha-api
    spec:
      containers:
      - name: api
        image: gcr.io/project/disha-api:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DB_HOST
          valueFrom:
            configMapKeyRef:
              name: disha-config
              key: db-host
        resources:
          requests:
            cpu: "500m"
            memory: "512Mi"
          limits:
            cpu: "1000m"
            memory: "1024Mi"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: disha-api-service
spec:
  selector:
    app: disha-api
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: LoadBalancer
```

### AWS ECS Deployment

```bash
# 1. Build and push image to ECR
aws ecr get-login-password | docker login --username AWS --password-stdin $ECR_REGISTRY
docker build -t disha-api:latest ./backend
docker tag disha-api:latest $ECR_REGISTRY/disha-api:latest
docker push $ECR_REGISTRY/disha-api:latest

# 2. Create ECS task definition
aws ecs register-task-definition --cli-input-json file://disha-task-definition.json

# 3. Create/update ECS service
aws ecs create-service \
  --cluster disha-cluster \
  --service-name disha-api \
  --task-definition disha-api:1 \
  --desired-count 3 \
  --load-balancers targetGroupArn=arn:aws:...,containerName=api,containerPort=3000

# 4. Monitor deployment
aws ecs describe-services --cluster disha-cluster --services disha-api
```

## Monitoring & Logging

### Application Logs

```bash
# View logs in development
npm run start:dev  # logs to console

# View logs in production
docker logs -f disha-api
docker-compose logs -f api

# Structured logging (if implemented)
# Logs are JSON formatted for easier parsing
cat docker-compose.logs | jq '.level, .message'
```

### Metrics Collection

```bash
# Health check endpoint
curl http://localhost:3000/health

# Response:
# {
#   "status": "ok",
#   "timestamp": "2026-07-14T10:30:00Z",
#   "uptime": 3600,
#   "database": "connected",
#   "memory": "85%"
# }
```

### Monitoring Dashboard

Recommended tools:
- **Prometheus** + **Grafana** for metrics
- **ELK Stack** for logs
- **Datadog** for APM
- **CloudWatch** for AWS environments

## Health Checks

### Docker Health Check

Automatically included in Dockerfile:

```bash
# Manual health check
curl -s http://localhost:3000/health

# Expected response: 200 OK with health status
```

### Kubernetes Health Checks

```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 3000
  initialDelaySeconds: 30
  periodSeconds: 10
  timeoutSeconds: 3
  failureThreshold: 3

readinessProbe:
  httpGet:
    path: /health
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 5
```

## Deployment Checklist

### Pre-Deployment

- [ ] Code reviewed and approved
- [ ] All tests passing (unit, integration, e2e)
- [ ] No TypeScript errors (`npm run type-check`)
- [ ] No linting errors (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] .env.production configured
- [ ] Database backups taken
- [ ] Secrets stored in secure manager (not in repo)
- [ ] Rate limiting configured appropriately
- [ ] Compression verified enabled
- [ ] CORS origins configured correctly

### Deployment

- [ ] Database migrations run successfully
- [ ] API starts without errors
- [ ] Health check endpoint responds
- [ ] All endpoints accessible
- [ ] JWT authentication working
- [ ] Rate limiting enforced
- [ ] Compression active
- [ ] Logs flowing to monitoring system

### Post-Deployment

- [ ] Monitor error rates (should be <0.1%)
- [ ] Check response times (p95 <200ms)
- [ ] Verify database connections stable
- [ ] Monitor resource usage (CPU <70%, Memory <80%)
- [ ] Test critical user flows
- [ ] Verify alerts are firing properly
- [ ] Check external service integrations
- [ ] Monitor for security issues

## Troubleshooting

### Database Connection Failed

```bash
# Test connection
psql -U $DB_USERNAME -h $DB_HOST -d $DB_NAME -c "SELECT 1;"

# Check environment variables
docker-compose exec api env | grep DB_

# Verify service is running
docker-compose ps postgres
```

### Service Won't Start

```bash
# Check logs
docker-compose logs api

# Verify health check
docker-compose exec api curl http://localhost:3000/health

# Check file permissions
docker-compose exec api ls -la dist/
```

### High Memory Usage

```bash
# Monitor memory
docker stats disha-api

# Check for memory leaks
docker-compose exec api node --max_old_space_size=1024 dist/main.js

# Restart service
docker-compose restart api
```

### Database Corruption

```bash
# Backup database
pg_dump -U postgres -h localhost disha_db > backup.sql

# Restore from backup
psql -U postgres -h localhost disha_db < backup.sql

# Reindex tables
REINDEX DATABASE disha_db;
```

## Production Hardening

1. **Enable HTTPS**
   ```nginx
   server {
     listen 443 ssl http2;
     ssl_certificate /etc/ssl/cert.pem;
     ssl_certificate_key /etc/ssl/key.pem;
     proxy_pass http://api:3000;
   }
   ```

2. **Enable WAF** (Web Application Firewall)
   - ModSecurity with OWASP CRS
   - Rate limiting (already in place)
   - IP whitelisting if needed

3. **Database Hardening**
   - Enable encrypted connections
   - Restrict IP access
   - Enable audit logging
   - Regular backups with encryption

4. **Secrets Management**
   - Use AWS Secrets Manager / Azure Key Vault
   - Rotate secrets quarterly
   - Never log sensitive data

5. **Monitoring & Alerting**
   - Alert on error rate > 1%
   - Alert on response time p95 > 500ms
   - Alert on CPU > 80%, Memory > 85%
   - Alert on database connection pool exhaustion

## Support

For deployment issues:
1. Check logs: `docker-compose logs -f api`
2. Verify health: `curl http://localhost:3000/health`
3. Check database: `docker-compose exec postgres psql -U postgres -d disha_db -c "SELECT 1;"`
4. Review [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for common issues
