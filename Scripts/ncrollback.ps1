<#
.SYNOPSIS
    Rollback NoorCanvas deployment to a previous backup.

.DESCRIPTION
    This script restores the NoorCanvas application from a backup.
    It can list available backups or restore from a specific backup.

.PARAMETER BackupName
    Name of the backup folder to restore (e.g., "backup-2025-10-12_14-30-00").
    If not specified, shows list of available backups.

.PARAMETER Latest
    Restore from the most recent backup automatically.

.PARAMETER AppPool
    Name of the IIS Application Pool to restart. Default: "NoorCanvas"

.PARAMETER SkipIIS
    Skip IIS-related operations (stop/start app pool).

.PARAMETER Force
    Skip confirmation prompt.

.EXAMPLE
    .\ncrollback.ps1
    List available backups

.EXAMPLE
    .\ncrollback.ps1 -Latest
    Restore from the most recent backup

.EXAMPLE
    .\ncrollback.ps1 -BackupName "backup-2025-10-12_14-30-00"
    Restore from a specific backup

.EXAMPLE
    .\ncrollback.ps1 -Latest -Force
    Restore from latest backup without confirmation
#>

param(
    [string]$BackupName,
    [switch]$Latest,
    [string]$AppPool = "NoorCanvas",
    [switch]$SkipIIS,
    [switch]$Force
)

$ErrorActionPreference = "Stop"

# Configuration
$DeployPath = "D:\Websites\NOOR-CANVAS"
$BackupPath = "D:\Websites\NOOR-CANVAS-Backups"
$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"

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

function Get-AvailableBackups {
    if (-not (Test-Path $BackupPath)) {
        return @()
    }
    
    return Get-ChildItem -Path $BackupPath -Directory | 
           Where-Object { $_.Name -like "backup-*" } |
           Sort-Object CreationTime -Descending
}

function Show-BackupList {
    param($Backups)
    
    Write-Host "`nAvailable Backups:" -ForegroundColor Cyan
    Write-Host ("=" * 80) -ForegroundColor Gray
    
    if ($Backups.Count -eq 0) {
        Write-Warning "No backups found in $BackupPath"
        return
    }
    
    $index = 1
    foreach ($backup in $Backups) {
        $size = (Get-ChildItem -Path $backup.FullName -Recurse | Measure-Object -Property Length -Sum).Sum
        $sizeInMB = [math]::Round($size / 1MB, 2)
        
        Write-Host ("{0,3}. " -f $index) -NoNewline -ForegroundColor Yellow
        Write-Host $backup.Name -NoNewline -ForegroundColor White
        Write-Host (" ({0} MB, Created: {1})" -f $sizeInMB, $backup.CreationTime) -ForegroundColor Gray
        
        $index++
    }
    
    Write-Host ("=" * 80) -ForegroundColor Gray
    Write-Host "`nTo restore a backup, use:" -ForegroundColor Cyan
    Write-Host "  .\ncrollback.ps1 -BackupName `"backup-name-here`"" -ForegroundColor Gray
    Write-Host "  .\ncrollback.ps1 -Latest" -ForegroundColor Gray
}

function Confirm-Rollback {
    param(
        [string]$BackupFolder,
        [datetime]$BackupDate
    )
    
    Write-Host "`n" -NoNewline
    Write-Host "WARNING: " -ForegroundColor Yellow -NoNewline
    Write-Host "This will restore the application to the backup from:" -ForegroundColor White
    Write-Host "  Backup: $BackupFolder" -ForegroundColor Cyan
    Write-Host "  Date: $BackupDate" -ForegroundColor Cyan
    Write-Host "  Current deployment will be overwritten!" -ForegroundColor Red
    
    $response = Read-Host "`nAre you sure you want to continue? (yes/no)"
    return ($response -eq "yes" -or $response -eq "y")
}

try {
    Write-Host "`n========================================" -ForegroundColor Magenta
    Write-Host "  NoorCanvas Rollback Script" -ForegroundColor Magenta
    Write-Host "========================================`n" -ForegroundColor Magenta

    # Get available backups
    $backups = Get-AvailableBackups

    # If no parameters, just show the list
    if (-not $BackupName -and -not $Latest) {
        Show-BackupList -Backups $backups
        exit 0
    }

    # Determine which backup to restore
    $selectedBackup = $null

    if ($Latest) {
        if ($backups.Count -eq 0) {
            throw "No backups available to restore"
        }
        $selectedBackup = $backups[0]
        Write-Step "Selected latest backup: $($selectedBackup.Name)"
    } else {
        $selectedBackup = $backups | Where-Object { $_.Name -eq $BackupName }
        if (-not $selectedBackup) {
            Write-Error "Backup not found: $BackupName"
            Write-Host "`nAvailable backups:" -ForegroundColor Cyan
            Show-BackupList -Backups $backups
            exit 1
        }
        Write-Step "Selected backup: $($selectedBackup.Name)"
    }

    # Confirm rollback
    if (-not $Force) {
        if (-not (Confirm-Rollback -BackupFolder $selectedBackup.Name -BackupDate $selectedBackup.CreationTime)) {
            Write-Warning "Rollback cancelled by user"
            exit 0
        }
    }

    # Verify backup integrity
    Write-Step "Verifying backup integrity..."
    
    $requiredFiles = @(
        "NoorCanvas.dll",
        "web.config"
    )

    $backupValid = $true
    foreach ($file in $requiredFiles) {
        $filePath = Join-Path $selectedBackup.FullName $file
        if (-not (Test-Path $filePath)) {
            Write-Warning "Required file missing in backup: $file"
            $backupValid = $false
        }
    }

    if (-not $backupValid) {
        throw "Backup appears to be incomplete or corrupted"
    }

    Write-Success "Backup verification passed"

    # Stop IIS Application Pool
    if (-not $SkipIIS) {
        Write-Step "Stopping IIS Application Pool: $AppPool..."
        
        try {
            Import-Module WebAdministration -ErrorAction Stop
            
            $pool = Get-WebAppPoolState -Name $AppPool -ErrorAction SilentlyContinue
            if ($pool) {
                if ($pool.Value -ne "Stopped") {
                    Stop-WebAppPool -Name $AppPool
                    
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
                Write-Warning "Application pool '$AppPool' not found"
            }
        } catch {
            Write-Warning "Could not stop IIS App Pool: $_"
        }
    }

    # Create a backup of current state before rollback
    Write-Step "Creating safety backup of current deployment..."
    
    if (Test-Path $DeployPath) {
        $safetyBackupFolder = "$BackupPath\pre-rollback-$Timestamp"
        New-Item -ItemType Directory -Path $safetyBackupFolder -Force | Out-Null
        Copy-Item -Path "$DeployPath\*" -Destination $safetyBackupFolder -Recurse -Force
        Write-Success "Safety backup created: pre-rollback-$Timestamp"
    }

    # Restore from backup
    Write-Step "Restoring from backup..."
    
    # Clear current deployment (except logs)
    if (Test-Path $DeployPath) {
        Get-ChildItem -Path $DeployPath | Where-Object { $_.Name -ne "logs" } | Remove-Item -Recurse -Force
        Write-Success "Cleared current deployment"
    }

    # Copy backup files to deployment location
    Copy-Item -Path "$($selectedBackup.FullName)\*" -Destination $DeployPath -Recurse -Force
    Write-Success "Restored files from backup"

    # Ensure logs directory exists
    $logsPath = Join-Path $DeployPath "logs"
    if (-not (Test-Path $logsPath)) {
        New-Item -ItemType Directory -Path $logsPath -Force | Out-Null
    }

    # Start IIS Application Pool
    if (-not $SkipIIS) {
        Write-Step "Starting IIS Application Pool: $AppPool..."
        
        try {
            $pool = Get-WebAppPoolState -Name $AppPool -ErrorAction SilentlyContinue
            if ($pool) {
                Start-WebAppPool -Name $AppPool
                
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

    # Verify restoration
    Write-Step "Verifying restoration..."
    
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
        throw "Restoration verification failed"
    }

    # Final summary
    Write-Host "`n========================================" -ForegroundColor Magenta
    Write-Host "  ROLLBACK SUCCESSFUL!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Magenta
    Write-Host "Restored from: $($selectedBackup.Name)" -ForegroundColor White
    Write-Host "Backup date: $($selectedBackup.CreationTime)" -ForegroundColor White
    Write-Host "Safety backup: pre-rollback-$Timestamp" -ForegroundColor White
    
    Write-Host "`nNext steps:" -ForegroundColor Cyan
    Write-Host "  1. Verify the application is working correctly" -ForegroundColor Gray
    Write-Host "  2. Check logs for any issues" -ForegroundColor Gray
    Write-Host "  3. Monitor application behavior" -ForegroundColor Gray
    Write-Host ""

} catch {
    Write-Host "`n========================================" -ForegroundColor Red
    Write-Host "  ROLLBACK FAILED!" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Error $_.Exception.Message
    Write-Host "`nError Details:" -ForegroundColor Yellow
    Write-Host $_.ScriptStackTrace -ForegroundColor Gray
    
    # Try to restart the app pool
    if (-not $SkipIIS) {
        Write-Host "`nAttempting to restart application pool..." -ForegroundColor Yellow
        try {
            Start-WebAppPool -Name $AppPool -ErrorAction SilentlyContinue
        } catch {
            # Ignore
        }
    }
    
    exit 1
}
