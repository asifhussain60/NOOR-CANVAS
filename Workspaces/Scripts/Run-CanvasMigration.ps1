<#
.SYNOPSIS
    Executes the Canvas schema migration from KSESSIONS_DEV to KSESSIONS database.

.DESCRIPTION
    This PowerShell script provides a user-friendly wrapper for executing the SQL migration
    script. It includes safety checks, automatic logging, and post-migration verification.

.PARAMETER ServerName
    SQL Server instance name (default: localhost)

.PARAMETER BackupFirst
    Create a backup before migration (recommended for production)

.PARAMETER DryRun
    Show what would be done without executing the migration

.PARAMETER OpenLog
    Automatically open the log file after completion

.EXAMPLE
    .\Run-CanvasMigration.ps1
    Runs the migration on localhost without backup

.EXAMPLE
    .\Run-CanvasMigration.ps1 -BackupFirst -OpenLog
    Creates backup, runs migration, and opens the log file

.EXAMPLE
    .\Run-CanvasMigration.ps1 -ServerName "PROD-SQL-01" -BackupFirst
    Runs migration on production server with backup

.EXAMPLE
    .\Run-CanvasMigration.ps1 -DryRun
    Shows what would be executed without making any changes
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $false)]
    [string]$ServerName = "localhost",
    
    [Parameter(Mandatory = $false)]
    [switch]$BackupFirst,
    
    [Parameter(Mandatory = $false)]
    [switch]$DryRun,
    
    [Parameter(Mandatory = $false)]
    [switch]$OpenLog
)

$ErrorActionPreference = "Stop"
$ScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$MigrationScriptPath = Join-Path $ScriptRoot "KSESSIONS_Canvas_Migration_Script.sql"
$LogsDir = Join-Path $ScriptRoot "logs"
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$LogFile = Join-Path $LogsDir "migration_$Timestamp.log"

# Ensure logs directory exists
if (-not (Test-Path $LogsDir)) {
    New-Item -ItemType Directory -Path $LogsDir -Force | Out-Null
}

# Banner
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "  CANVAS SCHEMA MIGRATION - KSESSIONS_DEV → KSESSIONS" -ForegroundColor Cyan
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Server:        $ServerName" -ForegroundColor Yellow
Write-Host "Script:        $MigrationScriptPath" -ForegroundColor Yellow
Write-Host "Log File:      $LogFile" -ForegroundColor Yellow
Write-Host "Mode:          $(if ($DryRun) { 'DRY RUN (No Changes)' } else { 'EXECUTE' })" -ForegroundColor $(if ($DryRun) { 'Magenta' } else { 'Green' })
Write-Host ""

# Verify migration script exists
if (-not (Test-Path $MigrationScriptPath)) {
    Write-Host "❌ ERROR: Migration script not found at: $MigrationScriptPath" -ForegroundColor Red
    exit 1
}

# Check for sqlcmd
$sqlcmdPath = Get-Command sqlcmd -ErrorAction SilentlyContinue
if (-not $sqlcmdPath) {
    Write-Host "❌ ERROR: sqlcmd not found. Please install SQL Server Command Line Utilities." -ForegroundColor Red
    Write-Host "   Download: https://learn.microsoft.com/en-us/sql/tools/sqlcmd-utility" -ForegroundColor Yellow
    exit 1
}

# Verify database connectivity
Write-Host "[1/5] Verifying database connectivity..." -ForegroundColor Cyan
try {
    $testQuery = "SELECT name FROM sys.databases WHERE name IN ('KSESSIONS', 'KSESSIONS_DEV')"
    $databases = sqlcmd -S $ServerName -E -Q $testQuery -h -1 -W 2>&1
    
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to connect to SQL Server: $databases"
    }
    
    $dbList = $databases | Where-Object { $_ -match '\S' } | ForEach-Object { $_.Trim() }
    
    if ($dbList -notcontains "KSESSIONS") {
        Write-Host "   ❌ ERROR: KSESSIONS database not found on $ServerName" -ForegroundColor Red
        exit 1
    }
    
    if ($dbList -notcontains "KSESSIONS_DEV") {
        Write-Host "   ❌ ERROR: KSESSIONS_DEV database not found on $ServerName" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "   ✅ Both KSESSIONS and KSESSIONS_DEV databases found" -ForegroundColor Green
} catch {
    Write-Host "   ❌ ERROR: Database connectivity check failed: $_" -ForegroundColor Red
    exit 1
}

# Check current record counts
Write-Host "[2/5] Checking current data state..." -ForegroundColor Cyan
try {
    $countQuery = @"
SELECT 
    'DEV_AssetLookup' AS Source, COUNT(*) AS Count 
FROM KSESSIONS_DEV.canvas.AssetLookup
UNION ALL
SELECT 'DEV_Sessions', COUNT(*) FROM KSESSIONS_DEV.canvas.Sessions
UNION ALL
SELECT 'PROD_AssetLookup', COUNT(*) FROM KSESSIONS.canvas.AssetLookup
UNION ALL
SELECT 'PROD_Sessions', COUNT(*) FROM KSESSIONS.canvas.Sessions
"@
    
    $counts = sqlcmd -S $ServerName -E -Q $countQuery -h -1 2>&1 | Where-Object { $_ -match '\S' }
    
    if ($counts) {
        Write-Host "   Current record counts:" -ForegroundColor Gray
        $counts | ForEach-Object { Write-Host "      $_" -ForegroundColor Gray }
    } else {
        Write-Host "   ⚠️  Note: Canvas schema may not exist yet in KSESSIONS (first run)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ⚠️  Could not retrieve record counts (schema may not exist yet)" -ForegroundColor Yellow
}

# Backup if requested
if ($BackupFirst -and -not $DryRun) {
    Write-Host "[3/5] Creating database backup..." -ForegroundColor Cyan
    $backupDir = Join-Path $ScriptRoot "backups"
    if (-not (Test-Path $backupDir)) {
        New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
    }
    
    $backupFile = Join-Path $backupDir "KSESSIONS_PreMigration_$Timestamp.bak"
    $backupQuery = "BACKUP DATABASE KSESSIONS TO DISK = '$backupFile' WITH FORMAT, INIT, NAME = 'Pre-Migration Backup';"
    
    try {
        sqlcmd -S $ServerName -E -Q $backupQuery -d master | Out-File -FilePath $LogFile -Append
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   ✅ Backup created: $backupFile" -ForegroundColor Green
        } else {
            throw "Backup command failed with exit code $LASTEXITCODE"
        }
    } catch {
        Write-Host "   ❌ ERROR: Backup failed: $_" -ForegroundColor Red
        Write-Host "   Migration aborted for safety." -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "[3/5] Skipping backup (use -BackupFirst to enable)" -ForegroundColor Yellow
}

# Execute migration or dry run
if ($DryRun) {
    Write-Host "[4/5] DRY RUN MODE - Showing script preview..." -ForegroundColor Magenta
    Write-Host ""
    Write-Host "   Would execute: $MigrationScriptPath" -ForegroundColor Gray
    Write-Host "   Target Server: $ServerName" -ForegroundColor Gray
    Write-Host "   Target Database: KSESSIONS" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   To execute for real, remove the -DryRun parameter" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Script preview (first 50 lines):" -ForegroundColor Cyan
    Get-Content $MigrationScriptPath -First 50
} else {
    Write-Host "[4/5] Executing migration script..." -ForegroundColor Cyan
    Write-Host "   This may take 5-30 seconds depending on data volume..." -ForegroundColor Gray
    Write-Host ""
    
    try {
        # Execute the migration script and capture output
        sqlcmd -S $ServerName -d KSESSIONS -E -i $MigrationScriptPath -o $LogFile
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "   ✅ Migration script executed successfully!" -ForegroundColor Green
            
            # Check log for success/failure markers
            $logContent = Get-Content $LogFile -Raw
            if ($logContent -match "MIGRATION COMPLETED SUCCESSFULLY") {
                Write-Host "   ✅ Migration validation: SUCCESS" -ForegroundColor Green
            } elseif ($logContent -match "MIGRATION FAILED") {
                Write-Host "   ❌ Migration validation: FAILED" -ForegroundColor Red
                Write-Host "   Check log file for details: $LogFile" -ForegroundColor Yellow
            }
        } else {
            Write-Host ""
            Write-Host "   ❌ Migration script failed with exit code: $LASTEXITCODE" -ForegroundColor Red
            Write-Host "   Check log file for details: $LogFile" -ForegroundColor Yellow
        }
    } catch {
        Write-Host ""
        Write-Host "   ❌ ERROR executing migration: $_" -ForegroundColor Red
        Write-Host "   Check log file for details: $LogFile" -ForegroundColor Yellow
        exit 1
    }
}

# Verification
if (-not $DryRun) {
    Write-Host "[5/5] Post-migration verification..." -ForegroundColor Cyan
    
    $verifyQuery = @"
SELECT 'AssetLookup' AS [Table], COUNT(*) AS [Records] FROM KSESSIONS.canvas.AssetLookup
UNION ALL
SELECT 'Sessions', COUNT(*) FROM KSESSIONS.canvas.Sessions
UNION ALL
SELECT 'Participants', COUNT(*) FROM KSESSIONS.canvas.Participants
UNION ALL
SELECT 'SessionData', COUNT(*) FROM KSESSIONS.canvas.SessionData;
"@
    
    try {
        $results = sqlcmd -S $ServerName -E -Q $verifyQuery -h -1 2>&1 | Where-Object { $_ -match '\S' }
        
        if ($results) {
            Write-Host "   Final record counts in KSESSIONS:" -ForegroundColor Gray
            $results | ForEach-Object { Write-Host "      $_" -ForegroundColor Gray }
        }
    } catch {
        Write-Host "   ⚠️  Could not verify final counts" -ForegroundColor Yellow
    }
} else {
    Write-Host "[5/5] Verification skipped (dry run mode)" -ForegroundColor Yellow
}

# Summary
Write-Host ""
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "  MIGRATION COMPLETE" -ForegroundColor Cyan
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Log file saved to: $LogFile" -ForegroundColor Yellow

if (-not $DryRun) {
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "  1. Review the log file for any warnings or errors" -ForegroundColor White
    Write-Host "  2. Test canvas functionality in your application" -ForegroundColor White
    Write-Host "  3. Monitor application logs for any issues" -ForegroundColor White
    Write-Host ""
    Write-Host "💡 TIP: This script is idempotent - safe to run again if needed" -ForegroundColor Green
}

Write-Host ""

# Open log file if requested
if ($OpenLog -and -not $DryRun) {
    Write-Host "Opening log file..." -ForegroundColor Cyan
    Start-Process notepad $LogFile
}

exit 0
