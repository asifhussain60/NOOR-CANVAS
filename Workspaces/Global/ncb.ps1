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
    Write-Host "  1. Kill all running NOOR Canvas, IIS Express, and dotnet processes"
    Write-Host "  2. Clear processes using ports 9090/9091"
    Write-Host "  3. Build the NOOR Canvas application in Release mode"
    Write-Host "  4. Launch with Kestrel server on ports 9090/9091"
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

# Step 1: Kill running processes (always, not just Force mode)
Write-Host "Cleaning up running NOOR Canvas processes..." -ForegroundColor Yellow

# Kill by process name (NoorCanvas executable)
Get-Process -Name "NoorCanvas" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

# Kill IIS Express processes
Get-Process -Name "iisexpress*" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

# Kill dotnet processes running NoorCanvas
Get-Process -Name "dotnet" -ErrorAction SilentlyContinue | Where-Object { 
    $_.CommandLine -like "*NoorCanvas*" 
} | Stop-Process -Force -ErrorAction SilentlyContinue

# Kill by port usage (anything using 9090/9091) - Force mode or if processes found
$portsToKill = @(9090, 9091)
$foundProcesses = $false
foreach ($port in $portsToKill) {
    $connections = netstat -ano | findstr ":$port" | findstr "LISTENING"
    foreach ($connection in $connections) {
        if ($connection -match '\s+(\d+)$') {
            $pid = $matches[1]
            $foundProcesses = $true
            try {
                $process = Get-Process -Id $pid -ErrorAction SilentlyContinue
                if ($process -and $process.ProcessName -ne "System") {
                    Write-Host "  Killing process $($process.ProcessName) (PID: $pid) using port $port" -ForegroundColor Gray
                    Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
                }
            }
            catch {
                # Process may already be terminated, continue
            }
        }
    }
}

if ($foundProcesses -or $Force) {
    Write-Host "  Waiting for processes to terminate..." -ForegroundColor Gray
    Start-Sleep -Seconds 3
} else {
    Start-Sleep -Seconds 1
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