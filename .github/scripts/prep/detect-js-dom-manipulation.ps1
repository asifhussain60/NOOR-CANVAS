<#
.SYNOPSIS
    Detects JavaScript DOM manipulation patterns in UI files to determine identifier strategy.

.DESCRIPTION
    Scans Razor, HTML, or other UI files for JavaScript DOM manipulation patterns.
    Returns list of elements with recommendation: DUAL (id + data-testid) or SINGLE (data-testid only).
    
    Part of KDS Rule #15 (Context-Aware Hybrid UI Identifiers).
    NO EXTERNAL DEPENDENCIES - Uses native PowerShell only.

.PARAMETER FilePath
    Path to the UI file to analyze (.razor, .cshtml, .html, .vue, .tsx)

.PARAMETER OutputFormat
    Output format: JSON (default), CSV, or Text

.EXAMPLE
    .\detect-js-dom-manipulation.ps1 -FilePath "HostControlPanel.razor"
    
.EXAMPLE
    .\detect-js-dom-manipulation.ps1 -FilePath "HostControlPanel.razor" -OutputFormat CSV

.NOTES
    Author: KDS v4.5
    Date: 2025-11-02
    Compliance: Rule #18 (Local-First Dependencies)
#>

param(
    [Parameter(Mandatory=$true)]
    [string]$FilePath,
    
    [Parameter(Mandatory=$false)]
    [ValidateSet('JSON', 'CSV', 'Text')]
    [string]$OutputFormat = 'JSON'
)

# Validate file exists
if (-not (Test-Path $FilePath)) {
    Write-Error "File not found: $FilePath"
    exit 1
}

# Read file content
$content = Get-Content $FilePath -Raw

# JavaScript DOM manipulation patterns (Rule #15 compliance)
$jsPatterns = @{
    'getElementById' = 'getElementById\s*\('
    'querySelector' = 'querySelector(All)?\s*\('
    'focus' = '\.focus\s*\(\)'
    'innerHTML' = '\.innerHTML\s*='
    'textContent' = '\.textContent\s*='
    'innerText' = '\.innerText\s*='
    'style' = '\.style\.'
    'classList' = '\.classList\.'
    'addEventListener' = '\.addEventListener\s*\('
    'setAttribute' = '\.setAttribute\s*\('
    'removeAttribute' = '\.removeAttribute\s*\('
    'appendChild' = '\.appendChild\s*\('
    'removeChild' = '\.removeChild\s*\('
    'createElement' = 'createElement\s*\('
}

# Blazor-only patterns (no JavaScript manipulation)
$blazorPatterns = @(
    '@onclick',
    '@onchange',
    '@onsubmit',
    '@bind',
    '@ref',
    '@key'
)

# Extract all interactive elements with id or data-testid
$elementRegex = '<(button|input|div|span|section|form|textarea|select|a)\s+[^>]*?(?:id="([^"]+)"|data-testid="([^"]+)")[^>]*?>'
$elements = [regex]::Matches($content, $elementRegex, 'IgnoreCase')

$results = @()

foreach ($element in $elements) {
    $fullMatch = $element.Groups[0].Value
    $tagName = $element.Groups[1].Value
    $existingId = $element.Groups[2].Value
    $existingTestId = $element.Groups[3].Value
    
    # Get line number
    $lineNumber = ($content.Substring(0, $element.Index) -split "`n").Count
    
    # Determine if element has JavaScript manipulation
    $hasJsManipulation = $false
    $jsPatternFound = @()
    
    # Check if element ID is referenced in JavaScript patterns
    if ($existingId) {
        foreach ($patternName in $jsPatterns.Keys) {
            $pattern = $jsPatterns[$patternName]
            # Look for patterns that reference this ID
            if ($content -match "$pattern.*?[`"']$existingId[`"']" -or 
                $content -match "[`"']$existingId[`"'].*?$pattern") {
                $hasJsManipulation = $true
                $jsPatternFound += $patternName
            }
        }
    }
    
    # Check if element has Blazor-only directives
    $hasBlazorOnly = $false
    foreach ($blazorPattern in $blazorPatterns) {
        if ($fullMatch -match [regex]::Escape($blazorPattern)) {
            $hasBlazorOnly = $true
            break
        }
    }
    
    # Determine strategy
    $strategy = if ($hasJsManipulation) {
        'DUAL'
    } elseif ($hasBlazorOnly) {
        'SINGLE'
    } else {
        'SINGLE' # Default for static elements
    }
    
    # Check compliance
    $hasId = -not [string]::IsNullOrWhiteSpace($existingId)
    $hasTestId = -not [string]::IsNullOrWhiteSpace($existingTestId)
    
    $compliant = switch ($strategy) {
        'DUAL' { $hasId -and $hasTestId }
        'SINGLE' { $hasTestId }
    }
    
    # Generate suggestions if not compliant
    $suggestedId = $null
    $suggestedTestId = $null
    
    if ($strategy -eq 'DUAL' -and -not $hasId) {
        # Generate id from context (simple heuristic)
        $suggestedId = "$tagName-element-$(Get-Random -Maximum 9999)"
    }
    
    if (-not $hasTestId) {
        # Generate data-testid from context
        $suggestedTestId = "$tagName-action-element"
    }
    
    $results += [PSCustomObject]@{
        Tag = $tagName
        Line = $lineNumber
        ExistingId = $existingId
        ExistingTestId = $existingTestId
        Strategy = $strategy
        Reason = if ($hasJsManipulation) { 
            "JavaScript manipulation: $($jsPatternFound -join ', ')" 
        } elseif ($hasBlazorOnly) {
            "Pure Blazor component"
        } else {
            "Static element"
        }
        Compliant = $compliant
        SuggestedId = $suggestedId
        SuggestedTestId = $suggestedTestId
        JsPatternsFound = ($jsPatternFound -join ', ')
    }
}

# Summary statistics
$totalElements = $results.Count
$dualRequired = ($results | Where-Object { $_.Strategy -eq 'DUAL' }).Count
$singleSufficient = ($results | Where-Object { $_.Strategy -eq 'SINGLE' }).Count
$compliant = ($results | Where-Object { $_.Compliant -eq $true }).Count
$nonCompliant = $totalElements - $compliant

# Output based on format
switch ($OutputFormat) {
    'JSON' {
        @{
            FilePath = $FilePath
            Summary = @{
                TotalElements = $totalElements
                DualRequired = $dualRequired
                SingleSufficient = $singleSufficient
                Compliant = $compliant
                NonCompliant = $nonCompliant
                CompliancePercentage = if ($totalElements -gt 0) { 
                    [math]::Round(($compliant / $totalElements) * 100, 2) 
                } else { 
                    0 
                }
            }
            Elements = $results
        } | ConvertTo-Json -Depth 10
    }
    
    'CSV' {
        $results | Export-Csv -NoTypeInformation
    }
    
    'Text' {
        Write-Host "`n=== JavaScript DOM Manipulation Detection ===" -ForegroundColor Cyan
        Write-Host "File: $FilePath`n" -ForegroundColor White
        
        Write-Host "Summary:" -ForegroundColor Yellow
        Write-Host "  Total Elements: $totalElements"
        Write-Host "  DUAL Required (id + data-testid): $dualRequired"
        Write-Host "  SINGLE Sufficient (data-testid only): $singleSufficient"
        Write-Host "  Compliant: $compliant"
        Write-Host "  Non-Compliant: $nonCompliant"
        Write-Host "  Compliance: $(if ($totalElements -gt 0) { [math]::Round(($compliant / $totalElements) * 100, 2) } else { 0 })%"
        Write-Host ""
        
        Write-Host "Elements:" -ForegroundColor Yellow
        foreach ($result in $results) {
            $color = if ($result.Compliant) { 'Green' } else { 'Red' }
            $status = if ($result.Compliant) { '✓' } else { '✗' }
            
            Write-Host "  $status Line $($result.Line): <$($result.Tag)>" -ForegroundColor $color
            Write-Host "    Strategy: $($result.Strategy)"
            Write-Host "    Reason: $($result.Reason)"
            Write-Host "    Current: id='$($result.ExistingId)' data-testid='$($result.ExistingTestId)'"
            
            if (-not $result.Compliant) {
                if ($result.SuggestedId) {
                    Write-Host "    Suggested id: $($result.SuggestedId)" -ForegroundColor Yellow
                }
                if ($result.SuggestedTestId) {
                    Write-Host "    Suggested data-testid: $($result.SuggestedTestId)" -ForegroundColor Yellow
                }
            }
            Write-Host ""
        }
    }
}
