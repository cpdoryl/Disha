# Quick Start: Backend API for Load Testing
# This script starts the backend API locally (connects to Docker PostgreSQL)

param(
    [switch]$Install = $false,
    [switch]$Build = $false
)

Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   Disha Backend - Local Startup for Load Testing          ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# Check if PostgreSQL is running
Write-Host "=== Checking PostgreSQL ===" -ForegroundColor Yellow
try {
    $pgReady = Test-NetConnection -ComputerName localhost -Port 5432 -ErrorAction Stop -WarningAction SilentlyContinue
    if ($pgReady.TcpTestSucceeded) {
        Write-Host "✅ PostgreSQL is running on localhost:5432" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ PostgreSQL not accessible on localhost:5432" -ForegroundColor Red
    Write-Host "   Start it with: docker compose -f docker-compose.staging.yml up -d postgres-staging`n" -ForegroundColor Yellow
    exit 1
}

# Navigate to backend
Write-Host "`n=== Setting Up Backend ===" -ForegroundColor Yellow
cd backend

# Install dependencies if needed
if ($Install -or -not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Cyan
    npm install
}

# Build if needed
if ($Build -or -not (Test-Path "dist")) {
    Write-Host "Building project..." -ForegroundColor Cyan
    npm run build
}

Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   Starting Backend API...                                 ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

Write-Host "Configuration:" -ForegroundColor Yellow
Write-Host "  NODE_ENV: staging"
Write-Host "  PORT: 3000"
Write-Host "  DB_HOST: localhost"
Write-Host "  DB_PORT: 5432"
Write-Host "  DB_NAME: disha_staging_db`n"

Write-Host "API will be ready at: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Health check: http://localhost:3000/health`n" -ForegroundColor Cyan

Write-Host "Starting application..." -ForegroundColor Green
Write-Host "(Press Ctrl+C to stop)`n" -ForegroundColor Gray

# Set environment
$env:NODE_ENV = "staging"
$env:PORT = 3000
$env:DB_HOST = "localhost"
$env:DB_PORT = 5432
$env:DB_USERNAME = "staging_user"
$env:DB_PASSWORD = "staging_password_change_me"
$env:DB_NAME = "disha_staging_db"

# Start the application
npm start
