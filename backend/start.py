#!/usr/bin/env python3
"""
Startup script for Eunoia Journal Backend
"""
import uvicorn
import sys
import os

# Add the backend directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

if __name__ == "__main__":
    print("🚀 Starting Eunoia Journal Backend...")
    print("📊 API will be available at: http://localhost:8000")
    print("📚 API documentation at: http://localhost:8000/docs")
    print("🔄 Press Ctrl+C to stop the server")
    print("-" * 50)
    
    try:
        uvicorn.run(
            "main:app",
            host="0.0.0.0",
            port=8000,
            reload=True,
            log_level="info"
        )
    except KeyboardInterrupt:
        print("\n👋 Shutting down Eunoia Journal Backend...")
    except Exception as e:
        print(f"❌ Error starting server: {e}")
        sys.exit(1)
