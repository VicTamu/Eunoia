@echo off
echo ============================================================
echo 🔍 Eunoia Journal - Setup Verification
echo ============================================================

echo.
echo 📋 Checking all required tools...

REM Check Python
echo.
echo 🐍 Python:
python --version >nul 2>&1
if %errorlevel%==0 (
    echo ✅ Python is working
    python --version
) else (
    echo ❌ Python not found
)

REM Check pip
echo.
echo 📦 pip:
pip --version >nul 2>&1
if %errorlevel%==0 (
    echo ✅ pip is working
    pip --version
) else (
    echo ❌ pip not found
)

REM Check Node.js
echo.
echo 🟢 Node.js:
node --version >nul 2>&1
if %errorlevel%==0 (
    echo ✅ Node.js is working
    node --version
) else (
    echo ❌ Node.js not found
)

REM Check npm
echo.
echo 📦 npm:
npm --version >nul 2>&1
if %errorlevel%==0 (
    echo ✅ npm is working
    npm --version
) else (
    echo ❌ npm not found
)

REM Check Git
echo.
echo 🔧 Git:
git --version >nul 2>&1
if %errorlevel%==0 (
    echo ✅ Git is working
    git --version
) else (
    echo ❌ Git not found
)

echo.
echo ============================================================
echo 🎉 Setup Verification Complete!
echo ============================================================
echo.
echo If all items show ✅, your development environment is ready!
echo If any items show ❌, you may need to install or configure them.
echo.
echo Press any key to close...
pause >nul
