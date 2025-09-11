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
    Write-Host "  ncrun                    # Run app and open browser"
    Write-Host "  ncrun -Build             # Build first, then run"
    Write-Host "  ncrun -NoBrowser         # Run without opening browser"
    Write-Host "  ncrun -Https             # Use HTTPS on port 9091"
    Write-Host "  ncrun -Port 8080         # Use custom port"
    Write-Host ""
    Write-Host "EXAMPLES:" -ForegroundColor Green
    Write-Host "  ncrun                    # Quick start"
    Write-Host "  ncrun -Build             # Clean build and run"
    return
}

Write-Host "🚀 NOOR Canvas Launcher" -ForegroundColor Cyan

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootDir = Split-Path -Parent (Split-Path -Parent $scriptDir)
$targetDir = Join-Path $rootDir "SPA\NoorCanvas"

if (-not (Test-Path $targetDir)) {
    Write-Error "Target not found: $targetDir"
    return 1
}

Set-Location $targetDir
Write-Host "📁 Changed to: $(Get-Location)" -ForegroundColor Green

if ($Build) {
    Write-Host "🔨 Building..." -ForegroundColor Yellow
    dotnet build --no-restore
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Build failed"
        return $LASTEXITCODE
    }
    Write-Host "✅ Build successful" -ForegroundColor Green
}

if ($Https) {
    $urls = "https://localhost:9091"
    $browserUrl = "https://localhost:9091"
} else {
    $urls = "http://localhost:$Port"
    $browserUrl = "http://localhost:$Port"
}

Write-Host "🌐 Starting: $urls" -ForegroundColor Cyan

if (-not $NoBrowser) {
    Write-Host "🌐 Opening browser..." -ForegroundColor Green
    Start-Job -ScriptBlock {
        param($url)
        Start-Sleep -Seconds 3
        Start-Process $url
    } -ArgumentList $browserUrl | Out-Null
}

Write-Host "▶️ Starting NOOR Canvas..." -ForegroundColor Green
Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow

dotnet run --urls $urls
