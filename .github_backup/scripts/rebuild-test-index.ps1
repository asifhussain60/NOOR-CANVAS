#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Rebuild global test index by scanning all Playwright tests

.DESCRIPTION
    [hcp-refactor:session5] Global test registry implementation
    
    Scans Tests/UI/*.spec.ts files and generates test-index.json with metadata:
    - Test file path
    - Feature (extracted from filename/comments)
    - Tags (extracted from describe blocks)
    - Orchestration script (search Scripts/ and KDS directories)
    - Similarity hash for reuse detection
    
    Output: .github/tests/test-index.json

.EXAMPLE
    .\rebuild-test-index.ps1
    Scan all tests and create/update test-index.json

.NOTES
    Key: hcp-refactor
    Session: 5
    Purpose: Enable cross-agent test discovery and reuse
#>

$ErrorActionPreference = "Stop"

Write-Host "🔍 Scanning Playwright Tests..." -ForegroundColor Cyan
Write-Host "=" * 70 -ForegroundColor Gray

# Paths
$workspaceRoot = "D:\PROJECTS\NOOR CANVAS"
$testsDir = Join-Path $workspaceRoot "Tests\UI"
$outputFile = Join-Path $workspaceRoot ".github\tests\test-index.json"

# Scan all test files
$testFiles = Get-ChildItem -Path $testsDir -Filter "*.spec.ts" -File | Sort-Object Name

Write-Host "Found $($testFiles.Count) test files" -ForegroundColor Yellow
Write-Host ""

# Build test index
$tests = @()
$testId = 1

foreach ($file in $testFiles) {
    Write-Host "  Processing: $($file.Name)" -ForegroundColor Gray
    
    # Extract feature from filename (remove .spec.ts, convert hyphens to spaces, title case)
    $featureName = $file.BaseName -replace '\.spec$', '' -replace '-', ' '
    $featureName = (Get-Culture).TextInfo.ToTitleCase($featureName.ToLower())
    
    # Read file content for tags extraction
    $content = Get-Content -Path $file.FullName -Raw -ErrorAction SilentlyContinue
    
    # Extract tags from describe blocks and comments
    $tags = @()
    
    # Look for test.describe patterns
    if ($content -match "test\.describe\(['`"]([^'`"]+)") {
        $describeText = $matches[1].ToLower() -split '\s+'
        $tags += $describeText | Where-Object { $_.Length -gt 3 }
    }
    
    # Look for [WORKITEM:*] or [DEBUG-WORKITEM:*] markers
    if ($content -match "\[(?:DEBUG-)?WORKITEM:([^\]]+)\]") {
        $workitem = $matches[1].ToLower() -split ':' | Select-Object -First 1
        $tags += $workitem
    }
    
    # Extract key phrases from filename
    $filenameTags = $file.BaseName -split '-' | Where-Object { $_ -ne 'spec' -and $_.Length -gt 2 }
    $tags += $filenameTags | ForEach-Object { $_.ToLower() }
    
    # Deduplicate and limit to top 5 tags
    $tags = ($tags | Select-Object -Unique | Sort-Object | Select-Object -First 5)
    
    # Find orchestration script
    $orchestration = $null
    
    # Search in Scripts/
    $scriptName = "run-$($file.BaseName -replace '\.spec$', '')-test.ps1"
    $scriptPath = Join-Path $workspaceRoot "Scripts\$scriptName"
    if (Test-Path $scriptPath) {
        $orchestration = "Scripts/$scriptName"
    }
    
    # Search in KDS directories
    if (-not $orchestration) {
        $kdsScripts = Get-ChildItem -Path (Join-Path $workspaceRoot ".github\key-data-streams") -Recurse -Filter "run-*.ps1" -ErrorAction SilentlyContinue
        $matchingScript = $kdsScripts | Where-Object { $_.Name -like "*$($file.BaseName -replace '-test', '')*" } | Select-Object -First 1
        if ($matchingScript) {
            $relativePath = $matchingScript.FullName.Replace("$workspaceRoot\", "").Replace("\", "/")
            $orchestration = $relativePath
        }
    }
    
    # Calculate similarity hash
    $normalizedFeature = $featureName.ToLower() -replace '\s+', ''
    $topTags = $tags | Sort-Object | Select-Object -First 3
    $similarityHash = "$normalizedFeature-$($topTags -join '-')"
    
    # Determine if reusable (has orchestration script)
    $reusable = $null -ne $orchestration
    
    # Build test entry
    $testEntry = [ordered]@{
        id = "test-$testId"
        key = "unknown"  # Will be updated manually or via KDS context
        file = "Tests/UI/$($file.Name)"
        feature = $featureName
        scenarios = @()  # Will be populated manually or via test analysis
        tags = $tags
        similarityHash = $similarityHash
        reusable = $reusable
        created = "2025-10-29T00:00:00Z"  # Placeholder
        orchestration = $orchestration
        lastRun = $null
        status = "active"
    }
    
    $tests += $testEntry
    $testId++
}

# Build final index structure
$testIndex = [ordered]@{
    metadata = [ordered]@{
        version = "1.0"
        lastUpdated = (Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ")
        totalTests = $tests.Count
        reusableTests = ($tests | Where-Object { $_.reusable }).Count
        testsByType = [ordered]@{
            withOrchestration = ($tests | Where-Object { $null -ne $_.orchestration }).Count
            withoutOrchestration = ($tests | Where-Object { $null -eq $_.orchestration }).Count
        }
    }
    tests = $tests
}

# Write to JSON file
$json = $testIndex | ConvertTo-Json -Depth 10
Set-Content -Path $outputFile -Value $json -Encoding UTF8

Write-Host ""
Write-Host "✅ Test index created: $outputFile" -ForegroundColor Green
Write-Host ""
Write-Host "Statistics:" -ForegroundColor Cyan
Write-Host "  Total Tests: $($testIndex.metadata.totalTests)" -ForegroundColor White
Write-Host "  Reusable Tests: $($testIndex.metadata.reusableTests)" -ForegroundColor White
Write-Host "  With Orchestration: $($testIndex.metadata.testsByType.withOrchestration)" -ForegroundColor White
Write-Host "  Without Orchestration: $($testIndex.metadata.testsByType.withoutOrchestration)" -ForegroundColor White
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Review test-index.json for accuracy" -ForegroundColor Gray
Write-Host "  2. Update 'key' fields manually for known tests" -ForegroundColor Gray
Write-Host "  3. Add 'scenarios' arrays for important tests" -ForegroundColor Gray
Write-Host "  4. Integrate into agent prompts (plan, todo, drift)" -ForegroundColor Gray
Write-Host ""
