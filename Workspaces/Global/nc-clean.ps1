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
    Write-Host "  * SERVES both NOOR Canvas app and Testing Suite"
    Write-Host "  * LAUNCHES both in browser (unless -NoBrowser specified)"
    Write-Host "  * App: http://localhost:9090 (or custom port)"
    Write-Host "  * Tests: http://localhost:3000 (static file server)"
    Write-Host "  * Includes app verification and status monitoring"
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

# Testing mode - build, serve, and launch both application and test suite
if ($Test) {
    Write-Host ""
    Write-Host "=== NOOR Canvas Testing Mode ===" -ForegroundColor Magenta
    Write-Host "Starting both Application and Testing Suite..." -ForegroundColor Cyan
    
    # Start the main application in background
    Write-Host "Starting main application on $appUrl..." -ForegroundColor Green
    Set-Location $projectPath
    
    $buildFlag = if ($Build -or $Test) { "--no-build" } else { "" }
    $appJob = Start-Job -ScriptBlock {
        param($projectPath, $urls, $buildFlag)
        Set-Location $projectPath
        if ($buildFlag) {
            dotnet run --urls $urls --no-build
        } else {
            dotnet run --urls $urls
        }
    } -ArgumentList $projectPath, $appUrl, $buildFlag
    
    # Wait for app to start
    Start-Sleep 4
    
    # Verify application started successfully
    Write-Host "Verifying application startup..." -ForegroundColor Yellow
    try {
        $response = Invoke-WebRequest -Uri $appUrl -TimeoutSec 10 -UseBasicParsing -ErrorAction Stop
        Write-Host "Application is responding on $appUrl" -ForegroundColor Green
    } catch {
        Write-Warning "Application may still be starting up..."
    }
    
    # Start test suite
    Write-Host "Starting test suite on http://localhost:3000..." -ForegroundColor Green
    $testSuitePath = Join-Path $noorCanvasPath "Workspaces\Testing"
    
    if (Test-Path $testSuitePath) {
        Set-Location $testSuitePath
        Write-Host "Test suite found at: $testSuitePath" -ForegroundColor Gray
        
        # Kill any existing process on port 3000
        Write-Host "Clearing port 3000..." -ForegroundColor Yellow
        Get-Process | Where-Object { $_.ProcessName -match "python|node|http-server" } | ForEach-Object {
            try { 
                $connections = Get-NetTCPConnection -OwningProcess $_.Id -ErrorAction SilentlyContinue
                if ($connections | Where-Object LocalPort -eq 3000) {
                    Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
                }
            } catch { 
                # Ignore errors
            }
        }
        
        $testJob = Start-Job -ScriptBlock {
            param($testPath)
            Set-Location $testPath
            Write-Host "Starting test server from: $testPath"
            try {
                python -m http.server 3000
            } catch {
                try {
                    # Fallback to npx if python fails
                    npx --yes http-server . -p 3000 --cors
                } catch {
                    # Final fallback to Node.js built-in
                    node -e "const http=require('http'),fs=require('fs'),path=require('path');const server=http.createServer((req,res)=>{let filePath=path.join(__dirname,req.url==='/'?'index.html':req.url);fs.readFile(filePath,(err,data)=>{if(err){res.writeHead(404);res.end('404 Not Found');return;}const ext=path.extname(filePath);const contentType={'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json'}[ext]||'text/plain';res.writeHead(200,{'Content-Type':contentType,'Access-Control-Allow-Origin':'*'});res.end(data);});});server.listen(3000,()=>console.log('Test server running on http://localhost:3000'));"
                }
            }
        } -ArgumentList $testSuitePath
        
        # Wait for test suite to start and verify
        Write-Host "Waiting for test suite to start..." -ForegroundColor Yellow
        Start-Sleep 3
        
        # Verify test suite started
        try {
            $testResponse = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
            Write-Host "Test suite is responding on http://localhost:3000" -ForegroundColor Green
        } catch {
            Write-Warning "Test suite may still be starting up or failed to start..."
        }
        
        # Open both URLs in browser unless -NoBrowser specified
        if (-not $NoBrowser) {
            Write-Host "Opening application and test suite in browser..." -ForegroundColor Yellow
            Start-Sleep 1
            
            # Open application first
            Write-Host "   Opening NOOR Canvas application..." -ForegroundColor Gray
            Start-Process $appUrl
            
            Start-Sleep 1
            
            # Open test suite second
            Write-Host "   Opening Testing Suite..." -ForegroundColor Gray
            Start-Process "http://localhost:3000"
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
        Write-Host "Testing Suite:" -ForegroundColor Cyan  
        Write-Host "   URL: http://localhost:3000" -ForegroundColor White
        Write-Host "   Status: Static file server active" -ForegroundColor Green
        Write-Host ""
        Write-Host "Usage:" -ForegroundColor Yellow
        Write-Host "   * Test your changes in the main application" -ForegroundColor Gray
        Write-Host "   * Use the testing suite for component testing" -ForegroundColor Gray
        Write-Host "   * Both services are running simultaneously" -ForegroundColor Gray
        Write-Host ""
        Write-Host "Press Ctrl+C to stop both services" -ForegroundColor Red
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
