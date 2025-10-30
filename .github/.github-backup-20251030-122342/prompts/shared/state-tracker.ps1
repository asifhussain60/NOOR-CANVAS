# State Tracker Utility v1.0.0
# Auto-updates state.json with request/handoff/commit tracking
# Usage: . .github/prompts/shared/state-tracker.ps1

$ErrorActionPreference = "Stop"

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

function Get-ProjectRoot {
    <#
    .SYNOPSIS
    Get the project root directory (git root or current directory)
    #>
    $gitRoot = git rev-parse --show-toplevel 2>$null
    if ($gitRoot) {
        return $gitRoot -replace '/', '\'
    }
    return $PWD.Path
}

function Get-StateFile {
    <#
    .SYNOPSIS
    Auto-discover state.json file path for a given key
    
    .PARAMETER Key
    The key identifier (kebab-case)
    
    .EXAMPLE
    Get-StateFile -Key "zoom-integration"
    #>
    param(
        [Parameter(Mandatory=$true)]
        [string]$Key
    )
    
    $projectRoot = Get-ProjectRoot
    
    # Search in order of priority
    $searchPaths = @(
        ".github\key-data-streams\$Key\$Key.state.json",
        "Workspaces\Copilot\KeyDataStreams\$Key\$Key.state.json",
        ".copilot\keys\$Key\$Key.state.json"
    )
    
    foreach ($relativePath in $searchPaths) {
        $fullPath = Join-Path $projectRoot $relativePath
        if (Test-Path $fullPath) {
            return $fullPath
        }
    }
    
    # If state.json doesn't exist, check if key directory exists
    $keyDirPaths = @(
        ".github\key-data-streams\$Key",
        "Workspaces\Copilot\KeyDataStreams\$Key",
        ".copilot\keys\$Key"
    )
    
    foreach ($relativePath in $keyDirPaths) {
        $fullPath = Join-Path $projectRoot $relativePath
        if (Test-Path $fullPath) {
            # Key directory exists but no state.json - create it
            $stateFile = Join-Path $fullPath "$Key.state.json"
            
            # Initialize minimal state.json
            $initialState = @{
                key = $Key
                version = "2.0"
                status = "in-progress"
                created = (Get-Date).ToString("o")
                lastUpdated = (Get-Date).ToString("o")
                requests = @()
                commits = @()
                phases = @()
                filesModified = @()
                promptHandoffs = @()
                totalPhases = 0
                completedPhases = 0
                currentPhase = $null
                branch = git rev-parse --abbrev-ref HEAD 2>$null
                driftKeys = @()
                tags = @{}
                estimatedTotalDuration = $null
                userDecisions = $null
            }
            
            $initialState | ConvertTo-Json -Depth 10 | Set-Content $stateFile -Encoding UTF8
            Write-Host "[state-tracker] Created new state.json for key: $Key" -ForegroundColor Yellow
            return $stateFile
        }
    }
    
    throw "State file not found for key '$Key'. Key directory does not exist in any known location."
}

function Test-StateJsonSchema {
    <#
    .SYNOPSIS
    Validate state.json structure (basic validation)
    
    .PARAMETER StateData
    HashTable representing state.json data
    #>
    param(
        [Parameter(Mandatory=$true)]
        [hashtable]$StateData
    )
    
    $requiredFields = @('key', 'status', 'created', 'lastUpdated')
    
    foreach ($field in $requiredFields) {
        if (-not $StateData.ContainsKey($field)) {
            throw "Invalid state.json: missing required field '$field'"
        }
    }
    
    # Validate key format (kebab-case)
    if ($StateData.key -notmatch '^[a-z0-9]+(-[a-z0-9]+)*$') {
        throw "Invalid state.json: key must be in kebab-case format"
    }
    
    return $true
}

# ============================================================================
# CORE STATE UPDATE FUNCTIONS
# ============================================================================

function Update-StateRequest {
    <#
    .SYNOPSIS
    Add a user request to the state.json requests[] array
    
    .PARAMETER Key
    The key identifier
    
    .PARAMETER Type
    Request type: original, additional, clarification, modification
    
    .PARAMETER UserRequest
    The full text of the user's request
    
    .PARAMETER PromptChain
    Array of prompts involved in handling this request
    
    .PARAMETER Commits
    Array of commit SHAs associated with this request
    
    .PARAMETER Outcome
    Request outcome: in-progress, completed, blocked, cancelled
    
    .EXAMPLE
    Update-StateRequest -Key "zoom-integration" -Type "original" -UserRequest "Integrate Zoom REST API" -PromptChain @("route", "plan")
    #>
    param(
        [Parameter(Mandatory=$true)]
        [string]$Key,
        
        [Parameter(Mandatory=$true)]
        [ValidateSet('original', 'additional', 'clarification', 'modification')]
        [string]$Type,
        
        [Parameter(Mandatory=$true)]
        [string]$UserRequest,
        
        [Parameter(Mandatory=$false)]
        [string[]]$PromptChain = @(),
        
        [Parameter(Mandatory=$false)]
        [string[]]$Commits = @(),
        
        [Parameter(Mandatory=$false)]
        [ValidateSet('in-progress', 'completed', 'blocked', 'cancelled')]
        [string]$Outcome = "in-progress"
    )
    
    try {
        $stateFile = Get-StateFile -Key $Key
        $state = Get-Content $stateFile -Raw | ConvertFrom-Json -AsHashtable
        
        # Validate schema
        Test-StateJsonSchema -StateData $state | Out-Null
        
        # Create request object
        $request = @{
            timestamp = (Get-Date).ToString("o")
            type = $Type
            userRequest = $UserRequest
            promptChain = $PromptChain
            commits = $Commits
            outcome = $Outcome
        }
        
        # Ensure requests array exists
        if (-not $state.ContainsKey('requests') -or $null -eq $state.requests) {
            $state.requests = @()
        }
        
        # Add request
        $state.requests += $request
        $state.lastUpdated = (Get-Date).ToString("o")
        
        # Save state
        $state | ConvertTo-Json -Depth 10 | Set-Content $stateFile -Encoding UTF8
        
        Write-Host "[state-tracker] ✓ Request logged for key: $Key ($Type)" -ForegroundColor Green
    }
    catch {
        Write-Error "Failed to update state request: $_"
        throw
    }
}

function Update-StateHandoff {
    <#
    .SYNOPSIS
    Log a prompt-to-prompt handoff in state.json
    
    .PARAMETER Key
    The key identifier
    
    .PARAMETER From
    Source prompt name
    
    .PARAMETER To
    Target prompt name
    
    .PARAMETER Parameters
    Hashtable of parameters passed during handoff
    
    .PARAMETER Reason
    Optional reason for the handoff
    
    .EXAMPLE
    Update-StateHandoff -Key "zoom-integration" -From "route" -To "plan" -Parameters @{ key = "zoom-integration"; auto_execute = $true }
    #>
    param(
        [Parameter(Mandatory=$true)]
        [string]$Key,
        
        [Parameter(Mandatory=$true)]
        [string]$From,
        
        [Parameter(Mandatory=$true)]
        [string]$To,
        
        [Parameter(Mandatory=$false)]
        [hashtable]$Parameters = @{},
        
        [Parameter(Mandatory=$false)]
        [string]$Reason = "Standard workflow handoff"
    )
    
    try {
        $stateFile = Get-StateFile -Key $Key
        $state = Get-Content $stateFile -Raw | ConvertFrom-Json -AsHashtable
        
        # Validate schema
        Test-StateJsonSchema -StateData $state | Out-Null
        
        # Create handoff object
        $handoff = @{
            from = $From
            to = $To
            timestamp = (Get-Date).ToString("o")
            parameters = $Parameters
            reason = $Reason
        }
        
        # Ensure promptHandoffs array exists
        if (-not $state.ContainsKey('promptHandoffs') -or $null -eq $state.promptHandoffs) {
            $state.promptHandoffs = @()
        }
        
        # Add handoff
        $state.promptHandoffs += $handoff
        $state.lastUpdated = (Get-Date).ToString("o")
        
        # Save state
        $state | ConvertTo-Json -Depth 10 | Set-Content $stateFile -Encoding UTF8
        
        Write-Host "[state-tracker] ✓ Handoff logged: $From → $To (key: $Key)" -ForegroundColor Cyan
    }
    catch {
        Write-Error "Failed to update state handoff: $_"
        throw
    }
}

function Update-StateCommit {
    <#
    .SYNOPSIS
    Log a git commit in state.json
    
    .PARAMETER Key
    The key identifier
    
    .PARAMETER Sha
    Git commit SHA (short or full)
    
    .PARAMETER Message
    Commit message
    
    .PARAMETER Phase
    Optional phase number this commit belongs to
    
    .PARAMETER CheckpointType
    Type of checkpoint: intermediate, major, final
    
    .PARAMETER FilesChanged
    Array of files changed in this commit
    
    .EXAMPLE
    Update-StateCommit -Key "zoom-integration" -Sha "abc123" -Message "ckpt(zoom-integration): Phase 1 complete" -Phase 1
    #>
    param(
        [Parameter(Mandatory=$true)]
        [string]$Key,
        
        [Parameter(Mandatory=$true)]
        [string]$Sha,
        
        [Parameter(Mandatory=$true)]
        [string]$Message,
        
        [Parameter(Mandatory=$false)]
        [int]$Phase = $null,
        
        [Parameter(Mandatory=$false)]
        [ValidateSet('intermediate', 'major', 'final')]
        [string]$CheckpointType = "intermediate",
        
        [Parameter(Mandatory=$false)]
        [string[]]$FilesChanged = @()
    )
    
    try {
        $stateFile = Get-StateFile -Key $Key
        $state = Get-Content $stateFile -Raw | ConvertFrom-Json -AsHashtable
        
        # Validate schema
        Test-StateJsonSchema -StateData $state | Out-Null
        
        # Get commit author
        $author = git config user.name
        if (-not $author) {
            $author = "Unknown"
        }
        
        # Create commit object
        $commit = @{
            sha = $Sha
            message = $Message
            timestamp = (Get-Date).ToString("o")
            author = $author
            phase = $Phase
            checkpointType = $CheckpointType
            filesChanged = $FilesChanged
        }
        
        # Ensure commits array exists
        if (-not $state.ContainsKey('commits') -or $null -eq $state.commits) {
            $state.commits = @()
        }
        
        # Add commit (avoid duplicates by SHA)
        $existingCommit = $state.commits | Where-Object { $_.sha -eq $Sha }
        if (-not $existingCommit) {
            $state.commits += $commit
            $state.lastUpdated = (Get-Date).ToString("o")
            
            # Save state
            $state | ConvertTo-Json -Depth 10 | Set-Content $stateFile -Encoding UTF8
            
            Write-Host "[state-tracker] ✓ Commit logged: $Sha (key: $Key)" -ForegroundColor Yellow
        }
        else {
            Write-Host "[state-tracker] ⊘ Commit already logged: $Sha" -ForegroundColor Gray
        }
    }
    catch {
        Write-Error "Failed to update state commit: $_"
        throw
    }
}

function Update-StateDriftKey {
    <#
    .SYNOPSIS
    Add a drift key reference to the parent key's state.json
    
    .PARAMETER ParentKey
    The original key that spawned the drift
    
    .PARAMETER DriftKey
    The new drift key identifier
    
    .PARAMETER Severity
    Drift severity: low, medium, high, critical
    
    .PARAMETER Description
    Description of the drift
    
    .PARAMETER Resolved
    Whether the drift has been resolved
    
    .EXAMPLE
    Update-StateDriftKey -ParentKey "zoom-integration" -DriftKey "zoom-integration-auth-fix" -Severity "high" -Description "Authentication token refresh needed"
    #>
    param(
        [Parameter(Mandatory=$true)]
        [string]$ParentKey,
        
        [Parameter(Mandatory=$true)]
        [string]$DriftKey,
        
        [Parameter(Mandatory=$false)]
        [ValidateSet('low', 'medium', 'high', 'critical')]
        [string]$Severity = "medium",
        
        [Parameter(Mandatory=$false)]
        [string]$Description = "",
        
        [Parameter(Mandatory=$false)]
        [bool]$Resolved = $false
    )
    
    try {
        $stateFile = Get-StateFile -Key $ParentKey
        $state = Get-Content $stateFile -Raw | ConvertFrom-Json -AsHashtable
        
        # Validate schema
        Test-StateJsonSchema -StateData $state | Out-Null
        
        # Create drift key object
        $driftKeyObj = @{
            key = $DriftKey
            severity = $Severity
            description = $Description
            resolved = $Resolved
            created = (Get-Date).ToString("o")
        }
        
        # Ensure driftKeys array exists
        if (-not $state.ContainsKey('driftKeys') -or $null -eq $state.driftKeys) {
            $state.driftKeys = @()
        }
        
        # Add drift key (avoid duplicates)
        $existingDrift = $state.driftKeys | Where-Object { $_.key -eq $DriftKey }
        if (-not $existingDrift) {
            $state.driftKeys += $driftKeyObj
            $state.lastUpdated = (Get-Date).ToString("o")
            
            # Save state
            $state | ConvertTo-Json -Depth 10 | Set-Content $stateFile -Encoding UTF8
            
            Write-Host "[state-tracker] ✓ Drift key added: $DriftKey (parent: $ParentKey)" -ForegroundColor Magenta
        }
        else {
            Write-Host "[state-tracker] ⊘ Drift key already exists: $DriftKey" -ForegroundColor Gray
        }
    }
    catch {
        Write-Error "Failed to update drift key: $_"
        throw
    }
}

function Update-StatePhase {
    <#
    .SYNOPSIS
    Update phase status in state.json
    
    .PARAMETER Key
    The key identifier
    
    .PARAMETER PhaseNumber
    Phase number to update
    
    .PARAMETER Status
    New phase status: not-started, in-progress, completed, blocked, skipped
    
    .PARAMETER StartedAt
    Optional timestamp when phase started
    
    .PARAMETER CompletedAt
    Optional timestamp when phase completed
    
    .EXAMPLE
    Update-StatePhase -Key "zoom-integration" -PhaseNumber 1 -Status "completed" -CompletedAt (Get-Date).ToString("o")
    #>
    param(
        [Parameter(Mandatory=$true)]
        [string]$Key,
        
        [Parameter(Mandatory=$true)]
        [int]$PhaseNumber,
        
        [Parameter(Mandatory=$true)]
        [ValidateSet('not-started', 'in-progress', 'completed', 'blocked', 'skipped')]
        [string]$Status,
        
        [Parameter(Mandatory=$false)]
        [string]$StartedAt = $null,
        
        [Parameter(Mandatory=$false)]
        [string]$CompletedAt = $null
    )
    
    try {
        $stateFile = Get-StateFile -Key $Key
        $state = Get-Content $stateFile -Raw | ConvertFrom-Json -AsHashtable
        
        # Validate schema
        Test-StateJsonSchema -StateData $state | Out-Null
        
        # Find phase
        if ($state.ContainsKey('phases') -and $null -ne $state.phases) {
            $phase = $state.phases | Where-Object { $_.number -eq $PhaseNumber } | Select-Object -First 1
            
            if ($phase) {
                $phase.status = $Status
                if ($StartedAt) { $phase.started = $StartedAt }
                if ($CompletedAt) { $phase.completed = $CompletedAt }
                
                $state.lastUpdated = (Get-Date).ToString("o")
                
                # Update currentPhase and completedPhases
                if ($Status -eq "in-progress") {
                    $state.currentPhase = $PhaseNumber
                }
                if ($Status -eq "completed") {
                    $completedCount = ($state.phases | Where-Object { $_.status -eq "completed" }).Count
                    $state.completedPhases = $completedCount
                }
                
                # Save state
                $state | ConvertTo-Json -Depth 10 | Set-Content $stateFile -Encoding UTF8
                
                Write-Host "[state-tracker] ✓ Phase $PhaseNumber updated: $Status (key: $Key)" -ForegroundColor Green
            }
            else {
                Write-Warning "[state-tracker] Phase $PhaseNumber not found in key: $Key"
            }
        }
        else {
            Write-Warning "[state-tracker] No phases defined for key: $Key"
        }
    }
    catch {
        Write-Error "Failed to update phase: $_"
        throw
    }
}

# ============================================================================
# INITIALIZATION
# ============================================================================

Write-Host "[state-tracker] Utility loaded successfully" -ForegroundColor Cyan
Write-Host "[state-tracker] Available functions: Get-StateFile, Update-StateRequest, Update-StateHandoff, Update-StateCommit, Update-StateDriftKey, Update-StatePhase" -ForegroundColor Gray
