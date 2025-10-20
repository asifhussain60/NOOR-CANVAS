# Phase 5: Session Ended Handling - Test Orchestration Script
# Launches app, runs Playwright test, captures output, stops app

param(
    [switch]$KeepAppRunning = $false
)

$ErrorActionPreference = "Continue"

Write-Host "`n=== Phase 5: Session Ended Redirect Test ===" -ForegroundColor Cyan
Write-Host "Session 212 - User Token: KJAHA99L" -ForegroundColor Gray
Write-Host "Test: Verify ended session redirects to /session/ended/{sessionId}`n" -ForegroundColor Gray

# Store original location
$originalLocation = Get-Location

try {
    # Step 1: Launch the application
    Write-Host "[1/5] Starting NoorCanvas application..." -ForegroundColor Yellow
    Set-Location "D:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas"
    
    $appJob = Start-Job -ScriptBlock {
        Set-Location "D:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas"
        dotnet run
    }
    
    Write-Host "      App job started (ID: $($appJob.Id))" -ForegroundColor Green
    
    # Step 2: Wait for app to be ready
    Write-Host "[2/5] Waiting for application to start (15 seconds)..." -ForegroundColor Yellow
    Start-Sleep -Seconds 15
    
    # Step 3: Verify app is responding
    Write-Host "[3/5] Verifying application is responding..." -ForegroundColor Yellow
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:9090" -UseBasicParsing -TimeoutSec 5 -ErrorAction SilentlyContinue
        Write-Host "      Application is responding (Status: $($response.StatusCode))" -ForegroundColor Green
    } catch {
        Write-Host "      Warning: Could not verify app status (may redirect to HTTPS)" -ForegroundColor Yellow
    }
    
    # Step 4: Run Playwright test
    Write-Host "[4/5] Running Playwright test suite..." -ForegroundColor Yellow
    Set-Location "D:\PROJECTS\NOOR CANVAS"
    
    Write-Host "`n--- Playwright Test Output ---`n" -ForegroundColor Cyan
    npx playwright test Tests/UI/phase5-session-ended-redirect.spec.ts --headed
    $testExitCode = $LASTEXITCODE
    Write-Host "`n--- End of Test Output ---`n" -ForegroundColor Cyan
    
    # Step 5: Display results
    Write-Host "[5/5] Test Results:" -ForegroundColor Yellow
    if ($testExitCode -eq 0) {
        Write-Host "      ✓ All tests passed!" -ForegroundColor Green
    } else {
        Write-Host "      ✗ Some tests failed (Exit Code: $testExitCode)" -ForegroundColor Red
    }
    
} finally {
    # Cleanup
    if (-not $KeepAppRunning) {
        Write-Host "`n[Cleanup] Stopping application..." -ForegroundColor Yellow
        Stop-Job -Job $appJob -ErrorAction SilentlyContinue
        Remove-Job -Job $appJob -Force -ErrorAction SilentlyContinue
        Write-Host "          Application stopped" -ForegroundColor Green
    } else {
        Write-Host "`n[Info] App left running (Job ID: $($appJob.Id))" -ForegroundColor Cyan
        Write-Host "       Stop with: Stop-Job -Id $($appJob.Id); Remove-Job -Id $($appJob.Id)" -ForegroundColor Gray
    }
    
    # Restore original location
    Set-Location $originalLocation
}

Write-Host "`n=== Test Orchestration Complete ===`n" -ForegroundColor Cyan

# Exit with test result code
exit $testExitCode
