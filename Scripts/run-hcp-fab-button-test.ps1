<#
.SYNOPSIS
    Run Playwright tests for share button injection validation (hcp-fab-button)

.DESCRIPTION
    Orchestrates the execution of share button injection tests with proper app lifecycle:
    1. Cleans up existing processes
    2. Launches NoorCanvas with direct dotnet.exe (v3.0 pattern)
    3. Performs health checks with optimized backoff
    4. Runs Playwright tests
    5. Guaranteed cleanup via try/finally

    Tests verify:
    - Share buttons inject into correct container
    - Wrapper div structure (header + body)
    - Button IDs match pattern share-btn-{type}-{id}
    - No timing/race conditions
    - Toast notification on click
    - Proper styling and z-index layering

.PARAMETER SkipBuild
    Skip building the application before tests (use existing binaries)

.PARAMETER KeepAppRunning
    Keep application running after tests complete (for debugging)

.PARAMETER HeadedMode
    Run tests in headed mode (visible browser)

.EXAMPLE
    .\run-hcp-fab-button-test.ps1
    
    Build app, launch, run tests in headed mode, cleanup

.EXAMPLE
    .\run-hcp-fab-button-test.ps1 -SkipBuild -KeepAppRunning
    
    Skip build, keep app running for manual verification

.NOTES
    Author: GitHub Copilot
    Date: 2025-11-01
    Version: 1.0.0 (v3.0 orchestration pattern)
    Key: hcp-fab-button
    
    Requirements:
    - .NET 8.0 SDK
    - Playwright installed (npx playwright install)
    - Session 212 database with Ayah card assets
#>

[CmdletBinding()]
param(
    [switch]$SkipBuild,
    [switch]$KeepAppRunning,
    [switch]$Headless  # Use -Headless to run without visible browser
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

# Configuration
$AppUrl = "https://localhost:9091"
$Environment = "Development"
$TestFile = "Tests/UI/hcp-fab-button-injection-test.spec.ts"

Write-Host ""
Write-Host "===================================================================" -ForegroundColor Cyan
Write-Host "  Share Button Injection Test (hcp-fab-button)" -ForegroundColor Cyan
Write-Host "===================================================================" -ForegroundColor Cyan
Write-Host ""

# ============================================================================
# STEP 0: BUILD APPLICATION (OPTIONAL)
# ============================================================================

if (-not $SkipBuild) {
    Write-Host "[STEP 0] Building application..." -ForegroundColor Cyan
    
    Push-Location "SPA\NoorCanvas"
    try {
        dotnet build --configuration Debug --no-restore 2>&1 | Out-Null
        if ($LASTEXITCODE -ne 0) {
            throw "Build failed with exit code $LASTEXITCODE"
        }
        Write-Host "  Build successful" -ForegroundColor Green
    }
    catch {
        Write-Host "  Build failed: $_" -ForegroundColor Red
        Pop-Location
        exit 1
    }
    finally {
        Pop-Location
    }
    Write-Host ""
} else {
    Write-Host "[STEP 0] Skipping build (using existing binaries)" -ForegroundColor Yellow
    Write-Host ""
}

# ============================================================================
# STEP 1: LAUNCH APPLICATION (V3.0 - USES CANONICAL LAUNCHER)
# ============================================================================

Write-Host "[STEP 1] Launching NoorCanvas with v3.0 direct dotnet.exe..." -ForegroundColor Cyan

try {
    # Use canonical launcher (handles all complexity internally)
    $appInfo = & "$PSScriptRoot\Test-Framework\Start-NoorCanvasForTests.ps1" `
        -Url $AppUrl `
        -Environment $Environment `
        -Verbose:$VerbosePreference
    
    Write-Host "  App ready (PID: $($appInfo.ProcessId), Attempts: $($appInfo.HealthCheckAttempts))" -ForegroundColor Green
}
catch {
    Write-Host "  App launch failed: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# ============================================================================
# STEP 2: RUN TESTS (WITH GUARANTEED CLEANUP)
# ============================================================================

Write-Host "[STEP 2] Running Playwright tests..." -ForegroundColor Cyan
Write-Host "  Test File: $TestFile" -ForegroundColor Gray
Write-Host "  Mode: $(if ($Headless) { 'Headless' } else { 'Headed (visible browser)' })" -ForegroundColor Gray
Write-Host ""

$testExitCode = 0

try {
    Push-Location (Split-Path $PSScriptRoot -Parent)
    
    # Build test command
    $testArgs = @(
        "playwright",
        "test",
        $TestFile,
        "--config=config/testing/playwright.config.cjs",
        "--reporter=list"
    )
    
    if (-not $Headless) {
        $testArgs += "--headed"
    }
    
    Write-Host "  Command: npx $($testArgs -join ' ')" -ForegroundColor Gray
    Write-Host ""
    
    # Run tests
    & npx $testArgs
    $testExitCode = $LASTEXITCODE
    
    Write-Host ""
    if ($testExitCode -eq 0) {
        Write-Host "  Tests PASSED" -ForegroundColor Green
    }
    else {
        Write-Host "  Tests FAILED (exit code: $testExitCode)" -ForegroundColor Red
    }
}
catch {
    Write-Host "  Test execution error: $_" -ForegroundColor Red
    $testExitCode = 1
}
finally {
    # ========================================================================
    # CLEANUP (ALWAYS RUNS - EVEN ON ERROR)
    # ========================================================================
    
    Pop-Location
    
    Write-Host ""
    Write-Host "[CLEANUP] Stopping application..." -ForegroundColor Cyan
    
    if (-not $KeepAppRunning) {
        try {
            # Use ProcessId from $appInfo (returned by Start-NoorCanvasForTests.ps1)
            Stop-Process -Id $appInfo.ProcessId -Force -ErrorAction Stop
            Write-Host "  App stopped (PID: $($appInfo.ProcessId))" -ForegroundColor Green
        }
        catch {
            Write-Host "  Failed to stop app (may have already exited)" -ForegroundColor Yellow
        }
    }
    else {
        Write-Host "  App left running for manual verification" -ForegroundColor Yellow
        Write-Host "  URL: $($appInfo.Url)" -ForegroundColor Cyan
        Write-Host "  PID: $($appInfo.ProcessId)" -ForegroundColor Cyan
        Write-Host "  To stop: Stop-Process -Id $($appInfo.ProcessId) -Force" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "===================================================================" -ForegroundColor Cyan
Write-Host "  Test orchestration complete (v3.0)" -ForegroundColor Cyan
Write-Host "===================================================================" -ForegroundColor Cyan
Write-Host ""

if ($testExitCode -eq 0) {
    Write-Host "Result: ALL TESTS PASSED" -ForegroundColor Green
} else {
    Write-Host "Result: TESTS FAILED" -ForegroundColor Red
}

Write-Host ""

exit $testExitCode
