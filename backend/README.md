# Eunoia Journal Backend API

A FastAPI-based backend service for the Eunoia Journal application, providing AI-powered sentiment analysis, emotion detection, and comprehensive journal entry management.

## Features

### Core Functionality
- **Journal Entry Management**: Full CRUD operations for journal entries
- **AI-Powered Analysis**: Automatic sentiment analysis, emotion detection, and stress level assessment
- **Advanced Search & Filtering**: Search entries by content, emotion, sentiment, stress level, and date ranges
- **Pagination**: Efficient pagination for large datasets
- **Analytics**: Comprehensive insights and trend analysis

### AI Analysis Features
- **Sentiment Analysis**: Positive, negative, or neutral sentiment with confidence scores
- **Emotion Detection**: 27 different emotions using GoEmotions model
- **Stress Level Assessment**: Based on keywords, emotional context, and stress indicators
- **Word Count**: Automatic calculation of entry length

### Database Features
- **SQLite Database**: Lightweight, file-based database
- **Optimized Schema**: Indexed fields for better performance
- **Migration Support**: Easy database schema updates
- **Transaction Safety**: Rollback on errors

## Quick Start

### Prerequisites
- Python 3.8 or higher
- pip (Python package manager)

### Installation

1. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

2. **Run Database Migration** (if upgrading from older version)
   ```bash
   python migrate_database.py
   ```

3. **Start the API Server**
   ```bash
   python main.py
   ```

   The API will be available at `http://localhost:8000`

4. **View API Documentation**
   - Interactive docs: `http://localhost:8000/docs`
   - ReDoc: `http://localhost:8000/redoc`

## API Endpoints

### Journal Entries
- `POST /entries/` - Create a new journal entry
- `GET /entries/` - Get paginated journal entries with filtering
- `GET /entries/{id}` - Get a specific journal entry
- `PUT /entries/{id}` - Update a journal entry
- `DELETE /entries/{id}` - Delete a journal entry

### Analytics
- `GET /analytics/sentiment-trends` - Get sentiment trends over time
- `GET /analytics/insights` - Get AI-generated insights and suggestions
- `GET /analytics/stats` - Get overall statistics

### System
- `GET /health` - Health check endpoint

## Configuration

### Environment Variables
- `DATABASE_URL`: Database connection string (default: SQLite)
- `CORS_ORIGINS`: Allowed CORS origins (default: localhost:3000)

### Database Configuration
The API uses SQLite by default. To use a different database:

1. Update `SQLALCHEMY_DATABASE_URL` in `main.py`
2. Install the appropriate database driver
3. Run the migration script

## Testing

### Run All Tests
```bash
python run_tests.py
```

### Run Specific Test
```bash
python run_tests.py TestJournalEntries::test_create_entry_success
```

### Test Coverage
The test suite covers:
- Journal entry CRUD operations
- API validation and error handling
- Analytics endpoints
- Pagination and filtering
- Edge cases and error scenarios

## Database Schema

### JournalEntry Table
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| date | DATETIME | Entry date (indexed) |
| content | TEXT | Journal entry text |
| sentiment_score | FLOAT | Sentiment score -1.0 to 1.0 (indexed) |
| emotion | VARCHAR(50) | Primary detected emotion (indexed) |
| emotion_confidence | FLOAT | Confidence in emotion detection |
| emotions_detected | TEXT | JSON array of all detected emotions |
| emotion_group | VARCHAR(20) | Emotion group: positive/negative/neutral (indexed) |
| stress_level | FLOAT | Stress level 0.0 to 1.0 (indexed) |
| word_count | INTEGER | Number of words in entry |
| created_at | DATETIME | Creation timestamp (indexed) |
| updated_at | DATETIME | Last update timestamp |

## AI Models

### Sentiment Analysis
- **Model**: `cardiffnlp/twitter-roberta-base-sentiment-latest`
- **Output**: Sentiment score (-1.0 to 1.0) and confidence

### Emotion Detection
- **Primary Model**: `TuhinG/distilbert-goemotions`
- **Fallback Model**: `j-hartmann/emotion-english-distilroberta-base`
- **Output**: 27 different emotions with confidence scores

### Stress Analysis
- **Method**: Keyword-based analysis combined with emotional context
- **Output**: Stress level (0.0 to 1.0)

## Performance Optimization

### Database Indexes
- Date-based queries: `idx_journal_entries_date`
- Sentiment filtering: `idx_journal_entries_sentiment`
- Emotion filtering: `idx_journal_entries_emotion`
- Stress filtering: `idx_journal_entries_stress`
- Time-based queries: `idx_journal_entries_created_at`

### Caching
- ML models are loaded once and cached in memory
- Database connections are pooled
- Query results are optimized with proper indexing

## Error Handling

### HTTP Status Codes
- `200 OK`: Successful request
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request data
- `404 Not Found`: Resource not found
- `422 Unprocessable Entity`: Validation error
- `500 Internal Server Error`: Server error

### Error Response Format
```json
{
  "detail": "Error message describing what went wrong"
}
```

## Development

### Project Structure
```
backend/
├── main.py                 # FastAPI application
├── ml_service.py          # AI/ML analysis service
├── test_api.py            # Test suite
├── migrate_database.py    # Database migration script
├── run_tests.py           # Test runner
├── requirements.txt       # Python dependencies
├── API_DOCUMENTATION.md   # Comprehensive API docs
└── README.md             # This file
```

### Adding New Features

1. **New Endpoints**: Add to `main.py` with proper validation
2. **Database Changes**: Update schema and create migration
3. **AI Analysis**: Extend `ml_service.py` with new models
4. **Tests**: Add comprehensive tests for new functionality

### Code Style
- Follow PEP 8 guidelines
- Use type hints for all function parameters and return values
- Add comprehensive docstrings for all functions
- Include error handling for all external dependencies

## Deployment

### Production Considerations
1. **Database**: Consider PostgreSQL for production
2. **Authentication**: Implement proper user authentication
3. **Rate Limiting**: Add rate limiting for API endpoints
4. **Monitoring**: Set up logging and monitoring
5. **Security**: Implement proper CORS and security headers

### Docker Deployment
```dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["python", "main.py"]
```

## Troubleshooting

### Common Issues

1. **Database Locked Error**
   - Ensure no other processes are using the database
   - Check file permissions

2. **ML Model Loading Issues**
   - Ensure internet connection for model download
   - Check available disk space
   - Verify Python dependencies

3. **CORS Errors**
   - Update CORS origins in `main.py`
   - Check frontend URL configuration

### Logs
- Application logs are printed to stdout
- Database errors are logged with context
- ML model loading status is logged

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## License

This project is for educational purposes. Please ensure compliance with all applicable laws and regulations when handling personal data.

## Support

For issues and questions:
1. Check the API documentation
2. Review the test cases for usage examples
3. Check the troubleshooting section
4. Create an issue with detailed information
