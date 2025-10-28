# Project List (plist) - Portable Project Intelligence Tool
# Works in any git-based project with auto-discovery
# Version: 2.0.0 - Enhanced with key state tracking, request history, commit lookup

param(
    # Original commands (preserved)
    [switch]$keys,
    [switch]$dic,
    [switch]$git,
    [switch]$files,
    
    # New key data stream commands
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
    Write-Host "Project List (plist) - Project Intelligence Tool v2.0" -ForegroundColor Cyan
    Write-Host "=====================================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "DESCRIPTION:" -ForegroundColor White
    Write-Host "  Search keys, dictionary, git history, files, and key data streams"
    Write-Host "  Auto-discovers project structure - works in any git repository"
    Write-Host ""
    Write-Host "USAGE (Original):" -ForegroundColor White
    Write-Host "  plist -keys [-n <count>]              List work keys"
    Write-Host "  plist -dic -c <cat> [-f <filter>]     Dictionary lookup"
    Write-Host "  plist -git [-n <count>] [-oldest]     Git commit history"
    Write-Host "  plist -files -f <pattern>             Fuzzy file search"
    Write-Host ""
    Write-Host "USAGE (New - Key Data Streams):" -ForegroundColor Yellow
    Write-Host "  plist -lookup -k <key>                Full key summary"
    Write-Host "  plist -requests -k <key>              Request history for key"
    Write-Host "  plist -commits -k <key>               Git commits for key"
    Write-Host "  plist -timeline -k <key>              Visual timeline"
    Write-Host "  plist -prompts                        Show prompt graph"
    Write-Host "  plist -graph -k <key>                 Prompt execution path for key"
    Write-Host ""
    Write-Host "PARAMETERS:" -ForegroundColor White
    Write-Host "  -keys         List work item keys"
    Write-Host "  -dic          Show dictionary entries"
    Write-Host "  -git          Show git commit history"
    Write-Host "  -files        Search for files"
    Write-Host "  -lookup       Show full key details"
    Write-Host "  -requests     Show request history"
    Write-Host "  -commits      Show commits for key"
    Write-Host "  -timeline     Show visual timeline"
    Write-Host "  -prompts      Show prompt system graph"
    Write-Host "  -graph        Show prompt execution path"
    Write-Host "  -n <int>      Number of results (default: 10)"
    Write-Host "  -c <char>     Category (U|V|A|S|T|D|I|X=all)"
    Write-Host "  -f <string>   Filter/pattern"
    Write-Host "  -k <string>   Key name (for lookup/requests/commits/timeline/graph)"
    Write-Host "  -oldest       Reverse chronological (for git)"
    Write-Host "  -help         Show this help"
    Write-Host ""
    Write-Host "DICTIONARY CATEGORIES:" -ForegroundColor White
    Write-Host "  U = User-defined terms"
    Write-Host "  V = Views/Razor components"
    Write-Host "  A = API Controllers"
    Write-Host "  S = Services"
    Write-Host "  T = Testing/Config"
    Write-Host "  D = Database"
    Write-Host "  I = Infrastructure"
    Write-Host "  X = All categories"
    Write-Host ""
    Write-Host "EXAMPLES (Original):" -ForegroundColor White
    Write-Host "  plist -keys                      # Last 10 keys"
    Write-Host "  plist -keys -n 20                # Last 20 keys"
    Write-Host "  plist -dic -c V                  # All view shortcuts"
    Write-Host "  plist -dic -c V -f hcp           # Views matching 'hcp'"
    Write-Host "  plist -dic -c X                  # All dictionary entries"
    Write-Host "  plist -git -n 15                 # Last 15 commits"
    Write-Host "  plist -files -f hcpraz           # Fuzzy file search"
    Write-Host ""
    Write-Host "EXAMPLES (New - Key Data Streams):" -ForegroundColor Yellow
    Write-Host "  plist -lookup -k zoom-integration        # Full key details"
    Write-Host "  plist -requests -k database-safeguards   # Request history"
    Write-Host "  plist -commits -k transcript-canvas      # Commits for key"
    Write-Host "  plist -timeline -k host-prov-domain      # Visual timeline"
    Write-Host "  plist -prompts                           # Show prompt graph"
    Write-Host "  plist -graph -k zoom-integration         # Prompt execution path"
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

# Auto-discover key data stream locations
$script:KeyDataStreamPaths = @(
    ".github/key-data-streams",
    "Workspaces/Copilot/KeyDataStreams",
    ".copilot/key-data-streams",
    "docs/keys"
)

# Auto-discover key locations (preserved for compatibility)
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

# ============================================================================
# KEYS COMMAND
# ============================================================================

function Show-Keys {
    Write-Host ""
    Write-Host "Latest Keys ($n):" -ForegroundColor Cyan
    Write-Host ""
    
    $keysFound = @()
    
    # Search key files
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
                }
            }
        }
    }
    
    # Search summary files
    $summaryDir = Get-FirstExisting -Paths $script:SummaryPaths
    if ($summaryDir -and (Test-Path $summaryDir)) {
        Get-ChildItem -Path $summaryDir -Filter "*.md" -ErrorAction SilentlyContinue | ForEach-Object {
            $content = Get-Content $_.FullName -Raw -ErrorAction SilentlyContinue
            if ($content -match '\*\*Key:\*\*\s*(.+?)(?:\n|$)') {
                $keyName = $Matches[1].Trim()
                $date = $_.LastWriteTime.ToString("yyyy-MM-dd")
                $keysFound += [PSCustomObject]@{
                    Key = $keyName
                    Date = $_.LastWriteTime
                    DateStr = $date
                    Source = "summary"
                }
            }
        }
    }
    
    # Parse git history for keys
    $gitLogs = git log --all --format="%h|%s|%ad" --date=short -$($n * 3) 2>$null
    if ($gitLogs) {
        $gitLogs | ForEach-Object {
            if ($_ -match '^(.+?)\|(.+?)\|(.+)$') {
                $commit = $Matches[1]
                $message = $Matches[2]
                $date = $Matches[3]
                
                # Extract key from various patterns: (key), key:, [key]
                if ($message -match '\(([^)]+)\):') {
                    $keyName = $Matches[1]
                    $keysFound += [PSCustomObject]@{
                        Key = $keyName
                        Date = [DateTime]::Parse($date)
                        DateStr = $date
                        Source = "git"
                    }
                }
                elseif ($message -match '^(\w[\w-]+):') {
                    $keyName = $Matches[1]
                    $keysFound += [PSCustomObject]@{
                        Key = $keyName
                        Date = [DateTime]::Parse($date)
                        DateStr = $date
                        Source = "git"
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
        Write-Host "  Searched: keys/, summaries/, git history" -ForegroundColor Gray
    } else {
        $i = 1
        $uniqueKeys | ForEach-Object {
            Write-Host "  $i. " -NoNewline -ForegroundColor White
            Write-Host $_.Key -NoNewline -ForegroundColor Green
            Write-Host "  [$($_.DateStr)]" -ForegroundColor Gray
            $i++
        }
    }
    
    Write-Host ""
}

# ============================================================================
# DICTIONARY COMMAND
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
# GIT COMMAND
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
# FILES COMMAND
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
# LOOKUP COMMAND (New)
# ============================================================================

function Show-KeyLookup {
    if (-not $k) {
        Write-Host ""
        Write-Host "Error: -k <key> required for -lookup" -ForegroundColor Red
        Write-Host "Example: plist -lookup -k zoom-integration" -ForegroundColor Gray
        Write-Host ""
        return
    }
    
    Write-Host ""
    Write-Host "Key Lookup: $k" -ForegroundColor Cyan
    Write-Host ""
    
    # Find key data stream directory
    $keyDirFound = $false
    foreach ($basePath in $script:KeyDataStreamPaths) {
        $keyDir = Join-Path $script:ProjectRoot $basePath
        $targetKeyDir = Join-Path $keyDir $k
        
        if (Test-Path $targetKeyDir) {
            $keyDirFound = $true
            
            # Load state.json if exists
            $stateFile = Join-Path $targetKeyDir "$k.state.json"
            if (Test-Path $stateFile) {
                $state = Get-Content $stateFile -Raw | ConvertFrom-Json
                
                Write-Host "  Status: " -NoNewline -ForegroundColor White
                Write-Host $state.status -ForegroundColor Green
                Write-Host "  Created: " -NoNewline -ForegroundColor White
                Write-Host $state.created -ForegroundColor Gray
                Write-Host "  Phases: " -NoNewline -ForegroundColor White
                Write-Host "$($state.completedPhases)/$($state.totalPhases)" -ForegroundColor Yellow
                
                if ($state.requests -and $state.requests.Count -gt 0) {
                    Write-Host "  Requests: " -NoNewline -ForegroundColor White
                    Write-Host $state.requests.Count -ForegroundColor Cyan
                }
                
                if ($state.commits -and $state.commits.Count -gt 0) {
                    Write-Host "  Commits: " -NoNewline -ForegroundColor White
                    Write-Host $state.commits.Count -ForegroundColor Cyan
                }
                
                if ($state.filesModified -and $state.filesModified.Count -gt 0) {
                    Write-Host "  Files Modified: " -NoNewline -ForegroundColor White
                    Write-Host $state.filesModified.Count -ForegroundColor Cyan
                }
                
                if ($state.branch) {
                    Write-Host "  Branch: " -NoNewline -ForegroundColor White
                    Write-Host $state.branch -ForegroundColor Magenta
                }
                
                Write-Host "  Location: " -NoNewline -ForegroundColor White
                Write-Host $targetKeyDir.Replace($script:ProjectRoot, '.') -ForegroundColor Gray
            }
            else {
                # Fallback to plan.json
                $planFile = Join-Path $targetKeyDir "$k.plan.json"
                if (Test-Path $planFile) {
                    $plan = Get-Content $planFile -Raw | ConvertFrom-Json
                    
                    Write-Host "  Status: " -NoNewline -ForegroundColor White
                    Write-Host $plan.status -ForegroundColor Yellow
                    Write-Host "  Phases: " -NoNewline -ForegroundColor White
                    Write-Host "$($plan.completedPhases)/$($plan.totalPhases)" -ForegroundColor Cyan
                    Write-Host "  Location: " -NoNewline -ForegroundColor White
                    Write-Host $targetKeyDir.Replace($script:ProjectRoot, '.') -ForegroundColor Gray
                    Write-Host ""
                    Write-Host "  Note: Legacy format (plan.json only)" -ForegroundColor Yellow
                    Write-Host "  Run migration script to upgrade to state.json" -ForegroundColor Gray
                }
                else {
                    Write-Host "  No state.json or plan.json found" -ForegroundColor Yellow
                }
            }
            
            break
        }
    }
    
    if (-not $keyDirFound) {
        Write-Host "  Key not found: $k" -ForegroundColor Yellow
        Write-Host "  Searched paths:" -ForegroundColor Gray
        foreach ($basePath in $script:KeyDataStreamPaths) {
            Write-Host "    - $basePath" -ForegroundColor Gray
        }
    }
    
    Write-Host ""
}

# ============================================================================
# REQUESTS COMMAND (New)
# ============================================================================

function Show-KeyRequests {
    if (-not $k) {
        Write-Host ""
        Write-Host "Error: -k <key> required for -requests" -ForegroundColor Red
        Write-Host "Example: plist -requests -k zoom-integration" -ForegroundColor Gray
        Write-Host ""
        return
    }
    
    Write-Host ""
    Write-Host "Request History: $k" -ForegroundColor Cyan
    Write-Host ""
    
    # Find state.json
    $stateFile = $null
    foreach ($basePath in $script:KeyDataStreamPaths) {
        $keyDir = Join-Path $script:ProjectRoot $basePath
        $targetKeyDir = Join-Path $keyDir $k
        $testStateFile = Join-Path $targetKeyDir "$k.state.json"
        
        if (Test-Path $testStateFile) {
            $stateFile = $testStateFile
            break
        }
    }
    
    if (-not $stateFile) {
        Write-Host "  No state.json found for key: $k" -ForegroundColor Yellow
        Write-Host "  Run migration script to create state.json from work-log.md" -ForegroundColor Gray
        Write-Host ""
        return
    }
    
    $state = Get-Content $stateFile -Raw | ConvertFrom-Json
    
    if (-not $state.requests -or $state.requests.Count -eq 0) {
        Write-Host "  No requests recorded for this key" -ForegroundColor Yellow
    }
    else {
        $i = 1
        foreach ($req in $state.requests) {
            Write-Host "  $i. " -NoNewline -ForegroundColor White
            Write-Host "[$($req.type)] " -NoNewline -ForegroundColor Cyan
            $timestamp = if ($req.timestamp -is [DateTime]) { 
                $req.timestamp.ToString("yyyy-MM-dd HH:mm:ss")
            } else { 
                $req.timestamp.ToString().Substring(0, 19)
            }
            Write-Host $timestamp -ForegroundColor Gray
            Write-Host "     " -NoNewline
            Write-Host $req.userRequest.Substring(0, [Math]::Min(100, $req.userRequest.Length)) -ForegroundColor White
            if ($req.userRequest.Length -gt 100) {
                Write-Host "     ..." -ForegroundColor Gray
            }
            if ($req.commits -and $req.commits.Count -gt 0) {
                Write-Host "     Commits: " -NoNewline -ForegroundColor Gray
                Write-Host ($req.commits -join ', ') -ForegroundColor Yellow
            }
            Write-Host ""
            $i++
        }
    }
    
    Write-Host ""
}

# ============================================================================
# COMMITS COMMAND (New)
# ============================================================================

function Show-KeyCommits {
    if (-not $k) {
        Write-Host ""
        Write-Host "Error: -k <key> required for -commits" -ForegroundColor Red
        Write-Host "Example: plist -commits -k zoom-integration" -ForegroundColor Gray
        Write-Host ""
        return
    }
    
    Write-Host ""
    Write-Host "Commits: $k" -ForegroundColor Cyan
    Write-Host ""
    
    # Find state.json
    $stateFile = $null
    foreach ($basePath in $script:KeyDataStreamPaths) {
        $keyDir = Join-Path $script:ProjectRoot $basePath
        $targetKeyDir = Join-Path $keyDir $k
        $testStateFile = Join-Path $targetKeyDir "$k.state.json"
        
        if (Test-Path $testStateFile) {
            $stateFile = $testStateFile
            break
        }
    }
    
    if (-not $stateFile) {
        Write-Host "  No state.json found for key: $k" -ForegroundColor Yellow
        Write-Host "  Searching git history for ckpt($k) commits..." -ForegroundColor Gray
        Write-Host ""
        
        # Fallback: search git history
        $commits = git log --all --grep="ckpt($k)" --format="%h|%s|%ad|%an" --date=short -50 2>$null
        if ($commits) {
            $i = 1
            $commits | ForEach-Object {
                if ($_ -match '^(.+?)\|(.+?)\|(.+?)\|(.+)$') {
                    $sha = $Matches[1]
                    $message = $Matches[2]
                    $date = $Matches[3]
                    $author = $Matches[4]
                    
                    Write-Host "  $i. " -NoNewline -ForegroundColor White
                    Write-Host "[$date] " -NoNewline -ForegroundColor Gray
                    Write-Host $sha -NoNewline -ForegroundColor Yellow
                    Write-Host " - $message" -ForegroundColor White
                    $i++
                }
            }
        }
        else {
            Write-Host "  No commits found matching ckpt($k)" -ForegroundColor Yellow
        }
        
        Write-Host ""
        return
    }
    
    $state = Get-Content $stateFile -Raw | ConvertFrom-Json
    
    if (-not $state.commits -or $state.commits.Count -eq 0) {
        Write-Host "  No commits recorded for this key" -ForegroundColor Yellow
    }
    else {
        $i = 1
        foreach ($commit in $state.commits) {
            Write-Host "  $i. " -NoNewline -ForegroundColor White
            $timestampStr = if ($commit.timestamp -is [DateTime]) { $commit.timestamp.ToString("yyyy-MM-dd") } else { $commit.timestamp.Substring(0, 10) }
            Write-Host "[$timestampStr] " -NoNewline -ForegroundColor Gray
            Write-Host $commit.sha -NoNewline -ForegroundColor Yellow
            
            if ($commit.phase) {
                Write-Host " [Phase $($commit.phase)]" -NoNewline -ForegroundColor Cyan
            }
            
            Write-Host ""
            Write-Host "     $($commit.message)" -ForegroundColor White
            
            if ($commit.filesChanged -and $commit.filesChanged.Count -gt 0) {
                Write-Host "     Files: " -NoNewline -ForegroundColor Gray
                Write-Host "$($commit.filesChanged.Count) changed" -ForegroundColor Cyan
            }
            
            Write-Host ""
            $i++
        }
    }
    
    Write-Host ""
}

# ============================================================================
# TIMELINE COMMAND (New)
# ============================================================================

function Show-KeyTimeline {
    if (-not $k) {
        Write-Host ""
        Write-Host "Error: -k <key> required for -timeline" -ForegroundColor Red
        Write-Host "Example: plist -timeline -k zoom-integration" -ForegroundColor Gray
        Write-Host ""
        return
    }
    
    Write-Host ""
    Write-Host "Timeline: $k" -ForegroundColor Cyan
    Write-Host ""
    
    # Find state.json
    $stateFile = $null
    foreach ($basePath in $script:KeyDataStreamPaths) {
        $keyDir = Join-Path $script:ProjectRoot $basePath
        $targetKeyDir = Join-Path $keyDir $k
        $testStateFile = Join-Path $targetKeyDir "$k.state.json"
        
        if (Test-Path $testStateFile) {
            $stateFile = $testStateFile
            break
        }
    }
    
    if (-not $stateFile) {
        Write-Host "  No state.json found for key: $k" -ForegroundColor Yellow
        Write-Host ""
        return
    }
    
    $state = Get-Content $stateFile -Raw | ConvertFrom-Json
    
    # Build chronological timeline
    $events = @()
    
    # Add requests
    if ($state.requests) {
        foreach ($req in $state.requests) {
            $events += [PSCustomObject]@{
                Timestamp = [DateTime]::Parse($req.timestamp)
                Type = "Request"
                Description = "[$($req.type)] $($req.userRequest.Substring(0, [Math]::Min(80, $req.userRequest.Length)))"
                Color = "Cyan"
            }
        }
    }
    
    # Add commits
    if ($state.commits) {
        foreach ($commit in $state.commits) {
            $events += [PSCustomObject]@{
                Timestamp = [DateTime]::Parse($commit.timestamp)
                Type = "Commit"
                Description = "$($commit.sha) - $($commit.message.Substring(0, [Math]::Min(60, $commit.message.Length)))"
                Color = "Yellow"
            }
        }
    }
    
    # Add prompt handoffs
    if ($state.promptHandoffs) {
        foreach ($handoff in $state.promptHandoffs) {
            $events += [PSCustomObject]@{
                Timestamp = [DateTime]::Parse($handoff.timestamp)
                Type = "Handoff"
                Description = "$($handoff.from) → $($handoff.to)"
                Color = "Magenta"
            }
        }
    }
    
    # Sort by timestamp
    $events = $events | Sort-Object Timestamp
    
    if ($events.Count -eq 0) {
        Write-Host "  No timeline events found" -ForegroundColor Yellow
    }
    else {
        foreach ($event in $events) {
            Write-Host "  [$($event.Timestamp.ToString('yyyy-MM-dd HH:mm:ss'))] " -NoNewline -ForegroundColor Gray
            Write-Host "$($event.Type.PadRight(10)) " -NoNewline -ForegroundColor $event.Color
            Write-Host $event.Description -ForegroundColor White
        }
    }
    
    Write-Host ""
}

# ============================================================================
# PROMPTS COMMAND (New)
# ============================================================================

function Show-PromptsGraph {
    Write-Host ""
    Write-Host "Prompt System Graph" -ForegroundColor Cyan
    Write-Host ""
    
    # Auto-discover prompt files
    $promptDir = Join-Path $script:ProjectRoot ".github/prompts"
    if (-not (Test-Path $promptDir)) {
        Write-Host "  Prompt directory not found: .github/prompts" -ForegroundColor Yellow
        Write-Host ""
        return
    }
    
    # Parse prompts for acceptsFrom/calls metadata
    $prompts = @()
    Get-ChildItem $promptDir -Filter "*.md" -Recurse | ForEach-Object {
        $content = Get-Content $_.FullName -Raw
        
        # Extract prompt name
        $promptName = $_.BaseName -replace '\.prompt$', ''
        
        # Extract acceptsFrom
        $acceptsFrom = @()
        if ($content -match '(?m)^>\s*acceptsFrom:\s*\[([^\]]+)\]') {
            $acceptsFrom = $Matches[1] -split ',\s*' | ForEach-Object { $_.Trim() }
        }
        
        # Extract calls
        $calls = @()
        if ($content -match '(?m)^>\s*calls:\s*\[([^\]]+)\]') {
            $calls = $Matches[1] -split ',\s*' | ForEach-Object { $_.Trim() }
        }
        
        $prompts += [PSCustomObject]@{
            Name = $promptName
            AcceptsFrom = $acceptsFrom
            Calls = $calls
            Path = $_.FullName.Replace($script:ProjectRoot, '.')
        }
    }
    
    # Display graph
    Write-Host "  Main Agents:" -ForegroundColor White
    $mainAgents = @('route', 'plan', 'task', 'todo', 'test-generation', 'ask', 'drift', 'healthcheck', 'cohesion')
    foreach ($agent in $mainAgents) {
        $prompt = $prompts | Where-Object { $_.Name -eq $agent }
        if ($prompt) {
            Write-Host "    $($agent.PadRight(20)) " -NoNewline -ForegroundColor Green
            if ($prompt.Calls.Count -gt 0) {
                Write-Host "→ $($prompt.Calls -join ', ')" -ForegroundColor Cyan
            }
            else {
                Write-Host "(leaf)" -ForegroundColor Gray
            }
        }
    }
    
    Write-Host ""
    Write-Host "  Total Prompts: $($prompts.Count)" -ForegroundColor Gray
    Write-Host ""
}

# ============================================================================
# GRAPH COMMAND (New)
# ============================================================================

function Show-KeyPromptGraph {
    if (-not $k) {
        Write-Host ""
        Write-Host "Error: -k <key> required for -graph" -ForegroundColor Red
        Write-Host "Example: plist -graph -k zoom-integration" -ForegroundColor Gray
        Write-Host ""
        return
    }
    
    Write-Host ""
    Write-Host "Prompt Execution Graph: $k" -ForegroundColor Cyan
    Write-Host ""
    
    # Find state.json
    $stateFile = $null
    foreach ($basePath in $script:KeyDataStreamPaths) {
        $keyDir = Join-Path $script:ProjectRoot $basePath
        $targetKeyDir = Join-Path $keyDir $k
        $testStateFile = Join-Path $targetKeyDir "$k.state.json"
        
        if (Test-Path $testStateFile) {
            $stateFile = $testStateFile
            break
        }
    }
    
    if (-not $stateFile) {
        Write-Host "  No state.json found for key: $k" -ForegroundColor Yellow
        Write-Host ""
        return
    }
    
    $state = Get-Content $stateFile -Raw | ConvertFrom-Json
    
    if (-not $state.promptHandoffs -or $state.promptHandoffs.Count -eq 0) {
        Write-Host "  No prompt handoffs recorded for this key" -ForegroundColor Yellow
        Write-Host "  This feature requires state.json with promptHandoffs tracking" -ForegroundColor Gray
    }
    else {
        Write-Host "  Execution Path:" -ForegroundColor White
        Write-Host ""
        
        $i = 1
        foreach ($handoff in $state.promptHandoffs) {
            Write-Host "    $i. " -NoNewline -ForegroundColor White
            Write-Host "$($handoff.from.PadRight(15)) " -NoNewline -ForegroundColor Green
            Write-Host "→ " -NoNewline -ForegroundColor Gray
            Write-Host "$($handoff.to.PadRight(15)) " -NoNewline -ForegroundColor Cyan
            $timeStr = if ($handoff.timestamp -is [DateTime]) {
                $handoff.timestamp.ToString("HH:mm:ss")
            } else {
                $handoff.timestamp.ToString().Substring(11, 8)
            }
            Write-Host "[$timeStr]" -ForegroundColor Gray
            
            if ($handoff.reason) {
                Write-Host "       Reason: $($handoff.reason)" -ForegroundColor Yellow
            }
            
            $i++
        }
    }
    
    Write-Host ""
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================

# Validate mutually exclusive commands
$commandCount = @($keys, $dic, $git, $files, $lookup, $requests, $commits, $timeline, $prompts, $graph) | Where-Object { $_ } | Measure-Object | Select-Object -ExpandProperty Count

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
    Write-Host "Use one command at a time (not combined)" -ForegroundColor Gray
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
    Show-KeyLookup
}
elseif ($requests) {
    Show-KeyRequests
}
elseif ($commits) {
    Show-KeyCommits
}
elseif ($timeline) {
    Show-KeyTimeline
}
elseif ($prompts) {
    Show-PromptsGraph
}
elseif ($graph) {
    Show-KeyPromptGraph
}
