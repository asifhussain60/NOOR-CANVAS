<#
.SYNOPSIS
    Launches NOOR Canvas application in separate PowerShell window and runs Percy visual regression tests.

.DESCRIPTION
    This script ensures proper environment isolation for Playwright visual regression tests:
    1. Launches application in dedicated PowerShell window (not Terminal)
    2. Waits for application to be ready (health check)
    3. Runs Playwright + Percy tests with headed browser
    4. Captures visual snapshots at multiple viewport sizes
    5. Cleans up application process after tests complete
    
    Visual regression tests cover:
    - Debug panel visibility and positioning
    - "Enter Test Data" button states (enabled/disabled)
    - Form auto-fill animation and populated state
    - Responsive design (mobile 375px, tablet 768px, desktop 1280px)
    - Session canvas after auto-submit
    
.PARAMETER TestPattern
    Playwright test file pattern to run. Defaults to debug panel visual test.

.PARAMETER SkipBuild
    Skip building the application before launching (use if already built).

.PARAMETER KeepAppRunning
    Keep application running after tests complete (for debugging).

.PARAMETER HeadlessTests
    Run Playwright tests in headless mode (default is headed for visual verification).

.EXAMPLE
    .\run-debug-panel-percy-tests.ps1
    
    Builds and launches app, runs all debug panel Percy tests in headed mode.

.EXAMPLE
    .\run-debug-panel-percy-tests.ps1 -SkipBuild
    
    Skips build, launches app from existing binaries.

.EXAMPLE
    .\run-debug-panel-percy-tests.ps1 -KeepAppRunning
    
    Keeps application running after tests for manual verification.

.NOTES
    Author: GitHub Copilot
    Date: 2025-10-14
    Version: 1.0.0
    
    Requirements:
    - Percy CLI configured (PERCY_TOKEN environment variable)
    - Playwright installed (npx playwright install)
    - .NET 8.0 SDK
    - NOOR Canvas application at SPA/NoorCanvas
    
    Percy Setup:
    - Run setup-percy.ps1 first if Percy not configured
    - Visual snapshots uploaded to Percy dashboard
    - Baseline established on first run
    - Subsequent runs compared against baseline
#>

[CmdletBinding()]
param(
    [string]$TestPattern = "Tests/UI/debug-panel-user-landing-visual.spec.ts",
    [switch]$SkipBuild,
    [switch]$KeepAppRunning,
    [switch]$HeadlessTests
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

# Configuration
$AppProjectPath = "SPA\NoorCanvas"
$AppUrl = "https://localhost:9091"
$HealthCheckEndpoint = "$AppUrl/health"
$MaxHealthCheckAttempts = 30
$HealthCheckIntervalSeconds = 2

Write-Host ""
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host "  NOOR Canvas - Debug Panel Percy Visual Regression Test Runner" -ForegroundColor Cyan
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host ""

# Checkpoint: Verify Percy setup
Write-Host "[CHECKPOINT] Verifying Percy configuration..." -ForegroundColor Yellow

if (-not $env:PERCY_TOKEN) {
    Write-Host "❌ ERROR: PERCY_TOKEN environment variable not set!" -ForegroundColor Red
    Write-Host ""
    Write-Host "To setup Percy:" -ForegroundColor Yellow
    Write-Host "  1. Run: .\setup-percy.ps1" -ForegroundColor White
    Write-Host "  2. Follow prompts to login to Percy dashboard" -ForegroundColor White
    Write-Host "  3. Token will be saved to environment" -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host "✅ Percy token configured" -ForegroundColor Green

# Checkpoint: Verify Playwright installation
Write-Host "[CHECKPOINT] Verifying Playwright installation..." -ForegroundColor Yellow

$PlaywrightCheck = npx playwright --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ ERROR: Playwright not installed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "To install Playwright:" -ForegroundColor Yellow
    Write-Host "  npm install" -ForegroundColor White
    Write-Host "  npx playwright install" -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host "✅ Playwright installed: $PlaywrightCheck" -ForegroundColor Green

# Step 1: Build application (optional)
if (-not $SkipBuild) {
    Write-Host ""
    Write-Host "[STEP 1/6] Building NOOR Canvas application..." -ForegroundColor Cyan
    Write-Host "  Project: $AppProjectPath" -ForegroundColor Gray
    
    Push-Location $AppProjectPath
    try {
        dotnet build --configuration Debug --no-restore 2>&1 | Out-Null
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
} else {
    Write-Host ""
    Write-Host "[STEP 1/6] Skipping build (using existing binaries)" -ForegroundColor Yellow
}

# Step 2: Launch application in separate PowerShell window
Write-Host ""
Write-Host "[STEP 2/6] Launching application in separate PowerShell window..." -ForegroundColor Cyan
Write-Host "  URL: $AppUrl" -ForegroundColor Gray
Write-Host "  Path: $AppProjectPath" -ForegroundColor Gray

$AppProcess = Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd '$AppProjectPath'; Write-Host 'NOOR Canvas - Debug Panel Test Server' -ForegroundColor Cyan; Write-Host 'Press Ctrl+C to stop server' -ForegroundColor Yellow; dotnet run --no-build"
) -PassThru -WindowStyle Normal

Write-Host "✅ Application launched in PID $($AppProcess.Id)" -ForegroundColor Green
Write-Host "  Window: Separate PowerShell console (not Terminal)" -ForegroundColor Gray

# Step 3: Wait for application to be ready
Write-Host ""
Write-Host "[STEP 3/6] Waiting for application to be ready..." -ForegroundColor Cyan
Write-Host "  Health check: $HealthCheckEndpoint" -ForegroundColor Gray

$Attempt = 0
$AppReady = $false

# Disable certificate validation for localhost HTTPS
Add-Type @"
    using System.Net;
    using System.Security.Cryptography.X509Certificates;
    public class TrustAllCertsPolicy : ICertificatePolicy {
        public bool CheckValidationResult(
            ServicePoint srvPoint, X509Certificate certificate,
            WebRequest request, int certificateProblem) {
            return true;
        }
    }
"@
[System.Net.ServicePointManager]::CertificatePolicy = New-Object TrustAllCertsPolicy
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12

while ($Attempt -lt $MaxHealthCheckAttempts -and -not $AppReady) {
    $Attempt++
    Write-Host "  Attempt $Attempt/$MaxHealthCheckAttempts..." -ForegroundColor Gray -NoNewline
    
    try {
        # Try root URL instead of /health endpoint
        $Response = Invoke-WebRequest -Uri $AppUrl -Method GET -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
        if ($Response.StatusCode -eq 200) {
            $AppReady = $true
            Write-Host " ✅ Ready!" -ForegroundColor Green
        }
    }
    catch {
        Write-Host " ⏳ Waiting..." -ForegroundColor Yellow
        Start-Sleep -Seconds $HealthCheckIntervalSeconds
    }
}

if (-not $AppReady) {
    Write-Host ""
    Write-Host "❌ ERROR: Application failed to start within timeout" -ForegroundColor Red
    Write-Host "  Stopping application process..." -ForegroundColor Yellow
    Stop-Process -Id $AppProcess.Id -Force -ErrorAction SilentlyContinue
    exit 1
}

Write-Host "✅ Application is ready and responding" -ForegroundColor Green

# Step 4: Run Percy visual regression tests
Write-Host ""
Write-Host "[STEP 4/6] Running Percy visual regression tests..." -ForegroundColor Cyan
Write-Host "  Test Pattern: $TestPattern" -ForegroundColor Gray
Write-Host "  Mode: $(if ($HeadlessTests) { 'Headless' } else { 'Headed (Visual Verification)' })" -ForegroundColor Gray
Write-Host ""
Write-Host "  Percy will:" -ForegroundColor Yellow
Write-Host "    1. Capture visual snapshots at multiple viewport sizes" -ForegroundColor Gray
Write-Host "    2. Upload snapshots to Percy dashboard" -ForegroundColor Gray
Write-Host "    3. Compare against baseline (first run establishes baseline)" -ForegroundColor Gray
Write-Host "    4. Report visual differences in dashboard" -ForegroundColor Gray
Write-Host ""

$TestArgs = @(
    "exec",
    "--",
    "playwright",
    "test",
    "$TestPattern",
    "--config=config/testing/playwright.config.cjs"
)

if (-not $HeadlessTests) {
    $TestArgs += "--headed"
}

Write-Host "  Command: percy $($TestArgs -join ' ')" -ForegroundColor Gray
Write-Host ""

try {
    & percy $TestArgs
    $TestExitCode = $LASTEXITCODE
}
catch {
    Write-Host "❌ ERROR: Percy tests failed to run: $_" -ForegroundColor Red
    $TestExitCode = 1
}

Write-Host ""
if ($TestExitCode -eq 0) {
    Write-Host "✅ Percy tests completed successfully" -ForegroundColor Green
} else {
    Write-Host "⚠️ Percy tests completed with failures (exit code: $TestExitCode)" -ForegroundColor Yellow
}

# Step 5: Display Percy dashboard link
Write-Host ""
Write-Host "[STEP 5/6] Visual snapshots uploaded to Percy dashboard" -ForegroundColor Cyan
Write-Host "  View results: https://percy.io" -ForegroundColor Gray
Write-Host "  Project: NOOR-CANVAS" -ForegroundColor Gray
Write-Host ""

# Step 6: Cleanup
Write-Host ""
if ($KeepAppRunning) {
    Write-Host "[STEP 6/6] Keeping application running for manual verification" -ForegroundColor Yellow
    Write-Host "  URL: $AppUrl" -ForegroundColor Gray
    Write-Host "  PID: $($AppProcess.Id)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "To stop application manually:" -ForegroundColor Yellow
    Write-Host "  Stop-Process -Id $($AppProcess.Id)" -ForegroundColor White
} else {
    Write-Host "[STEP 6/6] Cleaning up application process..." -ForegroundColor Cyan
    
    try {
        Stop-Process -Id $AppProcess.Id -Force -ErrorAction Stop
        Write-Host "✅ Application stopped" -ForegroundColor Green
    }
    catch {
        Write-Host "⚠️ Warning: Could not stop application (PID $($AppProcess.Id))" -ForegroundColor Yellow
    }
}

# Summary
Write-Host ""
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host "  Test Execution Summary" -ForegroundColor Cyan
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Percy Tests: $(if ($TestExitCode -eq 0) { '✅ PASSED' } else { '❌ FAILED' })" -ForegroundColor $(if ($TestExitCode -eq 0) { 'Green' } else { 'Red' })
Write-Host "  Visual Snapshots: Uploaded to Percy dashboard" -ForegroundColor Gray
Write-Host "  Application: $(if ($KeepAppRunning) { 'Still running' } else { 'Stopped' })" -ForegroundColor Gray
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Review visual differences in Percy dashboard" -ForegroundColor White
Write-Host "  2. Approve baselines if first run" -ForegroundColor White
Write-Host "  3. Investigate any unexpected visual changes" -ForegroundColor White
Write-Host ""

exit $TestExitCode
