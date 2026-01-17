@echo off
cls
cd /d "%~dp0"

echo ========================================
echo   SETUP GOOGLE OAUTH
echo ========================================
echo.

REM Check if frontend/.env.local exists
if not exist "frontend\.env.local" (
    echo [1/3] Creating frontend/.env.local...
    (
        echo # Google OAuth Configuration
        echo # Get your Client ID from: https://console.cloud.google.com/
        echo # See SETUP_GOOGLE_OAUTH.md for detailed instructions
        echo.
        echo NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id-here
        echo.
        echo # Backend API URL (optional, defaults to http://localhost:3002/api)
        echo NEXT_PUBLIC_API_URL=http://localhost:3002/api
    ) > "frontend\.env.local"
    echo   ✅ Created frontend/.env.local
) else (
    echo [1/3] frontend/.env.local already exists
)

REM Check backend .env
if exist "backend\.env" (
    echo [2/3] Checking backend/.env...
    findstr /C:"GOOGLE_CLIENT_ID" "backend\.env" >nul 2>&1
    if errorlevel 1 (
        echo   ⚠️  GOOGLE_CLIENT_ID not found in backend/.env
        echo   Please add these lines to backend/.env:
        echo     GOOGLE_CLIENT_ID=your-google-client-id-here
        echo     GOOGLE_CLIENT_SECRET=your-google-client-secret-here
    ) else (
        echo   ✅ Google OAuth config found in backend/.env
    )
) else (
    echo [2/3] ⚠️  backend/.env not found
    echo   Please create it from backend/env.example
)

echo.
echo [3/3] Next steps:
echo   1. Get Google Client ID from: https://console.cloud.google.com/
echo   2. Update frontend/.env.local with your Client ID
echo   3. Update backend/.env with your Client ID and Client Secret
echo   4. Restart both backend and frontend servers
echo.
echo 📖 See SETUP_GOOGLE_OAUTH.md for detailed instructions
echo.
pause
