@echo off
cls
cd /d "%~dp0"

echo ========================================
echo   START BACKEND ONLY
echo ========================================
echo.

echo Killing old processes on port 3002...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3002" ^| findstr "LISTENING"') do (
    taskkill /PID %%a /F >nul 2>&1
)
echo.

cd backend
if exist ensure-env.js (
    echo Ensuring PORT=3002 in .env...
    call node ensure-env.js >nul 2>&1
)
if not exist node_modules (
    echo Installing dependencies...
    call npm install
)

echo Starting backend on port 3002...
start "Backend (3002)" cmd /k "cd /d %~dp0backend && npm run start:dev"

echo.
echo ✅ Backend starting...
echo.
echo ⏱️  Wait 10-15 seconds
echo 🌐 Backend will be at: http://localhost:3002/api
echo.
pause
