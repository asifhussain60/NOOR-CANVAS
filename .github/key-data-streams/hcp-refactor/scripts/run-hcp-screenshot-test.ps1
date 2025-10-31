# Run HCP Screenshot-Based Test
# Generated from Rule #17 implementation (Screenshot-Based Test Generation)
# 
# Test File: hcp-screenshot-based-test.spec.ts
# Session: 212 (Host: PQ9N5YWW, User: KJAHA99L)
# Metadata: Extracted using vision analysis from 6 screenshots

[CmdletBinding()]
param(
    [switch]$Headed,
    [switch]$KeepAppRunning,
    [switch]$SkipBuild,
    [switch]$Percy
)

$ErrorActionPreference = "Stop"

# Default Headed to true if not specified
if (-not $PSBoundParameters.ContainsKey('Headed')) {
    $Headed = $true
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "HCP Screenshot-Based Test - Session 212" -ForegroundColor Cyan
Write-Host "Rule #17: Vision-Analyzed Click Sequence" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Canonical v3.0 Orchestration Pattern
# Delegate to centralized Invoke-PlaywrightTest.ps1

$testParams = @{
    TestFile = ".github/key-data-streams/hcp-refactor/tests/hcp-screenshot-based-test.spec.ts"
    Headed = $Headed
    KeepAppRunning = $KeepAppRunning
    SkipBuild = $SkipBuild
}

# Add Percy parameter if specified
if ($Percy) {
    $testParams['Percy'] = $true
    Write-Host "🎨 Percy visual regression enabled" -ForegroundColor Magenta
}

# Invoke canonical orchestration
$workspaceRoot = Split-Path (Split-Path (Split-Path (Split-Path $PSScriptRoot -Parent) -Parent) -Parent) -Parent
$scriptPath = Join-Path $workspaceRoot "Scripts" "Test-Framework" "Invoke-PlaywrightTest.ps1"

if (-not (Test-Path $scriptPath)) {
    Write-Error "Canonical orchestration script not found: $scriptPath"
    exit 1
}

Write-Host "📋 Test Configuration:" -ForegroundColor Yellow
Write-Host "  - Test: hcp-screenshot-based-test.spec.ts" -ForegroundColor Gray
Write-Host "  - Session: 212" -ForegroundColor Gray
Write-Host "  - Host Token: PQ9N5YWW" -ForegroundColor Gray
Write-Host "  - User Token: KJAHA99L" -ForegroundColor Gray
Write-Host "  - Headed Mode: $Headed" -ForegroundColor Gray
Write-Host "  - Percy: $Percy" -ForegroundColor Gray
Write-Host ""

& $scriptPath @testParams

$exitCode = $LASTEXITCODE

if ($exitCode -eq 0) {
    Write-Host ""
    Write-Host "✅ Screenshot-based test execution completed successfully" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "❌ Screenshot-based test execution failed (Exit Code: $exitCode)" -ForegroundColor Red
}

exit $exitCode
