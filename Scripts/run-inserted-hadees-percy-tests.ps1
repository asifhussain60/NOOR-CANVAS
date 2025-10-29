<#
.SYNOPSIS
    Runs inserted hadees rendering tests with Percy visual regression.

.DESCRIPTION
    This script:
    1. Launches NOOR Canvas application using ncw.ps1 (handles cleanup and health check)
    2. Runs Playwright + Percy tests with headed browser
    3. Captures visual snapshots at multiple viewport sizes
    4. Tracks JavaScript console errors during test execution
    5. Cleans up application process after tests complete
    
    Test Coverage:
    - SessionCanvas hadees rendering
    - TranscriptCanvas hadees with narrow theme
    - HostControlPanel hadees in transcript view
    - Transformation function validation
    - Visual comparison across all views
    - Responsive design validation

.PARAMETER TestPattern
    Playwright test file pattern to run. Defaults to inserted-hadees-rendering.spec.ts

.PARAMETER KeepAppRunning
    Keep application running after tests complete (for debugging).

.PARAMETER HeadlessTests
    Run tests in headless mode (no visible browser).

.EXAMPLE
    .\Scripts\run-inserted-hadees-percy-tests.ps1

.EXAMPLE
    .\Scripts\run-inserted-hadees-percy-tests.ps1 -KeepAppRunning

.EXAMPLE
    .\Scripts\run-inserted-hadees-percy-tests.ps1 -HeadlessTests
#>

[CmdletBinding()]
param(
    [string]$TestPattern = "Tests/UI/inserted-hadees-rendering.spec.ts",
    [switch]$KeepAppRunning,
    [switch]$HeadlessTests
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

# Configuration
$AppUrl = "https://localhost:9091"
$AppPorts = @(9091, 9090)
$NcwScriptPath = Join-Path $PSScriptRoot "ncw.ps1"

Write-Host ""
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host "  NOOR Canvas - Inserted Hadees Rendering Percy Test Runner" -ForegroundColor Cyan
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host ""

# Checkpoint: Verify Percy setup
Write-Host "[CHECKPOINT] Verifying Percy configuration..." -ForegroundColor Yellow

if (-not $env:PERCY_TOKEN) {
    Write-Host "⚠️  WARNING: PERCY_TOKEN environment variable not set!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Percy visual regression will be DISABLED for this run." -ForegroundColor Yellow
    Write-Host "Tests will run but visual snapshots will NOT be captured." -ForegroundColor Yellow
    Write-Host ""
}
else {
    Write-Host "✅ Percy token configured" -ForegroundColor Green
}

# Step 1: Launch application using ncw.ps1
Write-Host ""
Write-Host "[STEP 1/5] Launching application using ncw.ps1..." -ForegroundColor Cyan

& $NcwScriptPath -Environment Development -StartupTimeout 30

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ ERROR: Application failed to start via ncw.ps1" -ForegroundColor Red
    exit 1
}

Write-Host "✅ App launched and verified ready" -ForegroundColor Green

# Get the app process ID for later cleanup
$appProcesses = Get-Process | Where-Object {
    ($_.ProcessName -eq "dotnet" -and $_.Path -like "*NoorCanvas*") -or
    ($_.ProcessName -eq "NoorCanvas")
}

if ($appProcesses) {
    $app = $appProcesses[0]
    Write-Host "  Tracked app PID: $($app.Id)" -ForegroundColor Gray
}
else {
    Write-Host "  ⚠️  Could not identify app process (cleanup will use port-based termination)" -ForegroundColor Yellow
}

# Step 2: Run Percy tests
Write-Host ""
Write-Host "[STEP 2/5] Running Percy visual regression tests..." -ForegroundColor Cyan
Write-Host "  Test Pattern: $TestPattern" -ForegroundColor Gray
Write-Host "  Mode: $(if ($HeadlessTests) { 'Headless' } else { 'Headed (Visual Verification)' })" -ForegroundColor Gray
Write-Host ""

if ($env:PERCY_TOKEN) {
    Write-Host "  Percy will:" -ForegroundColor Yellow
    Write-Host "    1. Capture visual snapshots at multiple viewport sizes" -ForegroundColor Gray
    Write-Host "    2. Upload snapshots to Percy dashboard" -ForegroundColor Gray
    Write-Host "    3. Compare against baseline (first run establishes baseline)" -ForegroundColor Gray
    Write-Host "    4. Report visual differences in dashboard" -ForegroundColor Gray
}
else {
    Write-Host "  Percy DISABLED - running tests without visual snapshots" -ForegroundColor Yellow
}

Write-Host ""

$TestArgs = @(
    "test"
    $TestPattern
    "--config=config/testing/playwright.config.cjs"
)

if (-not $HeadlessTests) {
    $TestArgs += "--headed"
}

if ($env:PERCY_TOKEN) {
    Write-Host "  Command: percy exec -- npx playwright $($TestArgs -join ' ')" -ForegroundColor Gray
    Write-Host ""
    
    try {
        & percy exec -- npx playwright @TestArgs
        $TestExitCode = $LASTEXITCODE
    }
    catch {
        Write-Host "❌ ERROR: Percy tests failed to run: $_" -ForegroundColor Red
        $TestExitCode = 1
    }
}
else {
    Write-Host "  Command: npx playwright $($TestArgs -join ' ')" -ForegroundColor Gray
    Write-Host ""
    
    try {
        & npx playwright @TestArgs
        $TestExitCode = $LASTEXITCODE
    }
    catch {
        Write-Host "❌ ERROR: Tests failed to run: $_" -ForegroundColor Red
        $TestExitCode = 1
    }
}

Write-Host ""
if ($TestExitCode -eq 0) {
    Write-Host "✅ Tests completed successfully" -ForegroundColor Green
} else {
    Write-Host "⚠️  Tests completed with failures (exit code: $TestExitCode)" -ForegroundColor Yellow
}

# Step 3: Display Percy dashboard link (if enabled)
if ($env:PERCY_TOKEN) {
    Write-Host ""
    Write-Host "[STEP 3/5] Percy Dashboard Access" -ForegroundColor Cyan
    Write-Host "  Visual snapshots uploaded to:" -ForegroundColor Gray
    Write-Host "  https://percy.io/[your-org]/noorcanvas" -ForegroundColor White
    Write-Host ""
    Write-Host "  Check for:" -ForegroundColor Yellow
    Write-Host "    - Baseline approval (if first run)" -ForegroundColor Gray
    Write-Host "    - Visual differences detection" -ForegroundColor Gray
    Write-Host "    - Cross-browser rendering issues" -ForegroundColor Gray
}
else {
    Write-Host ""
    Write-Host "[STEP 3/5] Percy Dashboard" -ForegroundColor Cyan
    Write-Host "  Skipped (Percy not configured)" -ForegroundColor Yellow
}

# Step 4: Cleanup
Write-Host ""
Write-Host "[STEP 4/5] Cleanup" -ForegroundColor Cyan

# Helper function for port-based cleanup
function Stop-ProcessesOnPorts {
    param([int[]]$Ports)
    
    foreach ($port in $Ports) {
        try {
            $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
            foreach ($conn in $connections) {
                try {
                    $process = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
                    if ($process) {
                        Write-Host "    Stopping process on port ${port}: $($process.ProcessName) (PID: $($process.Id))" -ForegroundColor Gray
                        Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
                    }
                }
                catch {
                    # Process may have already exited
                }
            }
        }
        catch {
            # Port not in use
        }
    }
}

if ($KeepAppRunning) {
    if ($app) {
        Write-Host "  Application still running (PID: $($app.Id))" -ForegroundColor Yellow
    }
    else {
        Write-Host "  Application still running" -ForegroundColor Yellow
    }
    Write-Host "  Access at: $AppUrl" -ForegroundColor White
    if ($app) {
        Write-Host "  Stop manually with: Stop-Process -Id $($app.Id)" -ForegroundColor Gray
    }
    else {
        Write-Host "  Stop manually by closing the application window" -ForegroundColor Gray
    }
}
else {
    Write-Host "  Stopping application..." -ForegroundColor Yellow
    
    try {
        # Kill by PID if we have it
        if ($app) {
            Stop-Process -Id $app.Id -Force -ErrorAction SilentlyContinue
        }
        
        # Also clean up by port (catches any missed processes)
        Stop-ProcessesOnPorts -Ports $AppPorts
        
        Start-Sleep -Seconds 1
        Write-Host "  ✅ Application stopped" -ForegroundColor Green
    }
    catch {
        Write-Host "  ⚠️  Failed to stop app (may have already exited)" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host "  SUMMARY" -ForegroundColor Cyan
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host "  Tests: $(if ($TestExitCode -eq 0) { '✅ PASSED' } else { '❌ FAILED' })" -ForegroundColor $(if ($TestExitCode -eq 0) { 'Green' } else { 'Red' })

if ($env:PERCY_TOKEN) {
    Write-Host "  Visual Snapshots: Uploaded to Percy dashboard" -ForegroundColor Gray
}
else {
    Write-Host "  Visual Snapshots: Skipped (Percy not configured)" -ForegroundColor Yellow
}

Write-Host "  Application: $(if ($KeepAppRunning) { 'Still running' } else { 'Stopped' })" -ForegroundColor Gray
Write-Host ""

if ($env:PERCY_TOKEN -and $TestExitCode -eq 0) {
    Write-Host "Next Steps:" -ForegroundColor Yellow
    Write-Host "  1. Review visual differences in Percy dashboard" -ForegroundColor White
    Write-Host "  2. Approve baselines if first run" -ForegroundColor White
    Write-Host "  3. Investigate any unexpected visual changes" -ForegroundColor White
}
elseif ($TestExitCode -ne 0) {
    Write-Host "Next Steps:" -ForegroundColor Yellow
    Write-Host "  1. Review test failure output above" -ForegroundColor White
    Write-Host "  2. Check browser console logs for JavaScript errors" -ForegroundColor White
    Write-Host "  3. Verify .inserted-hadees structure in HTML" -ForegroundColor White
}

Write-Host ""

exit $TestExitCode
