# Test File Finalization Verification for hcp-cleanup key
# This simulates what plan.prompt.md Step 5.5 would do

Write-Host "`n=== TESTING FILE FINALIZATION VERIFICATION ===" -ForegroundColor Cyan
Write-Host "Simulating: plan.prompt.md Step 5.5`n" -ForegroundColor Yellow

$key = "hcp-cleanup"
$workspaceRoot = "d:\PROJECTS\NOOR CANVAS"

# Required files per file-finalization-verifier.md
$requiredFiles = @(
    ".github\key-data-streams\$key\$key.plan.md",
    ".github\key-data-streams\$key\$key.plan.json",
    ".github\key-data-streams\$key\work-log.md"
)

Write-Host "Key: $key" -ForegroundColor White
Write-Host "Checking required files...`n" -ForegroundColor White

# Check each file
$missingFiles = @()
$allExist = $true

foreach ($file in $requiredFiles) {
    $fullPath = Join-Path $workspaceRoot $file
    $exists = Test-Path $fullPath
    
    $status = if ($exists) { "✅ EXISTS" } else { "❌ MISSING" }
    $color = if ($exists) { "Green" } else { "Red" }
    
    Write-Host "  $status - $file" -ForegroundColor $color
    
    if (-not $exists) {
        $allExist = $false
        $missingFiles += $file
    }
}

# Show result
Write-Host "`n=== VERIFICATION RESULT ===" -ForegroundColor Cyan

if ($allExist) {
    Write-Host "✅ PASS - All files verified" -ForegroundColor Green
    Write-Host "Action: Proceeding to Step 6 (Handoff Preparation)" -ForegroundColor Green
    exit 0
} else {
    Write-Host "❌ FAIL - File finalization incomplete" -ForegroundColor Red
    Write-Host "`nAction: HALT EXECUTION" -ForegroundColor Red
    
    Write-Host "`n=== ERROR MESSAGE (shown to user) ===" -ForegroundColor Yellow
    Write-Host @"

❌ FILE FINALIZATION FAILED

File: Multiple files missing
Status: MISSING
Phase: Planning (Step 5.5)

The plan files were not created. This indicates a critical failure in the planning process.

Missing Files:
$($missingFiles | ForEach-Object { "  - $_" } | Out-String)

ACTION REQUIRED:
1. Check for errors in plan generation (Steps 4, 4.5, 5)
2. Verify file write permissions
3. Manually create missing files if needed
4. Retry planning process

EXECUTION HALTED:
- Step 6 (Handoff Preparation) BLOCKED
- Step 7.5 (Response Validation) BLOCKED
- NO user output generated

"@ -ForegroundColor Red

    Write-Host "=== TEST CONCLUSION ===" -ForegroundColor Cyan
    Write-Host "✅ File finalization verification is WORKING CORRECTLY" -ForegroundColor Green
    Write-Host "✅ Would prevent user from seeing incomplete plan response" -ForegroundColor Green
    Write-Host "✅ Enforces 'Document First, Respond Later' protocol" -ForegroundColor Green
    
    exit 1
}
