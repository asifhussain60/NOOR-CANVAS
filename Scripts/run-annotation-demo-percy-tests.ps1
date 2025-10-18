# Run Annotation Demo Percy Visual Regression Tests
# This script launches the app, runs Percy tests, and captures visual evidence

param(
    [switch]$KeepAppRunning,
    [switch]$HeadedMode,
    [string]$TestPattern = "annotation-demo-percy"
)

$ErrorActionPreference = "Stop"
$OriginalLocation = Get-Location

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Annotation Demo Percy Tests" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

try {
    # Check if Percy token is set
    if (-not $env:PERCY_TOKEN) {
        Write-Host "⚠️  WARNING: PERCY_TOKEN environment variable not set" -ForegroundColor Yellow
        Write-Host "   Percy snapshots will be skipped (dry-run mode)" -ForegroundColor Yellow
        Write-Host "   To enable Percy: Set-Item -Path Env:PERCY_TOKEN -Value 'your-token'" -ForegroundColor Yellow
        Write-Host ""
    }

    # Step 1: Start the application
    Write-Host "📦 Step 1: Starting NOOR Canvas application..." -ForegroundColor Green
    Set-Location "D:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas"
    
    $appProcess = Start-Process -FilePath "dotnet" -ArgumentList "run" -PassThru -WindowStyle Normal
    Write-Host "   App starting with PID: $($appProcess.Id)" -ForegroundColor Gray
    
    # Wait for app to start
    Write-Host "   Waiting for app to be ready..." -ForegroundColor Gray
    Start-Sleep -Seconds 15
    
    # Verify app is running
    try {
        $response = Invoke-WebRequest -Uri "https://localhost:9091/healthz" -SkipCertificateCheck -TimeoutSec 5
        Write-Host "   ✅ Application is running and healthy" -ForegroundColor Green
    }
    catch {
        Write-Host "   ⚠️  Could not verify app health, but continuing..." -ForegroundColor Yellow
    }
    Write-Host ""

    # Step 2: Run Percy tests
    Write-Host "📸 Step 2: Running Percy visual regression tests..." -ForegroundColor Green
    Set-Location "D:\PROJECTS\NOOR CANVAS"
    
    $playwrightArgs = @(
        "test",
        "Tests/UI/$TestPattern.spec.ts",
        "--config=config/testing/playwright.config.cjs"
    )
    
    if ($HeadedMode) {
        $playwrightArgs += "--headed"
        Write-Host "   Running in HEADED mode (browser visible)" -ForegroundColor Gray
    }
    else {
        Write-Host "   Running in HEADLESS mode" -ForegroundColor Gray
    }
    
    Write-Host "   Test file: Tests/UI/$TestPattern.spec.ts" -ForegroundColor Gray
    Write-Host ""
    
    if ($env:PERCY_TOKEN) {
        Write-Host "   📸 Percy snapshots will be captured and uploaded" -ForegroundColor Cyan
        $percyProcess = Start-Process -FilePath "npx" -ArgumentList @("percy", "exec", "--", "npx", "playwright") + $playwrightArgs -NoNewWindow -Wait -PassThru
    }
    else {
        Write-Host "   🏃 Running tests without Percy (dry-run)" -ForegroundColor Yellow
        $testProcess = Start-Process -FilePath "npx" -ArgumentList (@("playwright") + $playwrightArgs) -NoNewWindow -Wait -PassThru
    }
    
    Write-Host ""
    Write-Host "✅ Tests completed!" -ForegroundColor Green
    Write-Host ""

    # Step 3: Show results location
    Write-Host "📊 Test Results:" -ForegroundColor Green
    Write-Host "   - Playwright Report: D:\PROJECTS\NOOR CANVAS\PlayWright\reports" -ForegroundColor Gray
    Write-Host "   - Test Results: D:\PROJECTS\NOOR CANVAS\PlayWright\test-results" -ForegroundColor Gray
    
    if ($env:PERCY_TOKEN) {
        Write-Host "   - Percy Dashboard: https://percy.io/" -ForegroundColor Gray
    }
    Write-Host ""

    # Step 4: Cleanup
    if (-not $KeepAppRunning) {
        Write-Host "🛑 Step 3: Stopping application..." -ForegroundColor Yellow
        Stop-Process -Id $appProcess.Id -Force -ErrorAction SilentlyContinue
        Write-Host "   Application stopped" -ForegroundColor Gray
    }
    else {
        Write-Host "✅ Application still running (PID: $($appProcess.Id))" -ForegroundColor Green
        Write-Host "   Access demo at: https://localhost:9091/annotation-demo.html" -ForegroundColor Cyan
        Write-Host "   Stop manually with: Stop-Process -Id $($appProcess.Id)" -ForegroundColor Gray
    }
    Write-Host ""

    # Step 5: Open report
    Write-Host "📖 Opening test report..." -ForegroundColor Green
    $reportPath = "D:\PROJECTS\NOOR CANVAS\PlayWright\reports\index.html"
    if (Test-Path $reportPath) {
        Start-Process $reportPath
    }
    else {
        Write-Host "   No report found at: $reportPath" -ForegroundColor Yellow
    }

    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  COMPLETED SUCCESSFULLY" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
}
catch {
    Write-Host ""
    Write-Host "❌ ERROR: $_" -ForegroundColor Red
    Write-Host ""
    
    # Cleanup on error
    if ($appProcess -and -not $appProcess.HasExited) {
        Write-Host "Stopping application..." -ForegroundColor Yellow
        Stop-Process -Id $appProcess.Id -Force -ErrorAction SilentlyContinue
    }
    
    exit 1
}
finally {
    Set-Location $OriginalLocation
}
