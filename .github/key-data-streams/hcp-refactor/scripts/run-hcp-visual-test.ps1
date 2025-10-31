<#
.SYNOPSIS
    Run hcp-refactor visual click sequence test (headed mode)

.DESCRIPTION
    Orchestration wrapper for hcp-visual-click-sequence.spec.ts
    Tests complete user flow from control panel to transcript sharing
    based on visual UI markers (Session 212).
    
    Click Sequence Validated:
    1. Navigate to Host Control Panel (localhost:9091/host/control-panel/PQ9N5YWW)
    2. Verify Session Controls panel (time, duration)
    3. Click "Transcript Canvas" button
    4. Click "Start Session" button
    5. Verify user receives transcript content
    6. Click "Share Section" button on transcript
    7. Verify question modal with "Inserted Hadees" button
    8. Visual regression screenshots

.PARAMETER Headed
    Run test in headed mode (browser visible). Default: $true

.PARAMETER KeepAppRunning
    Keep application running after test (for manual verification)

.PARAMETER SkipBuild
    Skip dotnet build step (if app already built)

.PARAMETER Percy
    Enable Percy visual regression testing

.EXAMPLE
    .\run-hcp-visual-test.ps1
    # Run test in default headed mode

.EXAMPLE
    .\run-hcp-visual-test.ps1 -KeepAppRunning
    # Run test and leave app running for manual verification

.NOTES
    Test File: .github/key-data-streams/hcp-refactor/tests/hcp-visual-click-sequence.spec.ts
    Session: 212 (Host: PQ9N5YWW, User: KJAHA99L)
    Orchestration: Canonical pattern v3.0 (Invoke-PlaywrightTest.ps1)
#>

[CmdletBinding()]
param(
    [Parameter(HelpMessage = "Run test in headed mode (browser visible)")]
    [switch]$Headed,

    [Parameter(HelpMessage = "Keep application running after test")]
    [switch]$KeepAppRunning,

    [Parameter(HelpMessage = "Skip dotnet build step")]
    [switch]$SkipBuild,

    [Parameter(HelpMessage = "Enable Percy visual regression testing")]
    [switch]$Percy
)

# Default to headed mode if not specified
if (-not $PSBoundParameters.ContainsKey('Headed')) {
    $Headed = $true
}

# Script metadata
$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$workspaceRoot = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $scriptDir))

Write-Host "`n=== HCP Visual Click Sequence Test ===" -ForegroundColor Cyan
Write-Host "Test: hcp-visual-click-sequence.spec.ts" -ForegroundColor Gray
Write-Host "Session: 212 (Host: PQ9N5YWW, User: KJAHA99L)" -ForegroundColor Gray
Write-Host "Mode: $(if ($Headed) { 'Headed (visible browser)' } else { 'Headless' })" -ForegroundColor Gray
Write-Host ""

# Validate test file exists
$testFile = Join-Path $scriptDir "..\tests\hcp-visual-click-sequence.spec.ts"
if (-not (Test-Path $testFile)) {
    Write-Error "Test file not found: $testFile"
    exit 1
}

Write-Host "✅ Test file validated: $(Split-Path -Leaf $testFile)" -ForegroundColor Green

# Locate canonical test runner
$testRunnerScript = Join-Path $workspaceRoot "Scripts\Test-Framework\Invoke-PlaywrightTest.ps1"
if (-not (Test-Path $testRunnerScript)) {
    Write-Error "Canonical test runner not found: $testRunnerScript"
    Write-Host "Expected location: Scripts\Test-Framework\Invoke-PlaywrightTest.ps1" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Test runner located: $(Split-Path -Leaf $testRunnerScript)" -ForegroundColor Green

# Build argument list for Invoke-PlaywrightTest.ps1
$testRunnerArgs = @{
    TestFile = $testFile
    Headed = $Headed
    KeepAppRunning = $KeepAppRunning
    SkipBuild = $SkipBuild
}

if ($Percy) {
    $testRunnerArgs['Percy'] = $true
}

Write-Host "`n📋 Test Configuration:" -ForegroundColor Cyan
Write-Host "  Test File: $testFile" -ForegroundColor Gray
Write-Host "  Headed Mode: $Headed" -ForegroundColor Gray
Write-Host "  Keep App Running: $KeepAppRunning" -ForegroundColor Gray
Write-Host "  Skip Build: $SkipBuild" -ForegroundColor Gray
Write-Host "  Percy Enabled: $Percy" -ForegroundColor Gray
Write-Host ""

# Execute test via canonical orchestration pattern
Write-Host "🚀 Invoking canonical test runner..." -ForegroundColor Cyan
Write-Host "Command: Invoke-PlaywrightTest.ps1 with arguments" -ForegroundColor Gray
Write-Host ""

try {
    & $testRunnerScript @testRunnerArgs
    $exitCode = $LASTEXITCODE

    Write-Host ""
    if ($exitCode -eq 0) {
        Write-Host "✅ Visual click sequence test PASSED" -ForegroundColor Green
        Write-Host "📸 Screenshots saved to: test-results/" -ForegroundColor Gray
        Write-Host ""
        Write-Host "Visual Sequence Validated:" -ForegroundColor Cyan
        Write-Host "  ✓ Step 1: Host Control Panel loaded" -ForegroundColor Green
        Write-Host "  ✓ Step 2: Session controls verified" -ForegroundColor Green
        Write-Host "  ✓ Step 3: Transcript Canvas selected" -ForegroundColor Green
        Write-Host "  ✓ Step 4: Session started" -ForegroundColor Green
        Write-Host "  ✓ Step 5: User received transcript" -ForegroundColor Green
        Write-Host "  ✓ Step 6: Share Section functionality verified" -ForegroundColor Green
        Write-Host "  ✓ Step 7: Question modal verified" -ForegroundColor Green
        Write-Host "  ✓ Step 8: Visual regression screenshots captured" -ForegroundColor Green
    } else {
        Write-Host "❌ Visual click sequence test FAILED (Exit Code: $exitCode)" -ForegroundColor Red
        Write-Host "Check screenshots in test-results/ for failure details" -ForegroundColor Yellow
    }

    exit $exitCode
}
catch {
    Write-Error "Test execution failed: $_"
    exit 1
}
