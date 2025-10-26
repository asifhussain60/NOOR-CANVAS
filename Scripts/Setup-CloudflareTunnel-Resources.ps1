# ================================================================
# Setup-CloudflareTunnel-Resources.ps1
# Creates Cloudflare tunnel with resources.kashkole.com support
# ================================================================

#Requires -RunAsAdministrator

$ErrorActionPreference = "Stop"

# Configuration
$CLOUDFLARED_EXE = "D:\PROJECTS\__CLOUDFLARE\cloudflared.exe"
$CONFIG_DIR = "C:\Users\asifh\.cloudflared"
$CONFIG_FILE = "$CONFIG_DIR\config.yml"
$TUNNEL_NAME = "noorcanvas"
$SERVICE_NAME = "Cloudflared"

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  Cloudflare Tunnel Setup - WITH resources.kashkole.com" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan

# Verify cloudflared.exe exists
if (-not (Test-Path $CLOUDFLARED_EXE)) {
    Write-Host "ERROR: cloudflared.exe not found at $CLOUDFLARED_EXE" -ForegroundColor Red
    exit 1
}

# Stop existing service
Write-Host "`nStopping existing Cloudflared service (if running)..." -ForegroundColor Yellow
try {
    Stop-Service -Name $SERVICE_NAME -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
} catch {
    Write-Host "No service to stop (OK)" -ForegroundColor Gray
}

# Delete existing service
Write-Host "Removing existing Cloudflared service (if exists)..." -ForegroundColor Yellow
try {
    sc.exe delete $SERVICE_NAME | Out-Null
    Start-Sleep -Seconds 2
} catch {
    Write-Host "No service to delete (OK)" -ForegroundColor Gray
}

# Delete existing tunnels
Write-Host "Deleting old tunnels..." -ForegroundColor Yellow
Push-Location "D:\PROJECTS\__CLOUDFLARE"
try {
    $existingTunnels = & .\cloudflared.exe tunnel list --output json 2>&1 | ConvertFrom-Json
    foreach ($tunnel in $existingTunnels) {
        Write-Host "  Deleting tunnel: $($tunnel.name) ($($tunnel.id))" -ForegroundColor Gray
        & .\cloudflared.exe tunnel delete -f $tunnel.id 2>&1 | Out-Null
    }
} catch {
    Write-Host "  No tunnels to delete (OK)" -ForegroundColor Gray
}
Pop-Location

# Clean credentials
Write-Host "Cleaning old credentials..." -ForegroundColor Yellow
if (Test-Path $CONFIG_DIR) {
    Remove-Item "$CONFIG_DIR\*.json" -Force -ErrorAction SilentlyContinue
    Remove-Item $CONFIG_FILE -Force -ErrorAction SilentlyContinue
} else {
    New-Item -Path $CONFIG_DIR -ItemType Directory -Force | Out-Null
}

# Create new tunnel
Write-Host "`nCreating new tunnel: $TUNNEL_NAME ..." -ForegroundColor Green
Push-Location "D:\PROJECTS\__CLOUDFLARE"
$createOutput = & .\cloudflared.exe tunnel create $TUNNEL_NAME 2>&1 | Out-String
Write-Host $createOutput -ForegroundColor Gray

# Extract tunnel ID from output
if ($createOutput -match 'Created tunnel .+ with id ([a-f0-9\-]+)') {
    $TUNNEL_ID = $Matches[1]
    Write-Host "✓ Tunnel created with ID: $TUNNEL_ID" -ForegroundColor Green
} else {
    Write-Host "ERROR: Failed to extract tunnel ID from output:" -ForegroundColor Red
    Write-Host $createOutput
    Pop-Location
    exit 1
}
Pop-Location

# Create config.yml
Write-Host "`nWriting config.yml..." -ForegroundColor Yellow
$configContent = @"
tunnel: $TUNNEL_ID
credentials-file: $CONFIG_DIR\$TUNNEL_ID.json

ingress:
  - hostname: resources.kashkole.com
    service: http://127.0.0.1:80
  - hostname: noorcanvas.kashkole.com
    service: http://127.0.0.1:80
  - hostname: session.kashkole.com
    service: http://127.0.0.1:8080
  - service: http_status:404
"@

Set-Content -Path $CONFIG_FILE -Value $configContent -Encoding UTF8
Write-Host "✓ Config file created: $CONFIG_FILE" -ForegroundColor Green

# Verify credentials file exists
$credFile = "$CONFIG_DIR\$TUNNEL_ID.json"
if (-not (Test-Path $credFile)) {
    Write-Host "ERROR: Credentials file not found: $credFile" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Credentials file exists: $credFile" -ForegroundColor Green

# Add DNS routes
Write-Host "`nConfiguring DNS routes..." -ForegroundColor Yellow
Push-Location "D:\PROJECTS\__CLOUDFLARE"

Write-Host "  Adding DNS: resources.kashkole.com" -ForegroundColor Gray
& .\cloudflared.exe tunnel route dns $TUNNEL_NAME resources.kashkole.com 2>&1 | Out-Null

Write-Host "  Adding DNS: noorcanvas.kashkole.com" -ForegroundColor Gray
& .\cloudflared.exe tunnel route dns $TUNNEL_NAME noorcanvas.kashkole.com 2>&1 | Out-Null

Write-Host "  Adding DNS: session.kashkole.com" -ForegroundColor Gray
& .\cloudflared.exe tunnel route dns $TUNNEL_NAME session.kashkole.com 2>&1 | Out-Null

Pop-Location
Write-Host "✓ DNS routes configured" -ForegroundColor Green

# Install service
Write-Host "`nInstalling Cloudflared Windows service..." -ForegroundColor Yellow
Push-Location "D:\PROJECTS\__CLOUDFLARE"
& .\cloudflared.exe service install --config $CONFIG_FILE 2>&1 | Out-Null
Pop-Location
Write-Host "✓ Service installed" -ForegroundColor Green

# Start service
Write-Host "`nStarting Cloudflared service..." -ForegroundColor Yellow
Start-Service -Name $SERVICE_NAME
Start-Sleep -Seconds 3

$serviceStatus = Get-Service -Name $SERVICE_NAME
if ($serviceStatus.Status -eq "Running") {
    Write-Host "✓ Service started successfully" -ForegroundColor Green
} else {
    Write-Host "WARNING: Service status is $($serviceStatus.Status)" -ForegroundColor Yellow
}

Write-Host "`n================================================================" -ForegroundColor Cyan
Write-Host "  Cloudflare Tunnel Setup Complete!" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Tunnel ID: $TUNNEL_ID" -ForegroundColor White
Write-Host "Config: $CONFIG_FILE" -ForegroundColor White
Write-Host ""
Write-Host "Domain Mappings:" -ForegroundColor White
Write-Host "  • resources.kashkole.com  → http://localhost:80 (IIS KashkoleResources)" -ForegroundColor Cyan
Write-Host "  • noorcanvas.kashkole.com → http://localhost:80 (IIS NoorCanvas)" -ForegroundColor Cyan
Write-Host "  • session.kashkole.com    → http://localhost:8080 (IIS KSESSIONS)" -ForegroundColor Cyan
Write-Host ""
Write-Host "Service Status: $($serviceStatus.Status)" -ForegroundColor $(if ($serviceStatus.Status -eq 'Running') { 'Green' } else { 'Yellow' })
Write-Host ""
