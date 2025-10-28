#Requires -RunAsAdministrator
<#
.SYNOPSIS
    Uninstalls Cloudflare Tunnel Windows Service
.DESCRIPTION
    Safely stops and uninstalls the cloudflared Windows service.
    Requires Administrator privileges.
.PARAMETER CloudflaredPath
    Path to cloudflared.exe (default: D:\PROJECTS\__CLOUDFLARE\cloudflared.exe)
.EXAMPLE
    .\uninstall-tunnel-service.ps1
#>

param(
    [string]$CloudflaredPath = "D:\PROJECTS\__CLOUDFLARE\cloudflared.exe"
)

$ErrorActionPreference = "Stop"

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "Cloudflare Tunnel Service Uninstallation" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

# Check if service exists
Write-Host "🔍 Checking for service..." -ForegroundColor Yellow
$service = Get-Service cloudflared -ErrorAction SilentlyContinue
if (-not $service) {
    Write-Host "   ⚠️  Service not found. Nothing to uninstall." -ForegroundColor Yellow
    Write-Host ""
    exit 0
}
Write-Host "   ✓ Service found" -ForegroundColor Green
Write-Host ""

# Stop service
Write-Host "🛑 Stopping service..." -ForegroundColor Yellow
Stop-Service cloudflared -Force
Start-Sleep -Seconds 2
Write-Host "   ✓ Service stopped" -ForegroundColor Green
Write-Host ""

# Uninstall service
Write-Host "📦 Uninstalling service..." -ForegroundColor Yellow
& $CloudflaredPath service uninstall
if ($LASTEXITCODE -ne 0) {
    throw "Service uninstallation failed with exit code: $LASTEXITCODE"
}
Write-Host "   ✓ Service uninstalled" -ForegroundColor Green
Write-Host ""

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host "✅ Uninstallation complete!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host ""
Write-Host "ℹ️  Note: Configuration files preserved at:" -ForegroundColor Cyan
Write-Host "   C:\Users\asifh\.cloudflared\config.yml" -ForegroundColor White
Write-Host "   C:\Users\asifh\.cloudflared\*.json (credentials)" -ForegroundColor White
Write-Host ""
