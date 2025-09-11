# 🚀 Eunoia Journal - Manual Startup Guide

If the automatic startup scripts don't work, follow these manual steps:

## Method 1: Two Terminal Windows (Recommended)

### Terminal 1 - Backend
```bash
cd backend
python -c "import uvicorn; from main import app; uvicorn.run(app, host='0.0.0.0', port=8000, log_level='info')"
```

### Terminal 2 - Frontend
```bash
cd frontend
npm start
```

## Method 2: PowerShell Commands

### Backend (Run in PowerShell)
```powershell
cd backend
python -c "import uvicorn; from main import app; uvicorn.run(app, host='0.0.0.0', port=8000, log_level='info')"
```

### Frontend (Run in new PowerShell window)
```powershell
cd frontend
npm start
```

## Method 3: Using the Fixed Batch File

1. Double-click `start_app.bat` in your Eunoia folder
2. If it fails, it will automatically try the manual method

## 🌐 Access the App

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## ✅ What Should Happen

1. Backend starts and shows: `Uvicorn running on http://0.0.0.0:8000`
2. Frontend starts and opens in your browser at http://localhost:3000
3. You can write journal entries and see AI analysis
4. Dashboard shows mood trends and insights

## 🔧 Troubleshooting

If you get errors:
1. Make sure you're in the correct directory
2. Check that Python and Node.js are installed
3. Try running the test script first: `python backend/test_api.py`

## 📱 Features to Test

1. **Write Tab**: Create a journal entry
2. **Dashboard Tab**: View mood trends and AI insights
3. **Entries Tab**: Browse your past entries

The app comes with sample data, so you'll see charts and insights immediately!
