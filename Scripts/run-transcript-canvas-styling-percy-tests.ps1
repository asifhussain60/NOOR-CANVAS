<#
.SYNOPSIS
    Run TranscriptCanvas styling verification Percy tests.

.DESCRIPTION
    Verifies CSS styling is correctly applied after Phase 2 refactor (CSS consolidation).
    Tests purple theme, responsive layout, and compares to pre-refactor baseline (b73750f2).

.PARAMETER Headed
    Run tests in headed mode (visible browser).

.PARAMETER SkipBuild
    Skip building the application.

.PARAMETER KeepAppRunning
    Keep application running after tests.

.EXAMPLE
    .\run-transcript-canvas-styling-percy-tests.ps1

.EXAMPLE
    .\run-transcript-canvas-styling-percy-tests.ps1 -Headed -KeepAppRunning

.NOTES
    Key: transcript-canvas
    Test File: Tests/UI/transcript-canvas-styling-verification.spec.ts
    Purpose: CSS regression testing after Phase 2 refactor
#>

[CmdletBinding()]
param(
    [switch]$Headed,
    [switch]$SkipBuild,
    [switch]$KeepAppRunning
)

$testFile = "Tests/UI/transcript-canvas-styling-verification.spec.ts"
$testRunnerPath = Join-Path $PSScriptRoot "Test-Framework\Invoke-PlaywrightTest.ps1"

$params = @{
    TestFile = $testFile
    Percy = $true
    Headed = $Headed
    SkipBuild = $SkipBuild
    KeepAppRunning = $KeepAppRunning
}

Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  TRANSCRIPT CANVAS STYLING VERIFICATION - PERCY TESTS" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "Purpose:  " -NoNewline -ForegroundColor Yellow
Write-Host "Verify CSS styling after Phase 2 refactor (CSS consolidation)"
Write-Host "Baseline: " -NoNewline -ForegroundColor Yellow
Write-Host "Pre-refactor commit b73750f2"
Write-Host "Theme:    " -NoNewline -ForegroundColor Yellow
Write-Host "Purple (TranscriptCanvas participant view)"
Write-Host ""

& $testRunnerPath @params
exit $LASTEXITCODE
