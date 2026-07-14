#!/bin/bash

# Disha Load Testing - Baseline Performance Test
# Establishes baseline metrics for health check endpoints

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
API_URL="${API_URL:-http://localhost:3000}"
TEST_DURATION="${TEST_DURATION:-30s}"
CONCURRENT_USERS="${CONCURRENT_USERS:-50}"
THREADS=$((CONCURRENT_USERS / 10 < 1 ? 1 : CONCURRENT_USERS / 10))

# Results directory
RESULTS_DIR="load-test-results-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$RESULTS_DIR"

# Header
echo ""
echo -e "${BLUE}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Disha Load Testing - Baseline Performance              ║${NC}"
echo -e "${BLUE}║   $(date '+%Y-%m-%d %H:%M:%S')                          ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Pre-test checks
echo -e "${BLUE}Pre-Test Verification${NC}"
echo ""

# Check if API is running
if ! curl -s -f "$API_URL/health" > /dev/null; then
    echo -e "${RED}❌ API is not responding at $API_URL${NC}"
    exit 1
fi
echo -e "${GREEN}✅ API is running${NC}"

# Check if wrk is installed
if ! command -v wrk &> /dev/null; then
    echo -e "${RED}❌ wrk is not installed${NC}"
    echo "Install with: brew install wrk (macOS) or apt-get install wrk (Ubuntu)"
    exit 1
fi
echo -e "${GREEN}✅ wrk is installed${NC}"

# Check system resources
AVAILABLE_MEM=$(free -m | awk 'NR==2 {print $7}')
if [ "$AVAILABLE_MEM" -lt 500 ]; then
    echo -e "${YELLOW}⚠️  Low memory available ($AVAILABLE_MEM MB)${NC}"
fi
echo -e "${GREEN}✅ System resources available${NC}"

echo ""
echo -e "${BLUE}Test Configuration${NC}"
echo "  API URL: $API_URL"
echo "  Duration: $TEST_DURATION"
echo "  Concurrent Users: $CONCURRENT_USERS"
echo "  Threads: $THREADS"
echo "  Results: $RESULTS_DIR"
echo ""

# Function to run test and capture results
run_test() {
    local name=$1
    local endpoint=$2
    local description=$3

    echo -e "${YELLOW}Testing: $description${NC}"
    echo "  Endpoint: $endpoint"
    echo "  Starting test..."

    wrk -t$THREADS -c$CONCURRENT_USERS -d$TEST_DURATION \
        --latency \
        "$API_URL$endpoint" 2>&1 | tee "$RESULTS_DIR/${name}.txt"

    echo ""
}

# Test 1: Health endpoint
run_test "1-health" "/health" "Health Check Endpoint"

# Test 2: Liveness probe
run_test "2-liveness" "/health/live" "Liveness Probe"

# Test 3: Readiness probe
run_test "3-readiness" "/health/ready" "Readiness Probe"

# Test 4: Startup probe
run_test "4-startup" "/health/startup" "Startup Probe"

# Test 5: Metrics endpoint
run_test "5-metrics" "/health/metrics" "Metrics Endpoint"

# Test 6: Deep check
run_test "6-deep" "/health/deep" "Deep Health Check"

# Parse results
echo ""
echo -e "${BLUE}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Results Summary                                         ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""

parse_results() {
    local file=$1
    local name=$2

    echo -e "${YELLOW}$name${NC}"

    # Extract key metrics
    local avg=$(grep "Latency" "$file" | head -1 | awk '{print $2}')
    local max=$(grep "Latency" "$file" | head -1 | awk '{print $4}')
    local rps=$(grep "Req/Sec" "$file" | awk '{print $2}')
    local p99=$(grep "99%" "$file" | awk '{print $2}')

    echo "  Latency (avg): $avg"
    echo "  Latency (p99): ${p99:-N/A}"
    echo "  Latency (max): $max"
    echo "  Throughput: $rps req/s"
    echo ""
}

# Parse all results
for file in "$RESULTS_DIR"/*.txt; do
    if [ -f "$file" ]; then
        name=$(basename "$file" .txt)
        parse_results "$file" "$name"
    fi
done

# Performance summary
echo -e "${BLUE}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Performance Analysis                                    ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check for errors
TOTAL_ERRORS=$(find "$RESULTS_DIR" -name "*.txt" -exec grep -l "Socket errors:" {} \; | wc -l)
if [ "$TOTAL_ERRORS" -gt 0 ]; then
    echo -e "${RED}⚠️  Errors detected in some tests${NC}"
fi

echo -e "${GREEN}✅ Baseline performance test complete!${NC}"
echo ""
echo "Results saved to: $RESULTS_DIR"
echo ""
echo "Next steps:"
echo "  1. Review results in $RESULTS_DIR"
echo "  2. Save baseline metrics for comparison"
echo "  3. Run load-test-progressive.sh for stress testing"
echo ""
