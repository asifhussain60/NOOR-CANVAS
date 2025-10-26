#Requires -RunAsAdministrator
<#
.SYNOPSIS
    Installs Cloudflare Tunnel as Windows Service
.DESCRIPTION
    Installs cloudflared tunnel as a Windows service with automatic startup
    and failure recovery. Requires Administrator privileges.
.PARAMETER TunnelId
    Tunnel ID (default: 5be8b5a1-5d1f-4a9c-803d-e3a1d4383ee1)
.PARAMETER ConfigPath
    Path to config.yml (default: C:\Users\asifh\.cloudflared\config.yml)
.EXAMPLE
    .\install-tunnel-service.ps1
.EXAMPLE
    .\install-tunnel-service.ps1 -TunnelId "custom-tunnel-id"
#>

param(
    [string]$TunnelId = "5be8b5a1-5d1f-4a9c-803d-e3a1d4383ee1",
    [string]$ConfigPath = "C:\Users\asifh\.cloudflared\config.yml",
    [string]$CloudflaredPath = "D:\PROJECTS\__CLOUDFLARE\cloudflared.exe"
)

$ErrorActionPreference = "Stop"

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "Cloudflare Tunnel Service Installation" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

# Validate files exist
Write-Host "📋 Validating configuration..." -ForegroundColor Yellow
if (-not (Test-Path $CloudflaredPath)) {
    throw "cloudflared.exe not found at: $CloudflaredPath"
}
if (-not (Test-Path $ConfigPath)) {
    throw "config.yml not found at: $ConfigPath"
}

$credentialsPath = "C:\Users\asifh\.cloudflared\$TunnelId.json"
if (-not (Test-Path $credentialsPath)) {
    throw "Credentials file not found at: $credentialsPath"
}

Write-Host "   ✓ cloudflared.exe found" -ForegroundColor Green
Write-Host "   ✓ config.yml found" -ForegroundColor Green
Write-Host "   ✓ credentials file found" -ForegroundColor Green
Write-Host ""

# Stop any running cloudflared processes
Write-Host "🛑 Stopping existing cloudflared processes..." -ForegroundColor Yellow
Get-Process cloudflared -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2
Write-Host "   ✓ Processes stopped" -ForegroundColor Green
Write-Host ""

# Check if service already exists
Write-Host "🔍 Checking for existing service..." -ForegroundColor Yellow
$existingService = Get-Service cloudflared -ErrorAction SilentlyContinue
if ($existingService) {
    Write-Host "   ⚠️  Service already exists. Uninstalling first..." -ForegroundColor Yellow
    & $CloudflaredPath service uninstall
    Start-Sleep -Seconds 2
    Write-Host "   ✓ Old service uninstalled" -ForegroundColor Green
}
Write-Host ""

# Install service
Write-Host "📦 Installing Windows service..." -ForegroundColor Yellow

# Cloudflared service install returns exit code 1 even on success due to event logger warning
# This is a known issue - verify by checking if service can be queried instead
& $CloudflaredPath --config $ConfigPath service install 2>&1 | Out-Null

# Give service time to register
Start-Sleep -Seconds 3

# Verify installation by checking if we can query the service
$serviceCheck = sc.exe query type= service state= all | Select-String -Pattern "Cloudflared" -Quiet
if (-not $serviceCheck) {
    throw "Service installation verification failed - service not found in Windows Services"
}

Write-Host "   ✓ Service installed" -ForegroundColor Green
Write-Host ""

# Configure service properties
Write-Host "⚙️  Configuring service properties..." -ForegroundColor Yellow

# Set to automatic startup
sc.exe config cloudflared start= auto | Out-Null

# Configure failure recovery (restart after 60s, 120s, 300s)
sc.exe failure cloudflared reset= 86400 actions= restart/60000/restart/120000/restart/300000 | Out-Null

# Set service description
$description = "Cloudflare Tunnel for kashkole.com (noorcanvas, resources, session). Tunnel ID: $TunnelId"
sc.exe description cloudflared $description | Out-Null

Write-Host "   ✓ Automatic startup enabled" -ForegroundColor Green
Write-Host "   ✓ Failure recovery configured (3 restart attempts)" -ForegroundColor Green
Write-Host "   ✓ Service description set" -ForegroundColor Green
Write-Host ""

# Start service
Write-Host "▶️  Starting service..." -ForegroundColor Yellow
Start-Service cloudflared
Start-Sleep -Seconds 5
Write-Host "   ✓ Service started" -ForegroundColor Green
Write-Host ""

# Verify service status
Write-Host "✅ Verifying service..." -ForegroundColor Yellow
$service = Get-Service cloudflared
if ($service.Status -ne "Running") {
    throw "Service is not running. Status: $($service.Status)"
}
Write-Host "   ✓ Service is running" -ForegroundColor Green
Write-Host ""

# Wait for tunnel to establish connections
Write-Host "⏳ Waiting for tunnel connections to establish (15 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# Check tunnel info
Write-Host "🔗 Checking tunnel status..." -ForegroundColor Yellow
Write-Host ""
& $CloudflaredPath tunnel info $TunnelId

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host "✅ Service installation complete!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Service Details:" -ForegroundColor Cyan
Write-Host "   Name: cloudflared" -ForegroundColor White
Write-Host "   Status: $($service.Status)" -ForegroundColor White
Write-Host "   Startup: $($service.StartType)" -ForegroundColor White
Write-Host ""
Write-Host "🔧 Management Commands:" -ForegroundColor Cyan
Write-Host "   Status:  Get-Service cloudflared" -ForegroundColor White
Write-Host "   Stop:    Stop-Service cloudflared" -ForegroundColor White
Write-Host "   Start:   Start-Service cloudflared" -ForegroundColor White
Write-Host "   Restart: Restart-Service cloudflared" -ForegroundColor White
Write-Host ""
Write-Host "🌐 Test Site:" -ForegroundColor Cyan
Write-Host "   Invoke-WebRequest -Uri 'https://noorcanvas.kashkole.com' -UseBasicParsing" -ForegroundColor White
Write-Host ""
