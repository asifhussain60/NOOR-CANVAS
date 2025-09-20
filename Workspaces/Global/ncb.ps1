# NOOR Canvas Build (ncb) - Build and Launch with IIS Express x64
param(
    [switch]$Help,
    [switch]$Force
)

Clear-Host

if ($Help) {
    Write-Host "NOOR Canvas Build (ncb) - Build and Launch Application" -ForegroundColor Cyan
    Write-Host "======================================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "DESCRIPTION:"
    Write-Host "  Builds the application and then calls nc to launch with IIS Express x64"
    Write-Host ""
    Write-Host "USAGE:"
    Write-Host "  ncb                    # Build and launch application"
    Write-Host "  ncb -Force             # Force kill all processes before building"
    Write-Host "  ncb -Help              # Show this help"
    Write-Host ""
    Write-Host "WORKFLOW:"
    Write-Host "  1. Kill all running IIS Express and dotnet processes"
    Write-Host "  2. Build the NOOR Canvas application in Release mode"
    Write-Host "  3. Launch with IIS Express x64 on ports 9090/9091"
    Write-Host ""
    return
}

# Simple implementation - just build and run
Write-Host "NOOR Canvas Build (ncb) - Starting..." -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan

# Get project directory
$root = Split-Path $MyInvocation.MyCommand.Path -Parent
$root = Split-Path $root -Parent  
$root = Split-Path $root -Parent
$project = Join-Path $root "SPA\NoorCanvas"

Write-Host "Project directory: $project" -ForegroundColor White

# Step 1: Kill running processes if Force is specified
if ($Force) {
    Write-Host "Force mode: Killing IIS Express and dotnet processes..." -ForegroundColor Yellow
    Get-Process -Name "iisexpress*" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    Get-Process -Name "dotnet" -ErrorAction SilentlyContinue | Where-Object { 
        $_.CommandLine -like "*NoorCanvas*" 
    } | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
}

# Step 2: Build the application
Write-Host "Building NOOR Canvas application..." -ForegroundColor Cyan
Push-Location $project

try {
    dotnet build --configuration Release --verbosity minimal
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Build failed!" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "Build completed successfully!" -ForegroundColor Green
} finally {
    Pop-Location
}

# Step 3: Launch application with Kestrel
Write-Host "Launching ASP.NET Core application with Kestrel..." -ForegroundColor Cyan
$ncPath = Join-Path $root "Workspaces\Global\nc.ps1"

if (Test-Path $ncPath) {
    & $ncPath
} else {
    Write-Host "ERROR: nc.ps1 not found, running directly..." -ForegroundColor Yellow
    Push-Location $project
    try {
        $env:ASPNETCORE_URLS = "https://localhost:9091;http://localhost:9090"
        dotnet run --configuration Release --no-build --urls "https://localhost:9091;http://localhost:9090"
    } finally {
        Pop-Location
    }
}

Write-Host "NCB completed!" -ForegroundColor Green