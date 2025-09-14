param(
    [switch]$Help,
    [switch]$Build,
    [switch]$NoBrowser,
    [int]$Port = 9093,
    [switch]$Stop
)

if ($Help) {
    Write-Host "NOOR Canvas Documentation Server (ncdoc) - DocFX Documentation" -ForegroundColor Green
    Write-Host "============================================================="
    Write-Host ""
    Write-Host "USAGE:"
    Write-Host "  ncdoc                   # Serve documentation and open browser"
    Write-Host "  ncdoc -Build            # Rebuild documentation first"
    Write-Host "  ncdoc -NoBrowser        # Don't open browser"
    Write-Host "  ncdoc -Port 8080        # Use different port"
    Write-Host "  ncdoc -Stop             # Stop documentation server"
    Write-Host ""
    Write-Host "DOCUMENTATION SECTIONS:"
    Write-Host "  - Host Token (Technical): Implementation details and API"
    Write-Host "  - Host Token (User Guide): Non-technical user instructions"
    Write-Host "  - Development Guides: Getting started and workflows"
    return
}

# Get paths
$root = Split-Path $MyInvocation.MyCommand.Path -Parent | Split-Path -Parent | Split-Path -Parent
$docfxPath = Join-Path $root "DocFX"

if (!(Test-Path $docfxPath)) {
    Write-Host "DocFX directory not found" -ForegroundColor Red
    return
}

# Handle stop request
if ($Stop) {
    Write-Host "Stopping documentation server on port $Port..." -ForegroundColor Yellow
    $processes = netstat -ano | Select-String ":$Port " | ForEach-Object {
        ($_ -split '\s+')[-1]
    } | Where-Object { $_ -match '^\d+$' }
    
    foreach ($processId in $processes) {
        Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
    }
    Write-Host "Server stopped" -ForegroundColor Green
    return
}

Write-Host "NOOR Canvas Documentation" -ForegroundColor Cyan
Write-Host "============================" -ForegroundColor Cyan

Set-Location $docfxPath

# Build if requested
if ($Build) {
    Write-Host "Building documentation..." -ForegroundColor Yellow
    docfx build
    Write-Host "Build complete" -ForegroundColor Green
}

# Check if server is running
$serverRunning = $false
try {
    $response = Invoke-WebRequest -Uri "http://localhost:$Port" -TimeoutSec 2 -UseBasicParsing -ErrorAction SilentlyContinue
    if ($response.StatusCode -eq 200) {
        $serverRunning = $true
    }
} catch {
    # Server not running
}

if ($serverRunning) {
    Write-Host "Documentation server already running on port $Port" -ForegroundColor Green
} else {
    Write-Host "Starting documentation server on port $Port..." -ForegroundColor Yellow
    
    # Start Python server
    Set-Location (Join-Path $docfxPath "_site")
    Start-Process -FilePath "python" -ArgumentList "-m", "http.server", $Port -WindowStyle Hidden
    Start-Sleep 3
    Write-Host "Documentation server started" -ForegroundColor Green
}

$docUrl = "http://localhost:$Port"
Write-Host ""
Write-Host "Documentation URL: $docUrl" -ForegroundColor White
Write-Host ""
Write-Host "Key Sections:" -ForegroundColor Cyan
Write-Host "   - Host Token Technical: $docUrl/articles/technical/host-token-system.html" -ForegroundColor Gray
Write-Host "   - Host Token User Guide: $docUrl/articles/development/host-token-quick-reference.html" -ForegroundColor Gray
Write-Host ""
Write-Host "Use 'ncdoc -Stop' to stop the server" -ForegroundColor Gray

if (-not $NoBrowser) {
    Write-Host "Opening documentation..." -ForegroundColor Yellow
    Start-Process $docUrl
}
