# Cloudflared Service Restart Script
# Safely restarts the cloudflared Windows Service

param(
    [switch]$Force,
    [int]$WaitSeconds = 5
)

$ErrorActionPreference = "Stop"

Write-Host "🔄 Cloudflared Service Restart" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host ""

# Check if service exists
$service = Get-Service -Name "cloudflared" -ErrorAction SilentlyContinue

if (-not $service) {
    Write-Host "❌ Cloudflared service is not installed" -ForegroundColor Red
    Write-Host ""
    Write-Host "   Run install-service.ps1 to install the service" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

Write-Host "Current Status: $($service.Status)" -ForegroundColor Gray
Write-Host ""

# Stop service
if ($service.Status -eq "Running") {
    Write-Host "⏸️ Stopping service..." -ForegroundColor Yellow
    Stop-Service -Name "cloudflared" -Force
    
    # Wait for service to stop
    $timeout = 30
    $waited = 0
    while ((Get-Service -Name "cloudflared").Status -ne "Stopped" -and $waited -lt $timeout) {
        Start-Sleep -Seconds 1
        $waited++
    }
    
    $service = Get-Service -Name "cloudflared"
    if ($service.Status -eq "Stopped") {
        Write-Host "✅ Service stopped" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Service did not stop cleanly (status: $($service.Status))" -ForegroundColor Yellow
    }
} else {
    Write-Host "ℹ️ Service is already stopped" -ForegroundColor Gray
}

# Wait before restarting
if ($WaitSeconds -gt 0) {
    Write-Host ""
    Write-Host "⏳ Waiting $WaitSeconds seconds before restart..." -ForegroundColor Gray
    Start-Sleep -Seconds $WaitSeconds
}

# Start service
Write-Host ""
Write-Host "▶️ Starting service..." -ForegroundColor Yellow

try {
    Start-Service -Name "cloudflared"
    Start-Sleep -Seconds 3
    
    $service = Get-Service -Name "cloudflared"
    if ($service.Status -eq "Running") {
        Write-Host "✅ Service is running" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Service status: $($service.Status)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Failed to start service: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Check Event Viewer for details:" -ForegroundColor Yellow
    Write-Host "  - Open Event Viewer" -ForegroundColor Gray
    Write-Host "  - Navigate to: Windows Logs → Application" -ForegroundColor Gray
    Write-Host "  - Look for cloudflared errors" -ForegroundColor Gray
    Write-Host ""
    exit 1
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host "✅ RESTART COMPLETE" -ForegroundColor Green
Write-Host ""

# Display process info
$process = Get-Process -Name "cloudflared" -ErrorAction SilentlyContinue
if ($process) {
    $uptime = (Get-Date) - $process.StartTime
    Write-Host "Process Information:" -ForegroundColor Cyan
    Write-Host "  PID:    $($process.Id)" -ForegroundColor Gray
    Write-Host "  Uptime: $($uptime.ToString('hh\:mm\:ss'))" -ForegroundColor Gray
    Write-Host "  Memory: $([math]::Round($process.WorkingSet64 / 1MB, 2)) MB" -ForegroundColor Gray
}

Write-Host ""
exit 0
