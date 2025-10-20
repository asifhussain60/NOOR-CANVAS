# Phase 10: Debug Panel Clear localStorage - Test Orchestration Script
# Launches NoorCanvas app, runs Playwright tests with optional Percy, stops app

Write-Host "=== Phase 10: Debug Panel Clear localStorage Tests ===" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the workspace root
$workspaceRoot = "D:\PROJECTS\NOOR CANVAS"
if (-not (Test-Path "$workspaceRoot\SPA\NoorCanvas\NoorCanvas.csproj")) {
    Write-Host "ERROR: NoorCanvas project not found. Are you in the correct directory?" -ForegroundColor Red
    exit 1
}

# Start the NoorCanvas app in the background
Write-Host "Starting NoorCanvas app..." -ForegroundColor Yellow
$appProcess = Start-Process -FilePath "dotnet" -ArgumentList "run" -WorkingDirectory "$workspaceRoot\SPA\NoorCanvas" -PassThru -WindowStyle Minimized

# Wait for app to start
Write-Host "Waiting for app to start (15 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

try {
    # Check if PERCY_TOKEN is set
    $percyToken = $env:PERCY_TOKEN
    
    Write-Host ""
    Write-Host "Running Phase 10 debug panel clear localStorage tests..." -ForegroundColor Cyan
    
    if ($percyToken) {
        Write-Host "Percy token found - running with visual regression" -ForegroundColor Green
        npx percy exec -- npx playwright test Tests/UI/phase10-debug-panel-clear-storage.spec.ts --headed
    } else {
        Write-Host "Percy token not found - running without visual regression (Percy snapshots will be skipped)" -ForegroundColor Yellow
        npx playwright test Tests/UI/phase10-debug-panel-clear-storage.spec.ts --headed
    }
    
    $testExitCode = $LASTEXITCODE
    
    Write-Host ""
    if ($testExitCode -eq 0) {
        Write-Host "✅ Phase 10 tests passed!" -ForegroundColor Green
    } else {
        Write-Host "❌ Phase 10 tests failed!" -ForegroundColor Red
    }
    
} finally {
    # Stop the app
    Write-Host ""
    Write-Host "Stopping NoorCanvas app..." -ForegroundColor Yellow
    Stop-Process -Id $appProcess.Id -Force -ErrorAction SilentlyContinue
    
    Write-Host "Done!" -ForegroundColor Cyan
}

exit $testExitCode
