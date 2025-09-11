@echo off
echo ============================================================
echo 🔧 Eunoia Journal - PATH Setup for Future Projects
echo ============================================================

echo.
echo 📋 Current PATH directories:
echo %PATH%
echo.

echo.
echo 🔍 Checking current installations...

REM Check Python
python --version >nul 2>&1
if %errorlevel%==0 (
    echo ✅ Python is accessible
    python --version
) else (
    echo ❌ Python not found in PATH
)

REM Check Node.js
node --version >nul 2>&1
if %errorlevel%==0 (
    echo ✅ Node.js is accessible
    node --version
) else (
    echo ❌ Node.js not found in PATH
)

REM Check npm
npm --version >nul 2>&1
if %errorlevel%==0 (
    echo ✅ npm is accessible
    npm --version
) else (
    echo ❌ npm not found in PATH
)

echo.
echo 🔧 Adding Python Scripts to PATH...
setx PATH "%PATH%;C:\Users\Vekek\AppData\Local\Packages\PythonSoftwareFoundation.Python.3.11_qbz5n2kfra8p0\LocalCache\local-packages\Python311\Scripts" >nul 2>&1
if %errorlevel%==0 (
    echo ✅ Python Scripts directory added to PATH
) else (
    echo ❌ Failed to add Python Scripts to PATH
)

echo.
echo 🔧 Adding Python executable to PATH...
setx PATH "%PATH%;C:\Users\Vekek\AppData\Local\Packages\PythonSoftwareFoundation.Python.3.11_qbz5n2kfra8p0\LocalCache\local-packages\Python311" >nul 2>&1
if %errorlevel%==0 (
    echo ✅ Python executable directory added to PATH
) else (
    echo ❌ Failed to add Python executable to PATH
)

echo.
echo 📝 PATH Setup Complete!
echo.
echo ⚠️  IMPORTANT: You need to restart your terminal/command prompt
echo    for the PATH changes to take effect.
echo.
echo 🚀 After restarting, you can run:
echo    - python --version
echo    - node --version
echo    - npm --version
echo    - pip --version
echo.
echo Press any key to close...
pause >nul
