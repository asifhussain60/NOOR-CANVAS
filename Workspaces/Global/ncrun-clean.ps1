# NOOR Canvas Run Command
param(
    [switch]$Help,
    [switch]$Build,
    [switch]$NoBrowser,
    [string]$Port = "9090",
    [switch]$Https
)

if ($Help) {
    Write-Host "NOOR Canvas Run Command (ncrun)" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "USAGE:" -ForegroundColor Yellow
    Write-Host "  ncrun                    # Run app on localhost:9090 and open browser"
    Write-Host "  ncrun -Build             # Build first, then run"
    Write-Host "  ncrun -NoBrowser         # Run without opening browser"
    Write-Host "  ncrun -Port 9091         # Use custom port"
    Write-Host "  ncrun -Https             # Use HTTPS (port 9091)"
    Write-Host ""
    Write-Host "OPTIONS:" -ForegroundColor Yellow
    Write-Host "  -Help        Show this help message"
    Write-Host "  -Build       Build the application before running"
    Write-Host "  -NoBrowser   Don't open browser automatically" 
    Write-Host "  -Port        Specify custom port (default: 9090)"
    Write-Host "  -Https       Use HTTPS on port 9091"
    return
}

# Determine paths
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootDir = Split-Path -Parent (Split-Path -Parent $scriptDir)
$targetDir = Join-Path $rootDir "SPA\NoorCanvas"

Write-Host "🚀 NOOR Canvas Launcher" -ForegroundColor Cyan
Write-Host "Target Directory: $targetDir" -ForegroundColor Gray

# Verify target directory exists
if (-not (Test-Path $targetDir)) {
    Write-Error "Target directory not found: $targetDir"
    return 1
}

# Change to target directory
Set-Location $targetDir
Write-Host "📁 Changed to: $(Get-Location)" -ForegroundColor Green

# Build if requested
if ($Build) {
    Write-Host "🔨 Building application..." -ForegroundColor Yellow
    dotnet build --no-restore
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Build failed"
        return $LASTEXITCODE
    }
    Write-Host "✅ Build successful" -ForegroundColor Green
}

# Configure URLs
if ($Https) {
    $Port = "9091"
    $urls = "https://localhost:$Port"
    $browserUrl = "https://localhost:$Port"
} else {
    $urls = "http://localhost:$Port"
    $browserUrl = "http://localhost:$Port"
}

Write-Host "🌐 Starting server on: $urls" -ForegroundColor Cyan

# Open browser if requested
if (-not $NoBrowser) {
    Write-Host "🌐 Will open browser to: $browserUrl" -ForegroundColor Green
    Start-Job -ScriptBlock {
        param($url)
        Start-Sleep -Seconds 3
        Start-Process $url
    } -ArgumentList $browserUrl | Out-Null
}

# Start the application
Write-Host "▶️ Starting NOOR Canvas application..." -ForegroundColor Green
Write-Host "   URL: $browserUrl" -ForegroundColor Cyan
Write-Host "   Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

dotnet run --urls $urls
