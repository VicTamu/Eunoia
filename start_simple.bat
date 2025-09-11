@echo off
echo ============================================================
echo 🌟 Eunoia Journal - Simple Startup 🌟
echo ============================================================
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

REM Start backend in a new window
echo 🚀 Starting Backend Server...
start "Eunoia Backend" cmd /k "cd /d %~dp0backend && python -c \"import uvicorn; from main import app; uvicorn.run(app, host='0.0.0.0', port=8000, log_level='info')\""

REM Wait for backend to start
echo ⏳ Waiting for backend to start...
timeout /t 5 /nobreak >nul

REM Start frontend in a new window
echo 🎨 Starting Frontend Server...
start "Eunoia Frontend" cmd /k "cd /d %~dp0frontend && npm start"

echo.
echo ✅ Both servers are starting!
echo.
echo 🌐 Access your app at:
echo    Frontend: http://localhost:3000
echo    Backend:  http://localhost:8000
echo    API Docs: http://localhost:8000/docs
echo.
echo 📝 The app will open in your browser automatically
echo.
echo Press any key to close this window...
pause >nul
