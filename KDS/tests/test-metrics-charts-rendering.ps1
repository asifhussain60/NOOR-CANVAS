#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Test that metrics charts actually render with real data
.DESCRIPTION
    This test verifies:
    1. Charts are created with Chart.js instances
    2. Charts contain actual data (not empty/zero)
    3. Chart canvases are drawn on (pixels changed from default)
    4. All metric values populate correctly
    5. Charts respond to data updates
.EXAMPLE
    .\test-metrics-charts-rendering.ps1
#>

param(
    [switch]$Headless
)

$ErrorActionPreference = "Stop"
$workspaceRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent

Write-Host "`n📊 KDS Metrics Charts Rendering Test" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host ""

# Check API server
Write-Host "📡 Checking API Server..." -ForegroundColor Yellow
try {
    $null = Invoke-WebRequest -Uri "http://localhost:8765/api/status" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
    Write-Host "  ✅ API Server is running" -ForegroundColor Green
} catch {
    Write-Host "  ❌ API Server not running" -ForegroundColor Red
    Write-Host "  💡 Start with: .\KDS\scripts\launch-dashboard.ps1" -ForegroundColor Yellow
    exit 1
}

# Create Playwright test
$testScript = Join-Path $PSScriptRoot "test-metrics-charts.cjs"
if (-not (Test-Path $testScript)) {
    Write-Host "❌ Test script not found: $testScript" -ForegroundColor Red
    exit 1
}

$dashboardPath = Join-Path $PSScriptRoot "..\kds-dashboard.html"

try {
    $npmPrefix = if (Test-Path (Join-Path $workspaceRoot "PlayWright\package.json")) {
        Join-Path $workspaceRoot "PlayWright"
    } else {
        $workspaceRoot
    }
    
    Push-Location $npmPrefix
    & node $testScript $dashboardPath
    $exitCode = $LASTEXITCODE
    Pop-Location
} catch {
    Write-Host "❌ Test execution failed: $($_.Exception.Message)" -ForegroundColor Red
    $exitCode = 1
} finally {
    Pop-Location -ErrorAction SilentlyContinue
}

Write-Host ""
exit $exitCode
