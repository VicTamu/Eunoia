# Eunoia Journal API Documentation

## Overview

The Eunoia Journal API is a FastAPI-based backend service that provides journal entry management with AI-powered sentiment analysis, emotion detection, and stress level assessment. The API uses SQLite for data storage and integrates with Hugging Face models for natural language processing.

## Base URL

```
http://localhost:8000
```

## Authentication

Currently, the API does not require authentication. This is suitable for a local, single-user journaling application.

## API Endpoints

### 1. Health Check

**GET** `/health`

Check the API health status.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00",
  "version": "1.0.0"
}
```

### 2. Journal Entries

#### Create Entry

**POST** `/entries/`

Create a new journal entry with AI analysis.

**Request Body:**
```json
{
  "content": "Today was a great day! I finished my project and felt really accomplished.",
  "date": "2024-01-15T10:30:00"  // Optional, defaults to current time
}
```

**Response (201 Created):**
```json
{
  "id": 1,
  "date": "2024-01-15T10:30:00",
  "content": "Today was a great day! I finished my project and felt really accomplished.",
  "sentiment_score": 0.8,
  "emotion": "joy",
  "emotion_confidence": 0.92,
  "emotions_detected": "[['joy', 0.92], ['excitement', 0.15]]",
  "emotion_group": "positive",
  "stress_level": 0.1,
  "word_count": 18,
  "created_at": "2024-01-15T10:30:00",
  "updated_at": "2024-01-15T10:30:00"
}
```

#### Get Entries (Paginated)

**GET** `/entries/`

Retrieve journal entries with pagination, search, and filtering.

**Query Parameters:**
- `page` (int, default: 1): Page number
- `per_page` (int, default: 10, max: 100): Entries per page
- `search` (string, optional): Search in content
- `emotion` (string, optional): Filter by emotion
- `emotion_group` (string, optional): Filter by emotion group (positive/negative/neutral)
- `min_sentiment` (float, optional): Minimum sentiment score (-1.0 to 1.0)
- `max_sentiment` (float, optional): Maximum sentiment score (-1.0 to 1.0)
- `min_stress` (float, optional): Minimum stress level (0.0 to 1.0)
- `max_stress` (float, optional): Maximum stress level (0.0 to 1.0)
- `start_date` (datetime, optional): Start date filter
- `end_date` (datetime, optional): End date filter
- `sort_by` (string, default: "created_at"): Sort field
- `sort_order` (string, default: "desc"): Sort order (asc/desc)

**Response:**
```json
{
  "entries": [
    {
      "id": 1,
      "date": "2024-01-15T10:30:00",
      "content": "Today was a great day!",
      "sentiment_score": 0.8,
      "emotion": "joy",
      "emotion_confidence": 0.92,
      "emotions_detected": "[['joy', 0.92], ['excitement', 0.15]]",
      "emotion_group": "positive",
      "stress_level": 0.1,
      "word_count": 18,
      "created_at": "2024-01-15T10:30:00",
      "updated_at": "2024-01-15T10:30:00"
    }
  ],
  "total": 1,
  "page": 1,
  "per_page": 10,
  "total_pages": 1,
  "has_next": false,
  "has_prev": false
}
```

#### Get Single Entry

**GET** `/entries/{entry_id}`

Retrieve a specific journal entry by ID.

**Response:**
```json
{
  "id": 1,
  "date": "2024-01-15T10:30:00",
  "content": "Today was a great day!",
  "sentiment_score": 0.8,
  "emotion": "joy",
  "emotion_confidence": 0.92,
  "emotions_detected": "[['joy', 0.92], ['excitement', 0.15]]",
  "emotion_group": "positive",
  "stress_level": 0.1,
  "word_count": 18,
  "created_at": "2024-01-15T10:30:00",
  "updated_at": "2024-01-15T10:30:00"
}
```

#### Update Entry

**PUT** `/entries/{entry_id}`

Update a journal entry. If content is updated, the entry will be re-analyzed.

**Request Body:**
```json
{
  "content": "Updated journal entry content",  // Optional
  "date": "2024-01-15T11:00:00"  // Optional
}
```

**Response:**
```json
{
  "id": 1,
  "date": "2024-01-15T11:00:00",
  "content": "Updated journal entry content",
  "sentiment_score": 0.6,
  "emotion": "neutral",
  "emotion_confidence": 0.75,
  "emotions_detected": "[['neutral', 0.75]]",
  "emotion_group": "neutral",
  "stress_level": 0.2,
  "word_count": 4,
  "created_at": "2024-01-15T10:30:00",
  "updated_at": "2024-01-15T11:00:00"
}
```

#### Delete Entry

**DELETE** `/entries/{entry_id}`

Delete a journal entry.

**Response:**
```json
{
  "message": "Entry deleted successfully"
}
```

### 3. Analytics

#### Sentiment Trends

**GET** `/analytics/sentiment-trends`

Get sentiment trends for the dashboard.

**Query Parameters:**
- `days` (int, default: 30, range: 1-365): Number of days to analyze

**Response:**
```json
{
  "trends": [
    {
      "date": "2024-01-15",
      "avg_sentiment": 0.8,
      "avg_stress": 0.1,
      "avg_word_count": 45.5,
      "most_common_emotion": "joy",
      "most_common_emotion_group": "positive",
      "entry_count": 2
    }
  ],
  "total_entries": 15,
  "days_analyzed": 30,
  "summary": {
    "avg_sentiment": 0.6,
    "avg_stress": 0.3,
    "most_common_emotion": "joy",
    "total_entries": 15
  }
}
```

#### Insights

**GET** `/analytics/insights`

Get AI-generated insights and suggestions.

**Query Parameters:**
- `days` (int, default: 7, range: 1-30): Number of days to analyze

**Response:**
```json
{
  "insights": [
    "Your recent entries show a positive outlook! 🌟",
    "You write detailed entries - this shows great self-reflection! 📝"
  ],
  "suggestions": [
    "Try some light exercise or a short walk to help manage stress."
  ],
  "data_available": true,
  "patterns": {
    "sentiment_trend": "positive",
    "stress_level": "low",
    "emotion_dominance": "positive",
    "writing_style": "detailed",
    "consistency": "excellent"
  },
  "recommendations": [],
  "statistics": {
    "avg_sentiment": 0.6,
    "avg_stress": 0.3,
    "avg_word_count": 45.5,
    "most_common_emotion": "joy",
    "most_common_emotion_group": "positive",
    "entry_count": 7,
    "days_analyzed": 7
  }
}
```

#### Statistics

**GET** `/analytics/stats`

Get overall statistics about journal entries.

**Response:**
```json
{
  "total_entries": 50,
  "date_range": {
    "first_entry": "2024-01-01T00:00:00",
    "last_entry": "2024-01-15T23:59:59",
    "span_days": 15
  },
  "emotion_distribution": {
    "joy": 20,
    "neutral": 15,
    "sadness": 10,
    "anger": 5
  },
  "emotion_group_distribution": {
    "positive": 25,
    "neutral": 15,
    "negative": 10
  },
  "sentiment_stats": {
    "avg": 0.4,
    "min": -0.8,
    "max": 0.9,
    "count": 50
  },
  "stress_stats": {
    "avg": 0.3,
    "min": 0.0,
    "max": 0.9,
    "count": 50
  },
  "writing_stats": {
    "avg_word_count": 45.5,
    "min_word_count": 5,
    "max_word_count": 200,
    "total_words": 2275
  }
}
```

## Data Models

### JournalEntry

| Field | Type | Description |
|-------|------|-------------|
| id | integer | Unique identifier |
| date | datetime | Entry date |
| content | string | Journal entry text |
| sentiment_score | float | Sentiment score (-1.0 to 1.0) |
| emotion | string | Primary detected emotion |
| emotion_confidence | float | Confidence in emotion detection |
| emotions_detected | string | JSON array of all detected emotions |
| emotion_group | string | Emotion group (positive/negative/neutral) |
| stress_level | float | Stress level (0.0 to 1.0) |
| word_count | integer | Number of words in entry |
| created_at | datetime | Creation timestamp |
| updated_at | datetime | Last update timestamp |

### Error Responses

All endpoints may return the following error responses:

**400 Bad Request:**
```json
{
  "detail": "Validation error message"
}
```

**404 Not Found:**
```json
{
  "detail": "Entry not found"
}
```

**500 Internal Server Error:**
```json
{
  "detail": "Internal server error message"
}
```

## AI Analysis Features

The API automatically analyzes each journal entry for:

1. **Sentiment Analysis**: Positive, negative, or neutral sentiment with confidence scores
2. **Emotion Detection**: 27 different emotions using GoEmotions model
3. **Stress Level Assessment**: Based on keywords, emotional context, and stress indicators
4. **Word Count**: Automatic calculation of entry length

## Rate Limiting

Currently, no rate limiting is implemented. For production use, consider implementing rate limiting based on your requirements.

## CORS

The API is configured to accept requests from `http://localhost:3000` (React development server). Update the CORS settings in `main.py` for production deployment.

## Database

The API uses SQLite with the following features:
- Automatic table creation
- Indexed fields for better performance
- Transaction support with rollback on errors
- Connection pooling

## Development

To run the API in development mode:

```bash
cd backend
pip install -r requirements.txt
python main.py
```

The API will be available at `http://localhost:8000` with automatic API documentation at `http://localhost:8000/docs`.
