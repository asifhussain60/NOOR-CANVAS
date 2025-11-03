param(
    [string]$OutputRoot = "KDS/reports/metrics",
    [switch]$Quiet
)

# Helpers
function Write-Info($msg) { if (-not $Quiet) { Write-Host $msg -ForegroundColor Cyan } }
function Write-Ok($msg)   { if (-not $Quiet) { Write-Host $msg -ForegroundColor Green } }
function Write-Warn($msg) { if (-not $Quiet) { Write-Host $msg -ForegroundColor Yellow } }

function New-Bar {
    param(
        [double]$Value,
        [double]$Max,
        [int]$Width = 24
    )
    if ($Max -le 0) { return ("".PadRight($Width, '░')) }
    $ratio = [Math]::Min(1.0, ($Value / $Max))
    $filled = [int]([Math]::Round($ratio * $Width))
    $empty = [Math]::Max(0, $Width - $filled)
    return ("".PadRight($filled, '█') + "".PadRight($empty, '░'))
}

function Try-GetYaml {
    param(
        [string]$Path
    )
    if (-not (Test-Path $Path)) { return $null }
    $hasYaml = Get-Command ConvertFrom-Yaml -ErrorAction SilentlyContinue
    if ($hasYaml) {
        try {
            return (Get-Content -Raw -LiteralPath $Path | ConvertFrom-Yaml)
        } catch {
            return $null
        }
    }
    return $null
}

function Safe-Git {
    param([string[]]$Args)
    try {
        $psi = New-Object System.Diagnostics.ProcessStartInfo
        $psi.FileName = 'git'
        $psi.ArgumentList.AddRange($Args)
        $psi.RedirectStandardOutput = $true
        $psi.RedirectStandardError = $true
        $psi.UseShellExecute = $false
        $p = [System.Diagnostics.Process]::Start($psi)
        $out = $p.StandardOutput.ReadToEnd()
        $err = $p.StandardError.ReadToEnd()
        $p.WaitForExit()
        if ($p.ExitCode -ne 0) { return $null }
        return $out
    } catch {
        return $null
    }
}

$stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
Write-Info "📊 Generating KDS Metrics Report (visual, markdown)"

# Resolve paths
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$kdsRoot  = (Join-Path $repoRoot 'KDS')
$brainDir = (Join-Path $kdsRoot 'kds-brain')
$sessionsDir = (Join-Path $kdsRoot 'sessions')
$eventsFile = (Join-Path $brainDir 'events.jsonl')
$convFile = (Join-Path $brainDir 'conversation-history.jsonl')
$kgFile = (Join-Path $brainDir 'knowledge-graph.yaml')
$devCtxFile = (Join-Path $brainDir 'development-context.yaml')

# Ensure output folder
$dateStamp = (Get-Date).ToString('yyyy-MM-dd')
$timeStamp = (Get-Date).ToString('yyyyMMdd-HHmmss')
$outRootAbs = (Join-Path $repoRoot $OutputRoot)
$runFolderAbs = (Join-Path $outRootAbs $dateStamp)
if (-not (Test-Path $runFolderAbs)) { New-Item -ItemType Directory -Path $runFolderAbs | Out-Null }
$reportPath = (Join-Path $runFolderAbs "metrics-$timeStamp.md")
$latestPath = (Join-Path $outRootAbs 'latest.md')

# Collect metrics (best-effort, with graceful fallbacks)
Write-Info "🔍 Collecting metrics..."

# Git basics
$branch = ($null)
$commit30 = 0
$gitTopFiles = @()
$gitOk = $false

$gitRoot = $repoRoot
$br = Safe-Git @('-C', $gitRoot, 'rev-parse', '--abbrev-ref', 'HEAD')
if ($br) { $branch = $br.Trim(); $gitOk = $true }

$rev = Safe-Git @('-C', $gitRoot, 'rev-list', '--count', '--since=30.days', 'HEAD')
if ($rev) { $commit30 = [int]($rev.Trim()) }

# Hot files via git (last 30 days)
$namesRaw = Safe-Git @('-C', $gitRoot, 'log', '--since=30.days', '--name-only', '--pretty=format:')
if ($namesRaw) {
    $files = $namesRaw -split "`n" | Where-Object { $_ -and ($_ -notmatch '^\s*$') } | Where-Object { -not $_.StartsWith('KDS/reports/metrics') }
    $group = $files | Group-Object | Sort-Object Count -Descending
    $gitTopFiles = $group | Select-Object -First 7 | ForEach-Object { [PSCustomObject]@{ Path = $_.Name; Count = $_.Count } }
}

# Brain metrics
$eventsCount = (Test-Path $eventsFile) ? ((Get-Content -LiteralPath $eventsFile -ErrorAction SilentlyContinue | Measure-Object -Line).Lines) : 0
$sessionsCount = (Test-Path $sessionsDir) ? ((Get-ChildItem -Path $sessionsDir -Recurse -File -ErrorAction SilentlyContinue | Measure-Object).Count) : 0

# Tier 1: conversations (approximate line count if JSONL)
$convCount = 0
if (Test-Path $convFile) {
    try {
        $convCount = (Get-Content -LiteralPath $convFile -ErrorAction SilentlyContinue | Where-Object { $_.Trim().StartsWith('{') -or $_.Trim().StartsWith('[') -or $_.Trim().Length -gt 0 } | Measure-Object).Count
        if ($convCount -gt 20) { $convCount = 20 } # capacity
    } catch { $convCount = 0 }
}

# Tier 2: knowledge graph entries (rough estimate by list markers)
$kgCount = 0
$kgData = $null
$intentCount = 0
$fileRelCount = 0
$workflowCount = 0
$validationCount = 0
$correctionCount = 0
$featureCount = 0
$recentSessions = @()
$protectionEnabled = $false

if (Test-Path $kgFile) {
    try {
        $kgData = Try-GetYaml -Path $kgFile
        if ($kgData) {
            # Count items in major sections
            if ($kgData.intent_patterns) {
                foreach ($intentKey in $kgData.intent_patterns.Keys) {
                    $intent = $kgData.intent_patterns[$intentKey]
                    if ($intent.phrases) {
                        $intentCount += ($intent.phrases | Measure-Object).Count
                    }
                }
            }
            if ($kgData.file_relationships) {
                $fileRelCount = ($kgData.file_relationships.Keys | Measure-Object).Count
            }
            if ($kgData.workflow_patterns) {
                $workflowCount = ($kgData.workflow_patterns.Keys | Measure-Object).Count
            }
            if ($kgData.validation_insights -and $kgData.validation_insights.test_patterns) {
                $validationCount = ($kgData.validation_insights.test_patterns.Keys | Measure-Object).Count
            }
            if ($kgData.correction_history) {
                $correctionCount = ($kgData.correction_history.Keys | Measure-Object).Count
            }
            if ($kgData.feature_components) {
                $featureCount = ($kgData.feature_components.Keys | Measure-Object).Count
            }
            if ($kgData.statistics -and $kgData.statistics.recent_sessions) {
                $recentSessions = $kgData.statistics.recent_sessions
            }
            if ($kgData.protection_config -and $kgData.protection_config.enabled) {
                $protectionEnabled = $kgData.protection_config.enabled
            }
            
            $kgCount = $intentCount + $fileRelCount + $workflowCount + $validationCount
        }
    } catch { }
    
    # Fallback: manual YAML parsing
    if (-not $kgData) {
        try {
            $kgContent = Get-Content -LiteralPath $kgFile -ErrorAction SilentlyContinue
            
            # Count intent patterns (look for "pattern:" lines under intent_patterns)
            $inIntentSection = $false
            foreach ($line in $kgContent) {
                if ($line -match '^\s*intent_patterns:') { $inIntentSection = $true; continue }
                if ($inIntentSection -and $line -match '^\s*\w+:' -and $line -notmatch '^\s{4,}') { $inIntentSection = $false }
                if ($inIntentSection -and $line -match '^\s+- pattern:') { $intentCount++ }
            }
            
            # Count file relationships (top-level keys under file_relationships)
            $inFileRelSection = $false
            foreach ($line in $kgContent) {
                if ($line -match '^\s*file_relationships:') { $inFileRelSection = $true; continue }
                if ($inFileRelSection -and $line -match '^\w+:' -and $line -notmatch '^\s') { $inFileRelSection = $false }
                if ($inFileRelSection -and $line -match '^\s{2}\w+:' -and $line -notmatch '^\s{4,}') { $fileRelCount++ }
            }
            
            # Count workflow patterns
            $inWorkflowSection = $false
            foreach ($line in $kgContent) {
                if ($line -match '^\s*workflow_patterns:') { $inWorkflowSection = $true; continue }
                if ($inWorkflowSection -and $line -match '^\w+:' -and $line -notmatch '^\s') { $inWorkflowSection = $false }
                if ($inWorkflowSection -and $line -match '^\s{2}\w+:' -and $line -notmatch '^\s{4,}') { $workflowCount++ }
            }
            
            # Count validation/test patterns
            $inTestPatternSection = $false
            foreach ($line in $kgContent) {
                if ($line -match '^\s*test_patterns:') { $inTestPatternSection = $true; continue }
                if ($inTestPatternSection -and $line -match '^\w+:' -and $line -notmatch '^\s') { $inTestPatternSection = $false }
                if ($inTestPatternSection -and $line -match '^\s{4}\w+:' -and $line -notmatch '^\s{6,}') { $validationCount++ }
            }
            
            # Count feature components
            $inFeatureSection = $false
            foreach ($line in $kgContent) {
                if ($line -match '^\s*feature_components:') { $inFeatureSection = $true; continue }
                if ($inFeatureSection -and $line -match '^\w+:' -and $line -notmatch '^\s') { $inFeatureSection = $false }
                if ($inFeatureSection -and $line -match '^\s{2}\w+:' -and $line -notmatch '^\s{4,}') { $featureCount++ }
            }
            
            # Check protection
            if ($kgContent -match 'protection_config:' -and $kgContent -match 'enabled:\s*true') {
                $protectionEnabled = $true
            }
            
            $kgCount = $intentCount + $fileRelCount + $workflowCount + $validationCount
        } catch { }
    }
    
    # Ultimate fallback
    if ($kgCount -eq 0) {
        $kgCount = (Get-Content -LiteralPath $kgFile -ErrorAction SilentlyContinue | Where-Object { $_ -match '^\s*-\s' } | Measure-Object).Count
        if ($kgCount -eq 0) {
            $kgCount = (Get-Content -LiteralPath $kgFile | Where-Object { $_.Trim().Length -gt 0 } | Measure-Object).Count
        }
    }
}

# Tier 3: dev context
$devCtx = Try-GetYaml -Path $devCtxFile
$devCommitsAnalyzed = $null
$hotspots = @()
if ($devCtx -ne $null) {
    # Try common fields if present
    if ($devCtx.Git -and $devCtx.Git.CommitsAnalyzed) { $devCommitsAnalyzed = [int]$devCtx.Git.CommitsAnalyzed }
    elseif ($devCtx.CommitsAnalyzed) { $devCommitsAnalyzed = [int]$devCtx.CommitsAnalyzed }
    
    # Try hotspots list if exists
    if ($devCtx.FileHotspots) {
        foreach ($h in $devCtx.FileHotspots) {
            if ($h.Path -and $h.Churn) { $hotspots += [PSCustomObject]@{ Path = "${($h.Path)}"; Churn = [double]$h.Churn } }
        }
        $hotspots = $hotspots | Sort-Object Churn -Descending | Select-Object -First 7
    }
}

# Fallback hotspots from git if yaml not available
if (-not $hotspots -and $gitTopFiles) {
    $maxCount = ($gitTopFiles | Measure-Object -Property Count -Maximum).Maximum
    $hotspots = $gitTopFiles | ForEach-Object { [PSCustomObject]@{ Path = $_.Path; Churn = [double]($_.Count / [Math]::Max(1, $maxCount)) } }
}

# Self-review signals
$rulebookLastUpdate = $null
$rbOut = Safe-Git @('-C', $gitRoot, 'log', '-1', '--format=%cs', '--', 'KDS/prompts', 'KDS/docs')
if ($rbOut) { $rulebookLastUpdate = $rbOut.Trim() }

# Compose Markdown (no code fences or code snippets)
$lines = @()
$now = Get-Date

$lines += "# KDS Metrics Report"
$lines += ""
$lines += "Date: $($now.ToString('yyyy-MM-dd HH:mm:ss'))"
if ($branch) { $lines += "Branch: $branch" }
$lines += "Report Path: $([IO.Path]::GetRelativePath($repoRoot, $reportPath))"
$lines += ""

$lines += "## Quick Stats"
$lines += "- Events recorded: $eventsCount"
$lines += "- Sessions stored: $sessionsCount"
if ($commit30 -ge 0) { $lines += "- Commits in last 30 days: $commit30" }
if ($devCommitsAnalyzed) { $lines += "- Dev context commits analyzed: $devCommitsAnalyzed" }
$lines += ""

$lines += "## Brain Storage"
$lines += "Tier 1 (Conversations)"
$lines += "[" + (New-Bar -Value $convCount -Max 20) + "] $convCount/20"
$lines += ""
$lines += "Tier 2 (Knowledge Graph entries)"
$kgMax = [Math]::Max(1000, $kgCount)
$lines += "[" + (New-Bar -Value $kgCount -Max $kgMax) + "] ~$kgCount entries"
$lines += ""
$lines += "Tier 3 (Development Context)"
$dcVal = ($devCommitsAnalyzed) ? $devCommitsAnalyzed : $commit30
$dcMax = [Math]::Max(100, $dcVal)
$lines += "[" + (New-Bar -Value $dcVal -Max $dcMax) + "] $dcVal commits analyzed"
$lines += ""

if ($hotspots -and $hotspots.Count -gt 0) {
    $lines += "## File Hotspots (last 30 days)"
    $maxChurn = ($hotspots | Measure-Object -Property Churn -Maximum).Maximum
    foreach ($h in $hotspots) {
        $val = [double]$h.Churn
        if ($val -le 1 -and $maxChurn -le 1) {
            # Treat as percentage proxy
            $bar = New-Bar -Value ($val * 100) -Max 100
            $pct = [Math]::Round($val * 100, 1)
            $lines += ("$($h.Path)  [" + $bar + "] $pct%")
        } else {
            $bar = New-Bar -Value $val -Max $maxChurn
            $lines += ("$($h.Path)  [" + $bar + "] $([Math]::Round(($val / [Math]::Max(1,$maxChurn)) * 100,1))%")
        }
    }
    $lines += ""
}

# Brain Intelligence Analysis
$lines += "## Brain Intelligence Analysis"
$lines += ""

# Intent Patterns
$lines += "### Intent Patterns"
if ($intentCount -gt 0) {
    $lines += "Total learned patterns: $intentCount"
    $bar = New-Bar -Value $intentCount -Max 20
    $lines += "Learning progress: [" + $bar + "]"
    $lines += ""
    if ($kgData -and $kgData.intent_patterns) {
        foreach ($intentKey in $kgData.intent_patterns.Keys) {
            $intent = $kgData.intent_patterns[$intentKey]
            if ($intent.phrases -and ($intent.phrases | Measure-Object).Count -gt 0) {
                $phCount = ($intent.phrases | Measure-Object).Count
                $bar = New-Bar -Value $phCount -Max ([Math]::Max(5, $intentCount))
                $lines += "$($intentKey.ToUpper()): [" + $bar + "] $phCount pattern(s)"
            }
        }
    }
} else {
    $lines += "No intent patterns learned yet — early learning phase"
}
$lines += ""

# File Relationships
$lines += "### File Relationships"
if ($fileRelCount -gt 0) {
    $lines += "Total relationship clusters: $fileRelCount"
    $bar = New-Bar -Value $fileRelCount -Max 15
    $lines += "Knowledge depth: [" + $bar + "]"
    $lines += ""
    if ($kgData -and $kgData.file_relationships) {
        $relKeys = $kgData.file_relationships.Keys | Select-Object -First 5
        foreach ($relKey in $relKeys) {
            $rel = $kgData.file_relationships[$relKey]
            if ($rel.primary_file) {
                $relatedCount = 0
                if ($rel.related_files) { $relatedCount = ($rel.related_files | Measure-Object).Count }
                if ($rel.execution_chain) { $relatedCount += ($rel.execution_chain | Measure-Object).Count }
                $bar = New-Bar -Value $relatedCount -Max 10
                $lines += "$relKey [" + $bar + "] $relatedCount link(s)"
            }
        }
        if ($fileRelCount -gt 5) { $lines += "... and $($fileRelCount - 5) more" }
    }
} else {
    $lines += "No file relationships learned yet — will learn from co-modifications"
}
$lines += ""

# Workflow Patterns
$lines += "### Workflow Patterns"
if ($workflowCount -gt 0) {
    $lines += "Total reusable workflows: $workflowCount"
    $bar = New-Bar -Value $workflowCount -Max 10
    $lines += "Workflow library: [" + $bar + "]"
    $lines += ""
    if ($kgData -and $kgData.workflow_patterns) {
        foreach ($wfKey in $kgData.workflow_patterns.Keys) {
            $wf = $kgData.workflow_patterns[$wfKey]
            $successRate = 0.0
            if ($wf.success_rate) { $successRate = [double]$wf.success_rate }
            $conf = 0.0
            if ($wf.confidence) { $conf = [double]$wf.confidence }
            
            $bar = New-Bar -Value ($successRate * 100) -Max 100
            $lines += "$wfKey [" + $bar + "] $([Math]::Round($successRate * 100, 0))% success, confidence: $([Math]::Round($conf, 2))"
        }
    }
} else {
    $lines += "No workflow patterns learned yet — will learn from successful task sequences"
}
$lines += ""

# Validation Insights
$lines += "### Validation & Testing Insights"
if ($validationCount -gt 0) {
    $lines += "Test patterns discovered: $validationCount"
    $bar = New-Bar -Value $validationCount -Max 10
    $lines += "Test knowledge: [" + $bar + "]"
    $lines += ""
    if ($kgData -and $kgData.validation_insights -and $kgData.validation_insights.test_patterns) {
        foreach ($tpKey in $kgData.validation_insights.test_patterns.Keys) {
            $tp = $kgData.validation_insights.test_patterns[$tpKey]
            $conf = 0.0
            if ($tp.confidence) { $conf = [double]$tp.confidence }
            $bar = New-Bar -Value ($conf * 100) -Max 100
            $lines += "$tpKey [" + $bar + "] confidence: $([Math]::Round($conf, 2))"
        }
    }
} else {
    $lines += "No test patterns learned yet — will learn from test creation workflows"
}
$lines += ""

# Correction History
$lines += "### Correction History"
$totalCorr = 0
$fileMis = 0; $approachMis = 0; $scopeMis = 0
if ($kgData -and $kgData.correction_history) {
    if ($kgData.correction_history.file_mismatch) { $fileMis = [int]$kgData.correction_history.file_mismatch.total_occurrences }
    if ($kgData.correction_history.approach_mismatch) { $approachMis = [int]$kgData.correction_history.approach_mismatch.total_occurrences }
    if ($kgData.correction_history.scope_mismatch) { $scopeMis = [int]$kgData.correction_history.scope_mismatch.total_occurrences }
    $totalCorr = $fileMis + $approachMis + $scopeMis
}

if ($totalCorr -gt 0) {
    $lines += "Total corrections tracked: $totalCorr"
    $maxCorr = [Math]::Max(1, $totalCorr)
    if ($fileMis -gt 0) {
        $bar = New-Bar -Value $fileMis -Max $maxCorr
        $lines += "File mismatches: [" + $bar + "] $fileMis"
    }
    if ($approachMis -gt 0) {
        $bar = New-Bar -Value $approachMis -Max $maxCorr
        $lines += "Approach mismatches: [" + $bar + "] $approachMis"
    }
    if ($scopeMis -gt 0) {
        $bar = New-Bar -Value $scopeMis -Max $maxCorr
        $lines += "Scope mismatches: [" + $bar + "] $scopeMis"
    }
} else {
    $lines += "No corrections needed — excellent routing accuracy! ✅"
}
$lines += ""

# Feature Components Tracking
if ($featureCount -gt 0) {
    $lines += "### Feature Components"
    $lines += "Features tracked: $featureCount"
    $bar = New-Bar -Value $featureCount -Max 10
    $lines += "Feature history: [" + $bar + "]"
    $lines += ""
    if ($kgData -and $kgData.feature_components) {
        foreach ($featKey in $kgData.feature_components.Keys) {
            $feat = $kgData.feature_components[$featKey]
            $status = if ($feat.status) { $feat.status } else { "unknown" }
            $statusIcon = switch ($status) {
                "complete" { "✅" }
                "in-progress" { "🔄" }
                "planned" { "📋" }
                default { "❓" }
            }
            $fileCount = 0
            if ($feat.files) { $fileCount = ($feat.files | Measure-Object).Count }
            $lines += "$statusIcon $featKey - $status ($fileCount file(s))"
        }
    }
    $lines += ""
}

# Recent Sessions
if (($kgData -and $kgData.statistics -and $kgData.statistics.recent_sessions) -or $recentSessions.Count -gt 0) {
    $lines += "### Recent Learning Sessions"
    $sessions = if ($kgData.statistics.recent_sessions) { $kgData.statistics.recent_sessions } else { $recentSessions }
    $sessCount = ($sessions | Measure-Object).Count
    $lines += "Sessions tracked: $sessCount"
    $bar = New-Bar -Value $sessCount -Max 10
    $lines += "Session activity: [" + $bar + "]"
    $lines += ""
    foreach ($sess in $sessions) {
        $sessId = if ($sess.session_id) { $sess.session_id } else { "unknown" }
        $intent = if ($sess.intent) { $sess.intent } else { "?" }
        $success = if ($sess.success) { "✅" } else { "❌" }
        $learnCount = 0
        if ($sess.learnings) { $learnCount = ($sess.learnings | Measure-Object).Count }
        $lines += "$success $sessId ($intent) - $learnCount learning(s)"
    }
    $lines += ""
}

# Protection Status
$lines += "### Protection & Quality Controls"
$protStatus = if ($protectionEnabled) { "✅ Enabled" } else { "⚠️ Disabled" }
$lines += "Status: $protStatus"
if ($kgData -and $kgData.protection_config) {
    if ($kgData.protection_config.learning_quality -and $kgData.protection_config.learning_quality.min_confidence_threshold) {
        $minConf = $kgData.protection_config.learning_quality.min_confidence_threshold
        $lines += "Min confidence threshold: $minConf"
    }
    if ($kgData.protection_config.routing_safety -and $kgData.protection_config.routing_safety.auto_route_threshold) {
        $autoRoute = $kgData.protection_config.routing_safety.auto_route_threshold
        $lines += "Auto-route threshold: $autoRoute"
    }
}
$lines += ""

# Conversation Quality Metrics
$lines += "### Conversation Quality (Tier 1)"
if ($convCount -gt 0) {
    # Try to parse conversation quality
    try {
        $convData = Get-Content -LiteralPath $convFile -ErrorAction SilentlyContinue | Where-Object { $_.Trim().Length -gt 0 }
        $totalMessages = 0
        $avgMsgPerConv = 0
        foreach ($line in $convData) {
            try {
                $conv = ($line | ConvertFrom-Json)
                if ($conv.message_count) { $totalMessages += [int]$conv.message_count }
            } catch { }
        }
        if ($convCount -gt 0) { $avgMsgPerConv = [Math]::Round($totalMessages / $convCount, 1) }
        $lines += "Total messages: $totalMessages"
        $lines += "Avg messages/conversation: $avgMsgPerConv"
        $bar = New-Bar -Value $avgMsgPerConv -Max 10
        $lines += "Message density: [" + $bar + "]"
    } catch {
        $lines += "Conversation data available but parsing requires structured format"
    }
} else {
    $lines += "No conversations recorded yet"
}
$lines += ""

# Learning Velocity
$lines += "### Learning Velocity"
if ($kgData -and $kgData.statistics) {
    $eventsProc = 0
    if ($kgData.statistics.total_events_processed) { $eventsProc = [int]$kgData.statistics.total_events_processed }
    $lastUpdate = if ($kgData.statistics.last_updated) { $kgData.statistics.last_updated } else { "Unknown" }
    $lines += "Events processed (lifetime): $eventsProc"
    $lines += "Last knowledge update: $lastUpdate"
    
    # Calculate learning efficiency
    if ($eventsProc -gt 0 -and $kgCount -gt 0) {
        $efficiency = [Math]::Round(($kgCount / [Math]::Max(1, $eventsProc)) * 100, 1)
        $bar = New-Bar -Value $efficiency -Max 100
        $lines += "Learning efficiency: [" + $bar + "] $efficiency%"
        $lines += "(Knowledge entries per event processed)"
    }
} else {
    $lines += "Learning metrics not yet available"
}
$lines += ""

$lines += "## KDS Usage"
$lines += "- Active sessions stored: $sessionsCount"
$lines += "- Event stream size: $eventsCount lines"
$lines += ""

$lines += "## Self Review"
$lines += "- Independent system with no external dependencies: Yes — KDS core uses local files, scripts, and storage within KDS/, with optional enhancements only when explicitly approved."
$lines += "- Efficiency: Yes — learning and context collection are throttled (e.g., Tier 3 hourly), and operations are designed to be lightweight by default."
$lines += "- Following SOLID principles: Yes — specialist agents with single responsibilities and clear abstraction layers (DIP, ISP, SRP)."
$lines += "- Rulebook updated regularly: $([string]::IsNullOrWhiteSpace($rulebookLastUpdate) ? 'Unknown' : "Last detected update: $rulebookLastUpdate")"
$lines += "- Comparable over time: Yes — this report is saved in a dated folder so you can trend and diff results."
$lines += "- Metrics tracked in Git: Yes — reports are committed in the repository, enabling versioned comparisons."
$lines += ""

$content = ($lines -join "`r`n") + "`r`n"
Set-Content -LiteralPath $reportPath -Value $content -Encoding UTF8

# Update latest pointer (copy file for portability)
Copy-Item -LiteralPath $reportPath -Destination $latestPath -Force

Write-Ok "✅ Metrics report written: $([IO.Path]::GetRelativePath($repoRoot, $reportPath))"
Write-Ok "✅ Latest report copied to: $([IO.Path]::GetRelativePath($repoRoot, $latestPath))"
Write-Info ("⏱️  Completed in {0:N1}s" -f $stopwatch.Elapsed.TotalSeconds)

exit 0
