# Staging CI/CD Integration Guide

Integrate staging deployment with GitHub Actions CI/CD pipeline.

## Automated Staging Deployment Workflow

### Create Staging Deployment Workflow

Create `.github/workflows/deploy-staging.yml`:

```yaml
name: Deploy to Staging

on:
  push:
    branches:
      - develop
  workflow_dispatch:

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}-staging

jobs:
  test:
    name: Test
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: test_user
          POSTGRES_PASSWORD: test_pass
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        working-directory: ./backend
        run: npm ci

      - name: Build
        working-directory: ./backend
        run: npm run build

      - name: Run tests
        working-directory: ./backend
        env:
          DB_HOST: localhost
          DB_PORT: 5432
          DB_USERNAME: test_user
          DB_PASSWORD: test_pass
          DB_NAME: test_db
          NODE_ENV: testing
        run: npm run test:integration

  build:
    name: Build Docker Image
    runs-on: ubuntu-latest
    needs: test
    permissions:
      contents: read
      packages: write

    steps:
      - uses: actions/checkout@v3

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2

      - name: Log in to Container Registry
        uses: docker/login-action@v2
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v4
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=sha,prefix=staging-
            type=raw,value=staging-latest

      - name: Build and push Docker image
        uses: docker/build-push-action@v4
        with:
          context: ./backend
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy-staging:
    name: Deploy to Staging
    runs-on: ubuntu-latest
    needs: build
    environment:
      name: staging
      url: https://staging-api.example.com/health

    steps:
      - uses: actions/checkout@v3

      - name: Deploy to Staging Server
        env:
          STAGING_HOST: ${{ secrets.STAGING_HOST }}
          STAGING_USER: ${{ secrets.STAGING_USER }}
          STAGING_KEY: ${{ secrets.STAGING_SSH_KEY }}
        run: |
          mkdir -p ~/.ssh
          echo "$STAGING_KEY" > ~/.ssh/staging_key
          chmod 600 ~/.ssh/staging_key
          
          ssh -i ~/.ssh/staging_key -o StrictHostKeyChecking=no \
            $STAGING_USER@$STAGING_HOST << 'EOF'
            
          cd /home/$STAGING_USER/disha
          
          # Pull latest code
          git pull origin develop
          
          # Update environment
          cp .env.staging .env.staging.local
          
          # Pull latest images
          docker-compose -f docker-compose.staging.yml pull
          
          # Start services
          docker-compose -f docker-compose.staging.yml up -d
          
          # Run migrations
          docker-compose -f docker-compose.staging.yml exec -T api-staging npm run migration:run
          
          # Verify deployment
          sleep 10
          curl -f http://localhost:3000/health/ready || exit 1
          
          EOF

      - name: Verify Health Checks
        run: |
          for i in {1..30}; do
            if curl -s -f http://staging-api.example.com/health/ready > /dev/null; then
              echo "✅ Staging deployment healthy"
              exit 0
            fi
            echo "Waiting for staging to be ready... ($i/30)"
            sleep 2
          done
          echo "❌ Staging deployment failed health check"
          exit 1

      - name: Run Smoke Tests
        run: |
          npm run test:integration -- --testNamePattern="Smoke" || true

      - name: Notify Slack
        if: always()
        uses: slackapi/slack-github-action@v1
        with:
          webhook-url: ${{ secrets.SLACK_WEBHOOK_URL }}
          payload: |
            {
              "blocks": [
                {
                  "type": "header",
                  "text": {
                    "type": "plain_text",
                    "text": "${{ job.status == 'success' && '✅ Staging Deployment Successful' || '❌ Staging Deployment Failed' }}"
                  }
                },
                {
                  "type": "section",
                  "fields": [
                    {
                      "type": "mrkdwn",
                      "text": "*Repository:*\n${{ github.repository }}"
                    },
                    {
                      "type": "mrkdwn",
                      "text": "*Branch:*\n${{ github.ref_name }}"
                    },
                    {
                      "type": "mrkdwn",
                      "text": "*Author:*\n${{ github.actor }}"
                    },
                    {
                      "type": "mrkdwn",
                      "text": "*Status:*\n${{ job.status }}"
                    }
                  ]
                },
                {
                  "type": "actions",
                  "elements": [
                    {
                      "type": "button",
                      "text": {
                        "type": "plain_text",
                        "text": "View Deployment"
                      },
                      "url": "${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}"
                    },
                    {
                      "type": "button",
                      "text": {
                        "type": "plain_text",
                        "text": "View Staging"
                      },
                      "url": "https://staging-api.example.com/health"
                    }
                  ]
                }
              ]
            }
```

## GitHub Secrets Configuration

Add these secrets to your GitHub repository:

**Settings > Secrets and variables > Actions**

```
STAGING_HOST
  Value: your-staging-server.com

STAGING_USER
  Value: deploy_user

STAGING_SSH_KEY
  Value: (contents of private SSH key)

SLACK_WEBHOOK_URL
  Value: https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

## Staging Server Setup

### 1. Create Deploy User

```bash
# On staging server
sudo useradd -m -s /bin/bash deploy_user
sudo usermod -aG docker deploy_user

# Create SSH key pair
ssh-keygen -t rsa -b 4096 -f ~/.ssh/github_deploy_key -N ""

# Add public key to GitHub as deploy key
cat ~/.ssh/github_deploy_key.pub
# Go to: Settings > Deploy keys > Add new deploy key
```

### 2. Setup Staging Directory

```bash
# On staging server
sudo mkdir -p /home/deploy_user/disha
sudo chown deploy_user:deploy_user /home/deploy_user/disha

# As deploy_user
cd /home/deploy_user/disha
git clone git@github.com:your-org/disha.git .

# Copy environment file
cp .env.staging .env.staging.local
nano .env.staging.local  # Update passwords
```

### 3. Create Cron Jobs for Maintenance

```bash
# As deploy_user, create crontab entries
crontab -e

# Daily database backup at 2 AM
0 2 * * * docker-compose -f /home/deploy_user/disha/docker-compose.staging.yml exec -T postgres-staging pg_dump -U staging_user disha_staging_db > /home/deploy_user/backups/backup-$(date +\%Y\%m\%d).sql

# Weekly cleanup at 3 AM Sunday
0 3 * * 0 docker image prune -a -f && docker volume prune -f

# Daily health check report at 9 AM
0 9 * * * curl -s https://staging-api.example.com/health/metrics | jq '.api' >> /var/log/staging-health.log
```

## Monitoring Staging Deployments

### View Deployment Status

```bash
# GitHub Actions
# Settings > Actions > Deployments

# Manual deployment
gh deployment create staging \
  --ref develop \
  --environment staging \
  --description "Manual staging deployment"
```

### Metrics & Alerts

**Grafana Dashboard:**
- URL: https://staging-api.example.com:3001
- Default credentials: Check .env.staging.local

**Prometheus:**
- URL: https://staging-api.example.com:9090

**Health Endpoints:**
```bash
# Overall health
curl https://staging-api.example.com/health

# Detailed metrics
curl https://staging-api.example.com/health/metrics | jq '.api'

# Database status
curl https://staging-api.example.com/health/metrics | jq '.database'
```

## Staging Deployment Best Practices

### 1. Automated Testing Before Deployment

✅ Unit tests
✅ Integration tests  
✅ RBAC verification
✅ Health check validation

### 2. Gradual Rollout

```bash
# Deploy to one container first
docker-compose -f docker-compose.staging.yml up -d api-staging

# Verify health
curl -f https://staging-api.example.com/health/ready

# Monitor for 5 minutes
watch -n 5 'curl -s https://staging-api.example.com/health/metrics | jq ".api"'

# If all good, proceed
```

### 3. Continuous Monitoring

```bash
# Set up alerts for:
- Error rate > 1%
- Response time p95 > 500ms
- Memory usage > 85%
- Database unavailable
- Health check failures
```

### 4. Regular Health Check Verification

```bash
#!/bin/bash
# Run daily health check verification

echo "Staging Health Check - $(date)"
curl -s https://staging-api.example.com/health/ready | jq .

# Alert if not ready
if ! curl -s -f https://staging-api.example.com/health/ready > /dev/null; then
  echo "ALERT: Staging not ready!" | mail -s "Staging Alert" ops@example.com
fi
```

## Rollback on Failure

### Automatic Rollback

If health check fails, automatically rollback:

```yaml
  - name: Rollback on Failure
    if: failure()
    run: |
      ssh -i ~/.ssh/staging_key $STAGING_USER@$STAGING_HOST << 'EOF'
      
      cd /home/$STAGING_USER/disha
      
      # Get previous image tag
      CURRENT_TAG=$(docker images | grep disha-staging-api | awk '{print $2}' | head -1)
      PREVIOUS_TAG=$(echo "$CURRENT_TAG" | sed 's/-latest//' | sed 's/-[0-9]*/-previous/')
      
      # Rollback
      docker-compose -f docker-compose.staging.yml down
      docker image tag $CURRENT_TAG $PREVIOUS_TAG
      docker-compose -f docker-compose.staging.yml up -d
      
      # Verify
      curl -f http://localhost:3000/health/ready || exit 1
      
      EOF
```

## Staging Deployment Checklist

### Pre-Deployment
- [ ] All tests passing
- [ ] No TypeScript errors
- [ ] Code reviewed
- [ ] Environment variables configured
- [ ] SSL certificates current

### During Deployment
- [ ] Build completes successfully
- [ ] Services start without errors
- [ ] Migrations complete
- [ ] Health checks passing
- [ ] Metrics flowing to Prometheus
- [ ] Grafana dashboards updating

### Post-Deployment
- [ ] API responding to requests
- [ ] Error rate < 0.1%
- [ ] Response times normal
- [ ] Memory usage stable
- [ ] All health probes green
- [ ] Team notified via Slack

## Useful Commands

```bash
# SSH to staging server
ssh -i ~/.ssh/staging_key deploy_user@staging.example.com

# View logs
docker-compose -f docker-compose.staging.yml logs -f api-staging

# Check status
docker-compose -f docker-compose.staging.yml ps

# Test endpoint
curl https://staging-api.example.com/api/v2/schools \
  -H "Authorization: Bearer YOUR_TOKEN"

# View metrics
watch 'curl -s https://staging-api.example.com/health/metrics | jq ".api"'

# Restart specific service
docker-compose -f docker-compose.staging.yml restart api-staging

# Pull latest code
git pull origin develop

# Run migrations
docker-compose -f docker-compose.staging.yml exec api-staging npm run migration:run
```

## Troubleshooting CI/CD

### Deployment Fails at Build

```bash
# Check logs
docker logs $(docker ps -q -f "ancestor=ghcr.io/...")

# Verify Node version
node --version

# Clear npm cache
npm cache clean --force
```

### Health Check Fails After Deploy

```bash
# SSH to staging server
ssh deploy_user@staging.example.com

# Check if database is ready
docker-compose exec postgres-staging pg_isready -U staging_user

# View API logs
docker-compose logs api-staging | tail -50

# Check memory
docker stats disha-staging-api
```

### Migrations Fail

```bash
# Check migration status
docker-compose exec api-staging npm run migration:show

# Rollback migration
docker-compose exec api-staging npm run migration:revert

# Re-run migrations
docker-compose exec api-staging npm run migration:run
```

## Related Documentation

- [STAGING_DEPLOYMENT.md](./STAGING_DEPLOYMENT.md) - Manual deployment guide
- [CI/CD_SETUP.md](./CI_CD_SETUP.md) - Production CI/CD
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Full deployment guide
