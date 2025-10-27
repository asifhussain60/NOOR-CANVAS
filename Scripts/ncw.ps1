<#
.SYNOPSIS
    NCW (NoorCanvas Watch) - Build and launch NoorCanvas application

.DESCRIPTION
    Lightweight PowerShell script to build and launch the NoorCanvas application in a new window.
    
    This script:
    1. Stops any existing NoorCanvas processes
    2. Builds the NoorCanvas application
    3. Launches the application in a separate window
    4. Waits for the application to be ready

.PARAMETER Environment
    Target environment: "Development" or "Production" (default: Development)

.PARAMETER OpenBrowser
    Optional: Launch application URL in default browser after startup

.PARAMETER StartupTimeout
    Optional: Maximum seconds to wait for app startup (default: 30)

.EXAMPLE
    .\ncw.ps1
    
    Launches NoorCanvas in Development environment

.EXAMPLE
    .\ncw.ps1 -Environment Production
    
    Launches NoorCanvas in Production environment

.EXAMPLE
    .\ncw.ps1 -OpenBrowser
    
    Launches NoorCanvas and opens URL in browser

.NOTES
    Author: NOOR Canvas Team
    Created: 2025-10-26
    Updated: 2025-10-27
    Requires: .NET 8.0 SDK
#>

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("Development", "Production")]
    [string]$Environment = "Development",
    
    [Parameter(Mandatory=$false)]
    [switch]$OpenBrowser,
    
    [Parameter(Mandatory=$false)]
    [int]$StartupTimeout = 30
)

# Script configuration
$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$NoorCanvasPath = Join-Path $ProjectRoot "SPA\NoorCanvas"

# Helper functions
function Test-NoorCanvasRunning {
    param([string]$Url)
    
    try {
        $response = Invoke-WebRequest -Uri $Url -Method HEAD -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
        return $response.StatusCode -eq 200
    }
    catch {
        return $false
    }
}

function Stop-ProcessesOnPorts {
    param([int[]]$Ports)
    
    $killedAny = $false
    foreach ($port in $Ports) {
        try {
            # Get all TCP connections on this port
            $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
            foreach ($conn in $connections) {
                try {
                    $process = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
                    if ($process) {
                        Write-Host "   → Killing process: $($process.ProcessName) (PID: $($process.Id)) on port $port" -ForegroundColor Yellow
                        Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
                        $killedAny = $true
                    }
                }
                catch {
                    # Process may have already exited
                    Write-Host "   → Process on port $port already gone" -ForegroundColor Gray
                }
            }
        }
        catch {
            # Port not in use or no permission, continue
        }
    }
    
    # Also kill any NoorCanvas.exe or dotnet processes running NoorCanvas
    try {
        $noorCanvasProcesses = Get-Process | Where-Object {
            ($_.ProcessName -eq "NoorCanvas") -or 
            ($_.ProcessName -eq "dotnet" -and $_.Path -like "*NoorCanvas*") -or
            ($_.MainModule.FileName -like "*NoorCanvas.exe*")
        }
        
        foreach ($proc in $noorCanvasProcesses) {
            Write-Host "   → Killing NoorCanvas process: $($proc.ProcessName) (PID: $($proc.Id))" -ForegroundColor Yellow
            Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
            $killedAny = $true
        }
    }
    catch {
        # No NoorCanvas processes found or access denied
    }
    
    if ($killedAny) {
        Write-Host "   ⏳ Waiting for processes to release resources..." -ForegroundColor Gray
        Start-Sleep -Seconds 3  # Give processes time to release ports and files
    }
}

function Wait-AppReady {
    param(
        [string]$Url,
        [int]$MaxWaitSeconds
    )
    
    $elapsed = 0
    Write-Host "⏳ Waiting for app to be ready..." -ForegroundColor Yellow
    
    while ($elapsed -lt $MaxWaitSeconds) {
        $elapsed++
        Write-Host "`r   Progress: $elapsed/$MaxWaitSeconds seconds..." -NoNewline -ForegroundColor Gray
        
        if (Test-NoorCanvasRunning -Url $Url) {
            Write-Host ""
            return $true
        }
        
        Start-Sleep -Seconds 1
    }
    
    Write-Host ""
    return $false
}

function Start-NoorCanvasApp {
    param(
        [string]$Environment,
        [string]$WorkingDirectory
    )
    
    # Start app in separate PowerShell window
    $processInfo = Start-Process -FilePath "pwsh.exe" `
        -ArgumentList "-NoExit", "-Command", "cd '$WorkingDirectory'; `$env:ASPNETCORE_ENVIRONMENT='$Environment'; dotnet run" `
        -PassThru `
        -WindowStyle Normal
    
    return $processInfo
}

# Environment-specific configuration
$envConfig = @{
    "Development" = @{
        BaseUrl = "https://localhost:9091"
        Description = "Development environment (local testing)"
    }
    "Production" = @{
        BaseUrl = "https://noorcanvas.kashkole.com"
        Description = "Production environment (live sessions)"
    }
}

$currentEnvConfig = $envConfig[$Environment]

# Display banner
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " NCW - NoorCanvas Watch" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Environment: $Environment" -ForegroundColor White
Write-Host "Base URL:    $($currentEnvConfig.BaseUrl)" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Validate NoorCanvas path exists
if (-not (Test-Path $NoorCanvasPath)) {
    Write-Host "❌ Error: NoorCanvas not found at: $NoorCanvasPath" -ForegroundColor Red
    exit 1
}

# Check if app is already running
$appUrl = $currentEnvConfig.BaseUrl
$appWasRunning = Test-NoorCanvasRunning -Url $appUrl

if ($appWasRunning) {
    Write-Host "🔍 NoorCanvas app detected running at $appUrl" -ForegroundColor Yellow
    Write-Host "🧹 Stopping old instance for clean rebuild..." -ForegroundColor Yellow
}
else {
    Write-Host "🔍 NoorCanvas app not detected, starting..." -ForegroundColor Yellow
}

# Clean up existing processes and ports
Write-Host "🧹 Cleaning up ports 9091 and 9090..." -ForegroundColor Yellow
Stop-ProcessesOnPorts -Ports @(9091, 9090)

# Start NoorCanvas app
Write-Host "🚀 Starting NoorCanvas app in separate window..." -ForegroundColor Yellow
    
try {
    $appJob = Start-NoorCanvasApp -Environment $Environment -WorkingDirectory $NoorCanvasPath
    
    # Wait for app readiness
    $ready = Wait-AppReady -Url $appUrl -MaxWaitSeconds $StartupTimeout
    
    if (-not $ready) {
        Write-Host "❌ App failed to start within $StartupTimeout seconds" -ForegroundColor Red
        Write-Host "   Check the app window for error details" -ForegroundColor Yellow
        exit 1
    }
    
    Write-Host "✅ App ready at $appUrl" -ForegroundColor Green
    Write-Host ""
    
    # Display success banner
    Write-Host "========================================" -ForegroundColor Green
    Write-Host " ✅ NoorCanvas Started Successfully" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "🌐 Application URL:" -ForegroundColor Cyan
    Write-Host "   " -NoNewline
    Write-Host $appUrl -ForegroundColor Blue
    Write-Host ""
    Write-Host "ℹ️  App is running in separate window (will stay open)" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "💡 Tip: Ctrl+Click URL to open in browser" -ForegroundColor Gray
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    
    # Open browser if requested
    if ($OpenBrowser) {
        Write-Host "🌐 Opening application URL in browser..." -ForegroundColor Yellow
        Start-Process $appUrl
    }
    
    # Return success
    exit 0
}
catch {
    Write-Host "❌ Failed to start app: $_" -ForegroundColor Red
    exit 1
}
