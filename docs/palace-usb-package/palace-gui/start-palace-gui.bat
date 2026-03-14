@echo off
echo ============================================
echo   THE PALACE — GUI Control Panel
echo   Chaos (#44) — Infrastructure
echo ============================================
echo.

cd /d "%~dp0"

if not exist node_modules (
    echo [SETUP] First run detected. Installing dependencies...
    npm install
    if errorlevel 1 (
        echo [ERROR] npm install failed. Check Node.js is installed.
        pause
        exit /b 1
    )
    echo [SETUP] Dependencies installed.
    echo.
)

echo [START] Launching Palace GUI on http://localhost:7070
echo [START] Opening browser...
start http://localhost:7070

echo [START] Starting server...
node server.js

echo.
echo ============================================
echo   Palace GUI has stopped.
echo   Press any key to exit.
echo ============================================
pause
