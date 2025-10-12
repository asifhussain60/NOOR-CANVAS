<#
.SYNOPSIS
    Deploy HostProvisioner to NoorCanvas website folder.

.DESCRIPTION
    This script builds and deploys the HostProvisioner tool to 
    D:\Websites\NOOR-CANVAS\HostProvisioner, making it part of the main
    deployment but in a separate subfolder.

.PARAMETER CleanDeploy
    Remove existing HostProvisioner deployment before deploying new version.

.EXAMPLE
    .\deploy-hostprovisioner.ps1
    Deploy HostProvisioner to website folder

.EXAMPLE
    .\deploy-hostprovisioner.ps1 -CleanDeploy
    Clean deploy (remove old version first)
#>

param(
    [switch]$CleanDeploy
)

$ErrorActionPreference = "Stop"

# Configuration
$WorkspaceRoot = Split-Path $PSScriptRoot -Parent
$ProjectPath = "$WorkspaceRoot\Tools\HostProvisioner\HostProvisioner"
$ProjectFile = "$ProjectPath\HostProvisioner.csproj"
$PublishPath = "$WorkspaceRoot\Workspaces\hostprovisioner-publish-temp"
$DeployPath = "D:\Websites\NOOR-CANVAS\HostProvisioner"
$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"

# Color functions
function Write-Step { param([string]$Message); Write-Host "`n[STEP] $Message" -ForegroundColor Cyan }
function Write-Success { param([string]$Message); Write-Host "[OK] $Message" -ForegroundColor Green }
function Write-Info { param([string]$Message); Write-Host "[INFO] $Message" -ForegroundColor Gray }
function Write-Warning { param([string]$Message); Write-Host "[WARN] $Message" -ForegroundColor Yellow }

try {
    Write-Host "`n========================================" -ForegroundColor Magenta
    Write-Host "  HostProvisioner Deployment" -ForegroundColor Magenta
    Write-Host "  Target: $DeployPath" -ForegroundColor Magenta
    Write-Host "  Time: $Timestamp" -ForegroundColor Magenta
    Write-Host "========================================`n" -ForegroundColor Magenta

    # Step 1: Verify project exists
    if (-not (Test-Path $ProjectFile)) {
        throw "HostProvisioner project not found: $ProjectFile"
    }
    Write-Success "HostProvisioner project found"

    # Step 2: Build and publish
    Write-Step "Building HostProvisioner..."
    
    if (Test-Path $PublishPath) {
        Remove-Item -Path $PublishPath -Recurse -Force
        Write-Info "Cleaned previous publish output"
    }

    $publishArgs = @(
        "publish"
        $ProjectFile
        "-c", "Release"
        "-o", $PublishPath
        "--no-self-contained"
    )

    Write-Info "Running: dotnet $($publishArgs -join ' ')"
    & dotnet $publishArgs

    if ($LASTEXITCODE -ne 0) {
        throw "Build failed with exit code $LASTEXITCODE"
    }

    Write-Success "HostProvisioner built successfully"

    # Step 3: Prepare deployment location
    Write-Step "Preparing deployment location..."
    
    if (Test-Path $DeployPath) {
        if ($CleanDeploy) {
            Write-Info "Clean deploy requested - removing existing deployment"
            Remove-Item -Path $DeployPath -Recurse -Force
        } else {
            Write-Info "Existing deployment found - will overwrite files"
        }
    }

    if (-not (Test-Path $DeployPath)) {
        New-Item -ItemType Directory -Path $DeployPath -Force | Out-Null
        Write-Success "Created deployment directory"
    }

    # Step 4: Copy files
    Write-Step "Deploying HostProvisioner files..."
    
    Copy-Item -Path "$PublishPath\*" -Destination $DeployPath -Recurse -Force
    Write-Success "Files deployed"

    # Step 5: Verify deployment
    Write-Step "Verifying deployment..."
    
    $deployedExe = Join-Path $DeployPath "HostProvisioner.exe"
    $deployedDll = Join-Path $DeployPath "HostProvisioner.dll"
    $deployedConfig = Join-Path $DeployPath "appsettings.json"
    
    $verifyResults = @()
    
    if (Test-Path $deployedExe) {
        $verifyResults += "HostProvisioner.exe"
    } else {
        throw "HostProvisioner.exe not found after deployment!"
    }
    
    if (Test-Path $deployedDll) {
        $verifyResults += "HostProvisioner.dll"
    }
    
    if (Test-Path $deployedConfig) {
        $verifyResults += "appsettings.json"
    }
    
    Write-Success "Verified $($verifyResults.Count) essential files"
    
    # Step 6: Check connection string in appsettings
    Write-Step "Checking configuration..."
    
    if (Test-Path $deployedConfig) {
        $config = Get-Content $deployedConfig -Raw | ConvertFrom-Json
        
        if ($config.ConnectionStrings.KSESSIONS) {
            Write-Success "KSESSIONS connection string found"
            Write-Info "Connection: $($config.ConnectionStrings.KSESSIONS)"
        } else {
            Write-Warning "KSESSIONS connection string not found in appsettings.json"
            Write-Warning "You may need to configure the connection string manually"
        }
    }

    # Step 7: Deployment summary
    Write-Step "Deployment Summary"
    
    Write-Host "`nDeployment Details:" -ForegroundColor Cyan
    Write-Host "  Location: $DeployPath" -ForegroundColor White
    Write-Host "  Files Deployed:" -ForegroundColor White
    
    $deployedFiles = Get-ChildItem -Path $DeployPath -File
    $deployedDirs = Get-ChildItem -Path $DeployPath -Directory
    
    Write-Host "    - $($deployedFiles.Count) files" -ForegroundColor Gray
    Write-Host "    - $($deployedDirs.Count) directories" -ForegroundColor Gray
    
    Write-Host "`n  Key Files:" -ForegroundColor White
    foreach ($file in $verifyResults) {
        Write-Host "    - $file" -ForegroundColor Green
    }

    # Step 8: Usage instructions
    Write-Host "`nUsage:" -ForegroundColor Cyan
    Write-Host "  Navigate to: $DeployPath" -ForegroundColor White
    Write-Host "  Run commands:" -ForegroundColor White
    Write-Host "    .\HostProvisioner.exe --help" -ForegroundColor Gray
    Write-Host "    .\HostProvisioner.exe create --session-id 123 --created-by 'User Name'" -ForegroundColor Gray

    Write-Host "`n========================================" -ForegroundColor Green
    Write-Host "  Deployment Complete!" -ForegroundColor Green
    Write-Host "========================================`n" -ForegroundColor Green
    
    Write-Success "HostProvisioner deployed to $DeployPath"

} catch {
    Write-Host "`n========================================" -ForegroundColor Red
    Write-Host "  DEPLOYMENT FAILED" -ForegroundColor Red
    Write-Host "========================================`n" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host "Stack: $($_.ScriptStackTrace)" -ForegroundColor Red
    exit 1
}
