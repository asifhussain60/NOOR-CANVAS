# NOOR Canvas Build (ncb) - Build and Launch with IIS Express x64
param(
    [switch]$Help,
    [switch]$Force,
    [int]$HttpPort = 9090,
    [int]$HttpsPort = 9091
)

Clear-Host

if ($Help) {
    Write-Host "NOOR Canvas Build (ncb) - Build and Launch Application" -ForegroundColor Cyan
    Write-Host "======================================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "DESCRIPTION:"
    Write-Host "  Builds the application and launches it with optimized configuration"
    Write-Host ""
    Write-Host "USAGE:"
    Write-Host "  ncb                    # Build and launch application"
    Write-Host "  ncb -Force             # Force kill all processes before building"
    Write-Host "  ncb -HttpPort 8080     # Use custom HTTP port"
    Write-Host "  ncb -HttpsPort 8443    # Use custom HTTPS port"
    Write-Host "  ncb -Help              # Show this help"
    Write-Host ""
    Write-Host "WORKFLOW:"
    Write-Host "  1. Kill all running IIS Express and dotnet processes"
    Write-Host "  2. Build the NOOR Canvas application in Release mode"
    Write-Host "  3. Launch with optimized Kestrel server"
    Write-Host ""
    Write-Host "FEATURES:"
    Write-Host "  - Automatic process cleanup (IIS Express + dotnet)"
    Write-Host "  - Full Release build before launch"
    Write-Host "  - Optimized Kestrel server with built artifacts"
    Write-Host "  - Configurable HTTP/HTTPS ports"
    Write-Host ""
    return
}

function Write-LogMessage {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "HH:mm:ss"
    $colors = @{
        "INFO" = "White"
        "SUCCESS" = "Green"
        "WARNING" = "Yellow"
        "ERROR" = "Red"
        "STEP" = "Cyan"
    }
    Write-Host "[$timestamp] $Message" -ForegroundColor $colors[$Level]
}

function Stop-IISExpressProcesses {
    Write-LogMessage "Killing all IIS Express processes..." "STEP"
    
    # Kill IIS Express processes
    $iisProcesses = Get-Process -Name "iisexpress*" -ErrorAction SilentlyContinue
    if ($iisProcesses) {
        $iisProcesses | ForEach-Object {
            Write-LogMessage "Stopping IIS Express process: $($_.Id)" "INFO"
            Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
        }
        Write-LogMessage "Killed $($iisProcesses.Count) IIS Express process(es)" "SUCCESS"
    } else {
        Write-LogMessage "No IIS Express processes found" "INFO"
    }
    
    # Also kill any dotnet processes if Force is specified
    if ($Force) {
        $dotnetProcesses = Get-Process -Name "dotnet" -ErrorAction SilentlyContinue | Where-Object {
            $_.MainModule.FileName -like "*dotnet*" -and $_.CommandLine -like "*NoorCanvas*"
        }
        if ($dotnetProcesses) {
            $dotnetProcesses | ForEach-Object {
                Write-LogMessage "Force stopping dotnet process: $($_.Id)" "WARNING"
                Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
            }
        }
    }
    
    # Wait for processes to fully terminate
    Start-Sleep -Seconds 2
}

function Build-Application {
    param([string]$ProjectPath)
    
    Write-LogMessage "Building NOOR Canvas application..." "STEP"
    
    if (-not (Test-Path $ProjectPath)) {
        Write-LogMessage "Project directory not found: $ProjectPath" "ERROR"
        exit 1
    }
    
    $projectFile = Join-Path $ProjectPath "NoorCanvas.csproj"
    if (-not (Test-Path $projectFile)) {
        Write-LogMessage "Project file not found: $projectFile" "ERROR"
        exit 1
    }
    
    # Change to project directory
    Push-Location $ProjectPath
    
    try {
        Write-LogMessage "Running dotnet build..." "INFO"
        dotnet build --configuration Release --verbosity minimal
        
        if ($LASTEXITCODE -ne 0) {
            Write-LogMessage "Build failed with exit code: $LASTEXITCODE" "ERROR"
            Write-Host ""
            Write-Host "Build Recovery Options:" -ForegroundColor Yellow
            Write-Host "  1. Try: ncb -Force" -ForegroundColor Gray
            Write-Host "  2. Check for compilation errors above" -ForegroundColor Gray
            Write-Host "  3. Clean and rebuild: dotnet clean && dotnet build" -ForegroundColor Gray
            exit 1
        }
        
        Write-LogMessage "Build completed successfully" "SUCCESS"
    }
    finally {
        Pop-Location
    }
}

function Start-ApplicationWithIIS {
    param(
        [string]$ProjectPath,
        [int]$HttpPort,
        [int]$HttpsPort
    )
    
    Write-LogMessage "Starting application with Kestrel server..." "STEP"
    
    # Set environment variables
    $env:ASPNETCORE_ENVIRONMENT = "Development"
    $env:ASPNETCORE_URLS = "https://localhost:$HttpsPort;http://localhost:$HttpPort"
    
    Write-LogMessage "Application will be available at:" "SUCCESS"
    Write-LogMessage "  HTTP:  http://localhost:$HttpPort" "SUCCESS"
    Write-LogMessage "  HTTPS: https://localhost:$HttpsPort" "SUCCESS"
    
    # Change to project directory and run
    Push-Location $ProjectPath
    
    try {
        Write-LogMessage "Launching built application..." "INFO"
        
        # Use the Release build we just created
        dotnet run --configuration Release --no-build --urls "https://localhost:$HttpsPort;http://localhost:$HttpPort"
    }
    finally {
        Pop-Location
    }
}

# Main Execution
Write-LogMessage "NOOR Canvas Build (ncb) - Starting..." "STEP"
Write-LogMessage "=======================================" "STEP"

# Get project directory
$root = Split-Path $MyInvocation.MyCommand.Path -Parent
$root = Split-Path $root -Parent  
$root = Split-Path $root -Parent
$project = Join-Path $root "SPA\NoorCanvas"

Write-LogMessage "Project directory: $project" "INFO"

# Step 1: Kill IIS Express processes
Stop-IISExpressProcesses

# Step 2: Build the application
Build-Application -ProjectPath $project

# Step 3: Start application with built artifacts
Start-ApplicationWithIIS -ProjectPath $project -HttpPort $HttpPort -HttpsPort $HttpsPort

Write-LogMessage "NCB (Noor Canvas Build) workflow completed!" "SUCCESS"
Write-Host ""
Write-Host "Quick Commands:" -ForegroundColor Cyan
Write-Host "  ncb        # Build and launch application" -ForegroundColor Gray
Write-Host "  ncb -Force # Force kill processes and rebuild" -ForegroundColor Gray
Write-Host "  ncb -Help  # Show detailed help" -ForegroundColor Gray