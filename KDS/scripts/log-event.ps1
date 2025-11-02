# KDS Event Logger - BRAIN Event Stream Writer
# Purpose: Log events to KDS/kds-brain/events.jsonl for BRAIN learning
# Version: 5.0 (BRAIN Integration)
# Dependencies: ZERO external (PowerShell built-ins only)

<#
.SYNOPSIS
Log KDS events to BRAIN event stream for learning and pattern detection.

.DESCRIPTION
Appends events to events.jsonl in JSON Lines format. All KDS agents should log events
using this script to enable BRAIN learning.

.PARAMETER EventType
Type of event (intent_detected, file_modified, correction, validation_failed, etc.)

.PARAMETER EventData
Hashtable containing event-specific data

.EXAMPLE
# Log intent detection
.\log-event.ps1 -EventType "intent_detected" -EventData @{
    intent = "plan"
    phrase = "add share button"
    confidence = 0.95
    success = $true
}

.EXAMPLE
# Log file modification
.\log-event.ps1 -EventType "file_modified" -EventData @{
    file = "HostControlPanelContent.razor"
    session = "fab-button"
    task = "Add pulse animation"
    lines_changed = 23
}
#>

param(
    [Parameter(Mandatory=$true)]
    [string]$EventType,
    
    [Parameter(Mandatory=$true)]
    [hashtable]$EventData
)

# === Configuration ===
$script:EventsFile = Join-Path $PSScriptRoot "../kds-brain/events.jsonl"

# === Ensure events file exists ===
if (-not (Test-Path $script:EventsFile)) {
    $parentDir = Split-Path $script:EventsFile -Parent
    if (-not (Test-Path $parentDir)) {
        New-Item -ItemType Directory -Path $parentDir -Force | Out-Null
    }
    # Create with initialization event
    $initEvent = @{
        timestamp = (Get-Date -Format "o")
        event = "brain_initialized"
        version = "1.0"
        message = "KDS BRAIN system activated"
    }
    $initEvent | ConvertTo-Json -Compress | Add-Content -Path $script:EventsFile -Force
}

# === Build Event ===
$eventRecord = @{
    timestamp = (Get-Date -Format "o")
    event = $EventType
}

# Merge event data
foreach ($key in $EventData.Keys) {
    $eventRecord[$key] = $EventData[$key]
}

# === Log Event ===
try {
    $eventJson = $eventRecord | ConvertTo-Json -Compress
    Add-Content -Path $script:EventsFile -Value $eventJson -Force
    
    Write-Verbose "Event logged: $EventType"
    exit 0
} catch {
    Write-Error "EVENT_LOG_FAILED: $($_.Exception.Message)"
    exit 1
}
