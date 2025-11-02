# Test H2 Share Button Injection with Session 212
# This script runs the app, executes the Playwright test, and captures diagnostic output

Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Session 212 H2 Share Button Injection Test" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Configuration
$projectPath = "D:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas"
$testPath = "D:\PROJECTS\NOOR CANVAS\Tests\UI"
$testFile = "test-section-share-buttons.spec.ts"
$appUrl = "https://localhost:9091"
$sessionToken = "PQ9N5YWW" # Session 212 host token

# Step 1: Build the application
Write-Host "[1/5] Building application..." -ForegroundColor Yellow
Set-Location $projectPath
$buildResult = dotnet build --no-restore 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    Write-Host $buildResult
    exit 1
}
Write-Host "✅ Build successful" -ForegroundColor Green
Write-Host ""

# Step 2: Start the application in background
Write-Host "[2/5] Starting application..." -ForegroundColor Yellow
$appProcess = Start-Process -FilePath "dotnet" -ArgumentList "run --no-build" -WorkingDirectory $projectPath -PassThru -WindowStyle Minimized
Write-Host "✅ Application started (PID: $($appProcess.Id))" -ForegroundColor Green
Write-Host ""

# Step 3: Wait for app to be ready
Write-Host "[3/5] Waiting for application to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 10
Write-Host "✅ Application should be ready" -ForegroundColor Green
Write-Host ""

try {
    # Step 4: Run Playwright test
    Write-Host "[4/5] Running Playwright test..." -ForegroundColor Yellow
    Write-Host "Test: $testFile" -ForegroundColor Gray
    Write-Host "URL: $appUrl/host/control-panel/$sessionToken" -ForegroundColor Gray
    Write-Host ""
    
    Set-Location $testPath
    $testResult = npx playwright test $testFile --headed --reporter=list 2>&1
    $testExitCode = $LASTEXITCODE
    
    Write-Host ""
    Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "  Test Results" -ForegroundColor Cyan
    Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host $testResult
    Write-Host ""
    
    if ($testExitCode -eq 0) {
        Write-Host "✅ ALL TESTS PASSED!" -ForegroundColor Green
    } else {
        Write-Host "❌ TESTS FAILED!" -ForegroundColor Red
    }
    
    # Step 5: Extract key metrics from test output
    Write-Host ""
    Write-Host "[5/5] Test Summary:" -ForegroundColor Yellow
    
    # Parse test output for key information
    $h2Count = if ($testResult -match "Found (\d+) h2 elements") { $matches[1] } else { "Unknown" }
    $buttonCount = if ($testResult -match "Found (\d+) share buttons") { $matches[1] } else { "Unknown" }
    
    Write-Host "  H2 Elements Found: $h2Count" -ForegroundColor $(if ($h2Count -eq "6") { "Green" } else { "Yellow" })
    Write-Host "  Share Buttons Injected: $buttonCount" -ForegroundColor $(if ($buttonCount -eq "6") { "Green" } else { "Yellow" })
    
    if ($h2Count -eq "6" -and $buttonCount -eq "6") {
        Write-Host ""
        Write-Host "✅ SUCCESS: All 6 buttons injected correctly!" -ForegroundColor Green
    } elseif ($h2Count -eq "6" -and $buttonCount -ne "6") {
        Write-Host ""
        Write-Host "⚠️  WARNING: H2 count correct but button injection issue!" -ForegroundColor Yellow
    } else {
        Write-Host ""
        Write-Host "❌ FAILURE: Unexpected counts!" -ForegroundColor Red
    }
    
} finally {
    # Cleanup: Stop application
    Write-Host ""
    Write-Host "Stopping application..." -ForegroundColor Yellow
    Stop-Process -Id $appProcess.Id -Force -ErrorAction SilentlyContinue
    Write-Host "✅ Application stopped" -ForegroundColor Green
}

Write-Host ""
Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Test Complete" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Cyan

# Return test exit code
exit $testExitCode
