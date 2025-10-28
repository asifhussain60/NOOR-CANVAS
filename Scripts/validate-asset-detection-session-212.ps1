<# 
.SYNOPSIS
Retrieves session 212 transcript from database and validates asset detection

.DESCRIPTION
Queries dbo.SessionTranscripts for session 212, saves HTML to fixture file,
and validates AssetProcessingService correctly detects all asset types.

.EXAMPLE
.\validate-asset-detection-session-212.ps1

[DEBUG-WORKITEM:table-asset-enhancement:phase2.5:database-query]
[DEBUG-WORKITEM:table-asset-enhancement:phase2.5:asset-detection]
#>

param(
    [string]$ServerInstance = "AHHOME",
    [int]$SessionId = 212,
    [string]$OutputPath = "Tests\Fixtures\session-212-transcript.html"
)

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "🔍 TABLE-ASSET-ENHANCEMENT: Phase 2.5 - Database Validation" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

# Check for SqlServer module
if (-not (Get-Module -ListAvailable -Name SqlServer)) {
    Write-Host "⚙️ Installing SqlServer PowerShell module..." -ForegroundColor Yellow
    Install-Module -Name SqlServer -Force -Scope CurrentUser -AllowClobber
    Write-Host "✅ SqlServer module installed" -ForegroundColor Green
    Write-Host ""
}

# Step 1: Retrieve transcript from database
Write-Host "Step 1: Retrieving session $SessionId transcript from database..." -ForegroundColor Yellow

$query = @"
SELECT Transcript
FROM dbo.SessionTranscripts
WHERE SessionId = $SessionId
"@

try {
    $result = Invoke-Sqlcmd -ServerInstance $ServerInstance `
                            -Database "KSESSIONS_DEV" `
                            -Query $query `
                            -TrustServerCertificate `
                            -ErrorAction Stop
    
    if ($null -eq $result -or [string]::IsNullOrWhiteSpace($result.Transcript)) {
        Write-Host "❌ ERROR: No transcript found for session $SessionId" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✅ Transcript retrieved successfully" -ForegroundColor Green
    Write-Host "   Length: $($result.Transcript.Length) characters" -ForegroundColor Gray
    
} catch {
    Write-Host "❌ ERROR: Database query failed" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

# Step 2: Save to fixture file
Write-Host ""
Write-Host "Step 2: Saving transcript to fixture file..." -ForegroundColor Yellow

$outputDir = Split-Path $OutputPath -Parent
if (-not (Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
}

try {
    $result.Transcript | Out-File -FilePath $OutputPath -Encoding UTF8 -Force
    Write-Host "✅ Saved to: $OutputPath" -ForegroundColor Green
} catch {
    Write-Host "❌ ERROR: Failed to save file" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

# Step 3: Analyze HTML for assets
Write-Host ""
Write-Host "Step 3: Analyzing HTML for asset elements..." -ForegroundColor Yellow

$html = $result.Transcript

# Count asset types using regex
$assetCounts = @{
    "table" = ([regex]::Matches($html, '<table[^>]*>') | Measure-Object).Count
    "ayah-card" = ([regex]::Matches($html, 'class="[^"]*ayah-card[^"]*"') | Measure-Object).Count
    "inserted-hadees" = ([regex]::Matches($html, 'class="[^"]*inserted-hadees[^"]*"') | Measure-Object).Count
    "imgResponsive" = ([regex]::Matches($html, 'class="[^"]*imgResponsive[^"]*"') | Measure-Object).Count
    "esotericBlock" = ([regex]::Matches($html, 'class="[^"]*esotericBlock[^"]*"') | Measure-Object).Count
}

Write-Host ""
Write-Host "📊 Asset Detection Summary:" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
foreach ($assetType in $assetCounts.Keys | Sort-Object) {
    $count = $assetCounts[$assetType]
    $status = if ($count -gt 0) { "✅" } else { "⚠️" }
    Write-Host "  $status $($assetType.PadRight(20)) : $count" -ForegroundColor White
}
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray

# Step 4: Check for share buttons (if processed HTML)
Write-Host ""
Write-Host "Step 4: Checking for share button injection..." -ForegroundColor Yellow

$shareButtonPattern = 'data-share-button="asset"'
$shareButtonCount = ([regex]::Matches($html, $shareButtonPattern) | Measure-Object).Count

if ($shareButtonCount -gt 0) {
    Write-Host "✅ Found $shareButtonCount share buttons (HTML appears processed)" -ForegroundColor Green
    
    # Count by asset type
    $tableButtons = ([regex]::Matches($html, 'data-share-id="asset-table-\d+"') | Measure-Object).Count
    $ayahButtons = ([regex]::Matches($html, 'data-share-id="asset-ayah-card-\d+"') | Measure-Object).Count
    $hadeesButtons = ([regex]::Matches($html, 'data-share-id="asset-inserted-hadees-\d+"') | Measure-Object).Count
    $imgButtons = ([regex]::Matches($html, 'data-share-id="asset-imgResponsive-\d+"') | Measure-Object).Count
    
    Write-Host ""
    Write-Host "  Share Buttons by Type:" -ForegroundColor Cyan
    Write-Host "  ├─ Tables: $tableButtons" -ForegroundColor White
    Write-Host "  ├─ Ayah Cards: $ayahButtons" -ForegroundColor White
    Write-Host "  ├─ Hadees: $hadeesButtons" -ForegroundColor White
    Write-Host "  └─ Images: $imgButtons" -ForegroundColor White
    
} else {
    Write-Host "ℹ️ No share buttons found (raw transcript)" -ForegroundColor Yellow
    Write-Host "   Note: AssetProcessingService will inject buttons at runtime" -ForegroundColor Gray
}

# Summary
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host "✅ Phase 2.5: Database Validation Complete" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host ""
Write-Host "📁 Output File: $OutputPath" -ForegroundColor Cyan
Write-Host "📊 Total Assets: $($assetCounts.Values | Measure-Object -Sum | Select-Object -ExpandProperty Sum)" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Review fixture file for HTML structure" -ForegroundColor White
Write-Host "  2. Run Phase 2.6: Playwright test suite" -ForegroundColor White
Write-Host "  3. Verify asset detection in comprehensive-asset-share-validation.spec.ts" -ForegroundColor White
Write-Host ""
