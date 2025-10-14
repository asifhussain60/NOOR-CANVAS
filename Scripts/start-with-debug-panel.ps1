# Start NoorCanvas in Development Mode with Debug Panel Support
# Purpose: Launch app in separate PowerShell window with proper environment configuration
# Usage: .\start-with-debug-panel.ps1

param(
    [switch]$KeepOpen = $false,  # Keep PowerShell window open after app stops
    [switch]$Verbose = $false     # Show detailed startup information
)

$ErrorActionPreference = "Stop"

Write-Host "=== Starting NoorCanvas with Debug Panel Support ===" -ForegroundColor Cyan
Write-Host ""

# Set environment variable
$env:ASPNETCORE_ENVIRONMENT = "Development"
Write-Host "✅ Set ASPNETCORE_ENVIRONMENT = Development" -ForegroundColor Green

# Navigate to project directory
$projectPath = "D:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas"
Set-Location $projectPath
Write-Host "✅ Changed to project directory: $projectPath" -ForegroundColor Green
Write-Host ""

if ($Verbose) {
    Write-Host "Configuration:" -ForegroundColor Yellow
    Write-Host "  - Environment: $env:ASPNETCORE_ENVIRONMENT" -ForegroundColor White
    Write-Host "  - Project: NoorCanvas.csproj" -ForegroundColor White
    Write-Host "  - Debug Panels: Enabled" -ForegroundColor White
    Write-Host "  - Debug Features: Enabled" -ForegroundColor White
    Write-Host ""
}

Write-Host "🚀 Launching NoorCanvas..." -ForegroundColor Cyan
Write-Host "   App will be available at: https://localhost:9091" -ForegroundColor Yellow
Write-Host "   Press Ctrl+C to stop the application" -ForegroundColor Yellow
Write-Host ""

# Launch the application
if ($KeepOpen) {
    dotnet run
    Write-Host ""
    Write-Host "Application stopped. Press any key to close..." -ForegroundColor Yellow
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
} else {
    dotnet run
}
