@echo off
cls
cd /d "%~dp0"

echo ========================================
echo   KILL PROCESS ON PORT 3001
echo ========================================
echo.

echo Finding process on port 3001...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3001" ^| findstr "LISTENING"') do (
    echo    Found process: %%a
    echo    Killing process %%a...
    taskkill /PID %%a /F >nul 2>&1
    if errorlevel 1 (
        echo    ⚠️  Could not kill process %%a
    ) else (
        echo    ✅ Process %%a killed
    )
)

echo.
echo Checking port 3001 again...
netstat -ano | findstr ":3001" | findstr "LISTENING" >nul 2>&1
if errorlevel 1 (
    echo ✅ Port 3001 is now free
) else (
    echo ⚠️  Port 3001 is still in use
)

echo.
pause
