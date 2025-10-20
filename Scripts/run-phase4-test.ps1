# Phase 4: UserLanding Post-Registration Navigation - Test Orchestration Script
# 
# Purpose: Automated test execution for Phase 4 registration bypass flag implementation
# 
# This script:
# 1. Launches the NoorCanvas application (dotnet run)
# 2. Waits for application readiness (15 seconds)
# 3. Executes Playwright test suite (phase4-registration-bypass-flag.spec.ts)
# 4. Captures browser console logs
# 5. Stops the application
# 6. Displays test results summary
#
# Debug Marker: [DEBUG-WORKITEM:userlanding:bypass-flag]
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
    Write-Host "Phase 4: UserLanding Post-Registration Bypass Flag Test" -ForegroundColor Cyan
    Write-Host "========================================`n" -ForegroundColor Cyan

    # Navigate to application directory
    $appPath = Join-Path $ScriptRoot ".." "SPA" "NoorCanvas"
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
    $testPath = Join-Path $ScriptRoot ".." "Tests" "UI"
    Write-Host "`n[INFO] Navigating to test directory: $testPath" -ForegroundColor Yellow
    Set-Location $testPath

    # Run Playwright tests
    Write-Host "`n[INFO] Running Playwright tests..." -ForegroundColor Green
    $testArgs = "playwright", "test", "phase4-registration-bypass-flag.spec.ts"
    
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
        Write-Host "`nPhase 4 registration bypass flag is working correctly:" -ForegroundColor Green
        Write-Host "  [OK] Bypass flag set after successful registration" -ForegroundColor Green
        Write-Host "  [OK] Navigation to SessionWaiting/SessionCanvas successful" -ForegroundColor Green
        Write-Host "  [OK] Bypass flag cleared after navigation (no redirect loop)" -ForegroundColor Green
        Write-Host "  [OK] Manual bypass flag test confirms guard behavior" -ForegroundColor Green
        Write-Host "`n[MILESTONE] Phase 4 COMPLETE - Post-registration navigation flow secured" -ForegroundColor Magenta
    }
    else {
        Write-Host "[ERROR] TESTS FAILED" -ForegroundColor Red
        Write-Host "`nPlease review the test output above for details." -ForegroundColor Yellow
        Write-Host "Common issues:" -ForegroundColor Yellow
        Write-Host "  - Bypass flag not being set after registration" -ForegroundColor Yellow
        Write-Host "  - Redirect loop occurring (bypass flag not working)" -ForegroundColor Yellow
        Write-Host "  - Bypass flag not being cleared by guards" -ForegroundColor Yellow
        Write-Host "  - JavaScript errors during registration/navigation" -ForegroundColor Yellow
        Write-Host "  - Session 212 not found in database (verify session exists)" -ForegroundColor Yellow
    }

    # Display job output (application logs)
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "Application Logs (Last 20 lines)" -ForegroundColor Cyan
    Write-Host "========================================`n" -ForegroundColor Cyan
    
    $jobOutput = Receive-Job -Job $appJob -Keep
    if ($jobOutput) {
        $lastLogs = $jobOutput | Select-Object -Last 20
        $lastLogs | ForEach-Object { Write-Host $_ -ForegroundColor Gray }
    }
    else {
        Write-Host "[INFO] No application logs available yet" -ForegroundColor Yellow
    }

}
finally {
    # Cleanup
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "Cleanup" -ForegroundColor Cyan
    Write-Host "========================================`n" -ForegroundColor Cyan

    if (-not $KeepAppRunning) {
        if ($appJob) {
            Write-Host "[INFO] Stopping application job..." -ForegroundColor Yellow
            Stop-Job -Job $appJob -ErrorAction SilentlyContinue
            Remove-Job -Job $appJob -ErrorAction SilentlyContinue -Force
            Write-Host "[SUCCESS] Application stopped" -ForegroundColor Green
        }
    }
    else {
        Write-Host "[INFO] Keeping application running (use -KeepAppRunning flag)" -ForegroundColor Yellow
        Write-Host "   Job ID: $($appJob.Id)" -ForegroundColor Cyan
        Write-Host "   To stop manually: Stop-Job -Id $($appJob.Id); Remove-Job -Id $($appJob.Id)" -ForegroundColor Cyan
    }

    # Return to original location
    Set-Location $OriginalLocation
    
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "Test Execution Complete" -ForegroundColor Cyan
    Write-Host "========================================`n" -ForegroundColor Cyan

    # Exit with test exit code
    if ($testExitCode -ne 0) {
        exit $testExitCode
    }
}
