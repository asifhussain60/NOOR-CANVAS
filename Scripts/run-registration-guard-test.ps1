# Phase 11: Registration Guard Enforcement - E2E Test Suite Orchestration Script
# 
# Purpose: Automated test execution for complete registration guard and localStorage suite
# 
# This script:
# 1. Launches the NoorCanvas application (dotnet run)
# 2. Waits for application readiness (15 seconds)
# 3. Executes comprehensive Playwright test suite (registration-guard-enforcement.spec.ts)
# 4. Captures browser console logs
# 5. Stops the application
# 6. Displays detailed test results summary
#
# Test Scenarios:
# - Scenario 1: Unregistered user redirect from SessionWaiting
# - Scenario 2: Unregistered user redirect from SessionCanvas
# - Scenario 3: Unregistered user redirect from TranscriptCanvas
# - Scenario 4: Registered user access with bypass flag
# - Scenario 5: Ended session redirect
# - Scenario 6: localStorage save and auto-load
# - Scenario 7: localStorage expiration
# - Scenario 8: Token isolation
# - Scenario 9: Debug panel clear localStorage
#
# Debug Markers: [DEBUG-WORKITEM:userlanding:*]
# Session 212: User Token KJAHA99L, Host Token PQ9N5YWW

param(
    [switch]$KeepAppRunning,
    [switch]$Headed,
    [switch]$Debug
)

$ErrorActionPreference = "Stop"
$OriginalLocation = Get-Location

try {
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "Phase 11: Registration Guard Enforcement" -ForegroundColor Cyan
    Write-Host "E2E Test Suite - Comprehensive Validation" -ForegroundColor Cyan
    Write-Host "========================================`n" -ForegroundColor Cyan

    Write-Host "Test Coverage:" -ForegroundColor Yellow
    Write-Host "  [1] SessionWaiting registration guard" -ForegroundColor Gray
    Write-Host "  [2] SessionCanvas registration guard" -ForegroundColor Gray
    Write-Host "  [3] TranscriptCanvas registration guard" -ForegroundColor Gray
    Write-Host "  [4] Bypass flag mechanism" -ForegroundColor Gray
    Write-Host "  [5] Ended session handling" -ForegroundColor Gray
    Write-Host "  [6] localStorage save/load/auto-navigation" -ForegroundColor Gray
    Write-Host "  [7] localStorage expiration (2 days)" -ForegroundColor Gray
    Write-Host "  [8] Token isolation" -ForegroundColor Gray
    Write-Host "  [9] Debug panel clear storage" -ForegroundColor Gray
    Write-Host ""

    # Navigate to application directory
    $appPath = Join-Path (Join-Path (Join-Path $PSScriptRoot "..") "SPA") "NoorCanvas"
    Write-Host "[INFO] Navigating to application directory: $appPath" -ForegroundColor Yellow
    Set-Location $appPath

    # Start the application in background
    Write-Host "[INFO] Starting NoorCanvas application..." -ForegroundColor Green
    $appJob = Start-Job -ScriptBlock {
        Set-Location $using:appPath
        dotnet run
    }

    Write-Host "[INFO] Waiting 20 seconds for application to start..." -ForegroundColor Yellow
    Start-Sleep -Seconds 20

    # Check if application is running
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:9090" -Method Head -TimeoutSec 5 -UseBasicParsing
        Write-Host "[SUCCESS] Application is running and responsive" -ForegroundColor Green
        Write-Host "   HTTP Status: $($response.StatusCode)" -ForegroundColor Cyan
    }
    catch {
        Write-Host "[ERROR] Application failed to start or is not responding" -ForegroundColor Red
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
        throw "Application startup failed"
    }

    # Navigate to Tests/UI directory
    $testPath = Join-Path (Join-Path (Join-Path $PSScriptRoot "..") "Tests") "UI"
    Write-Host "`n[INFO] Navigating to test directory: $testPath" -ForegroundColor Yellow
    Set-Location $testPath

    # Run Playwright tests
    Write-Host "`n[INFO] Running comprehensive E2E test suite..." -ForegroundColor Green
    Write-Host "========================================`n" -ForegroundColor Cyan
    
    $testArgs = @("playwright", "test", "registration-guard-enforcement.spec.ts")
    
    if ($Headed) {
        $testArgs += "--headed"
        Write-Host "[MODE] Running in HEADED mode (browser visible)" -ForegroundColor Cyan
    }
    else {
        Write-Host "[MODE] Running in HEADLESS mode" -ForegroundColor Cyan
    }

    if ($Debug) {
        $testArgs += "--debug"
        Write-Host "[MODE] Debug mode enabled" -ForegroundColor Cyan
    }
    
    Write-Host "[CMD] npx $($testArgs -join ' ')" -ForegroundColor Gray
    Write-Host ""
    
    & npx @testArgs
    $testExitCode = $LASTEXITCODE

    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "Test Results Summary" -ForegroundColor Cyan
    Write-Host "========================================`n" -ForegroundColor Cyan

    if ($testExitCode -eq 0) {
        Write-Host "🎉 ALL TESTS PASSED - COMPLETE SUCCESS!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Validated Features:" -ForegroundColor Green
        Write-Host "  ✅ Phase 1: SessionWaiting registration guard" -ForegroundColor Green
        Write-Host "  ✅ Phase 2: SessionCanvas registration guard" -ForegroundColor Green
        Write-Host "  ✅ Phase 3: TranscriptCanvas registration guard" -ForegroundColor Green
        Write-Host "  ✅ Phase 4: Bypass flag mechanism" -ForegroundColor Green
        Write-Host "  ✅ Phase 5: Ended session handling" -ForegroundColor Green
        Write-Host "  ✅ Phase 6: localStorage infrastructure" -ForegroundColor Green
        Write-Host "  ✅ Phase 7: Expiration extension logic" -ForegroundColor Green
        Write-Host "  ✅ Phase 8: Data validation" -ForegroundColor Green
        Write-Host "  ✅ Phase 9: Save/load integration & auto-navigation" -ForegroundColor Green
        Write-Host "  ✅ Phase 10: Debug panel clear button" -ForegroundColor Green
        Write-Host ""
        Write-Host "Registration guard enforcement is fully operational!" -ForegroundColor Green
        Write-Host "localStorage functionality is working correctly!" -ForegroundColor Green
    }
    else {
        Write-Host "❌ SOME TESTS FAILED" -ForegroundColor Red
        Write-Host ""
        Write-Host "Please review the test output above for details." -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Common issues:" -ForegroundColor Yellow
        Write-Host "  • Registration guards not redirecting unregistered users" -ForegroundColor Yellow
        Write-Host "  • Bypass flag not being set/cleared properly" -ForegroundColor Yellow
        Write-Host "  • localStorage save/load/expiration issues" -ForegroundColor Yellow
        Write-Host "  • Auto-navigation not working after registration" -ForegroundColor Yellow
        Write-Host "  • Token isolation not working (storage keys overlap)" -ForegroundColor Yellow
        Write-Host "  • Debug panel clear button not functioning" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Debugging tips:" -ForegroundColor Cyan
        Write-Host "  1. Run with -Headed flag to see browser interaction" -ForegroundColor Cyan
        Write-Host "  2. Run with -Debug flag for step-by-step debugging" -ForegroundColor Cyan
        Write-Host "  3. Check browser DevTools console for JavaScript errors" -ForegroundColor Cyan
        Write-Host "  4. Verify Session 212 exists in database (SessionId=212, UserToken=KJAHA99L)" -ForegroundColor Cyan
        Write-Host "  5. Check application logs below for server-side errors" -ForegroundColor Cyan
    }

    # Display job output (application logs)
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "Application Logs (Last 30 lines)" -ForegroundColor Cyan
    Write-Host "========================================`n" -ForegroundColor Cyan
    
    $jobOutput = Receive-Job -Job $appJob -Keep
    if ($jobOutput) {
        $jobOutput | Select-Object -Last 30 | ForEach-Object { 
            $line = $_
            # Highlight debug markers
            if ($line -match '\[DEBUG-WORKITEM:userlanding:') {
                Write-Host $line -ForegroundColor Magenta
            }
            elseif ($line -match 'error|exception|fail' -and $line -notmatch 'FailureRate') {
                Write-Host $line -ForegroundColor Red
            }
            elseif ($line -match 'warning|warn') {
                Write-Host $line -ForegroundColor Yellow
            }
            else {
                Write-Host $line
            }
        }
    }
    else {
        Write-Host "(No application logs captured)" -ForegroundColor Gray
    }

    # Test statistics
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "Test Execution Statistics" -ForegroundColor Cyan
    Write-Host "========================================`n" -ForegroundColor Cyan

    Write-Host "Test Suite: registration-guard-enforcement.spec.ts" -ForegroundColor Cyan
    Write-Host "Total Scenarios: 9" -ForegroundColor Cyan
    Write-Host "Exit Code: $testExitCode" -ForegroundColor $(if ($testExitCode -eq 0) { "Green" } else { "Red" })
    
    if ($testExitCode -eq 0) {
        Write-Host "Status: ✅ PASSED" -ForegroundColor Green
    }
    else {
        Write-Host "Status: ❌ FAILED" -ForegroundColor Red
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
        Write-Host "`n[WARN] Application kept running (-KeepAppRunning flag set)" -ForegroundColor Yellow
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
