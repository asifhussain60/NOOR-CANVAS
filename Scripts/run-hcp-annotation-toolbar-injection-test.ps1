# [TRACE:hcp-annotate:test-orchestration] Orchestration script for annotation toolbar injection test ;CLEANUP_OK
# Purpose: Launch NoorCanvas app, run Playwright test, then stop app
# Test: hcp-annotation-toolbar-injection.spec.ts

param(
    [switch]$KeepAppRunning,
    [switch]$Headed
)

$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptDir

Write-Host "[TRACE:hcp-annotate:orchestration] Starting test orchestration ;CLEANUP_OK" -ForegroundColor Cyan

# Step 1: Start NoorCanvas application in background
Write-Host "`n[1/4] Starting NoorCanvas application..." -ForegroundColor Yellow
$appProcess = Start-Process -FilePath "dotnet" -ArgumentList "run" -WorkingDirectory "$projectRoot\SPA\NoorCanvas" -PassThru -WindowStyle Minimized
Write-Host "[TRACE:hcp-annotate:orchestration] App started with PID: $($appProcess.Id) ;CLEANUP_OK" -ForegroundColor Green

# Step 2: Wait for application to be ready
Write-Host "`n[2/4] Waiting for application to start (15 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 15
Write-Host "[TRACE:hcp-annotate:orchestration] App should be ready ;CLEANUP_OK" -ForegroundColor Green

# Step 3: Run Playwright test
Write-Host "`n[3/4] Running Playwright test..." -ForegroundColor Yellow
try {
    $playwrightArgs = @("playwright", "test", "Workspaces/TEMP/hcp-annotation-toolbar-injection.spec.ts")
    if ($Headed) {
        $playwrightArgs += "--headed"
    }
    
    Write-Host "[TRACE:hcp-annotate:orchestration] Executing: npx $($playwrightArgs -join ' ') ;CLEANUP_OK" -ForegroundColor Cyan
    & npx @playwrightArgs
    
    $testExitCode = $LASTEXITCODE
    if ($testExitCode -eq 0) {
        Write-Host "[TRACE:hcp-annotate:orchestration] ✅ Tests passed ;CLEANUP_OK" -ForegroundColor Green
    } else {
        Write-Host "[TRACE:hcp-annotate:orchestration] ❌ Tests failed with exit code: $testExitCode ;CLEANUP_OK" -ForegroundColor Red
    }
} catch {
    Write-Host "[TRACE:hcp-annotate:orchestration] ❌ Test execution error: $($_.Exception.Message) ;CLEANUP_OK" -ForegroundColor Red
    $testExitCode = 1
}

# Step 4: Stop application (unless -KeepAppRunning specified)
if ($KeepAppRunning) {
    Write-Host "`n[4/4] Keeping application running (PID: $($appProcess.Id))..." -ForegroundColor Yellow
    Write-Host "To stop manually, run: Stop-Process -Id $($appProcess.Id)" -ForegroundColor Cyan
} else {
    Write-Host "`n[4/4] Stopping application..." -ForegroundColor Yellow
    try {
        Stop-Process -Id $appProcess.Id -Force -ErrorAction SilentlyContinue
        Write-Host "[TRACE:hcp-annotate:orchestration] App stopped ;CLEANUP_OK" -ForegroundColor Green
    } catch {
        Write-Host "[TRACE:hcp-annotate:orchestration] Warning: Could not stop app process ;CLEANUP_OK" -ForegroundColor Yellow
    }
}

Write-Host "`n[TRACE:hcp-annotate:orchestration] Test orchestration complete ;CLEANUP_OK" -ForegroundColor Cyan
exit $testExitCode
