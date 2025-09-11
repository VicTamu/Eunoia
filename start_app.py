#!/usr/bin/env python3
"""
Eunoia Journal - Complete Application Startup Script
"""
import subprocess
import sys
import os
import time
import threading
import webbrowser
from pathlib import Path

def run_backend():
    """Start the FastAPI backend server"""
    print("🚀 Starting Backend Server...")
    backend_dir = Path(__file__).parent / "backend"
    os.chdir(backend_dir)
    
    # Create sample data first
    print("📊 Creating sample data...")
    try:
        subprocess.run([sys.executable, "sample_data.py"], check=True)
    except subprocess.CalledProcessError:
        print("⚠️ Sample data creation failed, continuing without it...")
    
    # Start the backend server
    print("🌐 Starting FastAPI server...")
    subprocess.run([sys.executable, "-c", "import uvicorn; from main import app; uvicorn.run(app, host='0.0.0.0', port=8000, log_level='info')"], check=True)

def run_frontend():
    """Start the React frontend development server"""
    print("🎨 Starting Frontend Server...")
    frontend_dir = Path(__file__).parent / "frontend"
    os.chdir(frontend_dir)
    
    # Install dependencies if needed
    if not (frontend_dir / "node_modules").exists():
        print("📦 Installing frontend dependencies...")
        subprocess.run(["npm", "install"], check=True)
    
    # Start the frontend server
    subprocess.run(["npm", "start"], check=True)

def main():
    """Main startup function"""
    print("=" * 60)
    print("🌟 Welcome to Eunoia Journal! 🌟")
    print("=" * 60)
    print()
    print("This will start both the backend API and frontend web app.")
    print("The app will be available at: http://localhost:3000")
    print("API documentation at: http://localhost:8000/docs")
    print()
    print("Press Ctrl+C to stop both servers")
    print("-" * 60)
    
    try:
        # Start backend in a separate thread
        backend_thread = threading.Thread(target=run_backend, daemon=True)
        backend_thread.start()
        
        # Wait a moment for backend to start
        time.sleep(3)
        
        # Open browser after a short delay
        def open_browser():
            time.sleep(5)
            webbrowser.open("http://localhost:3000")
        
        browser_thread = threading.Thread(target=open_browser, daemon=True)
        browser_thread.start()
        
        # Start frontend (this will block)
        run_frontend()
        
    except KeyboardInterrupt:
        print("\n👋 Shutting down Eunoia Journal...")
        print("Thank you for using Eunoia Journal! 💙")
    except Exception as e:
        print(f"❌ Error starting application: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
