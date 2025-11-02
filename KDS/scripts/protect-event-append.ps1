# KDS BRAIN Protection - Event Stream Guard Script
# Version: 1.0 (Phase 2)
# Purpose: Validate and safely append events to events.jsonl

[CmdletBinding()]
param(
    [Parameter(Mandatory=$false)]
    [string]$EventStreamPath = "$PSScriptRoot\..\kds-brain\events.jsonl",
    
    [Parameter(Mandatory=$false)]
    [string]$EventJson,
    
    [Parameter(Mandatory=$false)]
    [ValidateSet('validate', 'append')]
    [string]$Mode = 'validate',
    
    [Parameter(Mandatory=$false)]
    [int]$MaxEventSize = 10485760  # 10MB
)

$ErrorActionPreference = 'Stop'

#region Validation Functions

function Test-EventStructure {
    param([object]$Event)
    
    Write-Verbose "Validating event structure..."
    
    # Required fields
    $requiredFields = @('timestamp', 'event')
    
    foreach ($field in $requiredFields) {
        if (-not $Event.PSObject.Properties[$field]) {
            throw "Missing required field: $field"
        }
    }
    
    Write-Verbose "✅ Event structure valid"
    return $true
}

function Test-Timestamp {
    param([string]$Timestamp)
    
    Write-Verbose "Validating timestamp: $Timestamp"
    
    try {
        $parsedDate = [DateTime]::Parse($Timestamp)
        
        # Check timestamp is not in future (with 5 min tolerance)
        $now = Get-Date
        $tolerance = $now.AddMinutes(5)
        
        if ($parsedDate -gt $tolerance) {
            throw "Timestamp is in the future: $Timestamp"
        }
        
        # Check timestamp is not too old (> 1 year)
        $oneYearAgo = $now.AddYears(-1)
        if ($parsedDate -lt $oneYearAgo) {
            Write-Warning "⚠️ Timestamp is very old: $Timestamp"
        }
        
        Write-Verbose "✅ Timestamp valid"
        return $true
        
    } catch {
        throw "Invalid timestamp format: $Timestamp - $_"
    }
}

function Test-EventSize {
    param([string]$EventJson)
    
    $size = [System.Text.Encoding]::UTF8.GetByteCount($EventJson)
    
    Write-Verbose "Event size: $size bytes"
    
    if ($size -gt $MaxEventSize) {
        throw "Event size ($size bytes) exceeds maximum ($MaxEventSize bytes)"
    }
    
    Write-Verbose "✅ Event size valid"
    return $true
}

function Test-Duplicate {
    param([object]$NewEvent, [string]$EventStreamPath)
    
    Write-Verbose "Checking for duplicate events..."
    
    if (-not (Test-Path $EventStreamPath)) {
        Write-Verbose "Event stream doesn't exist yet - no duplicates possible"
        return $true
    }
    
    # Read last 100 events for duplicate check (performance optimization)
    $recentEvents = Get-Content -Path $EventStreamPath -Tail 100 -ErrorAction SilentlyContinue
    
    if (-not $recentEvents) {
        return $true
    }
    
    # Create signature for comparison
    $newSignature = "$($NewEvent.timestamp)|$($NewEvent.event)"
    
    foreach ($line in $recentEvents) {
        if ([string]::IsNullOrWhiteSpace($line)) { continue }
        
        try {
            $existingEvent = $line | ConvertFrom-Json
            $existingSignature = "$($existingEvent.timestamp)|$($existingEvent.event)"
            
            if ($newSignature -eq $existingSignature) {
                Write-Warning "⚠️ Duplicate event detected (skipping)"
                return $false
            }
            
        } catch {
            Write-Verbose "Failed to parse event line (may be corrupted): $_"
        }
    }
    
    Write-Verbose "✅ No duplicate found"
    return $true
}

function Get-Checksum {
    param([string]$Data)
    
    $sha256 = [System.Security.Cryptography.SHA256]::Create()
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($Data)
    $hash = $sha256.ComputeHash($bytes)
    
    return [BitConverter]::ToString($hash).Replace("-", "").ToLower()
}

#endregion

#region Event Stream Functions

function Initialize-EventStream {
    param([string]$Path)
    
    $directory = Split-Path $Path -Parent
    
    if (-not (Test-Path $directory)) {
        Write-Verbose "Creating directory: $directory"
        New-Item -Path $directory -ItemType Directory -Force | Out-Null
    }
    
    if (-not (Test-Path $Path)) {
        Write-Verbose "Initializing event stream: $Path"
        New-Item -Path $Path -ItemType File -Force | Out-Null
    }
}

function Add-EventToStream {
    param([object]$Event, [string]$Path)
    
    Write-Verbose "Appending event to stream..."
    
    # Validate event
    Test-EventStructure -Event $Event
    Test-Timestamp -Timestamp $Event.timestamp
    
    # Convert to JSON
    $eventJson = $Event | ConvertTo-Json -Compress
    
    # Validate size
    Test-EventSize -EventJson $eventJson
    
    # Check for duplicates
    $isUnique = Test-Duplicate -NewEvent $Event -EventStreamPath $Path
    
    if (-not $isUnique) {
        Write-Host "⚠️ Duplicate event - skipping append" -ForegroundColor Yellow
        return $false
    }
    
    # Calculate checksum
    $checksum = Get-Checksum -Data $eventJson
    
    # Add checksum to event
    $Event | Add-Member -NotePropertyName "checksum" -NotePropertyValue $checksum -Force
    
    # Re-convert with checksum
    $eventJsonWithChecksum = $Event | ConvertTo-Json -Compress
    
    # Initialize stream if needed
    Initialize-EventStream -Path $Path
    
    # Append to file (append-only operation)
    Add-Content -Path $Path -Value $eventJsonWithChecksum -Encoding UTF8
    
    Write-Host "✅ Event appended successfully" -ForegroundColor Green
    return $true
}

function Test-EventStream {
    param([string]$Path)
    
    Write-Verbose "Validating event stream integrity..."
    
    if (-not (Test-Path $Path)) {
        Write-Host "✅ No event stream found (will be created on first append)" -ForegroundColor Green
        return $true
    }
    
    $lines = Get-Content -Path $Path -ErrorAction SilentlyContinue
    
    if (-not $lines) {
        Write-Host "✅ Event stream is empty (valid)" -ForegroundColor Green
        return $true
    }
    
    $lineNumber = 0
    $validEvents = 0
    $invalidEvents = 0
    
    foreach ($line in $lines) {
        $lineNumber++
        
        if ([string]::IsNullOrWhiteSpace($line)) {
            continue
        }
        
        try {
            $event = $line | ConvertFrom-Json
            
            # Validate structure
            Test-EventStructure -Event $event
            Test-Timestamp -Timestamp $event.timestamp
            
            # Validate checksum if present
            if ($event.checksum) {
                $eventCopy = $event.PSObject.Copy()
                $eventCopy.PSObject.Properties.Remove('checksum')
                $eventJson = $eventCopy | ConvertTo-Json -Compress
                $expectedChecksum = Get-Checksum -Data $eventJson
                
                if ($event.checksum -ne $expectedChecksum) {
                    Write-Warning "⚠️ Checksum mismatch at line $lineNumber"
                    $invalidEvents++
                } else {
                    $validEvents++
                }
            } else {
                # No checksum (older event)
                $validEvents++
            }
            
        } catch {
            Write-Warning "⚠️ Invalid event at line $lineNumber : $_"
            $invalidEvents++
        }
    }
    
    Write-Host "📊 Event Stream Report:" -ForegroundColor Cyan
    Write-Host "   Total lines: $lineNumber"
    Write-Host "   Valid events: $validEvents"
    Write-Host "   Invalid events: $invalidEvents"
    
    if ($invalidEvents -gt 0) {
        Write-Warning "⚠️ Event stream has $invalidEvents invalid event(s)"
        return $false
    }
    
    Write-Host "✅ Event stream integrity verified" -ForegroundColor Green
    return $true
}

#endregion

#region Main Execution

switch ($Mode) {
    'validate' {
        Write-Host "🔍 Validating event stream..." -ForegroundColor Cyan
        
        $isValid = Test-EventStream -Path $EventStreamPath
        
        if ($isValid) {
            exit 0
        } else {
            Write-Error "❌ Event stream validation failed"
            exit 1
        }
    }
    
    'append' {
        Write-Host "📝 Appending event to stream..." -ForegroundColor Cyan
        
        if (-not $EventJson) {
            Write-Error "❌ EventJson parameter required for append mode"
            exit 1
        }
        
        try {
            # Parse JSON
            $event = $EventJson | ConvertFrom-Json
            
            # Add to stream with validation
            $success = Add-EventToStream -Event $event -Path $EventStreamPath
            
            if ($success) {
                Write-Host "✅ Event appended successfully" -ForegroundColor Green
                exit 0
            } else {
                Write-Host "⚠️ Event not appended (duplicate or validation failed)" -ForegroundColor Yellow
                exit 0  # Not an error condition
            }
            
        } catch {
            Write-Error "❌ Failed to append event: $_"
            exit 1
        }
    }
}

#endregion
