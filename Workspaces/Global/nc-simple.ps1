# NOOR Canvas Global Command (nc) - Simple Development Tool
# Version: 2.1.0 - Simplified Approach
# Description: Simple application launcher with basic process detection

param(
    [switch]$Help,
    [switch]$Build,
    [switch]$NoBrowser,
    [switch]$Https,
    [int]$Port = 9090,
    [switch]$Test
)

# Show help and exit
if ($Help) {
    Write-Host ""
    Write-Host "NOOR Canvas Global Command (nc) - Simple Development Tool" -ForegroundColor Cyan
    Write-Host "Version: 2.1.0 - Simplified Approach" -ForegroundColor Gray
    Write-Host ""
    Write-Host "USAGE:" -ForegroundColor Yellow
    Write-Host "  nc                    # Start app + open browser"
    Write-Host "  nc -Build             # Build first, then start with browser"
    Write-Host "  nc -NoBrowser         # Start without opening browser"
    Write-Host "  nc -Https             # Use HTTPS on port 9091"
    Write-Host "  nc -Port 8080         # Use custom port"
    Write-Host "  nc -Test              # Run testing suite on port 3000"
    Write-Host "  nc -Help              # Show this help"
    Write-Host ""
    Write-Host "FEATURES:" -ForegroundColor Yellow
    Write-Host "  - Simple process detection (checks if port is in use)"
    Write-Host "  - Automatic browser opening with 3-second delay"
    Write-Host "  - Build verification and error handling"
    Write-Host "  - Interactive mode with 'q' to quit"
    Write-Host ""
    return
}

# Get the correct project path
$workspaceRoot = Split-Path $MyInvocation.MyCommand.Path -Parent
$workspaceRoot = Split-Path $workspaceRoot -Parent
$projectPath = Join-Path $workspaceRoot "SPA\NoorCanvas"

# Validate project exists
if (-not (Test-Path $projectPath)) {
    Write-Host "ERROR: Project path not found: $projectPath" -ForegroundColor Red
    exit 1
}

# Set location to project directory
Set-Location $projectPath

# Determine target port
$targetPort = if ($Https) { 9091 } elseif ($Test) { 3000 } else { $Port }

# Simple function to check if port is in use
function Test-PortInUse {
    param([int]$PortNumber)
    try {
        $connection = Test-NetConnection -ComputerName "localhost" -Port $PortNumber -WarningAction SilentlyContinue -InformationLevel Quiet
        return $connection.TcpTestSucceeded
    } catch {
        return $false
    }
}

# Check if port is already in use
if (Test-PortInUse -PortNumber $targetPort) {
    Write-Host "Application already running on port $targetPort" -ForegroundColor Green
    Write-Host "URL: http://localhost:$targetPort" -ForegroundColor Cyan
    
    # Open browser if requested
    if (-not $NoBrowser) {
        Write-Host "Opening browser..." -ForegroundColor Yellow
        Start-Process "http://localhost:$targetPort"
    }
    
    Write-Host "Press 'q' to quit or any other key to continue..." -ForegroundColor Gray
    $key = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    if ($key.Character -eq 'q') {
        Write-Host "Exiting..." -ForegroundColor Gray
        exit 0
    }
    return
}

# Build if requested
if ($Build) {
    Write-Host "Building project..." -ForegroundColor Yellow
    dotnet build --no-restore
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Build failed" -ForegroundColor Red
        exit 1
    }
    Write-Host "Build successful" -ForegroundColor Green
}

# Determine URL
$url = if ($Test) {
    "http://localhost:3000"
} elseif ($Https) {
    "https://localhost:9091"
} else {
    "http://localhost:$Port"
}

# Start application
Write-Host "Starting NOOR Canvas on $url..." -ForegroundColor Green

if ($Test) {
    # Testing mode
    Write-Host "Running in testing mode..." -ForegroundColor Magenta
    dotnet run --urls "http://localhost:3000"
} else {
    # Normal mode - start in background
    $job = Start-Job -ScriptBlock {
        param($projectPath, $url)
        Set-Location $projectPath
        dotnet run --urls $url
    } -ArgumentList $projectPath, $url
    
    # Wait a moment for startup
    Start-Sleep 3
    
    # Open browser if requested
    if (-not $NoBrowser) {
        Write-Host "Opening browser..." -ForegroundColor Yellow
        Start-Job -ScriptBlock {
            param($url)
            Start-Sleep 3
            Start-Process $url
        } -ArgumentList $url | Out-Null
    }
    
    Write-Host "Application started successfully" -ForegroundColor Green
    Write-Host "URL: $url" -ForegroundColor Cyan
    Write-Host "💡 Press 'q' to quit or any other key to check status..." -ForegroundColor Gray
    
    # Interactive loop
    do {
        $key = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        
        if ($key.Character -eq 'q') {
            Write-Host "`n🛑 Stopping application..." -ForegroundColor Yellow
            Stop-Job $job -PassThru | Remove-Job
            Stop-Process -Name "dotnet" -Force -ErrorAction SilentlyContinue
            Write-Host "✅ Application stopped" -ForegroundColor Green
            break
        } else {
            Write-Host "`n📊 Job Status: $($job.State)" -ForegroundColor Cyan
            if ($job.State -eq "Failed") {
                Write-Host "❌ Application failed. Press 'q' to quit." -ForegroundColor Red
            } else {
                Write-Host "💡 Press 'q' to quit or any other key to check status..." -ForegroundColor Gray
            }
        }
    } while ($job.State -eq "Running")
}

Write-Host "👋 Session ended" -ForegroundColor Gray
