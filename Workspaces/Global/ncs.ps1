# NOOR Canvas Server - Wrapper for nc.ps1
# This script provides the 'ncs' command as an alias to the main nc.ps1 functionality

param(
    [Parameter(Position=0)]
    [int]$SessionId,
    [switch]$Help,
    [switch]$Build,
    [switch]$Kill,
    [switch]$SkipTokenGeneration,
    [switch]$ForceKill,
    [int]$PreferredHttpPort = 9090,
    [int]$PreferredHttpsPort = 9091
)

# Get the directory where this script is located
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ncScriptPath = Join-Path $scriptDir "nc.ps1"

if ($Help) {
    Write-Host "NOOR Canvas Server (NCS) - Wrapper Command" -ForegroundColor Green
    Write-Host "==========================================="
    Write-Host ""
    Write-Host "USAGE:"
    Write-Host "  ncs                    # Start server (ultra-fast, no build)"
    Write-Host "  ncs -Build             # Build and start server"
    Write-Host "  ncs -Kill              # Kill all NOOR Canvas processes"
    Write-Host "  ncs -Help              # Show this help"
    Write-Host ""
    Write-Host "This is a wrapper for nc.ps1 with additional build functionality."
    Write-Host ""
    
    # Show nc.ps1 help as well
    & $ncScriptPath -Help
    return
}

if ($Build) {
    Write-Host "NOOR Canvas Build & Start" -ForegroundColor Cyan
    Write-Host "========================="
    
    # Navigate to project directory
    $projectPath = "d:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas\NoorCanvas.csproj"
    
    if (Test-Path $projectPath) {
        Write-Host "Building project..." -ForegroundColor Yellow
        dotnet build $projectPath
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Build failed!" -ForegroundColor Red
            return
        }
        Write-Host "Build successful!" -ForegroundColor Green
    } else {
        Write-Host "Project file not found: $projectPath" -ForegroundColor Red
        return
    }
}

if ($Kill) {
    Write-Host "Killing all NOOR Canvas processes..." -ForegroundColor Yellow
    
    # Kill dotnet processes
    Get-Process -Name "dotnet*" -ErrorAction SilentlyContinue | Where-Object {
        $_.ProcessName -like "*dotnet*"
    } | Stop-Process -Force -ErrorAction SilentlyContinue
    
    # Kill IIS Express processes
    Get-Process -Name "iisexpress*" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    
    Write-Host "Process cleanup completed." -ForegroundColor Green
    return
}

# Call the main nc.ps1 script with all parameters
$params = @{}
if ($SessionId) { $params.SessionId = $SessionId }
if ($SkipTokenGeneration) { $params.SkipTokenGeneration = $true }
if ($ForceKill) { $params.ForceKill = $true }
if ($PreferredHttpPort -ne 9090) { $params.PreferredHttpPort = $PreferredHttpPort }
if ($PreferredHttpsPort -ne 9091) { $params.PreferredHttpsPort = $PreferredHttpsPort }

& $ncScriptPath @params