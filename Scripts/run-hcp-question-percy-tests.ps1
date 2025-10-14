# [DEBUG-WORKITEM:hcp-question:percy-visual:TRACE] Orchestration script for Percy visual regression testing ;CLEANUP_OK
# Launches NoorCanvas app in separate PowerShell window, runs Percy tests, then cleans up
# Usage: .\Scripts\run-hcp-question-percy-tests.ps1 [-KeepAppRunning]

param(
    [switch]$KeepAppRunning = $false
)

$ErrorActionPreference = "Stop"
$testId = "percy-$(Get-Date -Format 'yyyyMMdd-HHmmss')"

Write-Host "[DEBUG-WORKITEM:hcp-question:percy-visual:TRACE] $testId - Orchestration script started ;CLEANUP_OK" -ForegroundColor Cyan

# Configuration
$appPath = "D:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas"
$testPath = "D:\PROJECTS\NOOR CANVAS\Workspaces\TEMP"
$testFile = "hcp-question-orange-styling.spec.ts"
$appStartupWaitSeconds = 15

# Step 1: Launch app in separate PowerShell window
Write-Host "[DEBUG-WORKITEM:hcp-question:percy-visual:TRACE] $testId - Step 1: Launching NoorCanvas app in separate PowerShell window ;CLEANUP_OK" -ForegroundColor Yellow

$appProcess = Start-Process powershell.exe -ArgumentList @(
    "-NoProfile",
    "-Command",
    "cd '$appPath'; dotnet run; Read-Host 'Press Enter to close'"
) -PassThru -WindowStyle Normal

Write-Host "[DEBUG-WORKITEM:hcp-question:percy-visual:TRACE] $testId - App launched in PID: $($appProcess.Id) ;CLEANUP_OK" -ForegroundColor Green

# Step 2: Wait for app to start
Write-Host "[DEBUG-WORKITEM:hcp-question:percy-visual:TRACE] $testId - Step 2: Waiting $appStartupWaitSeconds seconds for app initialization ;CLEANUP_OK" -ForegroundColor Yellow
Start-Sleep -Seconds $appStartupWaitSeconds

# Step 3: Verify app is running
Write-Host "[DEBUG-WORKITEM:hcp-question:percy-visual:TRACE] $testId - Step 3: Verifying app is accessible at https://localhost:7101 ;CLEANUP_OK" -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "https://localhost:7101" -SkipCertificateCheck -TimeoutSec 5 -ErrorAction Stop
    Write-Host "[DEBUG-WORKITEM:hcp-question:percy-visual:TRACE] $testId - ✅ App is running (HTTP $($response.StatusCode)) ;CLEANUP_OK" -ForegroundColor Green
} catch {
    Write-Host "[DEBUG-WORKITEM:hcp-question:percy-visual:TRACE] $testId - ⚠️ App may not be ready yet: $($_.Exception.Message) ;CLEANUP_OK" -ForegroundColor Yellow
    Write-Host "[DEBUG-WORKITEM:hcp-question:percy-visual:TRACE] $testId - Waiting additional 10 seconds ;CLEANUP_OK" -ForegroundColor Yellow
    Start-Sleep -Seconds 10
}

# Step 4: Run Percy tests
Write-Host "[DEBUG-WORKITEM:hcp-question:percy-visual:TRACE] $testId - Step 4: Running Percy visual regression tests ;CLEANUP_OK" -ForegroundColor Yellow
Write-Host "[DEBUG-WORKITEM:hcp-question:percy-visual:TRACE] $testId - Test file: $testFile ;CLEANUP_OK" -ForegroundColor Cyan

Push-Location $testPath

try {
    # Run Playwright tests with Percy
    Write-Host "[DEBUG-WORKITEM:hcp-question:percy-visual:TRACE] $testId - Executing: npx percy exec -- npx playwright test $testFile --headed ;CLEANUP_OK" -ForegroundColor Cyan
    
    $env:PERCY_TOKEN = $env:PERCY_TOKEN ?? "percy_token_not_configured"
    
    npx percy exec -- npx playwright test $testFile --headed
    
    $testExitCode = $LASTEXITCODE
    
    if ($testExitCode -eq 0) {
        Write-Host "[DEBUG-WORKITEM:hcp-question:percy-visual:TRACE] $testId - ✅ Percy tests PASSED ;CLEANUP_OK" -ForegroundColor Green
    } else {
        Write-Host "[DEBUG-WORKITEM:hcp-question:percy-visual:TRACE] $testId - ❌ Percy tests FAILED (exit code: $testExitCode) ;CLEANUP_OK" -ForegroundColor Red
    }
} catch {
    Write-Host "[DEBUG-WORKITEM:hcp-question:percy-visual:TRACE] $testId - ❌ Test execution error: $($_.Exception.Message) ;CLEANUP_OK" -ForegroundColor Red
    $testExitCode = 1
} finally {
    Pop-Location
}

# Step 5: Cleanup
if ($KeepAppRunning) {
    Write-Host "[DEBUG-WORKITEM:hcp-question:percy-visual:TRACE] $testId - Step 5: Keeping app running (PID: $($appProcess.Id)) ;CLEANUP_OK" -ForegroundColor Yellow
    Write-Host "[DEBUG-WORKITEM:hcp-question:percy-visual:TRACE] $testId - To stop app, close the PowerShell window or run: Stop-Process -Id $($appProcess.Id) ;CLEANUP_OK" -ForegroundColor Cyan
} else {
    Write-Host "[DEBUG-WORKITEM:hcp-question:percy-visual:TRACE] $testId - Step 5: Stopping NoorCanvas app (PID: $($appProcess.Id)) ;CLEANUP_OK" -ForegroundColor Yellow
    
    try {
        Stop-Process -Id $appProcess.Id -Force -ErrorAction SilentlyContinue
        Write-Host "[DEBUG-WORKITEM:hcp-question:percy-visual:TRACE] $testId - ✅ App stopped ;CLEANUP_OK" -ForegroundColor Green
    } catch {
        Write-Host "[DEBUG-WORKITEM:hcp-question:percy-visual:TRACE] $testId - ⚠️ App may have already exited ;CLEANUP_OK" -ForegroundColor Yellow
    }
}

# Step 6: Summary
Write-Host "" -ForegroundColor White
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "[DEBUG-WORKITEM:hcp-question:percy-visual:TRACE] $testId - ORCHESTRATION SUMMARY ;CLEANUP_OK" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "Test File: $testFile" -ForegroundColor White
Write-Host "Test Result: $(if ($testExitCode -eq 0) { '✅ PASSED' } else { '❌ FAILED' })" -ForegroundColor $(if ($testExitCode -eq 0) { 'Green' } else { 'Red' })
Write-Host "App Status: $(if ($KeepAppRunning) { '🟢 Running' } else { '🔴 Stopped' })" -ForegroundColor $(if ($KeepAppRunning) { 'Green' } else { 'Red' })
Write-Host "Percy Snapshots: Check Percy dashboard for visual diffs" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "" -ForegroundColor White

exit $testExitCode
