# Migration Script: Convert existing key data streams to state.json format
# Version: 1.0.0
# Purpose: Backfill state.json from work-log.md, plan.json, and git history

param(
    [string]$KeyName,           # Specific key to migrate (optional)
    [switch]$All,               # Migrate all keys
    [switch]$DryRun,            # Preview changes without writing
    [switch]$Force,             # Overwrite existing state.json files
    [switch]$Verbose
)

$ErrorActionPreference = "Stop"

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    
    $color = switch ($Level) {
        "INFO" { "White" }
        "SUCCESS" { "Green" }
        "WARNING" { "Yellow" }
        "ERROR" { "Red" }
        default { "Gray" }
    }
    
    Write-Host "[$Level] $Message" -ForegroundColor $color
}

function Get-ProjectRoot {
    $gitRoot = git rev-parse --show-toplevel 2>$null
    if ($gitRoot) {
        return $gitRoot -replace '/', '\'
    }
    return $PWD.Path
}

function Parse-WorkLog {
    param([string]$WorkLogPath)
    
    if (-not (Test-Path $WorkLogPath)) {
        return @{
            Requests = @()
            Commits = @()
        }
    }
    
    $content = Get-Content $WorkLogPath -Raw
    $requests = @()
    $commits = @()
    
    # Extract user requests from work log
    # Pattern: Look for "User requested", "User request:", etc.
    $requestMatches = [regex]::Matches($content, '(?mi)^-\s*User\s+(?:request(?:ed)?|asked):\s*(.+?)$')
    foreach ($match in $requestMatches) {
        $requests += [PSCustomObject]@{
            Type = "original"
            UserRequest = $match.Groups[1].Value.Trim()
            Timestamp = $null  # Will be inferred from file metadata
        }
    }
    
    # Extract commits from work log
    # Pattern: Look for commit SHAs (7-40 hex chars)
    $commitMatches = [regex]::Matches($content, '(?m)^-\s*(?:Commit|Created):\s*`?([0-9a-f]{7,40})`?')
    foreach ($match in $commitMatches) {
        $commits += $match.Groups[1].Value
    }
    
    return @{
        Requests = $requests
        Commits = $commits
    }
}

function Get-GitCommitsForKey {
    param([string]$KeyName)
    
    $commits = @()
    
    # Search git history for commits with ckpt(key) pattern
    $gitOutput = git log --all --grep="ckpt($KeyName)" --format="%H|%s|%aI|%an" --date=iso 2>$null
    
    if ($gitOutput) {
        foreach ($line in $gitOutput) {
            if ($line -match '^(.+?)\|(.+?)\|(.+?)\|(.+)$') {
                $commits += [PSCustomObject]@{
                    Sha = $Matches[1].Substring(0, [Math]::Min(40, $Matches[1].Length))
                    Message = $Matches[2]
                    Timestamp = $Matches[3]
                    Author = $Matches[4]
                    Phase = $null  # Will be inferred from message or plan.json
                    CheckpointType = "intermediate"
                    FilesChanged = @()
                }
                
                # Extract phase number from commit message if present
                if ($Matches[2] -match 'Phase\s+(\d+)') {
                    $commits[-1].Phase = [int]$Matches[1]
                }
            }
        }
    }
    
    return $commits
}

function Merge-StateData {
    param(
        [string]$KeyName,
        [object]$PlanJson,
        [object]$WorkLogData,
        [object]$GitCommits
    )
    
    $state = @{
        key = $KeyName
        version = "2.0"
        status = if ($PlanJson.status) { $PlanJson.status } else { "unknown" }
        created = if ($PlanJson.created) { $PlanJson.created } else { (Get-Date).ToString("o") }
        lastUpdated = (Get-Date).ToString("o")
        requests = @()
        commits = @()
        phases = @()
        filesModified = @()
        promptHandoffs = @()
        totalPhases = if ($PlanJson.totalPhases) { $PlanJson.totalPhases } else { 0 }
        completedPhases = if ($PlanJson.completedPhases) { $PlanJson.completedPhases } else { 0 }
        currentPhase = $PlanJson.currentPhase
        branch = if ($PlanJson.branch) { $PlanJson.branch } else { "development" }
        driftKeys = @()
        tags = @{}
        estimatedTotalDuration = $PlanJson.estimatedTotalDuration
        userDecisions = $PlanJson.userDecisions
    }
    
    # Merge requests from work log
    if ($WorkLogData.Requests.Count -gt 0) {
        foreach ($req in $WorkLogData.Requests) {
            $state.requests += @{
                timestamp = if ($req.Timestamp) { $req.Timestamp } else { $state.created }
                type = $req.Type
                userRequest = $req.UserRequest
                promptChain = @()
                commits = @()
                outcome = "completed"
            }
        }
    }
    
    # Merge commits from git and work log
    $allCommitShas = @()
    foreach ($commit in $GitCommits) {
        if ($commit.Sha -notin $allCommitShas) {
            $state.commits += @{
                sha = $commit.Sha
                message = $commit.Message
                timestamp = $commit.Timestamp
                author = $commit.Author
                phase = $commit.Phase
                checkpointType = $commit.CheckpointType
                filesChanged = $commit.FilesChanged
            }
            $allCommitShas += $commit.Sha
        }
    }
    
    # Merge phases from plan.json
    if ($PlanJson.phases) {
        foreach ($phase in $PlanJson.phases) {
            $state.phases += @{
                number = $phase.number
                title = if ($phase.name) { $phase.name } else { $phase.title }
                status = $phase.status
                started = $phase.started
                completed = $phase.completed
                commits = @()
                duration = $phase.duration
                risk = $phase.risk
            }
        }
    }
    
    # Merge tags
    if ($PlanJson.tags) {
        $state.tags = $PlanJson.tags
    }
    
    return $state
}

# ============================================================================
# MAIN MIGRATION LOGIC
# ============================================================================

$projectRoot = Get-ProjectRoot
$keyDataStreamPath = Join-Path $projectRoot ".github/key-data-streams"

if (-not (Test-Path $keyDataStreamPath)) {
    Write-Log "Key data stream path not found: $keyDataStreamPath" "ERROR"
    exit 1
}

# Determine which keys to migrate
$keysToMigrate = @()

if ($KeyName) {
    $keyDir = Join-Path $keyDataStreamPath $KeyName
    if (Test-Path $keyDir) {
        $keysToMigrate += [PSCustomObject]@{
            Name = $KeyName
            Path = $keyDir
        }
    }
    else {
        Write-Log "Key directory not found: $keyDir" "ERROR"
        exit 1
    }
}
elseif ($All) {
    Get-ChildItem $keyDataStreamPath -Directory | ForEach-Object {
        if ($_.Name -notmatch '^_') {  # Skip special directories like _SCHEMA, _ARCHIVE
            $keysToMigrate += [PSCustomObject]@{
                Name = $_.Name
                Path = $_.FullName
            }
        }
    }
}
else {
    Write-Log "Please specify -KeyName <key> or -All" "ERROR"
    Write-Host ""
    Write-Host "USAGE:" -ForegroundColor Cyan
    Write-Host "  .\migrate-keys-to-state.ps1 -KeyName zoom-integration [-DryRun] [-Force]"
    Write-Host "  .\migrate-keys-to-state.ps1 -All [-DryRun] [-Force]"
    Write-Host ""
    exit 1
}

Write-Log "Found $($keysToMigrate.Count) key(s) to migrate"
Write-Host ""

# Migrate each key
$migrated = 0
$skipped = 0
$failed = 0

foreach ($key in $keysToMigrate) {
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
    Write-Log "Processing key: $($key.Name)"
    
    $stateFile = Join-Path $key.Path "$($key.Name).state.json"
    
    # Check if state.json already exists
    if ((Test-Path $stateFile) -and (-not $Force)) {
        Write-Log "State file already exists (use -Force to overwrite)" "WARNING"
        $skipped++
        continue
    }
    
    try {
        # Load plan.json if exists
        $planFile = Join-Path $key.Path "$($key.Name).plan.json"
        $planData = if (Test-Path $planFile) {
            Get-Content $planFile -Raw | ConvertFrom-Json
        }
        else {
            @{}
        }
        
        # Parse work-log.md
        $workLogFile = Join-Path $key.Path "work-log.md"
        $workLogData = Parse-WorkLog -WorkLogPath $workLogFile
        
        # Get git commits
        $gitCommits = Get-GitCommitsForKey -KeyName $key.Name
        
        # Merge all data
        $stateData = Merge-StateData -KeyName $key.Name -PlanJson $planData -WorkLogData $workLogData -GitCommits $gitCommits
        
        if ($Verbose) {
            Write-Log "  Requests: $($stateData.requests.Count)"
            Write-Log "  Commits: $($stateData.commits.Count)"
            Write-Log "  Phases: $($stateData.phases.Count)"
        }
        
        if (-not $DryRun) {
            # Write state.json
            $stateJson = $stateData | ConvertTo-Json -Depth 10
            Set-Content -Path $stateFile -Value $stateJson -Encoding UTF8
            Write-Log "Created: $($stateFile.Replace($projectRoot, '.'))" "SUCCESS"
        }
        else {
            Write-Log "Would create: $($stateFile.Replace($projectRoot, '.'))" "INFO"
        }
        
        $migrated++
    }
    catch {
        Write-Log "Failed to migrate key: $_" "ERROR"
        $failed++
    }
    
    Write-Host ""
}

# Summary
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""
Write-Log "Migration complete!" "SUCCESS"
Write-Host ""
Write-Host "  Migrated: $migrated" -ForegroundColor Green
if ($skipped -gt 0) {
    Write-Host "  Skipped:  $skipped" -ForegroundColor Yellow
}
if ($failed -gt 0) {
    Write-Host "  Failed:   $failed" -ForegroundColor Red
}
Write-Host ""

if ($DryRun) {
    Write-Host "  ** DRY RUN ** - No files were modified" -ForegroundColor Yellow
    Write-Host "  Run without -DryRun to perform actual migration" -ForegroundColor Gray
    Write-Host ""
}
