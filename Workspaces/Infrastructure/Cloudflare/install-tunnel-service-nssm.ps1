<#
.SYNOPSIS
    Install Cloudflare tunnel as Windows service using manual service creation
    
.DESCRIPTION
    Creates a Windows service for Cloudflare tunnel using New-Service cmdlet
    when cloudflared's built-in service install doesn't work properly.
    
.NOTES
    Created: 2025-10-26
    Key: cloudflare-tunnel-stability
    Phase: 3
#>

#Requires -RunAsAdministrator

# Configuration
$TunnelId = "5be8b5a1-5d1f-4a9c-803d-e3a1d4383ee1"
$CloudflaredPath = "D:\PROJECTS\__CLOUDFLARE\cloudflared.exe"
$ConfigPath = "C:\Users\asifh\.cloudflared\config.yml"
$ServiceName = "CloudflaredTunnel"
$ServiceDisplayName = "Cloudflare Tunnel - NoorCanvas"
$ServiceDescription = "Cloudflare Tunnel service for noorcanvas.kashkole.com (Tunnel ID: $TunnelId)"

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "Cloudflare Tunnel Service Installation (Manual)" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

# Validation
Write-Host "📋 Validating configuration..." -ForegroundColor Yellow

if (-not (Test-Path $CloudflaredPath)) {
    throw "cloudflared.exe not found at: $CloudflaredPath"
}
Write-Host "   ✓ cloudflared.exe found" -ForegroundColor Green

if (-not (Test-Path $ConfigPath)) {
    throw "config.yml not found at: $ConfigPath"
}
Write-Host "   ✓ config.yml found" -ForegroundColor Green

$credPath = "C:\Users\asifh\.cloudflared\$TunnelId.json"
if (-not (Test-Path $credPath)) {
    throw "Credentials file not found at: $credPath"
}
Write-Host "   ✓ credentials file found" -ForegroundColor Green
Write-Host ""

# Stop existing processes
Write-Host "🛑 Stopping existing cloudflared processes..." -ForegroundColor Yellow
Get-Process cloudflared -ErrorAction SilentlyContinue | Stop-Process -Force
Write-Host "   ✓ Processes stopped" -ForegroundColor Green
Write-Host ""

# Check for existing service
Write-Host "🔍 Checking for existing service..." -ForegroundColor Yellow
$existingService = Get-Service $ServiceName -ErrorAction SilentlyContinue

if ($existingService) {
    Write-Host "   ⚠  Service already exists - stopping and removing..." -ForegroundColor Yellow
    if ($existingService.Status -eq 'Running') {
        Stop-Service $ServiceName -Force
    }
    
    # Remove using sc.exe for reliability
    sc.exe delete $ServiceName | Out-Null
    Start-Sleep -Seconds 2
    Write-Host "   ✓ Existing service removed" -ForegroundColor Green
}
Write-Host ""

# Create service
Write-Host "📦 Creating Windows service..." -ForegroundColor Yellow

$serviceBinary = "`"$CloudflaredPath`" tunnel --config `"$ConfigPath`" run $TunnelId"

# Use sc.exe to create the service with proper parameters
sc.exe create $ServiceName binPath= $serviceBinary DisplayName= $ServiceDisplayName start= auto | Out-Null

if ($LASTEXITCODE -ne 0) {
    throw "Service creation failed with exit code: $LASTEXITCODE"
}

# Set service description
sc.exe description $ServiceName $ServiceDescription | Out-Null

Write-Host "   ✓ Service created" -ForegroundColor Green
Write-Host ""

# Configure failure recovery
Write-Host "⚙️  Configuring failure recovery..." -ForegroundColor Yellow

# Restart after 60 seconds on failure
sc.exe failure $ServiceName reset= 86400 actions= restart/60000/restart/60000/restart/60000 | Out-Null

Write-Host "   ✓ Failure recovery configured (restart after 60s)" -ForegroundColor Green
Write-Host ""

# Start service
Write-Host "▶️  Starting service..." -ForegroundColor Yellow
Start-Service $ServiceName
Start-Sleep -Seconds 5

$service = Get-Service $ServiceName
if ($service.Status -ne 'Running') {
    throw "Service failed to start. Status: $($service.Status)"
}

Write-Host "   ✓ Service started successfully" -ForegroundColor Green
Write-Host ""

# Verify tunnel connections
Write-Host "🔍 Verifying tunnel connections..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

try {
    $response = Invoke-WebRequest -Uri "https://noorcanvas.kashkole.com" -UseBasicParsing -TimeoutSec 15
    if ($response.StatusCode -eq 200) {
        Write-Host "   ✓ Tunnel responding (HTTP $($response.StatusCode))" -ForegroundColor Green
    }
} catch {
    Write-Host "   ⚠  Warning: Could not verify tunnel (may still be initializing)" -ForegroundColor Yellow
    Write-Host "      Error: $($_.Exception.Message)" -ForegroundColor DarkGray
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host "✅ Installation Complete!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host ""

Write-Host "📌 Service Details:" -ForegroundColor Cyan
Write-Host "   Name: $ServiceName" -ForegroundColor White
Write-Host "   Display Name: $ServiceDisplayName" -ForegroundColor White
Write-Host "   Status: $($service.Status)" -ForegroundColor White
Write-Host "   Start Type: Automatic" -ForegroundColor White
Write-Host "   Tunnel ID: $TunnelId" -ForegroundColor White
Write-Host ""

Write-Host "📋 Management Commands:" -ForegroundColor Cyan
Write-Host "   Check status:  Get-Service $ServiceName" -ForegroundColor White
Write-Host "   Stop service:  Stop-Service $ServiceName" -ForegroundColor White
Write-Host "   Start service: Start-Service $ServiceName" -ForegroundColor White
Write-Host "   Restart:       Restart-Service $ServiceName" -ForegroundColor White
Write-Host "   Uninstall:     sc.exe delete $ServiceName" -ForegroundColor White
Write-Host ""

Write-Host "🎯 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Test tunnel: Invoke-WebRequest https://noorcanvas.kashkole.com" -ForegroundColor White
Write-Host "   2. Test auto-start: Restart-Computer (service will auto-start)" -ForegroundColor White
Write-Host "   3. Monitor logs: Event Viewer → Application" -ForegroundColor White
Write-Host ""
