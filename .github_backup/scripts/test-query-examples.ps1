# Test Registry Query Examples
# Demonstrates how agents can query test-index.json

$ErrorActionPreference = "Stop"
$indexPath = Join-Path (Join-Path $PSScriptRoot "..") "tests\test-index.json"

Write-Host "`n========================================================" -ForegroundColor Cyan
Write-Host " NOOR Canvas Test Registry Query Demo" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

# Load the test index
$index = Get-Content $indexPath -Raw | ConvertFrom-Json

Write-Host "`nRegistry Statistics:" -ForegroundColor Yellow
Write-Host "   Total Tests: $($index.metadata.totalTests)"
Write-Host "   Reusable Tests: $($index.metadata.reusableTests)"
Write-Host "   Last Updated: $($index.metadata.lastUpdated)"

# Query 1: Find tests by feature
Write-Host "`nQuery 1: Find transcript-related tests" -ForegroundColor Green
$transcriptTests = $index.tests | Where-Object { $_.feature -like '*transcript*' }
Write-Host "   Found: $($transcriptTests.Count) tests"
$transcriptTests | Select-Object -First 3 | ForEach-Object {
    Write-Host "   - $($_.id): $($_.feature)" -ForegroundColor Gray
}

# Query 2: Find tests with orchestration
Write-Host "`nQuery 2: Find tests with orchestration scripts" -ForegroundColor Green
$orchestratedTests = $index.tests | Where-Object { $_.orchestration.hasOrchestration -eq $true }
Write-Host "   Found: $($orchestratedTests.Count) tests"
$orchestratedTests | Select-Object -First 3 | ForEach-Object {
    $scriptName = Split-Path $_.orchestration.scriptPath -Leaf
    Write-Host "   - $($_.id): $scriptName" -ForegroundColor Gray
}

# Query 3: Find tests by tag
Write-Host "`nQuery 3: Find Percy visual regression tests" -ForegroundColor Green
$percyTests = $index.tests | Where-Object { $_.tags -contains 'percy' }
Write-Host "   Found: $($percyTests.Count) tests"
$percyTests | Select-Object -First 5 | ForEach-Object {
    Write-Host "   - $($_.id): $($_.feature)" -ForegroundColor Gray
}

# Query 4: Find orphaned tests (no orchestration)
Write-Host "`nQuery 4: Find orphaned tests (no orchestration)" -ForegroundColor Green
$orphanedTests = $index.tests | Where-Object { $_.orchestration.hasOrchestration -eq $false }
Write-Host "   Found: $($orphanedTests.Count) tests (needs investigation)"
$orphanedTests | Select-Object -First 5 | ForEach-Object {
    Write-Host "   - $($_.id): $($_.feature)" -ForegroundColor Gray
}

# Query 5: Similarity hash matching
Write-Host "`nQuery 5: Detect potential duplicates by similarity hash" -ForegroundColor Green
$grouped = $index.tests | Group-Object -Property similarityHash | Where-Object { $_.Count -gt 1 }
if ($grouped) {
    $groupCount = $grouped.Count
    Write-Host "   Found: $groupCount groups with similar tests"
    $grouped | Select-Object -First 2 | ForEach-Object {
        $itemCount = $_.Count
        $hashValue = $_.Name
        Write-Host "   Hash: $hashValue ($itemCount items)" -ForegroundColor Gray
        $_.Group | ForEach-Object {
            $testId = $_.id
            Write-Host "      - $testId" -ForegroundColor DarkGray
        }
    }
} else {
    Write-Host "   No duplicate similarity hashes found" -ForegroundColor Gray
}

Write-Host "`nQuery demo complete!`n" -ForegroundColor Green
