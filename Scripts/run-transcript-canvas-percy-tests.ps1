<#
.SYNOPSIS
    Launches NOOR Canvas application and runs TranscriptCanvas HTML structure Percy visual regression tests.

.DESCRIPTION
    This script validates that HTML structure fixes prevent rendering issues:
    1. Launches application in dedicated PowerShell window
    2. Waits for application to be ready (health check)
    3. Runs Playwright + Percy tests with headed browser
    4. Captures visual snapshots at multiple viewport sizes
    5. Validates sidebar removal and modal functionality
    6. Cleans up application process after tests complete
    
    Visual regression tests cover:
    - Sidebar completely removed (no right panel)
    - Question modal toggle button visible
    - Canvas area full-width on all viewports
    - No broken/orphaned HTML elements
    - Responsive design (mobile 375px, tablet 768px, desktop 1280px)
    
.PARAMETER TestPattern
    Playwright test file pattern to run. Defaults to transcript-canvas HTML structure test.

.PARAMETER SkipBuild
    Skip building the application before launching (use if already built).

.PARAMETER KeepAppRunning
    Keep application running after tests complete (for debugging).

.PARAMETER HeadlessTests
    Run Playwright tests in headless mode (default is headed for visual verification).

.EXAMPLE
    .\run-transcript-canvas-percy-tests.ps1
    
    Builds and launches app, runs all TranscriptCanvas Percy tests in headed mode.

.EXAMPLE
    .\run-transcript-canvas-percy-tests.ps1 -SkipBuild
    
    Skips build, launches app from existing binaries.

.EXAMPLE
    .\run-transcript-canvas-percy-tests.ps1 -KeepAppRunning
    
    Keeps application running after tests for manual verification.

.NOTES
    Author: GitHub Copilot (task agent)
    Date: 2025-10-18
    Version: 1.0.0
    
    TRACE: [TRACE-WORKITEM:transcript-canvas:html-structure-fix] Percy orchestration script ;CLEANUP_OK
    
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
    [string]$TestPattern = "Tests/UI/transcript-canvas-html-structure.spec.ts",
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
$AppStartupGracePeriodSeconds = 5

# Script state
$AppProcess = $null
$TestExitCode = 0

Write-Host ""
Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "   NOOR Canvas - TranscriptCanvas HTML Structure Percy Tests   " -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

#region Helper Functions

function Test-PercyConfiguration {
    Write-Host "🔍 Checking Percy configuration..." -ForegroundColor Yellow
    
    if (-not $env:PERCY_TOKEN) {
        Write-Host "❌ PERCY_TOKEN environment variable not set" -ForegroundColor Red
        Write-Host ""
        Write-Host "💡 To configure Percy:" -ForegroundColor Yellow
        Write-Host "   1. Run: .\setup-percy.ps1" -ForegroundColor White
        Write-Host "   2. Or set manually: `$env:PERCY_TOKEN = 'your-token'" -ForegroundColor White
        Write-Host ""
        return $false
    }
    
    Write-Host "✅ Percy token configured" -ForegroundColor Green
    return $true
}

function Build-Application {
    Write-Host "🔨 Building NOOR Canvas application..." -ForegroundColor Yellow
    
    Push-Location $AppProjectPath
    try {
        $buildOutput = dotnet build --configuration Release 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ Build failed:" -ForegroundColor Red
            Write-Host $buildOutput -ForegroundColor Red
            throw "Application build failed"
        }
        Write-Host "✅ Build completed successfully" -ForegroundColor Green
    }
    finally {
        Pop-Location
    }
}

function Start-ApplicationInBackground {
    Write-Host "🚀 Launching NOOR Canvas in dedicated PowerShell window..." -ForegroundColor Yellow
    
    Push-Location $AppProjectPath
    try {
        # Launch in new PowerShell window (not Terminal) for proper isolation
        $AppProcess = Start-Process powershell.exe -ArgumentList @(
            "-NoExit",
            "-Command",
            "dotnet run --no-build --configuration Release --urls=$AppUrl"
        ) -PassThru -WindowStyle Normal
        
        Write-Host "✅ Application launched (PID: $($AppProcess.Id))" -ForegroundColor Green
        
        # Grace period for application startup
        Write-Host "⏳ Waiting $AppStartupGracePeriodSeconds seconds for application startup..." -ForegroundColor Yellow
        Start-Sleep -Seconds $AppStartupGracePeriodSeconds
        
        return $AppProcess
    }
    finally {
        Pop-Location
    }
}

function Wait-ForApplicationReady {
    Write-Host "⏳ Waiting for application health check..." -ForegroundColor Yellow
    
    $attempts = 0
    $isReady = $false
    
    while ($attempts -lt $MaxHealthCheckAttempts -and -not $isReady) {
        $attempts++
        
        try {
            # Ignore SSL certificate validation for localhost
            $response = Invoke-WebRequest -Uri $HealthCheckEndpoint -SkipCertificateCheck -TimeoutSec 5 -ErrorAction SilentlyContinue
            
            if ($response.StatusCode -eq 200) {
                $isReady = $true
                Write-Host "✅ Application is ready!" -ForegroundColor Green
                return $true
            }
        }
        catch {
            # Suppress errors during health check retries
        }
        
        if (-not $isReady) {
            Write-Host "   Attempt $attempts/$MaxHealthCheckAttempts - Retrying in $HealthCheckIntervalSeconds seconds..." -ForegroundColor Gray
            Start-Sleep -Seconds $HealthCheckIntervalSeconds
        }
    }
    
    Write-Host "❌ Application did not become ready after $MaxHealthCheckAttempts attempts" -ForegroundColor Red
    return $false
}

function Invoke-PlaywrightPercyTests {
    param([string]$Pattern, [bool]$Headed)
    
    Write-Host ""
    Write-Host "🎭 Running Playwright + Percy visual regression tests..." -ForegroundColor Yellow
    Write-Host "   Test Pattern: $Pattern" -ForegroundColor Gray
    Write-Host "   Mode: $(if ($Headed) { 'Headed (visible browser)' } else { 'Headless' })" -ForegroundColor Gray
    Write-Host ""
    
    $playwrightArgs = @(
        "percy", "exec", "--",
        "npx", "playwright", "test",
        $Pattern
    )
    
    if ($Headed) {
        $playwrightArgs += "--headed"
    }
    
    # Run tests
    & $playwrightArgs[0] $playwrightArgs[1..($playwrightArgs.Length - 1)]
    
    return $LASTEXITCODE
}

function Stop-ApplicationProcess {
    param([System.Diagnostics.Process]$Process)
    
    if ($null -eq $Process) {
        return
    }
    
    Write-Host ""
    Write-Host "🛑 Stopping application (PID: $($Process.Id))..." -ForegroundColor Yellow
    
    try {
        # Kill process tree (including child processes)
        Stop-Process -Id $Process.Id -Force -ErrorAction SilentlyContinue
        Write-Host "✅ Application stopped" -ForegroundColor Green
    }
    catch {
        Write-Host "⚠️  Could not stop application process: $_" -ForegroundColor Yellow
    }
}

#endregion

#region Main Execution

try {
    # Step 1: Verify Percy configuration
    if (-not (Test-PercyConfiguration)) {
        exit 1
    }
    
    # Step 2: Build application (unless skipped)
    if (-not $SkipBuild) {
        Build-Application
    }
    else {
        Write-Host "⏭️  Skipping build (using existing binaries)" -ForegroundColor Yellow
    }
    
    # Step 3: Launch application
    $AppProcess = Start-ApplicationInBackground
    
    # Step 4: Wait for application to be ready
    if (-not (Wait-ForApplicationReady)) {
        throw "Application failed to start"
    }
    
    # Step 5: Run Playwright + Percy tests
    $headed = -not $HeadlessTests
    $TestExitCode = Invoke-PlaywrightPercyTests -Pattern $TestPattern -Headed $headed
    
    # Step 6: Report results
    Write-Host ""
    Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "                         Test Results                           " -ForegroundColor Cyan
    Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    
    if ($TestExitCode -eq 0) {
        Write-Host "✅ All tests passed!" -ForegroundColor Green
        Write-Host ""
        Write-Host "📸 Percy snapshots uploaded to dashboard" -ForegroundColor Cyan
        Write-Host "   View at: https://percy.io/noor-canvas/noor-canvas" -ForegroundColor Gray
    }
    else {
        Write-Host "❌ Tests failed (exit code: $TestExitCode)" -ForegroundColor Red
    }
    
    Write-Host ""
}
catch {
    Write-Host ""
    Write-Host "❌ Script failed: $_" -ForegroundColor Red
    Write-Host $_.ScriptStackTrace -ForegroundColor Red
    $TestExitCode = 1
}
finally {
    # Step 7: Cleanup (unless KeepAppRunning flag set)
    if (-not $KeepAppRunning) {
        Stop-ApplicationProcess -Process $AppProcess
    }
    else {
        Write-Host ""
        Write-Host "⏸️  Application kept running (PID: $($AppProcess.Id))" -ForegroundColor Yellow
        Write-Host "   Press Ctrl+C in application window to stop" -ForegroundColor Gray
        Write-Host "   Or run: Stop-Process -Id $($AppProcess.Id)" -ForegroundColor Gray
    }
    
    Write-Host ""
    Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
}

exit $TestExitCode

#endregion
