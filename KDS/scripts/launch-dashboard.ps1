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

# Step 1: Start API Server in background
Write-Host "Step 1/2: Starting API Server..." -ForegroundColor Cyan
Write-Host "  Port: $Port" -ForegroundColor Gray
Write-Host "  Mode: Background process" -ForegroundColor Gray

$job = Start-Job -ScriptBlock {
    param($Script, $Port)
    & $Script -Port $Port
} -ArgumentList $apiServerScript, $Port

# Wait a moment for server to start
Start-Sleep -Seconds 2

# Check if job is running
$jobState = Get-Job -Id $job.Id | Select-Object -ExpandProperty State
if ($jobState -eq 'Running') {
    Write-Host "  ✅ API Server started (Job ID: $($job.Id))" -ForegroundColor Green
} else {
    Write-Host "  ⚠️ API Server may have issues (State: $jobState)" -ForegroundColor Yellow
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
Write-Host "  • Background Job ID: $($job.Id)" -ForegroundColor Gray
Write-Host "  • Processing health check requests" -ForegroundColor Gray
Write-Host ""

if ($KeepServerRunning) {
    Write-Host "Server Control:" -ForegroundColor Yellow
    Write-Host "  • Server will keep running in background" -ForegroundColor Gray
    Write-Host "  • To stop: Get-Job -Id $($job.Id) | Stop-Job; Remove-Job -Id $($job.Id)" -ForegroundColor Gray
    Write-Host "  • To view logs: Receive-Job -Id $($job.Id) -Keep" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host "Press Ctrl+C to stop the API server and close..." -ForegroundColor Yellow
    Write-Host ""
    
    try {
        # Keep script running and monitor job
        while ($true) {
            $jobState = Get-Job -Id $job.Id -ErrorAction SilentlyContinue | Select-Object -ExpandProperty State
            
            if ($jobState -ne 'Running') {
                Write-Host ""
                Write-Host "⚠️ API Server stopped unexpectedly (State: $jobState)" -ForegroundColor Yellow
                
                # Show any errors
                $jobErrors = Receive-Job -Id $job.Id -ErrorAction SilentlyContinue 2>&1
                if ($jobErrors) {
                    Write-Host "Error output:" -ForegroundColor Red
                    $jobErrors | ForEach-Object { Write-Host "  $_" -ForegroundColor Red }
                }
                
                break
            }
            
            Start-Sleep -Seconds 1
        }
    } catch {
        Write-Host ""
        Write-Host "Interrupted by user" -ForegroundColor Yellow
    } finally {
        # Cleanup
        Write-Host ""
        Write-Host "Stopping API Server..." -ForegroundColor Cyan
        Get-Job -Id $job.Id -ErrorAction SilentlyContinue | Stop-Job
        Get-Job -Id $job.Id -ErrorAction SilentlyContinue | Remove-Job -Force
        Write-Host "✅ Cleanup complete" -ForegroundColor Green
        Write-Host ""
        Write-Host "Dashboard remains open in your browser." -ForegroundColor Gray
        Write-Host "It will switch to Demo mode (🎮) now that API server is stopped." -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "=" * 60 -ForegroundColor Gray
