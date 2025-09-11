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
    Write-Host "  nc -Test              # Start Testing Suite + Application"
    Write-Host "  nc -Help              # Show this help"
    Write-Host ""
    Write-Host "EXAMPLES:" -ForegroundColor Yellow
    Write-Host "  nc -Build -NoBrowser  # Build and start without browser"
    Write-Host "  nc -Test -Https       # Start testing suite with HTTPS"
    Write-Host "  nc -Port 8080         # Start on custom port 8080"
    Write-Host ""
    Write-Host "TESTING MODE (-Test):" -ForegroundColor Green
    Write-Host "  - Serves both NOOR Canvas app and Testing Suite"
    Write-Host "  - App: http://localhost:9090 (or custom port)"
    Write-Host "  - Tests: http://localhost:3000"
    Write-Host "  - Opens both in browser automatically"
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

# Build if requested
if ($Build) {
    Write-Host "Building project..." -ForegroundColor Yellow
    Set-Location $projectPath
    
    dotnet restore --verbosity quiet
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Package restore failed"
        return
    }
    
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

# Testing mode - start both application and test suite
if ($Test) {
    Write-Host ""
    Write-Host "=== NOOR Canvas Testing Mode ===" -ForegroundColor Magenta
    Write-Host "Starting both Application and Testing Suite..." -ForegroundColor Cyan
    
    # Start the main application in background
    Write-Host "Starting main application on $appUrl..." -ForegroundColor Green
    Set-Location $projectPath
    
    $appJob = Start-Job -ScriptBlock {
        param($projectPath, $urls)
        Set-Location $projectPath
        dotnet run --urls $urls
    } -ArgumentList $projectPath, $appUrl
    
    # Wait a moment for app to start
    Start-Sleep 3
    
    # Start test suite
    Write-Host "Starting test suite on http://localhost:3000..." -ForegroundColor Green
    $testSuitePath = Join-Path $noorCanvasPath "Workspaces\Testing\KSESSION TESTER"
    
    if (Test-Path $testSuitePath) {
        Set-Location $testSuitePath
        
        $testJob = Start-Job -ScriptBlock {
            param($testPath)
            Set-Location $testPath
            try {
                python -m http.server 3000
            } catch {
                # Fallback to npx if python fails
                npx http-server . -p 3000 --cors
            }
        } -ArgumentList $testSuitePath
        
        # Wait for test suite to start
        Start-Sleep 2
        
        # Open both URLs in browser unless -NoBrowser specified
        if (-not $NoBrowser) {
            Write-Host "Opening application and test suite in browser..." -ForegroundColor Yellow
            Start-Sleep 1
            Start-Process $appUrl
            Start-Process "http://localhost:3000"
        }
        
        Write-Host ""
        Write-Host "=== NOOR Canvas Testing Environment Active ===" -ForegroundColor Green
        Write-Host "Application:  $appUrl" -ForegroundColor White
        Write-Host "Test Suite:   http://localhost:3000" -ForegroundColor White
        Write-Host "Press Ctrl+C to stop both services" -ForegroundColor Yellow
        Write-Host ""
        
        try {
            # Keep both jobs running
            while ($appJob.State -eq "Running" -or $testJob.State -eq "Running") {
                Start-Sleep 1
            }
        } catch {
            Write-Host "Services stopped" -ForegroundColor Yellow
        } finally {
            # Clean up jobs
            Stop-Job $appJob, $testJob -ErrorAction SilentlyContinue
            Remove-Job $appJob, $testJob -Force -ErrorAction SilentlyContinue
        }
    } else {
        Write-Warning "Test suite not found at: $testSuitePath"
        Write-Host "Starting application only..." -ForegroundColor Yellow
        
        # Continue with normal application start
        Set-Location $projectPath
        dotnet run --urls $appUrl
    }
    
    return
}

# Normal mode - start just the application
Write-Host "Starting NOOR Canvas application on $appUrl..." -ForegroundColor Green
Set-Location $projectPath

# Start the application in a background job for better control
$job = Start-Job -ScriptBlock {
    param($projectPath, $urls)
    Set-Location $projectPath
    dotnet run --urls $urls
} -ArgumentList $projectPath, $appUrl

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
