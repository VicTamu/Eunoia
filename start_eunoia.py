#!/usr/bin/env python3
"""
🌟 Eunoia Journal - Unified Startup Script 🌟
One-click startup for the complete Eunoia Journal application
"""
import subprocess
import sys
import os
import time
import threading
import webbrowser
import signal
import atexit
from pathlib import Path
from datetime import datetime
from typing import Dict

try:
    from dotenv import load_dotenv
except Exception:
    # dotenv is optional; script still works if backend loads env itself
    load_dotenv = None  # type: ignore

# Global variables to track processes
backend_process = None
frontend_process = None
browser_opened = False

def print_banner():
    """Print the startup banner"""
    print("=" * 70)
    print("🌟 EUNOIA JOURNAL - AI-POWERED JOURNALING APP 🌟")
    print("=" * 70)
    print(f"🚀 Starting at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("📝 AI-powered sentiment analysis and emotion detection")
    print("🎨 Modern React frontend with beautiful UI")
    print("🔧 FastAPI backend with comprehensive analytics")
    print("=" * 70)
    print()

def check_dependencies():
    """Check if required dependencies are installed"""
    print("🔍 Checking dependencies...")
    
    # Check Python version
    if sys.version_info < (3, 8):
        print("❌ Python 3.8+ is required. Current version:", sys.version)
        return False
    
    # Check if Node.js is installed
    try:
        result = subprocess.run(["node", "--version"], capture_output=True, text=True, shell=True)
        if result.returncode != 0:
            print("❌ Node.js is not installed or not in PATH")
            return False
        print(f"✅ Node.js: {result.stdout.strip()}")
    except FileNotFoundError:
        print("❌ Node.js is not installed or not in PATH")
        return False
    
    # Check if npm is available
    try:
        result = subprocess.run(["npm", "--version"], capture_output=True, text=True, shell=True)
        if result.returncode != 0:
            print("❌ npm is not available")
            return False
        print(f"✅ npm: {result.stdout.strip()}")
    except FileNotFoundError:
        print("❌ npm is not available")
        return False
    
    print("✅ All dependencies are available!")
    return True

def _mask_value(value: str) -> str:
    """Mask sensitive env values for logging."""
    if not value:
        return ""
    if len(value) <= 6:
        return "***"
    return value[:3] + "***" + value[-3:]

def load_env_files() -> Dict[str, str]:
    """Load environment variables from .env files and export to os.environ.
    Order of precedence (last wins): project .env -> backend/.env -> frontend/.env
    Returns a dict of keys loaded (masked values for display only).
    """
    loaded: Dict[str, str] = {}
    project_root = Path(__file__).parent
    env_paths = [
        project_root / ".env",
        project_root / "backend" / ".env",
        project_root / "frontend" / ".env",
    ]

    print("🧪 Loading environment variables from .env files...")
    for env_path in env_paths:
        try:
            if env_path.exists():
                if load_dotenv is not None:
                    # load_dotenv returns True if file was loaded
                    load_dotenv(dotenv_path=env_path, override=True)
                else:
                    # Manual parse as a fallback if python-dotenv missing
                    for line in env_path.read_text(encoding="utf-8").splitlines():
                        line = line.strip()
                        if not line or line.startswith("#") or "=" not in line:
                            continue
                        key, val = line.split("=", 1)
                        key = key.strip()
                        val = val.strip().strip('"').strip("'")
                        os.environ[key] = val
                # Track loaded keys for display (masked)
                for key in ("EUNOIA_USE_AGNO", "HF_TOKEN", "EUNOIA_ENABLE_MODELS"):
                    if key in os.environ:
                        loaded[key] = _mask_value(os.environ.get(key, ""))
                print(f"   • Loaded {env_path.relative_to(project_root)}")
        except Exception as e:
            print(f"⚠️  Could not load {env_path.name}: {e}")

    if loaded:
        print("✅ Environment loaded:")
        for k, v in loaded.items():
            print(f"   - {k}={v}")
    else:
        print("ℹ️  No .env files found or no relevant keys present.")

    return loaded

def install_backend_dependencies():
    """Install Python backend dependencies"""
    print("📦 Installing backend dependencies...")
    backend_dir = Path(__file__).parent / "backend"
    
    try:
        # Check if requirements.txt exists
        requirements_file = backend_dir / "requirements.txt"
        if not requirements_file.exists():
            print("⚠️ requirements.txt not found, skipping dependency installation")
            return True
        
        # First, try to fix any corrupted packages
        print("🔧 Checking for corrupted packages...")
        subprocess.run([
            sys.executable, "-m", "pip", "install", "--upgrade", "pip", "setuptools", "wheel"
        ], cwd=backend_dir, capture_output=True, text=True)
        
        # Try to fix transformers installation issues
        print("🤖 Fixing transformers installation...")
        try:
            subprocess.run([
                sys.executable, "-m", "pip", "uninstall", "transformers", "-y"
            ], cwd=backend_dir, capture_output=True, text=True)
        except:
            pass
        
        # Install transformers with specific version to avoid issues
        try:
            subprocess.run([
                sys.executable, "-m", "pip", "install", "transformers==4.21.0", "--no-cache-dir", "--force-reinstall"
            ], cwd=backend_dir, capture_output=True, text=True)
        except:
            pass
        
        # Install dependencies with better error handling and ignore problematic packages
        print("📦 Installing all dependencies...")
        result = subprocess.run([
            sys.executable, "-m", "pip", "install", "-r", str(requirements_file), 
            "--no-cache-dir", "--ignore-installed", "--no-deps"
        ], cwd=backend_dir, capture_output=True, text=True)
        
        # If that fails, try installing core dependencies only
        if result.returncode != 0:
            print("🔄 Trying to install core dependencies only...")
            core_deps = [
                "fastapi", "uvicorn", "sqlalchemy", "numpy", 
                "scikit-learn", "requests", "python-multipart"
            ]
            for dep in core_deps:
                try:
                    subprocess.run([
                        sys.executable, "-m", "pip", "install", dep, "--no-cache-dir"
                    ], cwd=backend_dir, capture_output=True, text=True)
                except:
                    pass
        
        print("✅ Backend dependencies installation completed!")
        return True
    except Exception as e:
        print(f"⚠️ Error installing backend dependencies: {e}")
        print("Continuing anyway...")
        return True

def install_frontend_dependencies():
    """Install frontend dependencies if needed"""
    print("📦 Checking frontend dependencies...")
    frontend_dir = Path(__file__).parent / "frontend"
    node_modules = frontend_dir / "node_modules"
    
    if not node_modules.exists():
        print("📦 Installing frontend dependencies...")
        try:
            result = subprocess.run(["npm", "install"], cwd=frontend_dir, capture_output=True, text=True, shell=True)
            if result.returncode != 0:
                print(f"❌ Failed to install frontend dependencies: {result.stderr}")
                return False
            print("✅ Frontend dependencies installed successfully!")
        except Exception as e:
            print(f"❌ Error installing frontend dependencies: {e}")
            return False
    else:
        print("✅ Frontend dependencies already installed!")
    
    return True

def create_sample_data():
    """Create sample data for demonstration"""
    print("📊 Creating sample data...")
    backend_dir = Path(__file__).parent / "backend"
    sample_data_script = backend_dir / "sample_data.py"
    
    if sample_data_script.exists():
        try:
            result = subprocess.run([sys.executable, str(sample_data_script)], 
                                  cwd=backend_dir, capture_output=True, text=True)
            if result.returncode == 0:
                print("✅ Sample data created successfully!")
            else:
                print("⚠️ Sample data creation had issues, continuing anyway...")
        except Exception as e:
            print(f"⚠️ Error creating sample data: {e}")
            print("Continuing anyway...")
    else:
        print("⚠️ Sample data script not found, skipping...")

def check_port_available(port):
    """Check if a port is available"""
    import socket
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.bind(('localhost', port))
            return True
    except OSError:
        return False

def kill_process_on_port(port):
    """Kill any process using the specified port"""
    try:
        import subprocess
        # Find process using the port
        result = subprocess.run(f'netstat -ano | findstr :{port}', shell=True, capture_output=True, text=True)
        if result.stdout:
            lines = result.stdout.strip().split('\n')
            pids_to_kill = set()
            for line in lines:
                if 'LISTENING' in line:
                    parts = line.split()
                    if len(parts) >= 5:
                        pid = parts[-1]
                        pids_to_kill.add(pid)
            
            for pid in pids_to_kill:
                try:
                    subprocess.run(f'taskkill /PID {pid} /F', shell=True, capture_output=True)
                    print(f"🛑 Killed process {pid} using port {port}")
                except:
                    pass
            
            # Wait a moment for the port to be freed
            time.sleep(2)
    except Exception as e:
        print(f"⚠️ Could not check port {port}: {e}")

def start_backend():
    """Start the FastAPI backend server"""
    global backend_process
    print("🚀 Starting Backend Server...")
    backend_dir = Path(__file__).parent / "backend"
    
    # Check if port 8000 is available
    if not check_port_available(8000):
        print("⚠️ Port 8000 is in use, attempting to free it...")
        kill_process_on_port(8000)
        time.sleep(2)
        
        # Check again
        if not check_port_available(8000):
            print("❌ Port 8000 is still in use. Please close other applications using this port.")
            return False
    
    try:
        # Start the backend server
        env = os.environ.copy()
        backend_process = subprocess.Popen([
            sys.executable, "-c", 
            "import uvicorn; from main import app; uvicorn.run(app, host='0.0.0.0', port=8000, log_level='info')"
        ], cwd=backend_dir, env=env)
        
        # Wait a moment and check if it started successfully
        time.sleep(5)
        if backend_process.poll() is not None:
            stdout, stderr = backend_process.communicate()
            error_msg = stderr.decode()
            print(f"❌ Backend failed to start: {error_msg}")
            
            # Check for port conflict
            if "Address already in use" in error_msg or "error while attempting to bind" in error_msg:
                print("💡 Port 8000 is still in use. Trying to free it...")
                kill_process_on_port(8000)
                time.sleep(3)
                print("🔄 Retrying backend startup...")
                return start_backend()  # Retry once
            
            return False
        
        print("✅ Backend server started successfully!")
        print("🌐 Backend API: http://localhost:8000")
        print("📚 API Documentation: http://localhost:8000/docs")
        return True
        
    except Exception as e:
        print(f"❌ Error starting backend: {e}")
        return False

def start_frontend():
    """Start the React frontend development server"""
    global frontend_process
    print("🎨 Starting Frontend Server...")
    frontend_dir = Path(__file__).parent / "frontend"
    
    # Check if port 3000 is available
    if not check_port_available(3000):
        print("⚠️ Port 3000 is in use, attempting to free it...")
        kill_process_on_port(3000)
        time.sleep(3)
        
        # Check again
        if not check_port_available(3000):
            print("❌ Port 3000 is still in use. Please close other applications using this port.")
            return False
    
    try:
        # Set environment variable to automatically accept port changes
        env = os.environ.copy()
        env['BROWSER'] = 'none'  # Prevent automatic browser opening
        
        # Start the frontend server with automatic port selection
        frontend_process = subprocess.Popen(
            ["npm", "start"], 
            cwd=frontend_dir, 
            shell=True,
            env=env,
            stdout=None,
            stderr=None
        )
        
        # Wait a moment and check if it started successfully
        time.sleep(10)  # Give more time for React to start
        if frontend_process.poll() is not None:
            stdout, stderr = frontend_process.communicate()
            print(f"❌ Frontend failed to start: {stderr.decode()}")
            return False
        
        print("✅ Frontend server started successfully!")
        print("🌐 Frontend App: http://localhost:3000")
        return True
        
    except Exception as e:
        print(f"❌ Error starting frontend: {e}")
        return False

def open_browser():
    """Open the application in the default browser"""
    global browser_opened
    if not browser_opened:
        print("🌐 Opening application in browser...")
        time.sleep(8)  # Wait for both servers to be ready
        try:
            webbrowser.open("http://localhost:3000")
            browser_opened = True
            print("✅ Application opened in browser!")
        except Exception as e:
            print(f"⚠️ Could not open browser automatically: {e}")
            print("Please manually open: http://localhost:3000")

def cleanup_processes():
    """Clean up running processes"""
    global backend_process, frontend_process
    
    print("\n🛑 Shutting down servers...")
    
    if backend_process and backend_process.poll() is None:
        print("🛑 Stopping backend server...")
        backend_process.terminate()
        try:
            backend_process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            backend_process.kill()
    
    if frontend_process and frontend_process.poll() is None:
        print("🛑 Stopping frontend server...")
        frontend_process.terminate()
        try:
            frontend_process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            frontend_process.kill()
    
    print("✅ All servers stopped successfully!")

def signal_handler(signum, frame):
    """Handle Ctrl+C gracefully"""
    print("\n\n🛑 Received shutdown signal...")
    cleanup_processes()
    print("👋 Thank you for using Eunoia Journal! 💙")
    sys.exit(0)

def main():
    """Main startup function"""
    # Set up signal handlers
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    atexit.register(cleanup_processes)
    
    # Print banner
    print_banner()
    
    # Load environment variables early so child processes inherit them
    load_env_files()

    # Check dependencies
    if not check_dependencies():
        print("\n❌ Dependency check failed. Please install required dependencies.")
        input("Press Enter to exit...")
        sys.exit(1)
    
    print()
    
    # Install dependencies
    if not install_backend_dependencies():
        print("\n❌ Backend dependency installation failed.")
        input("Press Enter to exit...")
        sys.exit(1)
    
    if not install_frontend_dependencies():
        print("\n❌ Frontend dependency installation failed.")
        input("Press Enter to exit...")
        sys.exit(1)
    
    print()
    
    # Create sample data
    create_sample_data()
    print()
    
    # Start backend
    if not start_backend():
        print("\n❌ Failed to start backend server.")
        input("Press Enter to exit...")
        sys.exit(1)
    
    print()
    
    # Start frontend
    if not start_frontend():
        print("\n❌ Failed to start frontend server.")
        cleanup_processes()
        input("Press Enter to exit...")
        sys.exit(1)
    
    print()
    
    # Open browser in a separate thread
    browser_thread = threading.Thread(target=open_browser, daemon=True)
    browser_thread.start()
    
    # Print success message
    print("=" * 70)
    print("🎉 EUNOIA JOURNAL IS NOW RUNNING! 🎉")
    print("=" * 70)
    print("🌐 Frontend: http://localhost:3000")
    print("🔧 Backend:  http://localhost:8000")
    print("📚 API Docs: http://localhost:8000/docs")
    print()
    print("📝 Features available:")
    print("   • Write journal entries with AI analysis")
    print("   • View mood trends and insights")
    print("   • Browse past entries with search")
    print("   • Real-time sentiment and emotion detection")
    print()
    print("🛑 Press Ctrl+C to stop all servers")
    print("=" * 70)
    
    try:
        # Keep the main thread alive
        while True:
            time.sleep(1)
            # Check if processes are still running
            if backend_process and backend_process.poll() is not None:
                print("❌ Backend server stopped unexpectedly!")
                break
            if frontend_process and frontend_process.poll() is not None:
                print("❌ Frontend server stopped unexpectedly!")
                break
    except KeyboardInterrupt:
        pass
    finally:
        cleanup_processes()
        print("👋 Thank you for using Eunoia Journal! 💙")

if __name__ == "__main__":
    main()
