# Debug Asset Detection Script
# This script will help diagnose why ayah-card asset detection is not working

Write-Host "=== NOOR Canvas Asset Detection Debug ===" -ForegroundColor Green

# Check if the app is currently running
Write-Host "`n1. Checking for running processes..." -ForegroundColor Yellow
$processes = Get-Process | Where-Object {$_.ProcessName -like "*dotnet*" -or $_.ProcessName -like "*NoorCanvas*"}
if ($processes) {
    Write-Host "Found running processes:" -ForegroundColor Red
    $processes | Format-Table ProcessName, Id, StartTime -AutoSize
    Write-Host "Stopping these processes..." -ForegroundColor Yellow
    $processes | Stop-Process -Force
    Start-Sleep 2
} else {
    Write-Host "No blocking processes found." -ForegroundColor Green
}

# Navigate to project directory
Write-Host "`n2. Navigating to project directory..." -ForegroundColor Yellow
Set-Location "d:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas"
Write-Host "Current directory: $(Get-Location)" -ForegroundColor Green

# Start the application
Write-Host "`n3. Starting NoorCanvas application..." -ForegroundColor Yellow
Write-Host "This will start the app and show logs for asset detection debugging." -ForegroundColor Cyan

# Start the application with verbose logging
Start-Process -FilePath "dotnet" -ArgumentList "run", "--configuration", "Debug" -NoNewWindow -Wait:$false

Write-Host "`n4. Application started. Check the console output for asset detection logs." -ForegroundColor Green
Write-Host "Look for these log entries:" -ForegroundColor Yellow
Write-Host "  - [ASSETSHARE-DB] Processing HTML using AssetLookup table" -ForegroundColor Cyan
Write-Host "  - Found X active asset types in AssetLookup table" -ForegroundColor Cyan
Write-Host "  - Found X instances of ayah-card using selector '.ayah-card'" -ForegroundColor Cyan

Write-Host "`nTo test:" -ForegroundColor Yellow
Write-Host "1. Navigate to: https://localhost:9091/host/HOST212A" -ForegroundColor Cyan
Write-Host "2. Start the session" -ForegroundColor Cyan
Write-Host "3. Check if share buttons appear on ayah-card elements" -ForegroundColor Cyan

Write-Host "`nPress Ctrl+C to stop the application when done." -ForegroundColor Yellow