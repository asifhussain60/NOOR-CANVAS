# NOOR Canvas Global Launcher (nc)
# Consolidated global command for NOOR Canvas development
# Replaces legacy nsrun and ncrun commands

param(
    [switch]$Build,
    [switch]$NoBrowser,
    [switch]$Https,
    [switch]$Test,
    [int]$Port,
    [switch]$Help
)

# Show help information
if ($Help) {
    Write-Host ""
    Write-Host "=== NOOR Canvas Global Launcher (nc) ===" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "USAGE:" -ForegroundColor Yellow
    Write-Host "  nc                    # Start NOOR Canvas application"
    Write-Host "  nc -Build             # Build first, then start"
    Write-Host "  nc -NoBrowser         # Start without opening browser"
    Write-Host "  nc -Https             # Use HTTPS on port 9091"
    Write-Host "  nc -Port 8080         # Use custom port"
    Write-Host "  nc -Test              # Build, serve, and launch both services"
    Write-Host "  nc -Help              # Show this help"
    Write-Host ""
    Write-Host "EXAMPLES:" -ForegroundColor Yellow
    Write-Host "  nc -Build -NoBrowser  # Build and start without browser"
    Write-Host "  nc -Test -Https       # Build and test with HTTPS"
    Write-Host "  nc -Test -NoBrowser   # Build and test without opening browsers"
    Write-Host "  nc -Port 8080         # Start on custom port 8080"
    Write-Host ""
    Write-Host "TESTING MODE (-Test):" -ForegroundColor Green
    Write-Host "  * BUILDS the NOOR Canvas application first (always)"
    Write-Host "  * USES integrated testing suite (no separate server needed)"
    Write-Host "  * LAUNCHES both app and testing suite in browser"
    Write-Host "  * App: http://localhost:9090 (or custom port)"
    Write-Host "  * Tests: http://localhost:9090/testing (integrated route)"
    Write-Host "  * No CORS issues - single server architecture"
    Write-Host ""
    return
}

# Define workspace paths
$noorCanvasPath = "D:\PROJECTS\NOOR CANVAS"
$projectPath = Join-Path $noorCanvasPath "SPA\NoorCanvas"

# Verify paths exist
if (!(Test-Path $noorCanvasPath)) {
    Write-Error "NOOR Canvas workspace not found at: $noorCanvasPath"
    return
}

if (!(Test-Path $projectPath)) {
    Write-Error "NOOR Canvas project not found at: $projectPath"
    return
}

# Determine port
if (-not $Port) {
    $Port = if ($Https) { 9091 } else { 9090 }
}

# Protocol and URL
$protocol = if ($Https) { "https" } else { "http" }
$appUrl = "${protocol}://localhost:$Port"

Write-Host "Starting NOOR Canvas..." -ForegroundColor Cyan
Write-Host "Workspace: $noorCanvasPath" -ForegroundColor Gray
Write-Host "Project: $projectPath" -ForegroundColor Gray

# Build if requested or if in Test mode
if ($Build -or $Test) {
    Write-Host "Building project..." -ForegroundColor Yellow
    Set-Location $projectPath
    
    Write-Host "Restoring packages..." -ForegroundColor Gray
    dotnet restore --verbosity quiet
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Package restore failed"
        return
    }
    
    Write-Host "Building..." -ForegroundColor Gray
    dotnet build --no-restore --verbosity quiet
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Build failed"
        return
    }
    Write-Host "Build completed successfully" -ForegroundColor Green
}

# Stop any existing processes on the ports
Write-Host "Stopping existing processes..." -ForegroundColor Yellow
Stop-Process -Name "dotnet" -Force -ErrorAction SilentlyContinue
Stop-Process -Name "NoorCanvas" -Force -ErrorAction SilentlyContinue

# Testing mode - start application and use integrated testing suite
if ($Test) {
    Write-Host ""
    Write-Host "=== NOOR Canvas Testing Mode ===" -ForegroundColor Magenta
    Write-Host "Starting application with integrated testing suite..." -ForegroundColor Cyan
    
    # Start the main application
    Write-Host "Starting NOOR Canvas application on $appUrl..." -ForegroundColor Green
    Set-Location $projectPath
    
    $buildFlag = if ($Build -or $Test) { "--no-build" } else { "" }
    $job = Start-Job -ScriptBlock {
        param($projectPath, $urls, $buildFlag)
        Set-Location $projectPath
        if ($buildFlag) {
            dotnet run --urls $urls --no-build
        } else {
            dotnet run --urls $urls
        }
    } -ArgumentList $projectPath, $appUrl, $buildFlag
    
    # Wait for app to start
    Write-Host "Waiting for application to start..." -ForegroundColor Yellow
    Start-Sleep 4
    
    # Verify application started successfully
    Write-Host "Verifying application startup..." -ForegroundColor Yellow
    try {
        $response = Invoke-WebRequest -Uri $appUrl -TimeoutSec 10 -UseBasicParsing -ErrorAction Stop
        Write-Host "Application is responding on $appUrl" -ForegroundColor Green
        
        # Verify testing suite integration
        $testingUrl = "$appUrl/testing"
        try {
            $testResponse = Invoke-WebRequest -Uri $testingUrl -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
            Write-Host "Testing suite is available at $testingUrl" -ForegroundColor Green
        } catch {
            Write-Warning "Testing suite integration may not be available yet..."
        }
        
    } catch {
        Write-Warning "Application may still be starting up..."
    }
    
    # Open both URLs in browser unless -NoBrowser specified
    if (-not $NoBrowser) {
        Write-Host "Opening application and testing suite in browser..." -ForegroundColor Yellow
        Start-Sleep 2
        
        # Open application first
        Write-Host "   Opening NOOR Canvas application..." -ForegroundColor Gray
        Start-Process $appUrl
        
        Start-Sleep 1
        
        # Open integrated testing suite
        Write-Host "   Opening integrated Testing Suite..." -ForegroundColor Gray
        Start-Process "$appUrl/testing"
    } else {
        Write-Host "Browser opening skipped (NoBrowser specified)" -ForegroundColor Cyan
    }
    
    Write-Host ""
    Write-Host "=== NOOR Canvas Testing Environment Active ===" -ForegroundColor Green
    Write-Host ""
    Write-Host "NOOR Canvas Application:" -ForegroundColor Cyan
    Write-Host "   URL: $appUrl" -ForegroundColor White
    Write-Host "   Status: Running with built application" -ForegroundColor Green
    Write-Host ""
    Write-Host "Integrated Testing Suite:" -ForegroundColor Cyan  
    Write-Host "   URL: $appUrl/testing" -ForegroundColor White
    Write-Host "   Status: Served via NOOR Canvas web server" -ForegroundColor Green
    Write-Host ""
    Write-Host "Usage:" -ForegroundColor Yellow
    Write-Host "   * Test your changes in the main application" -ForegroundColor Gray
    Write-Host "   * Use the integrated testing suite for component testing" -ForegroundColor Gray
    Write-Host "   * All functionality available through single web server" -ForegroundColor Gray
    Write-Host "   * No CORS issues - same origin for API calls" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Press Ctrl+C to stop the application" -ForegroundColor Red
    Write-Host ""
    
    try {
        # Wait for the job to complete
        Wait-Job $job | Out-Null
    } catch {
        Write-Host "Application stopped" -ForegroundColor Yellow
    } finally {
        # Clean up job
        Remove-Job $job -Force -ErrorAction SilentlyContinue
    }
    
    return
}

# Normal mode - start just the application
Write-Host "Starting NOOR Canvas application on $appUrl..." -ForegroundColor Green
Set-Location $projectPath

# Start the application in a background job for better control
$buildFlag = if ($Build) { "--no-build" } else { "" }
$job = Start-Job -ScriptBlock {
    param($projectPath, $urls, $buildFlag)
    Set-Location $projectPath
    if ($buildFlag) {
        dotnet run --urls $urls --no-build
    } else {
        dotnet run --urls $urls
    }
} -ArgumentList $projectPath, $appUrl, $buildFlag

# Wait for startup
Write-Host "Waiting for application to start..." -ForegroundColor Yellow
Start-Sleep 3

# Open browser unless -NoBrowser specified
if (-not $NoBrowser) {
    Write-Host "Opening application in browser..." -ForegroundColor Yellow
    Start-Sleep 1
    Start-Process $appUrl
}

Write-Host ""
Write-Host "=== NOOR Canvas Application Started ===" -ForegroundColor Green
Write-Host "URL: $appUrl" -ForegroundColor White
Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow
Write-Host ""

# Keep script running to maintain the job
try {
    # Wait for the job to complete (i.e., until user stops the application)
    Wait-Job $job | Out-Null
} catch {
    Write-Host "Application stopped" -ForegroundColor Yellow
} finally {
    # Clean up
    Remove-Job $job -Force -ErrorAction SilentlyContinue
}
