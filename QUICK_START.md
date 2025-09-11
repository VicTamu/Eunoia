# 🚀 Eunoia Journal - Quick Start Guide

## One-Click Startup Options

Choose any of these methods to start the complete Eunoia Journal application:

### Option 1: Double-Click (Windows) - **RECOMMENDED**
- **Double-click `START_EUNOIA.bat`**
- This will automatically start both backend and frontend servers
- The app will open in your browser automatically

### Option 2: PowerShell (Windows)
- **Right-click `Start-Eunoia.ps1` → "Run with PowerShell"**
- Or open PowerShell and run: `.\Start-Eunoia.ps1`

### Option 3: Python Script (All Platforms)
- **Run: `python start_eunoia.py`**
- Works on Windows, Mac, and Linux

## What Happens When You Start

1. ✅ **Dependency Check** - Verifies Python and Node.js are installed
2. 📦 **Auto-Install** - Installs missing Python and npm dependencies
3. 📊 **Sample Data** - Creates demo journal entries for immediate testing
4. 🚀 **Backend Server** - Starts FastAPI server on port 8000
5. 🎨 **Frontend Server** - Starts React app on port 3000
6. 🌐 **Browser Launch** - Opens the app automatically in your browser

## Access Points

Once started, you can access:

- **🌐 Main App**: http://localhost:3000
- **🔧 Backend API**: http://localhost:8000
- **📚 API Documentation**: http://localhost:8000/docs

## Features Available

- **📝 Write Tab**: Create journal entries with AI analysis
- **📊 Dashboard Tab**: View mood trends and AI insights
- **📋 Entries Tab**: Browse past entries with search and filtering
- **🤖 AI Analysis**: Real-time sentiment analysis and emotion detection

## Stopping the App

- **Press `Ctrl+C`** in the terminal/command prompt
- Or close the terminal window
- Both servers will stop automatically

## Troubleshooting

### If the app doesn't start:
1. Make sure Python 3.8+ is installed
2. Make sure Node.js 16+ is installed
3. Check that ports 3000 and 8000 are not in use
4. Try running the manual startup guide: `MANUAL_START.md`

### If you get permission errors (PowerShell):
- Run PowerShell as Administrator
- Or run: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`

## System Requirements

- **Python**: 3.8 or higher
- **Node.js**: 16 or higher
- **RAM**: 4GB minimum (8GB recommended for AI models)
- **Storage**: 2GB free space for dependencies

## Need Help?

- Check the main `README.md` for detailed documentation
- Review `API_DOCUMENTATION.md` for backend details
- See `MANUAL_START.md` for manual startup instructions

---

**🌟 Enjoy your AI-powered journaling experience with Eunoia! 🌟**
