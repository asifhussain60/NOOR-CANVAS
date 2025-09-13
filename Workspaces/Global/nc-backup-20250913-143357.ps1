param(
    [switch]$Help,
    [switch]$SkipTokenGeneration
)

if ($Help) {
    Write-Host "NOOR Canvas Command (nc) - Enhanced Workflow" -ForegroundColor Green
    Write-Host "============================================"
    Write-Host ""
    Write-Host "USAGE:"
    Write-Host "  nc                      # Full workflow: nct + build + IIS Express x64"  
    Write-Host "  nc -SkipTokenGeneration # Skip nct step, just build and IIS Express x64"
    Write-Host "  nc -Help                # Show this help"
    Write-Host ""
    Write-Host "WORKFLOW:"
    Write-Host "  1. Interactive Host Token Generation (nct)"
    Write-Host "  2. Project Build (dotnet build)"
    Write-Host "  3. IIS Express x64 Server (separate IIS Express window, no browser)"
    return
}

# Get project directory
$root = Split-Path $MyInvocation.MyCommand.Path -Parent
$root = Split-Path $root -Parent
$root = Split-Path $root -Parent
$project = Join-Path $root "SPA\NoorCanvas"

# Step 1: Host Token Generation
if (-not $SkipTokenGeneration) {
    Write-Host "Step 1: Host Token Generation" -ForegroundColor Cyan
    Write-Host "============================="
    Write-Host ""
    
    $nctPath = Join-Path $root "Workspaces\Global\nct.ps1"
    & $nctPath
    
    Write-Host ""
    Write-Host "Host token generation completed" -ForegroundColor Green
    Write-Host ""
    Write-Host "Press any key to continue to build..." -ForegroundColor Yellow
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    Write-Host ""
}

# Step 2: Build
Write-Host "Step 2: Building Project" -ForegroundColor Cyan  
Write-Host "========================"
Set-Location $project
Write-Host "Building NOOR Canvas..." -ForegroundColor Yellow

dotnet build --no-restore --verbosity minimal

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed - cannot proceed" -ForegroundColor Red
    return
}

Write-Host "Build successful" -ForegroundColor Green
Write-Host ""

# Step 3: Start IIS Express x64 in separate window
Write-Host "Step 3: Starting IIS Express Server" -ForegroundColor Cyan
Write-Host "===================================="

$url = "https://localhost:9091"
Write-Host "Starting IIS Express x64 on $url" -ForegroundColor Yellow
Write-Host "Server will run in separate IIS Express window (no browser)" -ForegroundColor Gray
Write-Host ""

# Find IIS Express x64
$iisExpressPath = "${env:ProgramFiles}\IIS Express\iisexpress.exe"
if (-not (Test-Path $iisExpressPath)) {
    $iisExpressPath = "${env:ProgramFiles(x86)}\IIS Express\iisexpress.exe"
    if (-not (Test-Path $iisExpressPath)) {
        Write-Host "IIS Express not found. Falling back to dotnet run..." -ForegroundColor Yellow
        dotnet run --urls $url
        return
    }
}

# Launch IIS Express x64 in separate window
$arguments = "/path:`"$project`" /port:9091 /systray:false"
Start-Process $iisExpressPath -ArgumentList $arguments

Write-Host "IIS Express x64 launched in separate window" -ForegroundColor Green
Write-Host "Application available at: $url" -ForegroundColor Cyan
