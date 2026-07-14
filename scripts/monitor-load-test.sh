#!/bin/bash

# Disha Load Test Monitor
# Real-time monitoring during load tests

API_URL="${API_URL:-http://localhost:3000}"
UPDATE_INTERVAL="${UPDATE_INTERVAL:-2}"

clear

echo "╔════════════════════════════════════════════════════════════════════════╗"
echo "║                 Disha Load Test Real-Time Monitor                      ║"
echo "║                  Press Ctrl+C to stop monitoring                       ║"
echo "╚════════════════════════════════════════════════════════════════════════╝"
echo ""

# Function to format bytes as MB
format_mb() {
    echo "scale=2; $1 / 1024 / 1024" | bc
}

# Function to update metrics
update_metrics() {
    clear

    echo "╔════════════════════════════════════════════════════════════════════════╗"
    echo "║                 Disha Load Test Monitor - $(date '+%H:%M:%S')                              ║"
    echo "╚════════════════════════════════════════════════════════════════════════╝"
    echo ""

    # API Health Check
    echo "┌─ API Status ─────────────────────────────────────────────────────────┐"
    HEALTH=$(curl -s -w '%{http_code}' -o /dev/null "$API_URL/health/ready")
    if [ "$HEALTH" = "200" ]; then
        echo "│ Health:                                              ✅ Ready (200)   │"
    elif [ "$HEALTH" = "503" ]; then
        echo "│ Health:                                         ⚠️  Not Ready (503)   │"
    else
        echo "│ Health:                                        ❌ Error ($HEALTH)     │"
    fi
    echo ""

    # API Metrics
    echo "┌─ API Metrics ────────────────────────────────────────────────────────┐"
    METRICS=$(curl -s "$API_URL/health/metrics" 2>/dev/null)

    if [ $? -eq 0 ]; then
        REQ_COUNT=$(echo "$METRICS" | jq '.api.requestCount // 0')
        ERROR_COUNT=$(echo "$METRICS" | jq '.api.errorCount // 0')
        ERROR_RATE=$(echo "$METRICS" | jq '.api.errorRate // "0.00%"')
        AVG_LATENCY=$(echo "$METRICS" | jq '.api.averageResponseTime // 0')
        P95_LATENCY=$(echo "$METRICS" | jq '.api.p95ResponseTime // 0')
        P99_LATENCY=$(echo "$METRICS" | jq '.api.p99ResponseTime // 0')

        printf "│ Total Requests:                                    %10d     │\n" "$REQ_COUNT"
        printf "│ Errors:                                            %10d     │\n" "$ERROR_COUNT"
        printf "│ Error Rate:                                    %13s     │\n" "$ERROR_RATE"
        printf "│ Avg Response Time:                            %9dms     │\n" "$AVG_LATENCY"
        printf "│ P95 Response Time:                            %9dms     │\n" "$P95_LATENCY"
        printf "│ P99 Response Time:                            %9dms     │\n" "$P99_LATENCY"
    else
        echo "│ Unable to fetch metrics                                            │"
    fi
    echo ""

    # Memory Status
    echo "┌─ Memory Status ──────────────────────────────────────────────────────┐"
    MEM=$(curl -s "$API_URL/health/metrics" 2>/dev/null | jq '.memory')

    if [ $? -eq 0 ]; then
        HEAP_USED=$(echo "$MEM" | jq '.heapUsed // 0')
        HEAP_TOTAL=$(echo "$MEM" | jq '.heapTotal // 0')
        HEAP_PERCENT=$(echo "$MEM" | jq '.percentage // 0')

        printf "│ Heap Used:                        %6dMB / %6dMB (%3d%%)  │\n" \
            "$HEAP_USED" "$HEAP_TOTAL" "$HEAP_PERCENT"

        # Memory status bar
        FILLED=$((HEAP_PERCENT / 5))
        EMPTY=$((20 - FILLED))
        BAR=$(printf '█%.0s' $(seq 1 $FILLED))
        BLANK=$(printf '░%.0s' $(seq 1 $EMPTY))
        echo "│ Status: [$BAR$BLANK]                                       │"
    else
        echo "│ Unable to fetch memory metrics                                     │"
    fi
    echo ""

    # Database Status
    echo "┌─ Database Status ────────────────────────────────────────────────────┐"
    DB=$(curl -s "$API_URL/health/metrics" 2>/dev/null | jq '.database')

    if [ $? -eq 0 ]; then
        DB_STATUS=$(echo "$DB" | jq -r '.status // "unknown"')
        DB_LATENCY=$(echo "$DB" | jq '.responseTime // 0')
        CONNECTIONS=$(echo "$DB" | jq '.activeConnections // 0')

        printf "│ Status:                                    %s                  │\n" "$(printf '%-10s' "$DB_STATUS")"
        printf "│ Response Time:                            %10dms     │\n" "$DB_LATENCY"
        printf "│ Active Connections:                        %10d     │\n" "$CONNECTIONS"
    else
        echo "│ Unable to fetch database metrics                                   │"
    fi
    echo ""

    # Docker Container Stats
    echo "┌─ Container Resources ────────────────────────────────────────────────┐"
    STATS=$(docker stats disha-staging-api --no-stream 2>/dev/null)

    if [ $? -eq 0 ]; then
        CPU=$(echo "$STATS" | tail -1 | awk '{print $3}')
        MEM_USAGE=$(echo "$STATS" | tail -1 | awk '{print $4}')

        printf "│ Container CPU:                                 %13s     │\n" "$CPU"
        printf "│ Container Memory:                              %13s     │\n" "$MEM_USAGE"
    else
        echo "│ Docker stats not available                                        │"
    fi
    echo ""

    # Load Test Tips
    echo "┌─ Tips ───────────────────────────────────────────────────────────────┐"
    echo "│ • Watch memory percentage - should stay <80% during tests           │"
    echo "│ • Monitor error rate - should stay at 0% during normal load        │"
    echo "│ • P99 latency shows worst-case user experience                     │"
    echo "│ • Database latency >100ms indicates performance issues             │"
    echo "│ • CPU >80% means service is approaching capacity                   │"
    echo "└──────────────────────────────────────────────────────────────────────┘"
}

# Main monitoring loop
while true; do
    update_metrics
    sleep "$UPDATE_INTERVAL"
done
