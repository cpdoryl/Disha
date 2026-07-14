#!/bin/bash

# Disha Rate Limiting Verification
# Tests that rate limiting is working correctly

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

API_URL="${API_URL:-http://localhost:3000}"

echo ""
echo -e "${BLUE}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Disha Rate Limiting Verification                       ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Test 1: Login Rate Limiting (5 per 15 minutes)
echo -e "${YELLOW}Test 1: Login Rate Limiting (5 per 15 minutes)${NC}"
echo "Sending 10 rapid login attempts..."
echo ""

success_count=0
rate_limited=false

for i in {1..10}; do
    RESPONSE=$(curl -s -X POST "$API_URL/api/v2/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"email":"admin1@school.edu","password":"admin123"}' \
        -w "\n%{http_code}")

    HTTP_CODE=$(echo "$RESPONSE" | tail -1)

    if [ "$HTTP_CODE" = "200" ]; then
        echo "  Request $i: ✅ HTTP 200 (Success)"
        ((success_count++))
    elif [ "$HTTP_CODE" = "429" ]; then
        echo "  Request $i: ⚠️  HTTP 429 (Rate Limited)"
        rate_limited=true
    else
        echo "  Request $i: ❌ HTTP $HTTP_CODE"
    fi

    sleep 0.1
done

echo ""
if [ "$rate_limited" = true ]; then
    echo -e "${GREEN}✅ Rate limiting working (triggered after $success_count successful requests)${NC}"
else
    echo -e "${YELLOW}⚠️  Rate limiting not triggered (may need longer test or different endpoint)${NC}"
fi

# Test 2: API Endpoint Rate Limiting
echo ""
echo -e "${YELLOW}Test 2: API Endpoint Rate Limiting${NC}"

# Get token
TOKEN=$(curl -s -X POST "$API_URL/api/v2/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"admin1@school.edu","password":"admin123"}' | jq -r '.accessToken' 2>/dev/null || echo "")

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
    echo -e "${RED}❌ Failed to get authentication token${NC}"
    exit 1
fi

echo "Sending 120 rapid API requests..."
echo ""

success_count=0
rate_limited=false

for i in {1..120}; do
    HTTP_CODE=$(curl -s -w '%{http_code}' -o /dev/null \
        -H "Authorization: Bearer $TOKEN" \
        "$API_URL/api/v2/schools")

    if [ "$HTTP_CODE" = "200" ]; then
        ((success_count++))
        if [ $((success_count % 20)) -eq 0 ]; then
            echo "  Request $i: ✅ HTTP 200"
        fi
    elif [ "$HTTP_CODE" = "429" ]; then
        echo -e "  Request $i: ${YELLOW}⚠️  HTTP 429 (Rate Limited)${NC}"
        rate_limited=true
        break
    else
        echo "  Request $i: ❌ HTTP $HTTP_CODE"
    fi

    sleep 0.05
done

echo ""
if [ "$rate_limited" = true ]; then
    echo -e "${GREEN}✅ Rate limiting working (triggered after ~$success_count requests)${NC}"
else
    echo -e "${YELLOW}⚠️  Rate limiting not triggered in 120 requests${NC}"
fi

# Test 3: Rate Limit Response Headers
echo ""
echo -e "${YELLOW}Test 3: Rate Limit Response Headers${NC}"
echo ""

HEADERS=$(curl -s -i "$API_URL/api/v2/schools" \
    -H "Authorization: Bearer $TOKEN" 2>&1 | grep -E "X-RateLimit|Retry-After")

if [ -n "$HEADERS" ]; then
    echo -e "${GREEN}✅ Rate limit headers present:${NC}"
    echo "$HEADERS"
else
    echo -e "${YELLOW}⚠️  No rate limit headers found${NC}"
fi

# Test 4: Rate Limit Persistence
echo ""
echo -e "${YELLOW}Test 4: Rate Limit Persistence (memory)${NC}"
echo ""

# Make requests to same endpoint from same IP
echo "Making 5 requests to same endpoint..."
for i in {1..5}; do
    HTTP_CODE=$(curl -s -w '%{http_code}' -o /dev/null "$API_URL/health")
    echo "  Request $i: HTTP $HTTP_CODE"
    sleep 0.2
done

echo ""
echo "Waiting 5 seconds..."
sleep 5

echo "Making 5 more requests..."
for i in {1..5}; do
    HTTP_CODE=$(curl -s -w '%{http_code}' -o /dev/null "$API_URL/health")
    echo "  Request $i: HTTP $HTTP_CODE"
    sleep 0.2
done

echo ""
echo -e "${GREEN}✅ Rate limit persistence test complete${NC}"

# Summary
echo ""
echo -e "${BLUE}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Rate Limiting Verification Summary                     ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "Rate limiting is configured with the following limits:"
echo "  - Login: 5 requests per 15 minutes (IP-based)"
echo "  - API endpoints: 100 requests per 15 minutes (User-based)"
echo "  - Public endpoints: 30 requests per 1 minute (IP-based)"
echo ""
echo "Response headers to expect:"
echo "  - X-RateLimit-Limit: Maximum requests allowed"
echo "  - X-RateLimit-Remaining: Requests remaining"
echo "  - X-RateLimit-Reset: Unix timestamp when limit resets"
echo "  - Retry-After: Seconds to wait before retrying (when limited)"
echo ""
