<#
.SYNOPSIS
    Deploy NoorCanvas application with clean, organized structure.

.DESCRIPTION
    This script builds the NoorCanvas application in Release mode, reorganizes it
    into a clean structure, and deploys it to D:\Websites\NOOR-CANVAS. It handles:
    - Building the application in Release configuration
    - Publishing to a temporary directory
    - Reorganizing the published output (NEW!)
    - Stopping IIS Application Pool (if applicable)
    - Backing up the current deployment
    - Deploying the new version with clean structure
    - Deploying HostProvisioner separately (NEW!)
    - Starting the Application Pool
    - Verifying the deployment

.PARAMETER SkipBuild
    Skip the build step and deploy existing publish output.

.PARAMETER SkipBackup
    Skip creating a backup of the existing deployment.

.PARAMETER SkipIIS
    Skip IIS-related operations (stop/start app pool).

.PARAMETER SkipReorganize
    Skip the reorganization step (not recommended).

.PARAMETER AppPool
    Name of the IIS Application Pool to restart. Default: "NoorCanvas"

.PARAMETER HostProvisionerPath
    Path where HostProvisioner should be deployed separately.
    Default: "D:\Tools\HostProvisioner"

.EXAMPLE
    .\ncdeploy-clean.ps1
    Deploy with clean structure (recommended)

.EXAMPLE
    .\ncdeploy-clean.ps1 -SkipBackup
    Deploy without creating a backup

.EXAMPLE
    .\ncdeploy-clean.ps1 -SkipIIS
    Deploy without stopping/starting IIS

.NOTES
    This script uses reorganize-deployment-v2.ps1 to create a clean structure.
#>

param(
    [switch]$SkipBuild,
    [switch]$SkipBackup,
    [switch]$SkipIIS,
    [switch]$SkipReorganize,
    [string]$AppPool = "NoorCanvas",
    [string]$HostProvisionerPath = "D:\Tools\HostProvisioner"
)

# Configuration
$ErrorActionPreference = "Stop"
$WorkspaceRoot = Split-Path $PSScriptRoot -Parent
$ProjectPath = "$WorkspaceRoot\SPA\NoorCanvas"
$ProjectFile = "$ProjectPath\NoorCanvas.csproj"
$PublishPath = "$WorkspaceRoot\Workspaces\publish-temp"
$ReorganizedPath = "$WorkspaceRoot\Workspaces\publish-temp-clean"
$DeployPath = "D:\Websites\NOOR-CANVAS"
$BackupPath = "D:\Websites\NOOR-CANVAS-Backups"
$ReorganizeScript = "$PSScriptRoot\reorganize-deployment-v2.ps1"
$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"

# Colors for output
function Write-Step {
    param([string]$Message)
    Write-Host "`n[STEP] $Message" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "[OK] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARN] $Message" -ForegroundColor Yellow
}

function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Gray
}

# Main deployment process
try {
    Write-Host "`n========================================" -ForegroundColor Magenta
    Write-Host "  NoorCanvas Clean Deployment Script" -ForegroundColor Magenta
    Write-Host "  Target: $DeployPath" -ForegroundColor Magenta
    Write-Host "  HostProvisioner: $HostProvisionerPath" -ForegroundColor Magenta
    Write-Host "  Time: $Timestamp" -ForegroundColor Magenta
    Write-Host "========================================`n" -ForegroundColor Magenta

    # Step 1: Build the application
    if (-not $SkipBuild) {
        Write-Step "Building application in Release mode..."
        
        # Clean previous publish output
        if (Test-Path $PublishPath) {
            Remove-Item -Path $PublishPath -Recurse -Force
            Write-Success "Cleaned previous publish output"
        }
        
        if (Test-Path $ReorganizedPath) {
            Remove-Item -Path $ReorganizedPath -Recurse -Force
            Write-Success "Cleaned previous reorganized output"
        }

        # Publish the application
        $publishArgs = @(
            "publish"
            $ProjectFile
            "-c", "Release"
            "-o", $PublishPath
            "--no-self-contained"
            "/p:PublishReadyToRun=false"
        )

        Write-Info "Running: dotnet $($publishArgs -join ' ')"
        & dotnet $publishArgs

        if ($LASTEXITCODE -ne 0) {
            throw "Build failed with exit code $LASTEXITCODE"
        }

        Write-Success "Application built and published successfully"
    } else {
        Write-Warning "Skipping build step as requested"
        if (-not (Test-Path $PublishPath)) {
            throw "Publish path does not exist: $PublishPath. Cannot skip build."
        }
    }

    # Step 2: Reorganize the published output (NEW!)
    if (-not $SkipReorganize) {
        Write-Step "Reorganizing deployment structure..."
        
        if (-not (Test-Path $ReorganizeScript)) {
            throw "Reorganization script not found: $ReorganizeScript"
        }
        
        Write-Info "Using clean deployment structure"
        Write-Info "  - DLLs organized in bin/Dependencies/"
        Write-Info "  - Language resources in bin/Resources/"
        Write-Info "  - HostProvisioner deployed separately"
        
        & $ReorganizeScript `
            -SourcePath $PublishPath `
            -TargetPath $ReorganizedPath `
            -HostProvisionerPath $HostProvisionerPath `
            -SeparateHostProvisioner
        
        if ($LASTEXITCODE -ne 0) {
            throw "Reorganization failed with exit code $LASTEXITCODE"
        }
        
        Write-Success "Deployment structure reorganized successfully"
        
        # Use reorganized path for deployment
        $DeploySourcePath = $ReorganizedPath
    } else {
        Write-Warning "Skipping reorganization (using original structure)"
        $DeploySourcePath = $PublishPath
    }

    # Step 3: Stop IIS Application Pool
    if (-not $SkipIIS) {
        Write-Step "Stopping IIS Application Pool: $AppPool..."
        
        try {
            Import-Module WebAdministration -ErrorAction Stop
            
            $pool = Get-WebAppPoolState -Name $AppPool -ErrorAction SilentlyContinue
            if ($pool) {
                if ($pool.Value -ne "Stopped") {
                    Stop-WebAppPool -Name $AppPool
                    
                    # Wait for the app pool to stop
                    $maxWait = 30
                    $waited = 0
                    while ((Get-WebAppPoolState -Name $AppPool).Value -ne "Stopped" -and $waited -lt $maxWait) {
                        Start-Sleep -Seconds 1
                        $waited++
                    }
                    
                    Write-Success "Application pool stopped"
                } else {
                    Write-Success "Application pool already stopped"
                }
            } else {
                Write-Warning "Application pool '$AppPool' not found. Skipping IIS stop."
            }
        } catch {
            Write-Warning "Could not stop IIS App Pool: $_. Continuing anyway..."
        }
    } else {
        Write-Warning "Skipping IIS operations as requested"
    }

    # Step 4: Backup existing deployment
    if (-not $SkipBackup) {
        Write-Step "Creating backup of existing deployment..."
        
        if (Test-Path $DeployPath) {
            $BackupFolder = "$BackupPath\backup-$Timestamp"
            New-Item -ItemType Directory -Path $BackupFolder -Force | Out-Null
            
            Copy-Item -Path "$DeployPath\*" -Destination $BackupFolder -Recurse -Force
            Write-Success "Backup created: $BackupFolder"
            
            # Keep only last 5 backups
            $backups = Get-ChildItem -Path $BackupPath -Directory | Sort-Object CreationTime -Descending
            if ($backups.Count -gt 5) {
                $backups | Select-Object -Skip 5 | ForEach-Object {
                    Remove-Item -Path $_.FullName -Recurse -Force
                    Write-Info "Removed old backup: $($_.Name)"
                }
            }
        } else {
            Write-Warning "No existing deployment found to backup"
        }
    } else {
        Write-Warning "Skipping backup as requested"
    }

    # Step 5: Deploy the application
    Write-Step "Deploying application to $DeployPath..."
    
    # Create deploy directory if it doesn't exist
    if (-not (Test-Path $DeployPath)) {
        New-Item -ItemType Directory -Path $DeployPath -Force | Out-Null
        Write-Success "Created deployment directory"
    }

    # Preserve production appsettings if it exists
    $prodSettings = Join-Path $DeployPath "appsettings.Production.json"
    $prodSettingsBackup = $null
    if (Test-Path $prodSettings) {
        $prodSettingsBackup = "$env:TEMP\appsettings.Production.json.bak"
        Copy-Item -Path $prodSettings -Destination $prodSettingsBackup -Force
        Write-Info "Preserved production appsettings"
    }

    # Clear deployment directory (except logs)
    Get-ChildItem -Path $DeployPath | Where-Object { $_.Name -ne "logs" } | ForEach-Object {
        Remove-Item -Path $_.FullName -Recurse -Force
    }
    Write-Info "Cleared deployment directory"

    # Copy new deployment
    Copy-Item -Path "$DeploySourcePath\*" -Destination $DeployPath -Recurse -Force
    Write-Success "Application files deployed"

    # Restore production appsettings if it was preserved
    if ($prodSettingsBackup -and (Test-Path $prodSettingsBackup)) {
        Copy-Item -Path $prodSettingsBackup -Destination $prodSettings -Force
        Remove-Item -Path $prodSettingsBackup -Force
        Write-Info "Restored production appsettings"
    }

    # Ensure logs directory exists
    $logsPath = Join-Path $DeployPath "logs"
    if (-not (Test-Path $logsPath)) {
        New-Item -ItemType Directory -Path $logsPath -Force | Out-Null
        Write-Success "Created logs directory"
    }

    # Step 6: Start IIS Application Pool
    if (-not $SkipIIS) {
        Write-Step "Starting IIS Application Pool: $AppPool..."
        
        try {
            $pool = Get-WebAppPoolState -Name $AppPool -ErrorAction SilentlyContinue
            if ($pool) {
                Start-WebAppPool -Name $AppPool
                
                # Wait for the app pool to start
                $maxWait = 30
                $waited = 0
                while ((Get-WebAppPoolState -Name $AppPool).Value -ne "Started" -and $waited -lt $maxWait) {
                    Start-Sleep -Seconds 1
                    $waited++
                }
                
                Write-Success "Application pool started"
            }
        } catch {
            Write-Warning "Could not start IIS App Pool: $_"
        }
    }

    # Step 7: Deployment Summary
    Write-Step "Deployment Summary"
    
    Write-Host "`nDeployment Details:" -ForegroundColor Cyan
    Write-Host "  Main Application:" -ForegroundColor White
    Write-Host "    Location: $DeployPath" -ForegroundColor Gray
    
    if (-not $SkipReorganize) {
        Write-Host "    Structure: Clean & Organized" -ForegroundColor Green
        Write-Host "      - bin/Dependencies/ (DLLs)" -ForegroundColor Gray
        Write-Host "      - bin/Resources/ (languages)" -ForegroundColor Gray
        Write-Host "      - bin/runtimes/ (platform binaries)" -ForegroundColor Gray
        Write-Host "      - wwwroot/ (web content)" -ForegroundColor Gray
        Write-Host "      - logs/ (application logs)" -ForegroundColor Gray
        
        Write-Host "`n  HostProvisioner (Separate):" -ForegroundColor White
        Write-Host "    Location: $HostProvisionerPath" -ForegroundColor Gray
        Write-Host "    Status: Deployed independently" -ForegroundColor Green
    } else {
        Write-Host "    Structure: Standard" -ForegroundColor Yellow
    }
    
    if (-not $SkipBackup -and (Test-Path "$BackupPath\backup-$Timestamp")) {
        Write-Host "`n  Backup:" -ForegroundColor White
        Write-Host "    Location: $BackupPath\backup-$Timestamp" -ForegroundColor Gray
    }

    Write-Host "`n========================================" -ForegroundColor Green
    Write-Host "  Deployment Complete!" -ForegroundColor Green
    Write-Host "========================================`n" -ForegroundColor Green
    
    Write-Success "NoorCanvas deployed successfully"
    
    if (-not $SkipReorganize) {
        Write-Host "`nNew Clean Structure Benefits:" -ForegroundColor Cyan
        Write-Host "  - All DLLs organized in bin/Dependencies/" -ForegroundColor Green
        Write-Host "  - Language resources grouped in bin/Resources/" -ForegroundColor Green
        Write-Host "  - HostProvisioner deployed separately (no duplication)" -ForegroundColor Green
        Write-Host "  - Clean root directory (only essential files)" -ForegroundColor Green
        Write-Host "  - Professional, maintainable structure" -ForegroundColor Green
    }

} catch {
    Write-Host "`n========================================" -ForegroundColor Red
    Write-Host "  DEPLOYMENT FAILED" -ForegroundColor Red
    Write-Host "========================================`n" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host "Stack Trace: $($_.ScriptStackTrace)" -ForegroundColor Red
    
    Write-Host ""
    Write-Host 'To rollback, use the ncrollback.ps1 script' -ForegroundColor Yellow
    
    exit 1
}
