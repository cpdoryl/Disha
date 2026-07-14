#!/bin/bash

# Disha Staging Deployment Verification Script
# Verifies that staging deployment is working correctly

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0

# Helper functions
pass() {
    echo -e "${GREEN}✅ $1${NC}"
    ((PASSED++))
}

fail() {
    echo -e "${RED}❌ $1${NC}"
    ((FAILED++))
}

warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Header
echo ""
echo -e "${BLUE}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Disha Staging Deployment Verification                   ║${NC}"
echo -e "${BLUE}║   $(date '+%Y-%m-%d %H:%M:%S')                          ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""

# 1. Docker and Docker Compose Check
echo -e "${BLUE}1. Checking Docker & Docker Compose Installation${NC}"
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version)
    pass "Docker installed: $DOCKER_VERSION"
else
    fail "Docker not installed"
fi

if command -v docker-compose &> /dev/null; then
    DC_VERSION=$(docker-compose --version)
    pass "Docker Compose installed: $DC_VERSION"
else
    fail "Docker Compose not installed"
fi

# 2. Container Status Check
echo ""
echo -e "${BLUE}2. Checking Container Status${NC}"

CONTAINERS=("disha-staging-postgres" "disha-staging-api" "disha-staging-nginx" "disha-staging-prometheus" "disha-staging-grafana")

for container in "${CONTAINERS[@]}"; do
    if docker ps --format '{{.Names}}' | grep -q "^${container}$"; then
        STATUS=$(docker inspect -f '{{.State.Status}}' "$container" 2>/dev/null || echo "unknown")
        if [ "$STATUS" = "running" ]; then
            pass "Container $container is running"
        else
            fail "Container $container is not running (status: $STATUS)"
        fi
    else
        warn "Container $container not found"
    fi
done

# 3. Health Check Verification
echo ""
echo -e "${BLUE}3. Testing Health Check Endpoints${NC}"

# Liveness probe
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health/live | grep -q "200"; then
    pass "Liveness probe responding (HTTP 200)"
else
    fail "Liveness probe not responding correctly"
fi

# Readiness probe
READY_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health/ready)
if [ "$READY_CODE" = "200" ]; then
    pass "Readiness probe passing (HTTP 200)"
elif [ "$READY_CODE" = "503" ]; then
    warn "Readiness probe failing (HTTP 503) - Dependencies may not be ready"
else
    fail "Readiness probe not responding correctly (HTTP $READY_CODE)"
fi

# Startup probe
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health/startup | grep -q "200"; then
    pass "Startup probe responding (HTTP 200)"
else
    fail "Startup probe not responding correctly"
fi

# General health
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health | grep -q "200"; then
    pass "General health check responding (HTTP 200)"
else
    fail "General health check not responding correctly"
fi

# 4. Database Connectivity
echo ""
echo -e "${BLUE}4. Testing Database Connectivity${NC}"

if curl -s http://localhost:3000/health/ready | jq -e '.checks.database.status' | grep -q "up"; then
    pass "Database is connected and responsive"
else
    fail "Database connectivity check failed"
fi

# 5. API Response Quality
echo ""
echo -e "${BLUE}5. Checking API Response Quality${NC}"

METRICS=$(curl -s http://localhost:3000/health/metrics)

REQUEST_COUNT=$(echo "$METRICS" | jq '.api.requestCount' 2>/dev/null)
if [ ! -z "$REQUEST_COUNT" ] && [ "$REQUEST_COUNT" -gt 0 ]; then
    pass "API has processed requests (Count: $REQUEST_COUNT)"
else
    warn "API request count not yet available"
fi

AVG_RESPONSE=$(echo "$METRICS" | jq '.api.averageResponseTime' 2>/dev/null)
if [ ! -z "$AVG_RESPONSE" ]; then
    if [ "$AVG_RESPONSE" -lt 200 ]; then
        pass "Average response time is good ($AVG_RESPONSE ms)"
    elif [ "$AVG_RESPONSE" -lt 500 ]; then
        warn "Average response time is moderate ($AVG_RESPONSE ms)"
    else
        fail "Average response time is slow ($AVG_RESPONSE ms)"
    fi
fi

ERROR_RATE=$(echo "$METRICS" | jq '.api.errorRate' 2>/dev/null)
if [ ! -z "$ERROR_RATE" ]; then
    if echo "$ERROR_RATE" | grep -q "0.00%"; then
        pass "Error rate is 0% (no errors)"
    else
        warn "Error rate is $ERROR_RATE"
    fi
fi

# 6. Memory Status
echo ""
echo -e "${BLUE}6. Checking Memory Status${NC}"

MEMORY=$(curl -s http://localhost:3000/health/metrics | jq '.memory')
HEAP_PERCENT=$(echo "$MEMORY" | jq '.percentage' 2>/dev/null)

if [ ! -z "$HEAP_PERCENT" ]; then
    if [ "$HEAP_PERCENT" -lt 70 ]; then
        pass "Memory usage is healthy ($HEAP_PERCENT%)"
    elif [ "$HEAP_PERCENT" -lt 85 ]; then
        warn "Memory usage is moderate ($HEAP_PERCENT%)"
    else
        fail "Memory usage is high ($HEAP_PERCENT%)"
    fi
else
    fail "Could not determine memory status"
fi

# 7. Monitoring Services
echo ""
echo -e "${BLUE}7. Checking Monitoring Services${NC}"

# Prometheus
if curl -s -o /dev/null -w "%{http_code}" http://localhost:9090 | grep -q "200"; then
    pass "Prometheus is accessible"
else
    warn "Prometheus not accessible"
fi

# Grafana
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3001 | grep -q "200"; then
    pass "Grafana is accessible"
else
    warn "Grafana not accessible"
fi

# 8. Network Connectivity
echo ""
echo -e "${BLUE}8. Checking Network Connectivity${NC}"

# Test internal communication
if docker exec disha-staging-api curl -s http://postgres-staging:5432 >/dev/null 2>&1; then
    pass "API can communicate with database"
else
    fail "API cannot communicate with database"
fi

# 9. SSL/TLS Configuration
echo ""
echo -e "${BLUE}9. Checking SSL/TLS Configuration${NC}"

if [ -f /etc/letsencrypt/live/staging.example.com/fullchain.pem ]; then
    pass "SSL certificate found"
else
    warn "SSL certificate not configured (using HTTP only)"
fi

# 10. Storage & Disk Space
echo ""
echo -e "${BLUE}10. Checking Storage${NC}"

DISK_FREE=$(df /var/lib/docker | tail -1 | awk '{print $4}')
if [ "$DISK_FREE" -gt 5242880 ]; then # 5GB in KB
    pass "Sufficient disk space available ($(numfmt --to=iec-i --suffix=B $DISK_FREE 2>/dev/null || echo "$DISK_FREE KB"))"
else
    fail "Low disk space"
fi

# 11. Docker Volumes
echo ""
echo -e "${BLUE}11. Checking Docker Volumes${NC}"

if docker volume ls | grep -q "disha.*postgres_staging_data"; then
    pass "Database volume exists"
else
    warn "Database volume not found"
fi

# Summary
echo ""
echo -e "${BLUE}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Verification Summary                                    ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo ""

# Recommendations
echo -e "${BLUE}Recommendations:${NC}"
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ Staging deployment is healthy and ready for testing${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Run integration tests: npm run test:integration"
    echo "2. Test API endpoints manually or with test scripts"
    echo "3. Monitor dashboards at http://localhost:3001"
    echo "4. Check logs: docker-compose -f docker-compose.staging.yml logs -f"
    exit 0
else
    echo -e "${RED}❌ Staging deployment has $FAILED issues that need to be resolved${NC}"
    echo ""
    echo "Troubleshooting steps:"
    echo "1. Check Docker logs: docker-compose -f docker-compose.staging.yml logs"
    echo "2. Verify environment variables: cat .env.staging.local"
    echo "3. Restart services: docker-compose -f docker-compose.staging.yml restart"
    echo "4. Check disk space: df -h"
    exit 1
fi
