# CI/CD Setup Guide

Complete guide for setting up continuous integration and deployment pipeline.

## Overview

The CI/CD pipeline automates:
1. **Testing** - Runs on every commit
2. **Building** - Creates Docker image
3. **Security Scanning** - Checks for vulnerabilities
4. **Deployment** - Deploys to production environment
5. **Notifications** - Alerts team of deployment status

## GitHub Actions Workflow

### File Structure

```
.github/
└── workflows/
    ├── deploy.yml          # Production deployment
    ├── test.yml           # Testing on PR
    └── security.yml       # Security scanning
```

### Workflow Steps

```
1. Code Push to main
         ↓
2. Test Job (parallel: 2 tasks)
   ├─ TypeScript compilation
   ├─ Linting
   ├─ Unit tests
   └─ Integration tests
         ↓
3. Build Job (depends on test)
   └─ Build & push Docker image
         ↓
4. Security Scan Job (depends on build)
   ├─ Scan Docker image
   └─ Check dependencies
         ↓
5. Deploy Job (depends on all)
   ├─ Deploy to ECS
   ├─ Wait for stability
   └─ Health check
         ↓
6. Notify Job
   └─ Send Slack notification
```

## GitHub Secrets Setup

Create the following secrets in GitHub:

### AWS Configuration

1. Go to **Settings > Secrets and Variables > Actions**

2. Add these secrets:

```
AWS_REGION
  Value: us-east-1 (or your region)

AWS_ROLE_TO_ASSUME
  Value: arn:aws:iam::ACCOUNT:role/GitHubActionsRole

ECS_CLUSTER_NAME
  Value: disha-cluster

ECS_SERVICE_NAME
  Value: disha-api
```

### Slack Notification

```
SLACK_WEBHOOK_URL
  Value: https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

### Container Registry (optional if using Docker Hub)

```
DOCKER_USERNAME
  Value: your-docker-username

DOCKER_PASSWORD
  Value: your-docker-access-token
```

## AWS IAM Setup

### Create IAM Role for GitHub

1. Go to AWS IAM Console
2. Create new role: `GitHubActionsRole`

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::ACCOUNT:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
          "token.actions.githubusercontent.com:sub": "repo:OWNER/REPO:ref:refs/heads/main"
        }
      }
    }
  ]
}
```

### Attach Policies

Attach this policy to the role:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken",
        "ecr:BatchGetImage",
        "ecr:GetDownloadUrlForLayer",
        "ecr:DescribeRepositories"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ecs:UpdateService",
        "ecs:DescribeServices",
        "ecs:DescribeTaskDefinition"
      ],
      "Resource": "arn:aws:ecs:*:*:service/disha-cluster/*"
    }
  ]
}
```

## Docker Registry Setup

### GitHub Container Registry (Recommended)

No additional setup needed - uses GitHub token automatically.

### DockerHub (Alternative)

1. Create access token at https://hub.docker.com/settings/security
2. Add `DOCKER_USERNAME` and `DOCKER_PASSWORD` to GitHub Secrets
3. Update workflow to use Docker registry

### AWS ECR

1. Create ECR repository:
```bash
aws ecr create-repository \
  --repository-name disha-api \
  --region us-east-1
```

2. Update workflow:
```yaml
- name: Log in to ECR
  uses: aws-actions/amazon-ecr-login@v1
  with:
    mask-password: 'true'
```

## Local Testing

### Test Workflow Locally

Use `act` to test GitHub Actions locally:

```bash
# Install act
brew install act  # macOS
# or: choco install act  # Windows
# or: download from https://github.com/nektos/act

# Run workflow
act push -j test

# Run specific job
act push -j build

# Simulate secrets
act push -s AWS_REGION=us-east-1
```

### Test Docker Build

```bash
# Build locally
docker build -t disha-api:latest ./backend

# Test image
docker run -p 3000:3000 disha-api:latest

# Check health
curl http://localhost:3000/health
```

## Workflow Customization

### Change Trigger Events

```yaml
on:
  push:
    branches:
      - main
      - develop
  pull_request:
    branches:
      - main
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM
```

### Add Approval Step

```yaml
deploy:
  environment:
    name: production
    url: https://api.example.com
  # Requires manual approval before deployment
```

### Add Slack Approval

```yaml
- name: Request approval
  uses: actions/github-script@v6
  with:
    script: |
      const approval = await github.rest.actions.getWorkflowRun({
        owner: context.repo.owner,
        repo: context.repo.repo,
        run_id: context.runId
      });
```

## Troubleshooting

### Workflow Not Triggering

1. Check branch protection rules
2. Verify event trigger conditions
3. Check `.github/workflows/` folder exists
4. Verify YAML syntax

### Build Failure

```bash
# Check logs in GitHub Actions
# Re-run failed job with verbose logging
# Or run locally with act:
act push -v
```

### Deployment Failure

1. Check AWS credentials
2. Verify ECS cluster exists
3. Check service configuration
4. Review CloudWatch logs

### Slack Notification Not Sending

1. Verify webhook URL is correct
2. Check Slack workspace permissions
3. Test webhook manually:
```bash
curl -X POST -H 'Content-type: application/json' \
  --data '{"text":"Test"}' \
  $SLACK_WEBHOOK_URL
```

## Monitoring

### GitHub Actions Dashboard

1. Go to **Actions** tab in repository
2. View workflow runs and logs
3. Check job duration and status

### CloudWatch Logs

```bash
# View ECS deployment logs
aws logs tail /ecs/disha-api --follow

# View specific deployment
aws logs tail /ecs/disha-api --since 1h
```

### Metrics

Monitor these in CloudWatch:

- Deployment frequency (should be multiple times/day)
- Deployment success rate (target: >95%)
- Lead time for changes (target: <24h)
- MTTR (Mean Time To Recovery, target: <1h)

## Best Practices

### Security

1. **Never commit secrets**
   - Use GitHub Secrets for all credentials
   - Add sensitive files to `.gitignore`

2. **Use OIDC for AWS**
   - More secure than access keys
   - Prevents key rotation issues

3. **Scan dependencies**
   - Run `npm audit` in pipeline
   - Use Trivy for image scanning

4. **Review container images**
   - Sign images (if using Docker Content Trust)
   - Keep base images updated

### Performance

1. **Cache dependencies**
   ```yaml
   - uses: actions/setup-node@v3
     with:
       cache: 'npm'
   ```

2. **Use matrix for parallelization**
   ```yaml
   strategy:
     matrix:
       node-version: [18, 20]
   ```

3. **Use build cache**
   ```yaml
   - uses: docker/build-push-action@v4
     with:
       cache-from: type=gha
       cache-to: type=gha,mode=max
   ```

### Reliability

1. **Use stable action versions**
   ```yaml
   - uses: actions/setup-node@v3  # Specific version
   # Not: @main  # Avoid latest
   ```

2. **Implement retry logic**
   ```yaml
   - run: npm run build
     continue-on-error: true
     timeout-minutes: 10
   ```

3. **Add health checks before production**
   ```yaml
   - name: Health check
     run: |
       curl -f https://api.example.com/health || exit 1
   ```

## Scaling to Multiple Environments

### Add Staging

Create `.github/workflows/deploy-staging.yml`:

```yaml
on:
  push:
    branches:
      - develop

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: staging
      url: https://staging-api.example.com
    steps:
      # Deploy to staging environment
```

### Multi-Region Deployment

```yaml
deploy:
  strategy:
    matrix:
      region: [us-east-1, eu-west-1]
    max-parallel: 1  # Deploy one at a time
  steps:
    - name: Deploy to ${{ matrix.region }}
      run: |
        aws ecs update-service \
          --region ${{ matrix.region }} \
          --cluster disha-cluster-${{ matrix.region }} \
          --service disha-api
```

## Maintenance

### Regular Updates

- Update GitHub Actions versions monthly
- Update Node.js version when new LTS released
- Update Docker base image quarterly

### Cleanup

- Archive old workflows
- Remove unused branches regularly
- Clean up old Docker images

```bash
# Remove untagged images (locally)
docker image prune -a --filter "until=720h"

# In ECR
aws ecr describe-images \
  --repository-name disha-api \
  --query 'imageDetails[?imageTags==null].imageId'
```

## Related Documentation

- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment procedures
- [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md) - Pre-deployment checklist
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [AWS ECS Documentation](https://docs.aws.amazon.com/ecs/)
