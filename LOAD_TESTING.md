# Load Testing Guide - Disha v2.0

Complete guide for stress testing the Disha API, verifying rate limiting, and identifying bottlenecks.

## Table of Contents

1. [Prerequisites & Setup](#prerequisites--setup)
2. [Load Testing Tools](#load-testing-tools)
3. [Test Scenarios](#test-scenarios)
4. [Baseline Performance](#baseline-performance)
5. [Running Load Tests](#running-load-tests)
6. [Performance Monitoring](#performance-monitoring)
7. [Results Analysis](#results-analysis)
8. [Bottleneck Identification](#bottleneck-identification)
9. [Rate Limiting Verification](#rate-limiting-verification)
10. [Performance Optimization](#performance-optimization)

## Prerequisites & Setup

### Required Tools

```bash
# Install wrk (HTTP benchmarking tool)
# macOS
brew install wrk

# Ubuntu/Debian
sudo apt-get install wrk

# Or download from: https://github.com/wg/wrk/releases

# Verify installation
wrk --version
```

### Optional Tools (Enhanced Monitoring)

```bash
# Apache Bench (ab) - simpler tool
sudo apt-get install apache2-utils

# hey - Go-based benchmarking tool
go get -u github.com/rakyll/hey

# k6 - Modern load testing platform (optional)
# https://k6.io/docs/getting-started/installation/
```

### System Preparation

```bash
# Increase file descriptor limit (for high concurrency)
ulimit -n 65536

# Check current limit
ulimit -n

# For permanent change, edit /etc/security/limits.conf
# session required pam_limits.so

# Verify system can handle connections
cat /proc/sys/net/core/somaxconn
# If < 1024, increase: sysctl -w net.core.somaxconn=65536
```

## Load Testing Tools

### 1. wrk (Recommended)

**Advantages:**
- Lightweight and fast
- Supports Lua scripting
- Multiple threads and connections
- JSON output available
- Accurate latency measurements

**Basic Usage:**
```bash
wrk -t12 -c400 -d30s http://localhost:3000/health
# -t: number of threads
# -c: number of concurrent connections
# -d: test duration
```

### 2. Apache Bench (ab)

**Advantages:**
- Simple and available everywhere
- Good for basic testing
- Percentage-based results

**Usage:**
```bash
ab -n 1000 -c 100 http://localhost:3000/health
# -n: total requests
# -c: concurrent requests
```

### 3. hey

**Advantages:**
- Go-based (fast)
- Histogram output
- Simple to use

**Usage:**
```bash
hey -n 1000 -c 100 http://localhost:3000/health
```

## Test Scenarios

### Scenario 1: Health Check Endpoint (Baseline)

**Purpose:** Establish baseline performance for lightweight endpoint

```bash
wrk -t4 -c50 -d30s http://localhost:3000/health
```

**Expected Results:**
- Latency: <50ms avg, <100ms p99
- Throughput: >2000 req/s
- Error rate: 0%

### Scenario 2: Readiness Probe (Database Query)

**Purpose:** Measure performance with database dependency

```bash
wrk -t4 -c50 -d30s http://localhost:3000/health/ready
```

**Expected Results:**
- Latency: <100ms avg, <200ms p99
- Throughput: >1000 req/s
- Error rate: 0%

### Scenario 3: API Endpoint with RBAC

**Purpose:** Test real API endpoints with authentication

```bash
# First, get a valid token
TOKEN=$(curl -s -X POST http://localhost:3000/api/v2/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"teacher1@school.edu","password":"teacher123"}' | jq -r '.accessToken')

# Test with token
wrk -t4 -c50 -d30s \
  -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/v2/schools
```

**Expected Results:**
- Latency: 50-100ms avg, 200-300ms p99
- Throughput: 500-1000 req/s
- Error rate: 0%

### Scenario 4: Mixed Workload

**Purpose:** Simulate realistic traffic pattern

Create `load-test-mixed.lua`:

```lua
-- Mixed workload: 60% reads, 30% list, 10% creates

request = function()
  local rand = math.random()
  
  if rand < 0.6 then
    -- 60% GET specific endpoint
    return wrk.format("GET", "/api/v2/schools/school-1")
  elseif rand < 0.9 then
    -- 30% list endpoint
    return wrk.format("GET", "/api/v2/schools?page=1&limit=10")
  else
    -- 10% POST (note: may fail with 403 if no create permission)
    return wrk.format("POST", "/api/v2/schools", '{"name":"test"}')
  end
end
```

Run:
```bash
wrk -t4 -c100 -d60s \
  -H "Authorization: Bearer $TOKEN" \
  -s load-test-mixed.lua \
  http://localhost:3000
```

### Scenario 5: Concurrent User Simulation

**Purpose:** Simulate realistic number of simultaneous users

```bash
# 10 concurrent users (light load)
wrk -t2 -c10 -d60s http://localhost:3000/health

# 100 concurrent users (moderate load)
wrk -t4 -c100 -d60s http://localhost:3000/health

# 500 concurrent users (heavy load)
wrk -t8 -c500 -d60s http://localhost:3000/health

# 1000 concurrent users (stress test)
wrk -t16 -c1000 -d60s http://localhost:3000/health
```

## Baseline Performance

### Establish Baseline Metrics

Run these tests when system is at rest to establish baseline:

```bash
#!/bin/bash
echo "Establishing Performance Baseline..."
echo ""

echo "1. Health Check Baseline"
wrk -t4 -c50 -d30s http://localhost:3000/health --latency > baseline_health.txt

echo ""
echo "2. Readiness Probe Baseline"
wrk -t4 -c50 -d30s http://localhost:3000/health/ready --latency > baseline_ready.txt

echo ""
echo "3. Metrics Endpoint Baseline"
wrk -t4 -c50 -d30s http://localhost:3000/health/metrics --latency > baseline_metrics.txt

echo ""
echo "4. API Endpoint Baseline (authenticated)"
TOKEN=$(curl -s -X POST http://localhost:3000/api/v2/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"teacher1@school.edu","password":"teacher123"}' | jq -r '.accessToken')

wrk -t4 -c50 -d30s \
  -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/v2/schools --latency > baseline_schools.txt

echo "Baseline tests complete!"
```

### Baseline Results Template

```
Endpoint: GET /health
- Requests/sec: 2000+
- Latency (avg): <50ms
- Latency (p99): <100ms
- Errors: 0

Endpoint: GET /health/ready
- Requests/sec: 1000+
- Latency (avg): <100ms
- Latency (p99): <200ms
- Errors: 0

Endpoint: GET /api/v2/schools (authenticated)
- Requests/sec: 500+
- Latency (avg): 50-100ms
- Latency (p99): 200-300ms
- Errors: 0
```

## Running Load Tests

### Quick Start: 5-Minute Load Test

```bash
#!/bin/bash
set -e

echo "🧪 Starting 5-Minute Load Test..."
echo ""

# Test 1: Health endpoint
echo "1. Testing health endpoint..."
wrk -t4 -c100 -d300s --latency http://localhost:3000/health

echo ""
echo "2. Testing readiness probe..."
wrk -t4 -c100 -d300s --latency http://localhost:3000/health/ready

echo ""
echo "✅ Load test complete!"
```

### 30-Minute Comprehensive Test

```bash
#!/bin/bash
set -e

RESULTS_DIR="load-test-results-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$RESULTS_DIR"

echo "🧪 Starting Comprehensive 30-Minute Load Test"
echo "Results will be saved to: $RESULTS_DIR"
echo ""

# Baseline test
echo "Stage 1: Baseline (5 min, 10 concurrent users)"
wrk -t2 -c10 -d300s --latency \
  http://localhost:3000/health \
  2>&1 | tee "$RESULTS_DIR/stage1-baseline.txt"

# Light load test
echo ""
echo "Stage 2: Light Load (5 min, 50 concurrent users)"
wrk -t4 -c50 -d300s --latency \
  http://localhost:3000/health \
  2>&1 | tee "$RESULTS_DIR/stage2-light.txt"

# Moderate load test
echo ""
echo "Stage 3: Moderate Load (5 min, 100 concurrent users)"
wrk -t4 -c100 -d300s --latency \
  http://localhost:3000/health \
  2>&1 | tee "$RESULTS_DIR/stage3-moderate.txt"

# Heavy load test
echo ""
echo "Stage 4: Heavy Load (5 min, 200 concurrent users)"
wrk -t8 -c200 -d300s --latency \
  http://localhost:3000/health \
  2>&1 | tee "$RESULTS_DIR/stage4-heavy.txt"

# Stress test
echo ""
echo "Stage 5: Stress Test (5 min, 500 concurrent users)"
wrk -t16 -c500 -d300s --latency \
  http://localhost:3000/health \
  2>&1 | tee "$RESULTS_DIR/stage5-stress.txt"

# Peak test
echo ""
echo "Stage 6: Peak Load (5 min, 1000 concurrent users)"
wrk -t16 -c1000 -d300s --latency \
  http://localhost:3000/health \
  2>&1 | tee "$RESULTS_DIR/stage6-peak.txt"

echo ""
echo "✅ Comprehensive load test complete!"
echo "Results saved to: $RESULTS_DIR"
```

### Real-World Scenario Test

```bash
#!/bin/bash

# Simulate realistic traffic pattern
# - 50% health checks
# - 30% API reads
# - 15% data queries
# - 5% writes

TOKEN=$(curl -s -X POST http://localhost:3000/api/v2/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"teacher1@school.edu","password":"teacher123"}' | jq -r '.accessToken')

echo "Testing real-world traffic patterns..."
echo ""

echo "1. Read-heavy workload (80% reads)"
wrk -t8 -c100 -d60s \
  -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/v2/schools

echo ""
echo "2. Write-heavy workload (20% writes)"
wrk -t8 -c100 -d60s \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  http://localhost:3000/api/v2/students

echo ""
echo "3. Mixed workload (50/30/20 split)"
wrk -t8 -c200 -d120s \
  -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/health/metrics
```

## Performance Monitoring

### Real-Time Monitoring During Load Test

In a separate terminal, monitor the API health while load test runs:

```bash
# Watch real-time metrics
watch -n 1 'curl -s http://localhost:3000/health/metrics | jq "{requests: .api.requestCount, errors: .api.errorCount, avgLatency: .api.averageResponseTime, p95: .api.p95ResponseTime}"'
```

### System Resource Monitoring

```bash
# Monitor CPU and memory
watch -n 1 'docker stats disha-staging-api --no-stream'

# Monitor database connections
watch -n 5 'docker exec disha-staging-postgres psql -U staging_user -d disha_staging_db -c "SELECT count(*) FROM pg_stat_activity;"'

# Monitor network I/O
watch -n 1 'ifstat -i eth0'
```

### Docker Container Metrics

```bash
# Check API container resource usage
docker stats disha-staging-api

# Check database resource usage
docker stats disha-staging-postgres

# View container logs for errors
docker logs -f disha-staging-api --tail 100
```

### Prometheus Query During Load Test

Access Prometheus at http://localhost:9090 and query:

```
# Request rate over time
rate(http_requests_total[1m])

# Error rate
rate(http_errors_total[1m])

# P95 response time
histogram_quantile(0.95, http_request_duration_seconds)

# Memory usage
heap_usage_bytes / 1024 / 1024
```

## Results Analysis

### Interpreting wrk Output

```
Running 30s test @ http://localhost:3000/health
  4 threads and 50 connections

  Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency    35.23ms   12.34ms  245ms    78.23%
    Req/Sec   598.45     89.32    745.00   71.23%

  72123 requests in 30.10s, 12.45MB read
  Socket errors: 0, Read errors: 0

Latency Distribution
     50%    32ms
     75%    40ms
     90%    55ms
     99%    85ms
```

**What it Means:**
- `Latency` → Response time
  - Avg: 35.23ms ✅ (Good)
  - Stdev: 12.34ms (Consistency)
  - Max: 245ms (Spike)
  - +/- Stdev: 78% (Most requests within ±1 std dev)

- `Req/Sec` → Throughput per thread
  - Avg: 598.45 req/s ✅ (Good)
  - Total: 72,123 requests in 30 seconds

- `Latency Distribution` → Percentiles
  - p50: 32ms (Half of requests)
  - p99: 85ms (99% of requests)

### Performance Thresholds

**Excellent (Green):**
```
- Latency (avg): <50ms
- Latency (p99): <100ms
- Throughput: >1000 req/s
- Error rate: 0%
- Success rate: 100%
```

**Good (Yellow):**
```
- Latency (avg): 50-100ms
- Latency (p99): 100-200ms
- Throughput: 500-1000 req/s
- Error rate: <0.1%
- Success rate: >99.9%
```

**Poor (Red):**
```
- Latency (avg): >200ms
- Latency (p99): >500ms
- Throughput: <500 req/s
- Error rate: >1%
- Success rate: <99%
```

### Create Test Report

```bash
#!/bin/bash

cat > load-test-report.md << 'EOF'
# Load Test Report - $(date)

## Test Configuration
- Duration: 30 minutes
- Stages: 6 (baseline, light, moderate, heavy, stress, peak)
- Load progression: 10 → 50 → 100 → 200 → 500 → 1000 concurrent users

## Results Summary

### Stage 1: Baseline (10 concurrent users)
- Requests/sec: [INSERT]
- Latency (avg): [INSERT]
- Latency (p99): [INSERT]
- Status: [PASS/FAIL]

### Stage 2: Light Load (50 concurrent users)
- Requests/sec: [INSERT]
- Latency (avg): [INSERT]
- Latency (p99): [INSERT]
- Status: [PASS/FAIL]

### Stage 3: Moderate Load (100 concurrent users)
- Requests/sec: [INSERT]
- Latency (avg): [INSERT]
- Latency (p99): [INSERT]
- Status: [PASS/FAIL]

### Stage 4: Heavy Load (200 concurrent users)
- Requests/sec: [INSERT]
- Latency (avg): [INSERT]
- Latency (p99): [INSERT]
- Status: [PASS/FAIL]

### Stage 5: Stress Test (500 concurrent users)
- Requests/sec: [INSERT]
- Latency (avg): [INSERT]
- Latency (p99): [INSERT]
- Status: [PASS/FAIL]

### Stage 6: Peak Load (1000 concurrent users)
- Requests/sec: [INSERT]
- Latency (avg): [INSERT]
- Latency (p99): [INSERT]
- Status: [PASS/FAIL]

## System Metrics

### CPU Usage
- Min: [INSERT]%
- Max: [INSERT]%
- Avg: [INSERT]%

### Memory Usage
- Min: [INSERT]MB
- Max: [INSERT]MB
- Avg: [INSERT]MB

### Database Connections
- Min: [INSERT]
- Max: [INSERT]
- Avg: [INSERT]

## Bottlenecks Identified

1. [INSERT]
2. [INSERT]
3. [INSERT]

## Recommendations

1. [INSERT]
2. [INSERT]
3. [INSERT]

## Conclusion

[INSERT SUMMARY]
EOF

cat load-test-report.md
```

## Bottleneck Identification

### Identify Database Bottlenecks

```bash
# Check slow queries
docker exec disha-staging-postgres psql -U staging_user -d disha_staging_db << 'SQL'
SELECT query, calls, mean_time, max_time 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
SQL

# Check connection pool status
docker exec disha-staging-postgres psql -U staging_user -d disha_staging_db << 'SQL'
SELECT state, count(*) 
FROM pg_stat_activity 
GROUP BY state;
SQL

# Check table sizes
docker exec disha-staging-postgres psql -U staging_user -d disha_staging_db << 'SQL'
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) 
FROM pg_tables 
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
SQL
```

### Identify Memory Bottlenecks

```bash
# Check memory usage trend
curl -s http://localhost:3000/health/metrics | jq '.memory'

# Monitor over time
for i in {1..60}; do
  echo "$(date): $(curl -s http://localhost:3000/health/metrics | jq '.memory.percentage')"
  sleep 1
done
```

### Identify CPU Bottlenecks

```bash
# Check if CPU throttled
docker stats disha-staging-api --no-stream --format "{{.CPUPerc}}"

# Check per-request CPU usage
# During load test, measure CPU spikes
watch -n 0.5 'docker stats disha-staging-api --no-stream'
```

### Identify Network Bottlenecks

```bash
# Check network I/O
docker stats disha-staging-api --format "{{.MemUsage}}" --no-stream

# Monitor bandwidth usage
# During load test, watch bandwidth consumption
watch -n 1 'ifstat -i eth0 1 1'
```

### Identify Rate Limiting Bottlenecks

Monitor 429 responses during load test:

```bash
# Watch 429 responses in real-time
while true; do
  echo "$(date): $(curl -s -w '%{http_code}\n' -o /dev/null http://localhost:3000/api/v2/schools)"
  sleep 1
done

# Or use wrk with script
cat > rate-limit-test.lua << 'EOF'
response = function(status, headers, body)
  if status == 429 then
    print("Rate limited!")
  end
end
EOF

wrk -t4 -c100 -d60s -s rate-limit-test.lua http://localhost:3000/api/v2/schools
```

## Rate Limiting Verification

### Test Rate Limiting Effectiveness

```bash
#!/bin/bash

echo "Testing Rate Limiting..."
echo ""

# Get a token
TOKEN=$(curl -s -X POST http://localhost:3000/api/v2/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin1@school.edu","password":"admin123"}' | jq -r '.accessToken')

# Test login rate limit (5 per 15 minutes)
echo "1. Testing login rate limit (expect 5 success, then 403):"
for i in {1..10}; do
  STATUS=$(curl -s -w '%{http_code}' -o /dev/null -X POST http://localhost:3000/api/v2/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"admin1@school.edu","password":"admin123"}')
  echo "  Request $i: HTTP $STATUS"
  sleep 0.5
done

echo ""
echo "2. Testing API endpoint rate limit:"
for i in {1..150}; do
  STATUS=$(curl -s -w '%{http_code}' -o /dev/null \
    -H "Authorization: Bearer $TOKEN" \
    http://localhost:3000/api/v2/schools)
  
  if [ "$STATUS" = "429" ]; then
    echo "  ✅ Rate limit triggered at request $i (HTTP 429)"
    break
  fi
  
  if [ $((i % 10)) -eq 0 ]; then
    echo "  Request $i: HTTP $STATUS"
  fi
done

echo ""
echo "3. Checking rate limit headers:"
curl -v -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/v2/schools 2>&1 | grep "X-RateLimit"
```

## Performance Optimization

### Based on Load Test Results

**If latency is high:**
1. Add database indexes on frequently queried columns
2. Optimize N+1 queries
3. Implement caching layer (Redis)
4. Add database read replicas

**If memory is high:**
1. Check for memory leaks
2. Implement pagination for large results
3. Add garbage collection tuning
4. Reduce log verbosity

**If CPU is high:**
1. Profile bottleneck functions
2. Optimize hot code paths
3. Add request queuing
4. Scale horizontally

**If rate limiting triggered too early:**
1. Adjust rate limit thresholds
2. Implement user-based limits
3. Add burst allowances
4. Implement sliding window algorithm

### Optimization Checklist

- [ ] Database queries optimized
- [ ] Indexes added for common queries
- [ ] Caching implemented
- [ ] Connection pooling configured
- [ ] Compression enabled
- [ ] Rate limits calibrated
- [ ] Memory leaks eliminated
- [ ] Hot code paths optimized
- [ ] Logging tuned appropriately

## Load Testing Checklist

### Pre-Test
- [ ] Baseline metrics recorded
- [ ] System at stable state
- [ ] Monitoring ready
- [ ] Test scripts prepared
- [ ] Token generation automated
- [ ] Results directory created

### During Test
- [ ] Monitor CPU usage
- [ ] Monitor memory usage
- [ ] Monitor database connections
- [ ] Watch error rates
- [ ] Check for rate limiting
- [ ] Record response times

### Post-Test
- [ ] Collect metrics data
- [ ] Analyze bottlenecks
- [ ] Compare to baseline
- [ ] Document findings
- [ ] Identify improvements
- [ ] Create optimization plan

## Next Steps After Load Testing

1. **Document Findings** - Create comprehensive report
2. **Identify Bottlenecks** - Pinpoint limiting factors
3. **Optimize Performance** - Implement improvements
4. **Re-test** - Verify improvements
5. **Set Targets** - Define performance SLOs

## Useful Resources

- [wrk Documentation](https://github.com/wg/wrk)
- [Load Testing Best Practices](https://en.wikipedia.org/wiki/Load_testing)
- [Performance Testing Guide](https://www.perfmatrix.com/performance-testing/)
- [Database Performance Tuning](https://www.postgresql.org/docs/current/performance-tips.html)

## Performance Targets

**Recommended SLOs:**
- Availability: 99.95%
- Latency (p95): <200ms
- Error rate: <0.1%
- Throughput: >1000 req/s
- Memory: <500MB
- CPU: <80%
