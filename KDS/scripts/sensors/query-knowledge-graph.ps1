<#
.SYNOPSIS
KDS Knowledge Graph Query Functions - Query relationship map

.DESCRIPTION
Utility functions for querying the knowledge graph built by build-knowledge-graph.ps1

Functions:
- Find-Node: Search for nodes by name or type
- Find-RelatedNodes: Get nodes connected to a specific node
- Get-NodePath: Trace path between two nodes
- Filter-ByConfidence: Filter nodes/edges by confidence threshold
- Export-GraphSummary: Generate readable summary

.EXAMPLE
. .\query-knowledge-graph.ps1
$graph = Get-KnowledgeGraph
Find-Node -Graph $graph -Name "Canvas"

.NOTES
Version: 1.0.0
Part of: KDS v5.0 Brain System - Week 3
#>

$ErrorActionPreference = "Stop"

# Load knowledge graph from file
function Get-KnowledgeGraph {
    param(
        [string]$GraphPath = "D:\PROJECTS\NOOR CANVAS\KDS\context\knowledge-graph.json"
    )
    
    if (-not (Test-Path $GraphPath)) {
        Write-Error "Knowledge graph not found: $GraphPath. Run build-knowledge-graph.ps1 first."
    }
    
    $graphJson = Get-Content $GraphPath -Raw | ConvertFrom-Json
    return $graphJson
}

# Find nodes by name pattern (supports wildcards)
function Find-Node {
    param(
        [Parameter(Mandatory=$true)]
        [PSCustomObject]$Graph,
        
        [string]$Name,
        [string]$Type,
        [double]$MinConfidence = 0.0
    )
    
    $results = $Graph.nodes
    
    if ($Name) {
        $results = $results | Where-Object { $_.name -like "*$Name*" }
    }
    
    if ($Type) {
        $results = $results | Where-Object { $_.type -eq $Type }
    }
    
    $results = $results | Where-Object { $_.confidence -ge $MinConfidence }
    
    return $results | Sort-Object -Property confidence -Descending
}

# Find nodes related to a given node
function Find-RelatedNodes {
    param(
        [Parameter(Mandatory=$true)]
        [PSCustomObject]$Graph,
        
        [Parameter(Mandatory=$true)]
        [string]$NodeId,
        
        [string]$RelationType,
        [string]$Direction = "both",  # "outgoing", "incoming", "both"
        [int]$MaxHops = 1
    )
    
    $relatedNodeIds = @{}
    $currentHopIds = @($NodeId)
    
    for ($hop = 0; $hop -lt $MaxHops; $hop++) {
        $nextHopIds = @()
        
        foreach ($currentId in $currentHopIds) {
            # Find outgoing edges
            if ($Direction -in @("outgoing", "both")) {
                $outgoingEdges = $Graph.edges | Where-Object { $_.from -eq $currentId }
                if ($RelationType) {
                    $outgoingEdges = $outgoingEdges | Where-Object { $_.type -eq $RelationType }
                }
                
                foreach ($edge in $outgoingEdges) {
                    if (-not $relatedNodeIds.ContainsKey($edge.to)) {
                        $relatedNodeIds[$edge.to] = $hop + 1
                        $nextHopIds += $edge.to
                    }
                }
            }
            
            # Find incoming edges
            if ($Direction -in @("incoming", "both")) {
                $incomingEdges = $Graph.edges | Where-Object { $_.to -eq $currentId }
                if ($RelationType) {
                    $incomingEdges = $incomingEdges | Where-Object { $_.type -eq $RelationType }
                }
                
                foreach ($edge in $incomingEdges) {
                    if (-not $relatedNodeIds.ContainsKey($edge.from)) {
                        $relatedNodeIds[$edge.from] = $hop + 1
                        $nextHopIds += $edge.from
                    }
                }
            }
        }
        
        $currentHopIds = $nextHopIds
    }
    
    # Retrieve actual node objects
    $relatedNodes = @()
    foreach ($id in $relatedNodeIds.Keys) {
        $node = $Graph.nodes | Where-Object { $_.id -eq $id }
        if ($node) {
            $relatedNodes += [PSCustomObject]@{
                Node = $node
                Hops = $relatedNodeIds[$id]
            }
        }
    }
    
    return $relatedNodes | Sort-Object -Property Hops
}

# Trace path between two nodes
function Get-NodePath {
    param(
        [Parameter(Mandatory=$true)]
        [PSCustomObject]$Graph,
        
        [Parameter(Mandatory=$true)]
        [string]$FromNodeId,
        
        [Parameter(Mandatory=$true)]
        [string]$ToNodeId,
        
        [int]$MaxDepth = 5
    )
    
    # Breadth-first search
    $queue = @(@{
        NodeId = $FromNodeId
        Path = @($FromNodeId)
    })
    
    $visited = @{}
    $visited[$FromNodeId] = $true
    
    while ($queue.Count -gt 0) {
        $current = $queue[0]
        $queue = $queue[1..($queue.Count - 1)]
        
        if ($current.NodeId -eq $ToNodeId) {
            # Found path!
            $pathNodes = @()
            foreach ($nodeId in $current.Path) {
                $node = $Graph.nodes | Where-Object { $_.id -eq $nodeId }
                if ($node) {
                    $pathNodes += $node
                }
            }
            return $pathNodes
        }
        
        if ($current.Path.Count -ge $MaxDepth) {
            continue
        }
        
        # Find all outgoing edges
        $edges = $Graph.edges | Where-Object { $_.from -eq $current.NodeId }
        
        foreach ($edge in $edges) {
            if (-not $visited.ContainsKey($edge.to)) {
                $visited[$edge.to] = $true
                $newPath = $current.Path + @($edge.to)
                $queue += @{
                    NodeId = $edge.to
                    Path = $newPath
                }
            }
        }
    }
    
    # No path found
    return $null
}

# Filter nodes/edges by confidence threshold
function Filter-ByConfidence {
    param(
        [Parameter(Mandatory=$true)]
        [PSCustomObject]$Graph,
        
        [double]$MinConfidence = 0.7,
        [switch]$NodesOnly,
        [switch]$EdgesOnly
    )
    
    $filteredGraph = @{
        version = $Graph.version
        lastUpdated = $Graph.lastUpdated
        metadata = $Graph.metadata
        nodes = @()
        edges = @()
    }
    
    if (-not $EdgesOnly) {
        $filteredGraph.nodes = $Graph.nodes | Where-Object { $_.confidence -ge $MinConfidence }
    }
    
    if (-not $NodesOnly) {
        $filteredGraph.edges = $Graph.edges | Where-Object { $_.confidence -ge $MinConfidence }
    }
    
    return $filteredGraph
}

# Export readable summary
function Export-GraphSummary {
    param(
        [Parameter(Mandatory=$true)]
        [PSCustomObject]$Graph,
        
        [string]$OutputPath
    )
    
    $summary = @"
# Knowledge Graph Summary
**Generated:** $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
**Version:** $($Graph.version)
**Last Updated:** $($Graph.lastUpdated)

## Statistics
- **Total Nodes:** $($Graph.metadata.totalNodes)
- **Total Edges:** $($Graph.metadata.totalEdges)
- **Average Confidence:** $($Graph.metadata.averageConfidence)

## Nodes by Type
"@
    
    foreach ($type in ($Graph.metadata.nodesByType.PSObject.Properties | Sort-Object Value -Descending)) {
        $summary += "`n- **$($type.Name):** $($type.Value)"
    }
    
    $summary += "`n`n## Edges by Type`n"
    
    foreach ($type in ($Graph.metadata.edgesByType.PSObject.Properties | Sort-Object Value -Descending)) {
        $summary += "`n- **$($type.Name):** $($type.Value)"
    }
    
    $summary += "`n`n## High-Confidence Nodes (>= 0.9)`n"
    
    $highConfidenceNodes = $Graph.nodes | Where-Object { $_.confidence -ge 0.9 } | Sort-Object -Property confidence -Descending | Select-Object -First 20
    
    foreach ($node in $highConfidenceNodes) {
        $summary += "`n- **$($node.name)** ($($node.type)) - Confidence: $($node.confidence)"
    }
    
    if ($OutputPath) {
        $summary | Out-File -FilePath $OutputPath -Encoding UTF8
        Write-Host "✅ Summary exported to: $OutputPath" -ForegroundColor Green
    }
    
    return $summary
}

# Display graph statistics
function Show-GraphStats {
    param(
        [Parameter(Mandatory=$true)]
        [PSCustomObject]$Graph
    )
    
    Write-Host ""
    Write-Host "📊 Knowledge Graph Statistics" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Total Nodes: $($Graph.metadata.totalNodes)" -ForegroundColor White
    Write-Host "Total Edges: $($Graph.metadata.totalEdges)" -ForegroundColor White
    Write-Host "Avg Confidence: $($Graph.metadata.averageConfidence)" -ForegroundColor White
    Write-Host ""
    Write-Host "Nodes by Type:" -ForegroundColor Yellow
    $Graph.metadata.nodesByType.PSObject.Properties | Sort-Object Value -Descending | ForEach-Object {
        Write-Host "  $($_.Name): $($_.Value)" -ForegroundColor Gray
    }
    Write-Host ""
    Write-Host "Edges by Type:" -ForegroundColor Yellow
    $Graph.metadata.edgesByType.PSObject.Properties | Sort-Object Value -Descending | ForEach-Object {
        Write-Host "  $($_.Name): $($_.Value)" -ForegroundColor Gray
    }
    Write-Host ""
}

# Export functions for module-style usage
Export-ModuleMember -Function Get-KnowledgeGraph, Find-Node, Find-RelatedNodes, Get-NodePath, Filter-ByConfidence, Export-GraphSummary, Show-GraphStats

Write-Host "✅ Knowledge Graph Query functions loaded" -ForegroundColor Green
Write-Host "   Available functions:" -ForegroundColor Gray
Write-Host "   - Get-KnowledgeGraph" -ForegroundColor Gray
Write-Host "   - Find-Node" -ForegroundColor Gray
Write-Host "   - Find-RelatedNodes" -ForegroundColor Gray
Write-Host "   - Get-NodePath" -ForegroundColor Gray
Write-Host "   - Filter-ByConfidence" -ForegroundColor Gray
Write-Host "   - Export-GraphSummary" -ForegroundColor Gray
Write-Host "   - Show-GraphStats" -ForegroundColor Gray
Write-Host ""
