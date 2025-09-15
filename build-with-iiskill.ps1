# NOOR Canvas Build Script with IIS Express Kill
# This script automatically kills IIS Express processes before building to prevent conflicts

Write-Host "NOOR Canvas Build Pipeline - Starting..." -ForegroundColor Green

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

# Step 2: Clean previous builds
Write-Host "Step 2: Cleaning previous builds..." -ForegroundColor Yellow
Push-Location "SPA\NoorCanvas"
try {
    dotnet clean --verbosity minimal
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Clean completed successfully." -ForegroundColor Green
    } else {
        Write-Error "Clean failed with exit code: $LASTEXITCODE"
        Pop-Location
        exit $LASTEXITCODE
    }
} catch {
    Write-Error "Clean operation failed: $($_.Exception.Message)"
    Pop-Location
    exit 1
}

# Step 3: Restore dependencies
Write-Host "Step 3: Restoring dependencies..." -ForegroundColor Yellow
try {
    dotnet restore --verbosity minimal
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Restore completed successfully." -ForegroundColor Green
    } else {
        Write-Error "Restore failed with exit code: $LASTEXITCODE"
        Pop-Location
        exit $LASTEXITCODE
    }
} catch {
    Write-Error "Restore operation failed: $($_.Exception.Message)"
    Pop-Location
    exit 1
}

# Step 4: Build the project
Write-Host "Step 4: Building project..." -ForegroundColor Yellow
try {
    dotnet build --configuration Release --verbosity minimal --no-restore
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Build completed successfully!" -ForegroundColor Green
    } else {
        Write-Error "Build failed with exit code: $LASTEXITCODE"
        Pop-Location
        exit $LASTEXITCODE
    }
} catch {
    Write-Error "Build operation failed: $($_.Exception.Message)"
    Pop-Location
    exit 1
}

Pop-Location

Write-Host "NOOR Canvas Build Pipeline - Completed Successfully!" -ForegroundColor Green
Write-Host "You can now run the application safely." -ForegroundColor Cyan
