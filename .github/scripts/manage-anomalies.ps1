# KDS BRAIN Protection - Anomaly Manager
# Version: 1.0 (Phase 3)
# Purpose: Log and track anomalies for manual review

[CmdletBinding()]
param(
    [Parameter(Mandatory=$false)]
    [ValidateSet('log', 'list', 'review', 'stats', 'clear')]
    [string]$Mode = 'list',
    
    [Parameter(Mandatory=$false)]
    [string]$Type,
    
    [Parameter(Mandatory=$false)]
    [ValidateSet('low', 'medium', 'high')]
    [string]$Severity,
    
    [Parameter(Mandatory=$false)]
    [string]$Description,
    
    [Parameter(Mandatory=$false)]
    [hashtable]$Data,
    
    [Parameter(Mandatory=$false)]
    [int]$AnomalyId,
    
    [Parameter(Mandatory=$false)]
    [ValidateSet('reviewed', 'dismissed', 'resolved')]
    [string]$Status,
    
    [Parameter(Mandatory=$false)]
    [string]$Notes,
    
    [Parameter(Mandatory=$false)]
    [string]$AnomalyFilePath = "$PSScriptRoot\..\kds-brain\anomalies.yaml"
)

$ErrorActionPreference = 'Stop'

#region Helper Functions

function Initialize-AnomalyFile {
    param([string]$Path)
    
    $directory = Split-Path $Path -Parent
    
    if (-not (Test-Path $directory)) {
        New-Item -Path $directory -ItemType Directory -Force | Out-Null
    }
    
    if (-not (Test-Path $Path)) {
        $initial = @"
# KDS BRAIN Anomaly Review Queue
# Purpose: Track suspicious patterns for manual review
# Version: 1.0 (Phase 3)

anomalies: []

statistics:
  total_anomalies: 0
  pending_review: 0
  reviewed: 0
  dismissed: 0
  resolved: 0
  last_updated: "$(Get-Date -Format 'yyyy-MM-ddTHH:mm:ssZ')"
"@
        Set-Content -Path $Path -Value $initial -Encoding UTF8
    }
}

function Get-NextAnomalyId {
    param([string]$Content)
    
    # Extract all IDs and get max
    $idPattern = '  - id:\s+(\d+)'
    $matches = [regex]::Matches($Content, $idPattern)
    
    if ($matches.Count -eq 0) {
        return 1
    }
    
    $maxId = ($matches | ForEach-Object { [int]$_.Groups[1].Value } | Measure-Object -Maximum).Maximum
    
    return $maxId + 1
}

#endregion

#region Anomaly Functions

function Add-Anomaly {
    param(
        [string]$Path,
        [string]$Type,
        [string]$Severity,
        [string]$Description,
        [hashtable]$Data
    )
    
    Initialize-AnomalyFile -Path $Path
    
    $content = Get-Content -Path $Path -Raw
    
    $anomalyId = Get-NextAnomalyId -Content $content
    $timestamp = Get-Date -Format 'yyyy-MM-ddTHH:mm:ssZ'
    
    # Create anomaly entry
    $anomaly = @"

  - id: $anomalyId
    timestamp: "$timestamp"
    type: "$Type"
    severity: "$Severity"
    description: "$Description"
"@
    
    # Add data fields if provided
    if ($Data) {
        foreach ($key in $Data.Keys) {
            $value = $Data[$key]
            if ($value -is [string]) {
                $anomaly += "`n    $key`: ""$value"""
            } else {
                $anomaly += "`n    $key`: $value"
            }
        }
    }
    
    $anomaly += @"

    status: "pending"
    reviewed: false
    notes: ""
"@
    
    # Insert before statistics section
    if ($content -match 'anomalies:\s*\[\]') {
        # Empty list - replace with first item
        $content = $content -replace 'anomalies:\s*\[\]', "anomalies:$anomaly"
    } elseif ($content -match '(anomalies:)') {
        # Has items - append
        $content = $content -replace '(anomalies:)', "`$1$anomaly"
    }
    
    # Update statistics
    $content = Update-Statistics -Content $content -Action "add"
    
    Set-Content -Path $Path -Value $content -Encoding UTF8
    
    Write-Host "🚨 Anomaly logged: #$anomalyId - $Type ($Severity)" -ForegroundColor Yellow
    return $anomalyId
}

function Get-Anomalies {
    param(
        [string]$Path,
        [string]$FilterStatus = $null
    )
    
    if (-not (Test-Path $Path)) {
        Write-Host "📊 No anomalies found" -ForegroundColor Green
        return
    }
    
    $content = Get-Content -Path $Path -Raw
    
    # Parse anomalies (basic YAML parsing)
    $anomalyPattern = '  - id:\s+(\d+)[\s\S]*?(?=  - id:|\nstatistics:|$)'
    $matches = [regex]::Matches($content, $anomalyPattern)
    
    if ($matches.Count -eq 0) {
        Write-Host "📊 No anomalies found" -ForegroundColor Green
        return
    }
    
    Write-Host "🚨 KDS BRAIN Anomaly Review Queue" -ForegroundColor Yellow
    Write-Host ""
    
    foreach ($match in $matches) {
        $anomalyText = $match.Value
        
        # Extract fields
        if ($anomalyText -match 'id:\s+(\d+)') { $id = $Matches[1] }
        if ($anomalyText -match 'type:\s+"?([^"\n]+)"?') { $type = $Matches[1].Trim('"') }
        if ($anomalyText -match 'severity:\s+"?([^"\n]+)"?') { $severity = $Matches[1].Trim('"') }
        if ($anomalyText -match 'status:\s+"?([^"\n]+)"?') { $status = $Matches[1].Trim('"') }
        if ($anomalyText -match 'description:\s+"?([^"\n]+)"?') { $desc = $Matches[1].Trim('"') }
        
        # Filter by status if requested
        if ($FilterStatus -and $status -ne $FilterStatus) {
            continue
        }
        
        # Display
        $color = switch ($severity) {
            "high" { "Red" }
            "medium" { "Yellow" }
            "low" { "Cyan" }
            default { "White" }
        }
        
        Write-Host "[$id] $type" -ForegroundColor $color
        Write-Host "    Severity: $severity | Status: $status"
        Write-Host "    $desc"
        Write-Host ""
    }
}

function Update-AnomalyStatus {
    param(
        [string]$Path,
        [int]$Id,
        [string]$NewStatus,
        [string]$ReviewNotes
    )
    
    if (-not (Test-Path $Path)) {
        throw "Anomaly file not found: $Path"
    }
    
    $content = Get-Content -Path $Path -Raw
    
    # Find anomaly by ID
    $pattern = "(  - id:\s+$Id\s+[\s\S]*?)(status:\s+"")([^""]+)(""\s+reviewed:\s+)(false|true)"
    
    if ($content -match $pattern) {
        # Update status
        $content = $content -replace $pattern, "`$1`$2$NewStatus`$4true"
        
        # Update notes if provided
        if ($ReviewNotes) {
            $notesPattern = "(  - id:\s+$Id\s+[\s\S]*?notes:\s+"")([^""]*)("")"
            $content = $content -replace $notesPattern, "`$1$ReviewNotes`$3"
        }
        
        # Update statistics
        $content = Update-Statistics -Content $content -Action "review" -OldStatus "pending" -NewStatus $NewStatus
        
        Set-Content -Path $Path -Value $content -Encoding UTF8
        
        Write-Host "✅ Anomaly #$Id updated: $NewStatus" -ForegroundColor Green
        
    } else {
        throw "Anomaly #$Id not found"
    }
}

function Get-AnomalyStatistics {
    param([string]$Path)
    
    if (-not (Test-Path $Path)) {
        Write-Host "📊 No anomaly data" -ForegroundColor Green
        return
    }
    
    $content = Get-Content -Path $Path -Raw
    
    # Extract statistics
    if ($content -match 'total_anomalies:\s+(\d+)') { $total = $Matches[1] }
    if ($content -match 'pending_review:\s+(\d+)') { $pending = $Matches[1] }
    if ($content -match 'reviewed:\s+(\d+)') { $reviewed = $Matches[1] }
    if ($content -match 'dismissed:\s+(\d+)') { $dismissed = $Matches[1] }
    if ($content -match 'resolved:\s+(\d+)') { $resolved = $Matches[1] }
    if ($content -match 'last_updated:\s+"([^"]+)"') { $lastUpdated = $Matches[1] }
    
    Write-Host "📊 KDS BRAIN Anomaly Statistics" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Total Anomalies: $total"
    Write-Host "Pending Review:  $pending" -ForegroundColor Yellow
    Write-Host "Reviewed:        $reviewed"
    Write-Host "Dismissed:       $dismissed"
    Write-Host "Resolved:        $resolved"
    Write-Host ""
    Write-Host "Last Updated: $lastUpdated"
}

function Update-Statistics {
    param(
        [string]$Content,
        [string]$Action,
        [string]$OldStatus = "",
        [string]$NewStatus = ""
    )
    
    if ($Action -eq "add") {
        # Increment total and pending
        $Content = $Content -replace '(total_anomalies:\s+)(\d+)', { param($m) "`$1$([int]$m.Groups[2].Value + 1)" }
        $Content = $Content -replace '(pending_review:\s+)(\d+)', { param($m) "`$1$([int]$m.Groups[2].Value + 1)" }
    }
    elseif ($Action -eq "review") {
        # Decrement pending, increment new status
        $Content = $Content -replace '(pending_review:\s+)(\d+)', { param($m) "`$1$([int]$m.Groups[2].Value - 1)" }
        $Content = $Content -replace "($NewStatus`:\s+)(\d+)", { param($m) "`$1$([int]$m.Groups[2].Value + 1)" }
    }
    
    # Update timestamp
    $timestamp = Get-Date -Format 'yyyy-MM-ddTHH:mm:ssZ'
    $Content = $Content -replace '(last_updated:\s+")([^"]+)(")', "`$1$timestamp`$3"
    
    return $Content
}

function Clear-OldAnomalies {
    param([string]$Path, [int]$DaysToKeep = 90)
    
    if (-not (Test-Path $Path)) {
        return
    }
    
    $content = Get-Content -Path $Path -Raw
    $cutoffDate = (Get-Date).AddDays(-$DaysToKeep)
    
    # Remove anomalies older than cutoff that are reviewed/dismissed
    # (Keep pending and resolved regardless of age)
    
    Write-Host "🧹 Clearing anomalies older than $DaysToKeep days (reviewed/dismissed only)..." -ForegroundColor Cyan
    
    # This is a simplified version - production would need proper YAML parsing
    Write-Host "⚠️ Clear operation requires manual implementation with proper YAML library" -ForegroundColor Yellow
}

#endregion

#region Main Execution

switch ($Mode) {
    'log' {
        if (-not $Type -or -not $Severity -or -not $Description) {
            Write-Error "❌ Type, Severity, and Description required for log mode"
            exit 1
        }
        
        try {
            $id = Add-Anomaly -Path $AnomalyFilePath -Type $Type -Severity $Severity -Description $Description -Data $Data
            Write-Host "✅ Anomaly logged with ID: $id" -ForegroundColor Green
            exit 0
        } catch {
            Write-Error "❌ Failed to log anomaly: $_"
            exit 1
        }
    }
    
    'list' {
        Get-Anomalies -Path $AnomalyFilePath -FilterStatus $Status
        exit 0
    }
    
    'review' {
        if (-not $AnomalyId -or -not $Status) {
            Write-Error "❌ AnomalyId and Status required for review mode"
            exit 1
        }
        
        try {
            Update-AnomalyStatus -Path $AnomalyFilePath -Id $AnomalyId -NewStatus $Status -ReviewNotes $Notes
            exit 0
        } catch {
            Write-Error "❌ Failed to review anomaly: $_"
            exit 1
        }
    }
    
    'stats' {
        Get-AnomalyStatistics -Path $AnomalyFilePath
        exit 0
    }
    
    'clear' {
        Clear-OldAnomalies -Path $AnomalyFilePath
        exit 0
    }
}

#endregion
