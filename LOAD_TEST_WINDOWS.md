# Load Testing on Windows - PowerShell Guide

Step-by-step instructions for running load tests on Windows.

## Prerequisites for Windows

### 1. Install Docker Desktop for Windows

If not already installed:
- Download from: https://www.docker.com/products/docker-desktop
- Install and start Docker Desktop
- Restart PowerShell after installation

### 2. Install wrk (HTTP Benchmarking Tool)

**Option A: Using Chocolatey** (recommended)

```powershell
# If Chocolatey not installed, install it first
# Run PowerShell as Administrator:
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Then install wrk
choco install wrk -y

# Verify installation
wrk --version
```

**Option B: Manual Download**

1. Download wrk from: https://github.com/wg/wrk/releases
2. Extract to: `C:\Program Files\wrk\`
3. Add to PATH:
   ```powershell
   $env:Path += ";C:\Program Files\wrk"
   ```

### 3. Verify Docker is Running

```powershell
docker --version
docker ps
```

## Quick Start - Windows PowerShell

### Step 1: Navigate to Project

```powershell
# Navigate to Disha project
cd C:\Disha\temp_repo

# Verify you're in the right directory
ls docker-compose.staging.yml
```

### Step 2: Check Staging Services

```powershell
# View running containers
docker ps

# Or with compose (use new syntax on Windows)
docker compose -f docker-compose.staging.yml ps
```

**Expected output:**
```
CONTAINER ID   IMAGE               STATUS
abc123...      disha-staging-api   Up 10 minutes
def456...      postgres:16         Up 10 minutes
ghi789...      nginx:alpine        Up 10 minutes
jkl012...      prom/prometheus     Up 10 minutes
mno345...      grafana/grafana      Up 10 minutes
```

### Step 3: Verify Health Checks

```powershell
# Run verification script (PowerShell version)
powershell -ExecutionPolicy Bypass -File .\scripts\verify-staging-deployment.sh
```

Or manually verify:

```powershell
# Test API health
curl -s http://localhost:3000/health | ConvertFrom-Json | Select-Object status

# Should return: status: "ok"
```

### Step 4: Run Baseline Test (Terminal 1)

```powershell
# Windows doesn't have bash, so we'll use wrk directly

# Test 1: Health endpoint (30 seconds, 50 concurrent)
wrk -t4 -c50 -d30s --latency http://localhost:3000/health

# Test 2: Readiness probe
wrk -t4 -c50 -d30s --latency http://localhost:3000/health/ready

# Test 3: Metrics endpoint
wrk -t4 -c50 -d30s --latency http://localhost:3000/health/metrics

# Test 4: Deep check
wrk -t4 -c50 -d30s --latency http://localhost:3000/health/deep
```

**Expected Results:**
```
Requests/sec:        1500
Latency avg:         45ms
Latency p99:         85ms
Errors:              0
```

### Step 5: Start Monitoring (Terminal 2)

Open a new PowerShell window and run:

```powershell
# Real-time monitoring dashboard
$interval = 2
while ($true) {
    Clear-Host
    Write-Host "=== Disha Load Test Monitor ===" -ForegroundColor Cyan
    Write-Host "Time: $(Get-Date -Format 'HH:mm:ss')`n"
    
    try {
        $metrics = curl -s http://localhost:3000/health/metrics | ConvertFrom-Json
        
        Write-Host "API Metrics:" -ForegroundColor Yellow
        Write-Host "  Requests: $($metrics.api.requestCount)"
        Write-Host "  Errors: $($metrics.api.errorCount)"
        Write-Host "  Error Rate: $($metrics.api.errorRate)"
        Write-Host "  Avg Latency: $($metrics.api.averageResponseTime)ms"
        Write-Host "  P95 Latency: $($metrics.api.p95ResponseTime)ms`n"
        
        Write-Host "Memory:" -ForegroundColor Yellow
        Write-Host "  Heap: $($metrics.memory.heapUsed)MB / $($metrics.memory.heapTotal)MB"
        Write-Host "  Usage: $($metrics.memory.percentage)%`n"
        
        Write-Host "Database:" -ForegroundColor Yellow
        Write-Host "  Status: $($metrics.database.status)"
        Write-Host "  Response Time: $($metrics.database.responseTime)ms`n"
        
        $health = curl -s -w '%{http_code}' -o $null http://localhost:3000/health/ready
        if ($health -eq "200") {
            Write-Host "Health: $(Write-Host 'Ready' -ForegroundColor Green -NoNewline)"
        } else {
            Write-Host "Health: $(Write-Host 'Not Ready' -ForegroundColor Red -NoNewline)"
        }
    }
    catch {
        Write-Host "Error fetching metrics: $_" -ForegroundColor Red
    }
    
    Start-Sleep -Seconds $interval
}
```

### Step 6: Progressive Load Test (Terminal 1)

Run tests with gradually increasing concurrent users:

```powershell
# Stage 1: 10 users (Baseline)
Write-Host "Stage 1: 10 concurrent users" -ForegroundColor Cyan
wrk -t2 -c10 -d60s --latency http://localhost:3000/health

# Stage 2: 50 users (Light load)
Write-Host "`nStage 2: 50 concurrent users" -ForegroundColor Cyan
Start-Sleep -Seconds 10
wrk -t4 -c50 -d60s --latency http://localhost:3000/health

# Stage 3: 100 users (Moderate load)
Write-Host "`nStage 3: 100 concurrent users" -ForegroundColor Cyan
Start-Sleep -Seconds 10
wrk -t4 -c100 -d60s --latency http://localhost:3000/health

# Stage 4: 200 users (Heavy load)
Write-Host "`nStage 4: 200 concurrent users" -ForegroundColor Cyan
Start-Sleep -Seconds 10
wrk -t8 -c200 -d60s --latency http://localhost:3000/health

# Stage 5: 500 users (Stress test)
Write-Host "`nStage 5: 500 concurrent users" -ForegroundColor Cyan
Start-Sleep -Seconds 10
wrk -t16 -c500 -d60s --latency http://localhost:3000/health

# Stage 6: 1000 users (Peak load)
Write-Host "`nStage 6: 1000 concurrent users" -ForegroundColor Cyan
Start-Sleep -Seconds 10
wrk -t16 -c1000 -d60s --latency http://localhost:3000/health

Write-Host "`nProgressive load test complete!" -ForegroundColor Green
```

Save this as `progressive-load-test.ps1` and run:

```powershell
powershell -ExecutionPolicy Bypass -File progressive-load-test.ps1
```

### Step 7: Test Rate Limiting

```powershell
# Get authentication token
$response = curl -s -X POST http://localhost:3000/api/v2/auth/login `
  -H "Content-Type: application/json" `
  -d '{"email":"admin1@school.edu","password":"admin123"}' | ConvertFrom-Json

$token = $response.accessToken

# Test login rate limiting (should trigger after 5 requests)
Write-Host "Testing login rate limit..." -ForegroundColor Cyan
for ($i = 1; $i -le 10; $i++) {
    $status = curl -s -w '%{http_code}' -o $null -X POST http://localhost:3000/api/v2/auth/login `
      -H "Content-Type: application/json" `
      -d '{"email":"admin1@school.edu","password":"admin123"}'
    
    Write-Host "Request $i`: HTTP $status"
    Start-Sleep -Milliseconds 100
}

# Test API endpoint rate limiting
Write-Host "`nTesting API rate limit..." -ForegroundColor Cyan
$rateLimitTriggered = $false
for ($i = 1; $i -le 120; $i++) {
    $status = curl -s -w '%{http_code}' -o $null `
      -H "Authorization: Bearer $token" `
      http://localhost:3000/api/v2/schools
    
    if ($status -eq "429") {
        Write-Host "Rate limit triggered at request $i" -ForegroundColor Yellow
        $rateLimitTriggered = $true
        break
    }
    
    if ($i % 20 -eq 0) {
        Write-Host "Request $i`: HTTP $status"
    }
    
    Start-Sleep -Milliseconds 50
}

if ($rateLimitTriggered) {
    Write-Host "✅ Rate limiting is working correctly" -ForegroundColor Green
}
```

Save as `test-rate-limiting.ps1` and run:

```powershell
powershell -ExecutionPolicy Bypass -File test-rate-limiting.ps1
```

## Windows Helper Script - Complete Load Test

Create a file `run-load-tests.ps1`:

```powershell
# Disha Load Testing Suite for Windows

function Test-Prerequisites {
    Write-Host "=== Checking Prerequisites ===" -ForegroundColor Cyan
    
    # Check Docker
    try {
        $docker = docker --version
        Write-Host "✅ Docker: $docker" -ForegroundColor Green
    } catch {
        Write-Host "❌ Docker not found. Install from https://www.docker.com/products/docker-desktop" -ForegroundColor Red
        return $false
    }
    
    # Check wrk
    try {
        $wrk = wrk --version
        Write-Host "✅ wrk: $wrk" -ForegroundColor Green
    } catch {
        Write-Host "❌ wrk not found. Install with: choco install wrk -y" -ForegroundColor Red
        return $false
    }
    
    # Check Docker services
    try {
        $containers = docker ps | Select-String "disha-staging"
        if ($containers) {
            Write-Host "✅ Staging services running" -ForegroundColor Green
        } else {
            Write-Host "❌ Staging services not running" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "❌ Cannot connect to Docker" -ForegroundColor Red
        return $false
    }
    
    return $true
}

function Test-HealthEndpoint {
    Write-Host "`n=== Testing Health Endpoint ===" -ForegroundColor Cyan
    
    try {
        $response = curl -s http://localhost:3000/health | ConvertFrom-Json
        Write-Host "✅ Health endpoint responding" -ForegroundColor Green
        Write-Host "   Status: $($response.status)"
        return $true
    } catch {
        Write-Host "❌ Health endpoint not responding" -ForegroundColor Red
        return $false
    }
}

function Run-BaselineTest {
    Write-Host "`n=== Baseline Performance Test ===" -ForegroundColor Cyan
    Write-Host "Testing health endpoint with 50 concurrent users for 30 seconds`n"
    
    wrk -t4 -c50 -d30s --latency http://localhost:3000/health
}

function Run-ProgressiveLoadTest {
    Write-Host "`n=== Progressive Load Test ===" -ForegroundColor Cyan
    
    $stages = @(
        @{users = 10; desc = "Baseline"},
        @{users = 50; desc = "Light Load"},
        @{users = 100; desc = "Moderate Load"},
        @{users = 200; desc = "Heavy Load"},
        @{users = 500; desc = "Stress Test"},
        @{users = 1000; desc = "Peak Load"}
    )
    
    foreach ($stage in $stages) {
        Write-Host "`nStage: $($stage.desc) ($($stage.users) concurrent users)" -ForegroundColor Cyan
        Write-Host "Duration: 60 seconds`n"
        
        $threads = [Math]::Max(2, $stage.users / 50)
        wrk -t$threads -c$($stage.users) -d60s --latency http://localhost:3000/health
        
        if ($stage.users -lt 1000) {
            Write-Host "Cooling down for 10 seconds..." -ForegroundColor Gray
            Start-Sleep -Seconds 10
        }
    }
}

# Main execution
Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║        Disha v2.0 Load Testing Suite - Windows Edition      ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

if (-not (Test-Prerequisites)) {
    Write-Host "`n❌ Prerequisites check failed. Please install missing tools." -ForegroundColor Red
    exit 1
}

if (-not (Test-HealthEndpoint)) {
    Write-Host "`n❌ API not responding. Please start staging services:" -ForegroundColor Red
    Write-Host "   docker compose -f docker-compose.staging.yml up -d" -ForegroundColor Yellow
    exit 1
}

# Run tests
Run-BaselineTest
Run-ProgressiveLoadTest

Write-Host "`n✅ Load testing complete!" -ForegroundColor Green
Write-Host "Results will continue to be collected in the monitoring terminal." -ForegroundColor Yellow
```

Run the complete test suite:

```powershell
powershell -ExecutionPolicy Bypass -File run-load-tests.ps1
```

## Monitoring Dashboard - PowerShell Version

Create `monitor-load-test.ps1`:

```powershell
# Real-time monitoring dashboard for load tests

$refreshInterval = 2  # seconds

while ($true) {
    Clear-Host
    
    Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║    Disha Load Test Monitor - $(Get-Date -Format 'HH:mm:ss')                          ║" -ForegroundColor Cyan
    Write-Host "╚════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan
    
    try {
        # Fetch metrics
        $metricsJson = curl -s http://localhost:3000/health/metrics
        $metrics = $metricsJson | ConvertFrom-Json
        
        # API Metrics
        Write-Host "📊 API Metrics:" -ForegroundColor Yellow
        Write-Host "   Total Requests:    $($metrics.api.requestCount)"
        Write-Host "   Errors:            $($metrics.api.errorCount)"
        Write-Host "   Error Rate:        $($metrics.api.errorRate)"
        Write-Host "   Avg Response:      $($metrics.api.averageResponseTime)ms"
        Write-Host "   P95 Response:      $($metrics.api.p95ResponseTime)ms"
        Write-Host "   P99 Response:      $($metrics.api.p99ResponseTime)ms`n"
        
        # Memory Status
        Write-Host "💾 Memory Status:" -ForegroundColor Yellow
        $heapUsed = $metrics.memory.heapUsed
        $heapTotal = $metrics.memory.heapTotal
        $heapPercent = $metrics.memory.percentage
        
        Write-Host "   Heap:              $($heapUsed)MB / $($heapTotal)MB ($($heapPercent)%)"
        
        # Memory bar
        $filled = [Math]::Floor($heapPercent / 5)
        $empty = 20 - $filled
        $bar = "█" * $filled + "░" * $empty
        Write-Host "   Status:            [$bar]`n"
        
        # Database Status
        Write-Host "🗄️  Database Status:" -ForegroundColor Yellow
        Write-Host "   Status:            $($metrics.database.status)"
        Write-Host "   Response Time:     $($metrics.database.responseTime)ms"
        Write-Host "   Active Connections: $($metrics.database.activeConnections)`n"
        
        # Health Check
        $healthCode = curl -s -w '%{http_code}' -o $null http://localhost:3000/health/ready
        if ($healthCode -eq "200") {
            Write-Host "🟢 API Health:       Ready" -ForegroundColor Green
        } else {
            Write-Host "🔴 API Health:       HTTP $healthCode" -ForegroundColor Red
        }
        
        Write-Host "`n📋 Tips:" -ForegroundColor Cyan
        Write-Host "   • Memory % should stay <70% during tests"
        Write-Host "   • Error Rate should stay at 0%"
        Write-Host "   • P99 latency shows worst-case experience"
        Write-Host "   • Database latency >100ms indicates performance issues`n"
        
    } catch {
        Write-Host "⚠️  Error fetching metrics: $_" -ForegroundColor Red
        Write-Host "   Make sure the API is running and metrics endpoint is accessible`n"
    }
    
    Write-Host "Press Ctrl+C to stop monitoring`n" -ForegroundColor Gray
    Start-Sleep -Seconds $refreshInterval
}
```

Run:

```powershell
powershell -ExecutionPolicy Bypass -File monitor-load-test.ps1
```

## Complete Workflow - Step by Step

**Terminal 1:**

```powershell
# 1. Navigate to project
cd C:\Disha\temp_repo

# 2. Verify services
docker compose -f docker-compose.staging.yml ps

# 3. Run baseline test
wrk -t4 -c50 -d30s --latency http://localhost:3000/health

# 4. Run progressive test
powershell -ExecutionPolicy Bypass -File run-load-tests.ps1
```

**Terminal 2 (simultaneously):**

```powershell
# Start monitoring
powershell -ExecutionPolicy Bypass -File monitor-load-test.ps1
```

## Troubleshooting on Windows

### "wrk: The term is not recognized"

```powershell
# Install with Chocolatey
choco install wrk -y

# Or manually download and add to PATH
$env:Path += ";C:\Program Files\wrk"
wrk --version
```

### "Docker daemon is not running"

```powershell
# Start Docker Desktop
# Or if using Docker CLI without Desktop:
docker run hello-world
```

### "Cannot connect to Docker"

```powershell
# Reset Docker
docker system prune -a
docker-compose down -v
docker-compose -f docker-compose.staging.yml up -d
```

### "Staging services not running"

```powershell
# Check status
docker compose -f docker-compose.staging.yml ps

# Start services
docker compose -f docker-compose.staging.yml up -d

# Check logs
docker compose -f docker-compose.staging.yml logs api-staging
```

## Performance Targets for Windows

Expected results on Windows (similar to Linux):

- ✅ **Baseline (10-50 users)**: >1000 req/s, <100ms latency
- ✅ **Light load (100 users)**: >500 req/s, <150ms latency
- ⚠️ **Heavy load (200+ users)**: >200 req/s, <300ms latency
- ❌ **Stress (1000 users)**: Should survive, latency >200ms acceptable

## Success Criteria

After load testing on Windows:

- [ ] Baseline test completes with HTTP 200 responses
- [ ] Progressive test runs all 6 stages without crashes
- [ ] Memory stays stable (doesn't grow continuously)
- [ ] Error rate stays at 0% until capacity limit
- [ ] Rate limiting test shows 429 responses
- [ ] Monitoring dashboard updates in real-time
- [ ] No unexpected Docker container crashes

---

**You're now ready to run load tests on Windows! 🚀**
