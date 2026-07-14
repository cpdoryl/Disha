# Load Testing Execution Guide

Step-by-step guide to run actual load tests on Disha staging environment.

## Pre-Test Checklist

### 1. Verify Staging Environment is Running

```bash
# Check if all services are running
docker-compose -f docker-compose.staging.yml ps

# Expected output:
# NAME                    STATUS
# disha-staging-postgres  Up
# disha-staging-api       Up
# disha-staging-nginx     Up
# disha-staging-prometheus Up
# disha-staging-grafana   Up
```

### 2. Verify Health Checks Pass

```bash
# Quick health verification
./scripts/verify-staging-deployment.sh

# All 10 checks should pass:
# ✅ Docker installed
# ✅ Docker Compose installed
# ✅ All containers running
# ✅ Health endpoints responding
# ✅ Database connected
# ✅ API response quality good
# ✅ Memory status healthy
# ✅ Monitoring accessible
# ✅ Network connectivity OK
# ✅ Disk space available
```

### 3. Install wrk (if not already installed)

```bash
# macOS
brew install wrk

# Ubuntu/Debian
sudo apt-get install wrk

# Verify installation
wrk --version
```

### 4. Increase System Limits (for high concurrency testing)

```bash
# Increase file descriptor limit
ulimit -n 65536

# Verify
ulimit -n

# For permanent change, add to ~/.bashrc or ~/.zshrc:
# ulimit -n 65536
```

## Test Execution Plan

### Phase 1: Baseline Performance (5 minutes)

Establish baseline metrics for healthy system.

```bash
# Run baseline test
./scripts/load-test-baseline.sh

# This will test:
# 1. Health endpoint
# 2. Liveness probe
# 3. Readiness probe
# 4. Startup probe
# 5. Metrics endpoint
# 6. Deep health check

# Each test runs for 30 seconds with 50 concurrent users
# Total time: ~5 minutes
```

**What to watch for:**
- All endpoints should return HTTP 200
- Throughput should be >500 req/s
- Latency should be <100ms average
- Zero errors expected

**Expected Baseline Results:**

```
Health Check:        2000+ req/s, <50ms
Readiness Probe:     1000+ req/s, <100ms
Metrics Endpoint:    800+ req/s, <80ms
Deep Check:          500+ req/s, <150ms
```

### Phase 2: Real-Time Monitoring Setup

In a **separate terminal**, start monitoring dashboard:

```bash
# Terminal 2: Start monitoring
./scripts/monitor-load-test.sh

# This shows:
# - API health status
# - Request counts and error rate
# - Response time percentiles
# - Memory usage with visual bar
# - Database status
# - Container CPU/memory
# - Updates every 2 seconds
```

### Phase 3: Progressive Load Test (30 minutes)

Run stress test with gradually increasing load.

```bash
# Terminal 1: Run progressive load test
./scripts/load-test-progressive.sh

# Stages:
# Stage 1: 10 users (1 min)   - Baseline
# Stage 2: 50 users (1 min)   - Light load
# Stage 3: 100 users (1 min)  - Moderate load
# Stage 4: 200 users (1 min)  - Heavy load
# Stage 5: 500 users (1 min)  - Stress test
# Stage 6: 1000 users (1 min) - Peak load

# Total: 30 minutes
```

**Monitor in Terminal 2 for:**
- Memory growth (should plateau, not continuously increase)
- Error rate (should stay at 0% until capacity is exceeded)
- Response time increases (expected as load increases)
- Database latency (should stay <50ms)
- CPU usage (should stay <80%)

### Phase 4: Rate Limiting Verification (5 minutes)

```bash
# Terminal 1 (after progressive test completes)
./scripts/test-rate-limiting.sh

# Tests:
# 1. Login rate limit (5 per 15 min)
# 2. API endpoint rate limit (100 per 15 min)
# 3. Response headers
# 4. Rate limit persistence
```

**Expected Results:**
- Login: 5 successful, then 429 on 6th
- API: 100 successful, then 429 on 101st
- Headers: X-RateLimit-* present
- Retry-After: Present on 429 responses

## Detailed Step-by-Step Execution

### Start Staging (if not already running)

```bash
cd /path/to/disha

# Start all services
docker-compose -f docker-compose.staging.yml up -d

# Wait for services to be healthy
sleep 30

# Verify
docker-compose -f docker-compose.staging.yml ps
```

### Terminal 1: Run Tests

```bash
# Make scripts executable (if not already)
chmod +x scripts/*.sh

# Test 1: Baseline (5 min)
echo "=== Starting Baseline Test ==="
./scripts/load-test-baseline.sh

# Output will show:
# - Test results for each endpoint
# - Summary table with metrics
# - Results saved to load-test-results-YYYYMMDD-HHMMSS/
```

### Terminal 2: Real-Time Monitoring

```bash
# Open new terminal while baseline test runs
# This can be opened immediately after starting baseline test

./scripts/monitor-load-test.sh

# Shows live dashboard that updates every 2 seconds
# Key metrics to watch:
# - Error Rate: Should stay 0%
# - Avg Response Time: Should stay <100ms
# - Memory %: Should stay <70%
# - P99 Latency: Should stay <200ms
```

### Continue with Progressive Test

```bash
# Terminal 1: After baseline completes, run progressive test
echo "=== Starting Progressive Load Test ==="
./scripts/load-test-progressive.sh

# This runs for 30+ minutes
# Terminal 2 continues monitoring throughout
```

### Analyze Results

```bash
# After all tests complete
# Results are saved in timestamped directories:

ls -la load-test-results-*
ls -la load-test-progressive-*

# View specific test result
cat load-test-results-YYYYMMDD-HHMMSS/1-health.txt

# Extract key metrics
grep "Req/Sec" load-test-results-*/1-health.txt
grep "Latency Distribution" load-test-results-*/1-health.txt
```

## Interpreting Results

### Performance Metrics

**Requests/sec (Throughput):**
```
Good:       >1000 req/s at baseline
Acceptable: 500-1000 req/s at moderate load
Poor:       <500 req/s or degrading
```

**Latency (Response Time):**
```
Excellent:  <50ms average
Good:       50-100ms average
Acceptable: 100-200ms average
Poor:       >200ms average
```

**Latency Distribution (Percentiles):**
```
p50:        50% of requests
p95:        95% of requests (should be <200ms)
p99:        99% of requests (should be <300ms at normal load)
Max:        Worst-case request (spikes expected)
```

**Error Rate:**
```
Excellent:  0% errors
Good:       <0.1% errors
Acceptable: 0.1-1% errors
Poor:       >1% errors
```

### Memory Analysis

**Memory Usage Progression:**
```
Stage 1 (10 users):    ~200-250MB
Stage 2 (50 users):    ~250-300MB
Stage 3 (100 users):   ~300-350MB
Stage 4 (200 users):   ~350-400MB
Stage 5 (500 users):   ~400-450MB
Stage 6 (1000 users):  ~450-500MB

Sign of Problem: Continuous growth (possible memory leak)
Healthy: Plateaus and stays stable
```

### CPU Usage

**Expected CPU Usage:**
```
Baseline (10 users):   10-20%
Light (50 users):      20-30%
Moderate (100 users):  30-40%
Heavy (200 users):     40-50%
Stress (500 users):    50-70%
Peak (1000 users):     70-90%

Warning: >90% CPU means approaching capacity
```

## Performance Report Template

Create a file `load-test-report.md`:

```markdown
# Load Test Report - [DATE]

## Test Configuration
- Duration: 30 minutes
- Stages: 6 stages (10 → 1000 users)
- Endpoint tested: Health check
- Database: PostgreSQL (staging)

## Results Summary

### Stage Breakdown

| Stage | Users | Req/sec | Avg Latency | p99 Latency | Status |
|-------|-------|---------|-------------|-------------|--------|
| 1     | 10    | 2000+   | <50ms       | <100ms      | ✅     |
| 2     | 50    | 1500+   | 50-70ms     | 100-150ms   | ✅     |
| 3     | 100   | 1000+   | 70-100ms    | 150-200ms   | ✅     |
| 4     | 200   | 700+    | 100-150ms   | 200-300ms   | ✅/⚠️  |
| 5     | 500   | 400+    | 150-200ms   | 300-400ms   | ⚠️     |
| 6     | 1000  | 200+    | 200-300ms   | 400-500ms   | ⚠️     |

## Resource Utilization

### Memory
- Min: [X]MB
- Max: [X]MB
- Status: [Stable/Growing]

### CPU
- Min: [X]%
- Max: [X]%
- Status: [Normal/High]

### Database
- Max connections: [X]
- Avg query time: [X]ms
- Status: [Healthy/Slow]

## Bottlenecks Identified

1. [Specific bottleneck]
   - Impact: [High/Medium/Low]
   - Recommendation: [Action]

2. [Specific bottleneck]
   - Impact: [High/Medium/Low]
   - Recommendation: [Action]

## Rate Limiting Verification

- Login limit (5/15min): ✅ Verified
- API limit (100/15min): ✅ Verified
- Headers present: ✅ Yes
- 429 responses: ✅ Working

## Conclusions

[Summary of findings]

## Recommendations for Next Phase

1. [Priority 1]
2. [Priority 2]
3. [Priority 3]
```

## Common Issues & Solutions

### Issue: "wrk: command not found"

**Solution:**
```bash
# macOS
brew install wrk

# Ubuntu/Debian
sudo apt-get update && sudo apt-get install wrk

# Or download from GitHub
cd /tmp
wget https://github.com/wg/wrk/releases/download/4.2.0/wrk-4.2.0-linux-x86_64.tar.gz
tar xf wrk-4.2.0-linux-x86_64.tar.gz
sudo mv wrk /usr/local/bin/
```

### Issue: "Too many open files" error

**Solution:**
```bash
# Increase file descriptor limit
ulimit -n 65536

# Verify
ulimit -n

# For permanent change, add to ~/.bashrc:
echo "ulimit -n 65536" >> ~/.bashrc
source ~/.bashrc
```

### Issue: API returns 503 during tests

**Solution:**
```bash
# Check if database is healthy
docker-compose -f docker-compose.staging.yml exec postgres-staging pg_isready -U staging_user

# Check API logs
docker-compose -f docker-compose.staging.yml logs api-staging --tail 50

# Restart services if needed
docker-compose -f docker-compose.staging.yml restart api-staging
```

### Issue: Memory keeps growing during test

**Possible Memory Leak:**
```bash
# Check heap size
curl -s http://localhost:3000/health/metrics | jq '.memory'

# Monitor over time
for i in {1..10}; do
  echo "$(date): $(curl -s http://localhost:3000/health/metrics | jq '.memory.heapUsed')"
  sleep 10
done

# If continuously growing, suspect memory leak
```

## Success Criteria

✅ **Baseline Test Passes:**
- All 6 health endpoints respond with HTTP 200
- Throughput >500 req/s
- Latency <100ms average
- Zero errors

✅ **Progressive Test Completes:**
- Survives all 6 load stages
- No system crashes
- Memory plateaus (doesn't leak)
- Error rate stays <1%

✅ **Rate Limiting Works:**
- Login endpoint limits after 5 requests
- API endpoint limits after 100 requests
- 429 responses sent correctly
- Headers present

✅ **System Remains Healthy:**
- CPU doesn't exceed 90%
- Memory doesn't exceed 500MB
- Database latency stays <100ms
- No connection pool exhaustion

## Next Steps After Testing

1. **If all tests pass:**
   - Document results
   - Plan optimization if latency is high
   - Proceed to production deployment

2. **If bottlenecks found:**
   - Identify root cause
   - Implement optimizations
   - Re-test to verify improvement

3. **If rate limiting issues:**
   - Adjust thresholds in rate-limits.config.ts
   - Re-deploy and re-test

## Expected Timeline

| Phase | Duration | Action |
|-------|----------|--------|
| Pre-test | 10 min | Verify environment, install tools |
| Baseline | 5 min | Establish baseline metrics |
| Monitoring | Continuous | Monitor during all tests |
| Progressive | 30 min | Stress test with increasing load |
| Rate Limit Test | 5 min | Verify rate limiting works |
| Analysis | 15 min | Review results and create report |
| **Total** | **~65 minutes** | Complete load testing |

## Monitoring During Tests

**Grafana Dashboard Access:**
```
URL: http://localhost:3001
Username: admin
Password: (from .env.staging.local)
```

**Prometheus Queries:**
```
# Request rate per second
rate(http_requests_total[1m])

# Error rate
rate(http_errors_total[1m])

# P95 latency
histogram_quantile(0.95, http_request_duration_seconds)

# Memory usage
heap_usage_percent
```

## Performance Targets for Production

After load testing and optimization, aim for:

- **Throughput:** >1000 req/s
- **Latency (avg):** <50ms
- **Latency (p99):** <200ms
- **Error rate:** <0.1%
- **Memory:** Stable <500MB
- **CPU:** <80% at normal load
- **Availability:** 99.95%

## Key Learnings

After load test completes, document:

1. **Maximum safe capacity:** X concurrent users
2. **Performance inflection point:** Latency increases significantly at X users
3. **Bottleneck:** [Database/Memory/CPU/Network]
4. **Optimization needed:** [Yes/No]
5. **Ready for production:** [Yes/No]

---

**Good luck with your load testing! 🚀**
