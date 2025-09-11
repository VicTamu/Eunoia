# 🚀 Eunoia Journal - Project Setup Guide

## 📋 Prerequisites & PATH Setup

### ✅ Required Software
- **Python 3.11+** - For backend API and ML services
- **Node.js 16+** - For React frontend
- **npm** - Node package manager (comes with Node.js)

### 🔧 PATH Configuration

#### Current PATH Status
Your system PATH has been configured with the following directories:

```
✅ Node.js: C:\Program Files\nodejs\
✅ npm: C:\Users\Vekek\AppData\Roaming\npm
✅ Python Scripts: C:\Users\Vekek\AppData\Local\Packages\PythonSoftwareFoundation.Python.3.11_qbz5n2kfra8p0\LocalCache\local-packages\Python311\Scripts
✅ Python Executable: C:\Users\Vekek\AppData\Local\Packages\PythonSoftwareFoundation.Python.3.11_qbz5n2kfra8p0\LocalCache\local-packages\Python311
```

#### To Verify PATH Setup
1. **Restart your terminal/command prompt**
2. Run these commands to verify:
   ```bash
   python --version
   node --version
   npm --version
   pip --version
   ```

## 🏗️ Project Structure

```
Eunoia/
├── backend/                 # FastAPI backend
│   ├── main.py             # Main API server
│   ├── ml_service.py       # AI/ML analysis service
│   ├── requirements.txt    # Python dependencies
│   └── eunoia_journal.db  # SQLite database
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── services/       # API service layer
│   │   └── types/          # TypeScript types
│   └── package.json        # Node.js dependencies
├── start_simple.bat        # Quick start script
├── start_app.bat          # Advanced start script
└── setup_path.bat         # PATH setup script
```

## 🚀 Quick Start

### Option 1: Simple Start (Recommended)
```bash
.\start_simple.bat
```

### Option 2: Manual Start
```bash
# Terminal 1 - Backend
cd backend
python -c "import uvicorn; from main import app; uvicorn.run(app, host='0.0.0.0', port=8000, log_level='info')"

# Terminal 2 - Frontend
cd frontend
npm start
```

## 🧠 AI/ML Features

### Enhanced Emotion Analysis
- **27 GoEmotions Categories** (Google's emotion dataset)
- **Multi-label Classification** (detects multiple emotions)
- **Enhanced Stress Analysis** (uses emotional context)
- **Confidence Scoring** (accuracy indicators)

### Emotion Categories
**Positive:** Joy, Love, Gratitude, Pride, Relief, Excitement, Optimism, Admiration, Amusement, Approval, Caring

**Negative:** Sadness, Anger, Fear, Disgust, Grief, Remorse, Disappointment, Nervousness, Embarrassment, Annoyance, Disapproval

**Neutral:** Confusion, Curiosity, Desire, Realization, Surprise

## 🔧 Development Setup

### Backend Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### Frontend Dependencies
```bash
cd frontend
npm install
```

### Database Setup
The SQLite database is automatically created and populated with sample data on first run.

## 🌐 API Endpoints

- **GET /** - Health check
- **POST /entries/** - Create journal entry
- **GET /entries/** - Get all entries
- **GET /entries/{id}** - Get specific entry
- **GET /analytics/sentiment-trends** - Get mood trends
- **GET /analytics/insights** - Get AI insights

## 🎯 Future Project Setup

### For New Python Projects
1. Create virtual environment:
   ```bash
   python -m venv venv
   venv\Scripts\activate
   ```

2. Install packages:
   ```bash
   pip install fastapi uvicorn sqlalchemy
   ```

### For New React Projects
1. Create new project:
   ```bash
   npx create-react-app my-app --template typescript
   cd my-app
   ```

2. Install additional packages:
   ```bash
   npm install axios recharts lucide-react
   ```

## 🐛 Troubleshooting

### Python Issues
- **"python not found"**: Restart terminal after PATH setup
- **"pip not found"**: Ensure Python Scripts directory is in PATH
- **Module import errors**: Check virtual environment activation

### Node.js Issues
- **"node not found"**: Verify Node.js installation
- **"npm not found"**: Check npm installation
- **Package errors**: Delete node_modules and run npm install

### Database Issues
- **Database locked**: Stop all running instances
- **Migration errors**: Delete database file to recreate

## 📚 Additional Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://reactjs.org/docs/)
- [GoEmotions Dataset](https://github.com/google-research/google-research/tree/master/goemotions)
- [Hugging Face Transformers](https://huggingface.co/transformers/)

## 🎉 Success!

Your Eunoia Journal is now fully configured with enhanced AI emotion analysis capabilities. The PATH is set up for future projects, and all dependencies are properly installed.

**Happy coding!** 🚀
