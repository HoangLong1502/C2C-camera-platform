@echo off
cls
cd /d "%~dp0"

echo ========================================
echo   SETUP DATABASE
echo ========================================
echo.

cd backend
if exist setup-database.js (
    echo Running database setup...
    node setup-database.js
) else if exist fix-all-database-issues.js (
    echo Running database fix...
    node fix-all-database-issues.js
) else (
    echo ❌ No database setup script found
    echo.
    echo Available scripts:
    dir /b *.js
)
cd ..

echo.
pause
