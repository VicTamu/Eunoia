# PowerShell script to add Python Scripts to PATH permanently
# Run this as Administrator for system-wide changes, or as regular user for user-only changes

$pythonScriptsPath = "C:\Users\Vekek\AppData\Local\Packages\PythonSoftwareFoundation.Python.3.11_qbz5n2kfra8p0\LocalCache\local-packages\Python311\Scripts"

# Check if path already exists
$currentPath = [Environment]::GetEnvironmentVariable("PATH", "User")
if ($currentPath -notlike "*$pythonScriptsPath*") {
    # Add to user PATH
    $newPath = $currentPath + ";" + $pythonScriptsPath
    [Environment]::SetEnvironmentVariable("PATH", $newPath, "User")
    Write-Host "✅ Added Python Scripts to PATH successfully!" -ForegroundColor Green
    Write-Host "Path added: $pythonScriptsPath" -ForegroundColor Yellow
    Write-Host "⚠️  You may need to restart your terminal or IDE for changes to take effect." -ForegroundColor Cyan
} else {
    Write-Host "✅ Python Scripts path already exists in PATH!" -ForegroundColor Green
}

# Verify the addition
Write-Host "`nCurrent PATH entries containing 'Python':" -ForegroundColor Cyan
$currentPath.Split(';') | Where-Object { $_ -like "*Python*" } | ForEach-Object { Write-Host "  $_" -ForegroundColor White }
