# Template for New Test Orchestration Scripts
# Copy this file when creating a new test orchestration script
# This ensures the global test registry is automatically updated

<#
.SYNOPSIS
    [Replace with test description]

.DESCRIPTION
    Orchestrates the execution of [test-name].spec.ts
    - Automatically updates global test registry
    - Manages application lifecycle
    - Ensures proper cleanup

.EXAMPLE
    .\run-[test-name].ps1
#>

param(
    [Parameter(Mandatory=$false)]
    [switch]$SkipCleanup,
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipRegistryUpdate
)

$ErrorActionPreference = "Stop"

# Get workspace root
$workspaceRoot = Split-Path (Split-Path (Split-Path $PSScriptRoot -Parent) -Parent) -Parent

# Update test registry before running test
if (-not $SkipRegistryUpdate) {
    $hookScript = Join-Path $workspaceRoot ".github\hooks\post-test-creation.ps1"
    if (Test-Path $hookScript) {
        Write-Host "🔄 Updating test registry..." -ForegroundColor Cyan
        & $hookScript -Silent
    }
}

# Test configuration
$testFile = "Tests/UI/[test-name].spec.ts"  # REPLACE THIS
$testFrameworkPath = Join-Path $workspaceRoot "Scripts\Test-Framework"

try {
    # Run the test using standard framework
    & (Join-Path $testFrameworkPath "Invoke-PlaywrightTest.ps1") `
        -TestFile $testFile `
        -WorkspaceRoot $workspaceRoot
}
finally {
    if (-not $SkipCleanup) {
        Write-Host "🧹 Cleanup complete" -ForegroundColor Gray
    }
}
