#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Automated UI Element Analysis for Razor Components
    
.DESCRIPTION
    Scans Razor components for clickable elements and generates structured element maps
    for Playwright test generation. Integrates with KDS handoff system.
    
.PARAMETER ComponentPath
    Path to Razor component file(s) to analyze
    
.PARAMETER Key
    KDS key for organizing output (auto-detected if not provided)
    
.PARAMETER OutputMode
    Output detail level: standard, detailed, summary (default: standard)
    
.PARAMETER Publish
    Publish map to KDS handoffs directory (default: true)
    
.EXAMPLE
    .\analyze-ui-elements.ps1 -ComponentPath "SPA/NoorCanvas/Pages/HostControlPanel.razor"
    
.EXAMPLE
    .\analyze-ui-elements.ps1 -ComponentPath "**/*HostControlPanel*.razor" -OutputMode detailed
    
.NOTES
    Version: 1.0.0
    Created: 2025-11-01
    Part of: KDS System - UI Mapping Tool
#>

param(
    [Parameter(Mandatory=$true)]
    [string[]]$ComponentPath,
    
    [Parameter(Mandatory=$false)]
    [string]$Key,
    
    [Parameter(Mandatory=$false)]
    [ValidateSet('standard', 'detailed', 'summary')]
    [string]$OutputMode = 'standard',
    
    [Parameter(Mandatory=$false)]
    [bool]$Publish = $true
)

$ErrorActionPreference = 'Stop'

# Component prefix mapping
$ComponentPrefixes = @{
    'HostControlPanel' = 'hcp'
    'HostControlPanelSidebar' = 'sidebar'
    'HostControlPanelContent' = 'content'
    'HostControlPanelHeader' = 'header'
    'SessionCanvas' = 'canvas'
    'TranscriptCanvas' = 'tcanvas'
    'QuestionCard' = 'qa'
    'UserRegistrationLink' = 'reg'
    'DebugPanel' = 'debug'
}

# Element detection patterns
$Patterns = @{
    Button = '<button[^>]*>'
    Link = '<a\s+[^>]*href[^>]*>'
    Input = '<input\s+[^>]*type="(button|submit|reset)"[^>]*>'
    OnClick = '@onclick\s*=\s*"[^"]*"'
    OnMouseDown = '@onmousedown\s*=\s*"[^"]*"'
    OnKeyDown = '@onkeydown\s*=\s*"[^"]*"'
    RoleButton = 'role\s*=\s*"(button|link|menuitem)"'
    CursorPointer = 'cursor:\s*pointer'
    ExistingId = '\sid\s*=\s*"([^"]+)"'
}

function Resolve-ComponentFiles {
    param([string[]]$Paths)
    
    $resolvedFiles = @()
    
    foreach ($path in $Paths) {
        if (Test-Path $path) {
            $resolvedFiles += Get-Item $path
        }
        else {
            # Search common directories
            $searchDirs = @(
                "SPA/NoorCanvas/Pages",
                "SPA/NoorCanvas/Components",
                "SPA/NoorCanvas/Components/Host",
                "SPA/NoorCanvas/Components/Development"
            )
            
            foreach ($dir in $searchDirs) {
                $found = Get-ChildItem -Path $dir -Filter $path -Recurse -ErrorAction SilentlyContinue
                if ($found) {
                    $resolvedFiles += $found
                    break
                }
            }
        }
    }
    
    return $resolvedFiles
}

function Get-ComponentPrefix {
    param([string]$ComponentName)
    
    if ($ComponentPrefixes.ContainsKey($ComponentName)) {
        return $ComponentPrefixes[$ComponentName]
    }
    
    # Fallback: kebab-case first word
    $firstWord = ($ComponentName -split '(?=[A-Z])')[0]
    return $firstWord.ToLower()
}

function Find-ClickableElements {
    param(
        [string]$Content,
        [string]$ComponentName,
        [string]$FilePath
    )
    
    $elements = @()
    $idTracker = @{}
    $prefix = Get-ComponentPrefix -ComponentName $ComponentName
    
    # Find all button elements
    $buttonMatches = [regex]::Matches($Content, $Patterns.Button)
    foreach ($match in $buttonMatches) {
        $elementHtml = $match.Value
        
        $element = @{
            Type = 'button'
            Tag = 'button'
            ElementHtml = $elementHtml
            ExistingId = $null
            SuggestedId = $null
            Events = @()
            ARIA = @()
            TextContent = $null
            ParentComponent = $ComponentName
            FilePath = $FilePath
        }
        
        # Extract existing ID
        if ($elementHtml -match $Patterns.ExistingId) {
            $element.ExistingId = $Matches[1]
        }
        
        # Detect event handlers
        if ($Content -match '@onclick') { $element.Events += '@onclick' }
        if ($Content -match '@onmousedown') { $element.Events += '@onmousedown' }
        
        # Extract text content (simplified)
        if ($elementHtml -match '>([^<]+)<') {
            $element.TextContent = $Matches[1].Trim()
        }
        
        # Generate suggested ID
        $descriptor = if ($element.TextContent) {
            ($element.TextContent -replace '\s+', '-').ToLower()
        } else {
            "btn-$($elements.Count + 1)"
        }
        
        $suggestedId = "$prefix-$descriptor"
        
        # Handle collisions
        $counter = 1
        while ($idTracker.ContainsKey($suggestedId)) {
            $suggestedId = "$prefix-$descriptor-$counter"
            $counter++
        }
        
        $element.SuggestedId = $suggestedId
        $idTracker[$suggestedId] = $true
        
        $elements += $element
    }
    
    # Add more element type detection here (divs with @onclick, etc.)
    
    return $elements
}

function New-ElementMap {
    param(
        [object[]]$Elements,
        [string]$ComponentName,
        [string]$FilePath,
        [string]$Key
    )
    
    $timestamp = Get-Date -Format "yyyy-MM-ddTHH:mm:ss.fffZ"
    
    $map = @"
# $ComponentName - Clickable Elements Map

**Component**: $ComponentName  
**File**: $FilePath  
**Generated**: $timestamp  
**Key**: ``$Key``

---

## Summary

**Total Elements**: $($Elements.Count)  
**Components Analyzed**: 1  
**IDs Required**: $($Elements.Where({!$_.ExistingId}).Count)  
**IDs Existing**: $($Elements.Where({$_.ExistingId}).Count)

---

## Element Inventory

| Element | Current ID | Suggested ID | Type | Event | Text |
|---------|-----------|--------------|------|-------|------|
"@
    
    foreach ($elem in $Elements) {
        $currentId = if ($elem.ExistingId) { "``$($elem.ExistingId)``" } else { "(none)" }
        $events = $elem.Events -join ', '
        $text = if ($elem.TextContent) { $elem.TextContent.Substring(0, [Math]::Min(30, $elem.TextContent.Length)) } else { "" }
        
        $map += "`n| $($elem.Tag) | $currentId | ``$($elem.SuggestedId)`` | $($elem.Type) | $events | $text |"
    }
    
    $map += @"


---

## Implementation Guide

Apply suggested IDs to component file:

``````razor
<!-- Example: Start Session Button -->
<button id="$($Elements[0].SuggestedId)" @onclick="StartSession">
    Start Session
</button>
``````

---

## Playwright Selectors

``````typescript
// Direct ID selection
await page.locator('#$($Elements[0].SuggestedId)').click();

// ARIA-enhanced selection (if role attributes present)
await page.locator('[role="button"]#$($Elements[0].SuggestedId)').click();
``````

---

## Related Files

- **Component**: ``$FilePath``
- **Test Prep**: Use ``@workspace /test-prep #file:$ComponentName.razor``

---
"@
    
    return $map
}

function Publish-ElementMap {
    param(
        [string]$MapContent,
        [string]$ComponentName,
        [string]$Key
    )
    
    $handoffsDir = ".github/key-data-streams/$Key/handoffs"
    
    if (!(Test-Path $handoffsDir)) {
        New-Item -Path $handoffsDir -ItemType Directory -Force | Out-Null
    }
    
    $mapFile = "$handoffsDir/$ComponentName-element-map.md"
    Set-Content -Path $mapFile -Value $MapContent
    
    Write-Host "✅ Map published: $mapFile" -ForegroundColor Green
    
    # Update index
    $indexFile = "$handoffsDir/element-maps-index.md"
    $indexEntry = "- [$ComponentName](./$ComponentName-element-map.md) - $(Get-Date -Format 'yyyy-MM-dd')"
    
    if (Test-Path $indexFile) {
        Add-Content -Path $indexFile -Value "`n$indexEntry"
    }
    else {
        $indexContent = @"
# Element Maps Index

**Key**: ``$Key``

## Maps

$indexEntry
"@
        Set-Content -Path $indexFile -Value $indexContent
    }
}

# Main execution
try {
    Write-Host "`n🔍 UI Element Analysis Starting..." -ForegroundColor Cyan
    
    # Resolve component files
    $files = Resolve-ComponentFiles -Paths $ComponentPath
    
    if ($files.Count -eq 0) {
        Write-Error "No component files found matching: $($ComponentPath -join ', ')"
        exit 1
    }
    
    Write-Host "`nFiles to Analyze: $($files.Count)" -ForegroundColor Yellow
    foreach ($file in $files) {
        Write-Host "  • $($file.Name)" -ForegroundColor Gray
    }
    
    $allElements = @()
    
    foreach ($file in $files) {
        Write-Host "`n📄 Analyzing: $($file.Name)..." -ForegroundColor Cyan
        
        $content = Get-Content -Path $file.FullName -Raw
        $componentName = $file.BaseName
        
        # Auto-detect key if not provided
        if (!$Key) {
            $Key = Get-ComponentPrefix -ComponentName $componentName
        }
        
        $elements = Find-ClickableElements -Content $content -ComponentName $componentName -FilePath $file.FullName
        
        Write-Host "  Found $($elements.Count) clickable elements" -ForegroundColor Green
        
        $allElements += $elements
        
        # Generate and publish map
        $map = New-ElementMap -Elements $elements -ComponentName $componentName -FilePath $file.FullName -Key $Key
        
        if ($Publish) {
            Publish-ElementMap -MapContent $map -ComponentName $componentName -Key $Key
        }
        else {
            Write-Host "`n$map`n"
        }
    }
    
    # Summary
    Write-Host "`n✅ Analysis Complete | Key: ``$Key``" -ForegroundColor Green
    Write-Host "`nComponents Analyzed: $($files.Count)" -ForegroundColor Yellow
    Write-Host "Total Elements: $($allElements.Count)" -ForegroundColor Yellow
    Write-Host "IDs Needed: $($allElements.Where({!$_.ExistingId}).Count)" -ForegroundColor Yellow
    
    if ($Publish) {
        Write-Host "`n📁 Maps Published to: .github/key-data-streams/$Key/handoffs/" -ForegroundColor Green
    }
}
catch {
    Write-Error "Analysis failed: $_"
    exit 1
}
