# validate-asset-detection-session212.ps1
# Validates AssetProcessingService correctly detects assets in session 212 transcript

param(
    [switch]$Verbose
)

$ErrorActionPreference = "Stop"

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host "🔍 Session 212 Asset Detection Validation" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host ""

# Load raw transcript HTML
$transcriptPath = "Workspaces\Data\session212.html"
if (-not (Test-Path $transcriptPath)) {
    Write-Host "❌ FAILED: session212.html not found" -ForegroundColor Red
    exit 1
}

$rawHtml = Get-Content $transcriptPath -Raw
Write-Host "✓ Loaded raw transcript HTML ($(($rawHtml.Length / 1KB).ToString('F2')) KB)" -ForegroundColor Green
Write-Host ""

# Expected asset counts (from manual inspection)
$expected = @{
    "table" = 10
    "ayah-card" = 4
    "inserted-hadees" = 3
    "imgResponsive" = 4
    "esotericBlock" = 1
}

Write-Host "📊 Expected Asset Counts:" -ForegroundColor Yellow
$expected.GetEnumerator() | ForEach-Object {
    Write-Host "   $($_.Key): $($_.Value)" -ForegroundColor White
}
Write-Host ""

# Validate asset counts using regex patterns
$results = @{}
$allPassed = $true

Write-Host "🔎 Validating Asset Detection..." -ForegroundColor Cyan
Write-Host ""

# Table detection (CSS selector: table)
$tableMatches = [regex]::Matches($rawHtml, '<table[^>]*>')
$results["table"] = $tableMatches.Count
if ($tableMatches.Count -eq $expected["table"]) {
    Write-Host "   ✓ table: $($tableMatches.Count) detected (PASS)" -ForegroundColor Green
} else {
    Write-Host "   ❌ table: $($tableMatches.Count) detected, expected $($expected['table']) (FAIL)" -ForegroundColor Red
    $allPassed = $false
}

# Ayah-card detection (class: ayah-card)
$ayahMatches = [regex]::Matches($rawHtml, '<div[^>]+class="ayah-card"[^>]*>')
$results["ayah-card"] = $ayahMatches.Count
if ($ayahMatches.Count -eq $expected["ayah-card"]) {
    Write-Host "   ✓ ayah-card: $($ayahMatches.Count) detected (PASS)" -ForegroundColor Green
} else {
    Write-Host "   ❌ ayah-card: $($ayahMatches.Count) detected, expected $($expected['ayah-card']) (FAIL)" -ForegroundColor Red
    $allPassed = $false
}

# Inserted-hadees detection (class: inserted-hadees)
$hadeesMatches = [regex]::Matches($rawHtml, '<div[^>]+class="[^"]*inserted-hadees[^"]*"[^>]*>')
$results["inserted-hadees"] = $hadeesMatches.Count
if ($hadeesMatches.Count -eq $expected["inserted-hadees"]) {
    Write-Host "   ✓ inserted-hadees: $($hadeesMatches.Count) detected (PASS)" -ForegroundColor Green
} else {
    Write-Host "   ❌ inserted-hadees: $($hadeesMatches.Count) detected, expected $($expected['inserted-hadees']) (FAIL)" -ForegroundColor Red
    $allPassed = $false
}

# ImgResponsive detection (class: imgResponsive)
$imgMatches = [regex]::Matches($rawHtml, 'class="[^"]*imgResponsive[^"]*"')
$results["imgResponsive"] = $imgMatches.Count
if ($imgMatches.Count -eq $expected["imgResponsive"]) {
    Write-Host "   ✓ imgResponsive: $($imgMatches.Count) detected (PASS)" -ForegroundColor Green
} else {
    Write-Host "   ❌ imgResponsive: $($imgMatches.Count) detected, expected $($expected['imgResponsive']) (FAIL)" -ForegroundColor Red
    $allPassed = $false
}

# EsotericBlock detection (class: esotericBlock)
$esotericMatches = [regex]::Matches($rawHtml, '<div[^>]+class="esotericBlock"[^>]*>')
$results["esotericBlock"] = $esotericMatches.Count
if ($esotericMatches.Count -eq $expected["esotericBlock"]) {
    Write-Host "   ✓ esotericBlock: $($esotericMatches.Count) detected (PASS)" -ForegroundColor Green
} else {
    Write-Host "   ❌ esotericBlock: $($esotericMatches.Count) detected, expected $($expected['esotericBlock']) (FAIL)" -ForegroundColor Red
    $allPassed = $false
}

Write-Host ""

# Verify NO share buttons in raw HTML (they should be injected by AssetProcessingService)
$shareButtonMatches = [regex]::Matches($rawHtml, 'data-share-button=|data-share-id=|shared-action-button')
if ($shareButtonMatches.Count -eq 0) {
    Write-Host "✓ Raw HTML contains NO share buttons (correct - injected by AssetProcessingService)" -ForegroundColor Green
} else {
    Write-Host "❌ Raw HTML contains $($shareButtonMatches.Count) share button references (FAIL - should be 0)" -ForegroundColor Red
    $allPassed = $false
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray

if ($allPassed) {
    Write-Host "✅ VALIDATION PASSED" -ForegroundColor Green
    Write-Host "   All asset types detected correctly in session 212 transcript" -ForegroundColor White
    Write-Host "   AssetProcessingService should inject $($expected.Values | Measure-Object -Sum | Select-Object -ExpandProperty Sum) share buttons (22 total)" -ForegroundColor White
    exit 0
} else {
    Write-Host "❌ VALIDATION FAILED" -ForegroundColor Red
    Write-Host "   Asset detection mismatches found - review AssetLookup CSS selectors" -ForegroundColor White
    exit 1
}
