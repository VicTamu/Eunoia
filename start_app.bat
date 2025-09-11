@echo off
echo ============================================================
echo 🌟 Welcome to Eunoia Journal! 🌟
echo ============================================================
echo.
echo Starting the complete application...
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed or not in PATH
    echo Please install Python 3.8+ and try again
    pause
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed or not in PATH
    echo Please install Node.js 16+ and try again
    pause
    exit /b 1
)

echo ✅ Python and Node.js are installed
echo.

REM Start the application
python start_app.py

REM If the above fails, try manual start
if errorlevel 1 (
    echo.
    echo Trying manual startup...
    echo.
    
    REM Start backend
    echo Starting backend...
    start "Eunoia Backend" cmd /k "cd /d %~dp0backend && python -c \"import uvicorn; from main import app; uvicorn.run(app, host='0.0.0.0', port=8000, log_level='info')\""
    
    REM Wait a moment
    timeout /t 5 /nobreak >nul
    
    REM Start frontend
    echo Starting frontend...
    start "Eunoia Frontend" cmd /k "cd /d %~dp0frontend && npm start"
    
    echo.
    echo Both servers should be starting...
    echo Backend: http://localhost:8000
    echo Frontend: http://localhost:3000
    echo.
    echo Press any key to close this window...
    pause >nul
)

pause
