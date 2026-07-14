#!/bin/bash

# Disha Load Testing - Progressive Load Test
# Gradually increases load to identify breaking point

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
API_URL="${API_URL:-http://localhost:3000}"
ENDPOINT="${ENDPOINT:-/health}"
STAGE_DURATION="${STAGE_DURATION:-60s}"
RESULTS_DIR="load-test-progressive-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$RESULTS_DIR"

# Load stages (concurrent users)
STAGES=(10 50 100 200 500 1000)

# Header
echo ""
echo -e "${BLUE}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Disha Load Testing - Progressive Load Test             ║${NC}"
echo -e "${BLUE}║   $(date '+%Y-%m-%d %H:%M:%S')                          ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Pre-test checks
echo -e "${BLUE}Pre-Test Verification${NC}"

if ! curl -s -f "$API_URL/health" > /dev/null; then
    echo -e "${RED}❌ API is not responding${NC}"
    exit 1
fi
echo -e "${GREEN}✅ API is running${NC}"

if ! command -v wrk &> /dev/null; then
    echo -e "${RED}❌ wrk not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ wrk is ready${NC}"

echo ""
echo -e "${BLUE}Test Configuration${NC}"
echo "  API URL: $API_URL"
echo "  Endpoint: $ENDPOINT"
echo "  Duration per stage: $STAGE_DURATION"
echo "  Stages: ${#STAGES[@]}"
echo "  Results: $RESULTS_DIR"
echo ""

# Function to monitor metrics
monitor_metrics() {
    echo -e "${YELLOW}  System Status:${NC}"

    # CPU
    CPU=$(docker stats disha-staging-api --no-stream 2>/dev/null | tail -1 | awk '{print $3}' || echo "N/A")
    echo "    CPU: $CPU"

    # Memory
    MEM=$(docker stats disha-staging-api --no-stream 2>/dev/null | tail -1 | awk '{print $4}' || echo "N/A")
    echo "    Memory: $MEM"

    # API Health
    HEALTH=$(curl -s -w '%{http_code}' -o /dev/null $API_URL/health/ready)
    if [ "$HEALTH" = "200" ]; then
        echo -e "    API Health: ${GREEN}✅ Ready${NC}"
    else
        echo -e "    API Health: ${RED}❌ HTTP $HEALTH${NC}"
    fi
}

# Run progressive load test
stage_num=0
for concurrent_users in "${STAGES[@]}"; do
    stage_num=$((stage_num + 1))
    threads=$((concurrent_users / 10 < 1 ? 1 : concurrent_users / 10))

    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}Stage $stage_num: $concurrent_users Concurrent Users${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""

    # Monitor before test
    echo -e "${YELLOW}Before test:${NC}"
    monitor_metrics
    echo ""

    # Run load test
    echo -e "${YELLOW}Running test... (${STAGE_DURATION})${NC}"
    wrk -t$threads -c$concurrent_users -d$STAGE_DURATION \
        --latency \
        "$API_URL$ENDPOINT" 2>&1 | tee "$RESULTS_DIR/stage-$stage_num-${concurrent_users}cu.txt"

    # Monitor after test
    echo ""
    echo -e "${YELLOW}After test:${NC}"
    monitor_metrics
    echo ""

    # Wait between stages
    if [ $stage_num -lt ${#STAGES[@]} ]; then
        echo -e "${YELLOW}Cooling down for 10 seconds...${NC}"
        sleep 10
        echo ""
    fi
done

# Analysis
echo ""
echo -e "${BLUE}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Progressive Load Test Summary                          ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Create comparison table
echo -e "${YELLOW}Performance by Load Level:${NC}"
echo ""
echo "Stage | Users | Latency(avg) | Latency(p99) | Throughput | Status"
echo "------|-------|--------------|--------------|------------|--------"

for i in "${!STAGES[@]}"; do
    stage=$((i + 1))
    users=${STAGES[$i]}
    file="$RESULTS_DIR/stage-$stage-${users}cu.txt"

    if [ -f "$file" ]; then
        # Extract metrics (simplified - may need adjustment based on wrk output)
        avg=$(grep "Latency" "$file" | head -1 | awk '{print $2}')
        p99=$(grep "99%" "$file" | awk '{print $2}')
        rps=$(grep "Req/Sec" "$file" | awk '{print $2}')

        # Determine status
        if grep -q "Socket errors:" "$file"; then
            status="FAIL"
        else
            status="PASS"
        fi

        printf "%5d | %5d | %-12s | %-12s | %-10s | %s\n" \
            "$stage" "$users" "${avg:-N/A}" "${p99:-N/A}" "${rps:-N/A}" "$status"
    fi
done

echo ""
echo -e "${GREEN}✅ Progressive load test complete!${NC}"
echo ""
echo "Results saved to: $RESULTS_DIR"
echo ""
echo "Analysis recommendations:"
echo "  1. Review results in $RESULTS_DIR for inflection points"
echo "  2. Identify where performance degrades significantly"
echo "  3. Check API and database logs for errors at high load"
echo "  4. Plan optimization based on bottleneck findings"
echo ""
