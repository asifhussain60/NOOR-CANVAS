<#
verify-completed-tests.ps1

Scans IssueTracker/COMPLETED and ensures each completed issue has a corresponding test stub under Tests/NC-ImplementationTests/unit

This is a verification script scaffold (non-destructive). It exits with code 0 when all completed issues have a matching test file (placeholder or real test).
If a test is missing, it prints the missing list and exits with non-zero code.

Usage (PowerShell):
    .\verify-completed-tests.ps1

#>

Param()

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Resolve-Path "$root\..\..\.."

$completedFolder = Join-Path $repoRoot "IssueTracker\COMPLETED"
$testFolder = Join-Path $repoRoot "Tests\NC-ImplementationTests\unit"

if (-not (Test-Path $completedFolder)) {
    Write-Host "Cannot find IssueTracker/COMPLETED at $completedFolder" -ForegroundColor Yellow
    exit 2
}

if (-not (Test-Path $testFolder)) {
    Write-Host "Test folder missing; creating placeholder folder: $testFolder" -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $testFolder -Force | Out-Null
}

$completedIssues = Get-ChildItem -Path $completedFolder -Filter "Issue-*.md" | ForEach-Object { $_.BaseName }

$missing = @()
foreach ($issueFile in $completedIssues) {
    # e.g. Issue-20-replace-browser-dialogs-with-styled-libraries => Issue-20*
    $issueNumber = ($issueFile -split '-')[1]
    $pattern = "Issue-$issueNumber*"
    $found = Get-ChildItem -Path $testFolder -Filter "$pattern*" -ErrorAction SilentlyContinue
    if (-not $found) { $missing += $issueFile }
}

if ($missing.Count -gt 0) {
    Write-Host "Missing test stubs for completed issues:" -ForegroundColor Red
    $missing | ForEach-Object { Write-Host " - $_" }
    Write-Host "Create test stubs under Tests/NC-ImplementationTests/unit for the listed issues." -ForegroundColor Yellow
    exit 3
}

Write-Host "All completed issues have test stubs." -ForegroundColor Green
exit 0
