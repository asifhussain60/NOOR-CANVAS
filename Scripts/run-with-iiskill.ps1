# NOOR Canvas Development Run Script with IIS Express Kill
# This script automatically kills IIS Express processes before running to prevent port conflicts

Write-Host "NOOR Canvas Development Runner - Starting..." -ForegroundColor Green

# Step 1: Kill all IIS Express and NoorCanvas processes
Write-Host "Step 1: Killing IIS Express and NoorCanvas processes..." -ForegroundColor Yellow
try {
    # Kill IIS Express processes
    $iisProcesses = Get-Process -Name "*iisexpress*" -ErrorAction SilentlyContinue
    if ($iisProcesses) {
        Write-Host "Found $($iisProcesses.Count) IIS Express processes. Terminating..." -ForegroundColor Yellow
        $iisProcesses | Stop-Process -Force -ErrorAction SilentlyContinue
    }
    
    # Kill NoorCanvas processes
    $noorProcesses = Get-Process -Name "NoorCanvas" -ErrorAction SilentlyContinue
    if ($noorProcesses) {
        Write-Host "Found $($noorProcesses.Count) NoorCanvas processes. Terminating..." -ForegroundColor Yellow
        $noorProcesses | Stop-Process -Force -ErrorAction SilentlyContinue
    }
    
    # Kill dotnet processes running NoorCanvas
    $dotnetProcesses = Get-Process -Name "dotnet" -ErrorAction SilentlyContinue | Where-Object {
        $_.MainWindowTitle -like "*NoorCanvas*" -or $_.ProcessName -eq "dotnet"
    }
    if ($dotnetProcesses) {
        Write-Host "Found $($dotnetProcesses.Count) dotnet processes that might be NoorCanvas. Checking..." -ForegroundColor Yellow
        foreach ($proc in $dotnetProcesses) {
            try {
                $cmdLine = (Get-CimInstance Win32_Process -Filter "ProcessId = $($proc.Id)").CommandLine
                if ($cmdLine -like "*NoorCanvas*") {
                    Write-Host "Terminating dotnet process running NoorCanvas (PID: $($proc.Id))" -ForegroundColor Yellow
                    $proc | Stop-Process -Force -ErrorAction SilentlyContinue
                }
            } catch {
                # Skip if we can't get command line
            }
        }
    }
    
    Start-Sleep -Seconds 2
    Write-Host "All processes terminated successfully." -ForegroundColor Green
} catch {
    Write-Warning "Error killing processes: $($_.Exception.Message)"
}

# Step 2: Navigate to project directory and run
Write-Host "Step 2: Starting NOOR Canvas application..." -ForegroundColor Yellow
Push-Location "SPA\NoorCanvas"

try {
    Write-Host "Running with IIS Express..." -ForegroundColor Cyan
    Write-Host "Application will be available at:" -ForegroundColor Green
    Write-Host "  - HTTPS: https://localhost:9091" -ForegroundColor Cyan  
    Write-Host "  - HTTP:  http://localhost:9090" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Press Ctrl+C to stop the application" -ForegroundColor Yellow
    Write-Host "----------------------------------------" -ForegroundColor Gray
    
    dotnet run --launch-profile "IIS Express"
} catch {
    Write-Error "Failed to start application: $($_.Exception.Message)"
    exit 1
} finally {
    Pop-Location
}
