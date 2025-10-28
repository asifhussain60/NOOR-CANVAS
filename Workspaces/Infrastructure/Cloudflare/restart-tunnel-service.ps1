#Requires -RunAsAdministrator
<#
.SYNOPSIS
    Restarts Cloudflare Tunnel Windows Service
.DESCRIPTION
    Safely restarts the cloudflared service and verifies tunnel connections.
    Requires Administrator privileges.
.PARAMETER TunnelId
    Tunnel ID (default: 5be8b5a1-5d1f-4a9c-803d-e3a1d4383ee1)
.PARAMETER CloudflaredPath
    Path to cloudflared.exe (default: D:\PROJECTS\__CLOUDFLARE\cloudflared.exe)
.EXAMPLE
    .\restart-tunnel-service.ps1
#>

param(
    [string]$TunnelId = "5be8b5a1-5d1f-4a9c-803d-e3a1d4383ee1",
    [string]$CloudflaredPath = "D:\PROJECTS\__CLOUDFLARE\cloudflared.exe"
)

$ErrorActionPreference = "Stop"

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "Cloudflare Tunnel Service Restart" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

# Check if service exists
Write-Host "🔍 Checking for service..." -ForegroundColor Yellow
$service = Get-Service cloudflared -ErrorAction SilentlyContinue
if (-not $service) {
    throw "Service 'cloudflared' not found. Install it first using install-tunnel-service.ps1"
}
Write-Host "   ✓ Service found" -ForegroundColor Green
Write-Host ""

# Restart service
Write-Host "🔄 Restarting service..." -ForegroundColor Yellow
Restart-Service cloudflared -Force
Start-Sleep -Seconds 5
Write-Host "   ✓ Service restarted" -ForegroundColor Green
Write-Host ""

# Verify status
Write-Host "✅ Verifying service status..." -ForegroundColor Yellow
$service = Get-Service cloudflared
if ($service.Status -ne "Running") {
    throw "Service is not running. Status: $($service.Status)"
}
Write-Host "   ✓ Service is running" -ForegroundColor Green
Write-Host ""

# Wait for connections
Write-Host "⏳ Waiting for tunnel connections (15 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# Check tunnel info
Write-Host "🔗 Checking tunnel status..." -ForegroundColor Yellow
Write-Host ""
& $CloudflaredPath tunnel info $TunnelId

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host "✅ Restart complete!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host ""
