<#
.SYNOPSIS
KDS Knowledge Graph Builder - Builds relationship map from sensor outputs

.DESCRIPTION
Parses routes.json, database.json, ui-components.json and builds a knowledge graph
showing relationships between UI components, API endpoints, services, and database tables.

Implements:
- Node extraction from sensor outputs
- Edge (relationship) inference
- Confidence scoring
- Incremental updates

.PARAMETER ContextPath
Path to KDS/context directory (default: ./KDS/context)

.PARAMETER OutputPath
Path to save knowledge-graph.json (default: ./KDS/context/knowledge-graph.json)

.PARAMETER Incremental
If true, merge with existing graph instead of rebuilding from scratch

.EXAMPLE
.\build-knowledge-graph.ps1
# Builds complete knowledge graph from all sensors

.EXAMPLE
.\build-knowledge-graph.ps1 -Incremental
# Updates existing graph with new findings

.NOTES
Version: 1.0.0
Part of: KDS v5.0 Brain System - Week 3
#>

param(
    [string]$ContextPath,
    [string]$OutputPath,
    [switch]$Incremental,
    [string]$Mode = "Incremental"
)

$ErrorActionPreference = "Stop"

# Auto-detect context path if not provided
if (-not $ContextPath) {
    # Scripts are in KDS/scripts/sensors, context is in KDS/context
    $scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
    $githubDir = Split-Path -Parent (Split-Path -Parent $scriptDir)
    $ContextPath = Join-Path $githubDir "context"
}

# Auto-detect output path if not provided
if (-not $OutputPath) {
    $OutputPath = Join-Path $ContextPath "knowledge-graph.json"
}

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "🧠 KDS Knowledge Graph Builder v1.0.0" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

# Ensure context directory exists
if (-not (Test-Path $ContextPath)) {
    Write-Error "Context directory not found: $ContextPath"
    exit 1
}

# Load sensor outputs
$routesFile = Join-Path $ContextPath "routes.json"
$databaseFile = Join-Path $ContextPath "database.json"
$uiComponentsFile = Join-Path $ContextPath "ui-components.json"

if (-not (Test-Path $routesFile)) {
    Write-Warning "routes.json not found - run scan-routes.ps1 first"
}
if (-not (Test-Path $databaseFile)) {
    Write-Warning "database.json not found - run scan-database.ps1 first"
}
if (-not (Test-Path $uiComponentsFile)) {
    Write-Warning "ui-components.json not found - run scan-ui.ps1 first"
}

# Initialize graph structure
$graph = @{
    version = "1.0.0"
    lastUpdated = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    metadata = @{
        totalNodes = 0
        totalEdges = 0
        averageConfidence = 0.0
        nodesByType = @{}
        edgesByType = @{}
    }
    nodes = @()
    edges = @()
}

# Load existing graph if incremental mode
if ($Incremental -and (Test-Path $OutputPath)) {
    Write-Host "📂 Loading existing graph for incremental update..." -ForegroundColor Yellow
    $existingGraph = Get-Content $OutputPath -Raw | ConvertFrom-Json
    $graph.nodes = @($existingGraph.nodes)
    $graph.edges = @($existingGraph.edges)
    Write-Host "   Loaded $($graph.nodes.Count) nodes, $($graph.edges.Count) edges" -ForegroundColor Gray
}

# Helper: Generate unique node ID
function Get-NodeId {
    param([string]$Type, [string]$Name)
    $cleanName = $Name -replace '[^a-zA-Z0-9_-]', '-' -replace '-+', '-' -replace '^-|-$', ''
    return "$($Type.ToLower())-$($cleanName.ToLower())"
}

# Helper: Calculate confidence score
function Get-ConfidenceScore {
    param(
        [string]$Source,
        [int]$VerifiedCount = 0,
        [datetime]$LastVerified
    )
    
    # Base confidence by source
    $baseConfidence = switch ($Source) {
        "code_analysis" { 0.9 }
        "user_confirmation" { 1.0 }
        "inference" { 0.6 }
        "assumption" { 0.3 }
        default { 0.5 }
    }
    
    # Verification multiplier
    $verificationBoost = [Math]::Min($VerifiedCount * 0.05, 0.1)
    
    # Recency multiplier (decay over time)
    if ($LastVerified) {
        $daysSinceVerified = ((Get-Date) - $LastVerified).Days
        $recencyFactor = if ($daysSinceVerified -le 1) { 1.0 }
            elseif ($daysSinceVerified -le 7) { 0.95 }
            elseif ($daysSinceVerified -le 30) { 0.85 }
            elseif ($daysSinceVerified -le 90) { 0.7 }
            else { 0.5 }
    } else {
        $recencyFactor = 1.0
    }
    
    $finalConfidence = ($baseConfidence + $verificationBoost) * $recencyFactor
    return [Math]::Min([Math]::Round($finalConfidence, 2), 1.0)
}

# Helper: Add or update node
function Add-GraphNode {
    param(
        [string]$Type,
        [string]$Name,
        [hashtable]$Metadata
    )
    
    $nodeId = Get-NodeId -Type $Type -Name $Name
    
    # Check if node already exists
    $existingNode = $graph.nodes | Where-Object { $_.id -eq $nodeId }
    
    if ($existingNode) {
        # Update existing node (increment verified count)
        $existingNode.metadata.verifiedCount++
        $existingNode.metadata.lastVerified = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
        $existingNode.confidence = Get-ConfidenceScore -Source $existingNode.metadata.source -VerifiedCount $existingNode.metadata.verifiedCount
        return $nodeId
    }
    
    # Create new node
    $now = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    $source = if ($Metadata.source) { $Metadata.source } else { "code_analysis" }
    
    $node = @{
        id = $nodeId
        type = $Type
        name = $Name
        confidence = Get-ConfidenceScore -Source $source
        metadata = @{
            source = $source
            verifiedCount = 1
            lastVerified = $now
            createdAt = $now
            updatedAt = $now
        } + $Metadata
    }
    
    $graph.nodes += $node
    return $nodeId
}

# Helper: Add edge (relationship)
function Add-GraphEdge {
    param(
        [string]$From,
        [string]$To,
        [string]$Type,
        [string]$Evidence,
        [string]$Source = "inference"
    )
    
    $edgeId = "$From--$($Type.ToLower())-->$To"
    
    # Check if edge already exists
    $existingEdge = $graph.edges | Where-Object { $_.id -eq $edgeId }
    
    if ($existingEdge) {
        # Update existing edge
        $existingEdge.metadata.verifiedCount++
        $existingEdge.metadata.lastVerified = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
        $existingEdge.confidence = Get-ConfidenceScore -Source $existingEdge.metadata.source -VerifiedCount $existingEdge.metadata.verifiedCount
        return
    }
    
    # Create new edge
    $now = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    
    $edge = @{
        id = $edgeId
        from = $From
        to = $To
        type = $Type
        confidence = Get-ConfidenceScore -Source $Source
        metadata = @{
            evidence = $Evidence
            source = $Source
            verifiedCount = 1
            lastVerified = $now
            createdAt = $now
            usageCount = 0
            successCount = 0
        }
    }
    
    $graph.edges += $edge
}

Write-Host "📊 Building knowledge graph..." -ForegroundColor Yellow
Write-Host ""

# ========================================
# 1. Process Routes (API Endpoints)
# ========================================
if (Test-Path $routesFile) {
    Write-Host "🔍 Processing routes.json..." -ForegroundColor Cyan
    $routesData = Get-Content $routesFile -Raw | ConvertFrom-Json
    
    foreach ($route in $routesData.routes) {
        # Add API endpoint node
        $endpointName = "$($route.method) $($route.pattern)"
        $endpointId = Add-GraphNode -Type "API_ENDPOINT" -Name $endpointName -Metadata @{
            file = $route.file
            line = $route.line
            method = $route.method
            pattern = $route.pattern
            controller = $route.controller
            action = $route.action
            authRequired = $route.authRequired
        }
        
        # Add controller node
        $controllerName = $route.controller
        $controllerId = Add-GraphNode -Type "CONTROLLER" -Name $controllerName -Metadata @{
            file = $route.file
        }
        
        # Link endpoint to controller
        Add-GraphEdge -From $endpointId -To $controllerId -Type "USES" `
            -Evidence "Endpoint $endpointName is handled by $controllerName.$($route.action)" `
            -Source "code_analysis"
    }
    
    Write-Host "   ✅ Processed $($routesData.routes.Count) API endpoints" -ForegroundColor Green
}

# ========================================
# 2. Process Database (Tables, Views, SPs)
# ========================================
if (Test-Path $databaseFile) {
    Write-Host "🔍 Processing database.json..." -ForegroundColor Cyan
    $databaseData = Get-Content $databaseFile -Raw | ConvertFrom-Json
    
    # Add database tables
    foreach ($table in $databaseData.tables) {
        $tableId = Add-GraphNode -Type "DATABASE_TABLE" -Name $table.name -Metadata @{
            schema = $table.schema
            dbContext = $table.dbContext
            file = $table.file
            line = $table.line
        }
        
        # Add foreign key relationships
        if ($table.foreignKeys) {
            foreach ($fk in $table.foreignKeys) {
                $relatedTableId = Get-NodeId -Type "DATABASE_TABLE" -Name $fk.referencedTable
                Add-GraphEdge -From $tableId -To $relatedTableId -Type "RELATES_TO" `
                    -Evidence "Foreign key $($fk.column) references $($fk.referencedTable)" `
                    -Source "code_analysis"
            }
        }
    }
    
    # Add stored procedures
    foreach ($sp in $databaseData.storedProcedures) {
        Add-GraphNode -Type "DATABASE_STORED_PROCEDURE" -Name $sp.name -Metadata @{
            schema = $sp.schema
        }
    }
    
    Write-Host "   ✅ Processed $($databaseData.tables.Count) tables, $($databaseData.storedProcedures.Count) stored procedures" -ForegroundColor Green
}

# ========================================
# 3. Process UI Components
# ========================================
if (Test-Path $uiComponentsFile) {
    Write-Host "🔍 Processing ui-components.json..." -ForegroundColor Cyan
    $uiData = Get-Content $uiComponentsFile -Raw | ConvertFrom-Json
    
    # Add UI components
    foreach ($component in $uiData.components) {
        $componentId = Add-GraphNode -Type "UI_COMPONENT" -Name $component.name -Metadata @{
            file = $component.file
            testIds = $component.testIds
        }
        
        # Infer API calls from component name patterns
        # Example: ShareButton → POST /api/.../Share
        if ($component.name -match "Share") {
            $shareEndpoint = $graph.nodes | Where-Object { 
                $_.type -eq "API_ENDPOINT" -and $_.name -match "Share"
            } | Select-Object -First 1
            
            if ($shareEndpoint) {
                Add-GraphEdge -From $componentId -To $shareEndpoint.id -Type "CALLS" `
                    -Evidence "Component name '$($component.name)' suggests Share functionality" `
                    -Source "inference"
            }
        }
    }
    
    # Add pages
    foreach ($page in $uiData.pages) {
        Add-GraphNode -Type "UI_PAGE" -Name $page.name -Metadata @{
            file = $page.file
            route = $page.route
        }
    }
    
    Write-Host "   ✅ Processed $($uiData.components.Count) components, $($uiData.pages.Count) pages" -ForegroundColor Green
}

# ========================================
# 4. Calculate Graph Statistics
# ========================================
Write-Host ""
Write-Host "📈 Calculating graph statistics..." -ForegroundColor Yellow

$graph.metadata.totalNodes = $graph.nodes.Count
$graph.metadata.totalEdges = $graph.edges.Count

# Average confidence
if ($graph.nodes.Count -gt 0) {
    $avgNodeConfidence = ($graph.nodes | Measure-Object -Property confidence -Average).Average
    $avgEdgeConfidence = if ($graph.edges.Count -gt 0) { 
        ($graph.edges | Measure-Object -Property confidence -Average).Average 
    } else { 0 }
    $graph.metadata.averageConfidence = [Math]::Round(($avgNodeConfidence + $avgEdgeConfidence) / 2, 2)
}

# Nodes by type
$graph.nodes | Group-Object -Property type | ForEach-Object {
    $graph.metadata.nodesByType[$_.Name] = $_.Count
}

# Edges by type
$graph.edges | Group-Object -Property type | ForEach-Object {
    $graph.metadata.edgesByType[$_.Name] = $_.Count
}

# ========================================
# 5. Save Knowledge Graph
# ========================================
Write-Host ""
Write-Host "💾 Saving knowledge graph..." -ForegroundColor Yellow

$graphJson = $graph | ConvertTo-Json -Depth 10
$graphJson | Out-File -FilePath $OutputPath -Encoding UTF8

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host "✅ Knowledge Graph Built Successfully!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Graph Statistics:" -ForegroundColor Cyan
Write-Host "   Total Nodes: $($graph.metadata.totalNodes)" -ForegroundColor White
Write-Host "   Total Edges: $($graph.metadata.totalEdges)" -ForegroundColor White
Write-Host "   Avg Confidence: $($graph.metadata.averageConfidence)" -ForegroundColor White
Write-Host ""
Write-Host "📁 Nodes by Type:" -ForegroundColor Cyan
$graph.metadata.nodesByType.GetEnumerator() | Sort-Object Value -Descending | ForEach-Object {
    Write-Host "   $($_.Key): $($_.Value)" -ForegroundColor Gray
}
Write-Host ""
Write-Host "🔗 Edges by Type:" -ForegroundColor Cyan
$graph.metadata.edgesByType.GetEnumerator() | Sort-Object Value -Descending | ForEach-Object {
    Write-Host "   $($_.Key): $($_.Value)" -ForegroundColor Gray
}
Write-Host ""
Write-Host "📄 Output saved to: $OutputPath" -ForegroundColor White
Write-Host ""
