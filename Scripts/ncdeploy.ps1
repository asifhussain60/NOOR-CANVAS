<#
.SYNOPSIS
    Deploy NoorCanvas application and HostProvisioner (Windows Forms) to production from master branch.

.DESCRIPTION
    This script orchestrates a complete production deployment workflow:
    1. Ensures starting on development branch
    2. Merges development → master (with conflict detection)
    3. Builds and publishes NoorCanvas from master in Release mode
    4. Applies web.config transformations (KSESSIONS production database)
    5. Deploys NoorCanvas to D:\Websites\NOOR-CANVAS with IIS management
    6. Builds and deploys HostProvisioner.WinForms to D:\Websites\NOOR-CANVAS\HostProvisioner
    7. Configures HostProvisioner.WinForms for Production environment
    8. Returns to development branch
    
    Web.config transformation ensures ASPNETCORE_ENVIRONMENT=Production and
    connection strings point to KSESSIONS (production) database.
    HostProvisioner.WinForms is automatically configured for Production environment.

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
    # [DEBUG-WORKITEM:deploy:merge-feedback:SIMPLE]
    if (-not $SkipMerge) {
        Write-Step "Git: Preparing for deployment merge..."
        Write-Info "→ Checking current branch and status"
        
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
            Write-Info "→ Checking for uncommitted changes"
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
            } else {
                Write-Success "No uncommitted changes"
            }
            
            # Fetch latest changes
            Write-Info "→ Fetching latest changes from origin"
            git fetch origin
            
            # Switch to master
            Write-Info "→ Switching to master branch"
            git checkout master
            if ($LASTEXITCODE -ne 0) {
                throw "Failed to switch to master branch"
            }
            Write-Success "On master branch"
            
            # Pull latest master
            Write-Info "→ Pulling latest master changes"
            git pull origin master
            if ($LASTEXITCODE -ne 0) {
                Write-Warning "Failed to pull master (may not exist remotely). Continuing..."
            }
            
            # Merge development into master
            Write-Info "→ Merging development into master"
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
    # [DEBUG-WORKITEM:deploy:build-feedback:SIMPLE]
    if (-not $SkipBuild) {
        Write-Step "Building application in Release mode from master branch..."
        Write-Info "→ Cleaning previous publish output"
        
        # Clean previous publish output
        if (Test-Path $PublishPath) {
            Remove-Item -Path $PublishPath -Recurse -Force
            Write-Success "Cleaned previous publish output"
        }

        # Publish the application with Release configuration
        # This triggers web.Release.config transformation
        Write-Info "→ Publishing with Release configuration and Production transforms"
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
        Write-Info "→ Verifying web.config transformations"
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
    
    # [DEBUG-WORKITEM:deploy:config-preservation] Preserve configuration files before clean ;CLEANUP_OK
    $preservedConfigs = @{}
    $configFilesToPreserve = @(
        "appsettings.json",
        "appsettings.Production.json",
        "appsettings.local.json"
    )
    
    if (Test-Path $DeployPath) {
        # Save configuration files before cleaning
        Write-Info "→ Preserving configuration files..."
        foreach ($configFile in $configFilesToPreserve) {
            $configPath = Join-Path $DeployPath $configFile
            if (Test-Path $configPath) {
                $preservedConfigs[$configFile] = Get-Content $configPath -Raw
                Write-Host "  ✓ Preserved $configFile" -ForegroundColor Green
            }
        }
        
        try {
            # Remove ALL files and folders for a clean deployment
            Write-Info "→ Removing all files from $DeployPath..."
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
    
    # [DEBUG-WORKITEM:deploy:config-preservation] Restore preserved configuration files ;CLEANUP_OK
    if ($preservedConfigs.Count -gt 0) {
        Write-Info "→ Restoring preserved configuration files..."
        foreach ($configFile in $preservedConfigs.Keys) {
            $configPath = Join-Path $DeployPath $configFile
            Set-Content -Path $configPath -Value $preservedConfigs[$configFile] -NoNewline
            Write-Host "  ✓ Restored $configFile" -ForegroundColor Green
        }
    }
    
    # [DEBUG-WORKITEM:prod-issues:appsettings-local] Remove appsettings.local.json from production (development override file) ;CLEANUP_OK
    $localOverride = Join-Path $DeployPath "appsettings.local.json"
    if (Test-Path $localOverride) {
        Remove-Item -Path $localOverride -Force
        Write-Info "Removed appsettings.local.json (development override)"
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

    # Step 7.5: Deploy HostProvisioner (Windows Forms)
    # [DEBUG-WORKITEM:deploy:hostprovisioner] Deploy WinForms Host Provisioner to production
    Write-Step "Deploying HostProvisioner (Windows Forms)..."
    
    $HostProvisionerProjectPath = "$WorkspaceRoot\Tools\HostProvisioner\HostProvisioner.WinForms"
    $HostProvisionerProjectFile = "$HostProvisionerProjectPath\HostProvisioner.WinForms.csproj"
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
            
            # Also transform HostProvisioner.WinForms.dll.config if it exists
            # [DEBUG-WORKITEM:deploy:hostprovisioner] Transform WinForms config to Production
            $dllConfigPath = Join-Path $HostProvisionerDeployPath "HostProvisioner.WinForms.dll.config"
            if (Test-Path $dllConfigPath) {
                Write-Info "Transforming HostProvisioner.WinForms.dll.config to Production environment..."
                try {
                    [xml]$dllConfig = Get-Content $dllConfigPath
                    $envSetting = $dllConfig.SelectSingleNode("//appSettings/add[@key='ASPNETCORE_ENVIRONMENT']")
                    if ($envSetting) {
                        $envSetting.SetAttribute("value", "Production")
                        $dllConfig.Save($dllConfigPath)
                        Write-Success "HostProvisioner.WinForms.dll.config transformed: ASPNETCORE_ENVIRONMENT = Production"
                    }
                } catch {
                    Write-Warning "Failed to transform HostProvisioner.WinForms.dll.config: $_"
                }
            }
            
            # Verify HostProvisioner deployment
            # [DEBUG-WORKITEM:deploy:hostprovisioner] Verify WinForms deployment
            $hpDllPath = Join-Path $HostProvisionerDeployPath "HostProvisioner.WinForms.dll"
            if (Test-Path $hpDllPath) {
                Write-Host "  ✓ HostProvisioner.WinForms.dll" -ForegroundColor Green
                
                # Test database connection (Windows Forms app - skip connection test)
                # [DEBUG-WORKITEM:deploy:hostprovisioner] WinForms app - no CLI test-connection command
                Write-Info "HostProvisioner (Windows Forms) deployed successfully"
                Write-Info "Launch manually: HostProvisioner.WinForms.exe"
            } else {
                Write-Warning "HostProvisioner.WinForms.dll not found in deployment"
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

    # Step 7.6: Post-Deployment Validation (Environment & Database)
    # [DEBUG-WORKITEM:deploy:validation] Prevent production deployment with dev settings ;CLEANUP_OK
    Write-Step "Validating production deployment configuration..."
    
    $validationFailed = $false
    $validationErrors = @()
    
    # Validation 1: NoorCanvas web.config - verify Production environment and KSESSIONS database
    Write-Info "→ Validating NoorCanvas configuration..."
    $webConfigPath = Join-Path $DeployPath "web.config"
    if (Test-Path $webConfigPath) {
        $webConfigContent = Get-Content $webConfigPath -Raw
        
        # Check environment variable
        if ($webConfigContent -match 'ASPNETCORE_ENVIRONMENT.*Production') {
            Write-Host "  ✓ NoorCanvas environment: Production" -ForegroundColor Green
        } else {
            Write-Host "  ✗ NoorCanvas environment: NOT Production!" -ForegroundColor Red
            $validationErrors += "NoorCanvas web.config does not specify ASPNETCORE_ENVIRONMENT=Production"
            $validationFailed = $true
        }
        
        # Check database connection string
        if ($webConfigContent -match 'Database=KSESSIONS') {
            Write-Host "  ✓ NoorCanvas database: KSESSIONS (Production)" -ForegroundColor Green
        } else {
            Write-Host "  ✗ NoorCanvas database: NOT KSESSIONS!" -ForegroundColor Red
            $validationErrors += "NoorCanvas web.config does not reference KSESSIONS production database"
            $validationFailed = $true
        }
    } else {
        Write-Host "  ✗ web.config not found!" -ForegroundColor Red
        $validationErrors += "NoorCanvas web.config missing at $webConfigPath"
        $validationFailed = $true
    }
    
    # Validation 2: NoorCanvas appsettings.json - verify KSESSIONS database
    Write-Info "→ Validating NoorCanvas appsettings.json..."
    $appsettingsPath = Join-Path $DeployPath "appsettings.json"
    if (Test-Path $appsettingsPath) {
        $appsettingsContent = Get-Content $appsettingsPath -Raw
        
        if ($appsettingsContent -match 'Database=KSESSIONS') {
            Write-Host "  ✓ NoorCanvas appsettings: KSESSIONS database" -ForegroundColor Green
        } else {
            Write-Host "  ✗ NoorCanvas appsettings: NOT KSESSIONS database!" -ForegroundColor Red
            $validationErrors += "NoorCanvas appsettings.json does not reference KSESSIONS production database"
            $validationFailed = $true
        }
    } else {
        Write-Host "  ✗ appsettings.json not found!" -ForegroundColor Red
        $validationErrors += "NoorCanvas appsettings.json missing at $appsettingsPath"
        $validationFailed = $true
    }
    
    # Validation 3: HostProvisioner appsettings.Production.json - verify KSESSIONS database
    Write-Info "→ Validating HostProvisioner configuration..."
    $hpAppsettingsProdPath = Join-Path $HostProvisionerDeployPath "appsettings.Production.json"
    if (Test-Path $hpAppsettingsProdPath) {
        $hpAppsettingsProdContent = Get-Content $hpAppsettingsProdPath -Raw
        
        if ($hpAppsettingsProdContent -match 'Database=KSESSIONS') {
            Write-Host "  ✓ HostProvisioner appsettings.Production.json: KSESSIONS database" -ForegroundColor Green
        } else {
            Write-Host "  ✗ HostProvisioner appsettings.Production.json: NOT KSESSIONS database!" -ForegroundColor Red
            $validationErrors += "HostProvisioner appsettings.Production.json does not reference KSESSIONS production database"
            $validationFailed = $true
        }
    } else {
        Write-Host "  ✗ HostProvisioner appsettings.Production.json not found!" -ForegroundColor Red
        $validationErrors += "HostProvisioner appsettings.Production.json missing at $hpAppsettingsProdPath"
        $validationFailed = $true
    }
    
    # Validation 4: Environment variable check for HostProvisioner
    Write-Info "→ Checking ASPNETCORE_ENVIRONMENT system variable..."
    $systemEnv = [System.Environment]::GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT", "Machine")
    $userEnv = [System.Environment]::GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT", "User")
    $processEnv = [System.Environment]::GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT", "Process")
    
    if ($systemEnv -eq "Production" -or $userEnv -eq "Production" -or $processEnv -eq "Production") {
        Write-Host "  ✓ ASPNETCORE_ENVIRONMENT set to Production" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ ASPNETCORE_ENVIRONMENT not set to Production" -ForegroundColor Yellow
        Write-Host "    System: $systemEnv" -ForegroundColor Gray
        Write-Host "    User: $userEnv" -ForegroundColor Gray
        Write-Host "    Process: $processEnv" -ForegroundColor Gray
        Write-Warning "HostProvisioner reads ASPNETCORE_ENVIRONMENT from environment variables!"
        Write-Warning "Without this set, HostProvisioner will default to Development and connect to KSESSIONS_DEV"
        $validationErrors += "ASPNETCORE_ENVIRONMENT environment variable not set to Production"
        $validationFailed = $true
    }
    
    # Final validation result
    if ($validationFailed) {
        Write-Host "`n========================================" -ForegroundColor Red
        Write-Host "  VALIDATION FAILED!" -ForegroundColor Red
        Write-Host "========================================" -ForegroundColor Red
        Write-Host "`nConfiguration Issues Found:" -ForegroundColor Yellow
        foreach ($error in $validationErrors) {
            Write-Host "  ✗ $error" -ForegroundColor Red
        }
        
        Write-Host "`nREMEDIATION STEPS:" -ForegroundColor Cyan
        Write-Host "1. Set system environment variable:" -ForegroundColor White
        Write-Host "   [System.Environment]::SetEnvironmentVariable('ASPNETCORE_ENVIRONMENT', 'Production', 'Machine')" -ForegroundColor Gray
        Write-Host "`n2. Verify NoorCanvas web.config transformation:" -ForegroundColor White
        Write-Host "   - Check: $webConfigPath" -ForegroundColor Gray
        Write-Host "   - Should contain: ASPNETCORE_ENVIRONMENT=Production" -ForegroundColor Gray
        Write-Host "   - Should contain: Database=KSESSIONS" -ForegroundColor Gray
        Write-Host "`n3. Verify appsettings.json files:" -ForegroundColor White
        Write-Host "   - NoorCanvas: $appsettingsPath" -ForegroundColor Gray
        Write-Host "   - HostProvisioner: $hpAppsettingsProdPath" -ForegroundColor Gray
        Write-Host "   - Both should contain: Database=KSESSIONS" -ForegroundColor Gray
        Write-Host "`n4. After remediation, restart IIS:" -ForegroundColor White
        Write-Host "   iisreset" -ForegroundColor Gray
        
        throw "Deployment validation failed - production environment not properly configured"
    } else {
        Write-Success "All deployment validations passed!"
        Write-Host "  ✓ NoorCanvas: Production environment, KSESSIONS database" -ForegroundColor Green
        Write-Host "  ✓ HostProvisioner: KSESSIONS database configured" -ForegroundColor Green
        Write-Host "  ✓ Environment variables: Properly configured" -ForegroundColor Green
    }

    # Step 8: Push master to origin and return to development branch
    # [DEBUG-WORKITEM:deploy:auto-push:SIMPLE]
    if (-not $SkipMerge) {
        Write-Step "Git: Pushing master branch to origin..."
        
        Push-Location $WorkspaceRoot
        try {
            # Push master to origin after successful deployment
            git push origin master
            if ($LASTEXITCODE -ne 0) {
                Write-Warning "Failed to push master to origin. You may need to push manually."
                Write-Info "Run: git push origin master"
            } else {
                Write-Success "Master branch pushed to origin successfully"
            }
            
            Write-Step "Git: Returning to development branch..."
            git checkout development
            if ($LASTEXITCODE -ne 0) {
                throw "Failed to switch back to development branch"
            }
            Write-Success "Back on development branch"
            
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
    # [DEBUG-WORKITEM:deploy:error-cleanup:SIMPLE]
    Write-Host "`n========================================" -ForegroundColor Red
    Write-Host "  DEPLOYMENT FAILED!" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "`nStack Trace:" -ForegroundColor Yellow
    Write-Host $_.ScriptStackTrace -ForegroundColor Gray
    
    # Try to restart the app pool if we stopped it
    if (-not $SkipIIS) {
        Write-Host "`n→ Attempting to restart application pool..." -ForegroundColor Yellow
        try {
            Start-WebAppPool -Name $AppPool -ErrorAction SilentlyContinue
            Write-Success "Application pool restarted"
        } catch {
            Write-Warning "Could not restart app pool: $_"
        }
    }
    
    # Try to return to original branch (leaving master clean)
    if ($OriginalBranch -and -not $SkipMerge) {
        Write-Host "`n→ Returning to $OriginalBranch branch (leaving master clean)..." -ForegroundColor Yellow
        Push-Location $WorkspaceRoot
        try {
            git checkout $OriginalBranch -ErrorAction SilentlyContinue
            if ($LASTEXITCODE -eq 0) {
                Write-Success "Returned to $OriginalBranch branch"
                Write-Info "Master branch state: Clean (deployment changes not committed)"
            } else {
                Write-Warning "Could not return to $OriginalBranch branch automatically"
            }
        } catch {
            Write-Warning "Error switching branches: $_"
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
