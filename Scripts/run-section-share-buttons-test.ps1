<#
.SYNOPSIS
    Launches NOOR Canvas application and runs section share buttons functionality tests.

.DESCRIPTION
    This script orchestrates the testing of H2 section share button injection:
    1. Launches application in dedicated PowerShell window
    2. Waits for application to be ready (health check)
    3. Runs Playwright tests with headed browser
    4. Cleans up application process after tests complete
    
    Tests cover:
    - H2 section detection in transcript
    - Share button injection after OnAfterRenderAsync
    - Button positioning (above H2 elements)
    - Click handling and SignalR broadcasting
    
.PARAMETER SkipBuild
    Skip building the application before launching (use if already built).

.PARAMETER KeepAppRunning
    Keep application running after tests complete (for debugging).

.PARAMETER HeadlessTests
    Run Playwright tests in headless mode (default is headed for visual verification).

.EXAMPLE
    .\run-section-share-buttons-test.ps1
    
    Builds and launches app, runs section share button tests in headed mode.

.EXAMPLE
    .\run-section-share-buttons-test.ps1 -SkipBuild -KeepAppRunning
    
    Skips build, keeps app running after tests for manual verification.

.NOTES
    Author: GitHub Copilot
    Date: 2025-10-18
    Version: 1.0.0
    Task: hcptcanvas - H2 section share button injection
#>

[CmdletBinding()]
param(
    [switch]$SkipBuild,
    [switch]$KeepAppRunning,
    [switch]$HeadlessTests
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

# Configuration
$AppProjectPath = "SPA\NoorCanvas"
$AppUrl = "https://localhost:9091"
$HealthCheckEndpoint = "$AppUrl/health"
$MaxHealthCheckAttempts = 30
$HealthCheckIntervalSeconds = 2
$TestPattern = "Tests/UI/test-section-share-buttons.spec.ts"

Write-Host ""
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host "  NOOR Canvas - Section Share Buttons Test Runner" -ForegroundColor Cyan
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host ""

# Function: Check if application is running
function Test-AppRunning {
    try {
        # Try to establish TCP connection to port 9091
        $tcpClient = New-Object System.Net.Sockets.TcpClient
        $connect = $tcpClient.ConnectAsync("localhost", 9091)
        $wait = $connect.Wait(1000)
        
        if ($wait -and $tcpClient.Connected) {
            $tcpClient.Close()
            return $true
        }
        
        $tcpClient.Close()
        return $false
    }
    catch {
        return $false
    }
}

# Function: Kill existing app processes
function Stop-ExistingApp {
    Write-Host "[CLEANUP] Checking for existing NoorCanvas processes..." -ForegroundColor Yellow
    
    $processes = Get-Process -Name "NoorCanvas" -ErrorAction SilentlyContinue
    if ($processes) {
        Write-Host "  ⚠️ Found $($processes.Count) existing NoorCanvas process(es)" -ForegroundColor Yellow
        foreach ($proc in $processes) {
            Write-Host "  🛑 Stopping process ID: $($proc.Id)" -ForegroundColor Yellow
            Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
        }
        Start-Sleep -Seconds 2
        Write-Host "  ✅ Cleanup complete" -ForegroundColor Green
    }
    else {
        Write-Host "  ✅ No existing processes found" -ForegroundColor Green
    }
}

# Step 1: Build application (unless skipped)
if (-not $SkipBuild) {
    Write-Host "[STEP 1/5] Building application..." -ForegroundColor Cyan
    Write-Host "  Project: $AppProjectPath" -ForegroundColor Gray
    
    Push-Location $AppProjectPath
    try {
        $buildOutput = dotnet build --configuration Debug 2>&1
        $buildExitCode = $LASTEXITCODE
        
        if ($buildExitCode -ne 0) {
            Write-Host ""
            Write-Host "❌ BUILD FAILED!" -ForegroundColor Red
            Write-Host ""
            Write-Host "Build output:" -ForegroundColor Yellow
            $buildOutput | Write-Host
            exit 1
        }
        
        Write-Host "  ✅ Build successful" -ForegroundColor Green
    }
    finally {
        Pop-Location
    }
}
else {
    Write-Host "[STEP 1/5] Skipping build (using existing binaries)" -ForegroundColor Cyan
}

Write-Host ""

# Step 2: Cleanup existing processes
Write-Host "[STEP 2/5] Cleanup" -ForegroundColor Cyan
Stop-ExistingApp
Write-Host ""

# Step 3: Launch application in separate window
Write-Host "[STEP 3/5] Launching application..." -ForegroundColor Cyan
Write-Host "  URL: $AppUrl" -ForegroundColor Gray
Write-Host "  Mode: Separate PowerShell window" -ForegroundColor Gray

$appProcess = Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd '$AppProjectPath'; dotnet run --no-build"
) -PassThru -WindowStyle Normal

if (-not $appProcess) {
    Write-Host "❌ Failed to launch application process!" -ForegroundColor Red
    exit 1
}

Write-Host "  ✅ Application launched (PID: $($appProcess.Id))" -ForegroundColor Green
Write-Host "  💡 Watch separate window for application logs" -ForegroundColor Gray
Write-Host ""

# Step 4: Wait for application to be ready
Write-Host "[STEP 4/5] Waiting for application to be ready..." -ForegroundColor Cyan
Write-Host "  Health check: $HealthCheckEndpoint" -ForegroundColor Gray
Write-Host "  Max attempts: $MaxHealthCheckAttempts (every ${HealthCheckIntervalSeconds}s)" -ForegroundColor Gray
Write-Host ""

$attempt = 0
$isReady = $false

while ($attempt -lt $MaxHealthCheckAttempts -and -not $isReady) {
    $attempt++
    Write-Host "  Attempt $attempt/$MaxHealthCheckAttempts..." -NoNewline
    
    $isReady = Test-AppRunning
    
    if ($isReady) {
        Write-Host " ✅ READY" -ForegroundColor Green
    }
    else {
        Write-Host " ⏳ Waiting..." -ForegroundColor Yellow
        Start-Sleep -Seconds $HealthCheckIntervalSeconds
    }
}

if (-not $isReady) {
    Write-Host ""
    Write-Host "❌ Application failed to start within timeout!" -ForegroundColor Red
    Write-Host "  Check application window for errors" -ForegroundColor Yellow
    
    if (-not $KeepAppRunning) {
        Write-Host "  Cleaning up process..." -ForegroundColor Yellow
        Stop-Process -Id $appProcess.Id -Force -ErrorAction SilentlyContinue
    }
    
    exit 1
}

Write-Host ""
Write-Host "  ✅ Application is ready!" -ForegroundColor Green
Write-Host ""

# Step 5: Run Playwright tests
Write-Host "[STEP 5/5] Running Playwright tests..." -ForegroundColor Cyan
Write-Host "  Test: $TestPattern" -ForegroundColor Gray
$testMode = if ($HeadlessTests) { "Headless" } else { "Headed" }
Write-Host "  Mode: $testMode" -ForegroundColor Gray
Write-Host ""

Push-Location "Tests\UI"
try {
    $playwrightArgs = @(
        "playwright",
        "test",
        $TestPattern
    )
    
    if (-not $HeadlessTests) {
        $playwrightArgs += "--headed"
    }
    
    Write-Host "  Command: npx $($playwrightArgs -join ' ')" -ForegroundColor Gray
    Write-Host ""
    Write-Host "─────────────────────────────────────────────────────────────────────" -ForegroundColor DarkGray
    
    & npx @playwrightArgs
    $testExitCode = $LASTEXITCODE
    
    Write-Host "─────────────────────────────────────────────────────────────────────" -ForegroundColor DarkGray
    Write-Host ""
    
    if ($testExitCode -eq 0) {
        Write-Host "  ✅ All tests PASSED!" -ForegroundColor Green
    }
    else {
        Write-Host "  ❌ Tests FAILED (exit code: $testExitCode)" -ForegroundColor Red
    }
}
finally {
    Pop-Location
}

Write-Host ""

# Step 6: Cleanup
if ($KeepAppRunning) {
    Write-Host "[CLEANUP] Keeping application running (--KeepAppRunning)" -ForegroundColor Cyan
    Write-Host "  Application PID: $($appProcess.Id)" -ForegroundColor Yellow
    Write-Host "  Application URL: $AppUrl" -ForegroundColor Yellow
    Write-Host "  To stop manually: Stop-Process -Id $($appProcess.Id)" -ForegroundColor Gray
}
else {
    Write-Host "[CLEANUP] Stopping application..." -ForegroundColor Cyan
    
    try {
        Stop-Process -Id $appProcess.Id -Force -ErrorAction SilentlyContinue
        Write-Host "  ✅ Application stopped" -ForegroundColor Green
    }
    catch {
        Write-Host "  ⚠️ Could not stop process (may have already exited)" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host "  Test run complete!" -ForegroundColor Cyan
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host ""

exit $testExitCode
