# Project List (plist) - Enhanced Project Intelligence Tool
# Works in any git-based project with auto-discovery
# Version: 2.0.0 - Enhanced with key data stream lookup

param(
    # Original commands (preserved)
    [switch]$keys,
    [switch]$dic,
    [switch]$git,
    [switch]$files,
    
    # New enhanced commands
    [switch]$lookup,
    [switch]$requests,
    [switch]$commits,
    [switch]$timeline,
    [switch]$prompts,
    [switch]$graph,
    
    # Parameters
    [int]$n = 10,
    [string]$c,
    [string]$f,
    [string]$k,  # Key name for lookup/requests/commits/timeline/graph
    [switch]$oldest,
    [switch]$help
)

# ============================================================================
# HELP
# ============================================================================

if ($help) {
    Write-Host ""
    Write-Host "Project List (plist) - Enhanced Project Intelligence Tool" -ForegroundColor Cyan
    Write-Host "==========================================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "DESCRIPTION:" -ForegroundColor White
    Write-Host "  Search and list keys, dictionary entries, git history, files, and key metadata"
    Write-Host "  Auto-discovers project structure - works in any git repository"
    Write-Host ""
    Write-Host "ORIGINAL COMMANDS:" -ForegroundColor White
    Write-Host "  plist -keys [-n <count>]              List work keys"
    Write-Host "  plist -dic -c <cat> [-f <filter>]     Dictionary lookup"
    Write-Host "  plist -git [-n <count>] [-oldest]     Git commit history"
    Write-Host "  plist -files -f <pattern>             Fuzzy file search"
    Write-Host ""
    Write-Host "NEW ENHANCED COMMANDS:" -ForegroundColor Yellow
    Write-Host "  plist -lookup -k <key>                Show full key summary"
    Write-Host "  plist -requests -k <key>              Show request history for key"
    Write-Host "  plist -commits -k <key>               Show git commits for key"
    Write-Host "  plist -timeline -k <key>              Show visual timeline"
    Write-Host "  plist -prompts                        Show prompt graph"
    Write-Host "  plist -graph -k <key>                 Show prompt execution path"
    Write-Host ""
    Write-Host "PARAMETERS:" -ForegroundColor White
    Write-Host "  -keys         List work item keys"
    Write-Host "  -dic          Show dictionary entries"
    Write-Host "  -git          Show git commit history"
    Write-Host "  -files        Search for files"
    Write-Host "  -lookup       Show full key details"
    Write-Host "  -requests     Show request history"
    Write-Host "  -commits      Show key commits"
    Write-Host "  -timeline     Show visual timeline"
    Write-Host "  -prompts      Show prompt graph"
    Write-Host "  -graph        Show prompt path"
    Write-Host "  -n <int>      Number of results (default: 10)"
    Write-Host "  -c <char>     Category (U|V|A|S|T|D|I|X=all)"
    Write-Host "  -f <string>   Filter/pattern"
    Write-Host "  -k <string>   Key name (for lookup/requests/commits/timeline/graph)"
    Write-Host "  -oldest       Reverse chronological (for git)"
    Write-Host "  -help         Show this help"
    Write-Host ""
    Write-Host "EXAMPLES:" -ForegroundColor White
    Write-Host "  plist -keys                          # Last 10 keys"
    Write-Host "  plist -lookup -k zoom-integration    # Full key summary"
    Write-Host "  plist -requests -k zoom-integration  # Request history"
    Write-Host "  plist -commits -k database-env       # Commits for key"
    Write-Host "  plist -timeline -k zoom-integration  # Visual timeline"
    Write-Host "  plist -prompts                       # Prompt graph"
    Write-Host "  plist -graph -k zoom-integration     # Prompt execution path"
    Write-Host ""
    return
}

# ============================================================================
# AUTO-DISCOVERY
# ============================================================================

function Get-ProjectRoot {
    $gitRoot = git rev-parse --show-toplevel 2>$null
    if ($gitRoot) {
        return $gitRoot -replace '/', '\'
    }
    return $PWD.Path
}

function Get-FirstExisting {
    param([string[]]$Paths)
    
    foreach ($p in $Paths) {
        $fullPath = Join-Path $script:ProjectRoot $p
        if (Test-Path $fullPath) {
            return $fullPath
        }
    }
    return $null
}

$script:ProjectRoot = Get-ProjectRoot

# Auto-discover key locations
$script:KeyStreamPaths = @(
    ".github/key-data-streams",
    "Workspaces/Copilot/KeyDataStreams",
    ".copilot/keys",
    "docs/work-items"
)

$script:KeyPaths = @(
    "Workspaces/Copilot/keys",
    ".copilot/keys",
    "docs/work-items",
    "workspace/keys",
    ".github/work"
)

$script:SummaryPaths = @(
    "Workspaces/Copilot/_DOCS/summaries",
    ".copilot/summaries",
    "docs/summaries"
)

$script:DictionaryPaths = @(
    ".github/prompts/shared/UserDictionary.md",
    ".dictionary.md",
    "DICTIONARY.md",
    "docs/dictionary.md"
)

$script:PromptPaths = @(
    ".github/prompts"
)

# ============================================================================
# KEYS COMMAND (ORIGINAL - PRESERVED)
# ============================================================================

function Show-Keys {
    Write-Host ""
    Write-Host "Latest Keys ($n):" -ForegroundColor Cyan
    Write-Host ""
    
    $keysFound = @()
    
    # Search key data stream directories
    $keyStreamDir = Get-FirstExisting -Paths $script:KeyStreamPaths
    if ($keyStreamDir -and (Test-Path $keyStreamDir)) {
        Get-ChildItem -Path $keyStreamDir -Directory -ErrorAction SilentlyContinue | ForEach-Object {
            $keyName = $_.Name
            $stateFile = Join-Path $_.FullName "$keyName.state.json"
            $planFile = Join-Path $_.FullName "$keyName.plan.json"
            
            if (Test-Path $stateFile) {
                $state = Get-Content $stateFile -Raw | ConvertFrom-Json
                $keysFound += [PSCustomObject]@{
                    Key = $keyName
                    Date = [DateTime]::Parse($state.lastUpdated)
                    DateStr = ([DateTime]::Parse($state.lastUpdated)).ToString("yyyy-MM-dd")
                    Source = "state.json"
                    Status = $state.status
                }
            } elseif (Test-Path $planFile) {
                $keysFound += [PSCustomObject]@{
                    Key = $keyName
                    Date = $_.LastWriteTime
                    DateStr = $_.LastWriteTime.ToString("yyyy-MM-dd")
                    Source = "plan.json"
                    Status = "unknown"
                }
            } else {
                $keysFound += [PSCustomObject]@{
                    Key = $keyName
                    Date = $_.LastWriteTime
                    DateStr = $_.LastWriteTime.ToString("yyyy-MM-dd")
                    Source = "directory"
                    Status = "unknown"
                }
            }
        }
    }
    
    # Fallback: Search key files (legacy support)
    $keyDir = Get-FirstExisting -Paths $script:KeyPaths
    if ($keyDir -and (Test-Path $keyDir)) {
        Get-ChildItem -Path $keyDir -Filter "*.md" -ErrorAction SilentlyContinue | ForEach-Object {
            $content = Get-Content $_.FullName -Raw -ErrorAction SilentlyContinue
            if ($content -match '(?:^|\n)#\s+Key:\s*(.+?)(?:\n|$)') {
                $keyName = $Matches[1].Trim()
                $date = $_.LastWriteTime.ToString("yyyy-MM-dd")
                $keysFound += [PSCustomObject]@{
                    Key = $keyName
                    Date = $_.LastWriteTime
                    DateStr = $date
                    Source = "file"
                    Status = "unknown"
                }
            }
        }
    }
    
    # Parse git history for keys (legacy support)
    $gitLogs = git log --all --format="%h|%s|%ad" --date=short -$($n * 3) 2>$null
    if ($gitLogs) {
        $gitLogs | ForEach-Object {
            if ($_ -match '^(.+?)\|(.+?)\|(.+)$') {
                $commit = $Matches[1]
                $message = $Matches[2]
                $date = $Matches[3]
                
                # Extract key from various patterns: (key), key:, [key], ckpt(key)
                if ($message -match 'ckpt\(([^)]+)\):') {
                    $keyName = $Matches[1]
                    $keysFound += [PSCustomObject]@{
                        Key = $keyName
                        Date = [DateTime]::Parse($date)
                        DateStr = $date
                        Source = "git"
                        Status = "unknown"
                    }
                }
                elseif ($message -match '\(([^)]+)\):') {
                    $keyName = $Matches[1]
                    $keysFound += [PSCustomObject]@{
                        Key = $keyName
                        Date = [DateTime]::Parse($date)
                        DateStr = $date
                        Source = "git"
                        Status = "unknown"
                    }
                }
                elseif ($message -match '^(\w[\w-]+):') {
                    $keyName = $Matches[1]
                    $keysFound += [PSCustomObject]@{
                        Key = $keyName
                        Date = [DateTime]::Parse($date)
                        DateStr = $date
                        Source = "git"
                        Status = "unknown"
                    }
                }
            }
        }
    }
    
    # Sort and deduplicate
    $uniqueKeys = $keysFound | 
        Sort-Object Key, Date -Unique -Descending |
        Sort-Object Date -Descending |
        Select-Object -First $n
    
    if ($uniqueKeys.Count -eq 0) {
        Write-Host "  No keys found" -ForegroundColor Yellow
        Write-Host "  Searched: .github/key-data-streams/, keys/, summaries/, git history" -ForegroundColor Gray
    } else {
        $i = 1
        $uniqueKeys | ForEach-Object {
            Write-Host "  $i. " -NoNewline -ForegroundColor White
            Write-Host $_.Key -NoNewline -ForegroundColor Green
            if ($_.Status -ne "unknown") {
                Write-Host " [$($_.Status)]" -NoNewline -ForegroundColor Yellow
            }
            Write-Host "  [$($_.DateStr)]" -ForegroundColor Gray
            $i++
        }
    }
    
    Write-Host ""
}

# ============================================================================
# DICTIONARY COMMAND (ORIGINAL - PRESERVED)
# ============================================================================

function Show-Dictionary {
    Write-Host ""
    
    $dictFile = Get-FirstExisting -Paths $script:DictionaryPaths
    
    if (-not $dictFile -or -not (Test-Path $dictFile)) {
        Write-Host "Dictionary file not found" -ForegroundColor Yellow
        Write-Host "Searched: .github/prompts/shared/UserDictionary.md, .dictionary.md, DICTIONARY.md" -ForegroundColor Gray
        Write-Host ""
        return
    }
    
    $content = Get-Content $dictFile -Raw
    
    # Category mapping
    $categoryMap = @{
        'U' = @{ Pattern = 'User acronyms|User-defined'; Name = 'User-Defined Terms' }
        'V' = @{ Pattern = 'Views|Blazor Components|Components'; Name = 'Views/Razor Components' }
        'A' = @{ Pattern = 'API Controllers|Controllers'; Name = 'API Controllers' }
        'S' = @{ Pattern = 'Services'; Name = 'Services' }
        'T' = @{ Pattern = 'Testing|Config'; Name = 'Testing & Config' }
        'D' = @{ Pattern = 'Data|DbContext|Database'; Name = 'Database' }
        'I' = @{ Pattern = 'Infrastructure|Cloudflare'; Name = 'Infrastructure' }
    }
    
    # Determine categories to show
    $categoriesToShow = if ($c -eq 'X' -or -not $c) {
        @('U', 'V', 'A', 'S', 'T', 'D', 'I')
    } else {
        @($c)
    }
    
    foreach ($cat in $categoriesToShow) {
        if (-not $categoryMap.ContainsKey($cat)) { continue }
        
        $catInfo = $categoryMap[$cat]
        $pattern = $catInfo.Pattern
        
        # Find section in dictionary
        if ($content -match "(?ms)(?:^|\n)(?:##+\s*)?($pattern)[^\n]*\n(.+?)(?=\n(?:##+|$))") {
            $sectionContent = $Matches[2]
            
            Write-Host "$($catInfo.Name) ($cat):" -ForegroundColor Cyan
            
            # Parse entries: "- shortcut: description — reference"
            $entries = [regex]::Matches($sectionContent, '(?m)^-\s+(\S+):\s*(.+?)(?:—|$)')
            
            $filteredEntries = $entries | Where-Object {
                if ($f) {
                    $_.Groups[1].Value -like "*$f*" -or $_.Groups[2].Value -like "*$f*"
                } else {
                    $true
                }
            }
            
            if ($filteredEntries.Count -eq 0) {
                if ($f) {
                    Write-Host "  No entries matching '$f'" -ForegroundColor Yellow
                } else {
                    Write-Host "  No entries found" -ForegroundColor Yellow
                }
            } else {
                $filteredEntries | ForEach-Object {
                    $shortcut = $_.Groups[1].Value
                    $description = $_.Groups[2].Value.Trim()
                    
                    Write-Host "  • " -NoNewline -ForegroundColor White
                    Write-Host $shortcut.PadRight(10) -NoNewline -ForegroundColor Green
                    Write-Host " → " -NoNewline -ForegroundColor Gray
                    Write-Host $description -ForegroundColor White
                }
            }
            
            Write-Host ""
        }
    }
}

# ============================================================================
# GIT COMMAND (ORIGINAL - PRESERVED)
# ============================================================================

function Show-Git {
    Write-Host ""
    Write-Host "Git History ($n, " -NoNewline -ForegroundColor Cyan
    if ($oldest) {
        Write-Host "oldest first" -NoNewline -ForegroundColor Cyan
    } else {
        Write-Host "newest first" -NoNewline -ForegroundColor Cyan
    }
    Write-Host "):" -ForegroundColor Cyan
    Write-Host ""
    
    $commits = git log --format="%h|%s|%ad" --date=short -$n 2>$null
    
    if (-not $commits) {
        Write-Host "  No git history found" -ForegroundColor Yellow
        Write-Host ""
        return
    }
    
    $commitList = $commits | ForEach-Object {
        if ($_ -match '^(.+?)\|(.+?)\|(.+)$') {
            [PSCustomObject]@{
                Hash = $Matches[1]
                Message = $Matches[2]
                Date = $Matches[3]
            }
        }
    }
    
    if ($oldest) {
        [array]::Reverse($commitList)
    }
    
    $commitList | ForEach-Object {
        Write-Host "  [$($_.Date)] " -NoNewline -ForegroundColor Gray
        Write-Host $_.Hash -NoNewline -ForegroundColor Yellow
        Write-Host " - " -NoNewline -ForegroundColor Gray
        Write-Host $_.Message -ForegroundColor White
    }
    
    Write-Host ""
}

# ============================================================================
# FILES COMMAND (ORIGINAL - PRESERVED)
# ============================================================================

function Show-Files {
    if (-not $f) {
        Write-Host ""
        Write-Host "Error: -f <pattern> required for file search" -ForegroundColor Red
        Write-Host "Example: plist -files -f hcpraz" -ForegroundColor Gray
        Write-Host ""
        return
    }
    
    Write-Host ""
    Write-Host "Files matching '$f':" -ForegroundColor Cyan
    Write-Host ""
    
    # Fuzzy matching: extract characters from pattern
    $patternChars = $f.ToCharArray()
    $regexPattern = ($patternChars | ForEach-Object { [regex]::Escape($_) }) -join '.*?'
    $regex = [regex]::new($regexPattern, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
    
    # Search files (excluding common ignore patterns)
    $files = Get-ChildItem -Recurse -File -ErrorAction SilentlyContinue |
        Where-Object {
            $_.FullName -notmatch '\\(node_modules|bin|obj|\.git|\.vs|packages|test-results)\\' -and
            $regex.IsMatch($_.Name)
        } |
        Select-Object -First $n
    
    if ($files.Count -eq 0) {
        Write-Host "  No files found matching '$f'" -ForegroundColor Yellow
    } else {
        $i = 1
        $files | ForEach-Object {
            $relativePath = $_.FullName.Replace($script:ProjectRoot, '').TrimStart('\')
            Write-Host "  $i. " -NoNewline -ForegroundColor White
            Write-Host $_.Name -NoNewline -ForegroundColor Green
            Write-Host "  ($relativePath)" -ForegroundColor Gray
            $i++
        }
    }
    
    Write-Host ""
}

# ============================================================================
# NEW: LOOKUP COMMAND
# ============================================================================

function Show-Lookup {
    if (-not $k) {
        Write-Host ""
        Write-Host "Error: -k <key> required for lookup" -ForegroundColor Red
        Write-Host "Example: plist -lookup -k zoom-integration" -ForegroundColor Gray
        Write-Host ""
        return
    }
    
    $keyStreamDir = Get-FirstExisting -Paths $script:KeyStreamPaths
    if (-not $keyStreamDir) {
        Write-Host ""
        Write-Host "Error: Key data stream directory not found" -ForegroundColor Red
        Write-Host ""
        return
    }
    
    $keyDir = Join-Path $keyStreamDir $k
    if (-not (Test-Path $keyDir)) {
        Write-Host ""
        Write-Host "Error: Key '$k' not found in $keyStreamDir" -ForegroundColor Red
        Write-Host ""
        return
    }
    
    $stateFile = Join-Path $keyDir "$k.state.json"
    
    if (-not (Test-Path $stateFile)) {
        Write-Host ""
        Write-Host "Warning: Key '$k' does not have a state.json file (legacy format)" -ForegroundColor Yellow
        Write-Host "Showing basic information from available files..." -ForegroundColor Gray
        Write-Host ""
        
        # Show basic info from plan.json if available
        $planFile = Join-Path $keyDir "$k.plan.json"
        if (Test-Path $planFile) {
            $plan = Get-Content $planFile -Raw | ConvertFrom-Json
            Write-Host "Key: " -NoNewline -ForegroundColor Cyan
            Write-Host $k -ForegroundColor Green
            Write-Host "Status: " -NoNewline -ForegroundColor Cyan
            Write-Host $plan.status -ForegroundColor Yellow
            Write-Host "Phases: " -NoNewline -ForegroundColor Cyan
            Write-Host "$($plan.completedPhases)/$($plan.totalPhases)" -ForegroundColor White
            Write-Host ""
        }
        return
    }
    
    $state = Get-Content $stateFile -Raw | ConvertFrom-Json
    
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "  KEY: " -NoNewline -ForegroundColor Cyan
    Write-Host $state.key -ForegroundColor Green
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host ""
    
    Write-Host "STATUS" -ForegroundColor Cyan
    Write-Host "  Current: " -NoNewline
    Write-Host $state.status -ForegroundColor Yellow
    Write-Host "  Created: " -NoNewline
    Write-Host $state.created
    Write-Host "  Updated: " -NoNewline
    Write-Host $state.lastUpdated
    Write-Host ""
    
    Write-Host "REQUESTS" -ForegroundColor Cyan
    if ($state.requests -and $state.requests.Count -gt 0) {
        foreach ($req in $state.requests) {
            Write-Host "  [$($req.timestamp)] " -NoNewline -ForegroundColor Gray
            Write-Host $req.type.ToUpper() -NoNewline -ForegroundColor $(if ($req.type -eq "original") { "Green" } else { "Yellow" })
            Write-Host ""
            Write-Host "    $($req.userRequest.Substring(0, [Math]::Min(80, $req.userRequest.Length)))..." -ForegroundColor White
        }
    } else {
        Write-Host "  No requests recorded" -ForegroundColor Gray
    }
    Write-Host ""
    
    Write-Host "COMMITS" -ForegroundColor Cyan
    if ($state.commits -and $state.commits.Count -gt 0) {
        foreach ($commit in $state.commits | Select-Object -First 5) {
            Write-Host "  [$($commit.timestamp)] " -NoNewline -ForegroundColor Gray
            Write-Host $commit.sha -NoNewline -ForegroundColor Yellow
            Write-Host " - $($commit.message)" -ForegroundColor White
        }
        if ($state.commits.Count -gt 5) {
            Write-Host "  ... and $($state.commits.Count - 5) more commits" -ForegroundColor Gray
        }
    } else {
        Write-Host "  No commits recorded" -ForegroundColor Gray
    }
    Write-Host ""
    
    Write-Host "PHASES" -ForegroundColor Cyan
    if ($state.phases -and $state.phases.Count -gt 0) {
        foreach ($phase in $state.phases) {
            $statusIcon = switch ($phase.status) {
                "completed" { "✓" }
                "in-progress" { "⟳" }
                default { "○" }
            }
            $statusColor = switch ($phase.status) {
                "completed" { "Green" }
                "in-progress" { "Yellow" }
                default { "Gray" }
            }
            Write-Host "  $statusIcon Phase $($phase.number): " -NoNewline -ForegroundColor $statusColor
            Write-Host $phase.title -ForegroundColor White
        }
    } else {
        Write-Host "  No phases defined" -ForegroundColor Gray
    }
    Write-Host ""
    
    Write-Host "FILES MODIFIED" -ForegroundColor Cyan
    if ($state.filesModified -and $state.filesModified.Count -gt 0) {
        foreach ($file in $state.filesModified | Select-Object -First 10) {
            Write-Host "  • $file" -ForegroundColor White
        }
        if ($state.filesModified.Count -gt 10) {
            Write-Host "  ... and $($state.filesModified.Count - 10) more files" -ForegroundColor Gray
        }
    } else {
        Write-Host "  No files tracked" -ForegroundColor Gray
    }
    Write-Host ""
}

# ============================================================================
# NEW: REQUESTS COMMAND
# ============================================================================

function Show-Requests {
    if (-not $k) {
        Write-Host ""
        Write-Host "Error: -k <key> required for requests" -ForegroundColor Red
        Write-Host "Example: plist -requests -k zoom-integration" -ForegroundColor Gray
        Write-Host ""
        return
    }
    
    $keyStreamDir = Get-FirstExisting -Paths $script:KeyStreamPaths
    $stateFile = Join-Path $keyStreamDir "$k\$k.state.json"
    
    if (-not (Test-Path $stateFile)) {
        Write-Host ""
        Write-Host "Error: State file not found for key '$k'" -ForegroundColor Red
        Write-Host ""
        return
    }
    
    $state = Get-Content $stateFile -Raw | ConvertFrom-Json
    
    Write-Host ""
    Write-Host "Request History: $k" -ForegroundColor Cyan
    Write-Host ""
    
    if (-not $state.requests -or $state.requests.Count -eq 0) {
        Write-Host "  No requests recorded" -ForegroundColor Yellow
        Write-Host ""
        return
    }
    
    $i = 1
    foreach ($req in $state.requests) {
        Write-Host "  $i. " -NoNewline -ForegroundColor White
        Write-Host "[$($req.timestamp)] " -NoNewline -ForegroundColor Gray
        Write-Host $req.type.ToUpper() -ForegroundColor $(if ($req.type -eq "original") { "Green" } else { "Yellow" })
        Write-Host "     $($req.userRequest)" -ForegroundColor White
        if ($req.promptChain -and $req.promptChain.Count -gt 0) {
            Write-Host "     Prompts: " -NoNewline -ForegroundColor Cyan
            Write-Host ($req.promptChain -join " → ") -ForegroundColor Gray
        }
        if ($req.commits -and $req.commits.Count -gt 0) {
            Write-Host "     Commits: " -NoNewline -ForegroundColor Cyan
            Write-Host ($req.commits -join ", ") -ForegroundColor Yellow
        }
        Write-Host ""
        $i++
    }
}

# ============================================================================
# NEW: COMMITS COMMAND
# ============================================================================

function Show-Commits {
    if (-not $k) {
        Write-Host ""
        Write-Host "Error: -k <key> required for commits" -ForegroundColor Red
        Write-Host "Example: plist -commits -k zoom-integration" -ForegroundColor Gray
        Write-Host ""
        return
    }
    
    $keyStreamDir = Get-FirstExisting -Paths $script:KeyStreamPaths
    $stateFile = Join-Path $keyStreamDir "$k\$k.state.json"
    
    if (-not (Test-Path $stateFile)) {
        Write-Host ""
        Write-Host "Error: State file not found for key '$k'" -ForegroundColor Red
        Write-Host ""
        return
    }
    
    $state = Get-Content $stateFile -Raw | ConvertFrom-Json
    
    Write-Host ""
    Write-Host "Git Commits: $k" -ForegroundColor Cyan
    Write-Host ""
    
    if (-not $state.commits -or $state.commits.Count -eq 0) {
        Write-Host "  No commits recorded" -ForegroundColor Yellow
        Write-Host ""
        return
    }
    
    foreach ($commit in $state.commits) {
        Write-Host "  [$($commit.timestamp)] " -NoNewline -ForegroundColor Gray
        Write-Host $commit.sha -NoNewline -ForegroundColor Yellow
        Write-Host " [Phase $($commit.phase)]" -NoNewline -ForegroundColor Cyan
        Write-Host ""
        Write-Host "    $($commit.message)" -ForegroundColor White
        Write-Host ""
    }
}

# ============================================================================
# NEW: TIMELINE COMMAND
# ============================================================================

function Show-Timeline {
    if (-not $k) {
        Write-Host ""
        Write-Host "Error: -k <key> required for timeline" -ForegroundColor Red
        Write-Host "Example: plist -timeline -k zoom-integration" -ForegroundColor Gray
        Write-Host ""
        return
    }
    
    $keyStreamDir = Get-FirstExisting -Paths $script:KeyStreamPaths
    $stateFile = Join-Path $keyStreamDir "$k\$k.state.json"
    
    if (-not (Test-Path $stateFile)) {
        Write-Host ""
        Write-Host "Error: State file not found for key '$k'" -ForegroundColor Red
        Write-Host ""
        return
    }
    
    $state = Get-Content $stateFile -Raw | ConvertFrom-Json
    
    Write-Host ""
    Write-Host "Timeline: $k" -ForegroundColor Cyan
    Write-Host ""
    
    # Combine requests and commits into timeline
    $events = @()
    
    if ($state.requests) {
        foreach ($req in $state.requests) {
            $events += [PSCustomObject]@{
                Timestamp = [DateTime]::Parse($req.timestamp)
                Type = "Request"
                Description = "$($req.type): $($req.userRequest.Substring(0, [Math]::Min(60, $req.userRequest.Length)))..."
                Color = if ($req.type -eq "original") { "Green" } else { "Yellow" }
            }
        }
    }
    
    if ($state.commits) {
        foreach ($commit in $state.commits) {
            $events += [PSCustomObject]@{
                Timestamp = [DateTime]::Parse($commit.timestamp)
                Type = "Commit"
                Description = "$($commit.sha): $($commit.message)"
                Color = "Cyan"
            }
        }
    }
    
    if ($state.phases) {
        foreach ($phase in $state.phases | Where-Object { $_.status -eq "completed" -and $_.completedAt }) {
            $events += [PSCustomObject]@{
                Timestamp = [DateTime]::Parse($phase.completedAt)
                Type = "Phase"
                Description = "Phase $($phase.number) completed: $($phase.title)"
                Color = "Magenta"
            }
        }
    }
    
    if ($events.Count -eq 0) {
        Write-Host "  No timeline events" -ForegroundColor Yellow
        Write-Host ""
        return
    }
    
    $sortedEvents = $events | Sort-Object Timestamp
    
    foreach ($event in $sortedEvents) {
        $icon = switch ($event.Type) {
            "Request" { "📝" }
            "Commit" { "💾" }
            "Phase" { "✓" }
            default { "•" }
        }
        
        Write-Host "  $icon " -NoNewline
        Write-Host "[$($event.Timestamp.ToString('yyyy-MM-dd HH:mm'))] " -NoNewline -ForegroundColor Gray
        Write-Host $event.Type.PadRight(8) -NoNewline -ForegroundColor $event.Color
        Write-Host $event.Description -ForegroundColor White
    }
    
    Write-Host ""
}

# ============================================================================
# NEW: PROMPTS COMMAND
# ============================================================================

function Show-Prompts {
    $promptDir = Get-FirstExisting -Paths $script:PromptPaths
    
    if (-not $promptDir -or -not (Test-Path $promptDir)) {
        Write-Host ""
        Write-Host "Error: Prompts directory not found" -ForegroundColor Red
        Write-Host ""
        return
    }
    
    Write-Host ""
    Write-Host "Prompt System Graph" -ForegroundColor Cyan
    Write-Host ""
    
    # Parse all prompt files for acceptsFrom/calls metadata
    $prompts = @{}
    
    Get-ChildItem -Path $promptDir -Filter "*.prompt.md" -Recurse -ErrorAction SilentlyContinue | ForEach-Object {
        $content = Get-Content $_.FullName -Raw -ErrorAction SilentlyContinue
        $name = $_.BaseName -replace '\.prompt$', ''
        
        $acceptsFrom = @()
        $calls = @()
        
        if ($content -match '(?m)^>\s*acceptsFrom:\s*\[([^\]]+)\]') {
            $acceptsFrom = $Matches[1] -split ',' | ForEach-Object { $_.Trim() }
        }
        
        if ($content -match '(?m)^>\s*calls:\s*\[([^\]]+)\]') {
            $calls = $Matches[1] -split ',' | ForEach-Object { $_.Trim() }
        }
        
        $prompts[$name] = @{
            AcceptsFrom = $acceptsFrom
            Calls = $calls
            Path = $_.FullName.Replace($script:ProjectRoot, '').TrimStart('\')
        }
    }
    
    # Display main agent prompts
    Write-Host "Main Agents:" -ForegroundColor Yellow
    $mainAgents = @('route', 'plan', 'task', 'todo', 'ask', 'healthcheck', 'drift', 'cohesion', 'test-generation')
    
    foreach ($agent in $mainAgents) {
        if ($prompts.ContainsKey($agent)) {
            Write-Host "  • " -NoNewline -ForegroundColor White
            Write-Host $agent.PadRight(20) -NoNewline -ForegroundColor Green
            if ($prompts[$agent].Calls.Count -gt 0) {
                Write-Host "→ " -NoNewline -ForegroundColor Gray
                Write-Host ($prompts[$agent].Calls -join ", ") -ForegroundColor Cyan
            } else {
                Write-Host ""
            }
        }
    }
    
    Write-Host ""
    Write-Host "Workflow:" -ForegroundColor Yellow
    Write-Host "  route → plan → task → test-generation" -ForegroundColor Gray
    Write-Host "       ↘ todo" -ForegroundColor Gray
    Write-Host "       ↘ ask" -ForegroundColor Gray
    Write-Host "       ↘ healthcheck" -ForegroundColor Gray
    Write-Host ""
}

# ============================================================================
# NEW: GRAPH COMMAND
# ============================================================================

function Show-Graph {
    if (-not $k) {
        Write-Host ""
        Write-Host "Error: -k <key> required for graph" -ForegroundColor Red
        Write-Host "Example: plist -graph -k zoom-integration" -ForegroundColor Gray
        Write-Host ""
        return
    }
    
    $keyStreamDir = Get-FirstExisting -Paths $script:KeyStreamPaths
    $stateFile = Join-Path $keyStreamDir "$k\$k.state.json"
    
    if (-not (Test-Path $stateFile)) {
        Write-Host ""
        Write-Host "Error: State file not found for key '$k'" -ForegroundColor Red
        Write-Host ""
        return
    }
    
    $state = Get-Content $stateFile -Raw | ConvertFrom-Json
    
    Write-Host ""
    Write-Host "Prompt Execution Path: $k" -ForegroundColor Cyan
    Write-Host ""
    
    if (-not $state.promptHandoffs -or $state.promptHandoffs.Count -eq 0) {
        Write-Host "  No prompt handoffs recorded" -ForegroundColor Yellow
        Write-Host ""
        return
    }
    
    # Build execution graph
    $handoffs = $state.promptHandoffs | Sort-Object { [DateTime]::Parse($_.timestamp) }
    
    $prevPrompt = $null
    foreach ($handoff in $handoffs) {
        if ($prevPrompt -ne $handoff.from) {
            Write-Host "  $($handoff.from)" -ForegroundColor Green
        }
        
        Write-Host "    ↓" -ForegroundColor Gray
        Write-Host "  $($handoff.to)" -ForegroundColor Cyan
        Write-Host "    [$($handoff.timestamp)]" -ForegroundColor Gray
        
        $prevPrompt = $handoff.to
    }
    
    Write-Host ""
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================

# Validate mutually exclusive commands
$allCommands = @($keys, $dic, $git, $files, $lookup, $requests, $commits, $timeline, $prompts, $graph)
$commandCount = ($allCommands | Where-Object { $_ }).Count

if ($commandCount -eq 0) {
    Write-Host ""
    Write-Host "Error: No command specified" -ForegroundColor Red
    Write-Host "Use: plist -keys | -dic | -git | -files | -lookup | -requests | -commits | -timeline | -prompts | -graph" -ForegroundColor Gray
    Write-Host "Or:  plist -help" -ForegroundColor Gray
    Write-Host ""
    exit 1
}

if ($commandCount -gt 1) {
    Write-Host ""
    Write-Host "Error: Only one command allowed at a time" -ForegroundColor Red
    Write-Host ""
    exit 1
}

# Execute command
if ($keys) {
    Show-Keys
}
elseif ($dic) {
    Show-Dictionary
}
elseif ($git) {
    Show-Git
}
elseif ($files) {
    Show-Files
}
elseif ($lookup) {
    Show-Lookup
}
elseif ($requests) {
    Show-Requests
}
elseif ($commits) {
    Show-Commits
}
elseif ($timeline) {
    Show-Timeline
}
elseif ($prompts) {
    Show-Prompts
}
elseif ($graph) {
    Show-Graph
}
