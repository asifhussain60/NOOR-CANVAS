<![CDATA[# Phase 8: Run localStorage data validation tests
# Tests ValidateRegistrationDataAsync method and auto-clear behavior

Write-Host "=== Phase 8: localStorage Data Validation Tests ===" -ForegroundColor Cyan
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
    # Run Playwright tests
    Write-Host ""
    Write-Host "Running Phase 8 validation tests..." -ForegroundColor Green
    Set-Location "D:\PROJECTS\NOOR CANVAS\Tests\UI"
    
    npx playwright test phase8-localstorage-validation.spec.ts --headed
    
    $testExitCode = $LASTEXITCODE
    
    Write-Host ""
    if ($testExitCode -eq 0) {
        Write-Host "✅ Phase 8 tests passed!" -ForegroundColor Green
    } else {
        Write-Host "❌ Phase 8 tests failed with exit code: $testExitCode" -ForegroundColor Red
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