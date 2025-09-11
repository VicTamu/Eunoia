# Eunoia Journal - PowerShell Startup Script
# One-click startup for the complete Eunoia Journal application

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "🌟 EUNOIA JOURNAL - ONE-CLICK STARTUP 🌟" -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "This will start the complete Eunoia Journal application:" -ForegroundColor White
Write-Host "  • Backend API server (Python/FastAPI)" -ForegroundColor Gray
Write-Host "  • Frontend web app (React/TypeScript)" -ForegroundColor Gray
Write-Host "  • Sample data creation" -ForegroundColor Gray
Write-Host "  • Automatic browser opening" -ForegroundColor Gray
Write-Host ""

# Check if Python is available
try {
    $pythonVersion = python --version 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Python not found"
    }
    Write-Host "✅ Python found: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Python is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Python 3.8+ and try again" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Download Python from: https://www.python.org/downloads/" -ForegroundColor Cyan
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "🚀 Starting Eunoia Journal..." -ForegroundColor Green
Write-Host ""

# Run the Python startup script
try {
    python start_eunoia.py
} catch {
    Write-Host "❌ Error running Eunoia Journal: $_" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "👋 Eunoia Journal has been stopped." -ForegroundColor Yellow
Read-Host "Press Enter to exit"
