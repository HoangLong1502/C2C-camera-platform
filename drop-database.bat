@echo off
cls
cd /d "%~dp0"

echo ========================================
echo   DROP ALL DATABASE TABLES
echo ========================================
echo.
echo ⚠️  WARNING: This will DELETE ALL TABLES!
echo    TypeORM will recreate them when you start backend.
echo.
pause

cd backend
if exist drop-all-tables.js (
    echo Running drop script...
    node drop-all-tables.js
) else (
    echo ❌ drop-all-tables.js not found
)
cd ..

echo.
pause
