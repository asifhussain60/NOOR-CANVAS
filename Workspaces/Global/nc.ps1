# NOOR Canvas (nc) - Simple Kestrel launcher for ASP.NET Core Blazor Server
param(
    [switch]$Help
)

if ($Help) {
    Write-Host "NOOR Canvas (nc) - ASP.NET Core Kestrel Launcher" -ForegroundColor Cyan
    Write-Host "================================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "DESCRIPTION:"
    Write-Host "  Launches NOOR Canvas ASP.NET Core Blazor Server application with Kestrel"
    Write-Host "  Automatically kills existing NOOR Canvas processes and clears ports 9090/9091"
    Write-Host ""
    Write-Host "USAGE:"
    Write-Host "  nc                     # Launch with Kestrel server"
    Write-Host "  nc -Help               # Show this help"
    Write-Host ""
    Write-Host "PORTS:"
    Write-Host "  HTTP:  http://localhost:9090"
    Write-Host "  HTTPS: https://localhost:9091"
    Write-Host ""
    return
}

Write-Host "NOOR Canvas - ASP.NET Core Kestrel Launcher" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan

# Get project directory
$root = Split-Path $MyInvocation.MyCommand.Path -Parent
$root = Split-Path $root -Parent  
$root = Split-Path $root -Parent
$project = Join-Path $root "SPA\NoorCanvas"

Write-Host "Project directory: $project" -ForegroundColor White

# Kill any existing processes for this project
Write-Host "Cleaning up existing NOOR Canvas processes..." -ForegroundColor Yellow

# Kill by process name (NoorCanvas executable)
Get-Process -Name "NoorCanvas" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

# Kill by process name (dotnet processes running NoorCanvas)
Get-Process -Name "dotnet" -ErrorAction SilentlyContinue | Where-Object { 
    $_.CommandLine -like "*NoorCanvas*" 
} | Stop-Process -Force -ErrorAction SilentlyContinue

# Kill by port usage (anything using 9090/9091)
$portsToKill = @(9090, 9091)
foreach ($port in $portsToKill) {
    $connections = netstat -ano | findstr ":$port" | findstr "LISTENING"
    foreach ($connection in $connections) {
        if ($connection -match '\s+(\d+)$') {
            $pid = $matches[1]
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

Start-Sleep -Seconds 2

# Set up the URLs
$httpUrl = "http://localhost:9090"
$httpsUrl = "https://localhost:9091"

Write-Host "Launching ASP.NET Core application with Kestrel:" -ForegroundColor Green
Write-Host "  HTTP:  $httpUrl" -ForegroundColor Green
Write-Host "  HTTPS: $httpsUrl" -ForegroundColor Green
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Change to project directory and run with dotnet
Push-Location $project

try {
    # Set environment variable for URLs
    $env:ASPNETCORE_URLS = "$httpsUrl;$httpUrl"
    
    # Launch the ASP.NET Core application  
    # Use --no-launch-profile to avoid browser auto-launch which can cause issues in background execution
    Write-Host "Starting application..." -ForegroundColor Green
    
    # Optimized approach: Always try without restore first
    # This avoids Norton antivirus issues when packages are already restored
    Write-Host "Attempting launch without package restore (Norton-friendly)..." -ForegroundColor Gray
    
    # Start a background job to try --no-restore first
    $job = Start-Job -ScriptBlock {
        param($projectPath, $urls)
        Set-Location $projectPath
        & dotnet run --no-restore --no-launch-profile --urls $urls
    } -ArgumentList $project, "$httpsUrl;$httpUrl"
    
    # Wait briefly to see if it starts successfully
    Start-Sleep -Seconds 3
    
    if ($job.State -eq "Running") {
        Write-Host "✅ Application started successfully without package restore!" -ForegroundColor Green
        Write-Host "   (Norton antivirus avoided)" -ForegroundColor Gray
        # Wait for the job to complete (i.e., until Ctrl+C is pressed)
        Wait-Job $job | Out-Null
        Remove-Job $job -Force
    } else {
        Write-Host "⚠️  Launch without restore failed, trying with restore..." -ForegroundColor Yellow
        Write-Host "   (Package restore may trigger Norton antivirus briefly)" -ForegroundColor Gray
        Remove-Job $job -Force
        # Fallback to normal dotnet run which includes restore
        dotnet run --no-launch-profile --urls "$httpsUrl;$httpUrl"
    }
} finally {
    Pop-Location
}