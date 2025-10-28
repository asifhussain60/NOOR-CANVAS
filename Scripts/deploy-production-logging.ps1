<#
.SYNOPSIS
    Quick deployment script for production logging configuration update

.DESCRIPTION
    Deploys the updated appsettings.Production.json with enhanced logging to production.
    This is a lightweight config-only update that doesn't require a full rebuild.

.PARAMETER Verify
    Only verify the configuration without deploying

.EXAMPLE
    .\deploy-production-logging.ps1
    Deploy the updated logging configuration

.EXAMPLE
    .\deploy-production-logging.ps1 -Verify
    Verify configuration without deploying
#>

param(
    [switch]$Verify
)

$ErrorActionPreference = "Stop"

# Paths
$sourceConfig = "D:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas\appsettings.Production.json"
$deployPath = "D:\Websites\NOOR-CANVAS"
$targetConfig = Join-Path $deployPath "appsettings.Production.json"
$logsPath = Join-Path $deployPath "logs"
$appPoolName = "NoorCanvas"

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Production Logging Configuration Deployment" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Verify source config exists and is valid JSON
Write-Host "→ Verifying source configuration..." -ForegroundColor Yellow
if (-not (Test-Path $sourceConfig)) {
    Write-Host "✗ Source config not found: $sourceConfig" -ForegroundColor Red
    exit 1
}

try {
    $configContent = Get-Content $sourceConfig -Raw | ConvertFrom-Json
    Write-Host "  ✓ Source config is valid JSON" -ForegroundColor Green
    
    # Verify enhanced logging is present
    $logLevels = $configContent.Serilog.MinimumLevel.Override
    if ($logLevels.'Microsoft.AspNetCore.SignalR' -eq 'Debug' -and 
        $logLevels.'NoorCanvas.Hubs' -eq 'Debug') {
        Write-Host "  ✓ Enhanced logging configuration detected" -ForegroundColor Green
    } else {
        Write-Host "  ✗ Enhanced logging not found in configuration!" -ForegroundColor Red
        exit 1
    }
    
    # Count log sinks
    $sinkCount = $configContent.Serilog.WriteTo.Count
    Write-Host "  ✓ Log sinks configured: $sinkCount" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Invalid JSON in source config: $_" -ForegroundColor Red
    exit 1
}

# Verify deployment path exists
Write-Host ""
Write-Host "→ Verifying deployment path..." -ForegroundColor Yellow
if (-not (Test-Path $deployPath)) {
    Write-Host "  ✗ Deployment path not found: $deployPath" -ForegroundColor Red
    exit 1
}
Write-Host "  ✓ Deployment path exists" -ForegroundColor Green

# Verify IIS app pool exists
Write-Host ""
Write-Host "→ Verifying IIS application pool..." -ForegroundColor Yellow
try {
    Import-Module WebAdministration -ErrorAction Stop
    $appPool = Get-WebAppPoolState -Name $appPoolName -ErrorAction Stop
    Write-Host "  ✓ App pool '$appPoolName' found (State: $($appPool.Value))" -ForegroundColor Green
} catch {
    Write-Host "  ✗ App pool not found or WebAdministration module unavailable" -ForegroundColor Red
    Write-Host "    Error: $_" -ForegroundColor Red
    exit 1
}

if ($Verify) {
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "  Verification Complete - Ready for Deployment" -ForegroundColor Green
    Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "To deploy, run without -Verify flag:" -ForegroundColor Yellow
    Write-Host "  .\deploy-production-logging.ps1" -ForegroundColor White
    Write-Host ""
    exit 0
}

# Backup existing config
Write-Host ""
Write-Host "→ Backing up existing configuration..." -ForegroundColor Yellow
if (Test-Path $targetConfig) {
    $backupName = "appsettings.Production.json.backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    $backupPath = Join-Path $deployPath $backupName
    Copy-Item $targetConfig $backupPath -Force
    Write-Host "  ✓ Backup created: $backupName" -ForegroundColor Green
} else {
    Write-Host "  ! No existing config to backup" -ForegroundColor Yellow
}

# Stop application pool
Write-Host ""
Write-Host "→ Stopping application pool '$appPoolName'..." -ForegroundColor Yellow
try {
    Stop-WebAppPool -Name $appPoolName -ErrorAction Stop
    Start-Sleep -Seconds 2
    
    # Wait for app pool to stop (max 30 seconds)
    $timeout = 30
    $elapsed = 0
    while ($elapsed -lt $timeout) {
        $state = (Get-WebAppPoolState -Name $appPoolName).Value
        if ($state -eq 'Stopped') {
            Write-Host "  ✓ App pool stopped" -ForegroundColor Green
            break
        }
        Start-Sleep -Seconds 1
        $elapsed++
    }
    
    if ($elapsed -ge $timeout) {
        Write-Host "  ! App pool did not stop within timeout - continuing anyway" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ✗ Error stopping app pool: $_" -ForegroundColor Red
    Write-Host "    Continuing anyway..." -ForegroundColor Yellow
}

# Deploy new configuration
Write-Host ""
Write-Host "→ Deploying new configuration..." -ForegroundColor Yellow
try {
    Copy-Item $sourceConfig $targetConfig -Force
    Write-Host "  ✓ Configuration deployed" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Failed to deploy configuration: $_" -ForegroundColor Red
    
    # Try to restart app pool even if deployment failed
    Write-Host "  ! Attempting to restart app pool..." -ForegroundColor Yellow
    Start-WebAppPool -Name $appPoolName -ErrorAction SilentlyContinue
    exit 1
}

# Ensure logs directory exists with proper permissions
Write-Host ""
Write-Host "→ Ensuring logs directory exists..." -ForegroundColor Yellow
if (-not (Test-Path $logsPath)) {
    New-Item -Path $logsPath -ItemType Directory -Force | Out-Null
    Write-Host "  ✓ Logs directory created" -ForegroundColor Green
} else {
    Write-Host "  ✓ Logs directory exists" -ForegroundColor Green
}

# Set permissions for IIS app pool identity
Write-Host ""
Write-Host "→ Configuring permissions..." -ForegroundColor Yellow
try {
    $acl = Get-Acl $logsPath
    $appPoolIdentity = "IIS AppPool\$appPoolName"
    $permission = $appPoolIdentity, "Modify", "ContainerInherit,ObjectInherit", "None", "Allow"
    $accessRule = New-Object System.Security.AccessControl.FileSystemAccessRule $permission
    $acl.SetAccessRule($accessRule)
    Set-Acl $logsPath $acl
    Write-Host "  ✓ Permissions configured for $appPoolIdentity" -ForegroundColor Green
} catch {
    Write-Host "  ! Could not set permissions: $_" -ForegroundColor Yellow
    Write-Host "    Logs may not be written if permissions are incorrect" -ForegroundColor Yellow
}

# Start application pool
Write-Host ""
Write-Host "→ Starting application pool '$appPoolName'..." -ForegroundColor Yellow
try {
    Start-WebAppPool -Name $appPoolName -ErrorAction Stop
    Start-Sleep -Seconds 3
    
    # Wait for app pool to start (max 30 seconds)
    $timeout = 30
    $elapsed = 0
    while ($elapsed -lt $timeout) {
        $state = (Get-WebAppPoolState -Name $appPoolName).Value
        if ($state -eq 'Started') {
            Write-Host "  ✓ App pool started" -ForegroundColor Green
            break
        }
        Start-Sleep -Seconds 1
        $elapsed++
    }
    
    if ($elapsed -ge $timeout) {
        Write-Host "  ! App pool may not have started - check IIS manually" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ✗ Error starting app pool: $_" -ForegroundColor Red
    Write-Host "    Please start manually via IIS Manager" -ForegroundColor Yellow
}

# Verify deployment
Write-Host ""
Write-Host "→ Verifying deployment..." -ForegroundColor Yellow

# Check if config file was updated
$targetConfigInfo = Get-Item $targetConfig
if ($targetConfigInfo.LastWriteTime -gt (Get-Date).AddMinutes(-2)) {
    Write-Host "  ✓ Configuration file updated successfully" -ForegroundColor Green
} else {
    Write-Host "  ! Configuration file timestamp seems old" -ForegroundColor Yellow
}

# Check app pool state
$finalState = (Get-WebAppPoolState -Name $appPoolName).Value
if ($finalState -eq 'Started') {
    Write-Host "  ✓ App pool is running" -ForegroundColor Green
} else {
    Write-Host "  ! App pool state: $finalState" -ForegroundColor Yellow
}

# Summary
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Deployment Complete" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "Configuration deployed to:" -ForegroundColor White
Write-Host "  $targetConfig" -ForegroundColor Cyan
Write-Host ""
Write-Host "Logs will be written to:" -ForegroundColor White
Write-Host "  $logsPath" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Wait 1-2 minutes for application to fully start" -ForegroundColor White
Write-Host "  2. Check logs are being created:" -ForegroundColor White
Write-Host "     Get-ChildItem '$logsPath' | Sort-Object LastWriteTime -Descending" -ForegroundColor Gray
Write-Host "  3. Monitor real-time activity:" -ForegroundColor White
Write-Host "     Get-Content '$logsPath\noor-canvas-prod-$(Get-Date -Format 'yyyyMMdd').txt' -Wait -Tail 50" -ForegroundColor Gray
Write-Host "  4. Access site: https://noorcanvas.kashkole.com" -ForegroundColor White
Write-Host ""
Write-Host "Quick Reference: See Docs/PROD-LOGS-QUICK-REF.md" -ForegroundColor Yellow
Write-Host ""
