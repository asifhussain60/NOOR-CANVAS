<#
.SYNOPSIS
    Deploy NoorCanvas application to production from master branch.

.DESCRIPTION
    This script orchestrates a complete production deployment workflow:
    1. Ensures starting on development branch
    2. Merges development → master (with conflict detection)
    3. Builds and publishes from master in Release mode
    4. Applies web.config transformations (KSESSIONS production database)
    5. Deploys to D:\Websites\NOOR-CANVAS with IIS management
    6. Returns to development branch
    
    Web.config transformation ensures ASPNETCORE_ENVIRONMENT=Production and
    connection strings point to KSESSIONS (production) database.

.PARAMETER SkipMerge
    Skip the git merge step. Use only if already on master with correct code.

.PARAMETER SkipBuild
    Skip the build step and deploy existing publish output.

.PARAMETER SkipBackup
    Skip creating a backup of the existing deployment.

.PARAMETER SkipIIS
    Skip IIS-related operations (stop/start app pool).

.PARAMETER AppPool
    Name of the IIS Application Pool to restart. Default: "NoorCanvas"

.PARAMETER AutoMerge
    Automatically continue with merge even if there are changes to commit.
    USE WITH CAUTION - only when you're certain changes should be merged.

.EXAMPLE
    .\ncdeploy.ps1
    Full deployment: merge development→master, build, deploy, return to development

.EXAMPLE
    .\ncdeploy.ps1 -SkipMerge
    Deploy from current master branch without merging development

.EXAMPLE
    .\ncdeploy.ps1 -SkipBackup -SkipIIS
    Quick deployment without backup or IIS operations

.NOTES
    Author: NOOR CANVAS Team
    Always begins and ends on development branch (unless -SkipMerge is used)
    Web.config transforms automatically set Production environment and KSESSIONS database
#>

param(
    [switch]$SkipMerge,
    [switch]$SkipBuild,
    [switch]$SkipBackup,
    [switch]$SkipIIS,
    [switch]$AutoMerge,
    [string]$AppPool = "NoorCanvas"
)

# Configuration
$ErrorActionPreference = "Stop"
$WorkspaceRoot = Split-Path $PSScriptRoot -Parent
$ProjectPath = "$WorkspaceRoot\SPA\NoorCanvas"
$ProjectFile = "$ProjectPath\NoorCanvas.csproj"
$PublishPath = "$WorkspaceRoot\Workspaces\publish-temp"
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

function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Gray
}

# Store original branch for cleanup
$OriginalBranch = $null

# Main deployment process
try {
    Write-Host "`n========================================" -ForegroundColor Magenta
    Write-Host "  NoorCanvas Production Deployment" -ForegroundColor Magenta
    Write-Host "  Target: $DeployPath" -ForegroundColor Magenta
    Write-Host "  Database: KSESSIONS (Production)" -ForegroundColor Magenta
    Write-Host "  Time: $Timestamp" -ForegroundColor Magenta
    Write-Host "========================================`n" -ForegroundColor Magenta

    # Step 0: Git branch management (merge development → master)
    if (-not $SkipMerge) {
        Write-Step "Git: Preparing for deployment merge..."
        
        # Change to workspace root for git operations
        Push-Location $WorkspaceRoot
        
        try {
            # Get current branch
            $OriginalBranch = git branch --show-current
            Write-Info "Current branch: $OriginalBranch"
            
            # Ensure we're starting from development
            if ($OriginalBranch -ne "development") {
                Write-Warning "Not on development branch. Switching to development..."
                git checkout development
                if ($LASTEXITCODE -ne 0) {
                    throw "Failed to switch to development branch"
                }
                $OriginalBranch = "development"
                Write-Success "Switched to development branch"
            }
            
            # Check for uncommitted changes
            $gitStatus = git status --porcelain
            if ($gitStatus) {
                Write-Warning "Uncommitted changes detected:"
                Write-Host $gitStatus -ForegroundColor Yellow
                
                if (-not $AutoMerge) {
                    Write-Host "`nOptions:" -ForegroundColor Cyan
                    Write-Host "  1. Commit your changes first, then re-run ncdeploy.ps1" -ForegroundColor Gray
                    Write-Host "  2. Stash your changes: git stash" -ForegroundColor Gray
                    Write-Host "  3. Use -AutoMerge flag to continue anyway (not recommended)" -ForegroundColor Gray
                    throw "Please commit or stash changes before deploying"
                } else {
                    Write-Warning "Continuing with deployment despite uncommitted changes (AutoMerge enabled)"
                }
            }
            
            # Fetch latest changes
            Write-Info "Fetching latest changes..."
            git fetch origin
            
            # Switch to master
            Write-Info "Switching to master branch..."
            git checkout master
            if ($LASTEXITCODE -ne 0) {
                throw "Failed to switch to master branch"
            }
            Write-Success "On master branch"
            
            # Pull latest master
            Write-Info "Pulling latest master changes..."
            git pull origin master
            if ($LASTEXITCODE -ne 0) {
                Write-Warning "Failed to pull master (may not exist remotely). Continuing..."
            }
            
            # Merge development into master
            Write-Info "Merging development → master..."
            git merge development --no-ff -m "Deploy: Merge development to master ($Timestamp)"
            
            if ($LASTEXITCODE -ne 0) {
                Write-Error "Merge conflicts detected!"
                Write-Host "`nPlease resolve conflicts manually:" -ForegroundColor Yellow
                Write-Host "  1. Run: git status" -ForegroundColor Gray
                Write-Host "  2. Edit conflicting files" -ForegroundColor Gray
                Write-Host "  3. Run: git add <resolved-files>" -ForegroundColor Gray
                Write-Host "  4. Run: git commit" -ForegroundColor Gray
                Write-Host "  5. Re-run: .\ncdeploy.ps1 -SkipMerge" -ForegroundColor Cyan
                throw "Merge conflicts require manual resolution"
            }
            
            Write-Success "Successfully merged development → master"
            
            # Show merge summary
            $commitCount = git rev-list --count master..development
            Write-Info "Merged changes from development to master"
            
        } finally {
            Pop-Location
        }
    } else {
        Write-Warning "Skipping git merge (using current branch as-is)"
        
        # Still need to verify we're on master
        Push-Location $WorkspaceRoot
        try {
            $currentBranch = git branch --show-current
            if ($currentBranch -ne "master") {
                Write-Warning "Not on master branch (on: $currentBranch)"
                Write-Host "Switching to master..." -ForegroundColor Yellow
                git checkout master
                if ($LASTEXITCODE -ne 0) {
                    throw "Failed to switch to master branch"
                }
            }
            Write-Success "On master branch"
        } finally {
            Pop-Location
        }
    }

    # Step 1: Build the application
    if (-not $SkipBuild) {
        Write-Step "Building application in Release mode from master branch..."
        
        # Clean previous publish output
        if (Test-Path $PublishPath) {
            Remove-Item -Path $PublishPath -Recurse -Force
            Write-Success "Cleaned previous publish output"
        }

        # Publish the application with Release configuration
        # This triggers web.Release.config transformation
        $publishArgs = @(
            "publish"
            $ProjectFile
            "-c", "Release"
            "-o", $PublishPath
            "--no-self-contained"
            "/p:PublishReadyToRun=false"
            "/p:EnvironmentName=Production"
        )

        Write-Info "Running: dotnet $($publishArgs -join ' ')"
        Write-Info "Web.config transformation: web.Release.config → Production settings"
        
        & dotnet $publishArgs

        if ($LASTEXITCODE -ne 0) {
            throw "Build failed with exit code $LASTEXITCODE"
        }

        Write-Success "Application built and published successfully"
        
        # Verify web.config transformation
        $webConfigPath = "$PublishPath\web.config"
        if (Test-Path $webConfigPath) {
            $webConfigContent = Get-Content $webConfigPath -Raw
            if ($webConfigContent -match 'ASPNETCORE_ENVIRONMENT.*Production' -and 
                $webConfigContent -match 'KSESSIONS') {
                Write-Success "Web.config verified: Production environment, KSESSIONS database"
            } else {
                Write-Warning "Web.config may not have correct transformations. Please verify manually."
            }
        }
        
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
                    Write-Info "Removed old backup: $($_.Name)"
                }
            }
        } else {
            Write-Warning "No existing deployment found to backup"
        }
    } else {
        Write-Warning "Skipping backup as requested"
    }

    # Step 4: Clean production directory
    Write-Step "Cleaning production deployment directory..."
    
    if (Test-Path $DeployPath) {
        try {
            # Preserve logs and production appsettings
            $preservePaths = @("logs", "appsettings.Production.json")
            
            Get-ChildItem -Path $DeployPath | Where-Object { 
                $preservePaths -notcontains $_.Name 
            } | ForEach-Object {
                Remove-Item -Path $_.FullName -Recurse -Force -ErrorAction Stop
            }
            
            Write-Success "Production directory cleaned (preserved logs and production settings)"
        } catch {
            Write-Warning "Some files may be locked. Continuing with deployment..."
        }
    } else {
        New-Item -ItemType Directory -Path $DeployPath -Force | Out-Null
        Write-Success "Created deployment directory"
    }

    # Step 5: Deploy the application
    Write-Step "Deploying application to $DeployPath..."
    
    # Copy published files to deployment location
    Copy-Item -Path "$PublishPath\*" -Destination $DeployPath -Recurse -Force
    Write-Success "Application files deployed"

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
            } else {
                Write-Warning "Application pool '$AppPool' not found. You may need to configure IIS manually."
            }
        } catch {
            Write-Warning "Could not start IIS App Pool: $_"
        }
    }

    # Step 7: Verify deployment
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
            Write-Host "  ✓ $file" -ForegroundColor Green
        } else {
            Write-Host "  ✗ $file MISSING!" -ForegroundColor Red
            $allFilesPresent = $false
        }
    }

    if ($allFilesPresent) {
        Write-Success "All required files present"
    } else {
        throw "Deployment verification failed - missing required files"
    }

    # Step 8: Return to development branch
    if (-not $SkipMerge) {
        Write-Step "Git: Returning to development branch..."
        
        Push-Location $WorkspaceRoot
        try {
            git checkout development
            if ($LASTEXITCODE -ne 0) {
                throw "Failed to switch back to development branch"
            }
            Write-Success "Back on development branch"
            
            # Optionally push master to remote
            Write-Host "`nTo push master branch to remote:" -ForegroundColor Cyan
            Write-Host "  git push origin master" -ForegroundColor Gray
            
        } finally {
            Pop-Location
        }
    }

    # Final summary
    Write-Host "`n========================================" -ForegroundColor Green
    Write-Host "  DEPLOYMENT SUCCESSFUL!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    
    Write-Host "`nDeployment Details:" -ForegroundColor White
    Write-Host "  Location: $DeployPath" -ForegroundColor Gray
    Write-Host "  Database: KSESSIONS (Production)" -ForegroundColor Gray
    Write-Host "  Environment: Production" -ForegroundColor Gray
    Write-Host "  Branch: master" -ForegroundColor Gray
    Write-Host "  Timestamp: $Timestamp" -ForegroundColor Gray
    
    if (-not $SkipBackup -and (Test-Path "$BackupPath\backup-$Timestamp")) {
        Write-Host "  Backup: $BackupPath\backup-$Timestamp" -ForegroundColor Gray
    }
    
    Write-Host "`nNext steps:" -ForegroundColor Cyan
    Write-Host "  1. Verify the application is accessible" -ForegroundColor Gray
    Write-Host "  2. Check logs at: $logsPath" -ForegroundColor Gray
    Write-Host "  3. Monitor for any errors" -ForegroundColor Gray
    Write-Host "  4. Continue development work in 'development' branch" -ForegroundColor Gray
    Write-Host ""

} catch {
    Write-Host "`n========================================" -ForegroundColor Red
    Write-Host "  DEPLOYMENT FAILED!" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "`nStack Trace:" -ForegroundColor Yellow
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
    
    # Try to return to original branch
    if ($OriginalBranch -and -not $SkipMerge) {
        Write-Host "Attempting to return to $OriginalBranch branch..." -ForegroundColor Yellow
        Push-Location $WorkspaceRoot
        try {
            git checkout $OriginalBranch -ErrorAction SilentlyContinue
        } finally {
            Pop-Location
        }
    }
    
    Write-Host "`nRecovery options:" -ForegroundColor Cyan
    Write-Host "  - Check git status: git status" -ForegroundColor Gray
    Write-Host "  - Restore backup if needed" -ForegroundColor Gray
    Write-Host "  - Review error message above" -ForegroundColor Gray
    
    exit 1
} 
finally {
    # Information about temporary files
    if (Test-Path $PublishPath) {
        Write-Info "Publish files retained at: $PublishPath"
    }
}
