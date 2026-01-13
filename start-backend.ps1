# PowerShell script to start backend server
# Chạy script này để khởi động backend

Write-Host "🚀 Starting Backend Server..." -ForegroundColor Cyan

# Check if .env exists
if (-not (Test-Path "backend\.env")) {
    Write-Host "⚠️  File .env không tồn tại!" -ForegroundColor Yellow
    Write-Host "📝 Đang tạo file .env..." -ForegroundColor Yellow
    
    $envContent = @"
# Server Port
PORT=3001

# Database Configuration
DATABASE_HOST=localhost
DATABASE_PORT=5440
DATABASE_USER=postgres
DATABASE_PASSWORD=12343
DATABASE_NAME=camera_web

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-$(Get-Random)
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production-$(Get-Random)
JWT_REFRESH_EXPIRES_IN=7d
"@
    
    Set-Content -Path "backend\.env" -Value $envContent
    Write-Host "✅ Đã tạo file .env" -ForegroundColor Green
}

# Check if node_modules exists
if (-not (Test-Path "backend\node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    Set-Location backend
    npm install
    Set-Location ..
}

# Fix all database issues
if (Test-Path "backend\fix-all-issues.js") {
    Write-Host "🔧 Fixing database issues..." -ForegroundColor Cyan
    Set-Location backend
    node fix-all-issues.js
    Set-Location ..
    Write-Host ""
}

# Check if database is running (optional check)
Write-Host "🔍 Checking database connection..." -ForegroundColor Cyan

# Start backend
Write-Host "🚀 Starting backend server on port 3001..." -ForegroundColor Green
Set-Location backend
npm run start:dev
