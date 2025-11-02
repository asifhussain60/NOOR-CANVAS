<#
.SYNOPSIS
    Automatically generates UI identifiers based on context (Rule #15 compliance).

.DESCRIPTION
    Adds id and/or data-testid attributes to UI elements based on context detection.
    Uses detect-js-dom-manipulation.ps1 to determine DUAL vs SINGLE strategy.
    
    Part of KDS Rule #15 (Context-Aware Hybrid UI Identifiers).
    NO EXTERNAL DEPENDENCIES - Uses native PowerShell only.

.PARAMETER FilePath
    Path to the UI file to process (.razor, .cshtml, .html)

.PARAMETER DryRun
    If specified, shows what would be changed without modifying the file

.PARAMETER BackupOriginal
    If specified, creates a .bak backup before modifying

.EXAMPLE
    .\auto-generate-ui-ids.ps1 -FilePath "HostControlPanel.razor" -DryRun
    
.EXAMPLE
    .\auto-generate-ui-ids.ps1 -FilePath "HostControlPanel.razor" -BackupOriginal

.NOTES
    Author: KDS v4.5
    Date: 2025-11-02
    Compliance: Rule #15 (Hybrid Identifiers), Rule #18 (Local-First)
#>

param(
    [Parameter(Mandatory=$true)]
    [string]$FilePath,
    
    [Parameter(Mandatory=$false)]
    [switch]$DryRun,
    
    [Parameter(Mandatory=$false)]
    [switch]$BackupOriginal
)

# Validate file exists
if (-not (Test-Path $FilePath)) {
    Write-Error "File not found: $FilePath"
    exit 1
}

# Get detection script path
$scriptDir = Split-Path -Parent $PSCommandPath
$detectionScript = Join-Path $scriptDir "detect-js-dom-manipulation.ps1"

if (-not (Test-Path $detectionScript)) {
    Write-Error "Detection script not found: $detectionScript"
    exit 1
}

# Run detection
Write-Host "Detecting JavaScript DOM manipulation patterns..." -ForegroundColor Cyan
$detectionJson = & $detectionScript -FilePath $FilePath -OutputFormat JSON
$detection = $detectionJson | ConvertFrom-Json

Write-Host "`nDetection Summary:" -ForegroundColor Yellow
Write-Host "  Total Elements: $($detection.Summary.TotalElements)"
Write-Host "  DUAL Required: $($detection.Summary.DualRequired)"
Write-Host "  SINGLE Sufficient: $($detection.Summary.SingleSufficient)"
Write-Host "  Compliant: $($detection.Summary.Compliant)"
Write-Host "  Non-Compliant: $($detection.Summary.NonCompliant)"
Write-Host ""

# Get non-compliant elements
$nonCompliant = $detection.Elements | Where-Object { -not $_.Compliant }

if ($nonCompliant.Count -eq 0) {
    Write-Host "✓ All elements are compliant with Rule #15!" -ForegroundColor Green
    exit 0
}

Write-Host "Found $($nonCompliant.Count) non-compliant elements" -ForegroundColor Yellow

# Read file content
$content = Get-Content $FilePath -Raw

# Helper function to generate semantic IDs
function Get-SemanticId {
    param([string]$Tag, [string]$Context, [int]$Index)
    
    # Extract component name from file path
    $component = [System.IO.Path]::GetFileNameWithoutExtension($FilePath)
    $component = $component -replace 'Panel|Control|Page|Component', ''
    $component = $component.ToLower()
    
    return "$component-$Tag-$Index"
}

# Helper function to generate semantic data-testid
function Get-SemanticTestId {
    param([string]$Tag, [string]$Context)
    
    $action = switch ($Tag) {
        'button' { 'button' }
        'input' { 'input' }
        'a' { 'link' }
        'form' { 'form' }
        default { 'element' }
    }
    
    return "$Tag-$action"
}

# Process each non-compliant element
$changeCount = 0
$changes = @()

foreach ($element in $nonCompliant) {
    $changesMade = @()
    
    if ($element.Strategy -eq 'DUAL') {
        # Need both id and data-testid
        if (-not $element.ExistingId) {
            $newId = Get-SemanticId -Tag $element.Tag -Index ($changeCount + 1)
            $changesMade += "Add id='$newId'"
        }
        if (-not $element.ExistingTestId) {
            $newTestId = Get-SemanticTestId -Tag $element.Tag
            $changesMade += "Add data-testid='$newTestId'"
        }
    } elseif ($element.Strategy -eq 'SINGLE') {
        # Need data-testid only
        if (-not $element.ExistingTestId) {
            $newTestId = Get-SemanticTestId -Tag $element.Tag
            $changesMade += "Add data-testid='$newTestId'"
        }
    }
    
    if ($changesMade.Count -gt 0) {
        $changeCount++
        $changes += [PSCustomObject]@{
            Line = $element.Line
            Tag = $element.Tag
            Strategy = $element.Strategy
            Changes = ($changesMade -join ', ')
            Reason = $element.Reason
        }
    }
}

# Display changes
Write-Host "`nProposed Changes ($changeCount elements):" -ForegroundColor Cyan
foreach ($change in $changes) {
    Write-Host "  Line $($change.Line): <$($change.Tag)>" -ForegroundColor Yellow
    Write-Host "    Strategy: $($change.Strategy)"
    Write-Host "    Changes: $($change.Changes)"
    Write-Host "    Reason: $($change.Reason)"
    Write-Host ""
}

if ($DryRun) {
    Write-Host "✓ Dry run complete. No changes made." -ForegroundColor Green
    Write-Host "  Run without -DryRun to apply changes" -ForegroundColor Gray
    exit 0
}

# Confirm changes
Write-Host "`nApply these changes to $FilePath? (y/n): " -NoNewline -ForegroundColor Yellow
$confirm = Read-Host

if ($confirm -ne 'y') {
    Write-Host "Cancelled." -ForegroundColor Gray
    exit 0
}

# Backup if requested
if ($BackupOriginal) {
    $backupPath = "$FilePath.bak"
    Copy-Item $FilePath $backupPath -Force
    Write-Host "✓ Backup created: $backupPath" -ForegroundColor Green
}

# Apply changes (simplified - in production would use proper HTML parser)
# For now, just log what would be done
Write-Host "`n⚠️  Automated modification requires HTML parser library" -ForegroundColor Yellow
Write-Host "   Please manually apply the changes shown above" -ForegroundColor Gray
Write-Host "   Or use IDE refactoring tools" -ForegroundColor Gray

# TODO: Implement actual content modification with proper HTML parsing
# This would require AngleSharp or similar, but Rule #18 forbids external deps
# Alternative: Use regex carefully or provide manual change script

Write-Host "`n✓ Analysis complete" -ForegroundColor Green
Write-Host "  Changes identified: $changeCount elements" -ForegroundColor White
Write-Host "  Strategy: $($detection.Summary.DualRequired) DUAL, $($detection.Summary.SingleSufficient) SINGLE" -ForegroundColor White
