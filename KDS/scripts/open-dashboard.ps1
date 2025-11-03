# KDS Dashboard Launcher
# Purpose: Open KDS health dashboard in default browser
# Usage: .\open-dashboard.ps1 [-AutoRefresh]

param(
    [switch]$AutoRefresh,
    [int]$RefreshSeconds = 30
)

$ErrorActionPreference = 'Stop'

# Paths
$scriptDir = $PSScriptRoot
$workspaceRoot = Split-Path (Split-Path $scriptDir -Parent) -Parent
$dashboardPath = Join-Path $workspaceRoot "KDS\kds-dashboard.html"

# Verify dashboard exists
if (-not (Test-Path $dashboardPath)) {
    Write-Host "❌ Error: Dashboard not found at $dashboardPath" -ForegroundColor Red
    exit 1
}

Write-Host "🧠 Opening KDS Dashboard..." -ForegroundColor Cyan

# Build URL
$url = "file:///$($dashboardPath.Replace('\', '/'))"

if ($AutoRefresh) {
    $url += "?refresh=$RefreshSeconds"
    Write-Host "  Auto-refresh enabled: $RefreshSeconds seconds" -ForegroundColor Gray
}

# Open in browser
Start-Process $url

Write-Host "✅ Dashboard opened successfully" -ForegroundColor Green
Write-Host ""
Write-Host "Dashboard URL: $url" -ForegroundColor Gray
