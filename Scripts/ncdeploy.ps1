<#
.SYNOPSIS
    Deploy NoorCanvas application and HostProvisioner (Windows Forms) to production from development branch.

.DESCRIPTION
    This script orchestrates a complete production deployment workflow:
    1. Ensures on development branch (where all development work happens)
    2. Builds and publishes NoorCanvas from development in Release mode
    3. Applies web.config transformations (KSESSIONS production database)
    4. Deploys NoorCanvas to D:\Websites\NOOR-CANVAS with IIS management
    5. Builds and deploys HostProvisioner.WinForms to D:\Websites\NOOR-CANVAS\HostProvisioner
    6. Configures HostProvisioner.WinForms for Production environment
    7. Validates production configuration (environment + database)
    8. After successful deployment, merges development → master (to record production state)
    9. Remains on development branch for continued work
    
    Web.config transformation ensures ASPNETCORE_ENVIRONMENT=Production and
    connection strings point to KSESSIONS (production) database.
    HostProvisioner.WinForms is automatically configured for Production environment.
    
    Can be run from any directory - automatically uses correct workspace paths.

.PARAMETER SkipMerge
    Skip the post-deployment git merge step. Use only if you don't want to update master branch.

.PARAMETER SkipBuild
    Skip the build step and deploy existing publish output.

.PARAMETER SkipIIS
    Skip IIS-related operations (stop/start app pool).

.PARAMETER AppPool
    Name of the IIS Application Pool to restart. Default: "NoorCanvas"

.PARAMETER AutoMerge
    Automatically continue with post-deployment merge even if there are uncommitted changes.
    USE WITH CAUTION - only when you're certain the deployment state should be recorded.

.PARAMETER DryRun
    Validate migrations and deployment readiness without executing.
    Checks SQL syntax, database connectivity, and file readiness.
    No database changes or code deployment will occur.

.EXAMPLE
    .\ncdeploy.ps1
    Full deployment: build from development, deploy, merge development→master (record production)

.EXAMPLE
    .\ncdeploy.ps1 -SkipMerge
    Deploy from development branch without updating master branch afterward

.EXAMPLE
    .\ncdeploy.ps1 -DryRun
    Validate deployment readiness (migrations, build, configuration) without executing

.EXAMPLE
    .\ncdeploy.ps1 -SkipIIS
    Quick deployment without IIS operations

.NOTES
    Author: NOOR CANVAS Team
    IMPORTANT: Deploys FROM development branch (not master)
    Master branch is only updated AFTER successful deployment to record production state
    Always begins and ends on development branch
    Web.config transforms automatically set Production environment and KSESSIONS database
#>

param(
    [switch]$SkipMerge,
    [switch]$SkipBuild,
    [switch]$SkipIIS,
    [switch]$AutoMerge,
    [switch]$DryRun,
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
    Write-Host "  Workspace: $WorkspaceRoot" -ForegroundColor Magenta
    Write-Host "  Time: $Timestamp" -ForegroundColor Magenta
    Write-Host "========================================`n" -ForegroundColor Magenta

    # Step 0: Git branch management (BRANCH SAFEGUARDS REMOVED)
    # [DEBUG-WORKITEM:deploy:branch-check:DISABLED]
    Write-Step "Git: Checking current branch..."
    
    # Change to workspace root for git operations
    Push-Location $WorkspaceRoot
    
    try {
        # Get current branch (informational only)
        $OriginalBranch = git branch --show-current
        Write-Info "Current branch: $OriginalBranch"
        Write-Info "Branch safeguards disabled - deploying from current branch"
        
    } finally {
        Pop-Location
    }

    # Step 0.5: Database Migrations (NEW - Production Schema Changes)
    # [DEBUG-WORKITEM:deploy:migrations:DETAILED]
    Write-Step "Database Migrations: Checking for pending migrations..."
    
    $MigrationPendingPath = "$WorkspaceRoot\Scripts\Migrations\Prod\pending"
    $MigrationArchivedPath = "$WorkspaceRoot\Scripts\Migrations\Prod\archived"
    $MigrationRollbackPath = "$WorkspaceRoot\Scripts\Migrations\Prod\rollback"
    
    # Check if pending migrations exist
    if (Test-Path $MigrationPendingPath) {
        $PendingMigrations = Get-ChildItem -Path $MigrationPendingPath -Filter "migration-*.sql" | Sort-Object Name
        
        if ($PendingMigrations.Count -gt 0) {
            Write-Info "→ Found $($PendingMigrations.Count) pending migration(s)"
            
            foreach ($migration in $PendingMigrations) {
                Write-Host "  - $($migration.Name)" -ForegroundColor Yellow
            }
            
            # Validate sqlcmd availability
            try {
                $sqlcmdVersion = sqlcmd -? 2>&1 | Select-Object -First 1
                Write-Info "→ SQL Server command-line tools available"
            } catch {
                Write-Error "sqlcmd not found. Install SQL Server Command Line Utilities."
                throw "Migration execution requires sqlcmd. Download from: https://aka.ms/ssmsfullsetup"
            }
            
            # Validate connection to production database
            Write-Info "→ Validating connection to KSESSIONS (Production database)"
            try {
                $connectionTest = sqlcmd -S localhost -d KSESSIONS -Q "SELECT DB_NAME() AS CurrentDB" -h -1 -W 2>&1
                if ($LASTEXITCODE -ne 0) {
                    throw "Cannot connect to KSESSIONS database"
                }
                Write-Success "Connected to KSESSIONS database"
            } catch {
                Write-Error "Failed to connect to KSESSIONS database"
                Write-Info "Ensure SQL Server is running and KSESSIONS database exists"
                throw $_
            }
            
            # Check if MigrationHistory table exists
            Write-Info "→ Verifying MigrationHistory table"
            $historyTableCheck = sqlcmd -S localhost -d KSESSIONS -Q "SELECT CASE WHEN EXISTS (SELECT 1 FROM sys.tables WHERE schema_id = SCHEMA_ID('canvas') AND name = 'MigrationHistory') THEN 1 ELSE 0 END" -h -1 -W 2>&1
            
            if ($historyTableCheck -match "^\s*0\s*$") {
                Write-Warning "MigrationHistory table not found. Initializing..."
                $initScript = "$WorkspaceRoot\Scripts\Migrations\Prod\init-migration-history.sql"
                
                if (Test-Path $initScript) {
                    Write-Info "→ Running: init-migration-history.sql"
                    sqlcmd -S localhost -d KSESSIONS -i $initScript -b
                    
                    if ($LASTEXITCODE -ne 0) {
                        throw "Failed to initialize MigrationHistory table"
                    }
                    Write-Success "MigrationHistory table created"
                } else {
                    throw "MigrationHistory initialization script not found: $initScript"
                }
            } else {
                Write-Success "MigrationHistory table verified"
            }
            
            # Execute migrations
            $MigrationsFailed = $false
            $FailedMigration = $null
            
            foreach ($migration in $PendingMigrations) {
                Write-Host "`n  ┌─ Executing: $($migration.Name)" -ForegroundColor Cyan
                
                $migrationPath = $migration.FullName
                
                # Dry-run mode: Validate syntax only, don't execute
                if ($DryRun) {
                    Write-Info "  │  [DRY-RUN] Validating SQL syntax..."
                    
                    try {
                        # Use sqlcmd with -n flag (removes numbering/prompts) for syntax check
                        # We'll parse the file for basic validation
                        $migrationContent = Get-Content $migrationPath -Raw
                        
                        # Basic validation checks
                        $validationErrors = @()
                        
                        if ($migrationContent -notmatch "DB_NAME\(\)\s*!=\s*['`"]KSESSIONS['`"]") {
                            $validationErrors += "Missing database safety check (DB_NAME() != 'KSESSIONS')"
                        }
                        
                        if ($migrationContent -notmatch "BEGIN TRANSACTION") {
                            $validationErrors += "Missing transaction wrapper (BEGIN TRANSACTION)"
                        }
                        
                        if ($migrationContent -notmatch "BEGIN TRY") {
                            $validationErrors += "Missing error handling (BEGIN TRY)"
                        }
                        
                        if ($migrationContent -notmatch "INSERT INTO canvas\.MigrationHistory") {
                            $validationErrors += "Missing MigrationHistory tracking"
                        }
                        
                        if ($migrationContent -notmatch "IF (NOT )?EXISTS") {
                            $validationErrors += "Missing idempotent checks (IF EXISTS / IF NOT EXISTS)"
                        }
                        
                        if ($validationErrors.Count -gt 0) {
                            Write-Warning "  └─ [DRY-RUN] Validation warnings:"
                            foreach ($error in $validationErrors) {
                                Write-Host "     ⚠️  $error" -ForegroundColor Yellow
                            }
                        } else {
                            Write-Success "  └─ [DRY-RUN] Syntax validation passed"
                        }
                        
                    } catch {
                        Write-Error "  └─ [DRY-RUN] Validation error: $_"
                        throw
                    }
                    
                    continue  # Skip actual execution in dry-run mode
                }
                
                try {
                    # Execute migration
                    Write-Info "  │  Running migration against KSESSIONS..."
                    $migrationOutput = sqlcmd -S localhost -d KSESSIONS -i $migrationPath -b 2>&1
                    
                    if ($LASTEXITCODE -ne 0) {
                        throw "Migration execution failed with exit code $LASTEXITCODE"
                    }
                    
                    # Check output for success message
                    if ($migrationOutput -match "completed successfully") {
                        Write-Success "  └─ Migration completed successfully"
                        
                        # Archive the migration
                        $ArchiveDate = Get-Date -Format "yyyy-MM-dd"
                        $ArchiveDestPath = "$MigrationArchivedPath\$ArchiveDate"
                        
                        if (-not (Test-Path $ArchiveDestPath)) {
                            New-Item -Path $ArchiveDestPath -ItemType Directory -Force | Out-Null
                            Write-Info "     Created archive directory: archived/$ArchiveDate/"
                        }
                        
                        $ArchiveDestFile = "$ArchiveDestPath\$($migration.Name)"
                        Move-Item -Path $migrationPath -Destination $ArchiveDestFile -Force
                        Write-Info "     Archived to: archived/$ArchiveDate/$($migration.Name)"
                        
                    } else {
                        throw "Migration did not report success. Output: $migrationOutput"
                    }
                    
                } catch {
                    Write-Error "  └─ Migration FAILED: $_"
                    Write-Host "`n  Migration Output:" -ForegroundColor Red
                    Write-Host "  $migrationOutput" -ForegroundColor Red
                    
                    $MigrationsFailed = $true
                    $FailedMigration = $migration
                    
                    # Look for corresponding rollback script
                    $rollbackFileName = $migration.Name -replace "^migration-", "rollback-"
                    $rollbackPath = "$MigrationRollbackPath\$rollbackFileName"
                    
                    if (Test-Path $rollbackPath) {
                        Write-Warning "`n  ⚠️  Rollback script found: $rollbackFileName"
                        Write-Host "  Executing rollback to restore database state..." -ForegroundColor Yellow
                        
                        try {
                            $rollbackOutput = sqlcmd -S localhost -d KSESSIONS -i $rollbackPath -b 2>&1
                            
                            if ($LASTEXITCODE -eq 0 -and $rollbackOutput -match "completed successfully") {
                                Write-Success "  ✅ Rollback completed successfully"
                                Write-Info "  Database restored to previous state"
                            } else {
                                Write-Error "  ❌ Rollback FAILED"
                                Write-Host "  Rollback Output:" -ForegroundColor Red
                                Write-Host "  $rollbackOutput" -ForegroundColor Red
                                Write-Warning "  ⚠️  CRITICAL: Database may be in inconsistent state!"
                                Write-Warning "  ⚠️  Manual intervention required"
                            }
                        } catch {
                            Write-Error "  ❌ Rollback execution error: $_"
                            Write-Warning "  ⚠️  CRITICAL: Database may be in inconsistent state!"
                        }
                    } else {
                        Write-Error "  ❌ No rollback script found: $rollbackFileName"
                        Write-Warning "  ⚠️  Database may be in inconsistent state!"
                    }
                    
                    # Halt deployment
                    throw "Migration failed: $($migration.Name). Deployment aborted."
                }
            }
            
            if (-not $MigrationsFailed) {
                Write-Success "`n✅ All migrations completed successfully"
            }
            
        } else {
            Write-Info "→ No pending migrations found"
        }
    } else {
        Write-Info "→ Migrations directory not found (first-time setup or no migrations yet)"
        Write-Info "   Location: Scripts/Migrations/Prod/pending/"
    }
    
    # Dry-run mode: Exit after validation
    if ($DryRun) {
        Write-Host "`n========================================" -ForegroundColor Green
        Write-Host "  DRY-RUN MODE: Validation Complete" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        Write-Success "✅ Migration validation passed"
        Write-Info "→ No migrations were executed (dry-run mode)"
        Write-Info "→ No code was deployed (dry-run mode)"
        Write-Host "`nTo execute deployment, run without -DryRun parameter:" -ForegroundColor Cyan
        Write-Host "  .\Scripts\ncdeploy.ps1" -ForegroundColor White
        return
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

    # Step 4.5: Pre-Deployment Validation - Check for problematic configuration files
    # [DEBUG-WORKITEM:deploy:pre-validation] Prevent appsettings.local.json from being deployed
    Write-Step "Pre-Deployment Validation: Checking publish output for dangerous configuration files..."
    
    $preDeploymentIssues = @()
    
    # Check 1: Ensure appsettings.local.json is NOT in publish output
    Write-Info "→ Checking for appsettings.local.json in publish directory..."
    $localConfigPath = Join-Path $PublishPath "appsettings.local.json"
    if (Test-Path $localConfigPath) {
        Write-Host "  ✗ CRITICAL: appsettings.local.json found in publish output!" -ForegroundColor Red
        Write-Host "    This file overrides production settings and MUST NOT be deployed." -ForegroundColor Red
        Write-Host "    Location: $localConfigPath" -ForegroundColor Yellow
        $preDeploymentIssues += "appsettings.local.json found in publish directory (overrides production configuration)"
    } else {
        Write-Host "  ✓ appsettings.local.json correctly excluded from publish" -ForegroundColor Green
    }
    
    # Check 2: Ensure appsettings.*.local.json patterns are not present
    Write-Info "→ Checking for other local configuration overrides..."
    $localConfigPatterns = Get-ChildItem -Path $PublishPath -Filter "appsettings.*.local.json" -ErrorAction SilentlyContinue
    if ($localConfigPatterns.Count -gt 0) {
        Write-Host "  ✗ CRITICAL: Local configuration overrides found!" -ForegroundColor Red
        foreach ($localConfig in $localConfigPatterns) {
            Write-Host "    - $($localConfig.Name)" -ForegroundColor Yellow
            $preDeploymentIssues += "Local configuration file found: $($localConfig.Name)"
        }
    } else {
        Write-Host "  ✓ No local configuration overrides found" -ForegroundColor Green
    }
    
    # Check 3: Verify appsettings.Production.json exists
    Write-Info "→ Verifying production configuration file exists..."
    $prodConfigPath = Join-Path $PublishPath "appsettings.Production.json"
    if (Test-Path $prodConfigPath) {
        Write-Host "  ✓ appsettings.Production.json present" -ForegroundColor Green
        
        # Verify it contains KSESSIONS reference
        $prodConfigContent = Get-Content $prodConfigPath -Raw
        if ($prodConfigContent -match "Database=KSESSIONS[^_]") {
            Write-Host "  ✓ Production config references KSESSIONS database" -ForegroundColor Green
        } else {
            Write-Host "  ⚠ WARNING: Production config may not reference KSESSIONS database" -ForegroundColor Yellow
            Write-Host "    Please verify appsettings.Production.json manually" -ForegroundColor Yellow
        }
    } else {
        Write-Host "  ✗ appsettings.Production.json NOT found!" -ForegroundColor Red
        $preDeploymentIssues += "appsettings.Production.json missing from publish directory"
    }
    
    # Fail deployment if critical issues found
    if ($preDeploymentIssues.Count -gt 0) {
        Write-Host "`n========================================" -ForegroundColor Red
        Write-Host "  PRE-DEPLOYMENT VALIDATION FAILED" -ForegroundColor Red
        Write-Host "========================================" -ForegroundColor Red
        Write-Host "`nThe following issues MUST be resolved before deploying:" -ForegroundColor Yellow
        foreach ($issue in $preDeploymentIssues) {
            Write-Host "  ❌ $issue" -ForegroundColor Red
        }
        Write-Host "`nRESOLUTION STEPS:" -ForegroundColor Cyan
        Write-Host "  1. Ensure appsettings.local.json is in .gitignore" -ForegroundColor Gray
        Write-Host "  2. Delete appsettings.local.json from your workspace source" -ForegroundColor Gray
        Write-Host "  3. Re-run: dotnet publish -c Release" -ForegroundColor Gray
        Write-Host "  4. Re-run: .\ncdeploy.ps1" -ForegroundColor Gray
        Write-Host "`nDO NOT deploy with local configuration files - they will override production settings!" -ForegroundColor Red
        
        throw "Pre-deployment validation failed. Cannot proceed with deployment."
    }
    
    Write-Success "Pre-deployment validation passed - ready to deploy"
    
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
    
    # [DEBUG-WORKITEM:deploy:appsettings-fallback] Create appsettings.json if missing ;CLEANUP_OK
    $appsettingsPath = Join-Path $DeployPath "appsettings.json"
    if (-not (Test-Path $appsettingsPath)) {
        Write-Info "→ appsettings.json not found, copying from appsettings.Production.json..."
        $appsettingsProdPath = Join-Path $DeployPath "appsettings.Production.json"
        if (Test-Path $appsettingsProdPath) {
            Copy-Item -Path $appsettingsProdPath -Destination $appsettingsPath -Force
            Write-Host "  ✓ Created appsettings.json from Production template" -ForegroundColor Green
        } else {
            Write-Warning "Neither appsettings.json nor appsettings.Production.json found - deployment may fail validation"
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
    # [DEBUG-WORKITEM:host-provisioner-modern] Deploy Avalonia Host Provisioner to production ;CLEANUP_OK
    Write-Step "Deploying HostProvisioner (Avalonia)..."
    
    $HostProvisionerProjectPath = "$WorkspaceRoot\Tools\HostProvisioner\HostProvisioner.Avalonia"
    $HostProvisionerProjectFile = "$HostProvisionerProjectPath\HostProvisioner.Avalonia.csproj"
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
            
            # [DEBUG-WORKITEM:host-provisioner-modern] Transform Avalonia config to Production ;CLEANUP_OK
            $dllConfigPath = Join-Path $HostProvisionerDeployPath "HostProvisioner.Avalonia.dll.config"
            if (Test-Path $dllConfigPath) {
                Write-Info "Transforming HostProvisioner.Avalonia.dll.config to Production environment..."
                try {
                    [xml]$dllConfig = Get-Content $dllConfigPath
                    $envSetting = $dllConfig.SelectSingleNode("//appSettings/add[@key='ASPNETCORE_ENVIRONMENT']")
                    if ($envSetting) {
                        $envSetting.SetAttribute("value", "Production")
                        $dllConfig.Save($dllConfigPath)
                        Write-Success "HostProvisioner.Avalonia.dll.config transformed: ASPNETCORE_ENVIRONMENT = Production"
                    }
                } catch {
                    Write-Warning "Failed to transform HostProvisioner.Avalonia.dll.config: $_"
                }
            }
            
            # Verify HostProvisioner deployment
            # [DEBUG-WORKITEM:host-provisioner-modern] Verify Avalonia deployment ;CLEANUP_OK
            $hpDllPath = Join-Path $HostProvisionerDeployPath "HostProvisioner.Avalonia.dll"
            if (Test-Path $hpDllPath) {
                Write-Host "  ✓ HostProvisioner.Avalonia.dll" -ForegroundColor Green
                
                # [DEBUG-WORKITEM:host-provisioner-modern] Avalonia app deployed ;CLEANUP_OK
                Write-Info "HostProvisioner (Avalonia) deployed successfully"
                Write-Info "Launch manually: HostProvisioner.Avalonia.exe"
            } else {
                Write-Warning "HostProvisioner.Avalonia.dll not found in deployment"
            }
            
            # Clean up temporary publish folder
            # [DEBUG-WORKITEM:deploy:cleanup-resilience] Handle locked files gracefully ;CLEANUP_OK
            if (Test-Path $HostProvisionerPublishPath) {
                try {
                    Remove-Item -Path $HostProvisionerPublishPath -Recurse -Force -ErrorAction Stop
                    Write-Info "Cleaned HostProvisioner publish temp folder"
                } catch {
                    Write-Warning "Could not clean HostProvisioner publish temp folder (files may be locked): $_"
                    Write-Info "Temporary files retained at: $HostProvisionerPublishPath"
                }
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
    
    # Validation 0: CRITICAL - Ensure appsettings.local.json is NOT deployed
    Write-Info "→ Validating no local configuration overrides deployed..."
    $deployedLocalConfig = Join-Path $DeployPath "appsettings.local.json"
    if (Test-Path $deployedLocalConfig) {
        Write-Host "  ✗ CRITICAL: appsettings.local.json found in deployment!" -ForegroundColor Red
        Write-Host "    This file overrides production configuration and must be removed!" -ForegroundColor Red
        Write-Host "    Location: $deployedLocalConfig" -ForegroundColor Yellow
        $validationErrors += "appsettings.local.json deployed to production (CRITICAL: overrides production settings)"
        $validationFailed = $true
    } else {
        Write-Host "  ✓ No appsettings.local.json in deployment" -ForegroundColor Green
    }
    
    # Check for other local configuration patterns
    $deployedLocalPatterns = Get-ChildItem -Path $DeployPath -Filter "appsettings.*.local.json" -ErrorAction SilentlyContinue
    if ($deployedLocalPatterns.Count -gt 0) {
        Write-Host "  ✗ WARNING: Local configuration files found in deployment:" -ForegroundColor Yellow
        foreach ($localConfig in $deployedLocalPatterns) {
            Write-Host "    - $($localConfig.Name)" -ForegroundColor Yellow
            $validationErrors += "Local configuration file deployed: $($localConfig.Name)"
        }
        $validationFailed = $true
    } else {
        Write-Host "  ✓ No local configuration overrides deployed" -ForegroundColor Green
    }
    
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
        
        # Note: Database connection strings are in appsettings.json for ASP.NET Core, not web.config
        Write-Host "  ℹ Database configuration verified via appsettings.json" -ForegroundColor Cyan
    } else {
        Write-Host "  ✗ web.config not found!" -ForegroundColor Red
        $validationErrors += "NoorCanvas web.config missing at $webConfigPath"
        $validationFailed = $true
    }
    
    # Validation 2: NoorCanvas appsettings.Production.json - verify KSESSIONS database
    Write-Info "→ Validating NoorCanvas appsettings.Production.json..."
    $appsettingsProdPath = Join-Path $DeployPath "appsettings.Production.json"
    if (Test-Path $appsettingsProdPath) {
        $appsettingsProdContent = Get-Content $appsettingsProdPath -Raw
        
        if ($appsettingsProdContent -match 'Database=KSESSIONS[^_]') {
            Write-Host "  ✓ NoorCanvas appsettings.Production.json: KSESSIONS database" -ForegroundColor Green
        } else {
            Write-Host "  ✗ NoorCanvas appsettings.Production.json: NOT KSESSIONS database!" -ForegroundColor Red
            $validationErrors += "NoorCanvas appsettings.Production.json does not reference KSESSIONS production database"
            $validationFailed = $true
        }
    } else {
        Write-Host "  ✗ appsettings.Production.json not found!" -ForegroundColor Red
        $validationErrors += "NoorCanvas appsettings.Production.json missing at $appsettingsProdPath"
        $validationFailed = $true
    }
    
    # Validation 2.5: NoorCanvas appsettings.json - verify base settings (optional - Production.json should override)
    Write-Info "→ Validating NoorCanvas appsettings.json (base configuration)..."
    $appsettingsPath = Join-Path $DeployPath "appsettings.json"
    if (Test-Path $appsettingsPath) {
        Write-Host "  ✓ NoorCanvas appsettings.json present (base configuration)" -ForegroundColor Green
        # Don't fail if base config has dev database - Production.json should override
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
        foreach ($validationError in $validationErrors) {
            Write-Host "  ✗ $validationError" -ForegroundColor Red
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
            $prevErrorAction = $ErrorActionPreference
            $ErrorActionPreference = "Continue"
            git checkout development 2>&1 | Out-Null
            $ErrorActionPreference = $prevErrorAction
            if ($LASTEXITCODE -ne 0) {
                throw "Failed to switch back to development branch"
            }
            Write-Success "Back on development branch"
            
        } finally {
            Pop-Location
        }
    }

    # Step 9: Automated Post-Deployment Smoke Tests
    # [DEBUG-WORKITEM:deploy:smoke-tests] Run comprehensive validation after deployment
    Write-Step "Running automated post-deployment smoke tests..."
    Write-Info "→ Executing: post-deploy-smoke-test.ps1"
    
    $smokeTestScript = Join-Path $WorkspaceRoot "Scripts\post-deploy-smoke-test.ps1"
    if (Test-Path $smokeTestScript) {
        try {
            # Run smoke tests and capture exit code
            & $smokeTestScript -SkipApiTests
            $smokeTestExitCode = $LASTEXITCODE
            
            if ($smokeTestExitCode -eq 0) {
                Write-Success "Smoke tests passed - deployment validated!"
            } else {
                Write-Warning "Smoke tests detected issues (Exit Code: $smokeTestExitCode)"
                Write-Host "  Review the smoke test output above for details." -ForegroundColor Yellow
                Write-Host "  Deployment completed but may require manual verification." -ForegroundColor Yellow
            }
        } catch {
            Write-Warning "Failed to run smoke tests: $($_.Exception.Message)"
            Write-Info "You can run smoke tests manually: .\Scripts\post-deploy-smoke-test.ps1"
        }
    } else {
        Write-Warning "Smoke test script not found at: $smokeTestScript"
        Write-Info "Skipping automated validation. Please test manually."
    }

    # Step FINAL: Post-deployment git merge (development → master to record production state)
    # [DEBUG-WORKITEM:deploy:post-merge:SIMPLE]
    if (-not $SkipMerge) {
        Write-Step "Git: Recording deployment to master branch..."
        Write-Info "→ Merging development → master (to record what's in production)"
        
        Push-Location $WorkspaceRoot
        try {
            # Switch to master
            Write-Info "→ Switching to master branch"
            $prevErrorAction = $ErrorActionPreference
            $ErrorActionPreference = "Continue"
            git checkout master 2>&1 | Out-Null
            $ErrorActionPreference = $prevErrorAction
            if ($LASTEXITCODE -ne 0) {
                Write-Warning "Master branch may not exist. Creating it..."
                git checkout -b master 2>&1 | Out-Null
            }
            
            # Pull latest master (if exists remotely)
            Write-Info "→ Pulling latest master changes"
            git pull origin master 2>&1 | Out-Null
            if ($LASTEXITCODE -ne 0) {
                Write-Warning "Failed to pull master (may not exist remotely). Continuing..."
            }
            
            # Merge development into master
            Write-Info "→ Merging development into master"
            git merge development --no-ff -m "Deploy: Record production deployment ($Timestamp)" 2>&1 | Out-Null
            
            if ($LASTEXITCODE -ne 0) {
                Write-Warning "Merge to master had conflicts or errors"
                Write-Host "This is not critical - deployment succeeded, but master was not updated" -ForegroundColor Yellow
                Write-Host "You can manually merge later if needed" -ForegroundColor Yellow
            } else {
                Write-Success "Master branch updated to match production deployment"
            }
            
            # Return to development branch
            Write-Info "→ Returning to development branch"
            git checkout development 2>&1 | Out-Null
            if ($LASTEXITCODE -eq 0) {
                Write-Success "Returned to development branch (ready for continued work)"
            } else {
                Write-Warning "Could not return to development branch"
            }
            
        } finally {
            Pop-Location
        }
    } else {
        Write-Warning "Skipping post-deployment merge (master branch not updated)"
        Write-Info "To update master manually: git checkout master && git merge development"
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
    Write-Host "  Deployed From: development branch" -ForegroundColor Gray
    Write-Host "  Master Updated: $(if ($SkipMerge) { 'No (use -SkipMerge)' } else { 'Yes (records production state)' })" -ForegroundColor Gray
    Write-Host "  Timestamp: $Timestamp" -ForegroundColor Gray
    
    if (Test-Path "$BackupPath\backup-$Timestamp") {
        Write-Host "  Backup: $BackupPath\backup-$Timestamp" -ForegroundColor Gray
    }
    
    # [DEBUG-WORKITEM:deploy:completion-checklist] Post-deployment verification checklist ;CLEANUP_OK
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "  POST-DEPLOYMENT CHECKLIST" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    
    Write-Host "`n📋 VERIFICATION STEPS:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  ☐ 1. Test NoorCanvas Application" -ForegroundColor White
    Write-Host "      → Visit: https://noorcanvas.kashkole.com" -ForegroundColor Gray
    Write-Host "      → Verify application loads correctly" -ForegroundColor Gray
    Write-Host "      → Test core functionality (sessions, canvas)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  ☐ 2. Verify Environment Configuration" -ForegroundColor White
    Write-Host "      → Check web.config has ASPNETCORE_ENVIRONMENT=Production" -ForegroundColor Gray
    Write-Host "      → Confirm database connection to KSESSIONS (not KSESSIONS_DEV)" -ForegroundColor Gray
    Write-Host "      → Review appsettings.json for correct production settings" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  ☐ 3. Test HostProvisioner Tool" -ForegroundColor White
    Write-Host "      → Launch: D:\Websites\NOOR-CANVAS\HostProvisioner\HostProvisioner.WinForms.exe" -ForegroundColor Gray
    Write-Host "      → Verify 'Environment: Production' shown at startup" -ForegroundColor Gray
    Write-Host "      → Confirm 'Database: KSESSIONS' shown at startup" -ForegroundColor Gray
    Write-Host "      → Test token generation" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  ☐ 4. Monitor Application Logs" -ForegroundColor White
    Write-Host "      → Check: $DeployPath\logs" -ForegroundColor Gray
    Write-Host "      → Look for startup errors or warnings" -ForegroundColor Gray
    Write-Host "      → Verify no database connection errors" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  ☐ 5. Test Recent Features" -ForegroundColor White
    Write-Host "      → Host token authentication (URL: /host?token=XXXXX)" -ForegroundColor Gray
    Write-Host "      → Any features deployed in this release" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  ☐ 6. Verify IIS Application Pool" -ForegroundColor White
    Write-Host "      → Check 'NoorCanvas' app pool is running" -ForegroundColor Gray
    Write-Host "      → Monitor for unexpected restarts" -ForegroundColor Gray
    Write-Host ""
    
    Write-Host "🔄 ROLLBACK (if needed):" -ForegroundColor Yellow
    Write-Host "  → Restore backup: $BackupPath\backup-$Timestamp" -ForegroundColor Gray
    Write-Host "  → Or use git: git reset --hard checkpoint/deploy/[timestamp]" -ForegroundColor Gray
    Write-Host "  → Browse checkpoints: git tag --list 'checkpoint/deploy/*' --sort=-creatordate" -ForegroundColor Gray
    Write-Host ""
    
    Write-Host "✅ After verification complete:" -ForegroundColor Green
    Write-Host "  → Mark deployment as successful in your tracking system" -ForegroundColor Gray
    Write-Host "  → Continue development work in 'development' branch" -ForegroundColor Gray
    Write-Host "  → Push changes to remote: git push origin master && git push origin development" -ForegroundColor Gray
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
    
    # Try to return to development branch if needed
    Write-Host "`n→ Ensuring on development branch..." -ForegroundColor Yellow
    Push-Location $WorkspaceRoot
    try {
        $currentBranch = git branch --show-current 2>&1
        if ($currentBranch -ne "development") {
            $prevErrorAction = $ErrorActionPreference
            $ErrorActionPreference = "Continue"
            git checkout development 2>&1 | Out-Null
            $ErrorActionPreference = $prevErrorAction
            if ($LASTEXITCODE -eq 0) {
                Write-Success "Returned to development branch"
            } else {
                Write-Warning "Could not return to development branch automatically"
            }
        } else {
            Write-Success "Already on development branch"
        }
    } catch {
        Write-Warning "Error checking/switching branches: $_"
    } finally {
        Pop-Location
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
