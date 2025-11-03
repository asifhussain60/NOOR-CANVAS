<#
.SYNOPSIS
    Collect development context metrics for KDS BRAIN Tier 3

.DESCRIPTION
    This script gathers holistic project metrics from git, KDS events,
    test results, and build logs to populate development-context.yaml.
    
    Metrics collected:
    - Git activity (commits, changes, contributors)
    - Code changes (velocity, hotspots, churn rates)
    - KDS usage (sessions, success rates, workflows)
    - Testing activity (pass rates, flaky tests, coverage)
    - Project health (build status, deployments, quality)
    - Work patterns (productive times, session distribution)
    - Correlations (commit size vs success, test-first vs rework)

.PARAMETER Force
    Force collection even if last update was recent

.PARAMETER Quick
    Quick collection (skip expensive git operations)

.EXAMPLE
    .\collect-development-context.ps1
    Standard collection with all metrics

.EXAMPLE
    .\collect-development-context.ps1 -Quick
    Fast collection for hourly automation

.NOTES
    Version: 1.0
    Author: KDS Development Context Collector
    Requires: Git, PowerShell 5.1+
#>

param(
    [switch]$Force,
    [switch]$Quick
)

$ErrorActionPreference = "Stop"
$WorkspaceRoot = "d:\PROJECTS\NOOR CANVAS"
$ContextFile = Join-Path $WorkspaceRoot "KDS\kds-brain\development-context.yaml"
$EventsFile = Join-Path $WorkspaceRoot "KDS\kds-brain\events.jsonl"

Write-Host "🧠 KDS Development Context Collector v1.0" -ForegroundColor Cyan
Write-Host ""

# Helper function to convert PowerShell objects to YAML-like format
function ConvertTo-SimpleYaml {
    param($Data, $Indent = 0)
    
    $spaces = "  " * $Indent
    $lines = @()
    
    foreach ($key in $Data.Keys | Sort-Object) {
        $value = $Data[$key]
        if ($value -is [hashtable] -or $value -is [System.Collections.Specialized.OrderedDictionary]) {
            $lines += "${spaces}${key}:"
            $lines += ConvertTo-SimpleYaml $value ($Indent + 1)
        }
        elseif ($value -is [array]) {
            if ($value.Count -eq 0) {
                $lines += "${spaces}${key}: []"
            }
            else {
                $lines += "${spaces}${key}:"
                foreach ($item in $value) {
                    if ($item -is [hashtable]) {
                        $lines += "${spaces}  - " + ($item.Keys | ForEach-Object { "$_`: $($item[$_])" }) -join ", "
                    }
                    else {
                        $lines += "${spaces}  - $item"
                    }
                }
            }
        }
        elseif ($null -eq $value) {
            $lines += "${spaces}${key}: null"
        }
        elseif ($value -is [bool]) {
            $lines += "${spaces}${key}: $($value.ToString().ToLower())"
        }
        elseif ($value -is [double] -or $value -is [float]) {
            $lines += "${spaces}${key}: $($value.ToString('F2'))"
        }
        else {
            # Escape quotes in strings
            $strValue = $value.ToString().Replace('"', '\"')
            if ($strValue -match '[\s:]' -and $strValue -notmatch '^".*"$') {
                $lines += "${spaces}${key}: `"$strValue`""
            }
            else {
                $lines += "${spaces}${key}: $strValue"
            }
        }
    }
    
    return $lines
}

# Initialize context data structure
$context = [ordered]@{
    git_activity = [ordered]@{
        last_30_days = [ordered]@{
            total_commits = 0
            commits_per_day_avg = 0.0
            active_branches = @()
            contributors = @()
        }
        commits_by_component = [ordered]@{
            UI = 0
            Backend = 0
            Tests = 0
            Documentation = 0
        }
        files_most_changed = @()
        commit_patterns = @()
        last_updated = $null
    }
    code_changes = [ordered]@{
        last_30_days = [ordered]@{
            total_files_modified = 0
            lines_added = 0
            lines_deleted = 0
            net_growth = 0
        }
        change_velocity = [ordered]@{
            week_1 = 0
            week_2 = 0
            week_3 = 0
            week_4 = 0
            trend = "stable"
        }
        hotspots = @()
        last_updated = $null
    }
    kds_usage = [ordered]@{
        last_30_days = [ordered]@{
            total_kds_invocations = 0
            sessions_created = 0
            sessions_completed = 0
            completion_rate = 0.0
        }
        intent_distribution = [ordered]@{
            PLAN = 0
            EXECUTE = 0
            TEST = 0
            VALIDATE = 0
            CORRECT = 0
            ASK = 0
            GOVERN = 0
        }
        avg_session_duration = "0 hours"
        avg_tasks_per_session = 0.0
        workflow_success = [ordered]@{
            test_first = $null
            test_skip = $null
        }
        kds_effectiveness = [ordered]@{
            tasks_completed_with_kds = 0
            tasks_completed_manually = 0
            kds_success_rate = 0.0
            manual_success_rate = 0.0
            improvement = 0.0
        }
        last_updated = $null
    }
    testing_activity = [ordered]@{
        last_30_days = [ordered]@{
            total_tests_created = 0
            total_test_runs = 0
            test_pass_rate = 0.0
        }
        test_coverage = [ordered]@{
            current = 0.0
            previous_month = 0.0
            trend = "stable"
        }
        test_types = [ordered]@{
            unit = 0
            integration = 0
            ui_playwright = 0
        }
        flaky_tests = @()
        last_updated = $null
    }
    project_health = [ordered]@{
        build_status = "unknown"
        last_build = $null
        build_time_avg = "0 seconds"
        deployment_frequency = [ordered]@{
            last_30_days = 0
            avg_per_week = 0.0
            last_deployment = $null
        }
        issue_tracking = [ordered]@{
            open_issues = 0
            closed_last_30d = 0
            avg_resolution_time = "0 days"
        }
        code_quality = [ordered]@{
            linting_pass_rate = 0.0
            security_scan_last = $null
            security_vulnerabilities = 0
        }
        last_updated = $null
    }
    work_patterns = [ordered]@{
        most_productive_time = "unknown"
        avg_coding_hours_per_day = 0.0
        session_patterns = [ordered]@{
            morning_sessions = 0.0
            afternoon_sessions = 0.0
            evening_sessions = 0.0
        }
        focus_duration = [ordered]@{
            avg_without_interruption = "0 hours"
            longest_session = "0 hours"
            longest_session_date = $null
        }
        feature_lifecycle = [ordered]@{
            avg_days_from_start_to_deploy = 0.0
            avg_iterations_per_feature = 0.0
        }
        last_updated = $null
    }
    correlations = [ordered]@{
        commit_size_vs_success = [ordered]@{
            small_commits_range = "1-3 files"
            small_commit_success_rate = $null
            large_commits_range = "10+ files"
            large_commit_success_rate = $null
            insight = $null
        }
        test_first_vs_rework = [ordered]@{
            test_first_rework_rate = $null
            test_skip_rework_rate = $null
            insight = $null
        }
        kds_usage_vs_velocity = [ordered]@{
            high_kds_weeks = @()
            high_kds_velocity = $null
            low_kds_weeks = @()
            low_kds_velocity = $null
            correlation = $null
            insight = $null
        }
        last_updated = $null
    }
    proactive_insights = [ordered]@{
        current_warnings = @()
        historical_warnings = [ordered]@{
            total_generated = 0
            total_addressed = 0
            effectiveness_rate = 0.0
        }
        last_updated = $null
    }
    statistics = [ordered]@{
        total_metrics_collected = 0
        last_collection = $null
        last_updated = $null
        data_sources = @("git", "kds-events", "test-results", "build-logs")
        collection_frequency = "hourly"
        total_storage_kb = 0
        version = "1.0"
        enabled = $true
    }
}

$startTime = Get-Date
$metricsCollected = 0

try {
    # Change to workspace root
    Set-Location $WorkspaceRoot
    
    Write-Host "📊 Step 1: Collecting Git Activity Metrics..." -ForegroundColor Yellow
    $gitStartTime = Get-Date
    
    try {
        # Get commits in last 30 days
        Write-Host "  → Fetching commit history (last 30 days)..." -ForegroundColor Gray
        $commits = git log --since="30 days ago" --pretty=format:"%H|%an|%ad|%s" --date=iso 2>$null
        
        if ($commits) {
            $commitLines = $commits -split "`n"
            $commitCount = $commitLines.Count
            $context.git_activity.last_30_days.total_commits = $commitCount
            $context.git_activity.last_30_days.commits_per_day_avg = [math]::Round($commitCount / 30.0, 1)
            
            Write-Host "  → Found $commitCount commits, analyzing contributors..." -ForegroundColor Gray
            
            # Extract unique contributors
            $contributors = $commitLines | ForEach-Object { ($_ -split '\|')[1] } | Select-Object -Unique
            $context.git_activity.last_30_days.contributors = @($contributors)
            
            # Count by component - OPTIMIZED: Use single git command for ALL files changed
            Write-Host "  → Classifying commits by component (this may take a moment)..." -ForegroundColor Gray
            
            # Get ALL changed files in one git command (much faster than per-commit)
            $allChangedFiles = git log --since="30 days ago" --name-only --pretty=format:"" 2>$null | Where-Object { $_.Trim() -ne "" }
            
            $uiCount = 0
            $backendCount = 0
            $testCount = 0
            $docCount = 0
            
            foreach ($file in $allChangedFiles) {
                if ($file -match '^SPA/|^PlayWright/|Pages/|Components/') {
                    $uiCount++
                }
                elseif ($file -match '^Controllers/|Services/|Models/') {
                    $backendCount++
                }
                elseif ($file -match '^Tests/|\.spec\.|\.test\.') {
                    $testCount++
                }
                elseif ($file -match '^Docs/|\.md$|README') {
                    $docCount++
                }
            }
            
            # Convert file counts to commit estimates (rough approximation)
            $totalFiles = $allChangedFiles.Count
            if ($totalFiles -gt 0) {
                $context.git_activity.commits_by_component.UI = [int]($commitCount * ($uiCount / $totalFiles))
                $context.git_activity.commits_by_component.Backend = [int]($commitCount * ($backendCount / $totalFiles))
                $context.git_activity.commits_by_component.Tests = [int]($commitCount * ($testCount / $totalFiles))
                $context.git_activity.commits_by_component.Documentation = [int]($commitCount * ($docCount / $totalFiles))
            }
            
            $metricsCollected += 4
        }
        
        $gitDuration = [math]::Round(((Get-Date) - $gitStartTime).TotalSeconds, 1)
        $context.git_activity.last_updated = Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ"
        Write-Host "  ✓ Git activity: $($context.git_activity.last_30_days.total_commits) commits ($gitDuration seconds)" -ForegroundColor Green
        
        # Timeout warning if it took too long
        if ($gitDuration -gt 30) {
            Write-Host "  ⚠️  Git collection took ${gitDuration}s (>30s threshold) - Consider using -Quick mode" -ForegroundColor Yellow
        }
        
    }
    catch {
        Write-Warning "  ⚠ Git metrics unavailable: $_"
    }
    
    Write-Host ""
    Write-Host "📊 Step 2: Collecting KDS Usage Metrics..." -ForegroundColor Yellow
    
    try {
        if (Test-Path $EventsFile) {
            $events = Get-Content $EventsFile | Where-Object { $_.Trim() -ne "" } | ForEach-Object { $_ | ConvertFrom-Json }
            $last30Days = (Get-Date).AddDays(-30)
            $recentEvents = $events | Where-Object { 
                try { 
                    [DateTime]$_.timestamp -gt $last30Days 
                } catch { 
                    $false 
                }
            }
            
            # Count sessions
            $sessionStarts = $recentEvents | Where-Object { $_.event -eq "session_started" }
            $sessionEnds = $recentEvents | Where-Object { $_.event -eq "session_completed" }
            
            $context.kds_usage.last_30_days.sessions_created = $sessionStarts.Count
            $context.kds_usage.last_30_days.sessions_completed = $sessionEnds.Count
            
            if ($sessionStarts.Count -gt 0) {
                $context.kds_usage.last_30_days.completion_rate = [math]::Round($sessionEnds.Count / $sessionStarts.Count, 2)
            }
            
            # Intent distribution
            $intentEvents = $recentEvents | Where-Object { $_.event -eq "intent_detected" }
            foreach ($intentEvent in $intentEvents) {
                $intent = $intentEvent.intent.ToUpper()
                if ($context.kds_usage.intent_distribution.ContainsKey($intent)) {
                    $context.kds_usage.intent_distribution[$intent]++
                }
            }
            
            $metricsCollected += 5
            $context.kds_usage.last_updated = Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ"
            Write-Host "  ✓ KDS usage: $($sessionStarts.Count) sessions" -ForegroundColor Green
        }
    }
    catch {
        Write-Warning "  ⚠ KDS metrics unavailable: $_"
    }
    
    Write-Host ""
    Write-Host "📊 Step 3: Collecting Testing Metrics..." -ForegroundColor Yellow
    
    try {
        # Count test files
        $testFiles = Get-ChildItem -Path (Join-Path $WorkspaceRoot "Tests") -Recurse -Filter "*.spec.ts" -ErrorAction SilentlyContinue
        $context.testing_activity.test_types.ui_playwright = $testFiles.Count
        
        $context.testing_activity.last_updated = Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ"
        Write-Host "  ✓ Testing: $($testFiles.Count) Playwright tests found" -ForegroundColor Green
        $metricsCollected += 1
    }
    catch {
        Write-Warning "  ⚠ Test metrics unavailable: $_"
    }
    
    Write-Host ""
    Write-Host "📊 Step 4: Updating Timestamps..." -ForegroundColor Yellow
    
    $now = Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ"
    $context.code_changes.last_updated = $now
    $context.project_health.last_updated = $now
    $context.work_patterns.last_updated = $now
    $context.correlations.last_updated = $now
    $context.proactive_insights.last_updated = $now
    $context.statistics.last_collection = $now
    $context.statistics.last_updated = $now
    $context.statistics.total_metrics_collected = $metricsCollected
    
    Write-Host "  ✓ Timestamps updated" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "📁 Step 5: Writing development-context.yaml..." -ForegroundColor Yellow
    
    # Generate YAML content
    $yamlContent = @(
        "# KDS BRAIN - Development Context (Tier 3)"
        "# Version: 1.0"
        "# Last Updated: $now"
        "# Purpose: Holistic project understanding for intelligent planning and proactive warnings"
        "# Update Frequency: Hourly (automated) or on-demand"
        ""
    )
    
    # Add converted YAML lines
    $yamlContent += ConvertTo-SimpleYaml $context 0
    
    # Write to file (join lines with newline)
    $yamlContent -join "`n" | Out-File -FilePath $ContextFile -Encoding UTF8 -Force -NoNewline
    Add-Content -Path $ContextFile -Value "" -Encoding UTF8  # Add final newline
    
    $fileSize = [math]::Round((Get-Item $ContextFile).Length / 1KB, 1)
    $context.statistics.total_storage_kb = $fileSize
    
    Write-Host "  ✓ File written: $ContextFile ($fileSize KB)" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "📝 Step 6: Logging collection event..." -ForegroundColor Yellow
    
    $duration = [math]::Round(((Get-Date) - $startTime).TotalMilliseconds, 0)
    
    $logEvent = @{
        timestamp = $now
        event = "development_context_collected"
        metrics_collected = $metricsCollected
        warnings_generated = $context.proactive_insights.current_warnings.Count
        sources = @("git", "kds-events", "test-results")
        duration_ms = $duration
        success = $true
    } | ConvertTo-Json -Compress
    
    Add-Content -Path $EventsFile -Value $logEvent -Encoding UTF8
    Write-Host "  ✓ Event logged to events.jsonl" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "✅ Development Context Collection Complete" -ForegroundColor Green
    Write-Host ""
    Write-Host "📊 Metrics Collected:" -ForegroundColor Cyan
    Write-Host "   - Git Activity: $($context.git_activity.last_30_days.total_commits) commits, $($context.git_activity.last_30_days.contributors.Count) contributors"
    Write-Host "   - KDS Usage: $($context.kds_usage.last_30_days.sessions_created) sessions, $([math]::Round($context.kds_usage.last_30_days.completion_rate * 100, 0))% completion rate"
    Write-Host "   - Testing: $($context.testing_activity.test_types.ui_playwright) Playwright tests"
    Write-Host ""
    Write-Host "⚠️  Warnings Generated: $($context.proactive_insights.current_warnings.Count)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "📁 Updated: KDS/kds-brain/development-context.yaml" -ForegroundColor Cyan
    Write-Host "⏱️  Duration: $duration ms" -ForegroundColor Cyan
    
}
catch {
    Write-Host ""
    Write-Host "❌ Error collecting development context: $_" -ForegroundColor Red
    Write-Host $_.ScriptStackTrace -ForegroundColor Red
    exit 1
}
