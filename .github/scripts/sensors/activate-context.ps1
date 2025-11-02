<#
.SYNOPSIS
    Contextual Activation - Extract keywords and activate relevant knowledge graph nodes

.DESCRIPTION
    Part of KDS Brain System (Week 4). This script:
    1. Extracts keywords from user requests
    2. Queries knowledge graph for relevant nodes
    3. Scores nodes by relevance
    4. Returns top N most relevant context items

.PARAMETER UserRequest
    Natural language feature request from user

.PARAMETER ConfidenceThreshold
    Minimum confidence score for nodes (0.0-1.0). Default: 0.7

.PARAMETER MaxNodes
    Maximum number of nodes to return per category. Default: 10

.PARAMETER ExtractKeywordsOnly
    If set, only extract and return keywords (skip activation)

.PARAMETER AgentType
    Type of agent requesting context: planner, executor, tester

.EXAMPLE
    .\activate-context.ps1 -UserRequest "I want to add a save button"
    
.EXAMPLE
    .\activate-context.ps1 -UserRequest "add export feature" -MaxNodes 5 -ConfidenceThreshold 0.8

.NOTES
    Version: 1.0
    Part of: KDS Brain System v5.0
    Dependencies: query-knowledge-graph.ps1
#>

param(
    [Parameter(Mandatory=$true)]
    [string]$UserRequest,
    
    [Parameter(Mandatory=$false)]
    [ValidateRange(0.0, 1.0)]
    [double]$ConfidenceThreshold = 0.7,
    
    [Parameter(Mandatory=$false)]
    [ValidateRange(1, 50)]
    [int]$MaxNodes = 10,
    
    [Parameter(Mandatory=$false)]
    [switch]$ExtractKeywordsOnly,
    
    [Parameter(Mandatory=$false)]
    [ValidateSet("planner", "executor", "tester", "unknown")]
    [string]$AgentType = "unknown"
)

$ErrorActionPreference = "Stop"

# Get script directory (works even when script is dot-sourced)
$scriptPath = if ($PSScriptRoot) { $PSScriptRoot } else { Get-Location }
$contextPath = Join-Path $scriptPath "..\..\context"

#region Keyword Extraction

function Extract-Keywords {
    param([string]$Request)
    
    $keywords = @()
    
    # Common action verbs
    $actionVerbs = @("add", "create", "build", "implement", "modify", "update", "delete", "remove", "fix", "enhance", "improve")
    
    # Domain entities (common project terms)
    $domainEntities = @(
        "canvas", "button", "save", "load", "share", "export", "delete", "download",
        "session", "participant", "host", "user", "admin",
        "transcript", "annotation", "question", "answer",
        "api", "endpoint", "controller", "service", "database", "table",
        "ui", "component", "page", "modal", "dialog", "panel",
        "test", "validation", "authentication", "authorization"
    )
    
    # Technical terms
    $technicalTerms = @("signalr", "blazor", "razor", "css", "javascript", "playwright", "percy", "ef", "entity")
    
    # Convert to lowercase for matching
    $lowerRequest = $Request.ToLower()
    
    # Extract action verbs
    foreach ($verb in $actionVerbs) {
        if ($lowerRequest -match "\b$verb\b") {
            $keywords += $verb
        }
    }
    
    # Extract domain entities
    foreach ($entity in $domainEntities) {
        if ($lowerRequest -match "\b$entity\b") {
            $keywords += $entity
        }
    }
    
    # Extract technical terms
    foreach ($term in $technicalTerms) {
        if ($lowerRequest -match "\b$term\b") {
            $keywords += $term
        }
    }
    
    # Infer UI context from button/component mentions
    if ($lowerRequest -match "\b(button|component|page|modal)\b") {
        if ("ui" -notin $keywords) {
            $keywords += "ui"
        }
    }
    
    # Infer API context from endpoint/controller/api mentions
    if ($lowerRequest -match "\b(api|endpoint|controller|service)\b") {
        if ("api" -notin $keywords) {
            $keywords += "api"
        }
    }
    
    # Infer database context from table/database/data mentions
    if ($lowerRequest -match "\b(table|database|data|save|load)\b") {
        if ("database" -notin $keywords) {
            $keywords += "database"
        }
    }
    
    return $keywords | Select-Object -Unique
}

#endregion

#region Context Loading

function Load-ContextFile {
    param(
        [string]$FileName
    )
    
    $filePath = Join-Path $contextPath $FileName
    
    if (-not (Test-Path $filePath)) {
        Write-Warning "Context file not found: $filePath"
        return $null
    }
    
    try {
        $content = Get-Content $filePath -Raw | ConvertFrom-Json
        return $content
    }
    catch {
        Write-Warning "Failed to parse $FileName : $_"
        return $null
    }
}

#endregion

#region Relevance Scoring

function Calculate-RelevanceScore {
    param(
        [object]$Node,
        [string[]]$Keywords,
        [double]$BaseConfidence
    )
    
    $score = $BaseConfidence
    
    # Convert node to searchable text (name, pattern, file path, etc.)
    $searchText = @()
    
    if ($Node.name) { $searchText += $Node.name }
    if ($Node.pattern) { $searchText += $Node.pattern }
    if ($Node.file) { $searchText += $Node.file }
    if ($Node.action) { $searchText += $Node.action }
    if ($Node.controller) { $searchText += $Node.controller }
    if ($Node.table) { $searchText += $Node.table }
    if ($Node.DbSet) { $searchText += $Node.DbSet }
    if ($Node.Name) { $searchText += $Node.Name }
    
    $searchText = ($searchText -join " ").ToLower()
    
    # Keyword matching bonuses
    $exactMatches = 0
    $partialMatches = 0
    
    foreach ($keyword in $Keywords) {
        $keyword = $keyword.ToLower()
        
        # Exact word match
        if ($searchText -match "\b$keyword\b") {
            $exactMatches++
            $score += 0.3
        }
        # Partial match (substring)
        elseif ($searchText -like "*$keyword*") {
            $partialMatches++
            $score += 0.15
        }
    }
    
    # Recency bonus (if metadata available)
    if ($Node.metadata -and $Node.metadata.lastModified) {
        $lastMod = [DateTime]$Node.metadata.lastModified
        $daysSince = ((Get-Date) - $lastMod).TotalDays
        
        if ($daysSince -le 1) { $score += 0.1 }      # Today
        elseif ($daysSince -le 7) { $score += 0.05 } # This week
    }
    
    # Usage bonus (if metadata available)
    if ($Node.metadata -and $Node.metadata.modificationCount) {
        $modCount = $Node.metadata.modificationCount
        
        if ($modCount -gt 10) { $score += 0.1 }      # High usage
        elseif ($modCount -gt 5) { $score += 0.05 }  # Medium usage
    }
    
    return @{
        Score = $score
        ExactMatches = $exactMatches
        PartialMatches = $partialMatches
    }
}

#endregion

#region Activation

function Activate-Routes {
    param(
        [string[]]$Keywords,
        [double]$Threshold,
        [int]$MaxCount
    )
    
    $routes = Load-ContextFile "routes.json"
    if (-not $routes) { return @() }
    
    $activated = @()
    
    foreach ($route in $routes.routes) {
        $scoreResult = Calculate-RelevanceScore -Node $route -Keywords $Keywords -BaseConfidence $route.confidence
        
        if ($scoreResult.Score -ge $Threshold) {
            $activated += @{
                Pattern = $route.pattern
                Method = $route.method
                Controller = $route.controller
                Action = $route.action
                File = $route.file
                Line = $route.line
                AuthRequired = $route.auth_required
                Confidence = $route.confidence
                RelevanceScore = $scoreResult.Score
                KeywordMatches = $scoreResult.ExactMatches
            }
        }
    }
    
    return $activated | Sort-Object -Property RelevanceScore -Descending | Select-Object -First $MaxCount
}

function Activate-DatabaseTables {
    param(
        [string[]]$Keywords,
        [double]$Threshold,
        [int]$MaxCount
    )
    
    $db = Load-ContextFile "database.json"
    if (-not $db) { return @() }
    
    $activated = @()
    
    foreach ($table in $db.tables) {
        $scoreResult = Calculate-RelevanceScore -Node $table -Keywords $Keywords -BaseConfidence $table.confidence
        
        if ($scoreResult.Score -ge $Threshold) {
            $activated += @{
                Name = $table.name
                DbSet = $table.dbset
                Context = $table.context
                File = $table.file
                Relationships = $table.relationships
                Confidence = $table.confidence
                RelevanceScore = $scoreResult.Score
                KeywordMatches = $scoreResult.ExactMatches
            }
        }
    }
    
    return $activated | Sort-Object -Property RelevanceScore -Descending | Select-Object -First $MaxCount
}

function Activate-UIComponents {
    param(
        [string[]]$Keywords,
        [double]$Threshold,
        [int]$MaxCount
    )
    
    $ui = Load-ContextFile "ui-components.json"
    if (-not $ui) { return @() }
    
    $activated = @()
    
    foreach ($component in $ui.components) {
        $scoreResult = Calculate-RelevanceScore -Node $component -Keywords $Keywords -BaseConfidence $component.confidence
        
        if ($scoreResult.Score -ge $Threshold) {
            $activated += @{
                Name = $component.name
                File = $component.file
                Route = $component.route
                TestIds = $component.test_ids
                Children = $component.children
                ApiCalls = $component.api_calls
                Confidence = $component.confidence
                RelevanceScore = $scoreResult.Score
                KeywordMatches = $scoreResult.ExactMatches
            }
        }
    }
    
    # Also check pages
    foreach ($page in $ui.pages) {
        $scoreResult = Calculate-RelevanceScore -Node $page -Keywords $Keywords -BaseConfidence $page.confidence
        
        if ($scoreResult.Score -ge $Threshold) {
            $activated += @{
                Name = $page.component
                File = $page.file
                Route = $page.route
                TestIds = $page.test_ids
                Parameters = $page.parameters
                Confidence = $page.confidence
                RelevanceScore = $scoreResult.Score
                KeywordMatches = $scoreResult.ExactMatches
                IsPage = $true
            }
        }
    }
    
    return $activated | Sort-Object -Property RelevanceScore -Descending | Select-Object -First $MaxCount
}

function Generate-Warnings {
    param(
        [string[]]$Keywords,
        [object[]]$ActivatedComponents,
        [object[]]$ActivatedRoutes
    )
    
    $warnings = @()
    $suggestions = @()
    
    # Check for file confusion patterns
    $confusionPairs = @(
        @{Incorrect = "HostControlPanel"; Correct = "HostControlPanelContent"; Context = "FAB buttons"}
    )
    
    foreach ($pair in $confusionPairs) {
        $incorrectMentioned = $false
        
        foreach ($comp in $ActivatedComponents) {
            if ($comp.Name -like "*$($pair.Incorrect)*" -and $comp.Name -notlike "*Content*") {
                $incorrectMentioned = $true
                break
            }
        }
        
        if ($incorrectMentioned -and $Keywords -contains "button") {
            $warnings += @{
                Type = "file_confusion"
                Message = "⚠️ FAB buttons are typically in $($pair.Correct).razor, not $($pair.Incorrect).razor"
                Confidence = 0.92
                Recommendation = "Verify you mean $($pair.Incorrect).razor and not $($pair.Correct).razor"
            }
        }
    }
    
    # Check for duplicate functionality
    if ($Keywords -contains "add" -or $Keywords -contains "create") {
        # Check if similar components/routes already exist
        $saveButtonExists = $ActivatedComponents | Where-Object { $_.TestIds -contains "fab-save-button" -or $_.TestIds -like "*save*" }
        $deleteButtonExists = $ActivatedComponents | Where-Object { $_.TestIds -contains "fab-delete-button" -or $_.TestIds -like "*delete*" }
        $shareButtonExists = $ActivatedComponents | Where-Object { $_.TestIds -contains "fab-share-button" -or $_.TestIds -like "*share*" }
        
        if ($Keywords -contains "save" -and $saveButtonExists) {
            $suggestions += "💡 Save button may already exist (test ID: fab-save-button found). Review before adding."
        }
        
        if ($Keywords -contains "delete" -and $deleteButtonExists) {
            $suggestions += "💡 Delete button may already exist (test ID: fab-delete-button found). Review before adding."
        }
        
        if ($Keywords -contains "share" -and $shareButtonExists) {
            $suggestions += "💡 Share button may already exist (test ID: fab-share-button found). Review before adding."
        }
    }
    
    # Suggest existing patterns
    if ($ActivatedRoutes.Count -gt 0) {
        $suggestions += "✅ Found $($ActivatedRoutes.Count) related API route(s) - consider reusing existing endpoints"
    }
    
    if ($ActivatedComponents.Count -gt 0) {
        $testIds = $ActivatedComponents.TestIds | Where-Object { $_ } | Select-Object -Unique
        if ($testIds) {
            $suggestions += "💡 Follow existing test ID naming pattern: $($testIds -join ', ')"
        }
    }
    
    return @{
        Warnings = $warnings
        Suggestions = $suggestions
    }
}

#endregion

#region Main Execution

try {
    # Step 1: Extract keywords
    Write-Verbose "Extracting keywords from: $UserRequest"
    $keywords = Extract-Keywords -Request $UserRequest
    
    if ($ExtractKeywordsOnly) {
        # Return keywords only
        return $keywords
    }
    
    Write-Verbose "Keywords extracted: $($keywords -join ', ')"
    
    # Step 2: Activate relevant context
    Write-Verbose "Activating context with threshold: $ConfidenceThreshold"
    
    $startTime = Get-Date
    
    $activatedRoutes = Activate-Routes -Keywords $keywords -Threshold $ConfidenceThreshold -MaxCount $MaxNodes
    $activatedTables = Activate-DatabaseTables -Keywords $keywords -Threshold $ConfidenceThreshold -MaxCount $MaxNodes
    $activatedComponents = Activate-UIComponents -Keywords $keywords -Threshold $ConfidenceThreshold -MaxCount $MaxNodes
    
    $duration = ((Get-Date) - $startTime).TotalMilliseconds
    
    # Step 3: Generate warnings and suggestions
    $insights = Generate-Warnings -Keywords $keywords -ActivatedComponents $activatedComponents -ActivatedRoutes $activatedRoutes
    
    # Step 4: Build result
    $result = @{
        Status = "success"
        Keywords = $keywords
        Context = @{
            RelevantRoutes = $activatedRoutes
            RelevantTables = $activatedTables
            RelevantComponents = $activatedComponents
            Warnings = $insights.Warnings
            Suggestions = $insights.Suggestions
        }
        ScanInfo = @{
            SensorsRun = @("routes", "database", "ui-components")
            ScanDurationMs = [math]::Round($duration, 0)
            NodesActivated = $activatedRoutes.Count + $activatedTables.Count + $activatedComponents.Count
            ConfidenceThreshold = $ConfidenceThreshold
            MaxNodesPerCategory = $MaxNodes
        }
        AgentType = $AgentType
    }
    
    # Return as JSON
    return $result | ConvertTo-Json -Depth 10
}
catch {
    Write-Error "Context activation failed: $_"
    
    # Return error response
    $errorResult = @{
        Status = "error"
        Message = $_.Exception.Message
        FallbackMode = $true
    }
    
    return $errorResult | ConvertTo-Json
}

#endregion
