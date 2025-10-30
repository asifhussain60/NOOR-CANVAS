#!/usr/bin/env pwsh
#Requires -Version 7.0

<#
.SYNOPSIS
    Run Timer Integration Tests for HostControlPanel Phase 1 Refactor
.DESCRIPTION
    Test-First Development Script:
    1. Runs tests (will FAIL initially)
    2. After refactoring, run again to verify PASSING
.PARAMETER Headed
    Run tests in headed mode (visible browser)
.PARAMETER Debug
    Enable verbose logging
.EXAMPLE
    .\run-hcp-timer-test.ps1
    Run tests in headless mode
.EXAMPLE
    .\run-hcp-timer-test.ps1 -Headed
    Run tests with visible browser
#>

param(
    [switch]$Headed = $false,
    [switch]$Debug = $false
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

# -----------------------------------------------------------------------------
# CONFIGURATION
# -----------------------------------------------------------------------------
$APP_PATH = "D:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas"
$TEST_SPEC = "D:\PROJECTS\NOOR CANVAS\.github\key-data-streams\hcp-refactor-phase1\tests\hcp-timer-integration.spec.ts"
$APP_URL = "https://localhost:9091"
$MAX_RETRIES = 3
$STARTUP_TIMEOUT = 30

# -----------------------------------------------------------------------------
# COLORS
# -----------------------------------------------------------------------------
function Write-Success { param([string]$Message) Write-Host "✅ $Message" -ForegroundColor Green }
function Write-Info { param([string]$Message) Write-Host "ℹ️  $Message" -ForegroundColor Cyan }
function Write-Warning { param([string]$Message) Write-Host "⚠️  $Message" -ForegroundColor Yellow }
function Write-Error { param([string]$Message) Write-Host "❌ $Message" -ForegroundColor Red }
function Write-Header { param([string]$Message) Write-Host "`n═══ $Message ═══`n" -ForegroundColor Magenta }

# -----------------------------------------------------------------------------
# FUNCTIONS
# -----------------------------------------------------------------------------

function Test-AppRunning {
    try {
        $response = Invoke-WebRequest -Uri $APP_URL -Method Head -SkipCertificateCheck -TimeoutSec 5 -ErrorAction Stop
        return $response.StatusCode -eq 200
    }
    catch {
        return $false
    }
}

function Start-App {
    Write-Header "STARTING APPLICATION"
    
    if (Test-AppRunning) {
        Write-Success "App already running at $APP_URL"
        return $true
    }
    
    Write-Info "Starting NoorCanvas app in background..."
    Push-Location $APP_PATH
    
    try {
        # Start app in background job
        $job = Start-Job -ScriptBlock {
            param($appPath)
            Set-Location $appPath
            dotnet run --launch-profile https
        } -ArgumentList $APP_PATH
        
        Write-Info "App started in Job ID: $($job.Id)"
        
        # Wait for app to be ready
        Write-Info "Waiting for app to be ready (timeout: ${STARTUP_TIMEOUT}s)..."
        $elapsed = 0
        while (-not (Test-AppRunning) -and $elapsed -lt $STARTUP_TIMEOUT) {
            Start-Sleep -Seconds 2
            $elapsed += 2
            Write-Host "." -NoNewline
        }
        Write-Host ""
        
        if (Test-AppRunning) {
            Write-Success "App is ready at $APP_URL"
            return $true
        }
        else {
            Write-Error "App failed to start within ${STARTUP_TIMEOUT}s"
            Stop-Job -Job $job -ErrorAction SilentlyContinue
            Remove-Job -Job $job -Force -ErrorAction SilentlyContinue
            return $false
        }
    }
    finally {
        Pop-Location
    }
}

function Stop-App {
    Write-Header "STOPPING APPLICATION"
    
    # Stop all dotnet run jobs
    Get-Job | Where-Object { $_.Command -like "*dotnet run*" } | ForEach-Object {
        Write-Info "Stopping Job ID: $($_.Id)"
        Stop-Job -Job $_ -ErrorAction SilentlyContinue
        Remove-Job -Job $_ -Force -ErrorAction SilentlyContinue
    }
    
    # Kill any remaining dotnet processes on port 9091
    $processes = Get-NetTCPConnection -LocalPort 9091 -ErrorAction SilentlyContinue | 
        Select-Object -ExpandProperty OwningProcess -Unique
    
    if ($processes) {
        foreach ($pid in $processes) {
            Write-Info "Killing process PID: $pid"
            Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
        }
    }
    
    Write-Success "App cleanup complete"
}

function Run-Tests {
    param([int]$Attempt = 1)
    
    Write-Header "RUNNING TIMER INTEGRATION TESTS (Attempt $Attempt/$MAX_RETRIES)"
    
    # Build Playwright command
    $playwrightArgs = @(
        "test",
        $TEST_SPEC
    )
    
    if ($Headed) {
        $playwrightArgs += "--headed"
        Write-Info "Running in HEADED mode (visible browser)"
    }
    else {
        Write-Info "Running in HEADLESS mode"
    }
    
    if ($Debug) {
        $playwrightArgs += "--debug"
    }
    
    Write-Info "Test Spec: $TEST_SPEC"
    Write-Info "Command: npx playwright $($playwrightArgs -join ' ')"
    
    # Run tests
    Push-Location "D:\PROJECTS\NOOR CANVAS\PlayWright"
    try {
        npx playwright @playwrightArgs
        $exitCode = $LASTEXITCODE
        
        if ($exitCode -eq 0) {
            Write-Success "All tests PASSED! ✨"
            return $true
        }
        else {
            Write-Warning "Tests FAILED with exit code: $exitCode"
            return $false
        }
    }
    finally {
        Pop-Location
    }
}

# -----------------------------------------------------------------------------
# MAIN EXECUTION
# -----------------------------------------------------------------------------

Write-Header "HCP TIMER INTEGRATION TEST RUNNER"
Write-Info "Test-First Development: Phase 1 - Service Extraction"
Write-Info "Expected: Tests will FAIL before refactoring"
Write-Info "Goal: Make tests PASS after integrating TimerStateService"

# Ensure app is stopped before starting
Stop-App | Out-Null
Start-Sleep -Seconds 2

$testsPassed = $false
$attempt = 1

while (-not $testsPassed -and $attempt -le $MAX_RETRIES) {
    try {
        # Start app
        if (-not (Start-App)) {
            Write-Error "Failed to start app, aborting test run"
            exit 1
        }
        
        # Run tests
        $testsPassed = Run-Tests -Attempt $attempt
        
        if (-not $testsPassed) {
            if ($attempt -lt $MAX_RETRIES) {
                Write-Warning "Retrying in 5 seconds..."
                Start-Sleep -Seconds 5
            }
            $attempt++
        }
    }
    finally {
        # Always stop app after test run
        Stop-App | Out-Null
    }
}

# -----------------------------------------------------------------------------
# SUMMARY
# -----------------------------------------------------------------------------

Write-Header "TEST SUMMARY"

if ($testsPassed) {
    Write-Success "✨ ALL TIMER TESTS PASSED!"
    Write-Info "TimerStateService integration is complete and verified."
    exit 0
}
else {
    Write-Error "⚠️ TIMER TESTS FAILED"
    Write-Info "This is EXPECTED before refactoring."
    Write-Info ""
    Write-Info "Next Steps:"
    Write-Info "1. Refactor HostControlPanel to use TimerStateService"
    Write-Info "2. Update StartSession() to call TimerState.Start()"
    Write-Info "3. Use TimerState.ElapsedFormatted for display"
    Write-Info "4. Re-run this script to verify tests pass"
    exit 1
}
