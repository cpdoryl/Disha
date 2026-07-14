# Health Check Implementation Guide

Detailed guide for implementing and maintaining application health checks.

## Overview

Health checks allow monitoring systems and load balancers to detect:
- Application availability and readiness
- Database connectivity
- External service dependencies
- Memory and resource constraints
- API response times

## Implementation

### Basic Health Endpoint

Create a new health controller:

```bash
npm run nx generate @nrwl/nest:controller health --project backend
```

**health.controller.ts:**
```typescript
import { Controller, Get, HttpCode, HttpStatus, Inject } from '@nestjs/common';
import { HealthCheckService, HealthCheck, TypeOrmHealthIndicator, MemoryHealthIndicator } from '@nestjs/terminus';
import { HealthCheckResult } from '@nestjs/terminus';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    private memory: MemoryHealthIndicator,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @HealthCheck()
  check(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.db.pingCheck('database', { timeout: 300 }),
      () => this.memory.checkHeap('memory_heap', 200 * 1024 * 1024), // 200 MB
      () => this.memory.checkRSS('memory_rss', 300 * 1024 * 1024),   // 300 MB
    ]);
  }

  @Get('readiness')
  @HttpCode(HttpStatus.OK)
  async readiness(): Promise<object> {
    const startTime = Date.now();
    
    try {
      // Check database connectivity
      const dbHealthy = await this.isDbHealthy();
      if (!dbHealthy) {
        return {
          status: 'not_ready',
          ready: false,
          message: 'Database not ready',
        };
      }

      return {
        status: 'ready',
        ready: true,
        timestamp: new Date().toISOString(),
        responseTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        status: 'error',
        ready: false,
        message: error.message,
      };
    }
  }

  @Get('liveness')
  @HttpCode(HttpStatus.OK)
  async liveness(): Promise<object> {
    return {
      status: 'alive',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    };
  }

  private async isDbHealthy(): Promise<boolean> {
    try {
      // Simple query to verify connectivity
      await this.db.pingCheck('database', { timeout: 300 });
      return true;
    } catch (error) {
      return false;
    }
  }
}
```

### Register in Module

**app.module.ts:**
```typescript
import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    TerminusModule,
    TypeOrmModule.forRoot({
      // ... configuration
    }),
  ],
  controllers: [HealthController],
})
export class AppModule {}
```

## Health Check Types

### Liveness Probe

**Purpose:** Is the application running?

**Docker Usage:**
```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health/liveness', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"
```

**Kubernetes Usage:**
```yaml
livenessProbe:
  httpGet:
    path: /health/liveness
    port: 3000
  initialDelaySeconds: 30
  periodSeconds: 10
  timeoutSeconds: 3
  failureThreshold: 3
```

### Readiness Probe

**Purpose:** Is the application ready to accept traffic?

**Kubernetes Usage:**
```yaml
readinessProbe:
  httpGet:
    path: /health/readiness
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 5
  timeoutSeconds: 3
  failureThreshold: 2
```

### Startup Probe

**Purpose:** Has the application finished starting up?

**Kubernetes Usage:**
```yaml
startupProbe:
  httpGet:
    path: /health
    port: 3000
  initialDelaySeconds: 0
  periodSeconds: 10
  timeoutSeconds: 3
  failureThreshold: 30  # 30 * 10 = 300 seconds max startup
```

## Response Formats

### Successful Health Check

```json
{
  "status": "ok",
  "checks": {
    "database": {
      "status": "up"
    },
    "memory_heap": {
      "status": "up",
      "message": "Heap memory is 45MB"
    },
    "memory_rss": {
      "status": "up",
      "message": "RSS memory is 120MB"
    }
  },
  "timestamp": "2026-07-14T10:30:00.000Z",
  "uptime": 3600
}
```

### Database Unavailable

```json
{
  "status": "error",
  "error": {
    "database": {
      "status": "down",
      "message": "Connection timeout"
    }
  }
}
```

### Memory Threshold Exceeded

```json
{
  "status": "degraded",
  "error": {
    "memory_heap": {
      "status": "down",
      "message": "Heap memory exceeded 200MB limit: 210MB"
    }
  }
}
```

### Not Ready (Starting)

```json
{
  "status": "not_ready",
  "ready": false,
  "message": "Initializing database connections"
}
```

## Testing Health Checks

### Manual Testing

```bash
# Test liveness
curl -i http://localhost:3000/health/liveness

# Test readiness
curl -i http://localhost:3000/health/readiness

# Test full health check
curl -i http://localhost:3000/health
```

### Load Balancer Testing

```bash
# Simulate load balancer health check (10 concurrent)
for i in {1..10}; do
  curl -s http://localhost:3000/health/readiness | jq '.' &
done
wait
```

### Stress Testing

```bash
# Monitor health check during high load
watch -n 1 'curl -s http://localhost:3000/health | jq ".checks"'

# Run high load test
npm run load-test  # (if available)
```

## Monitoring

### Prometheus Integration

Export metrics from health endpoint:

```typescript
import { register, Counter, Histogram, Gauge } from 'prom-client';

@Get('metrics')
metrics() {
  return register.metrics();
}
```

### Log Health Status

```typescript
@Get('readiness')
async readiness(@Req() request, @Res() response) {
  const result = await this.getReadinessStatus();
  
  if (result.ready) {
    this.logger.debug('Service ready');
    response.status(200).json(result);
  } else {
    this.logger.warn('Service not ready', result);
    response.status(503).json(result);
  }
}
```

### Alert on Failures

```typescript
// In monitoring system
if (healthCheck.status === 'error') {
  alerting.send({
    severity: 'critical',
    title: 'Health check failed',
    message: `Service ${service} is unhealthy`,
  });
}
```

## Docker Configuration

### Dockerfile Health Check

```dockerfile
FROM node:20-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install --only=production

COPY . .
RUN npm run build

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health/readiness', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

EXPOSE 3000
CMD ["node", "dist/main.js"]
```

### Docker Compose Health Check

```yaml
services:
  api:
    image: disha-api:latest
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health/readiness"]
      interval: 30s
      timeout: 3s
      retries: 3
      start_period: 10s
    depends_on:
      postgres:
        condition: service_healthy
```

## Kubernetes Configuration

### Full Probe Configuration

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: disha-api
spec:
  template:
    spec:
      containers:
      - name: api
        image: disha-api:latest
        ports:
        - containerPort: 3000

        # Startup: Wait for app to initialize
        startupProbe:
          httpGet:
            path: /health/readiness
            port: 3000
          periodSeconds: 10
          failureThreshold: 30  # Max 5 minutes

        # Readiness: App ready for traffic
        readinessProbe:
          httpGet:
            path: /health/readiness
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 2

        # Liveness: App still running
        livenessProbe:
          httpGet:
            path: /health/liveness
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 3
          failureThreshold: 3
```

## Best Practices

### Do ✅

1. **Include all critical dependencies**
   ```typescript
   // Include database, cache, external services
   await this.health.check([
     () => this.db.pingCheck('database'),
     () => this.redis.pingCheck('cache'),
     () => this.stripe.checkHealth(),
   ]);
   ```

2. **Set realistic timeouts**
   ```typescript
   timeout: 300,  // 300ms - fast feedback
   ```

3. **Return appropriate status codes**
   ```typescript
   // 200 OK - healthy
   // 503 Service Unavailable - not ready
   // 500 Internal Server Error - degraded
   ```

4. **Keep health checks fast**
   - Avoid complex operations
   - Use connection pools for database checks
   - Cache results if needed

5. **Monitor health check failures**
   ```typescript
   if (healthStatus.error) {
     this.logger.error('Health check failed', healthStatus);
   }
   ```

### Don't ❌

1. **Don't make blocking calls**
   ```typescript
   // ❌ Bad - blocks event loop
   fs.readFileSync('/config.json');
   
   // ✅ Good - non-blocking
   await fs.readFile('/config.json');
   ```

2. **Don't create new connections**
   ```typescript
   // ❌ Bad - creates new DB connection each check
   new Database().query('SELECT 1');
   
   // ✅ Good - reuse existing pool
   await this.db.pingCheck('database');
   ```

3. **Don't expose sensitive information**
   ```typescript
   // ❌ Bad - exposes database credentials
   { database: 'postgres://user:password@host/db' }
   
   // ✅ Good - only status
   { database: 'up' }
   ```

4. **Don't make the health check too strict**
   ```typescript
   // ❌ Bad - fails if any dependency times out
   
   // ✅ Good - fails only on critical services
   if (database.down) return 503;  // Critical
   if (cache.down) return 200;     // Non-critical
   ```

## Performance Monitoring

### Track Response Time

```typescript
@Get('metrics')
async metrics(): Promise<object> {
  const checks = {
    database: await this.measureDb(),
    cache: await this.measureCache(),
    memory: await this.measureMemory(),
  };

  return {
    status: 'ok',
    checks,
    timestamp: new Date().toISOString(),
  };
}

private async measureDb(): Promise<object> {
  const start = Date.now();
  try {
    await this.db.pingCheck('database', { timeout: 300 });
    return { 
      status: 'up',
      responseTime: Date.now() - start 
    };
  } catch (error) {
    return { 
      status: 'down',
      responseTime: Date.now() - start,
      error: error.message 
    };
  }
}
```

### Log Metrics

```bash
# Every 60 seconds, log health metrics
curl -s http://localhost:3000/health/metrics | jq '.checks | map(select(.responseTime > 100))'
```

## Troubleshooting

### Health Check Timeout

**Problem:** Health check hangs or times out

**Solution:**
```typescript
// Add explicit timeout
@Get('health')
@Timeout(5000)  // 5 second timeout
async health() {
  return this.getHealth();
}
```

### Database Connection Pool Exhausted

**Problem:** Health checks fail with "connection pool exhausted"

**Solution:**
```typescript
// Use separate health check connection
const healthDb = new DataSource({
  ...config,
  extra: {
    max: 2,  // Small pool for health checks
  },
});
```

### High Latency

**Problem:** Health checks are slow (>200ms)

**Solution:**
```typescript
// Cache health status
private cachedHealth: any = null;
private cacheTime = 0;

@Get('health')
async health() {
  const now = Date.now();
  
  // Return cached result if fresh (<5 seconds)
  if (this.cachedHealth && now - this.cacheTime < 5000) {
    return this.cachedHealth;
  }

  this.cachedHealth = await this.checkHealth();
  this.cacheTime = now;
  return this.cachedHealth;
}
```

## Deployment Checklist

- [ ] Health check endpoint implemented
- [ ] Liveness probe configured
- [ ] Readiness probe configured
- [ ] Startup probe configured (Kubernetes)
- [ ] Database connectivity checked
- [ ] Response times monitored
- [ ] Timeouts configured appropriately
- [ ] Status codes follow HTTP standards
- [ ] Sensitive data not exposed
- [ ] Health checks tested under load
- [ ] Monitoring/alerting configured
- [ ] Documentation up to date
