<#
.SYNOPSIS
    Deploy NoorCanvas application to production website location.

.DESCRIPTION
    This script builds the NoorCanvas application in Release mode and deploys it
    to D:\Websites\NOOR-CANVAS. It handles:
    - Building the application in Release configuration
    - Publishing to a temporary directory
    - Stopping IIS Application Pool (if applicable)
    - Backing up the current deployment
    - Deploying the new version
    - Starting the Application Pool
    - Verifying the deployment

.PARAMETER SkipBuild
    Skip the build step and deploy existing publish output.

.PARAMETER SkipBackup
    Skip creating a backup of the existing deployment.

.PARAMETER SkipIIS
    Skip IIS-related operations (stop/start app pool).

.PARAMETER AppPool
    Name of the IIS Application Pool to restart. Default: "NoorCanvas"

.EXAMPLE
    .\ncdeploy.ps1
    Deploy with default settings (build, backup, deploy, restart IIS)

.EXAMPLE
    .\ncdeploy.ps1 -SkipBackup
    Deploy without creating a backup

.EXAMPLE
    .\ncdeploy.ps1 -SkipIIS
    Deploy without stopping/starting IIS
#>

param(
    [switch]$SkipBuild,
    [switch]$SkipBackup,
    [switch]$SkipIIS,
    [string]$AppPool = "NoorCanvas"
)

# Configuration
$ErrorActionPreference = "Stop"
$WorkspaceRoot = Split-Path $PSScriptRoot -Parent
$ProjectPath = "$WorkspaceRoot\SPA\NoorCanvas"
$ProjectFile = "$ProjectPath\NoorCanvas.csproj"
$PublishPath = "$WorkspaceRoot\publish-temp"
$DeployPath = "D:\Websites\NOOR-CANVAS"
$BackupPath = "D:\Websites\NOOR-CANVAS-Backups"
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

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Main deployment process
try {
    Write-Host "`n========================================" -ForegroundColor Magenta
    Write-Host "  NoorCanvas Deployment Script" -ForegroundColor Magenta
    Write-Host "  Target: $DeployPath" -ForegroundColor Magenta
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

        # Publish the application
        $publishArgs = @(
            "publish"
            $ProjectFile
            "-c", "Release"
            "-o", $PublishPath
            "--no-self-contained"
            "/p:PublishReadyToRun=false"
        )

        Write-Host "Running: dotnet $($publishArgs -join ' ')" -ForegroundColor Gray
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

    # Step 2: Stop IIS Application Pool
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

    # Step 3: Backup existing deployment
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
                    Write-Host "  Removed old backup: $($_.Name)" -ForegroundColor Gray
                }
            }
        } else {
            Write-Warning "No existing deployment found to backup"
        }
    } else {
        Write-Warning "Skipping backup as requested"
    }

    # Step 4: Deploy the application
    Write-Step "Deploying application to $DeployPath..."
    
    # Create deploy directory if it doesn't exist
    if (-not (Test-Path $DeployPath)) {
        New-Item -ItemType Directory -Path $DeployPath -Force | Out-Null
        Write-Success "Created deployment directory"
    }

    # Copy published files to deployment location
    # Exclude certain files that shouldn't be overwritten IF they already exist
    $excludePatterns = @(
        "appsettings.Production.json",  # Keep production settings
        "logs"                           # Keep existing logs
    )
    
    # Files and folders to exclude from deployment (test/dev files)
    $devOnlyFiles = @(
        "wwwroot/FONT-SYSTEM-SUMMARY.md",
        "wwwroot/session-transcript-redirect.html",
        "wwwroot/session-transcript-styling.html",
        "wwwroot/session-transcript-viewer.html",
        "wwwroot/test-css.html",
        "wwwroot/test-fonts.html",
        "wwwroot/test-harness-demo.html",
        "wwwroot/test-issue-106.html",
        "wwwroot/testing"
    )

    Get-ChildItem -Path $PublishPath -Recurse | ForEach-Object {
        $relativePath = $_.FullName.Substring($PublishPath.Length + 1)
        $shouldExclude = $false
        
        # Check if it's a dev-only file/folder that shouldn't be deployed
        foreach ($devFile in $devOnlyFiles) {
            if ($relativePath -like "$devFile*") {
                Write-Host "  Skipping dev file: $relativePath" -ForegroundColor DarkGray
                $shouldExclude = $true
                break
            }
        }
        
        if (-not $shouldExclude) {
            # Check if it's a file to preserve in production
            foreach ($pattern in $excludePatterns) {
                if ($relativePath -like "$pattern*") {
                    # Only exclude if the file already exists in deployment
                    $targetPath = Join-Path $DeployPath $relativePath
                    if (Test-Path $targetPath) {
                        $shouldExclude = $true
                        break
                    }
                }
            }
        }
        
        if (-not $shouldExclude) {
            $targetPath = Join-Path $DeployPath $relativePath
            
            if ($_.PSIsContainer) {
                if (-not (Test-Path $targetPath)) {
                    New-Item -ItemType Directory -Path $targetPath -Force | Out-Null
                }
            } else {
                Copy-Item -Path $_.FullName -Destination $targetPath -Force
            }
        }
    }

    Write-Success "Application files deployed"
    
    # Clean up dev/test files from production wwwroot if they exist
    Write-Step "Cleaning production wwwroot..."
    $wwwrootPath = Join-Path $DeployPath "wwwroot"
    $cleanedFiles = 0
    
    if (Test-Path $wwwrootPath) {
        foreach ($devFile in $devOnlyFiles) {
            # Extract just the wwwroot-relative path
            $wwwrootRelative = $devFile -replace '^wwwroot[/\\]', ''
            $fullPath = Join-Path $wwwrootPath $wwwrootRelative
            
            if (Test-Path $fullPath) {
                $isDirectory = Test-Path $fullPath -PathType Container
                Remove-Item -Path $fullPath -Recurse -Force -ErrorAction SilentlyContinue
                
                if ($isDirectory) {
                    Write-Host "  Removed dev folder: $wwwrootRelative\" -ForegroundColor Gray
                } else {
                    Write-Host "  Removed dev file: $wwwrootRelative" -ForegroundColor Gray
                }
                $cleanedFiles++
            }
        }
        
        if ($cleanedFiles -gt 0) {
            Write-Success "Cleaned $cleanedFiles dev/test items from wwwroot"
        } else {
            Write-Success "wwwroot already clean (no dev/test files found)"
        }
    }

    # Ensure logs directory exists
    $logsPath = Join-Path $DeployPath "logs"
    if (-not (Test-Path $logsPath)) {
        New-Item -ItemType Directory -Path $logsPath -Force | Out-Null
        Write-Success "Created logs directory"
    }

    # Step 5: Start IIS Application Pool
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
            } else {
                Write-Warning "Application pool '$AppPool' not found. You may need to configure IIS manually."
            }
        } catch {
            Write-Warning "Could not start IIS App Pool: $_"
        }
    }

    # Step 6: Verify deployment
    Write-Step "Verifying deployment..."
    
    $requiredFiles = @(
        "NoorCanvas.dll",
        "web.config",
        "appsettings.json"
    )

    $allFilesPresent = $true
    foreach ($file in $requiredFiles) {
        $filePath = Join-Path $DeployPath $file
        if (Test-Path $filePath) {
            Write-Host "  [OK] $file" -ForegroundColor Green
        } else {
            Write-Host "  [ERROR] $file MISSING!" -ForegroundColor Red
            $allFilesPresent = $false
        }
    }

    if ($allFilesPresent) {
        Write-Success "All required files present"
    } else {
        throw "Deployment verification failed - missing required files"
    }

    # Final summary
    Write-Host "`n========================================" -ForegroundColor Magenta
    Write-Host "  DEPLOYMENT SUCCESSFUL!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Magenta
    Write-Host "Deployed to: $DeployPath" -ForegroundColor White
    Write-Host "Timestamp: $Timestamp" -ForegroundColor White
    
    if (-not $SkipBackup -and (Test-Path "$BackupPath\backup-$Timestamp")) {
        Write-Host "Backup: $BackupPath\backup-$Timestamp" -ForegroundColor White
    }
    
    Write-Host "`nNext steps:" -ForegroundColor Cyan
    Write-Host "  1. Verify the application is accessible" -ForegroundColor Gray
    Write-Host "  2. Check logs at: $logsPath" -ForegroundColor Gray
    Write-Host "  3. Monitor for any errors" -ForegroundColor Gray
    Write-Host ""

} catch {
    Write-Host "`n========================================" -ForegroundColor Red
    Write-Host "  DEPLOYMENT FAILED!" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Error $_.Exception.Message
    Write-Host "`nError Details:" -ForegroundColor Yellow
    Write-Host $_.ScriptStackTrace -ForegroundColor Gray
    
    # Try to restart the app pool if we stopped it
    if (-not $SkipIIS) {
        Write-Host "`nAttempting to restart application pool..." -ForegroundColor Yellow
        try {
            Start-WebAppPool -Name $AppPool -ErrorAction SilentlyContinue
        } catch {
            # Ignore errors here
        }
    }
    
    exit 1
} 
finally {
    # Clean up temporary publish folder
    if (Test-Path $PublishPath) {
        Write-Host "Publish files retained at: $PublishPath" -ForegroundColor Gray
    }
}
