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

# Enhancement A: Logging
$LogFile = "$PSScriptRoot\install-service-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"
function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] [$Level] $Message"
    Add-Content -Path $LogFile -Value $logMessage
    
    switch ($Level) {
        "ERROR" { Write-Host $Message -ForegroundColor Red }
        "WARNING" { Write-Host $Message -ForegroundColor Yellow }
        "SUCCESS" { Write-Host $Message -ForegroundColor Green }
        default { Write-Host $Message -ForegroundColor White }
    }
}

Write-Log "`n=== Installing Cloudflare Resources Tunnel Service ===" "INFO"
Write-Host "=== Installing Cloudflare Resources Tunnel Service ===" -ForegroundColor Cyan
Write-Host "Binary: $CloudflaredPath" -ForegroundColor White
Write-Host "Config: $ConfigPath" -ForegroundColor White
Write-Host "Service: $ServiceName" -ForegroundColor White
Write-Host "Log: $LogFile`n" -ForegroundColor Gray

Write-Log "Binary: $CloudflaredPath"
Write-Log "Config: $ConfigPath"
Write-Log "Service: $ServiceName"
Write-Log "User: $env:USERNAME"
Write-Log "Computer: $env:COMPUTERNAME"

# Verify cloudflared.exe exists
Write-Host "[1/6] Verifying cloudflared binary..." -ForegroundColor Yellow
Write-Log "[1/6] Verifying cloudflared binary at: $CloudflaredPath"
if (-not (Test-Path $CloudflaredPath)) {
    Write-Log "ERROR: cloudflared.exe not found at: $CloudflaredPath" "ERROR"
    Write-Host "  Download from: https://github.com/cloudflare/cloudflared/releases" -ForegroundColor Yellow
    exit 1
}
$binaryVersion = & $CloudflaredPath --version 2>&1
Write-Log "Binary found, version: $binaryVersion" "SUCCESS"
Write-Host "  ✓ Binary found - $binaryVersion" -ForegroundColor Green

# Verify config exists
Write-Host "`n[2/6] Verifying tunnel configuration..." -ForegroundColor Yellow
Write-Log "[2/6] Verifying tunnel configuration at: $ConfigPath"
if (-not (Test-Path $ConfigPath)) {
    Write-Log "ERROR: Config file not found at: $ConfigPath" "ERROR"
    Write-Host "  Copy and configure: Scripts/Resources-CDN/config-resources.yml" -ForegroundColor Yellow
    exit 1
}

# Check if config has placeholders
$configContent = Get-Content $ConfigPath -Raw
Write-Log "Config file size: $($configContent.Length) bytes"
if ($configContent -match '<TUNNEL_ID>|<CREDENTIALS_FILE>') {
    Write-Log "ERROR: Config file contains placeholders" "ERROR"
    Write-Host "  Please edit $ConfigPath and replace:" -ForegroundColor Yellow
    Write-Host "    - <TUNNEL_ID> with your actual tunnel ID" -ForegroundColor Yellow
    Write-Host "    - <CREDENTIALS_FILE> with your credentials filename" -ForegroundColor Yellow
    exit 1
}
Write-Log "Config file validated successfully" "SUCCESS"
Write-Host "  ✓ Config file valid" -ForegroundColor Green

# Remove existing service if present
Write-Host "`n[3/6] Checking for existing service..." -ForegroundColor Yellow
Write-Log "[3/6] Checking for existing service: $ServiceName"
$existingService = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
if ($existingService) {
    Write-Log "Found existing service, status: $($existingService.Status)" "WARNING"
    Write-Host "  Found existing service, removing..." -ForegroundColor Yellow
    
    # Stop service if running
    if ($existingService.Status -eq "Running") {
        Write-Log "Stopping service..."
        Stop-Service -Name $ServiceName -Force
        Start-Sleep -Seconds 2
        Write-Log "Service stopped" "SUCCESS"
    }
    
    # Uninstall service
    Write-Log "Uninstalling service via cloudflared..."
    $uninstallOutput = & $CloudflaredPath service uninstall 2>&1
    Write-Log "Uninstall output: $uninstallOutput"
    Start-Sleep -Seconds 3
    
    Write-Log "Existing service removed" "SUCCESS"
    Write-Host "  ✓ Existing service removed" -ForegroundColor Green
} else {
    Write-Log "No existing service found"
    Write-Host "  ✓ No existing service found" -ForegroundColor Green
}

# Install service
Write-Host "`n[4/6] Installing tunnel service..." -ForegroundColor Yellow
Write-Log "[4/6] Installing tunnel service with cloudflared"
Write-Log "Command: $CloudflaredPath service install --config $ConfigPath"
try {
    $installOutput = & $CloudflaredPath service install --config $ConfigPath 2>&1 | Out-String
    Write-Log "Install output: $installOutput"
    if ($LASTEXITCODE -ne 0) {
        Write-Log "ERROR: Service installation failed with exit code: $LASTEXITCODE" "ERROR"
        Write-Host "  Output: $installOutput" -ForegroundColor Red
        exit 1
    }
    Write-Log "Service installation command completed successfully" "SUCCESS"
    Write-Host "  ✓ Service installed" -ForegroundColor Green
} catch {
    Write-Log "ERROR: Exception during service installation: $($_.Exception.Message)" "ERROR"
    Write-Host "  ERROR: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Start-Sleep -Seconds 3

# Enhancement B: Verify service registration
Write-Host "`n[5/6] Verifying service registration..." -ForegroundColor Yellow
Write-Log "[5/6] Verifying service registration"
$maxRetries = 5
$retryCount = 0
$serviceRegistered = $false

while ($retryCount -lt $maxRetries -and -not $serviceRegistered) {
    Start-Sleep -Seconds 2
    $service = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
    if ($service) {
        $serviceRegistered = $true
        Write-Log "Service registered successfully on attempt $($retryCount + 1)" "SUCCESS"
        Write-Log "Service DisplayName: $($service.DisplayName)"
        Write-Log "Service StartType: $($service.StartType)"
        Write-Log "Service Status: $($service.Status)"
        Write-Host "  ✓ Service registered in Windows Service Manager" -ForegroundColor Green
    } else {
        $retryCount++
        Write-Log "Service not found, attempt $retryCount of $maxRetries" "WARNING"
        Write-Host "  Waiting for service registration (attempt $retryCount/$maxRetries)..." -ForegroundColor Yellow
    }
}

if (-not $serviceRegistered) {
    Write-Log "ERROR: Service failed to register after $maxRetries attempts" "ERROR"
    Write-Host "  ERROR: Service not registered in Windows Service Manager" -ForegroundColor Red
    Write-Host "  Attempting fallback sc.exe registration..." -ForegroundColor Yellow
    Write-Log "Attempting fallback sc.exe registration"
    
    # Fallback: Try sc.exe direct creation
    $scCreateCmd = "sc.exe create `"$ServiceName`" binPath= `"$CloudflaredPath --config $ConfigPath tunnel run`" start= auto DisplayName= `"Cloudflare Resources Tunnel`""
    Write-Log "Fallback command: $scCreateCmd"
    $scOutput = Invoke-Expression $scCreateCmd 2>&1
    Write-Log "sc.exe output: $scOutput"
    
    Start-Sleep -Seconds 2
    $service = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
    if (-not $service) {
        Write-Log "ERROR: Fallback registration also failed" "ERROR"
        exit 1
    }
    Write-Log "Fallback registration succeeded" "SUCCESS"
    Write-Host "  ✓ Service registered via fallback method" -ForegroundColor Green
}
# Configure service to auto-start and start it
Write-Host "`n[6/6] Configuring and starting service..." -ForegroundColor Yellow
Write-Log "[6/6] Configuring service startup and recovery"
try {
    # Set to automatic startup
    Set-Service -Name $ServiceName -StartupType Automatic
    Write-Log "Set startup type to Automatic" "SUCCESS"
    
    # Enhancement C: Configure service auto-recovery
    Write-Host "  Configuring auto-recovery..." -ForegroundColor Yellow
    Write-Log "Configuring service recovery options"
    
    # First failure: Restart service after 1 minute
    # Second failure: Restart service after 2 minutes  
    # Subsequent failures: Restart service after 5 minutes
    $scFailureCmd = "sc.exe failure `"$ServiceName`" reset= 86400 actions= restart/60000/restart/120000/restart/300000"
    Write-Log "Recovery command: $scFailureCmd"
    $scFailureOutput = Invoke-Expression $scFailureCmd 2>&1
    Write-Log "Recovery output: $scFailureOutput"
    
    if ($scFailureOutput -match "SUCCESS" -or $LASTEXITCODE -eq 0) {
        Write-Log "Auto-recovery configured successfully" "SUCCESS"
        Write-Host "  ✓ Auto-recovery configured" -ForegroundColor Green
    } else {
        Write-Log "WARNING: Auto-recovery configuration may have failed: $scFailureOutput" "WARNING"
        Write-Host "  ⚠ Auto-recovery setup completed with warnings" -ForegroundColor Yellow
    }
    
    # Start the service
    Write-Host "  Starting service..." -ForegroundColor Yellow
    Write-Log "Starting service"
    Start-Service -Name $ServiceName
    Start-Sleep -Seconds 5
    
    # Verify service is running
    $service = Get-Service -Name $ServiceName
    Write-Log "Service status after start: $($service.Status)"
    if ($service.Status -eq "Running") {
        Write-Log "Service started successfully" "SUCCESS"
        Write-Host "  ✓ Service running" -ForegroundColor Green
    } else {
        Write-Log "WARNING: Service in unexpected state: $($service.Status)" "WARNING"
        Write-Host "  ⚠ Service state: $($service.Status)" -ForegroundColor Yellow
        
        # Try to get more info from Event Log
        Write-Log "Checking Windows Event Log for errors"
        try {
            $recentEvents = Get-EventLog -LogName Application -Source "cloudflared" -Newest 5 -ErrorAction SilentlyContinue
            if ($recentEvents) {
                Write-Log "Recent cloudflared events:"
                foreach ($evt in $recentEvents) {
                    Write-Log "  [$($evt.EntryType)] $($evt.Message)"
                }
            }
        } catch {
            Write-Log "Could not retrieve Event Log entries: $($_.Exception.Message)" "WARNING"
        }
    }
} catch {
    Write-Log "ERROR: Failed to start service: $($_.Exception.Message)" "ERROR"
    Write-Host "  ERROR: Failed to start service: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "`n=== Installation Complete ===" -ForegroundColor Green
Write-Log "=== Installation Complete ===" "SUCCESS"
Write-Host "`nService Details:" -ForegroundColor Cyan
$finalService = Get-Service -Name $ServiceName
Write-Host "  Name: $ServiceName" -ForegroundColor White
Write-Host "  Status: $($finalService.Status)" -ForegroundColor White
Write-Host "  Startup: Automatic" -ForegroundColor White
Write-Host "  Recovery: Auto-restart on failure" -ForegroundColor White
Write-Log "Final service status: $($finalService.Status)"

Write-Host "`nTunnel:" -ForegroundColor Cyan
Write-Host "  Public URL: https://resources.kashkole.com" -ForegroundColor White
Write-Host "  Backend: http://localhost:80 (IIS)" -ForegroundColor White

Write-Host "`nService Management:" -ForegroundColor Yellow
Write-Host "  View logs: Get-EventLog -LogName Application -Source cloudflared -Newest 20" -ForegroundColor Gray
Write-Host "  Stop: Stop-Service -Name $ServiceName" -ForegroundColor Gray
Write-Host "  Start: Start-Service -Name $ServiceName" -ForegroundColor Gray
Write-Host "  Status: Get-Service -Name $ServiceName" -ForegroundColor Gray
Write-Host "  Installation log: $LogFile" -ForegroundColor Gray

Write-Host "`nNext Steps:" -ForegroundColor Yellow
Write-Host "  1. Verify Cloudflare DNS: resources.kashkole.com -> tunnel CNAME" -ForegroundColor White
Write-Host "  2. Test: curl https://resources.kashkole.com" -ForegroundColor White
Write-Host "  3. Run test-resources-cdn.ps1 for full verification" -ForegroundColor White
Write-Host "  4. Run diagnose-cloudflare-service.ps1 for diagnostics`n" -ForegroundColor White

Write-Log "Installation script completed successfully"
