# ============================================================================
# HCP Phase 1 Test Orchestration Script
# ============================================================================
# Test: Collapsible Panel Toggle and Visibility
# Key: hcp
# Phase: 1 - UI/State Basics
# Created: 2025-10-22
# ============================================================================

param(
    [switch]$KeepAppRunning = $false,
    [switch]$Headed = $false
)

$ErrorActionPreference = "Stop"

Write-Host "=== HCP Phase 1: Collapsible Panel Toggle Test ===" -ForegroundColor Cyan
Write-Host ""

# STEP 1: Set environment variables
Write-Host "[1/5] Setting environment variables..." -ForegroundColor Cyan
$env:ASPNETCORE_ENVIRONMENT = "Development"
$env:ASPNETCORE_URLS = "https://localhost:9091"
Write-Host "  ✅ ASPNETCORE_ENVIRONMENT=Development" -ForegroundColor Green
Write-Host "  ✅ ASPNETCORE_URLS=https://localhost:9091" -ForegroundColor Green

# STEP 2: Launch NoorCanvas application in separate window (minimized)
Write-Host "[2/5] Launching NoorCanvas application..." -ForegroundColor Cyan
$appPath = "D:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas"

$app = Start-Process -FilePath "dotnet" `
    -ArgumentList "run" `
    -WorkingDirectory $appPath `
    -PassThru `
    -WindowStyle Minimized

Write-Host "  Application started (PID: $($app.Id))" -ForegroundColor Green
Write-Host "  Waiting 20 seconds for application startup..." -ForegroundColor Yellow

# STEP 3: Wait for application to be ready
Start-Sleep -Seconds 20
Write-Host "  Application should be ready" -ForegroundColor Green

try {
    # STEP 4: Run Playwright test
    Write-Host "[4/5] Running Phase 1 Playwright test..." -ForegroundColor Cyan
    
    $workspaceRoot = "D:\PROJECTS\NOOR CANVAS"
    $testFile = ".github/prompts.keys/hcp/tests/hcp-collapsible-panel-phase1.spec.ts"
    
    $playwrightArgs = @(
        "test",
        $testFile,
        "--reporter=list"
    )
    
    if ($Headed) {
        $playwrightArgs += "--headed"
    }
    
    Push-Location $workspaceRoot
    npx playwright @playwrightArgs
    $testResult = $LASTEXITCODE
    Pop-Location
    
    if ($testResult -eq 0) {
        Write-Host "  ✅ Phase 1 tests passed" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Phase 1 tests failed (exit code: $testResult)" -ForegroundColor Red
        throw "Test execution failed"
    }
    
} catch {
    Write-Host "  ❌ Error during test execution: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
} finally {
    # STEP 5: Cleanup - Stop application
    if (-not $KeepAppRunning) {
        Write-Host "[5/5] Stopping application..." -ForegroundColor Cyan
        Stop-Process -Id $app.Id -Force -ErrorAction SilentlyContinue
        Write-Host "  ✅ Application stopped" -ForegroundColor Green
    } else {
        Write-Host "[5/5] Application kept running (PID: $($app.Id))" -ForegroundColor Yellow
        Write-Host "  ⚠️  Remember to manually stop the application" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "=== Phase 1 Test Complete ===" -ForegroundColor Green
Write-Host ""
Write-Host "Results Summary:" -ForegroundColor Cyan
Write-Host "  - Toggle button: Verified" -ForegroundColor Green
Write-Host "  - Panel visibility: Verified" -ForegroundColor Green
Write-Host "  - Keyboard navigation: Verified" -ForegroundColor Green
Write-Host "  - ARIA attributes: Verified" -ForegroundColor Green
Write-Host ""
Write-Host "Next: Phase 2 - Layout & Animation" -ForegroundColor Yellow
