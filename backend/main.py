from fastapi import FastAPI, HTTPException, Depends, Query, status, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Float, Text, JSON, and_, or_, desc, asc
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from pydantic import BaseModel, Field, validator
import time
from datetime import datetime, date, timedelta
from typing import List, Optional, Dict, Any, Tuple
import os
import json
import re
from dotenv import load_dotenv
from sqlalchemy.exc import OperationalError
from .hybrid_ml_service import analyze_journal_entry, hybrid_service
from .supabase_auth_service import get_current_user, require_auth, auth_service
from pathlib import Path
from .error_handler import (
    ErrorHandler, ErrorFactory, ErrorCode, ErrorSeverity, 
    handle_errors, error_handler, error_factory
)

# Database setup
# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# Supabase PostgreSQL connection
SUPABASE_URL = os.environ.get('SUPABASE_URL')
SUPABASE_DB_PASSWORD = os.environ.get('SUPABASE_DB_PASSWORD', 'your-db-password')
SUPABASE_DB_HOST = os.environ.get('SUPABASE_DB_HOST', 'db.wglvjoncodlrvkgleyvv.supabase.co')
SUPABASE_DB_PORT = os.environ.get('SUPABASE_DB_PORT', '5432')
SUPABASE_DB_NAME = os.environ.get('SUPABASE_DB_NAME', 'postgres')
SUPABASE_DB_HOST_IPV4 = os.environ.get('SUPABASE_DB_HOST_IPV4')  # optional, only used if provided

# Construct PostgreSQL connection string (psycopg v3 driver)
SQLALCHEMY_DATABASE_URL = f"postgresql+psycopg://postgres:{SUPABASE_DB_PASSWORD}@{SUPABASE_DB_HOST}:{SUPABASE_DB_PORT}/{SUPABASE_DB_NAME}"

# Fallback to SQLite if Supabase credentials not available
if not SUPABASE_URL or not SUPABASE_DB_PASSWORD:
    print("WARNING: Supabase database credentials not found. Falling back to SQLite.")
    BASE_DIR = Path(__file__).resolve().parent
    DB_PATH = (BASE_DIR / "eunoia_journal.db").as_posix()
    SQLALCHEMY_DATABASE_URL = f"sqlite:///{DB_PATH}"
    engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
else:
    print("Using Supabase PostgreSQL database")
    connect_args = {"sslmode": "require", "connect_timeout": 5}
    if SUPABASE_DB_HOST_IPV4:
        connect_args["hostaddr"] = SUPABASE_DB_HOST_IPV4
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        connect_args=connect_args,
        pool_pre_ping=True,
        pool_recycle=300
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Database Models
class JournalEntry(Base):
    __tablename__ = "journal_entries"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(255), nullable=False, index=True)  # Supabase user ID
    date = Column(DateTime, default=datetime.utcnow, index=True)
    content = Column(Text, nullable=False)
    sentiment_score = Column(Float, nullable=True, index=True)
    emotion = Column(String(50), nullable=True, index=True)
    emotion_confidence = Column(Float, nullable=True)
    emotions_detected = Column(JSON, nullable=True)  # JSONB for multiple emotions
    emotion_group = Column(String(20), nullable=True, index=True)
    stress_level = Column(Float, nullable=True, index=True)
    word_count = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class UserProfile(Base):
    __tablename__ = "user_profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(255), nullable=False, unique=True, index=True)  # Supabase user ID
    email = Column(String(255), nullable=False, index=True)
    full_name = Column(String(255), nullable=True)
    display_name = Column(String(50), nullable=True, index=True)  # User-friendly display name
    role = Column(String(50), nullable=False, default="user", index=True)  # user, admin, moderator
    is_active = Column(String(10), nullable=False, default="true", index=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)

# Pydantic models
class JournalEntryCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=10000, description="Journal entry content")
    date: Optional[datetime] = Field(None, description="Entry date (defaults to current time)")
    
    @validator('content')
    def validate_content(cls, v):
        if not v or not v.strip():
            raise ValueError('Content cannot be empty')
        # Remove excessive whitespace
        return re.sub(r'\s+', ' ', v.strip())
    
    class Config:
        json_schema_extra = {
            "example": {
                "content": "Today was a great day! I finished my project and felt really accomplished.",
                "date": "2024-01-15T10:30:00"
            }
        }

class JournalEntryUpdate(BaseModel):
    content: Optional[str] = Field(None, min_length=1, max_length=10000, description="Updated journal entry content")
    date: Optional[datetime] = Field(None, description="Updated entry date")
    
    @validator('content')
    def validate_content(cls, v):
        if v is not None:
            if not v or not v.strip():
                raise ValueError('Content cannot be empty')
            # Remove excessive whitespace
            return re.sub(r'\s+', ' ', v.strip())
        return v
    
    class Config:
        json_schema_extra = {
            "example": {
                "content": "Updated my journal entry with more details about my day."
            }
        }

class JournalEntryResponse(BaseModel):
    id: int
    date: datetime
    content: str
    sentiment_score: Optional[float]
    emotion: Optional[str]
    emotion_confidence: Optional[float]
    emotions_detected: Optional[List[Tuple[str, float]]]  # List of [emotion, confidence] tuples
    emotion_group: Optional[str]
    stress_level: Optional[float]
    word_count: Optional[int]
    created_at: datetime
    updated_at: Optional[datetime]

    @validator('emotions_detected', pre=True)
    def parse_emotions_detected(cls, v):
        if v is None:
            return None
        if isinstance(v, str):
            try:
                import json
                return json.loads(v)
            except (json.JSONDecodeError, TypeError):
                return None
        return v

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": 1,
                "date": "2024-01-15T10:30:00",
                "content": "Today was a great day! I finished my project and felt really accomplished.",
                "sentiment_score": 8.0,
                "emotion": "joy",
                "emotion_confidence": 0.92,
                "emotions_detected": [["joy", 0.92], ["excitement", 0.15]],
                "emotion_group": "positive",
                "stress_level": 1.0,
                "word_count": 18,
                "created_at": "2024-01-15T10:30:00",
                "updated_at": "2024-01-15T10:30:00"
            }
        }

class SentimentAnalysis(BaseModel):
    sentiment_score: float
    emotion: str
    stress_level: float

class JournalEntrySearch(BaseModel):
    query: Optional[str] = Field(None, description="Search query for content")
    emotion: Optional[str] = Field(None, description="Filter by emotion")
    emotion_group: Optional[str] = Field(None, description="Filter by emotion group (positive/negative/neutral)")
    min_sentiment: Optional[float] = Field(None, ge=0.0, le=10.0, description="Minimum sentiment score")
    max_sentiment: Optional[float] = Field(None, ge=0.0, le=10.0, description="Maximum sentiment score")
    min_stress: Optional[float] = Field(None, ge=0.0, le=10.0, description="Minimum stress level")
    max_stress: Optional[float] = Field(None, ge=0.0, le=10.0, description="Maximum stress level")
    start_date: Optional[datetime] = Field(None, description="Start date filter")
    end_date: Optional[datetime] = Field(None, description="End date filter")
    min_word_count: Optional[int] = Field(None, ge=0, description="Minimum word count")
    max_word_count: Optional[int] = Field(None, ge=0, description="Maximum word count")

# User management models
class UserProfileResponse(BaseModel):
    id: int
    user_id: str
    email: str
    full_name: Optional[str]
    display_name: Optional[str]
    role: str
    is_active: str
    created_at: datetime
    updated_at: Optional[datetime]
    last_login: Optional[datetime]

    class Config:
        from_attributes = True

class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = Field(None, description="Updated full name")
    display_name: Optional[str] = Field(None, description="Updated display name/username")
    role: Optional[str] = Field(None, description="Updated role (user, admin, moderator)")
    is_active: Optional[str] = Field(None, description="Updated active status (true/false)")

class UserProfileCreate(BaseModel):
    email: str = Field(..., description="User email")
    full_name: Optional[str] = Field(None, description="User full name")
    display_name: str = Field(..., min_length=2, max_length=50, description="Display name/username")
    role: str = Field("user", description="User role (user, admin, moderator)")

class UserCreate(BaseModel):
    email: str = Field(..., description="User email")
    password: str = Field(..., min_length=6, description="User password")
    full_name: Optional[str] = Field(None, description="User full name")
    role: str = Field("user", description="User role (user, admin, moderator)")

class AdminStats(BaseModel):
    total_users: int
    active_users: int
    total_entries: int
    entries_today: int
    entries_this_week: int
    entries_this_month: int
    most_active_users: List[Dict[str, Any]]
    recent_signups: List[UserProfileResponse]

class PaginatedResponse(BaseModel):
    entries: List[JournalEntryResponse]
    total: int
    page: int
    per_page: int
    total_pages: int
    has_next: bool
    has_prev: bool

# FastAPI app
app = FastAPI(title="Eunoia Journal API", version="1.0.0")

# CORS middleware
frontend_origin = os.environ.get("FRONTEND_ORIGIN")
cors_allow_origin_regex = os.environ.get("CORS_ALLOW_ORIGIN_REGEX")  # optional regex (e.g., ^https://.*\.vercel\.app$)

allow_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost",
    "http://127.0.0.1",
]
if frontend_origin:
    allow_origins.append(frontend_origin)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_origin_regex=cors_allow_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Supabase client (service role) for database operations
supabase_db = auth_service.supabase

# Authentication dependency
def get_current_user_dependency(authorization: str = Header(None)) -> Dict[str, Any]:
    """
    FastAPI dependency to get current authenticated user
    """
    if not authorization:
        context = error_handler.create_error_context(endpoint="authentication")
        error = error_factory.authentication_error(
            message="Authorization header required",
            context=context
        )
        raise error_handler.create_http_exception(error, status.HTTP_401_UNAUTHORIZED)
    
    # Extract token from "Bearer <token>" format
    if not authorization.startswith("Bearer "):
        context = error_handler.create_error_context(endpoint="authentication")
        error = error_factory.authentication_error(
            message="Invalid authorization header format",
            context=context
        )
        raise error_handler.create_http_exception(error, status.HTTP_401_UNAUTHORIZED)
    
    token = authorization[7:]  # Remove "Bearer " prefix
    
    try:
        return require_auth(token)
    except HTTPException as e:
        # Re-raise HTTP exceptions as-is
        raise e
    except Exception as e:
        context = error_handler.create_error_context(endpoint="authentication")
        error = error_factory.authentication_error(
            message="Authentication failed",
            detail=str(e),
            context=context,
            original_exception=e
        )
        raise error_handler.create_http_exception(error, status.HTTP_401_UNAUTHORIZED)

# Optional authentication dependency (for backward compatibility)
def get_current_user_optional(authorization: str = Header(None)) -> Optional[Dict[str, Any]]:
    """
    Optional authentication dependency for endpoints that work with or without auth
    """
    if not authorization:
        return None
    
    return get_current_user(authorization)

## Schema initialization is managed in Supabase; no startup DB DDL here.

# Routes
@app.get("/")
async def root():
    return {"message": "Eunoia Journal API is running!"}

@app.post("/entries/", response_model=JournalEntryResponse, status_code=status.HTTP_201_CREATED)
async def create_entry(
    entry: JournalEntryCreate, 
    current_user: Dict[str, Any] = Depends(get_current_user_dependency)
):
    """
    Create a new journal entry with AI analysis.
    
    - **content**: The journal entry text (required)
    - **date**: Optional date for the entry (defaults to current time)
    
    Returns the created entry with sentiment analysis, emotion detection, and stress level.
    Requires authentication.
    """
    context = error_handler.create_error_context(
        user_id=current_user.get("id"),
        endpoint="create_entry"
    )
    
    try:
        # Analyze the journal entry using ML models
        try:
            analysis = analyze_journal_entry(entry.content)
        except Exception as ml_error:
            # ML analysis failed, but we can still save the entry
            context.additional_data = {"ml_error": str(ml_error)}
            error = error_factory.ml_service_error(
                message="AI analysis failed, but entry will be saved",
                detail=str(ml_error),
                context=context,
                original_exception=ml_error
            )
            error_handler.log_error(error)
            # Continue with fallback analysis
            analysis = {
                "sentiment_score": 5.0,
                "emotion": "neutral",
                "emotion_confidence": 0.5,
                "emotions_detected": [],
                "emotion_group": "neutral",
                "stress_level": 3.0
            }
        
        # Calculate word count
        word_count = len(entry.content.split())
        
        # Get emotions_detected as list (already structured from ML service)
        emotions_detected = analysis.get("emotions_detected", [])
        
        payload = {
            "user_id": current_user["id"],
            "content": entry.content,
            "date": (entry.date or datetime.utcnow()).isoformat(),
            "sentiment_score": analysis["sentiment_score"],
            "emotion": analysis["emotion"],
            "emotion_confidence": analysis.get("emotion_confidence"),
            "emotions_detected": emotions_detected,
            "emotion_group": analysis.get("emotion_group"),
            "stress_level": analysis["stress_level"],
            "word_count": word_count,
        }
        resp = supabase_db.table("journal_entries").insert(payload).select("*").single().execute()
        return resp.data
        
    except Exception as e:
        error = error_factory.database_error(
            message="Failed to create journal entry",
            detail=str(e),
            context=context,
            original_exception=e
        )
        raise error_handler.create_http_exception(error, status.HTTP_500_INTERNAL_SERVER_ERROR)

@app.get("/entries/", response_model=PaginatedResponse)
async def get_entries(
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(10, ge=1, le=100, description="Entries per page"),
    search: Optional[str] = Query(None, description="Search in content"),
    emotion: Optional[str] = Query(None, description="Filter by emotion"),
    emotion_group: Optional[str] = Query(None, description="Filter by emotion group"),
    min_sentiment: Optional[float] = Query(None, ge=0.0, le=10.0, description="Minimum sentiment score"),
    max_sentiment: Optional[float] = Query(None, ge=0.0, le=10.0, description="Maximum sentiment score"),
    min_stress: Optional[float] = Query(None, ge=0.0, le=10.0, description="Minimum stress level"),
    max_stress: Optional[float] = Query(None, ge=0.0, le=10.0, description="Maximum stress level"),
    start_date: Optional[datetime] = Query(None, description="Start date filter"),
    end_date: Optional[datetime] = Query(None, description="End date filter"),
    sort_by: str = Query("created_at", description="Sort field (created_at, date, sentiment_score, stress_level)"),
    sort_order: str = Query("desc", description="Sort order (asc, desc)"),
    current_user: Dict[str, Any] = Depends(get_current_user_dependency)
):
    """
    Get journal entries with pagination, search, and filtering.
    
    - **page**: Page number (default: 1)
    - **per_page**: Entries per page (default: 10, max: 100)
    - **search**: Search query for content
    - **emotion**: Filter by specific emotion
    - **emotion_group**: Filter by emotion group (positive/negative/neutral)
    - **min_sentiment/max_sentiment**: Sentiment score range (-1.0 to 1.0)
    - **min_stress/max_stress**: Stress level range (0.0 to 1.0)
    - **start_date/end_date**: Date range filter
    - **sort_by**: Sort field (created_at, date, sentiment_score, stress_level)
    - **sort_order**: Sort order (asc, desc)
    """
    context = error_handler.create_error_context(
        user_id=current_user.get("id"),
        endpoint="get_entries",
        additional_data={
            "page": page,
            "per_page": per_page,
            "filters": {
                "search": search,
                "emotion": emotion,
                "emotion_group": emotion_group,
                "min_sentiment": min_sentiment,
                "max_sentiment": max_sentiment,
                "min_stress": min_stress,
                "max_stress": max_stress,
                "start_date": start_date.isoformat() if start_date else None,
                "end_date": end_date.isoformat() if end_date else None,
                "sort_by": sort_by,
                "sort_order": sort_order
            }
        }
    )
    
    try:
        # Build Supabase query
        q = supabase_db.table("journal_entries").select("*", count="exact").eq("user_id", current_user["id"])
        if search:
            q = q.ilike("content", f"%{search}%")
        if emotion:
            q = q.eq("emotion", emotion)
        if emotion_group:
            q = q.eq("emotion_group", emotion_group)
        if min_sentiment is not None:
            q = q.gte("sentiment_score", min_sentiment)
        if max_sentiment is not None:
            q = q.lte("sentiment_score", max_sentiment)
        if min_stress is not None:
            q = q.gte("stress_level", min_stress)
        if max_stress is not None:
            q = q.lte("stress_level", max_stress)
        if start_date:
            q = q.gte("date", start_date.isoformat())
        if end_date:
            q = q.lte("date", end_date.isoformat())

        desc_order = (sort_order.lower() == "desc")
        q = q.order(sort_by, desc=desc_order)
        offset = (page - 1) * per_page
        q = q.range(offset, offset + per_page - 1)
        resp = q.execute()
        entries = resp.data or []
        total = resp.count or 0

        # Backward compatibility: ensure updated_at is not None in responses
        # Also ensure emotions_detected is properly formatted
        for e in entries:
            if e.get("updated_at") is None:
                e["updated_at"] = e.get("created_at") or datetime.utcnow().isoformat()
            if e.get("emotions_detected") is not None and isinstance(e.get("emotions_detected"), str):
                try:
                    e["emotions_detected"] = json.loads(e["emotions_detected"])
                except Exception:
                    e["emotions_detected"] = []
        
        # Calculate pagination info
        total_pages = (total + per_page - 1) // per_page
        has_next = page < total_pages
        has_prev = page > 1
        
        return PaginatedResponse(
            entries=entries,
            total=total,
            page=page,
            per_page=per_page,
            total_pages=total_pages,
            has_next=has_next,
            has_prev=has_prev
        )
        
    except Exception as e:
        error = error_factory.database_error(
            message="Failed to retrieve journal entries",
            detail=str(e),
            context=context,
            original_exception=e
        )
        raise error_handler.create_http_exception(error, status.HTTP_500_INTERNAL_SERVER_ERROR)

@app.get("/entries/{entry_id}", response_model=JournalEntryResponse)
async def get_entry(
    entry_id: int, 
    current_user: Dict[str, Any] = Depends(get_current_user_dependency)
):
    """
    Get a specific journal entry by ID.
    Returns the entry only if it belongs to the authenticated user.
    """
    resp = supabase_db.table("journal_entries").select("*").eq("id", entry_id).eq("user_id", current_user["id"]).single().execute()
    entry = resp.data
    if entry is None:
        raise HTTPException(status_code=404, detail="Entry not found")
    return entry

@app.put("/entries/{entry_id}", response_model=JournalEntryResponse)
async def update_entry(
    entry_id: int, 
    entry_update: JournalEntryUpdate, 
    current_user: Dict[str, Any] = Depends(get_current_user_dependency)
):
    """
    Update a journal entry.
    
    - **entry_id**: ID of the entry to update
    - **content**: Updated content (optional)
    - **date**: Updated date (optional)
    
    If content is updated, the entry will be re-analyzed for sentiment and emotions.
    Only the owner can update their entries.
    """
    try:
        # Get existing entry - ensure it belongs to the user
        existing = supabase_db.table("journal_entries").select("id").eq("id", entry_id).eq("user_id", current_user["id"]).single().execute().data
        if not existing:
            raise HTTPException(status_code=404, detail="Entry not found")
        
        # Update fields if provided
        update_data = entry_update.dict(exclude_unset=True)
        
        if not update_data:
            raise HTTPException(status_code=400, detail="No fields to update")
        
        payload = {}
        if "content" in update_data:
            analysis = analyze_journal_entry(update_data["content"])
            word_count = len(update_data["content"].split())
            emotions_detected = analysis.get("emotions_detected", [])
            payload.update({
                "sentiment_score": analysis["sentiment_score"],
                "emotion": analysis["emotion"],
                "emotion_confidence": analysis.get("emotion_confidence"),
                "emotions_detected": emotions_detected,
                "emotion_group": analysis.get("emotion_group"),
                "stress_level": analysis["stress_level"],
                "word_count": word_count,
            })
        for field, value in update_data.items():
            payload[field] = value
        payload["updated_at"] = datetime.utcnow().isoformat()
        resp = supabase_db.table("journal_entries").update(payload).eq("id", entry_id).eq("user_id", current_user["id"]).select("*").single().execute()
        return resp.data
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update entry: {str(e)}"
        )

@app.delete("/entries/{entry_id}")
async def delete_entry(
    entry_id: int, 
    current_user: Dict[str, Any] = Depends(get_current_user_dependency)
):
    """
    Delete a journal entry.
    
    - **entry_id**: ID of the entry to delete
    Only the owner can delete their entries.
    """
    try:
        existing = supabase_db.table("journal_entries").select("id").eq("id", entry_id).eq("user_id", current_user["id"]).single().execute().data
        if not existing:
            raise HTTPException(status_code=404, detail="Entry not found")
        supabase_db.table("journal_entries").delete().eq("id", entry_id).eq("user_id", current_user["id"]).execute()
        
        return {"message": "Entry deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete entry: {str(e)}"
        )

@app.get("/analytics/sentiment-trends")
async def get_sentiment_trends(
    days: int = Query(30, ge=1, le=365, description="Number of days to analyze"),
    current_user: Dict[str, Any] = Depends(get_current_user_dependency)
):
    """
    Get sentiment trends for the dashboard.
    
    - **days**: Number of days to analyze (1-365, default: 30)
    
    Returns daily sentiment, stress, and emotion trends with statistics.
    """
    try:
        # Get entries from the last N days for the current user
        start_date = datetime.utcnow() - timedelta(days=days)
        resp = supabase_db.table("journal_entries").select("*").eq("user_id", current_user["id"]).gte("date", start_date.isoformat()).execute()
        entries = resp.data or []
        
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
        
        # Group by date and calculate averages
        daily_data = {}
        for entry in entries:
            try:
                dt = datetime.fromisoformat(entry.get("date").replace("Z", "+00:00"))
            except Exception:
                dt = datetime.utcnow()
            date_key = dt.date().isoformat()
            if date_key not in daily_data:
                daily_data[date_key] = {
                    "date": date_key,
                    "sentiment_scores": [],
                    "stress_levels": [],
                    "emotions": [],
                    "emotion_groups": [],
                    "word_counts": [],
                    "entry_count": 0
                }
            
            daily_data[date_key]["sentiment_scores"].append(entry.get("sentiment_score") or 0)
            daily_data[date_key]["stress_levels"].append(entry.get("stress_level") or 0)
            daily_data[date_key]["emotions"].append(entry.get("emotion") or "neutral")
            daily_data[date_key]["emotion_groups"].append(entry.get("emotion_group") or "neutral")
            daily_data[date_key]["word_counts"].append(entry.get("word_count") or 0)
            daily_data[date_key]["entry_count"] += 1
        
        # Calculate daily averages and statistics
        trends = []
        all_sentiments = []
        all_stress = []
        all_emotions = []
        
        for date_key, data in daily_data.items():
            avg_sentiment = sum(data["sentiment_scores"]) / len(data["sentiment_scores"])
            avg_stress = sum(data["stress_levels"]) / len(data["stress_levels"])
            avg_word_count = sum(data["word_counts"]) / len(data["word_counts"]) if data["word_counts"] else 0
            
            # Find most common emotion and emotion group
            most_common_emotion = max(set(data["emotions"]), key=data["emotions"].count) if data["emotions"] else "neutral"
            most_common_emotion_group = max(set(data["emotion_groups"]), key=data["emotion_groups"].count) if data["emotion_groups"] else "neutral"
            
            trends.append({
                "date": date_key,
                "avg_sentiment": round(avg_sentiment, 3),
                "avg_stress": round(avg_stress, 3),
                "avg_word_count": round(avg_word_count, 1),
                "most_common_emotion": most_common_emotion,
                "most_common_emotion_group": most_common_emotion_group,
                "entry_count": data["entry_count"]
            })
            
            # Collect for overall statistics
            all_sentiments.extend(data["sentiment_scores"])
            all_stress.extend(data["stress_levels"])
            all_emotions.extend(data["emotions"])
        
        # Sort by date
        trends.sort(key=lambda x: x["date"])
        
        # Calculate overall summary
        overall_avg_sentiment = sum(all_sentiments) / len(all_sentiments) if all_sentiments else 0
        overall_avg_stress = sum(all_stress) / len(all_stress) if all_stress else 0
        overall_most_common_emotion = max(set(all_emotions), key=all_emotions.count) if all_emotions else "neutral"
        
        return {
            "trends": trends,
            "total_entries": len(entries),
            "days_analyzed": days,
            "summary": {
                "avg_sentiment": round(overall_avg_sentiment, 3),
                "avg_stress": round(overall_avg_stress, 3),
                "most_common_emotion": overall_most_common_emotion,
                "total_entries": len(entries)
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve sentiment trends: {str(e)}"
        )

@app.get("/analytics/insights")
async def get_insights(
    days: int = Query(7, ge=1, le=30, description="Number of days to analyze for insights"),
    current_user: Dict[str, Any] = Depends(get_current_user_dependency)
):
    """
    Get AI-generated insights and suggestions based on recent journal entries.
    
    - **days**: Number of days to analyze (1-30, default: 7)
    
    Returns personalized insights, suggestions, and emotional patterns.
    """
    try:
        # Get entries from the specified number of days for the current user
        start_date = datetime.utcnow() - timedelta(days=days)
        resp = supabase_db.table("journal_entries").select("*").eq("user_id", current_user["id"]).gte("date", start_date.isoformat()).execute()
        entries = resp.data or []
        
        if not entries:
            return {
                "insights": ["Start writing journal entries to get personalized insights!"],
                "suggestions": ["Try writing about your day, feelings, or thoughts."],
                "data_available": False,
                "patterns": {},
                "recommendations": []
            }
        
        # Analyze patterns
        sentiments = [entry.get("sentiment_score") or 0 for entry in entries]
        stress_levels = [entry.get("stress_level") or 0 for entry in entries]
        emotions = [entry.get("emotion") or "neutral" for entry in entries]
        emotion_groups = [entry.get("emotion_group") or "neutral" for entry in entries]
        word_counts = [entry.get("word_count") or 0 for entry in entries]
        
        avg_sentiment = sum(sentiments) / len(sentiments)
        avg_stress = sum(stress_levels) / len(stress_levels)
        avg_word_count = sum(word_counts) / len(word_counts) if word_counts else 0
        
        # Find most common emotions and groups
        emotion_counts = {}
        emotion_group_counts = {}
        for emotion in emotions:
            emotion_counts[emotion] = emotion_counts.get(emotion, 0) + 1
        for group in emotion_groups:
            emotion_group_counts[group] = emotion_group_counts.get(group, 0) + 1
        
        most_common_emotion = max(emotion_counts.items(), key=lambda x: x[1])[0] if emotion_counts else "neutral"
        most_common_group = max(emotion_group_counts.items(), key=lambda x: x[1])[0] if emotion_group_counts else "neutral"
        
        insights = []
        suggestions = []
        patterns = {}
        recommendations = []
        
        # Sentiment-based insights (0-10 scale)
        if avg_sentiment > 7:
            insights.append("Your recent entries show a positive outlook!")
            patterns["sentiment_trend"] = "positive"
        elif avg_sentiment < 3:
            insights.append("Your recent entries suggest you might be going through a challenging time.")
            suggestions.append("Consider talking to a trusted friend or counselor about your feelings.")
            patterns["sentiment_trend"] = "negative"
        else:
            insights.append("Your mood has been relatively stable recently.")
            patterns["sentiment_trend"] = "neutral"
        
        # Stress-based insights (0-10 scale)
        if avg_stress > 7:
            insights.append("Your entries indicate high stress levels lately. 😰")
            suggestions.extend([
                "Try the 4-7-8 breathing technique: inhale for 4, hold for 7, exhale for 8.",
                "Consider taking short breaks every hour during work or study.",
                "Practice mindfulness or meditation for 5-10 minutes daily."
            ])
            patterns["stress_level"] = "high"
            recommendations.append("Consider stress management techniques or professional support")
        elif avg_stress > 4:
            insights.append("You're experiencing moderate stress levels.")
            suggestions.append("Try some light exercise or a short walk to help manage stress.")
            patterns["stress_level"] = "moderate"
        else:
            insights.append("Your stress levels appear manageable.")
            patterns["stress_level"] = "low"
        
        # Emotion-based insights
        if most_common_group == "positive":
            insights.append(f"You've been feeling {most_common_emotion} frequently - that's wonderful!")
            patterns["emotion_dominance"] = "positive"
        elif most_common_group == "negative":
            insights.append(f"You've been experiencing {most_common_emotion} often. It's okay to feel this way.")
            suggestions.append("Consider activities that bring you joy or relaxation.")
            patterns["emotion_dominance"] = "negative"
        else:
            insights.append("Your emotional state has been relatively balanced.")
            patterns["emotion_dominance"] = "neutral"
        
        # Writing pattern insights
        if avg_word_count > 100:
            insights.append("You write detailed entries - this shows great self-reflection!")
            patterns["writing_style"] = "detailed"
        elif avg_word_count > 50:
            insights.append("You maintain a good balance in your journaling.")
            patterns["writing_style"] = "moderate"
        else:
            suggestions.append("Try expanding on your thoughts - more detail can help with self-reflection.")
            patterns["writing_style"] = "brief"
        
        # Entry frequency insights
        if len(entries) >= days * 0.8:  # 80% of days
            insights.append(f"Excellent journaling consistency! You've written {len(entries)} entries in {days} days.")
            patterns["consistency"] = "excellent"
        elif len(entries) >= days * 0.5:  # 50% of days
            insights.append("Good journaling routine! Keep up the momentum.")
            patterns["consistency"] = "good"
        elif len(entries) >= days * 0.2:  # 20% of days
            insights.append("You're building a journaling habit. Every entry counts! 🌱")
            patterns["consistency"] = "building"
            suggestions.append("Try setting a daily reminder to write in your journal.")
        else:
            suggestions.append("Try to write in your journal more regularly, even if it's just a few sentences.")
            patterns["consistency"] = "irregular"
        
        # Generate personalized recommendations
        if patterns.get("stress_level") == "high" and patterns.get("sentiment_trend") == "negative":
            recommendations.append("Consider professional mental health support")
        if patterns.get("consistency") == "irregular":
            recommendations.append("Set up a daily journaling routine")
        if patterns.get("emotion_dominance") == "negative":
            recommendations.append("Engage in activities that promote positive emotions")
        
        return {
            "insights": insights,
            "suggestions": suggestions,
            "data_available": True,
            "patterns": patterns,
            "recommendations": recommendations,
            "statistics": {
                "avg_sentiment": round(avg_sentiment, 3),
                "avg_stress": round(avg_stress, 3),
                "avg_word_count": round(avg_word_count, 1),
                "most_common_emotion": most_common_emotion,
                "most_common_emotion_group": most_common_group,
                "entry_count": len(entries),
                "days_analyzed": days
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate insights: {str(e)}"
        )

@app.get("/analytics/stats")
async def get_stats(
    current_user: Dict[str, Any] = Depends(get_current_user_dependency)
):
    """
    Get overall statistics about journal entries.
    
    Returns comprehensive statistics including total entries, date ranges, and emotion distributions.
    """
    try:
        # Get all entries for the current user
        resp = supabase_db.table("journal_entries").select("*").eq("user_id", current_user["id"]).execute()
        all_entries = resp.data or []
        
        if not all_entries:
            return {
                "total_entries": 0,
                "date_range": None,
                "emotion_distribution": {},
                "sentiment_stats": {},
                "stress_stats": {},
                "writing_stats": {}
            }
        
        # Calculate basic stats
        total_entries = len(all_entries)
        def parse_dt(s):
            try:
                return datetime.fromisoformat(s.replace("Z", "+00:00"))
            except Exception:
                return datetime.utcnow()
        dates = [parse_dt(entry.get("date")) for entry in all_entries if entry.get("date")]
        min_date = min(dates) if dates else datetime.utcnow()
        max_date = max(dates) if dates else datetime.utcnow()
        
        # Emotion distribution
        emotion_counts = {}
        emotion_group_counts = {}
        for entry in all_entries:
            emotion = entry.get("emotion") or "neutral"
            emotion_group = entry.get("emotion_group") or "neutral"
            emotion_counts[emotion] = emotion_counts.get(emotion, 0) + 1
            emotion_group_counts[emotion_group] = emotion_group_counts.get(emotion_group, 0) + 1
        
        # Sentiment and stress stats
        sentiments = [entry.get("sentiment_score") for entry in all_entries if entry.get("sentiment_score") is not None]
        stress_levels = [entry.get("stress_level") for entry in all_entries if entry.get("stress_level") is not None]
        word_counts = [entry.get("word_count") for entry in all_entries if entry.get("word_count") is not None]
        
        return {
            "total_entries": total_entries,
            "date_range": {
                "first_entry": min_date.isoformat(),
                "last_entry": max_date.isoformat(),
                "span_days": (max_date - min_date).days + 1
            },
            "emotion_distribution": emotion_counts,
            "emotion_group_distribution": emotion_group_counts,
            "sentiment_stats": {
                "avg": round(sum(sentiments) / len(sentiments), 3) if sentiments else 0,
                "min": round(min(sentiments), 3) if sentiments else 0,
                "max": round(max(sentiments), 3) if sentiments else 0,
                "count": len(sentiments)
            },
            "stress_stats": {
                "avg": round(sum(stress_levels) / len(stress_levels), 3) if stress_levels else 0,
                "min": round(min(stress_levels), 3) if stress_levels else 0,
                "max": round(max(stress_levels), 3) if stress_levels else 0,
                "count": len(stress_levels)
            },
            "writing_stats": {
                "avg_word_count": round(sum(word_counts) / len(word_counts), 1) if word_counts else 0,
                "min_word_count": min(word_counts) if word_counts else 0,
                "max_word_count": max(word_counts) if word_counts else 0,
                "total_words": sum(word_counts) if word_counts else 0
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve statistics: {str(e)}"
        )

@app.get("/ai/methods")
async def get_ai_methods():
    """
    Get information about available AI analysis methods.
    
    Returns information about which AI frameworks are available and currently active.
    """
    return hybrid_service.get_available_methods()

@app.post("/ai/analyze/agno")
async def analyze_with_agno(entry: JournalEntryCreate):
    """
    Analyze a journal entry using Agno framework specifically.
    
    - **content**: The journal entry text (required)
    - **date**: Optional date for the entry (defaults to current time)
    
    Returns the analysis results using Agno framework with HuggingFace models.
    """
    try:
        analysis = hybrid_service.analyze_with_agno(entry.content)
        return {
            "analysis": analysis,
            "entry_content": entry.content,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Agno analysis failed: {str(e)}"
        )

@app.post("/ai/analyze/original")
async def analyze_with_original(entry: JournalEntryCreate):
    """
    Analyze a journal entry using the original implementation.
    
    - **content**: The journal entry text (required)
    - **date**: Optional date for the entry (defaults to current time)
    
    Returns the analysis results using the original ML implementation.
    """
    try:
        analysis = hybrid_service.analyze_with_original(entry.content)
        return {
            "analysis": analysis,
            "entry_content": entry.content,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Original analysis failed: {str(e)}"
        )

# User Profile Management Endpoints
@app.get("/profile", response_model=UserProfileResponse)
async def get_user_profile(
    current_user: Dict[str, Any] = Depends(get_current_user_dependency)
):
    """
    Get current user's profile information.
    """
    try:
        resp = supabase_db.table("user_profiles").select("*").eq("user_id", current_user["id"]).single().execute()
        profile = resp.data
        if not profile:
            insert_payload = {
                "user_id": current_user["id"],
                "email": current_user.get("email"),
                "full_name": current_user.get("user_metadata", {}).get("full_name"),
                "display_name": current_user.get("user_metadata", {}).get("display_name"),
                "role": "user",
            }
            profile = supabase_db.table("user_profiles").insert(insert_payload).select("*").single().execute().data
        return profile
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get user profile: {str(e)}"
        )

@app.put("/profile", response_model=UserProfileResponse)
async def update_user_profile(
    profile_update: UserProfileUpdate,
    current_user: Dict[str, Any] = Depends(get_current_user_dependency)
):
    """
    Update current user's profile information.
    """
    try:
        existing = supabase_db.table("user_profiles").select("id").eq("user_id", current_user["id"]).single().execute().data
        if not existing:
            raise HTTPException(status_code=404, detail="Profile not found")
        update_data = profile_update.dict(exclude_unset=True)
        update_data["updated_at"] = datetime.utcnow().isoformat()
        profile = supabase_db.table("user_profiles").update(update_data).eq("user_id", current_user["id"]).select("*").single().execute().data
        return profile
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update profile: {str(e)}"
        )

@app.get("/health")
async def health_check():
    """
    Health check endpoint for monitoring.
    """
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0"
    }

@app.get("/ready")
async def readiness_check():
    """
    Readiness check endpoint - returns 200 when fully ready.
    """
    return {
        "status": "ready",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", "8000")))
