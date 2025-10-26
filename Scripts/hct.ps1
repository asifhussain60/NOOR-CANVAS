<#
.SYNOPSIS
    HCT (Host Canvas Tool) - Reset canvas session and generate tokens from PowerShell

.DESCRIPTION
    Lightweight PowerShell wrapper for Host Provisioner functionality.
    Resets canvas schema data for a session and generates fresh host/user tokens.
    
    This script:
    1. Validates SessionId exists in KSESSIONS
    2. Clears canvas.Participants and canvas.SessionData for the session
    3. Generates new host and user tokens via HostProvisioner
    4. Displays clickable URLs for immediate access

.PARAMETER SessionId
    The Session ID from KSESSIONS database to provision (required)

.PARAMETER Environment
    Target environment: "Development" or "Production" (default: Development)

.PARAMETER CreatedBy
    Optional: Name of person provisioning (for audit tracking)

.PARAMETER OpenBrowser
    Optional: Launch host URL in default browser after provisioning

.EXAMPLE
    .\hct.ps1 -SessionId 212
    
    Provisions session 212 in Development environment

.EXAMPLE
    .\hct.ps1 -SessionId 215 -Environment Production -CreatedBy "John Doe"
    
    Provisions session 215 in Production with audit tracking

.EXAMPLE
    .\hct.ps1 -SessionId 212 -OpenBrowser
    
    Provisions session 212 and opens host URL in browser

.NOTES
    Author: NOOR Canvas Team
    Created: 2025-10-26
    Requires: .NET 8.0 SDK, SQL Server access, HostProvisioner built
#>

param(
    [Parameter(Mandatory=$true, Position=0)]
    [int]$SessionId,
    
    [Parameter(Mandatory=$false)]
    [ValidateSet("Development", "Production")]
    [string]$Environment = "Development",
    
    [Parameter(Mandatory=$false)]
    [string]$CreatedBy = $env:USERNAME,
    
    [Parameter(Mandatory=$false)]
    [switch]$OpenBrowser
)

# Script configuration
$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$HostProvisionerPath = Join-Path $ProjectRoot "Tools\HostProvisioner\HostProvisioner"

# Environment-specific configuration
$envConfig = @{
    "Development" = @{
        Database = "KSESSIONS_DEV"
        BaseUrl = "https://localhost:9091"
        Description = "Development environment (local testing)"
    }
    "Production" = @{
        Database = "KSESSIONS"
        BaseUrl = "https://noorcanvas.kashkole.com"
        Description = "Production environment (live sessions)"
    }
}

$currentEnvConfig = $envConfig[$Environment]

# Display banner
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " HCT - Host Canvas Tool" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SessionId:   $SessionId" -ForegroundColor White
Write-Host "Environment: $Environment" -ForegroundColor White
Write-Host "Database:    $($currentEnvConfig.Database)" -ForegroundColor White
Write-Host "Base URL:    $($currentEnvConfig.BaseUrl)" -ForegroundColor White
Write-Host "Created By:  $CreatedBy" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Validate HostProvisioner exists
if (-not (Test-Path $HostProvisionerPath)) {
    Write-Host "❌ Error: HostProvisioner not found at: $HostProvisionerPath" -ForegroundColor Red
    exit 1
}

# Validate appsettings file exists for environment
$appsettingsFile = if ($Environment -eq "Production") {
    Join-Path $HostProvisionerPath "appsettings.Production.json"
} else {
    Join-Path $HostProvisionerPath "appsettings.json"
}

if (-not (Test-Path $appsettingsFile)) {
    Write-Host "⚠️  Warning: $appsettingsFile not found" -ForegroundColor Yellow
}

# Set environment variable for HostProvisioner
$env:ASPNETCORE_ENVIRONMENT = $Environment
Write-Host "🔧 Configuring $Environment environment..." -ForegroundColor Yellow
Write-Host "   → Database: $($currentEnvConfig.Database)" -ForegroundColor Gray
Write-Host "   → Base URL: $($currentEnvConfig.BaseUrl)" -ForegroundColor Gray
Write-Host ""

# Build HostProvisioner command
$dotnetArgs = @(
    "run",
    "--project", $HostProvisionerPath,
    "--",
    "create",
    "--session-id", $SessionId,
    "--created-by", "`"$CreatedBy`""
)

Write-Host "🚀 Invoking HostProvisioner..." -ForegroundColor Yellow
Write-Host ""

# Execute HostProvisioner and capture output
try {
    $output = & dotnet $dotnetArgs 2>&1
    
    # Check for errors in output
    $errorLines = $output | Where-Object { $_ -match "PROVISIONER-ERROR|ERROR|Exception|failed" }
    if ($errorLines) {
        Write-Host "❌ HostProvisioner encountered errors:" -ForegroundColor Red
        $errorLines | ForEach-Object { Write-Host $_ -ForegroundColor Red }
        Write-Host ""
        exit 1
    }
    
    # Parse tokens and URLs from output
    $hostToken = $null
    $userToken = $null
    $hostUrl = $null
    $participantUrl = $null
    $participantsCleared = 0
    $sessionDataCleared = 0
    
    foreach ($line in $output) {
        if ($line -match "Host Token:\s*([A-Z0-9]{8})") {
            $hostToken = $Matches[1]
        }
        elseif ($line -match "User Token:\s*([A-Z0-9]{8})") {
            $userToken = $Matches[1]
        }
        elseif ($line -match "Host URL:\s*(.+)$") {
            $hostUrl = $Matches[1].Trim()
        }
        elseif ($line -match "Participant URL:\s*(.+)$") {
            $participantUrl = $Matches[1].Trim()
        }
        elseif ($line -match "Cleared (\d+) participants") {
            $participantsCleared = [int]$Matches[1]
        }
        elseif ($line -match "(\d+) session data records") {
            $sessionDataCleared = [int]$Matches[1]
        }
    }
    
    # Validate we got the tokens
    if (-not $hostToken -or -not $userToken) {
        Write-Host "⚠️  Warning: Could not parse tokens from HostProvisioner output" -ForegroundColor Yellow
        Write-Host "Raw output:" -ForegroundColor Gray
        $output | ForEach-Object { Write-Host $_ -ForegroundColor Gray }
        exit 1
    }
    
    # Display success banner
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host " ✅ Session Provisioned Successfully" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    
    # Display cleanup stats
    Write-Host "📊 Data Reset:" -ForegroundColor Cyan
    Write-Host "   Participants cleared: $participantsCleared" -ForegroundColor White
    Write-Host "   Session data cleared: $sessionDataCleared" -ForegroundColor White
    Write-Host ""
    
    # Display tokens and URLs
    Write-Host "🎫 Host Access:" -ForegroundColor Cyan
    Write-Host "   Token: " -NoNewline -ForegroundColor White
    Write-Host $hostToken -ForegroundColor Yellow
    Write-Host "   URL:   " -NoNewline -ForegroundColor White
    Write-Host $hostUrl -ForegroundColor Blue
    Write-Host ""
    
    Write-Host "👥 Participant Access:" -ForegroundColor Cyan
    Write-Host "   Token: " -NoNewline -ForegroundColor White
    Write-Host $userToken -ForegroundColor Yellow
    Write-Host "   URL:   " -NoNewline -ForegroundColor White
    Write-Host $participantUrl -ForegroundColor Blue
    Write-Host ""
    
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "💡 Tip: Ctrl+Click URLs to open in browser" -ForegroundColor Gray
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    
    # Open browser if requested
    if ($OpenBrowser -and $hostUrl) {
        Write-Host "🌐 Opening host URL in browser..." -ForegroundColor Yellow
        Start-Process $hostUrl
    }
    
    # Return success
    exit 0
}
catch {
    Write-Host ""
    Write-Host "❌ Error executing HostProvisioner:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    exit 1
}
