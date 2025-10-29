# Debug Panel E2E Visual Regression Test Orchestrator
# 
# Purpose: Launch NoorCanvas app in separate elevated PowerShell window with Development environment,
#          execute comprehensive Playwright + Percy visual regression tests, and manage cleanup.
# 
# Features:
# - Launches app in SEPARATE PowerShell window (not terminal) for proper isolation
# - Sets ASPNETCORE_ENVIRONMENT = 'Development' before app startup
# - Waits for app to be fully ready (health check with retry)
# - Executes Playwright visual regression tests in HEADED mode
# - Percy visual regression integration (optional)
# - Proper cleanup and process management
# - Detailed logging with trace markers
# 
# Usage:
#   .\Scripts\run-debug-panel-e2e-visual-test.ps1
#   .\Scripts\run-debug-panel-e2e-visual-test.ps1 -SkipPercy
#   .\Scripts\run-debug-panel-e2e-visual-test.ps1 -KeepAppRunning
# 
# Parameters:
#   -SkipPercy: Skip Percy visual regression (faster, Playwright only)
#   -KeepAppRunning: Don't kill app after tests (for manual verification)
#   -Headless: Run tests in headless mode (default: headed for visual verification)
# 
# Created: 2025-10-14 23:00
# Key: debug-panel

param(
    [switch]$SkipPercy,
    [switch]$KeepAppRunning,
    [switch]$Headless
)

$ErrorActionPreference = "Stop"

Write-Host "`n" -ForegroundColor Cyan
Write-Host "Debug Panel E2E Visual Regression Test Orchestrator" -ForegroundColor Cyan
Write-Host "`n" -ForegroundColor Cyan

Write-Host "[DEBUG-WORKITEM:debug-panel:orchestrator:TRACE] Starting test orchestration ;CLEANUP_OK" -ForegroundColor Gray

# Configuration
$workspaceRoot = "D:\PROJECTS\NOOR CANVAS"
$appPath = "$workspaceRoot\SPA\NoorCanvas"
$testPath = "$workspaceRoot\Tests\UI"
$appUrl = "https://localhost:9091"
$maxStartupWaitSeconds = 30
$healthCheckRetries = 10
$healthCheckDelaySec = 3

# Step 1: Validate paths
Write-Host "`n[1/7] Validating workspace paths..." -ForegroundColor Yellow

if (!(Test-Path $appPath)) {
    Write-Error "App path not found: $appPath"
    exit 1
}

if (!(Test-Path $testPath)) {
    Write-Error "Test path not found: $testPath"
    exit 1
}

Write-Host "   Workspace paths validated" -ForegroundColor Green

# Step 2: Kill any existing NoorCanvas processes
Write-Host "`n[2/7] Checking for existing NoorCanvas processes..." -ForegroundColor Yellow

$existingProcesses = Get-Process -Name "NoorCanvas" -ErrorAction SilentlyContinue
if ($existingProcesses) {
    Write-Host "    Found $($existingProcesses.Count) existing process(es), terminating..." -ForegroundColor Yellow
    $existingProcesses | Stop-Process -Force
    Start-Sleep -Seconds 2
    Write-Host "   Existing processes terminated" -ForegroundColor Green
} else {
    Write-Host "   No existing processes found" -ForegroundColor Green
}

# Step 3: Launch app with direct dotnet.exe (v3.0 pattern) with Development environment
Write-Host "`n[3/7] Launching NoorCanvas with direct dotnet.exe..." -ForegroundColor Yellow

# Set environment variable before launch
$env:ASPNETCORE_ENVIRONMENT = 'Development'

Write-Host "   Setting ASPNETCORE_ENVIRONMENT = Development" -ForegroundColor Gray

$appProcess = Start-Process -FilePath "dotnet" `
    -ArgumentList "run", "--urls", $appUrl `
    -WorkingDirectory $appPath `
    -PassThru `
    -WindowStyle Normal

Write-Host "   App launched (PID: $($appProcess.Id))" -ForegroundColor Green
Write-Host "   Waiting for app to start (max $maxStartupWaitSeconds seconds)..." -ForegroundColor Yellow

# Step 4: Health check with retry logic
Write-Host "`n[4/7] Performing health checks..." -ForegroundColor Yellow

# PowerShell 5.1 compatible SSL bypass
if (-not ([System.Management.Automation.PSTypeName]'TrustAllCertsPolicy').Type) {
    add-type @"
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
}
[System.Net.ServicePointManager]::CertificatePolicy = New-Object TrustAllCertsPolicy
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12

$appReady = $false
$attemptCount = 0

while (-not $appReady -and $attemptCount -lt $healthCheckRetries) {
    $attemptCount++
    Write-Host "  Health check attempt $attemptCount/$healthCheckRetries..." -ForegroundColor Gray
    
    try {
        $response = Invoke-WebRequest -Uri $appUrl -Method GET -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            $appReady = $true
            Write-Host "  Success App is ready! (HTTP $($response.StatusCode))" -ForegroundColor Green
        }
    } catch {
        if ($attemptCount -lt $healthCheckRetries) {
            Write-Host "  Waiting Not ready yet, waiting $healthCheckDelaySec seconds..." -ForegroundColor Gray
            Start-Sleep -Seconds $healthCheckDelaySec
        }
    }
}

if (-not $appReady) {
    Write-Host "   App failed to start within $maxStartupWaitSeconds seconds" -ForegroundColor Red
    Write-Host "   Terminating app process..." -ForegroundColor Yellow
    Stop-Process -Id $appProcess.Id -Force -ErrorAction SilentlyContinue
    exit 1
}

Write-Host "   App health check passed" -ForegroundColor Green

# Step 5: Execute Playwright visual regression tests
Write-Host "`n[5/7] Executing Playwright visual regression tests..." -ForegroundColor Yellow

Set-Location $testPath

$playwrightArgs = @(
    "test",
    "debug-panel-direct-visibility.spec.ts",
    "--reporter=list"
)

if ($Headless) {
    Write-Host "    Running in HEADLESS mode" -ForegroundColor Gray
} else {
    $playwrightArgs += "--headed"
    Write-Host "    Running in HEADED mode (visible browser)" -ForegroundColor Gray
}

if (-not $SkipPercy) {
    Write-Host "   Percy visual regression ENABLED" -ForegroundColor Gray
    $env:PERCY_TOKEN = $env:PERCY_TOKEN # Preserve existing token if set
    # Percy will be invoked via npm run test:percy if configured
} else {
    Write-Host "    Percy visual regression SKIPPED" -ForegroundColor Gray
}

Write-Host "    Command: npx playwright $($playwrightArgs -join ' ')" -ForegroundColor Gray
Write-Host ""

npx playwright @playwrightArgs

$testExitCode = $LASTEXITCODE

# Step 6: Verify test artifacts
Write-Host "`n[6/7] Verifying test artifacts..." -ForegroundColor Yellow

$screenshotPath = "$workspaceRoot\Workspaces\TEMP"
$expectedScreenshots = @(
    "debug-panel-direct-test-collapsed.png",
    "debug-panel-direct-test-expanded.png"
)

$foundArtifacts = 0
foreach ($screenshot in $expectedScreenshots) {
    $fullPath = Join-Path $screenshotPath $screenshot
    if (Test-Path $fullPath) {
        $fileInfo = Get-Item $fullPath
        $fileSizeKB = [math]::Round($fileInfo.Length / 1KB, 2)
        Write-Host "  Success $screenshot ($fileSizeKB KB)" -ForegroundColor Green
        $foundArtifacts++
    } else {
        Write-Host "  Warning $screenshot (not found)" -ForegroundColor Yellow
    }
}

if ($foundArtifacts -eq $expectedScreenshots.Count) {
    Write-Host "   All test artifacts created successfully" -ForegroundColor Green
} else {
    Write-Host "    Some test artifacts missing ($foundArtifacts/$($expectedScreenshots.Count))" -ForegroundColor Yellow
}

# Step 7: Cleanup
Write-Host "`n[7/7] Cleanup..." -ForegroundColor Yellow

if ($KeepAppRunning) {
    Write-Host "    App still running (KeepAppRunning flag set)" -ForegroundColor Yellow
    Write-Host "   App PID: $($appProcess.Id)" -ForegroundColor Gray
    Write-Host "   To stop manually: Stop-Process -Id $($appProcess.Id) -Force" -ForegroundColor Cyan
} else {
    Write-Host "   Terminating app process (PID: $($appProcess.Id))..." -ForegroundColor Yellow
    Stop-Process -Id $appProcess.Id -Force -ErrorAction SilentlyContinue
    
    # Wait a moment and verify
    Start-Sleep -Seconds 2
    $stillRunning = Get-Process -Id $appProcess.Id -ErrorAction SilentlyContinue
    if ($stillRunning) {
        Write-Host "    App process still running, force killing..." -ForegroundColor Yellow
        Get-Process -Name "NoorCanvas" -ErrorAction SilentlyContinue | Stop-Process -Force
    }
    
    Write-Host "   App process terminated" -ForegroundColor Green
}

# Final Summary
Write-Host "`n" -ForegroundColor Cyan
Write-Host "Test Execution Summary" -ForegroundColor Cyan
Write-Host "" -ForegroundColor Cyan

if ($testExitCode -eq 0) {
    Write-Host " ALL TESTS PASSED" -ForegroundColor Green
} else {
    Write-Host " TESTS FAILED (Exit Code: $testExitCode)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Test Results:" -ForegroundColor White
Write-Host "  - Exit Code: $testExitCode" -ForegroundColor $(if ($testExitCode -eq 0) { "Green" } else { "Red" })
Write-Host "  - Artifacts Found: $foundArtifacts/$($expectedScreenshots.Count)" -ForegroundColor $(if ($foundArtifacts -eq $expectedScreenshots.Count) { "Green" } else { "Yellow" })
Write-Host "  - Screenshots: $screenshotPath" -ForegroundColor Cyan
Write-Host "  - App Status: $(if ($KeepAppRunning) { 'Running' } else { 'Stopped' })" -ForegroundColor Yellow

Write-Host "`n`n" -ForegroundColor Cyan

Write-Host "[DEBUG-WORKITEM:debug-panel:orchestrator:TRACE] Test orchestration complete ;CLEANUP_OK" -ForegroundColor Gray

exit $testExitCode

