# KDS Comprehensive Health Check Script
# Purpose: Execute all KDS system health checks and return structured results
# Usage: .\run-health-checks.ps1 [-Category <name>] [-OutputFormat json|text]

[CmdletBinding()]
param(
    [Parameter(Mandatory=$false)]
    [ValidateSet('all', 'infrastructure', 'agents', 'brain', 'sessions', 'knowledge', 'scripts', 'performance')]
    [string]$Category = 'all',
    
    [Parameter(Mandatory=$false)]
    [ValidateSet('json', 'text')]
    [string]$OutputFormat = 'json',
    
    [Parameter(Mandatory=$false)]
    [switch]$VerboseOutput
)

$ErrorActionPreference = 'Continue'
$workspaceRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent

# Result structure
$results = @{
    timestamp = Get-Date -Format "yyyy-MM-ddTHH:mm:ss"
    overallStatus = 'HEALTHY'
    categories = @()
    stats = @{
        totalChecks = 0
        passed = 0
        warnings = 0
        critical = 0
    }
    recommendations = @()
}

# ==========================================
# Helper Functions
# ==========================================

function Test-FileExists {
    param([string]$Path, [string]$Description)
    
    if (Test-Path $Path) {
        return @{ status = 'passed'; message = "$Description exists" }
    } else {
        return @{ status = 'critical'; message = "$Description not found at: $Path" }
    }
}

function Test-JsonFile {
    param([string]$Path, [string]$Description)
    
    if (-not (Test-Path $Path)) {
        return @{ status = 'critical'; message = "$Description not found" }
    }
    
    try {
        $content = Get-Content $Path -Raw | ConvertFrom-Json
        return @{ status = 'passed'; message = "$Description is valid JSON" }
    } catch {
        return @{ status = 'critical'; message = "$Description is invalid JSON: $($_.Exception.Message)" }
    }
}

function Test-YamlFile {
    param([string]$Path, [string]$Description)
    
    if (-not (Test-Path $Path)) {
        return @{ status = 'critical'; message = "$Description not found" }
    }
    
    try {
        $content = Get-Content $Path -Raw
        # Basic YAML validation (check for valid structure)
        if ($content -match '^\s*#' -or $content -match '^\s*\w+:') {
            $lines = $content -split "`n"
            if ($lines.Count -gt 0) {
                return @{ status = 'passed'; message = "$Description appears valid" }
            }
        }
        return @{ status = 'warning'; message = "$Description may have formatting issues" }
    } catch {
        return @{ status = 'critical'; message = "$Description validation error: $($_.Exception.Message)" }
    }
}

function Add-Check {
    param(
        [string]$CategoryName,
        [string]$CheckName,
        [hashtable]$Result
    )
    
    $results.stats.totalChecks++
    
    switch ($Result.status) {
        'passed' { $results.stats.passed++ }
        'warning' { 
            $results.stats.warnings++
            if ($results.overallStatus -eq 'HEALTHY') {
                $results.overallStatus = 'DEGRADED'
            }
        }
        'critical' { 
            $results.stats.critical++
            $results.overallStatus = 'CRITICAL'
        }
    }
    
    return @{
        name = $CheckName
        status = $Result.status
        message = $Result.message
        timestamp = Get-Date -Format "yyyy-MM-ddTHH:mm:ss"
    }
}

# ==========================================
# 1. Infrastructure Checks
# ==========================================

function Test-Infrastructure {
    if ($VerboseOutput) { Write-Host "  Checking Infrastructure..." -ForegroundColor Cyan }
    
    $checks = @()
    
    # 1.1 Directory Structure
    $kdsDir = Join-Path $workspaceRoot "KDS"
    $requiredDirs = @('prompts', 'scripts', 'kds-brain', 'sessions', 'knowledge', 'governance')
    $allExist = $true
    foreach ($dir in $requiredDirs) {
        if (-not (Test-Path (Join-Path $kdsDir $dir))) {
            $allExist = $false
            break
        }
    }
    $result = if ($allExist) {
        @{ status = 'passed'; message = "All required directories exist" }
    } else {
        @{ status = 'critical'; message = "Missing required directories" }
    }
    $checks += Add-Check -CategoryName 'Infrastructure' -CheckName 'Directory Structure' -Result $result
    
    # 1.2 Core Files Present
    $coreFiles = @(
        'KDS/README.md',
        'KDS/KDS-DESIGN.md',
        'KDS/kds-dashboard.html'
    )
    $missingFiles = @()
    foreach ($file in $coreFiles) {
        $path = Join-Path $workspaceRoot $file
        if (-not (Test-Path $path)) {
            $missingFiles += $file
        }
    }
    $result = if ($missingFiles.Count -eq 0) {
        @{ status = 'passed'; message = "All core files present" }
    } else {
        @{ status = 'warning'; message = "Missing files: $($missingFiles -join ', ')" }
    }
    $checks += Add-Check -CategoryName 'Infrastructure' -CheckName 'Core Files Present' -Result $result
    
    # 1.3 Config Validation
    $configPath = Join-Path $workspaceRoot "KDS\kds.config.json"
    $result = if (Test-Path $configPath) {
        Test-JsonFile -Path $configPath -Description "kds.config.json"
    } else {
        @{ status = 'warning'; message = "kds.config.json not found (optional)" }
    }
    $checks += Add-Check -CategoryName 'Infrastructure' -CheckName 'Config Validation' -Result $result
    
    # 1.4 Permissions Check
    $testFile = Join-Path $kdsDir "test-write-$(Get-Date -Format 'yyyyMMddHHmmss').tmp"
    try {
        "test" | Out-File $testFile -ErrorAction Stop
        Remove-Item $testFile -ErrorAction SilentlyContinue
        $result = @{ status = 'passed'; message = "Read/Write permissions OK" }
    } catch {
        $result = @{ status = 'critical'; message = "Insufficient permissions: $($_.Exception.Message)" }
    }
    $checks += Add-Check -CategoryName 'Infrastructure' -CheckName 'Permissions Check' -Result $result
    
    # 1.5 Git Integration
    try {
        $gitStatus = git -C $workspaceRoot status --porcelain 2>&1
        if ($LASTEXITCODE -eq 0) {
            $fileCount = ($gitStatus | Measure-Object).Count
            $result = @{ status = 'passed'; message = "Git repository active ($fileCount changed files)" }
        } else {
            $result = @{ status = 'warning'; message = "Not a git repository or git not available" }
        }
    } catch {
        $result = @{ status = 'warning'; message = "Git check failed: $($_.Exception.Message)" }
    }
    $checks += Add-Check -CategoryName 'Infrastructure' -CheckName 'Git Integration' -Result $result
    
    # 1.6 PowerShell Version
    $psVersion = $PSVersionTable.PSVersion
    $result = if ($psVersion.Major -ge 7) {
        @{ status = 'passed'; message = "PowerShell $($psVersion.Major).$($psVersion.Minor) detected" }
    } elseif ($psVersion.Major -ge 5) {
        @{ status = 'warning'; message = "PowerShell $($psVersion.Major).$($psVersion.Minor) (recommend 7+)" }
    } else {
        @{ status = 'critical'; message = "PowerShell $($psVersion.Major).$($psVersion.Minor) too old (need 5+)" }
    }
    $checks += Add-Check -CategoryName 'Infrastructure' -CheckName 'PowerShell Version' -Result $result
    
    return @{
        id = 'infrastructure'
        name = 'Infrastructure'
        icon = '🏗️'
        checks = $checks
    }
}

# ==========================================
# 2. Agents & Prompts Checks
# ==========================================

function Test-AgentsPrompts {
    if ($VerboseOutput) { Write-Host "  Checking Agents & Prompts..." -ForegroundColor Cyan }
    
    $checks = @()
    $promptsDir = Join-Path $workspaceRoot "KDS\prompts\internal"
    
    $agents = @(
        @{ file = 'intent-router.md'; name = 'Intent Router' },
        @{ file = 'work-planner.md'; name = 'Work Planner' },
        @{ file = 'code-executor.md'; name = 'Code Executor' },
        @{ file = 'test-generator.md'; name = 'Test Generator' },
        @{ file = 'health-validator.md'; name = 'Health Validator' },
        @{ file = 'change-governor.md'; name = 'Change Governor' }
    )
    
    foreach ($agent in $agents) {
        $path = Join-Path $promptsDir $agent.file
        $result = Test-FileExists -Path $path -Description $agent.name
        $checks += Add-Check -CategoryName 'Agents' -CheckName $agent.name -Result $result
    }
    
    # Shared Modules
    $sharedDir = Join-Path $workspaceRoot "KDS\prompts\shared"
    $sharedModules = @('validation.md', 'handoff.md', 'test-first.md', 'config-loader.md')
    $missingModules = @()
    foreach ($module in $sharedModules) {
        if (-not (Test-Path (Join-Path $sharedDir $module))) {
            $missingModules += $module
        }
    }
    $result = if ($missingModules.Count -eq 0) {
        @{ status = 'passed'; message = "All shared modules present" }
    } else {
        @{ status = 'warning'; message = "Missing modules: $($missingModules -join ', ')" }
    }
    $checks += Add-Check -CategoryName 'Agents' -CheckName 'Shared Modules' -Result $result
    
    return @{
        id = 'agents'
        name = 'Agents & Prompts'
        icon = '🤖'
        checks = $checks
    }
}

# ==========================================
# 3. BRAIN System Checks
# ==========================================

function Test-BRAINSystem {
    if ($VerboseOutput) { Write-Host "  Checking BRAIN System..." -ForegroundColor Cyan }
    
    $checks = @()
    $brainDir = Join-Path $workspaceRoot "KDS\kds-brain"
    
    # 3.1 Knowledge Graph
    $kgPath = Join-Path $brainDir "knowledge-graph.yaml"
    $result = Test-YamlFile -Path $kgPath -Description "Knowledge Graph"
    $checks += Add-Check -CategoryName 'BRAIN' -CheckName 'Knowledge Graph' -Result $result
    
    # 3.2 Event Stream
    $eventsPath = Join-Path $brainDir "events.jsonl"
    $result = if (Test-Path $eventsPath) {
        $lines = Get-Content $eventsPath -ErrorAction SilentlyContinue
        $eventCount = ($lines | Measure-Object).Count
        @{ status = 'passed'; message = "Event stream healthy ($eventCount events)" }
    } else {
        @{ status = 'warning'; message = "Event stream file not found (will be created on first use)" }
    }
    $checks += Add-Check -CategoryName 'BRAIN' -CheckName 'Event Stream' -Result $result
    
    # 3.3 Pattern Recognition
    if (Test-Path $kgPath) {
        $kgContent = Get-Content $kgPath -Raw
        $patternCount = ([regex]::Matches($kgContent, "confidence:")).Count
        $result = if ($patternCount -gt 0) {
            @{ status = 'passed'; message = "Found $patternCount patterns" }
        } else {
            @{ status = 'warning'; message = "No patterns learned yet" }
        }
    } else {
        $result = @{ status = 'warning'; message = "Knowledge graph not initialized" }
    }
    $checks += Add-Check -CategoryName 'BRAIN' -CheckName 'Pattern Recognition' -Result $result
    
    # 3.4 Protection Scripts
    $protectionScripts = @(
        'protect-brain-update.ps1',
        'protect-event-append.ps1',
        'protect-routing-decision.ps1'
    )
    $scriptsDir = Join-Path $workspaceRoot "KDS\scripts"
    $missingScripts = @()
    foreach ($script in $protectionScripts) {
        if (-not (Test-Path (Join-Path $scriptsDir $script))) {
            $missingScripts += $script
        }
    }
    $result = if ($missingScripts.Count -eq 0) {
        @{ status = 'passed'; message = "All protection scripts present" }
    } else {
        @{ status = 'warning'; message = "Missing: $($missingScripts -join ', ')" }
    }
    $checks += Add-Check -CategoryName 'BRAIN' -CheckName 'Protection Scripts' -Result $result
    
    # 3.5 Anomaly Queue
    $anomaliesPath = Join-Path $brainDir "anomalies.jsonl"
    if (Test-Path $anomaliesPath) {
        $anomalies = Get-Content $anomaliesPath -ErrorAction SilentlyContinue
        $pending = ($anomalies | ConvertFrom-Json | Where-Object { $_.status -eq 'pending' } | Measure-Object).Count
        $result = if ($pending -lt 10) {
            @{ status = 'passed'; message = "$pending pending anomalies (healthy)" }
        } else {
            @{ status = 'warning'; message = "$pending pending anomalies (review recommended)" }
            $results.recommendations += @{
                category = 'BRAIN System'
                check = 'Anomaly Queue'
                action = 'Run: .\KDS\scripts\manage-anomalies.ps1 -Mode review'
            }
        }
    } else {
        $result = @{ status = 'passed'; message = "No anomalies detected" }
    }
    $checks += Add-Check -CategoryName 'BRAIN' -CheckName 'Anomaly Queue' -Result $result
    
    # 3.6 Update Freshness
    if (Test-Path $kgPath) {
        $lastWrite = (Get-Item $kgPath).LastWriteTime
        $age = (Get-Date) - $lastWrite
        $result = if ($age.TotalHours -lt 24) {
            @{ status = 'passed'; message = "Updated $([int]$age.TotalHours) hours ago" }
        } elseif ($age.TotalDays -lt 7) {
            @{ status = 'warning'; message = "Updated $([int]$age.TotalDays) days ago" }
            $results.recommendations += @{
                category = 'BRAIN System'
                check = 'Update Freshness'
                action = 'Run: #file:KDS/prompts/internal/brain-updater.md'
            }
        } else {
            @{ status = 'critical'; message = "Updated $([int]$age.TotalDays) days ago (stale)" }
            $results.recommendations += @{
                category = 'BRAIN System'
                check = 'Update Freshness'
                action = 'URGENT: Run brain-updater.md to refresh knowledge'
            }
        }
    } else {
        $result = @{ status = 'warning'; message = "Knowledge graph not yet created" }
    }
    $checks += Add-Check -CategoryName 'BRAIN' -CheckName 'Update Freshness' -Result $result
    
    # 3.7-3.19 Full BRAIN Integrity Test (13 checks from test-brain-integrity.ps1)
    # GOVERNANCE RULE: When test-brain-integrity.ps1 is updated, this section MUST be updated
    # See: KDS/governance/rules/brain-test-synchronization.md
    $brainTestPath = Join-Path $workspaceRoot "KDS\tests\test-brain-integrity.ps1"
    if (Test-Path $brainTestPath) {
        if ($VerboseOutput) { Write-Host "    Running full BRAIN integrity test..." -ForegroundColor Cyan }
        
        try {
            # Run the full integrity test with JSON output
            $brainTestOutput = & $brainTestPath -JsonOutput 2>&1 | Out-String
            
            # Try to parse JSON (handle potential non-JSON output before the JSON)
            $jsonStart = $brainTestOutput.IndexOf('{')
            if ($jsonStart -ge 0) {
                $jsonContent = $brainTestOutput.Substring($jsonStart)
                $brainResult = $jsonContent | ConvertFrom-Json
                
                # Map each of the 13 integrity checks to our health check format
                foreach ($check in $brainResult.checks) {
                    $checkStatus = switch ($check.status) {
                        'PASS' { 'passed' }
                        'WARN' { 'warning' }
                        'FAIL' { 'critical' }
                        default { 'warning' }
                    }
                    
                    $checkResult = @{
                        status = $checkStatus
                        message = $check.message
                    }
                    
                    $checks += Add-Check -CategoryName 'BRAIN' -CheckName "Integrity: $($check.check)" -Result $checkResult
                    
                    # Add recommendations for failures
                    if ($checkStatus -eq 'critical') {
                        $results.recommendations += @{
                            category = 'BRAIN System'
                            check = "Integrity: $($check.check)"
                            action = "Fix issue: .\KDS\tests\test-brain-integrity.ps1 -Verbose"
                        }
                    }
                }
                
                # Add overall integrity status
                $overallStatus = if ($brainResult.overall_status -eq 'PASS') { 'passed' } else { 'critical' }
                $overallMessage = "$($brainResult.passed)/$($brainResult.total_checks) integrity checks passed"
                if ($brainResult.failed -gt 0) {
                    $overallMessage += " ($($brainResult.failed) failed, $($brainResult.warnings) warnings)"
                }
                
                $checksAdded = @{
                    status = $overallStatus
                    message = $overallMessage
                }
                $checks += Add-Check -CategoryName 'BRAIN' -CheckName 'Overall Integrity' -Result $checksAdded
                
            } else {
                # JSON parsing failed
                $result = @{ 
                    status = 'warning'
                    message = "Brain test output could not be parsed" 
                }
                $checks += Add-Check -CategoryName 'BRAIN' -CheckName 'Full Integrity Test' -Result $result
            }
            
        } catch {
            $result = @{ 
                status = 'warning'
                message = "Brain integrity test failed: $($_.Exception.Message)" 
            }
            $checks += Add-Check -CategoryName 'BRAIN' -CheckName 'Full Integrity Test' -Result $result
        }
    } else {
        $result = @{ 
            status = 'warning'
            message = "Brain integrity test script not found at: $brainTestPath" 
        }
        $checks += Add-Check -CategoryName 'BRAIN' -CheckName 'Full Integrity Test' -Result $result
    }
    
    return @{
        id = 'brain'
        name = 'BRAIN System'
        icon = '🧠'
        checks = $checks
    }
}

# ==========================================
# 4. Session State Checks
# ==========================================

function Test-SessionState {
    if ($VerboseOutput) { Write-Host "  Checking Session State..." -ForegroundColor Cyan }
    
    $checks = @()
    $sessionsDir = Join-Path $workspaceRoot "KDS\sessions"
    
    # 4.1 Current Session
    $currentPath = Join-Path $sessionsDir "current-session.json"
    $result = Test-JsonFile -Path $currentPath -Description "Current session"
    $checks += Add-Check -CategoryName 'Sessions' -CheckName 'Current Session' -Result $result
    
    # 4.2 Session History
    $historyPath = Join-Path $sessionsDir "session-history.json"
    $result = Test-JsonFile -Path $historyPath -Description "Session history"
    $checks += Add-Check -CategoryName 'Sessions' -CheckName 'Session History' -Result $result
    
    # 4.3 Resumption Guide
    $guidePath = Join-Path $sessionsDir "resumption-guide.md"
    $result = if (Test-Path $guidePath) {
        $age = ((Get-Date) - (Get-Item $guidePath).LastWriteTime).TotalHours
        if ($age -lt 24) {
            @{ status = 'passed'; message = "Resumption guide current ($([int]$age)h old)" }
        } else {
            @{ status = 'warning'; message = "Resumption guide outdated ($([int]$age)h old)" }
        }
    } else {
        @{ status = 'warning'; message = "Resumption guide not found" }
    }
    $checks += Add-Check -CategoryName 'Sessions' -CheckName 'Resumption Guide' -Result $result
    
    # 4.4 No Orphaned Sessions
    if (Test-Path $historyPath) {
        try {
            $history = Get-Content $historyPath -Raw | ConvertFrom-Json
            $orphaned = ($history.sessions | Where-Object { $_.status -eq 'orphaned' } | Measure-Object).Count
            $result = if ($orphaned -eq 0) {
                @{ status = 'passed'; message = "No orphaned sessions" }
            } else {
                @{ status = 'warning'; message = "$orphaned orphaned sessions found" }
            }
        } catch {
            $result = @{ status = 'warning'; message = "Could not parse history" }
        }
    } else {
        $result = @{ status = 'passed'; message = "No sessions yet" }
    }
    $checks += Add-Check -CategoryName 'Sessions' -CheckName 'No Orphaned Sessions' -Result $result
    
    # 4.5 Session Limit
    if (Test-Path $historyPath) {
        try {
            $history = Get-Content $historyPath -Raw | ConvertFrom-Json
            $sessionCount = ($history.sessions | Measure-Object).Count
            $result = if ($sessionCount -lt 20) {
                @{ status = 'passed'; message = "$sessionCount sessions (healthy)" }
            } else {
                @{ status = 'warning'; message = "$sessionCount sessions (consider archiving)" }
                $results.recommendations += @{
                    category = 'Session State'
                    check = 'Session Limit'
                    action = 'Archive old sessions to reduce memory footprint'
                }
            }
        } catch {
            $result = @{ status = 'passed'; message = "Session count check skipped" }
        }
    } else {
        $result = @{ status = 'passed'; message = "No sessions yet" }
    }
    $checks += Add-Check -CategoryName 'Sessions' -CheckName 'Session Limit' -Result $result
    
    return @{
        id = 'sessions'
        name = 'Session State'
        icon = '📊'
        checks = $checks
    }
}

# ==========================================
# 5. Knowledge Base Checks
# ==========================================

function Test-KnowledgeBase {
    if ($VerboseOutput) { Write-Host "  Checking Knowledge Base..." -ForegroundColor Cyan }
    
    $checks = @()
    $knowledgeDir = Join-Path $workspaceRoot "KDS\knowledge"
    
    # 5.1 Test Patterns
    $patternsDir = Join-Path $knowledgeDir "test-patterns"
    $result = if (Test-Path $patternsDir) {
        $patterns = (Get-ChildItem $patternsDir -Filter "*.md" -ErrorAction SilentlyContinue | Measure-Object).Count
        @{ status = 'passed'; message = "$patterns test patterns available" }
    } else {
        @{ status = 'warning'; message = "Test patterns directory not found" }
    }
    $checks += Add-Check -CategoryName 'Knowledge' -CheckName 'Test Patterns' -Result $result
    
    # 5.2 UI Mappings
    $mappingsDir = Join-Path $knowledgeDir "ui-mappings"
    $result = if (Test-Path $mappingsDir) {
        $mappings = (Get-ChildItem $mappingsDir -Filter "*.md" -ErrorAction SilentlyContinue | Measure-Object).Count
        @{ status = 'passed'; message = "$mappings UI mappings available" }
    } else {
        @{ status = 'warning'; message = "UI mappings directory not found" }
    }
    $checks += Add-Check -CategoryName 'Knowledge' -CheckName 'UI Mappings' -Result $result
    
    # 5.3 Published Workflows
    $workflowsDir = Join-Path $knowledgeDir "workflows"
    $result = if (Test-Path $workflowsDir) {
        $workflows = (Get-ChildItem $workflowsDir -Filter "*.md" -ErrorAction SilentlyContinue | Measure-Object).Count
        @{ status = 'passed'; message = "$workflows workflows published" }
    } else {
        @{ status = 'warning'; message = "Workflows directory not found" }
    }
    $checks += Add-Check -CategoryName 'Knowledge' -CheckName 'Published Workflows' -Result $result
    
    # 5.4 Update Requests
    $updatesDir = Join-Path $knowledgeDir "update-requests"
    if (Test-Path $updatesDir) {
        $requests = (Get-ChildItem $updatesDir -Filter "*.md" -ErrorAction SilentlyContinue | Measure-Object).Count
        $result = if ($requests -lt 5) {
            @{ status = 'passed'; message = "$requests pending update requests" }
        } else {
            @{ status = 'warning'; message = "$requests pending update requests (review recommended)" }
        }
    } else {
        $result = @{ status = 'passed'; message = "No pending update requests" }
    }
    $checks += Add-Check -CategoryName 'Knowledge' -CheckName 'Update Requests' -Result $result
    
    # 5.5 Cross-References
    $readmePath = Join-Path $knowledgeDir "README.md"
    $result = if (Test-Path $readmePath) {
        $content = Get-Content $readmePath -Raw
        $brokenLinks = ([regex]::Matches($content, '\[.*?\]\((.*?)\)') | Where-Object {
            $link = $_.Groups[1].Value
            if ($link -match '^http') { return $false }
            -not (Test-Path (Join-Path $knowledgeDir $link))
        } | Measure-Object).Count
        
        if ($brokenLinks -eq 0) {
            @{ status = 'passed'; message = "All cross-references valid" }
        } else {
            @{ status = 'warning'; message = "$brokenLinks broken references found" }
        }
    } else {
        @{ status = 'warning'; message = "Knowledge README not found" }
    }
    $checks += Add-Check -CategoryName 'Knowledge' -CheckName 'Cross-References' -Result $result
    
    return @{
        id = 'knowledge'
        name = 'Knowledge Base'
        icon = '📚'
        checks = $checks
    }
}

# ==========================================
# 6. Scripts & Tools Checks
# ==========================================

function Test-ScriptsTools {
    if ($VerboseOutput) { Write-Host "  Checking Scripts & Tools..." -ForegroundColor Cyan }
    
    $checks = @()
    $scriptsDir = Join-Path $workspaceRoot "KDS\scripts"
    
    # 6.1 PowerShell Executable
    $scripts = Get-ChildItem $scriptsDir -Filter "*.ps1" -ErrorAction SilentlyContinue
    $nonExecutable = @()
    foreach ($script in $scripts) {
        try {
            $content = Get-Content $script.FullName -TotalCount 1
            # Basic check - file readable
        } catch {
            $nonExecutable += $script.Name
        }
    }
    $result = if ($nonExecutable.Count -eq 0) {
        @{ status = 'passed'; message = "All scripts readable ($($scripts.Count) scripts)" }
    } else {
        @{ status = 'warning'; message = "Issues with: $($nonExecutable -join ', ')" }
    }
    $checks += Add-Check -CategoryName 'Scripts' -CheckName 'PowerShell Executable' -Result $result
    
    # 6.2 Conversation STM
    $stmPath = Join-Path $scriptsDir "conversation-stm.ps1"
    $result = Test-FileExists -Path $stmPath -Description "conversation-stm.ps1"
    $checks += Add-Check -CategoryName 'Scripts' -CheckName 'Conversation STM' -Result $result
    
    # 6.3 BRAIN Updater
    $updaterPath = Join-Path $workspaceRoot "KDS\prompts\internal\brain-updater.md"
    $result = Test-FileExists -Path $updaterPath -Description "brain-updater.md"
    $checks += Add-Check -CategoryName 'Scripts' -CheckName 'BRAIN Updater' -Result $result
    
    # 6.4 Monitoring Scripts
    $monitoringPath = Join-Path $scriptsDir "generate-monitoring-dashboard.ps1"
    $result = Test-FileExists -Path $monitoringPath -Description "Monitoring dashboard script"
    $checks += Add-Check -CategoryName 'Scripts' -CheckName 'Monitoring Scripts' -Result $result
    
    # 6.5 Maintenance Tools
    $maintenancePath = Join-Path $scriptsDir "run-maintenance.ps1"
    $result = Test-FileExists -Path $maintenancePath -Description "Maintenance script"
    $checks += Add-Check -CategoryName 'Scripts' -CheckName 'Maintenance Tools' -Result $result
    
    return @{
        id = 'scripts'
        name = 'Scripts & Tools'
        icon = '🔧'
        checks = $checks
    }
}

# ==========================================
# 7. Performance Checks
# ==========================================

function Test-Performance {
    if ($VerboseOutput) { Write-Host "  Checking Performance..." -ForegroundColor Cyan }
    
    $checks = @()
    $brainDir = Join-Path $workspaceRoot "KDS\kds-brain"
    
    # 7.1 BRAIN Query Time (simulated - would need actual query)
    $start = Get-Date
    $kgPath = Join-Path $brainDir "knowledge-graph.yaml"
    if (Test-Path $kgPath) {
        $content = Get-Content $kgPath -Raw | Out-Null
    }
    $elapsed = ((Get-Date) - $start).TotalMilliseconds
    $result = if ($elapsed -lt 500) {
        @{ status = 'passed'; message = "Query time: $([int]$elapsed)ms" }
    } elseif ($elapsed -lt 1000) {
        @{ status = 'warning'; message = "Query time: $([int]$elapsed)ms (optimize recommended)" }
    } else {
        @{ status = 'critical'; message = "Query time: $([int]$elapsed)ms (too slow)" }
    }
    $checks += Add-Check -CategoryName 'Performance' -CheckName 'BRAIN Query Time' -Result $result
    
    # 7.2 Session Load Time
    $sessionsPath = Join-Path $workspaceRoot "KDS\sessions\current-session.json"
    $start = Get-Date
    if (Test-Path $sessionsPath) {
        $session = Get-Content $sessionsPath -Raw | ConvertFrom-Json | Out-Null
    }
    $elapsed = ((Get-Date) - $start).TotalMilliseconds
    $result = if ($elapsed -lt 200) {
        @{ status = 'passed'; message = "Load time: $([int]$elapsed)ms" }
    } elseif ($elapsed -lt 500) {
        @{ status = 'warning'; message = "Load time: $([int]$elapsed)ms (could be faster)" }
    } else {
        @{ status = 'critical'; message = "Load time: $([int]$elapsed)ms (too slow)" }
    }
    $checks += Add-Check -CategoryName 'Performance' -CheckName 'Session Load Time' -Result $result
    
    # 7.3 Event Log Size
    $eventsPath = Join-Path $brainDir "events.jsonl"
    if (Test-Path $eventsPath) {
        $sizeMB = ((Get-Item $eventsPath).Length / 1MB)
        $result = if ($sizeMB -lt 10) {
            @{ status = 'passed'; message = "Event log: $([math]::Round($sizeMB, 2))MB" }
        } elseif ($sizeMB -lt 50) {
            @{ status = 'warning'; message = "Event log: $([math]::Round($sizeMB, 2))MB (consider archiving)" }
        } else {
            @{ status = 'critical'; message = "Event log: $([math]::Round($sizeMB, 2))MB (archive now)" }
            $results.recommendations += @{
                category = 'Performance'
                check = 'Event Log Size'
                action = 'Archive old events: .\KDS\scripts\run-maintenance.ps1 -Archive'
            }
        }
    } else {
        $result = @{ status = 'passed'; message = "Event log: 0MB" }
    }
    $checks += Add-Check -CategoryName 'Performance' -CheckName 'Event Log Size' -Result $result
    
    # 7.4 Knowledge Graph Size
    if (Test-Path $kgPath) {
        $sizeMB = ((Get-Item $kgPath).Length / 1MB)
        $result = if ($sizeMB -lt 5) {
            @{ status = 'passed'; message = "Knowledge graph: $([math]::Round($sizeMB, 2))MB" }
        } elseif ($sizeMB -lt 10) {
            @{ status = 'warning'; message = "Knowledge graph: $([math]::Round($sizeMB, 2))MB (large)" }
        } else {
            @{ status = 'critical'; message = "Knowledge graph: $([math]::Round($sizeMB, 2))MB (too large)" }
        }
    } else {
        $result = @{ status = 'passed'; message = "Knowledge graph: 0MB" }
    }
    $checks += Add-Check -CategoryName 'Performance' -CheckName 'Knowledge Graph Size' -Result $result
    
    # 7.5 Memory Usage
    $process = Get-Process -Id $PID
    $memoryMB = $process.WorkingSet64 / 1MB
    $result = if ($memoryMB -lt 100) {
        @{ status = 'passed'; message = "Memory: $([math]::Round($memoryMB, 2))MB" }
    } elseif ($memoryMB -lt 500) {
        @{ status = 'warning'; message = "Memory: $([math]::Round($memoryMB, 2))MB (high)" }
    } else {
        @{ status = 'critical'; message = "Memory: $([math]::Round($memoryMB, 2))MB (leak suspected)" }
    }
    $checks += Add-Check -CategoryName 'Performance' -CheckName 'Memory Usage' -Result $result
    
    return @{
        id = 'performance'
        name = 'Performance'
        icon = '⚡'
        checks = $checks
    }
}

# ==========================================
# Main Execution
# ==========================================

Write-Host "🧠 KDS Health Check" -ForegroundColor Cyan
Write-Host "  Category: $Category" -ForegroundColor Gray
Write-Host "  Format: $OutputFormat" -ForegroundColor Gray
Write-Host ""

# Run checks based on category
$categoriesToRun = if ($Category -eq 'all') {
    @('infrastructure', 'agents', 'brain', 'sessions', 'knowledge', 'scripts', 'performance')
} else {
    @($Category)
}

foreach ($cat in $categoriesToRun) {
    $categoryResult = switch ($cat) {
        'infrastructure' { Test-Infrastructure }
        'agents' { Test-AgentsPrompts }
        'brain' { Test-BRAINSystem }
        'sessions' { Test-SessionState }
        'knowledge' { Test-KnowledgeBase }
        'scripts' { Test-ScriptsTools }
        'performance' { Test-Performance }
    }
    
    $results.categories += $categoryResult
}

# Output results
if ($OutputFormat -eq 'json') {
    $results | ConvertTo-Json -Depth 10
} else {
    Write-Host "=" * 60 -ForegroundColor Gray
    Write-Host "OVERALL STATUS: $($results.overallStatus)" -ForegroundColor $(
        switch ($results.overallStatus) {
            'HEALTHY' { 'Green' }
            'DEGRADED' { 'Yellow' }
            'CRITICAL' { 'Red' }
        }
    )
    Write-Host "Total Checks: $($results.stats.totalChecks)" -ForegroundColor Gray
    Write-Host "  Passed: $($results.stats.passed)" -ForegroundColor Green
    Write-Host "  Warnings: $($results.stats.warnings)" -ForegroundColor Yellow
    Write-Host "  Critical: $($results.stats.critical)" -ForegroundColor Red
    Write-Host "=" * 60 -ForegroundColor Gray
    
    if ($results.recommendations.Count -gt 0) {
        Write-Host ""
        Write-Host "RECOMMENDATIONS:" -ForegroundColor Yellow
        foreach ($rec in $results.recommendations) {
            Write-Host "  [$($rec.category)] $($rec.check)" -ForegroundColor Yellow
            Write-Host "    → $($rec.action)" -ForegroundColor Gray
        }
    }
}
