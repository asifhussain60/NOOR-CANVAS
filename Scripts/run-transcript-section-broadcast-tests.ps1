<#
.SYNOPSIS
    Orchestrates transcript section broadcast tests between HostControlPanel and TranscriptCanvas

.DESCRIPTION
    Uses canonical test framework pattern (Invoke-PlaywrightTest.ps1) to:
    - Start NoorCanvas application using Start-NoorCanvasForTests.ps1
    - Run Playwright tests to verify SignalR broadcast flow
    - Stop application using Stop-NoorCanvasForTests.ps1
    - Automatically update global test registry

.PARAMETER Headed
    Run tests in headed mode (visible browser)

.PARAMETER KeepAppRunning
    Don't kill app after tests complete (for manual verification)

.PARAMETER SkipBuild
    Skip building the application (use existing build)

.PARAMETER SkipRegistryUpdate
    Skip updating the global test registry

.EXAMPLE
    .\run-transcript-section-broadcast-tests.ps1
    .\run-transcript-section-broadcast-tests.ps1 -Headed
    .\run-transcript-section-broadcast-tests.ps1 -Headed -KeepAppRunning
#>

param(
    [switch]$Headed,
    [switch]$KeepAppRunning,
    [switch]$SkipBuild,
    [switch]$SkipRegistryUpdate
)

$ErrorActionPreference = "Stop"

# Get workspace root
$workspaceRoot = Split-Path -Parent $PSScriptRoot

# Update test registry before running test
if (-not $SkipRegistryUpdate) {
    $hookScript = Join-Path $workspaceRoot ".github\hooks\post-test-creation.ps1"
    if (Test-Path $hookScript) {
        Write-Host "🔄 Updating test registry..." -ForegroundColor Cyan
        & $hookScript -Silent
    }
}

# Test configuration
$testFile = "Tests/UI/transcript-section-broadcast.spec.ts"
$testFrameworkPath = Join-Path $workspaceRoot "Scripts\Test-Framework"

# Run the test using canonical framework pattern
try {
    $invokeArgs = @{
        TestFile = $testFile
        SkipBuild = $SkipBuild
        KeepAppRunning = $KeepAppRunning
    }
    
    if ($Headed) {
        $invokeArgs.Add('Headed', $true)
    }
    
    & (Join-Path $testFrameworkPath "Invoke-PlaywrightTest.ps1") @invokeArgs
}
catch {
    Write-Host "❌ Test orchestration failed: $_" -ForegroundColor Red
    exit 1
}
