param(
    [switch]$Help,
    [switch]$Build,
    [switch]$Kill
)

Clear-Host

if ($Help) {
    Write-Host "NOOR Canvas Server (ncs) - Quick Application Server" -ForegroundColor Cyan
    Write-Host "===================================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "DESCRIPTION:"
    Write-Host "  Fastest way to serve the NOOR Canvas application"
    Write-Host ""
    Write-Host "USAGE:"
    Write-Host "  ncs                    # Serve application (no build, fastest)"
    Write-Host "  ncs -Build             # Build and serve application"
    Write-Host "  ncs -Kill              # Kill any running NC processes"
    Write-Host "  ncs -Help              # Show this help"
    Write-Host ""
    Write-Host "FEATURES:"
    Write-Host "  - Ultra-fast serving without building (default)"
    Write-Host "  - Automatic process cleanup before starting"
    Write-Host "  - Serves on https://localhost:9091 and http://localhost:9090"
    Write-Host "  - Background process management"
    Write-Host ""
    Write-Host "SHORTCUTS:"
    Write-Host "  ncs        = dotnet run --no-build --no-restore (fastest)"
    Write-Host "  ncs -Build = dotnet run (with build)"
    Write-Host "  ncs -Kill  = Kill all dotnet processes for NC"
    Write-Host ""
    Write-Host "URLS:"
    Write-Host "  Primary:   https://localhost:9091"
    Write-Host "  Secondary: http://localhost:9090"
    return
}

if ($Kill) {
    Write-Host "NOOR Canvas Server (ncs) - Process Cleanup" -ForegroundColor Yellow
    Write-Host "==========================================" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Killing any running NOOR Canvas processes..." -ForegroundColor Yellow
    
    # Find and kill dotnet processes running from NC directory
    $ncProcesses = Get-Process dotnet -ErrorAction SilentlyContinue | Where-Object {
        $_.MainModule.FileName -like "*NOOR CANVAS*" -or
        $_.CommandLine -like "*NoorCanvas*" -or
        (Get-CimInstance Win32_Process -Filter "ProcessId = $($_.Id)" -ErrorAction SilentlyContinue).CommandLine -like "*NoorCanvas*"
    }
    
    if ($ncProcesses) {
        foreach ($process in $ncProcesses) {
            Write-Host "Killing process $($process.Id): $($process.ProcessName)" -ForegroundColor Red
            Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
        }
        Write-Host ""
        Write-Host "All NOOR Canvas processes terminated" -ForegroundColor Green
    } else {
        Write-Host "No NOOR Canvas processes found running" -ForegroundColor Green
    }
    Write-Host ""
    return
}

Write-Host "NOOR Canvas Server (ncs) - Ultra-Fast Application Server" -ForegroundColor Green
Write-Host "=======================================================" -ForegroundColor Green
Write-Host ""

# Auto-cleanup any existing processes
Write-Host "Auto-cleanup: Checking for existing processes..." -ForegroundColor Yellow
$ncProcesses = Get-Process dotnet -ErrorAction SilentlyContinue | Where-Object {
    $_.MainModule.FileName -like "*NOOR CANVAS*" -or
    (Get-CimInstance Win32_Process -Filter "ProcessId = $($_.Id)" -ErrorAction SilentlyContinue).CommandLine -like "*NoorCanvas*"
}

if ($ncProcesses) {
    Write-Host "Found $($ncProcesses.Count) existing process(es). Terminating..." -ForegroundColor Yellow
    foreach ($process in $ncProcesses) {
        Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
    }
    Start-Sleep -Seconds 2
    Write-Host "Cleanup complete" -ForegroundColor Green
}

$originalLocation = Get-Location
try {
    Set-Location "D:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas"
    
    if ($Build) {
        Write-Host "Building and serving application..." -ForegroundColor Cyan
        Write-Host "Command: dotnet run --urls 'https://localhost:9091;http://localhost:9090'" -ForegroundColor Gray
        Write-Host ""
        & dotnet run --urls "https://localhost:9091;http://localhost:9090"
    } else {
        Write-Host "Ultra-fast serving (no build, no restore)..." -ForegroundColor Cyan
        Write-Host "Command: dotnet run --no-build --no-restore --urls 'https://localhost:9091;http://localhost:9090'" -ForegroundColor Gray
        Write-Host ""
        Write-Host "Tip: Use 'ncs -Build' if you made code changes" -ForegroundColor Yellow
        Write-Host ""
        & dotnet run --no-build --no-restore --urls "https://localhost:9091;http://localhost:9090"
    }
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "Server failed to start" -ForegroundColor Red
        Write-Host ""
        Write-Host "Troubleshooting:" -ForegroundColor Yellow
        Write-Host "1. Try 'ncs -Build' to build first" -ForegroundColor White
        Write-Host "2. Check if ports 9090/9091 are available" -ForegroundColor White
        Write-Host "3. Ensure project was built recently" -ForegroundColor White
    }
}
finally {
    Set-Location $originalLocation
}

Write-Host ""
Write-Host "Server URLs:" -ForegroundColor Cyan
Write-Host "  Primary:   https://localhost:9091" -ForegroundColor Green
Write-Host "  Secondary: http://localhost:9090" -ForegroundColor Green
Write-Host ""
Write-Host "Tip: Use 'ncs -Help' to see all available options" -ForegroundColor Cyan
