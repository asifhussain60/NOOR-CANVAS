# Test Dashboard Loading States
# Purpose: Verify that dashboard shows visual feedback during loading/refresh
# Created: 2025-11-03

param(
    [switch]$Headless = $false
)

$ErrorActionPreference = 'Stop'

Write-Host "🧪 Testing Dashboard Loading States" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Gray
Write-Host ""

# Paths
$scriptDir = $PSScriptRoot
$workspaceRoot = Split-Path (Split-Path $scriptDir -Parent) -Parent
$dashboardPath = Join-Path $workspaceRoot "KDS\kds-dashboard.html"

# Verify dashboard exists
if (-not (Test-Path $dashboardPath)) {
    Write-Host "❌ Error: Dashboard not found at $dashboardPath" -ForegroundColor Red
    exit 1
}

Write-Host "📋 Test Plan:" -ForegroundColor Cyan
Write-Host "  1. Open dashboard without API server (should show loading)" -ForegroundColor Gray
Write-Host "  2. Verify stats start at 0" -ForegroundColor Gray
Write-Host "  3. Verify loading overlay appears" -ForegroundColor Gray
Write-Host "  4. Verify progress bar appears on refresh" -ForegroundColor Gray
Write-Host "  5. Verify refresh button becomes disabled during refresh" -ForegroundColor Gray
Write-Host ""

# Test 1: Open dashboard and check initial state
Write-Host "Test 1: Initial Loading State" -ForegroundColor Cyan
Write-Host "  Opening dashboard in browser..." -ForegroundColor Gray

$url = "file:///$($dashboardPath.Replace('\', '/'))"
Start-Process $url

Write-Host "  ✅ Dashboard opened" -ForegroundColor Green
Write-Host ""

# Manual verification instructions
Write-Host "=" * 60 -ForegroundColor Yellow
Write-Host "🔍 MANUAL VERIFICATION REQUIRED" -ForegroundColor Yellow
Write-Host "=" * 60 -ForegroundColor Yellow
Write-Host ""
Write-Host "Please verify the following in the browser:" -ForegroundColor Cyan
Write-Host ""
Write-Host "Initial Load:" -ForegroundColor White
Write-Host "  ✓ Loading overlay appears with 'Initializing Dashboard...'" -ForegroundColor Gray
Write-Host "  ✓ Progress bar appears at the top of the page" -ForegroundColor Gray
Write-Host "  ✓ All stats start at 0/0" -ForegroundColor Gray
Write-Host "  ✓ Overall Status shows 'UNKNOWN'" -ForegroundColor Gray
Write-Host ""

Write-Host "After Clicking Refresh Button:" -ForegroundColor White
Write-Host "  ✓ Loading overlay appears with 'Running Health Checks...'" -ForegroundColor Gray
Write-Host "  ✓ Progress bar animates at the top" -ForegroundColor Gray
Write-Host "  ✓ Refresh button shows spinning icon and is disabled" -ForegroundColor Gray
Write-Host "  ✓ Stats reset to 0 before loading new data" -ForegroundColor Gray
Write-Host "  ✓ Loading messages update (Connecting → Running → Processing)" -ForegroundColor Gray
Write-Host ""

Write-Host "Connection Error (no API server):" -ForegroundColor White
Write-Host "  ✓ Error message shows 'Connection Failed'" -ForegroundColor Gray
Write-Host "  ✓ Retry button is available" -ForegroundColor Gray
Write-Host "  ✓ Loading overlay disappears after error" -ForegroundColor Gray
Write-Host ""

Write-Host "=" * 60 -ForegroundColor Yellow
Write-Host ""

Write-Host "💡 Tips:" -ForegroundColor Cyan
Write-Host "  • To test with API server: .\KDS\scripts\launch-dashboard.ps1" -ForegroundColor Gray
Write-Host "  • To test without API server: Open dashboard directly (current state)" -ForegroundColor Gray
Write-Host "  • Click Refresh multiple times to see loading states" -ForegroundColor Gray
Write-Host "  • Check browser DevTools console for detailed logs" -ForegroundColor Gray
Write-Host ""

Write-Host "📊 Expected Behavior Summary:" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Initial Load:" -ForegroundColor White
Write-Host "    1. Loading overlay shows immediately" -ForegroundColor Gray
Write-Host "    2. Stats display as 0/0" -ForegroundColor Gray
Write-Host "    3. Attempts to connect to API" -ForegroundColor Gray
Write-Host "    4. Shows appropriate message based on API availability" -ForegroundColor Gray
Write-Host ""
Write-Host "  Refresh Action:" -ForegroundColor White
Write-Host "    1. Button becomes disabled with spinning icon" -ForegroundColor Gray
Write-Host "    2. Progress bar appears and animates" -ForegroundColor Gray
Write-Host "    3. Loading overlay shows with detailed status" -ForegroundColor Gray
Write-Host "    4. Stats reset to 0" -ForegroundColor Gray
Write-Host "    5. After completion, all elements return to normal" -ForegroundColor Gray
Write-Host ""

Write-Host "=" * 60 -ForegroundColor Gray
Write-Host "✅ Test script complete - Browser verification required" -ForegroundColor Green
Write-Host ""

