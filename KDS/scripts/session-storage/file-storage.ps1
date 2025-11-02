# KDS Session Storage - File-Based Implementation
# Purpose: Implement session-loader.md abstraction using local file storage
# Version: 5.0 (SOLID Refactor - DIP Compliance)
# Dependencies: ZERO external (PowerShell built-ins only)

<#
.SYNOPSIS
Session storage operations (load, save, list) for KDS session state.

.DESCRIPTION
Implements the session-loader.md abstraction interface using local file storage.
100% local (zero external dependencies). All operations use PowerShell built-ins.

.PARAMETER Operation
The operation to perform: load_current, load_by_id, save, list_recent

.PARAMETER SessionId
(Optional) Session ID for load_by_id operation

.PARAMETER SessionData
(Optional) Session JSON string for save operation

.PARAMETER Limit
(Optional) Number of recent sessions to list (default: 10)

.EXAMPLE
# Load current session
.\file-storage.ps1 -Operation load_current

.EXAMPLE
# Save session
.\file-storage.ps1 -Operation save -SessionData $jsonString

.EXAMPLE
# List recent sessions
.\file-storage.ps1 -Operation list_recent -Limit 5
#>

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet('load_current', 'load_by_id', 'save', 'list_recent')]
    [string]$Operation,
    
    [Parameter(Mandatory=$false)]
    [string]$SessionId,
    
    [Parameter(Mandatory=$false)]
    [string]$SessionData,
    
    [Parameter(Mandatory=$false)]
    [int]$Limit = 10
)

# === Configuration (from kds.config.json or defaults) ===
$script:SessionDir = Join-Path $PSScriptRoot "../../sessions"
$script:CurrentSessionFile = Join-Path $SessionDir "current-session.json"
$script:BackupDir = Join-Path $SessionDir "backups"
$script:MaxBackups = 5

# === Ensure directories exist ===
function Initialize-Directories {
    if (-not (Test-Path $script:SessionDir)) {
        New-Item -ItemType Directory -Path $script:SessionDir -Force | Out-Null
    }
    if (-not (Test-Path $script:BackupDir)) {
        New-Item -ItemType Directory -Path $script:BackupDir -Force | Out-Null
    }
}

# === Validation ===
function Test-SessionValid {
    param([hashtable]$Session)
    
    $requiredFields = @('sessionId', 'feature', 'status', 'phases')
    foreach ($field in $requiredFields) {
        if (-not $Session.ContainsKey($field)) {
            Write-Error "Invalid session: missing field '$field'"
            return $false
        }
    }
    return $true
}

# === Load Current Session ===
function Get-CurrentSession {
    if (-not (Test-Path $script:CurrentSessionFile)) {
        Write-Output $null
        return
    }
    
    try {
        $content = Get-Content -Path $script:CurrentSessionFile -Raw -ErrorAction Stop
        $session = $content | ConvertFrom-Json -AsHashtable -ErrorAction Stop
        
        if (Test-SessionValid -Session $session) {
            # Update last accessed timestamp
            $session.lastAccessed = Get-Date -Format "o"
            Write-Output $session
        } else {
            Write-Error "SESSION_INVALID_FORMAT"
            Write-Output $null
        }
    } catch {
        Write-Error "SESSION_LOAD_ERROR: $($_.Exception.Message)"
        Write-Output $null
    }
}

# === Load Session By ID ===
function Get-SessionById {
    param([string]$Id)
    
    # Try current session first
    $current = Get-CurrentSession
    if ($current -and $current.sessionId -eq $Id) {
        Write-Output $current
        return
    }
    
    # Search in backups
    $backupPattern = Join-Path $script:BackupDir "*-$Id.json"
    $backupFiles = Get-ChildItem -Path $backupPattern -ErrorAction SilentlyContinue
    
    if ($backupFiles.Count -gt 0) {
        $latestBackup = $backupFiles | Sort-Object LastWriteTime -Descending | Select-Object -First 1
        try {
            $content = Get-Content -Path $latestBackup.FullName -Raw
            $session = $content | ConvertFrom-Json -AsHashtable
            Write-Output $session
        } catch {
            Write-Error "SESSION_LOAD_ERROR: $($_.Exception.Message)"
            Write-Output $null
        }
    } else {
        Write-Error "SESSION_NOT_FOUND: $Id"
        Write-Output $null
    }
}

# === Save Session ===
function Save-Session {
    param([string]$JsonData)
    
    try {
        # Parse and validate
        $session = $JsonData | ConvertFrom-Json -AsHashtable -ErrorAction Stop
        
        if (-not (Test-SessionValid -Session $session)) {
            Write-Error "VALIDATION_FAILED"
            return $false
        }
        
        # Update timestamp
        $session.lastUpdated = Get-Date -Format "o"
        
        # Backup existing current session
        if (Test-Path $script:CurrentSessionFile) {
            $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
            $sessionId = $session.sessionId
            $backupFile = Join-Path $script:BackupDir "$timestamp-$sessionId.json"
            Copy-Item -Path $script:CurrentSessionFile -Destination $backupFile -Force
            
            # Clean old backups (keep only MaxBackups)
            $backups = Get-ChildItem -Path (Join-Path $script:BackupDir "*.json") | 
                       Sort-Object LastWriteTime -Descending
            if ($backups.Count -gt $script:MaxBackups) {
                $backups | Select-Object -Skip $script:MaxBackups | Remove-Item -Force
            }
        }
        
        # Save new session
        $session | ConvertTo-Json -Depth 10 | Set-Content -Path $script:CurrentSessionFile -Force
        Write-Output $true
        
    } catch {
        Write-Error "SAVE_FAILED: $($_.Exception.Message)"
        return $false
    }
}

# === List Recent Sessions ===
function Get-RecentSessions {
    param([int]$Count)
    
    $sessions = @()
    
    # Add current session
    $current = Get-CurrentSession
    if ($current) {
        $sessions += @{
            sessionId = $current.sessionId
            feature = $current.feature
            status = $current.status
            lastUpdated = $current.lastUpdated
            completedTasks = $current.completedTasks.Count
            totalTasks = $current.totalTasks
        }
    }
    
    # Add from backups
    $backups = Get-ChildItem -Path (Join-Path $script:BackupDir "*.json") -ErrorAction SilentlyContinue |
               Sort-Object LastWriteTime -Descending |
               Select-Object -First ($Count - 1)
    
    foreach ($backup in $backups) {
        try {
            $content = Get-Content -Path $backup.FullName -Raw
            $session = $content | ConvertFrom-Json -AsHashtable
            $sessions += @{
                sessionId = $session.sessionId
                feature = $session.feature
                status = $session.status
                lastUpdated = $session.lastUpdated
                completedTasks = $session.completedTasks.Count
                totalTasks = $session.totalTasks
            }
        } catch {
            # Skip invalid backups
            continue
        }
    }
    
    Write-Output ($sessions | Select-Object -First $Count)
}

# === Main Execution ===
Initialize-Directories

switch ($Operation) {
    'load_current' {
        $result = Get-CurrentSession
        if ($result) {
            $result | ConvertTo-Json -Depth 10
        } else {
            Write-Output "null"
        }
    }
    
    'load_by_id' {
        if (-not $SessionId) {
            Write-Error "SESSION_ID_REQUIRED"
            exit 1
        }
        $result = Get-SessionById -Id $SessionId
        if ($result) {
            $result | ConvertTo-Json -Depth 10
        } else {
            Write-Output "null"
        }
    }
    
    'save' {
        if (-not $SessionData) {
            Write-Error "SESSION_DATA_REQUIRED"
            exit 1
        }
        $success = Save-Session -JsonData $SessionData
        Write-Output $success
    }
    
    'list_recent' {
        $sessions = Get-RecentSessions -Count $Limit
        $sessions | ConvertTo-Json -Depth 5
    }
    
    default {
        Write-Error "UNKNOWN_OPERATION: $Operation"
        exit 1
    }
}

# Return success
exit 0
