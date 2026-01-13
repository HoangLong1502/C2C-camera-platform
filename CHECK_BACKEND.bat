@echo off
cls
cd /d "%~dp0"

echo ========================================
echo   CHECK BACKEND STATUS
echo ========================================
echo.

echo Checking port 3001...
netstat -ano | findstr ":3001" | findstr "LISTENING" >nul 2>&1
if errorlevel 1 (
    echo ❌ Backend is NOT running on port 3001
    echo.
    echo To start backend:
    echo   START_BACKEND.bat
    echo   OR
    echo   cd backend && npm run start:dev
) else (
    echo ✅ Backend is running on port 3001
    echo.
    echo Testing connection...
    curl -s http://localhost:3001/api >nul 2>&1
    if errorlevel 1 (
        echo ⚠️  Backend is running but not responding
    ) else (
        echo ✅ Backend is responding correctly
    )
)

echo.
echo Backend URL: http://localhost:3001/api
echo.
pause
