#Requires -Version 5.1
<#
.SYNOPSIS
    Runs the comprehensive participant registration flow test with Percy visual regression

.DESCRIPTION
    This script orchestrates the complete participant flow test:
    1. Kills existing dotnet/node processes
    2. Starts the NoorCanvas application in a separate window
    3. Waits for the application to be ready
    4. Runs the Playwright test with Percy visual regression
    5. Stops the application
    6. Reports test results

.PARAMETER KeepAppRunning
    If specified, keeps the application running after tests complete

.PARAMETER SkipPercy
    If specified, runs tests without Percy visual regression

.EXAMPLE
    .\run-participant-flow-test.ps1
    
.EXAMPLE
    .\run-participant-flow-test.ps1 -KeepAppRunning
#>

param(
    [switch]$KeepAppRunning,
    [switch]$SkipPercy
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

# Configuration
$APP_URL = "https://localhost:9091"
$APP_DIR = "D:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas"
$TEST_DIR = "D:\PROJECTS\NOOR CANVAS\Tests\UI"
$TEST_FILE = "participant-registration-flow-complete.spec.ts"
$MAX_WAIT_SECONDS = 60

Write-Host "`n╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  Participant Registration Flow Test - Complete Journey        ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

#region Helper Functions
function Write-Step {
    param([string]$Message)
    Write-Host "`n▶ $Message" -ForegroundColor Yellow
}

function Write-Success {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor Green
}

function Write-ErrorMessage {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor Red
}

function Test-AppReady {
    param([string]$Url, [int]$MaxAttempts = 30)
    
    for ($i = 1; $i -le $MaxAttempts; $i++) {
        try {
            $response = Invoke-WebRequest -Uri $Url -Method Head -UseBasicParsing -TimeoutSec 2 `
                -SkipCertificateCheck -ErrorAction SilentlyContinue
            if ($response.StatusCode -eq 200) {
                return $true
            }
        }
        catch {
            # App not ready yet
        }
        Write-Host "." -NoNewline
        Start-Sleep -Seconds 2
    }
    return $false
}

function Stop-ProcessesSafely {
    param([string]$ProcessName)
    
    $processes = Get-Process -Name $ProcessName -ErrorAction SilentlyContinue
    if ($processes) {
        Write-Host "Stopping $($processes.Count) $ProcessName process(es)..."
        $processes | Stop-Process -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
    }
}
#endregion

try {
    #region Cleanup Existing Processes
    Write-Step "Cleaning up existing processes..."
    Stop-ProcessesSafely -ProcessName "dotnet"
    Stop-ProcessesSafely -ProcessName "node"
    Stop-ProcessesSafely -ProcessName "pwsh"
    Write-Success "Process cleanup complete"
    #endregion

    #region Start Application
    Write-Step "Starting NoorCanvas application..."
    
    $appJob = Start-Job -ScriptBlock {
        param($AppDir)
        Set-Location $AppDir
        dotnet run
    } -ArgumentList $APP_DIR
    
    Write-Host "Application started (Job ID: $($appJob.Id))" -ForegroundColor Gray
    Write-Success "Application job created"
    #endregion

    #region Wait for Application
    Write-Step "Waiting for application to be ready at $APP_URL..."
    Write-Host "This may take up to $MAX_WAIT_SECONDS seconds" -ForegroundColor Gray
    
    $isReady = Test-AppReady -Url $APP_URL -MaxAttempts 30
    
    if (-not $isReady) {
        throw "Application failed to start within $MAX_WAIT_SECONDS seconds"
    }
    
    Write-Host ""
    Write-Success "Application is ready and responding"
    Start-Sleep -Seconds 3  # Give it a few more seconds to fully initialize
    #endregion

    #region Run Playwright Test
    Write-Step "Running Playwright test..."
    
    Push-Location $TEST_DIR
    
    try {
        $env:BASE_URL = $APP_URL
        
        if ($SkipPercy) {
            Write-Host "Running without Percy (standard Playwright test)" -ForegroundColor Gray
            $testCommand = "npx playwright test $TEST_FILE --headed"
        }
        else {
            Write-Host "Running with Percy visual regression" -ForegroundColor Gray
            $testCommand = "npx percy exec -- playwright test $TEST_FILE --headed"
        }
        
        Write-Host "Command: $testCommand" -ForegroundColor Gray
        Write-Host ""
        
        Invoke-Expression $testCommand
        $testExitCode = $LASTEXITCODE
        
        if ($testExitCode -eq 0) {
            Write-Success "All tests passed!"
        }
        else {
            Write-ErrorMessage "Tests failed with exit code: $testExitCode"
        }
    }
    finally {
        Pop-Location
    }
    #endregion

    #region Stop Application
    if (-not $KeepAppRunning) {
        Write-Step "Stopping application..."
        
        if ($appJob) {
            Stop-Job -Job $appJob -ErrorAction SilentlyContinue
            Remove-Job -Job $appJob -Force -ErrorAction SilentlyContinue
        }
        
        Stop-ProcessesSafely -ProcessName "dotnet"
        Write-Success "Application stopped"
    }
    else {
        Write-Host "`n⚠ Application left running (Job ID: $($appJob.Id))" -ForegroundColor Yellow
        Write-Host "To stop manually: Stop-Job -Id $($appJob.Id); Remove-Job -Id $($appJob.Id) -Force" -ForegroundColor Gray
    }
    #endregion

    #region Summary
    Write-Host "`n╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║                     Test Execution Complete                    ║" -ForegroundColor Cyan
    Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
    
    Write-Host "`nTest Results:" -ForegroundColor White
    Write-Host "  • Exit Code: $testExitCode" -ForegroundColor Gray
    Write-Host "  • Test File: $TEST_FILE" -ForegroundColor Gray
    
    if (-not $SkipPercy) {
        Write-Host "  • Percy Snapshots: Uploaded (check Percy dashboard)" -ForegroundColor Gray
    }
    
    Write-Host "`nTest Coverage:" -ForegroundColor White
    Write-Host "  ✓ UserLanding registration flow" -ForegroundColor Green
    Write-Host "  ✓ Join Waiting Room navigation with bypass flag" -ForegroundColor Green
    Write-Host "  ✓ SessionWaiting page access" -ForegroundColor Green
    Write-Host "  ✓ SessionCanvas navigation with bypass flag" -ForegroundColor Green
    Write-Host "  ✓ TranscriptCanvas navigation with bypass flag" -ForegroundColor Green
    Write-Host "  ✓ Security guards (unregistered access blocked)" -ForegroundColor Green
    Write-Host "  ✓ Browser console error tracking" -ForegroundColor Green
    
    if ($testExitCode -ne 0) {
        Write-Host "`n⚠ Some tests failed. Check the output above for details." -ForegroundColor Yellow
        exit $testExitCode
    }
    
    Write-Host "`n✓ All tests passed successfully!" -ForegroundColor Green
    #endregion
}
catch {
    Write-ErrorMessage "Test execution failed: $_"
    
    # Cleanup on error
    if ($appJob) {
        Stop-Job -Job $appJob -ErrorAction SilentlyContinue
        Remove-Job -Job $appJob -Force -ErrorAction SilentlyContinue
    }
    
    Stop-ProcessesSafely -ProcessName "dotnet"
    
    exit 1
}
finally {
    $ProgressPreference = "Continue"
}
