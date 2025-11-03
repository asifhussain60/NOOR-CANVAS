# KDS Dashboard - All-in-One Launcher
# Purpose: Start API server and open dashboard in one command
# Usage: .\launch-dashboard.ps1 [-Port 8765]

param(
    [int]$Port = 8765,
    [switch]$KeepServerRunning
)

$ErrorActionPreference = 'Stop'

Write-Host "🧠 KDS Dashboard - All-in-One Launcher" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Gray
Write-Host ""

# Paths
$scriptDir = $PSScriptRoot
$workspaceRoot = Split-Path (Split-Path $scriptDir -Parent) -Parent
$dashboardPath = Join-Path $workspaceRoot "KDS\kds-dashboard.html"
$apiServerScript = Join-Path $scriptDir "dashboard-api-server.ps1"

# Verify files exist
if (-not (Test-Path $dashboardPath)) {
    Write-Host "❌ Error: Dashboard not found at $dashboardPath" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $apiServerScript)) {
    Write-Host "❌ Error: API server script not found at $apiServerScript" -ForegroundColor Red
    exit 1
}

# Step 1: Start API Server in separate visible window
Write-Host "Step 1/2: Starting API Server..." -ForegroundColor Cyan
Write-Host "  Port: $Port" -ForegroundColor Gray
Write-Host "  Mode: Separate PowerShell window (visible)" -ForegroundColor Gray

# Start API server in a new visible PowerShell window
$process = Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd '$workspaceRoot'; .\KDS\scripts\dashboard-api-server.ps1 -Port $Port" -PassThru

# Wait a moment for server to start
Start-Sleep -Seconds 3

# Check if process is running
if ($process -and !$process.HasExited) {
    Write-Host "  ✅ API Server started (PID: $($process.Id))" -ForegroundColor Green
    Write-Host "  ℹ️  Server window opened - keep it running" -ForegroundColor Cyan
} else {
    Write-Host "  ⚠️ API Server may have issues" -ForegroundColor Yellow
}

Write-Host ""

# Step 2: Open Dashboard
Write-Host "Step 2/2: Opening Dashboard..." -ForegroundColor Cyan

$url = "file:///$($dashboardPath.Replace('\', '/'))"
Write-Host "  URL: $url" -ForegroundColor Gray

Start-Process $url

Write-Host "  ✅ Dashboard opened in browser" -ForegroundColor Green
Write-Host ""

# Summary
Write-Host "=" * 60 -ForegroundColor Gray
Write-Host "✅ KDS Dashboard is ready!" -ForegroundColor Green
Write-Host ""
Write-Host "Dashboard:" -ForegroundColor Cyan
Write-Host "  • Opened in your default browser" -ForegroundColor Gray
Write-Host "  • Click Refresh to run health checks" -ForegroundColor Gray
Write-Host "  • Look for Live mode indicator" -ForegroundColor Gray
Write-Host ""
Write-Host "API Server:" -ForegroundColor Cyan
Write-Host "  • Running on http://localhost:$Port" -ForegroundColor Gray
Write-Host "  • Running in separate PowerShell window" -ForegroundColor Gray
Write-Host "  • Keep that window open while using dashboard" -ForegroundColor Gray
Write-Host ""
Write-Host "To Stop:" -ForegroundColor Yellow
Write-Host "  • Close the API server PowerShell window, or" -ForegroundColor Gray
Write-Host "  • Press Ctrl+C in the API server window" -ForegroundColor Gray
Write-Host ""
Write-Host "=" * 60 -ForegroundColor Gray
