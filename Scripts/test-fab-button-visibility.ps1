<#
.SYNOPSIS
    Test script for FAB button visibility with asset wrapping.

.DESCRIPTION
    Launches NoorCanvas application and runs Playwright tests to verify:
    - Individual assets have FAB share buttons injected
    - Assets are wrapped in container divs
    - Buttons have unique IDs and proper positioning
    
.PARAMETER KeepAppRunning
    Keep application running after tests complete (for debugging).

.EXAMPLE
    .\test-fab-button-visibility.ps1
    Runs tests and stops app after completion.

.EXAMPLE
    .\test-fab-button-visibility.ps1 -KeepAppRunning
    Runs tests and keeps app running for manual verification.
#>

param(
    [switch]$KeepAppRunning
)

$ErrorActionPreference = 'Stop'

Write-Host '════════════════════════════════════════════════════' -ForegroundColor Cyan
Write-Host '  FAB Button Visibility Test Suite' -ForegroundColor Cyan
Write-Host '════════════════════════════════════════════════════' -ForegroundColor Cyan
Write-Host ''

# Step 1: Start app using Start-Job pattern
Write-Host '[1/3] Starting NoorCanvas app...' -ForegroundColor Yellow
$appJob = Start-Job -ScriptBlock {
    Set-Location 'D:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas'
    dotnet run
}

Write-Host "      App started (Job ID: $($appJob.Id))" -ForegroundColor Green
Write-Host ''

# Step 2: Wait for app to be ready
Write-Host '[2/3] Waiting for app to be ready (20 seconds)...' -ForegroundColor Yellow
Start-Sleep -Seconds 20
Write-Host '      App should be ready' -ForegroundColor Green
Write-Host ''

# Step 3: Run Playwright tests
Write-Host '[3/3] Running Playwright tests...' -ForegroundColor Yellow
try {
    Set-Location 'D:\PROJECTS\NOOR CANVAS'
    
    # Run tests with headed mode for visibility (standard Playwright pattern)
    npx playwright test Tests/UI/asset-fab-button-visibility.spec.ts --headed
    $exitCode = $LASTEXITCODE
    
    Write-Host ''
    if ($exitCode -eq 0) {
        Write-Host '✅ All tests PASSED!' -ForegroundColor Green
    } else {
        Write-Host "⚠️ Tests completed with exit code: $exitCode" -ForegroundColor Yellow
    }
}
finally {
    # Cleanup
    Write-Host ''
    if ($KeepAppRunning) {
        Write-Host "App still running (Job ID: $($appJob.Id))" -ForegroundColor Yellow
        Write-Host "URL: https://localhost:7220/host/session/215" -ForegroundColor Gray
        Write-Host "To stop: Stop-Job -Id $($appJob.Id); Remove-Job -Id $($appJob.Id)" -ForegroundColor Gray
    } else {
        Write-Host 'Stopping app...' -ForegroundColor Yellow
        Stop-Job -Job $appJob -ErrorAction SilentlyContinue
        Remove-Job -Job $appJob -ErrorAction SilentlyContinue
        Write-Host '✅ App stopped' -ForegroundColor Green
    }
}

Write-Host ''
Write-Host '════════════════════════════════════════════════════' -ForegroundColor Cyan
Write-Host "Exit Code: $exitCode" -ForegroundColor White
Write-Host '════════════════════════════════════════════════════' -ForegroundColor Cyan
Write-Host ''

exit $exitCode
