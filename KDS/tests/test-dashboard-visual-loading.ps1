#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Visual test for KDS Dashboard - verifies all cards and metrics load correctly
.DESCRIPTION
    This test:
    1. Launches the API server
    2. Opens the dashboard in a browser
    3. Verifies all cards are visible and populated
    4. Checks that metrics charts render
    5. Validates data loading indicators
    6. Takes screenshots for visual verification
.PARAMETER Headless
    Run browser in headless mode (no visible window)
.PARAMETER KeepOpen
    Keep browser open after test completes
.EXAMPLE
    .\test-dashboard-visual-loading.ps1
    .\test-dashboard-visual-loading.ps1 -Headless
    .\test-dashboard-visual-loading.ps1 -KeepOpen
#>

param(
    [switch]$Headless,
    [switch]$KeepOpen
)

$ErrorActionPreference = "Stop"
$workspaceRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent

# Test configuration
$config = @{
    ApiUrl = "http://localhost:8765"
    DashboardPath = Join-Path $PSScriptRoot "..\kds-dashboard.html"
    ScreenshotDir = Join-Path $PSScriptRoot "..\reports\screenshots"
    TestTimeout = 30000  # 30 seconds
    ChartLoadWait = 3000  # 3 seconds for charts to render
}

# Ensure screenshot directory exists
if (-not (Test-Path $config.ScreenshotDir)) {
    New-Item -ItemType Directory -Path $config.ScreenshotDir -Force | Out-Null
}

Write-Host "`n🎭 KDS Dashboard Visual Loading Test" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host ""

# Step 1: Check if API server is running, start if needed
Write-Host "📡 Checking API Server..." -ForegroundColor Yellow
$apiRunning = $false
try {
    $response = Invoke-WebRequest -Uri "$($config.ApiUrl)/api/status" -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
    if ($response.StatusCode -eq 200) {
        $apiRunning = $true
        Write-Host "  ✅ API Server is already running" -ForegroundColor Green
    }
} catch {
    Write-Host "  ⚠️  API Server not running - starting it now..." -ForegroundColor Yellow
}

$serverProcess = $null
if (-not $apiRunning) {
    try {
        $serverScript = Join-Path $PSScriptRoot "..\scripts\dashboard-api-server.ps1"
        $serverProcess = Start-Process pwsh -ArgumentList "-NoExit", "-Command", "& '$serverScript'" -PassThru -WindowStyle Minimized
        Write-Host "  ⏳ Waiting for API server to start..." -ForegroundColor Gray
        Start-Sleep -Seconds 3
        
        $response = Invoke-WebRequest -Uri "$($config.ApiUrl)/api/status" -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            Write-Host "  ✅ API Server started successfully (PID: $($serverProcess.Id))" -ForegroundColor Green
        }
    } catch {
        Write-Host "  ❌ Failed to start API server: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
}

# Step 2: Prepare test parameters
Write-Host "`n🎭 Preparing Playwright test..." -ForegroundColor Yellow

$testScriptPath = Join-Path $PSScriptRoot "dashboard-visual-test.cjs"
if (-not (Test-Path $testScriptPath)) {
    Write-Host "  ❌ Test script not found: $testScriptPath" -ForegroundColor Red
    exit 1
}

$nodeArgs = @(
    $testScriptPath,
    "--dashboard=$($config.DashboardPath)",
    "--screenshots=$($config.ScreenshotDir)"
)

if ($Headless) {
    $nodeArgs += "--headless"
}

if ($KeepOpen) {
    $nodeArgs += "--keep-open"
}

Write-Host "  ✅ Test script prepared" -ForegroundColor Green

# Step 3: Run Playwright test
Write-Host "`n🎬 Running visual tests..." -ForegroundColor Yellow
Write-Host ""

try {
    $npmPrefix = if (Test-Path (Join-Path $workspaceRoot "PlayWright\package.json")) {
        Join-Path $workspaceRoot "PlayWright"
    } else {
        $workspaceRoot
    }
    
    Push-Location $npmPrefix
    & node @nodeArgs
    $exitCode = $LASTEXITCODE
    Pop-Location
    
    Write-Host ""
    
    if ($exitCode -eq 0) {
        Write-Host "✅ All visual tests PASSED" -ForegroundColor Green
    } else {
        Write-Host "❌ Some visual tests FAILED" -ForegroundColor Red
    }
    
    Write-Host "`n📸 Screenshots saved to: $($config.ScreenshotDir)" -ForegroundColor Gray
    
} catch {
    Write-Host "❌ Error running Playwright test: $($_.Exception.Message)" -ForegroundColor Red
    $exitCode = 1
} finally {
    # Stop API server if we started it
    if ($serverProcess -and -not $KeepOpen) {
        Write-Host "`n🛑 Stopping API server (PID: $($serverProcess.Id))..." -ForegroundColor Yellow
        Stop-Process -Id $serverProcess.Id -Force -ErrorAction SilentlyContinue
        Write-Host "  ✅ API server stopped" -ForegroundColor Green
    }
}

Write-Host ""
exit $exitCode
