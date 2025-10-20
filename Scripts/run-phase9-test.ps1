# Phase 9: Run save/load integration and auto-navigation tests
# Tests complete localStorage save/load flow with auto-navigation based on session status
# Includes Percy visual regression testing for form pre-population

Write-Host "=== Phase 9: Save/Load Integration and Auto-Navigation Tests ===" -ForegroundColor Cyan
Write-Host ""

# Start NoorCanvas app in background
Write-Host "Starting NoorCanvas app..." -ForegroundColor Yellow
$job = Start-Job -ScriptBlock { 
    Set-Location "D:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas"
    dotnet run 
}

Write-Host "Waiting for app to start (15 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

try {
    # Run Playwright tests with Percy
    Write-Host ""
    Write-Host "Running Phase 9 save/load and auto-navigation tests..." -ForegroundColor Green
    Set-Location "D:\PROJECTS\NOOR CANVAS\Tests\UI"
    
    # Check if Percy is configured
    $percyToken = $env:PERCY_TOKEN
    if ($percyToken) {
        Write-Host "Percy token found - running with visual regression testing" -ForegroundColor Green
        npx percy exec -- npx playwright test phase9-save-load-auto-navigation.spec.ts --headed
    } else {
        Write-Host "Percy token not found - running without visual regression (Percy snapshots will be skipped)" -ForegroundColor Yellow
        npx playwright test phase9-save-load-auto-navigation.spec.ts --headed
    }
    
    $testExitCode = $LASTEXITCODE
    
    Write-Host ""
    if ($testExitCode -eq 0) {
        Write-Host "✅ Phase 9 tests passed!" -ForegroundColor Green
    } else {
        Write-Host "❌ Phase 9 tests failed with exit code: $testExitCode" -ForegroundColor Red
    }
    
} finally {
    # Stop app
    Write-Host ""
    Write-Host "Stopping NoorCanvas app..." -ForegroundColor Yellow
    Stop-Job -Job $job -ErrorAction SilentlyContinue
    Remove-Job -Job $job -Force -ErrorAction SilentlyContinue
    
    Write-Host "Done!" -ForegroundColor Cyan
}

exit $testExitCode
