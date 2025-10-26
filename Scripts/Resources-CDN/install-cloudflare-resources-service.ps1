<#
.SYNOPSIS
    Install Cloudflare tunnel for resources.kashkole.com as Windows service

.DESCRIPTION
    Installs and starts the Cloudflare tunnel as a Windows service that:
    - Routes resources.kashkole.com to localhost:80 (IIS)
    - Auto-starts with Windows
    - Runs under LocalSystem account

.PARAMETER CloudflaredPath
    Path to cloudflared.exe (default: D:\PROJECTS\__CLOUDFLARE\cloudflared.exe)

.PARAMETER ConfigPath
    Path to tunnel config YAML (default: D:\PROJECTS\__CLOUDFLARE\config-resources.yml)

.PARAMETER ServiceName
    Windows service name (default: CloudflareResourcesTunnel)

.EXAMPLE
    .\install-cloudflare-resources-service.ps1
    
.EXAMPLE
    .\install-cloudflare-resources-service.ps1 -CloudflaredPath "C:\cloudflared\cloudflared.exe"

.NOTES
    Requires: Administrator privileges
    Prerequisites: 
    - cloudflared.exe must exist at specified path
    - config-resources.yml must be configured with tunnel ID and credentials
    - Cloudflare DNS must point resources.kashkole.com to tunnel
    Last Updated: 2025-10-26
#>

#Requires -RunAsAdministrator

[CmdletBinding()]
param(
    [string]$CloudflaredPath = "D:\PROJECTS\__CLOUDFLARE\cloudflared.exe",
    [string]$ConfigPath = "D:\PROJECTS\__CLOUDFLARE\config-resources.yml",
    [string]$ServiceName = "CloudflareResourcesTunnel"
)

$ErrorActionPreference = "Stop"

Write-Host "`n=== Installing Cloudflare Resources Tunnel Service ===" -ForegroundColor Cyan
Write-Host "Binary: $CloudflaredPath" -ForegroundColor White
Write-Host "Config: $ConfigPath" -ForegroundColor White
Write-Host "Service: $ServiceName`n" -ForegroundColor White

# Verify cloudflared.exe exists
Write-Host "[1/5] Verifying cloudflared binary..." -ForegroundColor Yellow
if (-not (Test-Path $CloudflaredPath)) {
    Write-Host "  ERROR: cloudflared.exe not found at: $CloudflaredPath" -ForegroundColor Red
    Write-Host "  Download from: https://github.com/cloudflare/cloudflared/releases" -ForegroundColor Yellow
    exit 1
}
Write-Host "  ✓ Binary found" -ForegroundColor Green

# Verify config exists
Write-Host "`n[2/5] Verifying tunnel configuration..." -ForegroundColor Yellow
if (-not (Test-Path $ConfigPath)) {
    Write-Host "  ERROR: Config file not found at: $ConfigPath" -ForegroundColor Red
    Write-Host "  Copy and configure: Scripts/Resources-CDN/config-resources.yml" -ForegroundColor Yellow
    exit 1
}

# Check if config has placeholders
$configContent = Get-Content $ConfigPath -Raw
if ($configContent -match '<TUNNEL_ID>|<CREDENTIALS_FILE>') {
    Write-Host "  ERROR: Config file contains placeholders" -ForegroundColor Red
    Write-Host "  Please edit $ConfigPath and replace:" -ForegroundColor Yellow
    Write-Host "    - <TUNNEL_ID> with your actual tunnel ID" -ForegroundColor Yellow
    Write-Host "    - <CREDENTIALS_FILE> with your credentials filename" -ForegroundColor Yellow
    exit 1
}
Write-Host "  ✓ Config file valid" -ForegroundColor Green

# Remove existing service if present
Write-Host "`n[3/5] Checking for existing service..." -ForegroundColor Yellow
$existingService = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
if ($existingService) {
    Write-Host "  Found existing service, removing..." -ForegroundColor Yellow
    
    # Stop service if running
    if ($existingService.Status -eq "Running") {
        Stop-Service -Name $ServiceName -Force
        Start-Sleep -Seconds 2
    }
    
    # Uninstall service
    & $CloudflaredPath service uninstall
    Start-Sleep -Seconds 3
    
    Write-Host "  ✓ Existing service removed" -ForegroundColor Green
} else {
    Write-Host "  ✓ No existing service found" -ForegroundColor Green
}

# Install service
Write-Host "`n[4/5] Installing tunnel service..." -ForegroundColor Yellow
try {
    $installOutput = & $CloudflaredPath service install --config $ConfigPath 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  ERROR: Service installation failed" -ForegroundColor Red
        Write-Host "  Output: $installOutput" -ForegroundColor Red
        exit 1
    }
    Write-Host "  ✓ Service installed" -ForegroundColor Green
} catch {
    Write-Host "  ERROR: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Start-Sleep -Seconds 2

# Configure service to auto-start and start it
Write-Host "`n[5/5] Starting service..." -ForegroundColor Yellow
try {
    # Set to automatic startup
    Set-Service -Name $ServiceName -StartupType Automatic
    
    # Start the service
    Start-Service -Name $ServiceName
    Start-Sleep -Seconds 3
    
    # Verify service is running
    $service = Get-Service -Name $ServiceName
    if ($service.Status -eq "Running") {
        Write-Host "  ✓ Service running" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ Service state: $($service.Status)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ERROR: Failed to start service: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "`n=== Installation Complete ===" -ForegroundColor Green
Write-Host "`nService Details:" -ForegroundColor Cyan
Write-Host "  Name: $ServiceName" -ForegroundColor White
Write-Host "  Status: $((Get-Service -Name $ServiceName).Status)" -ForegroundColor White
Write-Host "  Startup: Automatic" -ForegroundColor White
Write-Host "`nTunnel:" -ForegroundColor Cyan
Write-Host "  Public URL: https://resources.kashkole.com" -ForegroundColor White
Write-Host "  Backend: http://localhost:80 (IIS)" -ForegroundColor White

Write-Host "`nService Management:" -ForegroundColor Yellow
Write-Host "  View logs: Get-EventLog -LogName Application -Source cloudflared -Newest 20" -ForegroundColor Gray
Write-Host "  Stop: Stop-Service -Name $ServiceName" -ForegroundColor Gray
Write-Host "  Start: Start-Service -Name $ServiceName" -ForegroundColor Gray
Write-Host "  Status: Get-Service -Name $ServiceName" -ForegroundColor Gray

Write-Host "`nNext Steps:" -ForegroundColor Yellow
Write-Host "  1. Verify Cloudflare DNS: resources.kashkole.com -> tunnel CNAME" -ForegroundColor White
Write-Host "  2. Test: curl https://resources.kashkole.com" -ForegroundColor White
Write-Host "  3. Run test-resources-cdn.ps1 for full verification`n" -ForegroundColor White
