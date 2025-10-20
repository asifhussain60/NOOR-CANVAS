# Phase 2: SessionCanvas Registration Guard - Test Orchestration Script
# 
# Purpose: Automated test execution for Phase 2 registration guard implementation
# 
# This script:
# 1. Launches the NoorCanvas application (dotnet run)
# 2. Waits for application readiness (15 seconds)
# 3. Executes Playwright test suite (phase2-session-canvas-guard.spec.ts)
# 4. Captures browser console logs
# 5. Stops the application
# 6. Displays test results summary
#
# Debug Marker: [DEBUG-WORKITEM:userlanding:guard:canvas]
# Session 212: User Token KJAHA99L

param(
    [switch]$KeepAppRunning,
    [switch]$Headed
)

$ErrorActionPreference = "Stop"
$OriginalLocation = Get-Location

try {
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "Phase 2: SessionCanvas Registration Guard Test" -ForegroundColor Cyan
    Write-Host "========================================`n" -ForegroundColor Cyan

    # Navigate to application directory
    $appPath = Join-Path $PSScriptRoot ".." "SPA" "NoorCanvas"
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
    $testPath = Join-Path $PSScriptRoot ".." "Tests" "UI"
    Write-Host "`n[INFO] Navigating to test directory: $testPath" -ForegroundColor Yellow
    Set-Location $testPath

    # Run Playwright tests
    Write-Host "`n[INFO] Running Playwright tests..." -ForegroundColor Green
    $testArgs = "playwright", "test", "phase2-session-canvas-guard.spec.ts"
    
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
        Write-Host "`nPhase 2 registration guard is working correctly:" -ForegroundColor Green
        Write-Host "  [OK] Unregistered users redirected to UserLanding" -ForegroundColor Green
        Write-Host "  [OK] Security logs present in browser console" -ForegroundColor Green
        Write-Host "  [OK] Bypass flag mechanism working" -ForegroundColor Green
        Write-Host "  [OK] No JavaScript errors detected" -ForegroundColor Green
    }
    else {
        Write-Host "[ERROR] TESTS FAILED" -ForegroundColor Red
        Write-Host "`nPlease review the test output above for details." -ForegroundColor Yellow
        Write-Host "Common issues:" -ForegroundColor Yellow
        Write-Host "  - Registration guard not redirecting unregistered users" -ForegroundColor Yellow
        Write-Host "  - Missing debug log markers in console" -ForegroundColor Yellow
        Write-Host "  - Bypass flag not being set/cleared properly" -ForegroundColor Yellow
        Write-Host "  - JavaScript errors in browser" -ForegroundColor Yellow
    }

    # Display job output (application logs)
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "Application Logs (Last 20 lines)" -ForegroundColor Cyan
    Write-Host "========================================`n" -ForegroundColor Cyan
    
    $jobOutput = Receive-Job -Job $appJob -Keep
    if ($jobOutput) {
        $jobOutput | Select-Object -Last 20 | ForEach-Object { Write-Host $_ }
    }
    else {
        Write-Host "(No application logs captured)" -ForegroundColor Gray
    }

}
finally {
    if (-not $KeepAppRunning) {
        Write-Host "`n[INFO] Stopping application..." -ForegroundColor Yellow
        if ($appJob) {
            Stop-Job -Job $appJob -ErrorAction SilentlyContinue
            Remove-Job -Job $appJob -Force -ErrorAction SilentlyContinue
        }
        Write-Host "[SUCCESS] Application stopped" -ForegroundColor Green
    }
    else {
        Write-Host "`n[WARN] Application kept running (use -KeepAppRunning flag)" -ForegroundColor Yellow
        Write-Host "   Job ID: $($appJob.Id)" -ForegroundColor Cyan
        Write-Host "   Stop manually with: Stop-Job -Id $($appJob.Id); Remove-Job -Id $($appJob.Id)" -ForegroundColor Cyan
    }

    # Return to original location
    Set-Location $OriginalLocation
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Test Execution Complete" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

exit $testExitCode
