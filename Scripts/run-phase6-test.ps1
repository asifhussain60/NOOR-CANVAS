# Phase 6: localStorage Infrastructure - Test Orchestration Script
# 
# Purpose: Automated test execution for Phase 6 localStorage save/load implementation
# 
# This script:
# 1. Launches the NoorCanvas application (dotnet run)
# 2. Waits for application readiness (15 seconds)
# 3. Executes Playwright test suite (phase6-localstorage-infrastructure.spec.ts)
# 4. Captures browser console logs
# 5. Stops the application
# 6. Displays test results summary
#
# Debug Marker: [DEBUG-WORKITEM:userlanding:localStorage:infrastructure]
# Session 212: User Token KJAHA99L, Host Token PQ9N5YWW

param(
    [switch]$KeepAppRunning,
    [switch]$Headed
)

$ErrorActionPreference = "Stop"
$OriginalLocation = Get-Location

# Get script directory - handle both script and interactive execution
$ScriptRoot = if ($PSScriptRoot) { $PSScriptRoot } else { Split-Path -Parent -Path $MyInvocation.MyCommand.Definition }
if (-not $ScriptRoot) {
    $ScriptRoot = "d:\PROJECTS\NOOR CANVAS\Scripts"
}

try {
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "Phase 6: localStorage Infrastructure Test" -ForegroundColor Cyan
    Write-Host "========================================`n" -ForegroundColor Cyan

    # Navigate to application directory
    $appPath = Join-Path -Path $ScriptRoot -ChildPath ".." | Join-Path -ChildPath "SPA" | Join-Path -ChildPath "NoorCanvas"
    Write-Host "[INFO] Navigating to application directory: $appPath" -ForegroundColor Yellow
    Set-Location $appPath

    # Start the application in background
    Write-Host "[INFO] Starting NoorCanvas application..." -ForegroundColor Green
    $appJob = Start-Job -ScriptBlock {
        Set-Location $using:appPath
        dotnet run
    }

    Write-Host "[INFO] Waiting 15 seconds for application to start..." -ForegroundColor Yellow
    Start-Sleep -Seconds 15

    # Check if application is running
    try {
        $null = Invoke-WebRequest -Uri "http://localhost:9090" -Method Head -TimeoutSec 5 -UseBasicParsing
        Write-Host "[SUCCESS] Application is running and responsive" -ForegroundColor Green
    }
    catch {
        Write-Host "[ERROR] Application failed to start or is not responding" -ForegroundColor Red
        throw "Application startup failed"
    }

    # Navigate to Tests/UI directory
    $testPath = Join-Path -Path $ScriptRoot -ChildPath ".." | Join-Path -ChildPath "Tests" | Join-Path -ChildPath "UI"
    Write-Host "`n[INFO] Navigating to test directory: $testPath" -ForegroundColor Yellow
    Set-Location $testPath

    # Run Playwright tests
    Write-Host "`n[INFO] Running Playwright tests..." -ForegroundColor Green
    $testArgs = "playwright", "test", "phase6-localstorage-infrastructure.spec.ts"
    
    if ($Headed) {
        $testArgs += "--headed"
        Write-Host "   Running in headed mode (browser visible)" -ForegroundColor Cyan
    }
    
    Write-Host "   Command: npx $($testArgs -join ' ')" -ForegroundColor Cyan
    
    & npx @testArgs
    $testExitCode = $LASTEXITCODE

    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "Test Results Summary" -ForegroundColor Cyan
    Write-Host "========================================`n" -ForegroundColor Cyan

    if ($testExitCode -eq 0) {
        Write-Host "[SUCCESS] ALL TESTS PASSED" -ForegroundColor Green
        Write-Host "`nPhase 6 localStorage infrastructure is working correctly:" -ForegroundColor Green
        Write-Host "  [OK] Registration data saved to localStorage" -ForegroundColor Green
        Write-Host "  [OK] RegistrationStorageData model structure validated" -ForegroundColor Green
        Write-Host "  [OK] 2-day expiration (ExpiresAt) set correctly" -ForegroundColor Green
        Write-Host "  [OK] LastAccessedAt timestamp recorded" -ForegroundColor Green
        Write-Host "  [OK] Registration data loaded and form pre-populated" -ForegroundColor Green
        Write-Host "  [OK] Expired data auto-cleared from localStorage" -ForegroundColor Green
        Write-Host "`n[MILESTONE] Phase 6 COMPLETE - localStorage infrastructure implemented" -ForegroundColor Magenta
    }
    else {
        Write-Host "[ERROR] TESTS FAILED" -ForegroundColor Red
        Write-Host "`nPlease review the test output above for details." -ForegroundColor Yellow
        Write-Host "Common issues:" -ForegroundColor Yellow
        Write-Host "  - SaveRegistrationDataAsync not being called after registration" -ForegroundColor Yellow
        Write-Host "  - localStorage key missing or incorrect format" -ForegroundColor Yellow
        Write-Host "  - JSON structure missing required properties" -ForegroundColor Yellow
        Write-Host "  - ExpiresAt not set to 2 days in future" -ForegroundColor Yellow
        Write-Host "  - LoadRegistrationDataAsync not pre-populating form fields" -ForegroundColor Yellow
        Write-Host "  - Expired data not being cleared automatically" -ForegroundColor Yellow
        Write-Host "  - JavaScript errors during save/load operations" -ForegroundColor Yellow
        Write-Host "  - Session 212 not found in database (verify session exists)" -ForegroundColor Yellow
    }

    Write-Host "`n========================================" -ForegroundColor Cyan

}
catch {
    Write-Host "`n[ERROR] Test execution failed: $_" -ForegroundColor Red
    Write-Host $_.ScriptStackTrace -ForegroundColor Red
    exit 1
}
finally {
    # Stop the application (unless -KeepAppRunning is specified)
    if (-not $KeepAppRunning -and $appJob) {
        Write-Host "`n[INFO] Stopping application..." -ForegroundColor Yellow
        Stop-Job -Job $appJob -ErrorAction SilentlyContinue
        Remove-Job -Job $appJob -Force -ErrorAction SilentlyContinue
        Write-Host "[SUCCESS] Application stopped" -ForegroundColor Green
    }
    elseif ($KeepAppRunning) {
        Write-Host "`n[INFO] Application kept running (use -KeepAppRunning:$false to stop)" -ForegroundColor Cyan
        Write-Host "   To stop manually, use: Stop-Job -Name 'Job*'" -ForegroundColor Cyan
    }

    # Return to original location
    Set-Location $OriginalLocation
}

Write-Host "`nScript completed.`n" -ForegroundColor Cyan
