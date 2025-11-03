# KDS Monitoring Dashboard Generator
# Purpose: Generate HTML dashboard for development monitoring
# Usage: .\generate-monitoring-dashboard.ps1

param(
    [switch]$Open,
    [int]$RefreshSeconds = 30
)

$ErrorActionPreference = 'Stop'

# Paths
$scriptDir = $PSScriptRoot
$workspaceRoot = Split-Path (Split-Path $scriptDir -Parent) -Parent
$brainDir = Join-Path $workspaceRoot "KDS\kds-brain"
$reportsDir = Join-Path $workspaceRoot "KDS\reports\monitoring"
$outputPath = Join-Path $reportsDir "dashboard.html"

# Ensure reports directory exists
if (-not (Test-Path $reportsDir)) {
    New-Item -ItemType Directory -Path $reportsDir -Force | Out-Null
}

Write-Host "📊 Generating KDS Monitoring Dashboard..." -ForegroundColor Cyan

# Helper function to get file age
function Get-FileAge {
    param([string]$Path)
    if (Test-Path $Path) {
        $age = (Get-Date) - (Get-Item $Path).LastWriteTime
        if ($age.TotalMinutes -lt 1) {
            return "$([int]$age.TotalSeconds)s ago"
        } elseif ($age.TotalHours -lt 1) {
            return "$([int]$age.TotalMinutes)m ago"
        } elseif ($age.TotalDays -lt 1) {
            return "$([int]$age.TotalHours)h ago"
        } else {
            return "$([int]$age.TotalDays)d ago"
        }
    }
    return "N/A"
}

# Helper function to get status emoji
function Get-StatusEmoji {
    param([string]$Status)
    switch ($Status) {
        'HEALTHY' { return '✅' }
        'WARNING' { return '⚠️' }
        'CRITICAL' { return '❌' }
        default { return '❓' }
    }
}

# Collect data
Write-Host "  Collecting data..." -ForegroundColor Gray

# Conversation tracking data
$conversationHistoryPath = Join-Path $brainDir "conversation-history.jsonl"
$conversationContextPath = Join-Path $brainDir "conversation-context.jsonl"
$conversationActivePath = Join-Path $brainDir "conversation-active.json"

$totalConversations = 0
$activeConversation = $null
$recentConversations = @()
$contextMessages = 0

if (Test-Path $conversationHistoryPath) {
    $historyLines = Get-Content $conversationHistoryPath -ErrorAction SilentlyContinue
    $totalConversations = $historyLines.Count
    
    # Get last 5 conversations
    $recentConversations = $historyLines | Select-Object -Last 5 | ForEach-Object {
        $_ | ConvertFrom-Json
    } | Sort-Object started -Descending
}

if (Test-Path $conversationActivePath) {
    $activeConversation = Get-Content $conversationActivePath -Raw | ConvertFrom-Json
}

if (Test-Path $conversationContextPath) {
    $contextLines = Get-Content $conversationContextPath -ErrorAction SilentlyContinue
    $contextMessages = $contextLines.Count
}

# BRAIN health data
$knowledgeGraphPath = Join-Path $brainDir "knowledge-graph.yaml"
$devContextPath = Join-Path $brainDir "development-context.yaml"
$eventsPath = Join-Path $brainDir "events.jsonl"

$knowledgeEntries = 0
$devMetrics = @{
    commits_analyzed = 0
    velocity = "N/A"
    hotspots = @()
}
$pendingEvents = 0

if (Test-Path $knowledgeGraphPath) {
    $kgContent = Get-Content $knowledgeGraphPath -Raw
    # Quick count of entries (approximate)
    $knowledgeEntries = ([regex]::Matches($kgContent, "confidence:")).Count
}

if (Test-Path $devContextPath) {
    try {
        $devContextYaml = Get-Content $devContextPath -Raw
        # Parse key metrics (simple regex, not full YAML parser)
        if ($devContextYaml -match 'commits_analyzed:\s*(\d+)') {
            $devMetrics.commits_analyzed = [int]$Matches[1]
        }
        if ($devContextYaml -match 'lines_per_week:\s*(\d+\.?\d*)') {
            $devMetrics.velocity = "$($Matches[1]) lines/week"
        }
    } catch {
        Write-Host "  Warning: Could not parse development-context.yaml" -ForegroundColor Yellow
    }
}

if (Test-Path $eventsPath) {
    $eventLines = Get-Content $eventsPath -ErrorAction SilentlyContinue
    $pendingEvents = $eventLines.Count
}

# Integration health check
$routerPath = Join-Path $workspaceRoot "KDS\prompts\internal\intent-router.md"
$hasIntegration = $false
if (Test-Path $routerPath) {
    $routerContent = Get-Content $routerPath -Raw
    $hasIntegration = $routerContent -match 'conversation-stm\.ps1'
}

# Determine overall status
$status = 'HEALTHY'
$warnings = @()
$errors = @()

if (-not $hasIntegration) {
    $status = 'CRITICAL'
    $errors += "Intent router missing conversation-stm.ps1 integration"
}

if ($contextMessages -eq 0 -and $totalConversations -gt 0) {
    $status = if ($status -eq 'CRITICAL') { 'CRITICAL' } else { 'WARNING' }
    $warnings += "No messages in conversation context (might be normal if idle)"
}

if ($pendingEvents -gt 100) {
    $status = if ($status -eq 'CRITICAL') { 'CRITICAL' } else { 'WARNING' }
    $warnings += "Many pending events ($pendingEvents) - consider manual BRAIN update"
}

# Get last message time
$lastMessageTime = "Never"
if ($contextMessages -gt 0) {
    $lastMessage = Get-Content $conversationContextPath -ErrorAction SilentlyContinue | Select-Object -Last 1 | ConvertFrom-Json
    if ($lastMessage -and $lastMessage.timestamp) {
        $lastMsgDate = [DateTime]::Parse($lastMessage.timestamp)
        $age = (Get-Date) - $lastMsgDate
        if ($age.TotalMinutes -lt 1) {
            $lastMessageTime = "$([int]$age.TotalSeconds)s ago"
        } elseif ($age.TotalHours -lt 1) {
            $lastMessageTime = "$([int]$age.TotalMinutes)m ago"
        } elseif ($age.TotalDays -lt 1) {
            $lastMessageTime = "$([int]$age.TotalHours)h ago"
        } else {
            $lastMessageTime = "$([int]$age.TotalDays)d ago"
        }
    }
}

Write-Host "  Generating HTML..." -ForegroundColor Gray

# Generate HTML
$statusEmoji = Get-StatusEmoji -Status $status
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

$html = @"
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="refresh" content="$RefreshSeconds">
    <title>KDS Monitoring Dashboard</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #1e1e1e;
            color: #d4d4d4;
            padding: 20px;
            line-height: 1.6;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        
        header {
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #007acc;
        }
        
        h1 {
            font-size: 2em;
            margin-bottom: 10px;
            color: #4ec9b0;
        }
        
        .timestamp {
            color: #858585;
            font-size: 0.9em;
        }
        
        .refresh-notice {
            background: #2d2d30;
            padding: 10px 15px;
            border-radius: 4px;
            margin-bottom: 20px;
            border-left: 4px solid #007acc;
        }
        
        .status-badge {
            display: inline-block;
            padding: 5px 15px;
            border-radius: 4px;
            font-weight: bold;
            margin-bottom: 20px;
        }
        
        .status-healthy {
            background: #1a472a;
            color: #4ec9b0;
        }
        
        .status-warning {
            background: #4d3800;
            color: #ce9178;
        }
        
        .status-critical {
            background: #5a1d1d;
            color: #f48771;
        }
        
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .metric-card {
            background: #252526;
            padding: 20px;
            border-radius: 6px;
            border-left: 4px solid #007acc;
        }
        
        .metric-card h2 {
            font-size: 1.2em;
            margin-bottom: 15px;
            color: #4ec9b0;
        }
        
        .metric-item {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #3e3e42;
        }
        
        .metric-item:last-child {
            border-bottom: none;
        }
        
        .metric-label {
            color: #858585;
        }
        
        .metric-value {
            color: #d4d4d4;
            font-weight: 600;
        }
        
        .conversation-list {
            background: #252526;
            padding: 20px;
            border-radius: 6px;
            margin-bottom: 20px;
        }
        
        .conversation-item {
            background: #2d2d30;
            padding: 15px;
            margin-bottom: 10px;
            border-radius: 4px;
            border-left: 3px solid #007acc;
        }
        
        .conversation-item:last-child {
            margin-bottom: 0;
        }
        
        .conv-header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
        }
        
        .conv-id {
            font-family: 'Consolas', monospace;
            color: #4ec9b0;
            font-size: 0.9em;
        }
        
        .conv-status {
            font-size: 0.85em;
            padding: 2px 8px;
            border-radius: 3px;
        }
        
        .conv-active {
            background: #1a472a;
            color: #4ec9b0;
        }
        
        .conv-completed {
            background: #3e3e42;
            color: #858585;
        }
        
        .conv-title {
            margin-bottom: 5px;
            color: #d4d4d4;
        }
        
        .conv-meta {
            font-size: 0.85em;
            color: #858585;
        }
        
        .warnings-section {
            background: #4d3800;
            padding: 15px;
            border-radius: 6px;
            border-left: 4px solid #ce9178;
            margin-bottom: 20px;
        }
        
        .warnings-section h3 {
            color: #ce9178;
            margin-bottom: 10px;
        }
        
        .warnings-section ul {
            list-style-position: inside;
            color: #d4d4d4;
        }
        
        .errors-section {
            background: #5a1d1d;
            padding: 15px;
            border-radius: 6px;
            border-left: 4px solid #f48771;
            margin-bottom: 20px;
        }
        
        .errors-section h3 {
            color: #f48771;
            margin-bottom: 10px;
        }
        
        .errors-section ul {
            list-style-position: inside;
            color: #d4d4d4;
        }
        
        footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #3e3e42;
            text-align: center;
            color: #858585;
            font-size: 0.9em;
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>🧠 KDS Monitoring Dashboard</h1>
            <div class="timestamp">Last updated: $timestamp</div>
        </header>
        
        <div class="refresh-notice">
            Auto-refreshes every $RefreshSeconds seconds
        </div>
        
        <div class="status-badge status-$(($status).ToLower())">
            $statusEmoji System Status: $status
        </div>
"@

# Add errors if any
if ($errors.Count -gt 0) {
    $html += @"
        <div class="errors-section">
            <h3>❌ Errors</h3>
            <ul>
"@
    foreach ($error in $errors) {
        $html += "                <li>$error</li>`n"
    }
    $html += @"
            </ul>
        </div>
"@
}

# Add warnings if any
if ($warnings.Count -gt 0) {
    $html += @"
        <div class="warnings-section">
            <h3>⚠️ Warnings</h3>
            <ul>
"@
    foreach ($warning in $warnings) {
        $html += "                <li>$warning</li>`n"
    }
    $html += @"
            </ul>
        </div>
"@
}

$html += @"
        <div class="metrics-grid">
            <div class="metric-card">
                <h2>📝 Conversation Tracking</h2>
                <div class="metric-item">
                    <span class="metric-label">Active Conversation:</span>
                    <span class="metric-value">$(if ($activeConversation) { "Yes (" + $activeConversation.conversation_id + ")" } else { "No" })</span>
                </div>
                <div class="metric-item">
                    <span class="metric-label">Messages in Context:</span>
                    <span class="metric-value">$contextMessages</span>
                </div>
                <div class="metric-item">
                    <span class="metric-label">Total Conversations:</span>
                    <span class="metric-value">$totalConversations / 20</span>
                </div>
                <div class="metric-item">
                    <span class="metric-label">Last Message:</span>
                    <span class="metric-value">$lastMessageTime</span>
                </div>
            </div>
            
            <div class="metric-card">
                <h2>🧠 BRAIN Health</h2>
                <div class="metric-item">
                    <span class="metric-label">Knowledge Graph Entries:</span>
                    <span class="metric-value">~$knowledgeEntries</span>
                </div>
                <div class="metric-item">
                    <span class="metric-label">Commits Analyzed:</span>
                    <span class="metric-value">$($devMetrics.commits_analyzed)</span>
                </div>
                <div class="metric-item">
                    <span class="metric-label">Code Velocity:</span>
                    <span class="metric-value">$($devMetrics.velocity)</span>
                </div>
                <div class="metric-item">
                    <span class="metric-label">Pending Events:</span>
                    <span class="metric-value">$pendingEvents</span>
                </div>
            </div>
            
            <div class="metric-card">
                <h2>🔍 Integration Health</h2>
                <div class="metric-item">
                    <span class="metric-label">Router Integration:</span>
                    <span class="metric-value">$(if ($hasIntegration) { "✅ Active" } else { "❌ Missing" })</span>
                </div>
                <div class="metric-item">
                    <span class="metric-label">History File:</span>
                    <span class="metric-value">$(if (Test-Path $conversationHistoryPath) { "✅ Exists" } else { "❌ Missing" })</span>
                </div>
                <div class="metric-item">
                    <span class="metric-label">Context File:</span>
                    <span class="metric-value">$(if (Test-Path $conversationContextPath) { "✅ Exists" } else { "❌ Missing" })</span>
                </div>
                <div class="metric-item">
                    <span class="metric-label">Knowledge Graph:</span>
                    <span class="metric-value">$(if (Test-Path $knowledgeGraphPath) { "✅ Exists" } else { "❌ Missing" })</span>
                </div>
            </div>
        </div>
"@

# Add active conversation details if exists
if ($activeConversation) {
    $html += @"
        <div class="conversation-list">
            <h2>💬 Active Conversation</h2>
            <div class="conversation-item">
                <div class="conv-header">
                    <span class="conv-id">$($activeConversation.conversation_id)</span>
                    <span class="conv-status conv-active">ACTIVE</span>
                </div>
                <div class="conv-title">$($activeConversation.title)</div>
                <div class="conv-meta">
                    Messages: $($activeConversation.message_count) | 
                    Started: $($activeConversation.started)
                </div>
            </div>
        </div>
"@
}

# Add recent conversations
if ($recentConversations.Count -gt 0) {
    $html += @"
        <div class="conversation-list">
            <h2>📜 Recent Conversations (Last 5)</h2>
"@
    foreach ($conv in $recentConversations) {
        $convStatus = if ($conv.active) { "ACTIVE" } else { "COMPLETED" }
        $convClass = if ($conv.active) { "conv-active" } else { "conv-completed" }
        $duration = "N/A"
        if ($conv.started -and $conv.ended) {
            try {
                $start = [DateTime]::Parse($conv.started)
                $end = [DateTime]::Parse($conv.ended)
                $span = $end - $start
                if ($span.TotalMinutes -lt 1) {
                    $duration = "$([int]$span.TotalSeconds)s"
                } elseif ($span.TotalHours -lt 1) {
                    $duration = "$([int]$span.TotalMinutes)m"
                } else {
                    $duration = "$([int]$span.TotalHours)h $($span.Minutes)m"
                }
            } catch {}
        }
        
        $html += @"
            <div class="conversation-item">
                <div class="conv-header">
                    <span class="conv-id">$($conv.conversation_id)</span>
                    <span class="conv-status $convClass">$convStatus</span>
                </div>
                <div class="conv-title">$($conv.title)</div>
                <div class="conv-meta">
                    Messages: $($conv.message_count) | 
                    Duration: $duration | 
                    Outcome: $(if ($conv.outcome) { $conv.outcome } else { "in progress" })
                </div>
            </div>
"@
    }
    $html += @"
        </div>
"@
}

$html += @"
        <footer>
            <p>KDS Monitoring Dashboard | Development Edition</p>
            <p>Workspace: $workspaceRoot</p>
        </footer>
    </div>
</body>
</html>
"@

# Write HTML file
$html | Set-Content -Path $outputPath -Encoding UTF8

Write-Host "✅ Dashboard generated: $outputPath" -ForegroundColor Green

# Open in browser if requested
if ($Open) {
    Write-Host "🌐 Opening dashboard in browser..." -ForegroundColor Cyan
    Start-Process $outputPath
}

Write-Host ""
Write-Host "Dashboard URL: file:///$($outputPath.Replace('\', '/'))" -ForegroundColor Gray
Write-Host "Auto-refreshes every $RefreshSeconds seconds" -ForegroundColor Gray
