#!/usr/bin/env pwsh
<#
.SYNOPSIS
    HostControlPanel refactoring baseline test orchestration script

.DESCRIPTION
    [WORKITEM:hcp-cleanup] Phase 1: Baseline regression test
    
    This script orchestrates Playwright E2E tests for HostControlPanel using the
    canonical test framework v2.0 pattern (Invoke-PlaywrightTest.ps1).
    
    Workflow:
    1. Invokes universal test runner (Scripts/Test-Framework/Invoke-PlaywrightTest.ps1)
    2. Automatic app lifecycle: build → start → health check → test → cleanup
    3. Returns test results with proper exit codes
    
    Coverage:
    - HostControlPanel page load & authentication
    - SignalR connection establishment
    - Session state management
    - Asset sharing (ShareAsset method)
    - Question management (Q&A panel)
    - Transcript broadcasting
    - Error handling & edge cases
    - UI component rendering
    - Performance baseline
    - End-to-end integration

.PARAMETER Headed
    Run tests in headed mode (visible browser window for debugging)

.PARAMETER KeepAppRunning
    Keep NoorCanvas app running after tests complete (for manual verification)

.PARAMETER SkipBuild
    Skip building the application (use existing binaries)

.PARAMETER Percy
    Enable Percy visual regression testing (requires PERCY_TOKEN environment variable)

.EXAMPLE
    .\run-hcp-baseline-test.ps1
    Run tests in headless mode with automatic cleanup

.EXAMPLE
    .\run-hcp-baseline-test.ps1 -Headed
    Run tests with visible browser for debugging

.EXAMPLE
    .\run-hcp-baseline-test.ps1 -Headed -KeepAppRunning
    Run tests and keep app running for manual verification

.EXAMPLE
    .\run-hcp-baseline-test.ps1 -Percy
    Run tests with Percy visual regression testing

.NOTES
    Test File: Tests/UI/hcp-refactor-baseline.spec.ts
    Session Context: Session 212 (Host: PQ9N5YWW, User: KJAHA99L)
    Base URL: https://localhost:9091
    
    This is a SAFETY NET test that must pass before any refactoring work proceeds.
    If this test fails, refactoring is BLOCKED until issues are resolved.
#>

[CmdletBinding()]
param(
    [switch]$Headed,
    [switch]$KeepAppRunning,
    [switch]$SkipBuild,
    [switch]$Percy
)

$ErrorActionPreference = "Stop"

# ============================================================================
# CONFIGURATION
# ============================================================================

# Calculate workspace root: scripts -> hcp-cleanup -> key-data-streams -> .github -> WORKSPACE
$workspaceRoot = Split-Path (Split-Path (Split-Path (Split-Path $PSScriptRoot -Parent) -Parent) -Parent) -Parent
$testRunnerScript = Join-Path $workspaceRoot "Scripts\Test-Framework\Invoke-PlaywrightTest.ps1"
$testFile = "Tests/UI/hcp-refactor-baseline.spec.ts"

Write-Host ""
Write-Host "===================================================================" -ForegroundColor Cyan
Write-Host "  [hcp-cleanup] HostControlPanel Baseline Test Runner" -ForegroundColor Cyan
Write-Host "===================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Purpose:      Phase 1 regression safety net" -ForegroundColor White
Write-Host "  Test File:    $testFile" -ForegroundColor White
Write-Host "  Session:      212 (Host: PQ9N5YWW, User: KJAHA99L)" -ForegroundColor White
Write-Host "  Headed:       $Headed" -ForegroundColor White
Write-Host "  Keep Running: $KeepAppRunning" -ForegroundColor White
Write-Host "  Skip Build:   $SkipBuild" -ForegroundColor White
Write-Host "  Percy:        $Percy" -ForegroundColor White
Write-Host ""
Write-Host "===================================================================" -ForegroundColor Cyan
Write-Host ""

# ============================================================================
# VALIDATION
# ============================================================================

# Verify test file exists
$fullTestPath = Join-Path $workspaceRoot $testFile
if (-not (Test-Path $fullTestPath)) {
    Write-Host "❌ Test file not found: $fullTestPath" -ForegroundColor Red
    exit 1
}

# Verify test runner exists
if (-not (Test-Path $testRunnerScript)) {
    Write-Host "❌ Test runner not found: $testRunnerScript" -ForegroundColor Red
    Write-Host "   Expected location: Scripts/Test-Framework/Invoke-PlaywrightTest.ps1" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Validation complete" -ForegroundColor Green
Write-Host ""

# ============================================================================
# INVOKE TEST RUNNER (CANONICAL PATTERN)
# ============================================================================

Write-Host "[ORCHESTRATION] Invoking test framework..." -ForegroundColor Cyan
Write-Host ""

try {
    # Build argument list for test runner
    $testRunnerArgs = @{
        TestFile = $testFile
        Headed = $Headed
        KeepAppRunning = $KeepAppRunning
        SkipBuild = $SkipBuild
    }
    
    if ($Percy) {
        $testRunnerArgs.Percy = $true
    }
    
    # Invoke canonical test runner
    & $testRunnerScript @testRunnerArgs
    
    $exitCode = $LASTEXITCODE
}
catch {
    Write-Host ""
    Write-Host "❌ Test orchestration failed: $_" -ForegroundColor Red
    exit 1
}

# ============================================================================
# RESULTS SUMMARY
# ============================================================================

Write-Host ""
Write-Host "===================================================================" -ForegroundColor Cyan
Write-Host "  [hcp-cleanup] Baseline Test Results" -ForegroundColor Cyan
Write-Host "===================================================================" -ForegroundColor Cyan
Write-Host ""

if ($exitCode -eq 0) {
    Write-Host "  ✅ ALL BASELINE TESTS PASSED" -ForegroundColor Green
    Write-Host ""
    Write-Host "  Status: GREEN BASELINE ESTABLISHED" -ForegroundColor Green
    Write-Host "  Next Step: Proceed to Phase 2 (Extract AssetSharingService)" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  Reminder: Run this test after EACH refactoring phase to ensure" -ForegroundColor Yellow
    Write-Host "            no regressions have been introduced." -ForegroundColor Yellow
}
else {
    Write-Host "  ❌ BASELINE TESTS FAILED (Exit Code: $exitCode)" -ForegroundColor Red
    Write-Host ""
    Write-Host "  Status: REFACTORING BLOCKED" -ForegroundColor Red
    Write-Host "  Action Required: Fix failing tests before proceeding" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  Debugging Tips:" -ForegroundColor Cyan
    Write-Host "    1. Run with -Headed to see browser interactions" -ForegroundColor Gray
    Write-Host "    2. Run with -KeepAppRunning to inspect app state after tests" -ForegroundColor Gray
    Write-Host "    3. Check test screenshots in test-results/ directory" -ForegroundColor Gray
    Write-Host "    4. Review console output above for specific failures" -ForegroundColor Gray
}

Write-Host ""
Write-Host "===================================================================" -ForegroundColor Cyan
Write-Host ""

exit $exitCode
