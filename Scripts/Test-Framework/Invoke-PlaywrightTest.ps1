<#
.SYNOPSIS
    Universal orchestration wrapper for Playwright/Percy tests.

.DESCRIPTION
    This is the CANONICAL pattern for running Playwright tests against NoorCanvas.
    
    WORKFLOW:
    1. Starts application using Start-NoorCanvasForTests.ps1
    2. Runs specified Playwright test(s)
    3. Stops application using Stop-NoorCanvasForTests.ps1
    4. Returns test results
    
    BENEFITS:
    - ✅ Consistent app lifecycle management
    - ✅ Automatic cleanup on success/failure
    - ✅ Proper error propagation
    - ✅ Support for Percy visual regression tests
    - ✅ Configurable test execution (headed/headless)

.PARAMETER TestFile
    Path to Playwright test file (relative to workspace root).
    Can be a specific .spec.ts file or a pattern.

.PARAMETER Headed
    Run tests in headed mode (visible browser).

.PARAMETER Percy
    Enable Percy visual regression testing.

.PARAMETER PercyToken
    Percy authentication token. If not provided, uses PERCY_TOKEN environment variable.

.PARAMETER SessionToken
    Session token to inject into test environment (for authenticated tests).

.PARAMETER SkipBuild
    Skip building the application (use existing build).

.PARAMETER KeepAppRunning
    Keep application running after tests complete (for debugging).

.PARAMETER PlaywrightArgs
    Additional arguments to pass to Playwright CLI.

.EXAMPLE
    .\Invoke-PlaywrightTest.ps1 -TestFile "Tests/UI/debug-panel.spec.ts" -Headed

.EXAMPLE
    .\Invoke-PlaywrightTest.ps1 -TestFile "Tests/UI/visual-*.spec.ts" -Percy -Headed

.EXAMPLE
    .\Invoke-PlaywrightTest.ps1 -TestFile "Tests/UI/auth-test.spec.ts" -SessionToken "KJAHA99L"
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory=$true)]
    [string]$TestFile,
    
    [switch]$Headed,
    [switch]$Percy,
    [string]$PercyToken,
    [string]$SessionToken,
    [switch]$SkipBuild,
    [switch]$KeepAppRunning,
    [string[]]$PlaywrightArgs
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

# ============================================================================
# SETUP
# ============================================================================

$workspaceRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$testFrameworkPath = $PSScriptRoot  # Already in Scripts/Test-Framework
$startScript = Join-Path $testFrameworkPath "Start-NoorCanvasForTests.ps1"
$stopScript = Join-Path $testFrameworkPath "Stop-NoorCanvasForTests.ps1"

Write-Host ""
Write-Host "===================================================================" -ForegroundColor Magenta
Write-Host "  NoorCanvas Playwright Test Runner v3.0" -ForegroundColor Magenta
Write-Host "===================================================================" -ForegroundColor Magenta
Write-Host ""
Write-Host "  Test File:    $TestFile" -ForegroundColor White
Write-Host "  Headed:       $Headed" -ForegroundColor White
Write-Host "  Percy:        $Percy" -ForegroundColor White
Write-Host "  Session:      $(if ($SessionToken) { $SessionToken } else { 'None' })" -ForegroundColor White
Write-Host ""

# Validate test file exists
$fullTestPath = Join-Path $workspaceRoot $TestFile
if (-not (Test-Path $fullTestPath)) {
    Write-Host "❌ Test file not found: $fullTestPath" -ForegroundColor Red
    exit 1
}

# ============================================================================
# BUILD (OPTIONAL)
# ============================================================================

if (-not $SkipBuild) {
    Write-Host "[BUILD] Building NoorCanvas..." -ForegroundColor Cyan
    
    Push-Location (Join-Path $workspaceRoot "SPA\NoorCanvas")
    try {
        dotnet build --configuration Debug --no-restore | Out-Null
        
        if ($LASTEXITCODE -ne 0) {
            throw "Build failed with exit code $LASTEXITCODE"
        }
        
        Write-Host "✅ Build successful" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Build failed: $_" -ForegroundColor Red
        Pop-Location
        exit 1
    }
    finally {
        Pop-Location
    }
}
else {
    Write-Host "[BUILD] Skipping build (using existing binaries)" -ForegroundColor Yellow
}

Write-Host ""

# ============================================================================
# START APPLICATION
# ============================================================================

Write-Host "[APP] Starting NoorCanvas..." -ForegroundColor Cyan

try {
    $appInfo = & $startScript
    
    if (-not $appInfo.Success) {
        throw "Failed to start application"
    }
    
    Write-Host "✅ Application started (PID: $($appInfo.ProcessId))" -ForegroundColor Green
}
catch {
    Write-Host "❌ Failed to start application: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# ============================================================================
# SETUP TEST ENVIRONMENT
# ============================================================================

Write-Host "[TEST] Configuring test environment..." -ForegroundColor Cyan

# Set session token if provided
if ($SessionToken) {
    $env:PW_SESSION_TOKEN = $SessionToken
    Write-Host "  ✅ Session token: $SessionToken" -ForegroundColor Green
}

# Set Percy token if Percy testing enabled
if ($Percy) {
    if ($PercyToken) {
        $env:PERCY_TOKEN = $PercyToken
    }
    
    if (-not $env:PERCY_TOKEN) {
        Write-Host "❌ Percy enabled but PERCY_TOKEN not set!" -ForegroundColor Red
        Write-Host "  Run: .\setup-percy.ps1" -ForegroundColor Yellow
        
        & $stopScript -ProcessId $appInfo.ProcessId -Force
        exit 1
    }
    
    Write-Host "  ✅ Percy enabled" -ForegroundColor Green
}

# ============================================================================
# RUN PLAYWRIGHT TESTS
# ============================================================================

Write-Host ""
Write-Host "[TEST] Running Playwright tests..." -ForegroundColor Cyan
Write-Host "  File: $TestFile" -ForegroundColor Gray

# Build Playwright command
$playwrightCmd = @("playwright", "test", $TestFile, "--reporter=list")

if ($Headed) {
    $playwrightCmd += "--headed"
}

if ($PlaywrightArgs) {
    $playwrightCmd += $PlaywrightArgs
}

# Execute tests
try {
    Push-Location $workspaceRoot
    
    if ($Percy) {
        # Run with Percy wrapper
        $percyCmd = @("percy", "exec", "--") + $playwrightCmd
        Write-Host "  Command: npx $($percyCmd -join ' ')" -ForegroundColor Gray
        
        & npx @percyCmd
        $testExitCode = $LASTEXITCODE
    }
    else {
        # Run without Percy
        Write-Host "  Command: npx $($playwrightCmd -join ' ')" -ForegroundColor Gray
        
        & npx @playwrightCmd
        $testExitCode = $LASTEXITCODE
    }
}
catch {
    Write-Host "❌ Test execution failed: $_" -ForegroundColor Red
    $testExitCode = 1
}
finally {
    Pop-Location
}

Write-Host ""

# ============================================================================
# CLEANUP
# ============================================================================

if ($KeepAppRunning) {
    Write-Host "[CLEANUP] Keeping application running (PID: $($appInfo.ProcessId))" -ForegroundColor Yellow
    Write-Host "  To stop manually: Stop-Process -Id $($appInfo.ProcessId) -Force" -ForegroundColor Gray
}
else {
    Write-Host "[CLEANUP] Stopping application..." -ForegroundColor Cyan
    
    & $stopScript -ProcessId $appInfo.ProcessId -Force -CleanupTempFiles
    
    Write-Host "✅ Cleanup complete" -ForegroundColor Green
}

# ============================================================================
# RESULTS
# ============================================================================

Write-Host ""
Write-Host "===================================================================" -ForegroundColor Magenta

if ($testExitCode -eq 0) {
    Write-Host "  TESTS PASSED" -ForegroundColor Green
}
else {
    Write-Host "  TESTS FAILED (Exit Code: $testExitCode)" -ForegroundColor Red
}

Write-Host "===================================================================" -ForegroundColor Magenta
Write-Host ""

exit $testExitCode
