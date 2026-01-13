@echo off
cls
cd /d "%~dp0"

echo ========================================
echo   RESET DATABASE (DROP AND RECREATE)
echo ========================================
echo.
echo ⚠️  WARNING: This will DELETE the entire database!
echo    All data will be lost!
echo    TypeORM will recreate it when you start backend.
echo.
echo Are you sure? (Press Ctrl+C to cancel)
pause

cd backend
if exist reset-database.js (
    echo Running reset script...
    node reset-database.js
) else (
    echo ❌ reset-database.js not found
)
cd ..

echo.
pause
