#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Run Canvas Rendering Visual Regression Tests (Percy + Playwright)

.DESCRIPTION
    Executes Percy visual regression tests for TranscriptCanvas and SessionCanvas rendering.
    Compares current rendering against expected baseline screenshots.

.PARAMETER KeepAppRunning
    If specified, leaves the app running after tests complete for manual verification.

.PARAMETER HeadedMode
    If specified, runs tests in headed mode (visible browser).

.EXAMPLE
    # Run tests with app cleanup
    .\run-canvas-rendering-percy-tests.ps1

.EXAMPLE
    # Run tests and keep app running
    .\run-canvas-rendering-percy-tests.ps1 -KeepAppRunning

.EXAMPLE
    # Run tests in headed mode
    .\run-canvas-rendering-percy-tests.ps1 -HeadedMode
#>

param(
    [switch]$KeepAppRunning,
    [switch]$HeadedMode
)

$ErrorActionPreference = "Stop"
$ProjectRoot = "D:\PROJECTS\NOOR CANVAS"
$TestFile = ".github\prompts.keys\transcript-canvas\tests\canvas-rendering-visual.spec.ts"

Write-Host "[INFO] =====================================================================" -ForegroundColor Cyan
Write-Host "[INFO] Canvas Rendering Visual Regression Tests (Percy)" -ForegroundColor Cyan
Write-Host "[INFO] =====================================================================" -ForegroundColor Cyan
Write-Host ""

# Verify Percy token
if (-not $env:PERCY_TOKEN) {
    Write-Host "[ERROR] PERCY_TOKEN environment variable not set" -ForegroundColor Red
    Write-Host "[INFO] Get token from: https://percy.io/settings" -ForegroundColor Yellow
    exit 1
}

# Change to project root
Set-Location $ProjectRoot

# Verify test file exists
if (-not (Test-Path $TestFile)) {
    Write-Host "[ERROR] Test file not found: $TestFile" -ForegroundColor Red
    exit 1
}

Write-Host "[INFO] Test File: $TestFile" -ForegroundColor Cyan
Write-Host "[INFO] Headed Mode: $($HeadedMode.IsPresent)" -ForegroundColor Cyan
Write-Host "[INFO] Keep App Running: $($KeepAppRunning.IsPresent)" -ForegroundColor Cyan
Write-Host ""

# Step 1: Launch application in separate window
Write-Host "[STEP 1/5] Launching NoorCanvas application..." -ForegroundColor Yellow

$AppArgs = @(
    "-NoExit",
    "-Command",
    "cd 'D:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas'; `$env:ASPNETCORE_URLS='https://localhost:9091'; dotnet run"
)

$AppProcess = Start-Process powershell -ArgumentList $AppArgs -WindowStyle Normal -PassThru
Write-Host "[OK] Application launched in separate window (PID: $($AppProcess.Id))" -ForegroundColor Green

# Step 2: Wait for application startup
Write-Host "[STEP 2/5] Waiting for application to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 20

# Verify app is listening
$listening = netstat -ano | findstr "LISTENING" | findstr ":9091"
if ($listening) {
    Write-Host "[OK] Application is listening on port 9091" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Application failed to start on port 9091" -ForegroundColor Red
    Stop-Process -Id $AppProcess.Id -Force -ErrorAction SilentlyContinue
    exit 1
}

# Step 3: Run Percy tests
Write-Host "[STEP 3/5] Running Percy visual regression tests..." -ForegroundColor Yellow
Write-Host ""

try {
    $percyArgs = @(
        "exec",
        "--",
        "npx",
        "playwright",
        "test",
        $TestFile,
        "--config=config/testing/playwright.config.cjs"
    )

    if ($HeadedMode) {
        $percyArgs += "--headed"
    }

    $percyArgs += "--reporter=list"

    & npx percy $percyArgs

    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "[PASS] All tests passed!" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "[WARN] Some tests failed. Check output above." -ForegroundColor Yellow
    }
} catch {
    Write-Host "[ERROR] Test execution failed: $_" -ForegroundColor Red
    $TestsFailed = $true
}

# Step 4: Display results
Write-Host ""
Write-Host "[STEP 4/5] Test Results" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Cyan
Write-Host "Percy Dashboard: https://percy.io/NOOR-CANVAS/noor-canvas" -ForegroundColor Cyan
Write-Host "View visual diffs and approve/reject snapshots" -ForegroundColor Cyan
Write-Host ""

# Step 5: Cleanup
if ($KeepAppRunning) {
    Write-Host "[STEP 5/5] App Cleanup: SKIPPED (KeepAppRunning=true)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "[INFO] Application is still running on https://localhost:9091" -ForegroundColor Cyan
    Write-Host "[INFO] To stop manually: Stop-Process -Id $($AppProcess.Id) -Force" -ForegroundColor Cyan
} else {
    Write-Host "[STEP 5/5] Cleaning up application..." -ForegroundColor Yellow
    
    # Kill by port (more reliable)
    $portProcess = netstat -ano | findstr ":9091" | findstr "LISTENING"
    if ($portProcess -match '\s+(\d+)$') {
        $processId = $matches[1]
        Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
        Write-Host "[OK] Killed process on port 9091 (PID: $processId)" -ForegroundColor Green
    } else {
        Write-Host "[WARN] Could not find process on port 9091" -ForegroundColor Yellow
    }
    
    # Fallback: kill by PID
    Stop-Process -Id $AppProcess.Id -Force -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "[INFO] =====================================================================" -ForegroundColor Cyan
Write-Host "[INFO] Test execution complete" -ForegroundColor Cyan
Write-Host "[INFO] =====================================================================" -ForegroundColor Cyan

if ($TestsFailed) {
    exit 1
}

exit 0
