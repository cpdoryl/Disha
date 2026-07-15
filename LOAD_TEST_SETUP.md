# Load Testing Setup - Immediate Solution

## Current Status

✅ **Working Components:**
- PostgreSQL database (running, healthy, accessible)
- Nginx reverse proxy (now fixed and running)
- Docker environment fully configured
- Docker Compose orchestration working

⚠️ **Issue to Work Around:**
- API container has persistent database connection issue (Docker networking on Windows)
- **Solution:** Run backend API locally instead of in Docker

---

## Quick Start - Load Testing in 5 Minutes

### Option 1: Run Backend Locally (Recommended - Fastest)

**Step 1: Start PostgreSQL in Docker (already running)**

```powershell
# Verify it's running
docker ps | findstr postgres
```

**Step 2: Start Backend API Locally**

```powershell
cd C:\Disha\temp_repo\backend

# Install dependencies (if not already done)
npm install

# Build the project
npm run build

# Start the API
npm start
```

The API will connect to `localhost:5432` (PostgreSQL in Docker) and run on `http://localhost:3000`.

**Step 3: Verify API is Ready**

```powershell
# In a new PowerShell window
curl -s http://localhost:3000/health | ConvertFrom-Json
```

Expected response:
```
status
------
ok
```

**Step 4: Run Load Tests**

```powershell
# Baseline test (30 seconds, 50 concurrent users)
wrk -t4 -c50 -d30s --latency http://localhost:3000/health

# Progressive test
wrk -t2 -c10 -d60s --latency http://localhost:3000/health    # 10 users
Start-Sleep -Seconds 10
wrk -t4 -c100 -d60s --latency http://localhost:3000/health   # 100 users
Start-Sleep -Seconds 10
wrk -t8 -c500 -d60s --latency http://localhost:3000/health   # 500 users
```

---

## Option 2: Fix Docker API Connection (Advanced)

If you prefer using Docker for the API, the issue is likely in the NestJS TypeORM configuration. To debug:

```powershell
# Check if the app can see the database at all
docker exec disha-staging-api curl -v telnet://postgres-staging:5432 2>&1

# Check environment variables in container
docker exec disha-staging-api env | findstr DB_

# Check if pg node module is installed
docker exec disha-staging-api npm list pg
```

Common fixes:
1. Restart the API container: `docker restart disha-staging-api`
2. Check database is fully initialized: `docker logs disha-staging-postgres`
3. Increase connection timeout in app config

---

## Performance Expectations

### Baseline (50 concurrent users on /health)
- **Target:** >1000 req/sec, <100ms latency
- **API:** Should be excellent (lightweight health check)

### Progressive Load (10 → 500 users)
- **10 users:** >2000 req/s, <50ms
- **100 users:** >1000 req/s, <100ms  
- **500 users:** >400 req/s, <200ms

### Rate Limiting Tests
- **Login endpoint:** 5 requests per 15 minutes (should get 429 on 6th)
- **API endpoint:** 100 requests per 15 minutes (should get 429 on 101st)

---

## Monitoring During Load Tests

**Terminal 1:** Run load tests
```powershell
wrk -t4 -c50 -d30s --latency http://localhost:3000/health
```

**Terminal 2:** Monitor in real-time
```powershell
$interval = 2
while ($true) {
    Clear-Host
    Write-Host "=== Load Test Monitor ===" -ForegroundColor Cyan
    $metrics = curl -s http://localhost:3000/health/metrics | ConvertFrom-Json
    Write-Host "Requests: $($metrics.api.requestCount)"
    Write-Host "Errors: $($metrics.api.errorCount)"
    Write-Host "Error Rate: $($metrics.api.errorRate)"
    Write-Host "Avg Latency: $($metrics.api.averageResponseTime)ms"
    Write-Host "P99 Latency: $($metrics.api.p99ResponseTime)ms"
    Write-Host "Memory: $($metrics.memory.percentage)%`n"
    Start-Sleep -Seconds $interval
}
```

---

## SSL/HTTPS Setup (Optional - For Production)

### Generate Self-Signed Certificate for Staging

```bash
# Create certificates directory
mkdir -p ./certificates

# Generate self-signed certificate (valid for 365 days)
openssl req -x509 -newkey rsa:4096 -keyout ./certificates/key.pem \
  -out ./certificates/cert.pem -days 365 -nodes \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=staging.local"
```

### Update docker-compose.staging.yml

```yaml
nginx-staging:
  volumes:
    - ./nginx-staging.conf:/etc/nginx/conf.d/default.conf:ro
    - ./certificates/cert.pem:/etc/ssl/certs/cert.pem:ro
    - ./certificates/key.pem:/etc/ssl/private/key.pem:ro
```

### Update nginx-staging.conf

```nginx
server {
    listen 443 ssl http2;
    server_name staging.local;
    
    ssl_certificate /etc/ssl/certs/cert.pem;
    ssl_certificate_key /etc/ssl/private/key.pem;
    
    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # Your existing upstream and location blocks...
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name staging.local;
    return 301 https://$server_name$request_uri;
}
```

### Restart nginx

```powershell
docker restart disha-staging-nginx
```

### Test HTTPS

```powershell
# Allow self-signed certificate
curl -k https://localhost/health
```

---

## Load Testing Checklist

- [ ] Backend API running (local or Docker)
- [ ] `wrk` installed and accessible
- [ ] PostgreSQL database accessible
- [ ] Health endpoint responds: `curl http://localhost:3000/health`
- [ ] Terminal 1: Ready for load test commands
- [ ] Terminal 2: Ready for monitoring dashboard
- [ ] Expected baseline: >500 req/s on /health endpoint
- [ ] No errors during baseline test
- [ ] Memory stable (not continuously growing)

---

## Recommended Test Sequence

**Total time: ~65 minutes**

1. **Baseline (5 min)** - Establish performance baseline at 50 users
2. **Monitor Setup (5 min)** - Open monitoring dashboard in Terminal 2
3. **Progressive Test (30 min)** - Run 6 stages from 10 to 1000 users
4. **Rate Limiting (5 min)** - Verify rate limits work correctly
5. **Results Analysis (15 min)** - Review metrics and identify bottlenecks
6. **Optimization (if needed)** - Re-test after improvements

---

## Troubleshooting

### "wrk: command not found"
```powershell
choco install wrk -y
# Or add to PATH: C:\Program Files\wrk\
```

### "Unable to connect to localhost:3000"
```powershell
# Verify API is running
curl http://localhost:3000/health

# Check process
Get-Process node

# View logs
npm start  # (run in terminal to see logs)
```

### "Too many open files"
```powershell
# This is Linux/WSL. For Windows, usually not an issue.
# If using WSL: ulimit -n 65536
```

### "Error rate >1%"
- Check database performance: `docker logs disha-staging-postgres`
- Check API memory: `curl http://localhost:3000/health/metrics`
- Check if rate limiting is triggering
- Review slow queries

---

## Success Criteria

✅ **All tests passed if:**
- Baseline: >500 req/s, <100ms average latency
- Progressive: Completes all 6 stages without crashing
- Rate Limiting: 429 responses at expected thresholds
- Memory: Stable, doesn't continuously grow
- Error Rate: <0.1% throughout normal load
- System: API recovers quickly after load test

---

**You're ready to load test! Start with Option 1 (local backend) for fastest setup.** 🚀
