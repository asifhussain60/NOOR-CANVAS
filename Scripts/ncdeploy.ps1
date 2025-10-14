<#
.SYNOPSIS
    Deploy NoorCanvas application and HostProvisioner to production from master branch.

.DESCRIPTION
    This script orchestrates a complete production deployment workflow:
    1. Ensures starting on development branch
    2. Merges development → master (with conflict detection)
    3. Builds and publishes NoorCanvas from master in Release mode
    4. Applies web.config transformations (KSESSIONS production database)
    5. Deploys NoorCanvas to D:\Websites\NOOR-CANVAS with IIS management
    6. Builds and deploys HostProvisioner to D:\Websites\NOOR-CANVAS\HostProvisioner
    7. Tests HostProvisioner connection to KSESSIONS database
    8. Returns to development branch
    
    Web.config transformation ensures ASPNETCORE_ENVIRONMENT=Production and
    connection strings point to KSESSIONS (production) database.
    HostProvisioner is automatically configured for Production environment.

.PARAMETER SkipMerge
    Skip the git merge step. Use only if already on master with correct code.

.PARAMETER SkipBuild
    Skip the build step and deploy existing publish output.

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
    .\ncdeploy.ps1 -SkipIIS
    Quick deployment without IIS operations

.NOTES
    Author: NOOR CANVAS Team
    Always begins and ends on development branch (unless -SkipMerge is used)
    Web.config transforms automatically set Production environment and KSESSIONS database
#>

param(
    [switch]$SkipMerge,
    [switch]$SkipBuild,
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

    # Step 3: Backup existing deployment (ALWAYS - before clean deploy)
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
        Write-Info "No existing deployment found to backup (first deployment)"
    }

    # Step 4: Clean production directory (FULL CLEAN DEPLOY)
    Write-Step "Performing CLEAN deployment (removing ALL existing files)..."
    
    if (Test-Path $DeployPath) {
        try {
            # Remove ALL files and folders for a clean deployment
            Write-Info "Removing all files from $DeployPath..."
            Get-ChildItem -Path $DeployPath -Force | ForEach-Object {
                Remove-Item -Path $_.FullName -Recurse -Force -ErrorAction Stop
            }
            Write-Success "All existing files removed - clean slate ready"
        } catch {
            Write-Error "Failed to clean deployment directory: $_"
            throw "Cannot perform clean deployment. Some files may be locked by IIS or other processes."
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

    # Step 7.5: Deploy HostProvisioner
    Write-Step "Deploying HostProvisioner..."
    
    $HostProvisionerProjectPath = "$WorkspaceRoot\Tools\HostProvisioner\HostProvisioner"
    $HostProvisionerProjectFile = "$HostProvisionerProjectPath\HostProvisioner.csproj"
    $HostProvisionerPublishPath = "$WorkspaceRoot\Workspaces\hostprovisioner-publish-temp"
    $HostProvisionerDeployPath = "$DeployPath\HostProvisioner"
    
    if (Test-Path $HostProvisionerProjectFile) {
        Write-Info "Building HostProvisioner in Release mode..."
        
        # Clean previous publish output
        if (Test-Path $HostProvisionerPublishPath) {
            Remove-Item -Path $HostProvisionerPublishPath -Recurse -Force
        }
        
        # Build HostProvisioner
        $publishArgs = @(
            "publish"
            $HostProvisionerProjectFile
            "-c", "Release"
            "-o", $HostProvisionerPublishPath
            "--no-self-contained"
            "/p:PublishReadyToRun=false"
            "/p:EnvironmentName=Production"
        )
        
        & dotnet @publishArgs
        
        if ($LASTEXITCODE -ne 0) {
            Write-Warning "HostProvisioner build failed. Skipping HostProvisioner deployment."
        } else {
            Write-Success "HostProvisioner built successfully"
            
            # Create HostProvisioner deployment directory
            if (-not (Test-Path $HostProvisionerDeployPath)) {
                New-Item -ItemType Directory -Path $HostProvisionerDeployPath -Force | Out-Null
                Write-Info "Created HostProvisioner deployment directory"
            }
            
            # Copy HostProvisioner files
            Copy-Item -Path "$HostProvisionerPublishPath\*" -Destination $HostProvisionerDeployPath -Recurse -Force
            Write-Success "HostProvisioner deployed to $HostProvisionerDeployPath"
            
            # Transform app.config to Production environment
            $appConfigPath = Join-Path $HostProvisionerDeployPath "app.config"
            if (Test-Path $appConfigPath) {
                Write-Info "Transforming app.config to Production environment..."
                try {
                    [xml]$appConfig = Get-Content $appConfigPath
                    $envSetting = $appConfig.SelectSingleNode("//appSettings/add[@key='ASPNETCORE_ENVIRONMENT']")
                    if ($envSetting) {
                        $envSetting.SetAttribute("value", "Production")
                        $appConfig.Save($appConfigPath)
                        Write-Success "app.config transformed: ASPNETCORE_ENVIRONMENT = Production"
                    } else {
                        Write-Warning "ASPNETCORE_ENVIRONMENT setting not found in app.config"
                    }
                } catch {
                    Write-Warning "Failed to transform app.config: $_"
                }
            }
            
            # Also transform HostProvisioner.dll.config if it exists
            $dllConfigPath = Join-Path $HostProvisionerDeployPath "HostProvisioner.dll.config"
            if (Test-Path $dllConfigPath) {
                Write-Info "Transforming HostProvisioner.dll.config to Production environment..."
                try {
                    [xml]$dllConfig = Get-Content $dllConfigPath
                    $envSetting = $dllConfig.SelectSingleNode("//appSettings/add[@key='ASPNETCORE_ENVIRONMENT']")
                    if ($envSetting) {
                        $envSetting.SetAttribute("value", "Production")
                        $dllConfig.Save($dllConfigPath)
                        Write-Success "HostProvisioner.dll.config transformed: ASPNETCORE_ENVIRONMENT = Production"
                    }
                } catch {
                    Write-Warning "Failed to transform HostProvisioner.dll.config: $_"
                }
            }
            
            # Verify HostProvisioner deployment
            $hpDllPath = Join-Path $HostProvisionerDeployPath "HostProvisioner.dll"
            if (Test-Path $hpDllPath) {
                Write-Host "  ✓ HostProvisioner.dll" -ForegroundColor Green
                
                # Test database connection
                Write-Info "Testing HostProvisioner database connection to KSESSIONS..."
                try {
                    Push-Location $HostProvisionerDeployPath
                    $testOutput = & dotnet HostProvisioner.dll test-connection 2>&1
                    if ($LASTEXITCODE -eq 0) {
                        Write-Success "HostProvisioner connected to KSESSIONS successfully"
                        Write-Info $testOutput
                    } else {
                        Write-Warning "HostProvisioner connection test failed. Check appsettings.json"
                        Write-Info $testOutput
                    }
                } catch {
                    Write-Warning "Could not test HostProvisioner connection: $_"
                } finally {
                    Pop-Location
                }
            } else {
                Write-Warning "HostProvisioner.dll not found in deployment"
            }
            
            # Clean up temporary publish folder
            if (Test-Path $HostProvisionerPublishPath) {
                Remove-Item -Path $HostProvisionerPublishPath -Recurse -Force
                Write-Info "Cleaned HostProvisioner publish temp folder"
            }
        }
    } else {
        Write-Warning "HostProvisioner project not found at $HostProvisionerProjectFile. Skipping HostProvisioner deployment."
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
    Write-Host "  (CLEAN DEPLOY - All files replaced)" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    
    Write-Host "`nDeployment Details:" -ForegroundColor White
    Write-Host "  NoorCanvas: $DeployPath" -ForegroundColor Gray
    Write-Host "  HostProvisioner: $DeployPath\HostProvisioner" -ForegroundColor Gray
    Write-Host "  Database: KSESSIONS (Production)" -ForegroundColor Gray
    Write-Host "  Environment: Production" -ForegroundColor Gray
    Write-Host "  Deployment Type: CLEAN (all files removed first)" -ForegroundColor Gray
    Write-Host "  Branch: master" -ForegroundColor Gray
    Write-Host "  Timestamp: $Timestamp" -ForegroundColor Gray
    
    if (Test-Path "$BackupPath\backup-$Timestamp") {
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
