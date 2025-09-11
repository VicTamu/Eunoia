@echo off
title Eunoia Journal - Starting...
color 0A

echo ============================================================
echo 🌟 EUNOIA JOURNAL - ONE-CLICK STARTUP 🌟
echo ============================================================
echo.
echo This will start the complete Eunoia Journal application:
echo   • Backend API server (Python/FastAPI)
echo   • Frontend web app (React/TypeScript)
echo   • Sample data creation
echo   • Automatic browser opening
echo.
echo Press any key to continue or close this window to cancel...
pause >nul

echo.
echo 🚀 Starting Eunoia Journal...
echo.

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed or not in PATH
    echo Please install Python 3.8+ and try again
    echo.
    echo Download Python from: https://www.python.org/downloads/
    pause
    exit /b 1
)

REM Run the Python startup script
python start_eunoia.py

REM If we get here, the script has ended
echo.
echo 👋 Eunoia Journal has been stopped.
pause
