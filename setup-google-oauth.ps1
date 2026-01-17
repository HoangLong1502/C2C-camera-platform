# Script to help setup Google OAuth
# Run this script: .\setup-google-oauth.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SETUP GOOGLE OAUTH" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env.local exists in frontend
$frontendEnvPath = "frontend\.env.local"
if (-not (Test-Path $frontendEnvPath)) {
    Write-Host "[1/3] Creating frontend/.env.local..." -ForegroundColor Yellow
    $frontendEnvContent = @"
# Google OAuth Configuration
# Get your Client ID from: https://console.cloud.google.com/
# See SETUP_GOOGLE_OAUTH.md for detailed instructions

NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id-here

# Backend API URL (optional, defaults to http://localhost:3002/api)
NEXT_PUBLIC_API_URL=http://localhost:3002/api
"@
    $frontendEnvContent | Out-File -FilePath $frontendEnvPath -Encoding utf8
    Write-Host "  ✅ Created frontend/.env.local" -ForegroundColor Green
} else {
    Write-Host "[1/3] frontend/.env.local already exists" -ForegroundColor Green
}

# Check backend .env
$backendEnvPath = "backend\.env"
if (Test-Path $backendEnvPath) {
    Write-Host "[2/3] Checking backend/.env..." -ForegroundColor Yellow
    $backendEnvContent = Get-Content $backendEnvPath -Raw
    
    if ($backendEnvContent -notmatch "GOOGLE_CLIENT_ID") {
        Write-Host "  ⚠️  GOOGLE_CLIENT_ID not found in backend/.env" -ForegroundColor Yellow
        Write-Host "  Please add these lines to backend/.env:" -ForegroundColor Yellow
        Write-Host "    GOOGLE_CLIENT_ID=your-google-client-id-here" -ForegroundColor Gray
        Write-Host "    GOOGLE_CLIENT_SECRET=your-google-client-secret-here" -ForegroundColor Gray
    } else {
        Write-Host "  ✅ Google OAuth config found in backend/.env" -ForegroundColor Green
    }
} else {
    Write-Host "[2/3] ⚠️  backend/.env not found" -ForegroundColor Yellow
    Write-Host "  Please create it from backend/env.example" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "[3/3] Next steps:" -ForegroundColor Cyan
Write-Host "  1. Get Google Client ID from: https://console.cloud.google.com/" -ForegroundColor White
Write-Host "  2. Update frontend/.env.local with your Client ID" -ForegroundColor White
Write-Host "  3. Update backend/.env with your Client ID and Client Secret" -ForegroundColor White
Write-Host "  4. Restart both backend and frontend servers" -ForegroundColor White
Write-Host ""
Write-Host "📖 See SETUP_GOOGLE_OAUTH.md for detailed instructions" -ForegroundColor Cyan
Write-Host ""
