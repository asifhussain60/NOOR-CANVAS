# Verify tests for issues marked COMPLETED in IssueTracker/NC-ISSUE-TRACKER.MD
# This script scans the tracker for COMPLETED issues and expects a test file present for each issue in Tests/NC-ImplementationTests/tests/**

$tracker = "d:\PROJECTS\NOOR CANVAS\IssueTracker\NC-ISSUE-TRACKER.MD"
$testsRoot = "d:\PROJECTS\NOOR CANVAS\Tests\NC-ImplementationTests\tests"

if (-not (Test-Path $tracker)) { Write-Error "Tracker file not found: $tracker"; exit 2 }

$completedIssues = Select-String -Path $tracker -Pattern "COMPLETED" | ForEach-Object {
    $_.Line -replace '.*\*\*Issue-(\d+)\*\*.*','Issue-$1'
} | Sort-Object -Unique

if (-not $completedIssues) {
    Write-Host "No completed issues found in tracker"
    exit 0
}

$missingTests = @()
foreach ($issue in $completedIssues) {
    # Expect test files named Issue-<n>-*.{cs|spec|js} under tests root
    $foundTests = Get-ChildItem -Path $testsRoot -Recurse -Include "${issue}-*.*" -ErrorAction SilentlyContinue
    if (-not $foundTests) { $missingTests += $issue }
}

if ($missingTests.Count -gt 0) {
    Write-Host "Missing tests for completed issues:`n$($missingTests -join "`n")"
    exit 1
}

Write-Host "All completed issues have test files present"
exit 0
