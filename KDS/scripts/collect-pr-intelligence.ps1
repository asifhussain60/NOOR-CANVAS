# collect-pr-intelligence.ps1
# Purpose: Extract PR patterns from git history without external API calls
# Version: 1.0
# Dependencies: Git (local), PowerShell 5.1+
# Performance: <1 second for typical repositories

param(
    [switch]$Force,          # Force collection even if throttled
    [switch]$Verbose,        # Show detailed progress
    [switch]$DryRun,         # Show what would be collected without updating BRAIN
    [int]$LookbackDays = 30  # How far back to analyze
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"  # Faster git operations

# ============================================================================
# CONFIGURATION
# ============================================================================

$WorkspaceRoot = Split-Path -Parent $PSScriptRoot | Split-Path -Parent
$ConfigPath = Join-Path $WorkspaceRoot "KDS\config\team-intelligence.yaml"
$KnowledgeGraphPath = Join-Path $WorkspaceRoot "KDS\kds-brain\knowledge-graph.yaml"
$DevContextPath = Join-Path $WorkspaceRoot "KDS\kds-brain\development-context.yaml"
$SchemaPath = Join-Path $WorkspaceRoot "KDS\kds-brain\schemas\pr-intelligence-schema.yaml"

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

function Write-Progress-Custom {
    param([string]$Message)
    if ($Verbose) {
        Write-Host "  [$(Get-Date -Format 'HH:mm:ss')] $Message" -ForegroundColor Cyan
    }
}

function Read-YAML-Simple {
    param([string]$Path)
    # Simple YAML reader (key: value pairs)
    $content = Get-Content $Path -Raw
    $yaml = @{}
    $content -split "`n" | ForEach-Object {
        if ($_ -match '^\s*(\w+):\s*(.+)$') {
            $yaml[$matches[1]] = $matches[2].Trim()
        }
    }
    return $yaml
}

function Check-Throttle {
    param([string]$FilePath)
    
    if ($Force) { return $true }
    
    if (-not (Test-Path $FilePath)) { return $true }
    
    $content = Get-Content $FilePath -Raw
    if ($content -match 'last_collection:\s*"([^"]+)"') {
        $lastCollection = [DateTime]::Parse($matches[1])
        $hoursSince = (Get-Date) - $lastCollection
        
        if ($hoursSince.TotalHours -lt 1) {
            Write-Host "⏸️  Throttled: Last collection was $([Math]::Round($hoursSince.TotalMinutes)) minutes ago" -ForegroundColor Yellow
            Write-Host "   Use -Force to override throttling" -ForegroundColor Yellow
            return $false
        }
    }
    
    return $true
}

# ============================================================================
# TEAM DETECTION
# ============================================================================

function Detect-TeamEnvironment {
    Write-Progress-Custom "Detecting team environment..."
    
    Push-Location $WorkspaceRoot
    try {
        $authors = git log --since="$LookbackDays days ago" --format="%ae" | Sort-Object -Unique
        
        if ($authors.Count -le 1) {
            Write-Host "✅ Solo developer detected - PR intelligence not needed" -ForegroundColor Green
            return $false
        }
        
        Write-Host "✅ Team environment detected ($($authors.Count) developers)" -ForegroundColor Green
        return $true
    }
    finally {
        Pop-Location
    }
}

# ============================================================================
# PR DETECTION
# ============================================================================

function Get-MergedPRs {
    param([int]$Days)
    
    Write-Progress-Custom "Scanning git history for PR merge commits..."
    
    Push-Location $WorkspaceRoot
    try {
        # Patterns to match PR merge commits
        $patterns = @(
            "Merge pull request #",
            "Merged PR #",
            "Merge branch 'pr/",
            "Pull request #"
        )
        
        $grepPattern = ($patterns | ForEach-Object { [regex]::Escape($_) }) -join '|'
        
        # Get merge commits
        $mergeCommits = git log --since="$Days days ago" --grep="$grepPattern" --format="%H|%an|%ae|%s|%cd" --date=iso
        
        if (-not $mergeCommits) {
            Write-Host "ℹ️  No PR merge commits found in last $Days days" -ForegroundColor Yellow
            return @()
        }
        
        $prs = @()
        
        foreach ($commit in $mergeCommits) {
            $parts = $commit -split '\|'
            
            # Extract PR number from commit message
            if ($parts[3] -match '#(\d+)') {
                $prNumber = $matches[1]
                
                $pr = @{
                    number = $prNumber
                    commit_hash = $parts[0]
                    author = $parts[1]
                    author_email = $parts[2]
                    title = $parts[3]
                    merged_date = $parts[4]
                }
                
                $prs += $pr
            }
        }
        
        Write-Progress-Custom "Found $($prs.Count) merged PRs"
        return $prs
    }
    finally {
        Pop-Location
    }
}

function Get-PRDetails {
    param($PR)
    
    Push-Location $WorkspaceRoot
    try {
        $hash = $PR.commit_hash
        
        # Get files changed in PR
        $files = git diff-tree --no-commit-id --name-only -r $hash
        
        # Get commit count in PR (approximate - commits since previous merge)
        $commitCount = (git log --oneline "$hash^..$hash" 2>$null | Measure-Object).Count
        if ($commitCount -eq 0) { $commitCount = 1 }
        
        # Get lines changed
        $stats = git diff --shortstat "$hash^" $hash
        if ($stats -match '(\d+) files? changed') {
            $filesChanged = [int]$matches[1]
        } else {
            $filesChanged = $files.Count
        }
        
        $linesAdded = 0
        $linesDeleted = 0
        if ($stats -match '(\d+) insertions?') { $linesAdded = [int]$matches[1] }
        if ($stats -match '(\d+) deletions?') { $linesDeleted = [int]$matches[1] }
        
        # Categorize files
        $categories = @{}
        foreach ($file in $files) {
            $category = Categorize-File $file
            if (-not $categories.ContainsKey($category)) {
                $categories[$category] = 0
            }
            $categories[$category]++
        }
        
        return @{
            files = $files
            files_changed = $filesChanged
            lines_added = $linesAdded
            lines_deleted = $linesDeleted
            commits_in_pr = $commitCount
            categories = $categories.Keys
        }
    }
    finally {
        Pop-Location
    }
}

function Categorize-File {
    param([string]$FilePath)
    
    if ($FilePath -match '\.razor$|\.cshtml$|\.html$|\.css$|\.scss$') { return "UI" }
    if ($FilePath -match 'Services/|Controllers/|\.cs$') { return "Backend" }
    if ($FilePath -match 'Tests/|\.spec\.ts$|\.test\.js$|test-.*\.ps1$') { return "Tests" }
    if ($FilePath -match 'Docs/|\.md$|DocFX/') { return "Documentation" }
    if ($FilePath -match '\.json$|\.yaml$|\.yml$|appsettings') { return "Configuration" }
    if ($FilePath -match '^KDS/') { return "KDS" }
    
    return "Other"
}

# ============================================================================
# PATTERN ANALYSIS
# ============================================================================

function Analyze-FilePatterns {
    param($PRs)
    
    Write-Progress-Custom "Analyzing file patterns..."
    
    $fileStats = @{}
    
    foreach ($pr in $PRs) {
        foreach ($file in $pr.details.files) {
            if (-not $fileStats.ContainsKey($file)) {
                $fileStats[$file] = @{
                    pr_count = 0
                    total_commits = 0
                    review_iterations = @()
                }
            }
            
            $fileStats[$file].pr_count++
            $fileStats[$file].total_commits += $pr.details.commits_in_pr
            $fileStats[$file].review_iterations += $pr.details.commits_in_pr
        }
    }
    
    # Identify high rework files (avg >2 commits per PR)
    $highReworkFiles = @()
    foreach ($file in $fileStats.Keys) {
        $stats = $fileStats[$file]
        $avgIterations = $stats.total_commits / $stats.pr_count
        
        if ($avgIterations -ge 2.0 -and $stats.pr_count -ge 3) {
            $highReworkFiles += @{
                file = $file
                avg_review_iterations = [Math]::Round($avgIterations, 1)
                total_prs = $stats.pr_count
                rework_rate = [Math]::Round(($stats.review_iterations | Where-Object { $_ -gt 1 }).Count / $stats.pr_count, 2)
                recommendation = "⚠️ Extra scrutiny needed - frequently requires rework"
                confidence = [Math]::Min(0.95, 0.5 + ($stats.pr_count * 0.05))
                last_updated = (Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ")
            }
        }
    }
    
    Write-Progress-Custom "Found $($highReworkFiles.Count) high-rework files"
    return $highReworkFiles
}

function Analyze-CollaborationPatterns {
    param($PRs)
    
    Write-Progress-Custom "Analyzing collaboration patterns..."
    
    $filePairs = @{}
    
    foreach ($pr in $PRs) {
        $files = $pr.details.files
        
        # Check all file pairs in this PR
        for ($i = 0; $i -lt $files.Count; $i++) {
            for ($j = $i + 1; $j -lt $files.Count; $j++) {
                $pair = @($files[$i], $files[$j]) | Sort-Object
                $key = $pair -join "|"
                
                if (-not $filePairs.ContainsKey($key)) {
                    $filePairs[$key] = 0
                }
                $filePairs[$key]++
            }
        }
    }
    
    # Identify collaboration hotspots (co-modified in >60% of PRs)
    $hotspots = @()
    foreach ($key in $filePairs.Keys) {
        $count = $filePairs[$key]
        $rate = $count / $PRs.Count
        
        if ($rate -ge 0.6 -and $count -ge 3) {
            $files = $key -split '\|'
            $hotspots += @{
                files = $files
                co_modification_rate = [Math]::Round($rate, 2)
                total_prs = $count
                recommendation = "💡 These files are often changed together"
                confidence = [Math]::Min(0.95, 0.5 + ($count * 0.05))
                last_updated = (Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ")
            }
        }
    }
    
    Write-Progress-Custom "Found $($hotspots.Count) collaboration hotspots"
    return $hotspots
}

function Analyze-QualityIndicators {
    param($PRs)
    
    Write-Progress-Custom "Analyzing quality indicators..."
    
    $smallPRs = $PRs | Where-Object { $_.details.lines_added + $_.details.lines_deleted -lt 300 }
    $largePRs = $PRs | Where-Object { $_.details.lines_added + $_.details.lines_deleted -gt 800 }
    
    $indicators = @()
    
    # Small PR pattern
    if ($smallPRs.Count -ge 3) {
        $avgCommits = ($smallPRs | Measure-Object -Property { $_.details.commits_in_pr } -Average).Average
        $indicators += @{
            pattern = "small_pr_size"
            description = "PRs with <300 lines changed"
            total_prs = $smallPRs.Count
            avg_review_iterations = [Math]::Round($avgCommits, 1)
            recommendation = "✅ Smaller PRs review faster and merge cleaner"
            confidence = [Math]::Min(0.95, 0.5 + ($smallPRs.Count * 0.05))
            last_updated = (Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ")
        }
    }
    
    # Large PR pattern
    if ($largePRs.Count -ge 2) {
        $avgCommits = ($largePRs | Measure-Object -Property { $_.details.commits_in_pr } -Average).Average
        $indicators += @{
            pattern = "large_pr_size"
            description = "PRs with >800 lines changed"
            total_prs = $largePRs.Count
            avg_review_iterations = [Math]::Round($avgCommits, 1)
            recommendation = "⚠️ Large PRs have high rework rate - consider splitting"
            confidence = [Math]::Min(0.95, 0.5 + ($largePRs.Count * 0.05))
            last_updated = (Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ")
        }
    }
    
    return $indicators
}

# ============================================================================
# METRICS CALCULATION
# ============================================================================

function Calculate-PRMetrics {
    param($PRs)
    
    Write-Progress-Custom "Calculating PR metrics..."
    
    $metrics = @{
        last_collection = (Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ")
        prs_analyzed = $PRs.Count
        lookback_days = $LookbackDays
    }
    
    # Overall metrics
    $metrics.overall = @{
        total_prs_merged = $PRs.Count
        prs_per_week_avg = [Math]::Round($PRs.Count / ($LookbackDays / 7.0), 2)
    }
    
    # PR size metrics
    $avgFiles = ($PRs | Measure-Object -Property { $_.details.files_changed } -Average).Average
    $avgLinesAdded = ($PRs | Measure-Object -Property { $_.details.lines_added } -Average).Average
    $avgLinesDeleted = ($PRs | Measure-Object -Property { $_.details.lines_deleted } -Average).Average
    $avgCommits = ($PRs | Measure-Object -Property { $_.details.commits_in_pr } -Average).Average
    
    $metrics.pr_size = @{
        avg_files_changed = [Math]::Round($avgFiles, 1)
        avg_lines_added = [Math]::Round($avgLinesAdded, 0)
        avg_lines_deleted = [Math]::Round($avgLinesDeleted, 0)
        avg_commits_per_pr = [Math]::Round($avgCommits, 1)
    }
    
    # Review metrics
    $metrics.review = @{
        avg_review_iterations = [Math]::Round($avgCommits, 1)
        prs_with_rework = ($PRs | Where-Object { $_.details.commits_in_pr -gt 1 }).Count
    }
    $metrics.review.rework_rate = [Math]::Round($metrics.review.prs_with_rework / $PRs.Count, 2)
    
    # Category breakdown
    $categoryStats = @{}
    foreach ($pr in $PRs) {
        foreach ($category in $pr.details.categories) {
            if (-not $categoryStats.ContainsKey($category)) {
                $categoryStats[$category] = @{
                    count = 0
                    total_commits = 0
                }
            }
            $categoryStats[$category].count++
            $categoryStats[$category].total_commits += $pr.details.commits_in_pr
        }
    }
    
    $metrics.by_category = @()
    foreach ($category in $categoryStats.Keys) {
        $stats = $categoryStats[$category]
        $metrics.by_category += @{
            category = $category
            pr_count = $stats.count
            avg_review_iterations = [Math]::Round($stats.total_commits / $stats.count, 1)
        }
    }
    
    return $metrics
}

# ============================================================================
# BRAIN UPDATE
# ============================================================================

function Update-KnowledgeGraph {
    param($HighReworkFiles, $CollaborationHotspots, $QualityIndicators)
    
    Write-Progress-Custom "Updating knowledge graph..."
    
    if ($DryRun) {
        Write-Host "`n📊 DRY RUN - Would update knowledge-graph.yaml:" -ForegroundColor Yellow
        Write-Host "   High rework files: $($HighReworkFiles.Count)"
        Write-Host "   Collaboration hotspots: $($CollaborationHotspots.Count)"
        Write-Host "   Quality indicators: $($QualityIndicators.Count)"
        return
    }
    
    # For now, just append to a PR patterns section
    # In production, this would merge with existing knowledge-graph.yaml
    
    $prPatterns = @"

# ============================================================================
# PR PATTERNS (Auto-generated by collect-pr-intelligence.ps1)
# Last updated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
# ============================================================================

pr_patterns:
  high_rework_files:
$(($HighReworkFiles | ForEach-Object { "    - file: `"$($_.file)`"`n      avg_review_iterations: $($_.avg_review_iterations)`n      total_prs: $($_.total_prs)`n      confidence: $($_.confidence)" }) -join "`n`n")

  collaboration_hotspots:
$(($CollaborationHotspots | ForEach-Object { "    - files: [" + (($_.files | ForEach-Object { "`"$_`"" }) -join ", ") + "]`n      co_modification_rate: $($_.co_modification_rate)`n      confidence: $($_.confidence)" }) -join "`n`n")

  quality_indicators:
$(($QualityIndicators | ForEach-Object { "    - pattern: `"$($_.pattern)`"`n      total_prs: $($_.total_prs)`n      recommendation: `"$($_.recommendation)`"`n      confidence: $($_.confidence)" }) -join "`n`n")
"@
    
    $outputPath = Join-Path (Split-Path $KnowledgeGraphPath) "pr-patterns-$(Get-Date -Format 'yyyyMMdd-HHmmss').yaml"
    $prPatterns | Out-File $outputPath -Encoding UTF8
    
    Write-Host "✅ PR patterns saved to: $outputPath" -ForegroundColor Green
}

function Update-DevelopmentContext {
    param($Metrics)
    
    Write-Progress-Custom "Updating development context..."
    
    if ($DryRun) {
        Write-Host "`n📊 DRY RUN - Would update development-context.yaml:" -ForegroundColor Yellow
        Write-Host "   PRs analyzed: $($Metrics.prs_analyzed)"
        Write-Host "   Avg review iterations: $($Metrics.review.avg_review_iterations)"
        Write-Host "   Rework rate: $($Metrics.review.rework_rate)"
        return
    }
    
    $prMetrics = @"

# ============================================================================
# PR METRICS (Auto-generated by collect-pr-intelligence.ps1)
# Last updated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
# ============================================================================

pr_metrics:
  last_collection: "$($Metrics.last_collection)"
  prs_analyzed: $($Metrics.prs_analyzed)
  lookback_days: $($Metrics.lookback_days)
  
  overall:
    total_prs_merged: $($Metrics.overall.total_prs_merged)
    prs_per_week_avg: $($Metrics.overall.prs_per_week_avg)
  
  pr_size:
    avg_files_changed: $($Metrics.pr_size.avg_files_changed)
    avg_lines_added: $($Metrics.pr_size.avg_lines_added)
    avg_lines_deleted: $($Metrics.pr_size.avg_lines_deleted)
    avg_commits_per_pr: $($Metrics.pr_size.avg_commits_per_pr)
  
  review:
    avg_review_iterations: $($Metrics.review.avg_review_iterations)
    prs_with_rework: $($Metrics.review.prs_with_rework)
    rework_rate: $($Metrics.review.rework_rate)
  
  by_category:
$(($Metrics.by_category | ForEach-Object { "    - category: `"$($_.category)`"`n      pr_count: $($_.pr_count)`n      avg_review_iterations: $($_.avg_review_iterations)" }) -join "`n`n")
"@
    
    $outputPath = Join-Path (Split-Path $DevContextPath) "pr-metrics-$(Get-Date -Format 'yyyyMMdd-HHmmss').yaml"
    $prMetrics | Out-File $outputPath -Encoding UTF8
    
    Write-Host "✅ PR metrics saved to: $outputPath" -ForegroundColor Green
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================

Write-Host "`n🔍 KDS PR Intelligence Collection" -ForegroundColor Magenta
Write-Host "======================================`n" -ForegroundColor Magenta

$stopwatch = [System.Diagnostics.Stopwatch]::StartNew()

# Step 1: Check if team environment
$isTeam = Detect-TeamEnvironment
if (-not $isTeam) {
    Write-Host "✅ Solo developer mode - skipping PR collection" -ForegroundColor Green
    exit 0
}

# Step 2: Check throttle
if (-not (Check-Throttle $DevContextPath)) {
    exit 0
}

# Step 3: Detect PRs
$prs = Get-MergedPRs -Days $LookbackDays

if ($prs.Count -eq 0) {
    Write-Host "ℹ️  No PRs found - nothing to analyze" -ForegroundColor Yellow
    exit 0
}

# Step 4: Get PR details
Write-Progress-Custom "Analyzing $($prs.Count) PRs..."
foreach ($pr in $prs) {
    $pr.details = Get-PRDetails -PR $pr
}

# Step 5: Analyze patterns
$highReworkFiles = Analyze-FilePatterns -PRs $prs
$collaborationHotspots = Analyze-CollaborationPatterns -PRs $prs
$qualityIndicators = Analyze-QualityIndicators -PRs $prs

# Step 6: Calculate metrics
$metrics = Calculate-PRMetrics -PRs $prs

# Step 7: Update BRAIN
Update-KnowledgeGraph -HighReworkFiles $highReworkFiles -CollaborationHotspots $collaborationHotspots -QualityIndicators $qualityIndicators
Update-DevelopmentContext -Metrics $metrics

# Summary
$stopwatch.Stop()
Write-Host "`n✅ Collection complete in $($stopwatch.Elapsed.TotalSeconds.ToString('0.0'))s" -ForegroundColor Green
Write-Host "`n📊 Summary:" -ForegroundColor Cyan
Write-Host "   PRs analyzed: $($prs.Count)" -ForegroundColor White
Write-Host "   High rework files: $($highReworkFiles.Count)" -ForegroundColor White
Write-Host "   Collaboration hotspots: $($collaborationHotspots.Count)" -ForegroundColor White
Write-Host "   Quality indicators: $($qualityIndicators.Count)" -ForegroundColor White
Write-Host "   Avg review iterations: $($metrics.review.avg_review_iterations)" -ForegroundColor White
Write-Host "   Rework rate: $([Math]::Round($metrics.review.rework_rate * 100))%" -ForegroundColor White
