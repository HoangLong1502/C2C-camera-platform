@echo off
cls
cd /d "%~dp0"

echo ========================================
echo   FINAL - START PROJECT
echo ========================================
echo.

REM Check if Docker is running
echo [0/6] Checking Docker...
docker ps >nul 2>&1
if errorlevel 1 (
    echo    ⚠️  Docker not running or not installed
    echo    Please start Docker Desktop first
    echo.
    pause
    exit /b 1
)

REM Check if database container is running
docker ps | findstr "camera_store_db" >nul 2>&1
if errorlevel 1 (
    echo    ⚠️  Database container not running
    echo    Starting database...
    docker-compose up -d postgres
    timeout /t 5 /nobreak >nul
    echo    ✅ Database starting...
) else (
    echo    ✅ Database container is running
)
echo.

echo [1/6] Killing old processes...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000" ^| findstr "LISTENING"') do (
    taskkill /PID %%a /F >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3002" ^| findstr "LISTENING"') do (
    echo    Killing process %%a on port 3002...
    taskkill /PID %%a /F >nul 2>&1
)
timeout /t 2 /nobreak >nul
echo ✅ Old processes killed
echo.

echo [2/6] Cleaning Next.js cache...
if exist "frontend\.next" (
    rmdir /s /q "frontend\.next" >nul 2>&1
    echo ✅ Next.js cache cleaned
)
echo.

echo [3/6] Setting up database...
cd backend
if not exist .env (
    echo    ⚠️  .env file not found
    echo    Creating .env from env.example...
    if exist env.example (
        copy env.example .env >nul 2>&1
        echo    ✅ .env file created
    ) else (
        echo    ⚠️  env.example not found, using defaults
    )
)
if exist ensure-env.js (
    echo    Ensuring PORT=3002 in .env...
    call node ensure-env.js >nul 2>&1
)
if exist setup-database.js (
    echo    Running database setup...
    call node setup-database.js
    if errorlevel 1 (
        echo    ⚠️  Database setup had errors, but continuing...
    )
) else if exist fix-all-database-issues.js (
    call node fix-all-database-issues.js
    if errorlevel 1 (
        echo    ⚠️  Fix script had errors, but continuing...
    )
)
cd ..
echo ✅ Database ready
echo.

echo [4/6] Starting Backend...
cd backend
if not exist node_modules (
    echo    Installing backend dependencies...
    call npm install
)
start "Backend (3002)" cmd /k "cd /d %~dp0backend && npm run start:dev"
cd ..
timeout /t 5 /nobreak >nul
echo ✅ Backend starting
echo.

echo [5/6] Starting Frontend...
cd frontend
if not exist node_modules (
    echo    Installing frontend dependencies...
    call npm install
)
start "Frontend (3000)" cmd /k "cd /d %~dp0frontend && npm run dev"
cd ..
echo ✅ Frontend starting
echo.

echo [6/6] Waiting for servers...
timeout /t 10 /nobreak >nul
echo.

echo ========================================
echo   ✅ ALL SERVERS STARTING
echo ========================================
echo.
echo ⏱️  Wait 15-20 seconds for servers to fully start
echo.
echo 📋 Check the new windows:
echo    - Backend (3002): http://localhost:3002/api
echo    - Frontend (3000): http://localhost:3000
echo.
echo 🌐 Then open: http://localhost:3000
echo.
echo ========================================
echo   USEFUL COMMANDS
echo ========================================
echo.
echo Check health:
echo   node check-health.js
echo.
echo Fix database:
echo   setup-database.bat
echo.
echo Drop all tables (fresh start):
echo   drop-database.bat
echo.
echo Reset entire database:
echo   reset-database.bat
echo.
echo Check Docker:
echo   docker ps
echo.
pause
