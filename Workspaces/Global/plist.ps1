# Project List (plist) - Portable Project Intelligence Tool
# Works in any git-based project with auto-discovery
# Version: 1.0.0

param(
    [switch]$keys,
    [switch]$dic,
    [switch]$git,
    [switch]$files,
    [int]$n = 10,
    [string]$c,
    [string]$f,
    [switch]$oldest,
    [switch]$help
)

# ============================================================================
# HELP
# ============================================================================

if ($help) {
    Write-Host ""
    Write-Host "Project List (plist) - Project Intelligence Tool" -ForegroundColor Cyan
    Write-Host "=================================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "DESCRIPTION:" -ForegroundColor White
    Write-Host "  Search and list keys, dictionary entries, git history, and files"
    Write-Host "  Auto-discovers project structure - works in any git repository"
    Write-Host ""
    Write-Host "USAGE:" -ForegroundColor White
    Write-Host "  plist -keys [-n <count>]              List work keys"
    Write-Host "  plist -dic -c <cat> [-f <filter>]     Dictionary lookup"
    Write-Host "  plist -git [-n <count>] [-oldest]     Git commit history"
    Write-Host "  plist -files -f <pattern>             Fuzzy file search"
    Write-Host ""
    Write-Host "PARAMETERS:" -ForegroundColor White
    Write-Host "  -keys         List work item keys"
    Write-Host "  -dic          Show dictionary entries"
    Write-Host "  -git          Show git commit history"
    Write-Host "  -files        Search for files"
    Write-Host "  -n <int>      Number of results (default: 10)"
    Write-Host "  -c <char>     Category (U|V|A|S|T|D|I|X=all)"
    Write-Host "  -f <string>   Filter/pattern"
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
    Write-Host "EXAMPLES:" -ForegroundColor White
    Write-Host "  plist -keys                      # Last 10 keys"
    Write-Host "  plist -keys -n 20                # Last 20 keys"
    Write-Host "  plist -dic -c V                  # All view shortcuts"
    Write-Host "  plist -dic -c V -f hcp           # Views matching 'hcp'"
    Write-Host "  plist -dic -c X                  # All dictionary entries"
    Write-Host "  plist -git -n 15                 # Last 15 commits"
    Write-Host "  plist -files -f hcpraz           # Fuzzy file search"
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
# MAIN EXECUTION
# ============================================================================

# Validate mutually exclusive commands
$commandCount = @($keys, $dic, $git, $files) | Where-Object { $_ } | Measure-Object | Select-Object -ExpandProperty Count

if ($commandCount -eq 0) {
    Write-Host ""
    Write-Host "Error: No command specified" -ForegroundColor Red
    Write-Host "Use: plist -keys | -dic | -git | -files" -ForegroundColor Gray
    Write-Host "Or:  plist -help" -ForegroundColor Gray
    Write-Host ""
    exit 1
}

if ($commandCount -gt 1) {
    Write-Host ""
    Write-Host "Error: Only one command allowed at a time" -ForegroundColor Red
    Write-Host "Use: plist -keys | -dic | -git | -files (not combined)" -ForegroundColor Gray
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
