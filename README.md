# Eunoia Journal 📝

An AI-powered journaling web application that analyzes your daily entries for sentiment, emotions, and stress patterns, providing gentle reflections and coping suggestions.

## 🌟 Features

### MVP Features
- **📝 Journal Entry Input**: Clean, intuitive interface for writing daily entries
- **🤖 AI Sentiment Analysis**: Real-time analysis of mood, emotions, and stress levels
- **📊 Mood Trend Visualization**: Interactive charts showing your emotional patterns over time
- **💡 AI Reflections**: Personalized insights and gentle coping suggestions
- **🔒 Privacy-First**: Local data storage with clear privacy disclaimers

### Tech Stack
- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: FastAPI + Python
- **Database**: SQLite
- **AI/ML**: Hugging Face Transformers (sentiment analysis & emotion detection)
- **Charts**: Recharts for data visualization

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- Python 3.8 or higher
- pip (Python package manager)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Eunoia
   ```

2. **Set up the Backend**
   ```bash
   cd backend
   pip install -r requirements.txt
   python start.py
   ```
   The API will be available at `http://localhost:8000`

3. **Set up the Frontend** (in a new terminal)
   ```bash
   cd frontend
   npm install
   npm start
   ```
   The app will be available at `http://localhost:3000`

## 📱 Usage

1. **Write Entries**: Use the "Write" tab to create daily journal entries
2. **View Dashboard**: Check the "Dashboard" tab for mood trends and AI insights
3. **Browse Entries**: Use the "Entries" tab to review your past journal entries

## 🧠 AI Analysis

The app uses pre-trained models to analyze:
- **Sentiment**: Positive, negative, or neutral mood
- **Emotions**: Joy, sadness, anger, fear, surprise, etc.
- **Stress Levels**: Based on keywords and emotional indicators

## ⚠️ Important Disclaimers

- **Privacy**: This is a prototype application. Please do not share sensitive personal information.
- **Medical Advice**: AI analysis is not a substitute for professional medical or mental health advice.
- **Data Storage**: Journal entries are stored locally in SQLite database.

## 🔧 Development

### Backend API Endpoints
- `POST /entries/` - Create a new journal entry
- `GET /entries/` - Get all journal entries
- `GET /analytics/sentiment-trends` - Get mood trend data
- `GET /analytics/insights` - Get AI-generated insights

### Project Structure
```
Eunoia/
├── backend/
│   ├── main.py              # FastAPI application
│   ├── ml_service.py        # AI/ML analysis service
│   ├── requirements.txt     # Python dependencies
│   └── start.py            # Backend startup script
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── services/       # API service layer
│   │   ├── types/          # TypeScript type definitions
│   │   └── App.tsx         # Main React component
│   └── package.json        # Node.js dependencies
└── README.md
```

## 🎯 Future Enhancements

- [ ] User authentication and data encryption
- [ ] Mobile app version
- [ ] Advanced analytics and reporting
- [ ] Integration with wellness apps
- [ ] Export functionality for journal entries
- [ ] Customizable AI reflection templates

## 📄 License

This project is for educational purposes. Please ensure you comply with all applicable laws and regulations when handling personal data.

## 🤝 Contributing

This is a semester project. Contributions and suggestions are welcome!

---

**Remember**: This tool provides insights based on AI analysis and is not a substitute for professional medical or mental health advice. If you're experiencing significant emotional distress, please consider speaking with a qualified healthcare provider.
