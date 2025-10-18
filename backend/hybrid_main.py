"""
Hybrid FastAPI application for production deployment
This version includes Supabase but falls back gracefully if not configured
"""

from fastapi import FastAPI, HTTPException, Depends, Query, status, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, validator
from datetime import datetime
from typing import List, Optional, Dict, Any
import os
import json
import re
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Try to import Supabase, fallback to in-memory storage
try:
    from supabase import create_client, Client
    SUPABASE_AVAILABLE = True
    print("Supabase client available")
except ImportError:
    SUPABASE_AVAILABLE = False
    print("Supabase not available, using in-memory storage")

# Initialize Supabase if available
supabase_client = None
if SUPABASE_AVAILABLE:
    try:
        supabase_url = os.environ.get('SUPABASE_URL')
        supabase_key = os.environ.get('SUPABASE_ANON_KEY')
        
        if supabase_url and supabase_key:
            supabase_client = create_client(supabase_url, supabase_key)
            print("Supabase client initialized successfully")
        else:
            print("Supabase credentials not found, using in-memory storage")
    except Exception as e:
        print(f"Failed to initialize Supabase: {e}")
        supabase_client = None

# Fallback in-memory storage
journal_entries = []
entry_id_counter = 1

# Pydantic models
class JournalEntryCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=10000, description="Journal entry content")
    date: Optional[datetime] = Field(None, description="Entry date (defaults to current time)")
    
    @validator('content')
    def validate_content(cls, v):
        if not v or not v.strip():
            raise ValueError('Content cannot be empty')
        return re.sub(r'\s+', ' ', v.strip())

class JournalEntryResponse(BaseModel):
    id: int
    user_id: str
    date: datetime
    content: str
    sentiment_score: Optional[float] = 5.0
    emotion: Optional[str] = "neutral"
    emotion_confidence: Optional[float] = 0.5
    emotions_detected: Optional[List] = []
    emotion_group: Optional[str] = "neutral"
    stress_level: Optional[float] = 3.0
    word_count: Optional[int] = 0
    created_at: datetime
    updated_at: Optional[datetime] = None

# FastAPI app
app = FastAPI(title="Eunoia Journal API - Hybrid", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for demo
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Simple auth function
def get_current_user(authorization: str = Header(None)) -> Dict[str, Any]:
    """Simple auth for demo purposes"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header required")
    
    # For demo, accept any token
    return {
        "id": "demo-user",
        "email": "demo@example.com",
        "user_metadata": {},
        "app_metadata": {"role": "user"}
    }

# Simple AI analysis function
def analyze_text(text: str) -> Dict:
    """Simple text analysis for demo purposes"""
    word_count = len(text.split())
    
    # Simple keyword-based analysis
    positive_words = ['happy', 'joy', 'great', 'wonderful', 'amazing', 'excellent', 'good', 'love', 'enjoy']
    negative_words = ['sad', 'angry', 'terrible', 'awful', 'hate', 'bad', 'worried', 'stressed', 'anxious']
    stress_words = ['stressed', 'pressure', 'deadline', 'urgent', 'overwhelmed', 'tired', 'exhausted']
    
    text_lower = text.lower()
    
    positive_count = sum(1 for word in positive_words if word in text_lower)
    negative_count = sum(1 for word in negative_words if word in text_lower)
    stress_count = sum(1 for word in stress_words if word in text_lower)
    
    # Calculate sentiment score (0-10)
    if positive_count > negative_count:
        sentiment_score = 7.0 + min(3.0, positive_count * 0.5)
        emotion = "joy"
        emotion_group = "positive"
    elif negative_count > positive_count:
        sentiment_score = 3.0 - min(3.0, negative_count * 0.5)
        emotion = "sadness"
        emotion_group = "negative"
    else:
        sentiment_score = 5.0
        emotion = "neutral"
        emotion_group = "neutral"
    
    # Calculate stress level (0-10)
    stress_level = min(10.0, 3.0 + stress_count * 2.0)
    
    return {
        "sentiment_score": round(sentiment_score, 2),
        "emotion": emotion,
        "emotion_confidence": 0.7,
        "emotions_detected": [[emotion, 0.7]],
        "emotion_group": emotion_group,
        "stress_level": round(stress_level, 2),
        "word_count": word_count
    }

# Database functions
def save_entry(entry_data: Dict) -> Dict:
    """Save entry to database or memory"""
    if supabase_client:
        try:
            # Save to Supabase
            result = supabase_client.table('journal_entries').insert(entry_data).execute()
            if result.data:
                return result.data[0]
        except Exception as e:
            print(f"Failed to save to Supabase: {e}")
    
    # Fallback to in-memory storage
    global entry_id_counter
    entry_data['id'] = entry_id_counter
    entry_id_counter += 1
    journal_entries.append(entry_data)
    return entry_data

def get_entries(user_id: str, page: int = 1, per_page: int = 10) -> List[Dict]:
    """Get entries from database or memory"""
    if supabase_client:
        try:
            # Get from Supabase
            result = supabase_client.table('journal_entries').select('*').eq('user_id', user_id).execute()
            entries = result.data or []
        except Exception as e:
            print(f"Failed to get from Supabase: {e}")
            entries = [e for e in journal_entries if e.get('user_id') == user_id]
    else:
        # Fallback to in-memory storage
        entries = [e for e in journal_entries if e.get('user_id') == user_id]
    
    # Apply pagination
    start = (page - 1) * per_page
    end = start + per_page
    return entries[start:end]

# Routes
@app.get("/")
async def root():
    return {
        "message": "Eunoia Journal API - Hybrid Version is running!",
        "supabase_available": supabase_client is not None,
        "storage_type": "Supabase" if supabase_client else "In-memory"
    }

@app.post("/entries/", response_model=JournalEntryResponse, status_code=status.HTTP_201_CREATED)
async def create_entry(
    entry: JournalEntryCreate, 
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Create a new journal entry with AI analysis"""
    # Analyze the text
    analysis = analyze_text(entry.content)
    
    # Create entry data
    entry_data = {
        "user_id": current_user["id"],
        "content": entry.content,
        "date": (entry.date or datetime.utcnow()).isoformat(),
        "sentiment_score": analysis["sentiment_score"],
        "emotion": analysis["emotion"],
        "emotion_confidence": analysis["emotion_confidence"],
        "emotions_detected": analysis["emotions_detected"],
        "emotion_group": analysis["emotion_group"],
        "stress_level": analysis["stress_level"],
        "word_count": analysis["word_count"],
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": None
    }
    
    # Save entry
    saved_entry = save_entry(entry_data)
    
    # Convert to response format
    return JournalEntryResponse(
        id=saved_entry['id'],
        user_id=saved_entry['user_id'],
        date=datetime.fromisoformat(saved_entry['date'].replace('Z', '+00:00')),
        content=saved_entry['content'],
        sentiment_score=saved_entry['sentiment_score'],
        emotion=saved_entry['emotion'],
        emotion_confidence=saved_entry['emotion_confidence'],
        emotions_detected=saved_entry['emotions_detected'],
        emotion_group=saved_entry['emotion_group'],
        stress_level=saved_entry['stress_level'],
        word_count=saved_entry['word_count'],
        created_at=datetime.fromisoformat(saved_entry['created_at'].replace('Z', '+00:00')),
        updated_at=datetime.fromisoformat(saved_entry['updated_at'].replace('Z', '+00:00')) if saved_entry['updated_at'] else None
    )

@app.get("/entries/", response_model=List[JournalEntryResponse])
async def get_entries_endpoint(
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(10, ge=1, le=100, description="Entries per page"),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get journal entries with pagination"""
    entries = get_entries(current_user["id"], page, per_page)
    
    # Convert to response format
    response_entries = []
    for entry in entries:
        response_entries.append(JournalEntryResponse(
            id=entry['id'],
            user_id=entry['user_id'],
            date=datetime.fromisoformat(entry['date'].replace('Z', '+00:00')),
            content=entry['content'],
            sentiment_score=entry.get('sentiment_score', 5.0),
            emotion=entry.get('emotion', 'neutral'),
            emotion_confidence=entry.get('emotion_confidence', 0.5),
            emotions_detected=entry.get('emotions_detected', []),
            emotion_group=entry.get('emotion_group', 'neutral'),
            stress_level=entry.get('stress_level', 3.0),
            word_count=entry.get('word_count', 0),
            created_at=datetime.fromisoformat(entry['created_at'].replace('Z', '+00:00')),
            updated_at=datetime.fromisoformat(entry['updated_at'].replace('Z', '+00:00')) if entry.get('updated_at') else None
        ))
    
    return response_entries

@app.get("/analytics/sentiment-trends")
async def get_sentiment_trends(
    days: int = Query(30, ge=1, le=365, description="Number of days to analyze"),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get sentiment trends for the dashboard"""
    entries = get_entries(current_user["id"], 1, 1000)  # Get all entries
    
    if not entries:
        return {
            "trends": [],
            "total_entries": 0,
            "days_analyzed": days,
            "summary": {
                "avg_sentiment": 0.0,
                "avg_stress": 0.0,
                "most_common_emotion": "neutral",
                "total_entries": 0
            }
        }
    
    # Calculate averages
    sentiments = [e.get('sentiment_score', 5.0) for e in entries]
    stress_levels = [e.get('stress_level', 3.0) for e in entries]
    emotions = [e.get('emotion', 'neutral') for e in entries]
    
    avg_sentiment = sum(sentiments) / len(sentiments)
    avg_stress = sum(stress_levels) / len(stress_levels)
    most_common_emotion = max(set(emotions), key=emotions.count) if emotions else "neutral"
    
    return {
        "trends": [{
            "date": datetime.utcnow().date().isoformat(),
            "avg_sentiment": round(avg_sentiment, 3),
            "avg_stress": round(avg_stress, 3),
            "most_common_emotion": most_common_emotion,
            "entry_count": len(entries)
        }],
        "total_entries": len(entries),
        "days_analyzed": days,
        "summary": {
            "avg_sentiment": round(avg_sentiment, 3),
            "avg_stress": round(avg_stress, 3),
            "most_common_emotion": most_common_emotion,
            "total_entries": len(entries)
        }
    }

@app.get("/analytics/insights")
async def get_insights(
    days: int = Query(7, ge=1, le=30, description="Number of days to analyze"),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get AI-generated insights"""
    entries = get_entries(current_user["id"], 1, 1000)  # Get all entries
    
    if not entries:
        return {
            "insights": ["Start writing journal entries to get personalized insights!"],
            "suggestions": ["Try writing about your day, feelings, or thoughts."],
            "data_available": False
        }
    
    # Simple insights based on recent entries
    recent_entries = entries[-min(5, len(entries)):]
    avg_sentiment = sum(e.get('sentiment_score', 5.0) for e in recent_entries) / len(recent_entries)
    avg_stress = sum(e.get('stress_level', 3.0) for e in recent_entries) / len(recent_entries)
    
    insights = []
    suggestions = []
    
    if avg_sentiment > 7:
        insights.append("Your recent entries show a positive outlook!")
    elif avg_sentiment < 3:
        insights.append("Your recent entries suggest you might be going through a challenging time.")
        suggestions.append("Consider talking to a trusted friend or counselor about your feelings.")
    else:
        insights.append("Your mood has been relatively stable recently.")
    
    if avg_stress > 7:
        insights.append("Your entries indicate high stress levels lately.")
        suggestions.extend([
            "Try the 4-7-8 breathing technique: inhale for 4, hold for 7, exhale for 8.",
            "Consider taking short breaks every hour during work or study."
        ])
    elif avg_stress > 4:
        insights.append("You're experiencing moderate stress levels.")
        suggestions.append("Try some light exercise or a short walk to help manage stress.")
    else:
        insights.append("Your stress levels appear manageable.")
    
    return {
        "insights": insights,
        "suggestions": suggestions,
        "data_available": True
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0-hybrid",
        "supabase_available": supabase_client is not None
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
