#!/usr/bin/env python3
"""
Production startup script for Eunoia backend
This script ensures the application starts correctly in production
"""

import os
import sys
import uvicorn
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

# Set environment variables for production
os.environ.setdefault('PYTHONPATH', str(backend_dir))

def main():
    """Start the FastAPI application"""
    try:
        # Import the hybrid app
        from hybrid_main import app
        
        # Get port from environment (Render sets this)
        port = int(os.environ.get('PORT', 8000))
        
        print(f"Starting Eunoia backend on port {port}")
        print("Environment variables:")
        print(f"  - SUPABASE_URL: {'Set' if os.environ.get('SUPABASE_URL') else 'Not set'}")
        print(f"  - HF_TOKEN: {'Set' if os.environ.get('HF_TOKEN') else 'Not set'}")
        
        # Start the server
        uvicorn.run(
            app,
            host="0.0.0.0",
            port=port,
            log_level="info"
        )
    except Exception as e:
        print(f"Failed to start application: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
