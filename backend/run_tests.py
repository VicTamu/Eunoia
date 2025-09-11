#!/usr/bin/env python3
"""
Test runner for Eunoia Journal API
"""
import subprocess
import sys
import os

def run_tests():
    """Run the test suite"""
    print("🧪 Running Eunoia Journal API Tests...")
    print("=" * 50)
    
    # Change to backend directory
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    try:
        # Run pytest with verbose output
        result = subprocess.run([
            sys.executable, "-m", "pytest", 
            "test_api.py", 
            "-v", 
            "--tb=short",
            "--color=yes"
        ], check=True)
        
        print("\n✅ All tests passed!")
        return True
        
    except subprocess.CalledProcessError as e:
        print(f"\n❌ Tests failed with exit code {e.returncode}")
        return False
    except Exception as e:
        print(f"\n❌ Error running tests: {e}")
        return False

def run_specific_test(test_name):
    """Run a specific test"""
    print(f"🧪 Running test: {test_name}")
    print("=" * 50)
    
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    try:
        result = subprocess.run([
            sys.executable, "-m", "pytest", 
            f"test_api.py::{test_name}", 
            "-v", 
            "--tb=short",
            "--color=yes"
        ], check=True)
        
        print(f"\n✅ Test {test_name} passed!")
        return True
        
    except subprocess.CalledProcessError as e:
        print(f"\n❌ Test {test_name} failed with exit code {e.returncode}")
        return False

if __name__ == "__main__":
    if len(sys.argv) > 1:
        # Run specific test
        test_name = sys.argv[1]
        success = run_specific_test(test_name)
    else:
        # Run all tests
        success = run_tests()
    
    sys.exit(0 if success else 1)
