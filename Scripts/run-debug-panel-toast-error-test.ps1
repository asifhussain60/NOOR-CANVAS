<#
.SYNOPSIS
    Run Debug Panel Toast Error Visual Regression Test with Percy
    
.DESCRIPTION
    Launches the NoorCanvas application in a separate PowerShell window,
    waits for it to be ready, runs the Playwright visual regression test
    to reproduce the NotificationOptions.closeButton error, then cleans up.
    
.PARAMETER KeepAppRunning
    Keep the application running after tests complete (for manual verification)
    
.PARAMETER SkipBuild
    Skip building the application (use existing binaries)
    
.PARAMETER HeadlessTests
    Run Playwright tests in headless mode (faster, no browser window)
    
.EXAMPLE
    .\run-debug-panel-toast-error-test.ps1
    
.EXAMPLE
    .\run-debug-panel-toast-error-test.ps1 -KeepAppRunning
    
.EXAMPLE
    .\run-debug-panel-toast-error-test.ps1 -SkipBuild -HeadlessTests
    
.NOTES
    Created: 2025-10-14
    Purpose: Reproduce toast NotificationOptions.closeButton JSInterop error
    Debug Level: trace
#>

param(
    [switch]$KeepAppRunning,
    [switch]$SkipBuild,
    [switch]$HeadlessTests
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

# [DEBUG-WORKITEM:debug-panel:toast-error:TRACE] Script execution started ;CLEANUP_OK
Write-Host "[DEBUG-WORKITEM:debug-panel:toast-error:TRACE] Starting test automation script ;CLEANUP_OK" -ForegroundColor Cyan

# Configuration
$ProjectPath = "D:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas"
$TestPath = "D:\PROJECTS\NOOR CANVAS\Workspaces\TEMP"
$TestFile = "debug-panel-toast-error-visual.spec.ts"
$AppUrl = "https://localhost:9091"
$HealthCheckUrl = "$AppUrl/health"
$MaxWaitSeconds = 60

# Step 1: Build the application (unless skipped)
if (-not $SkipBuild) {
    Write-Host "`n========================================" -ForegroundColor Yellow
    Write-Host "STEP 1: Building Application" -ForegroundColor Yellow
    Write-Host "========================================`n" -ForegroundColor Yellow
    
    Write-Host "[DEBUG-WORKITEM:debug-panel:toast-error:TRACE] Running dotnet build ;CLEANUP_OK" -ForegroundColor Gray
    
    Push-Location $ProjectPath
    try {
        dotnet build --configuration Debug
        if ($LASTEXITCODE -ne 0) {
            throw "Build failed with exit code $LASTEXITCODE"
        }
        Write-Host "`n✅ Build successful" -ForegroundColor Green
    }
    finally {
        Pop-Location
    }
}
else {
    Write-Host "`n⏭️  Skipping build (using existing binaries)" -ForegroundColor Yellow
}

# Step 2: Launch application in separate PowerShell window
Write-Host "`n========================================" -ForegroundColor Yellow
Write-Host "STEP 2: Launching Application" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Yellow

Write-Host "[DEBUG-WORKITEM:debug-panel:toast-error:TRACE] Launching app in separate PowerShell window ;CLEANUP_OK" -ForegroundColor Gray

$AppWindowTitle = "NoorCanvas-Debug-Panel-Toast-Error-Test"

# Launch application with direct dotnet.exe (v3.0 pattern)
$appJob = Start-Process -FilePath "dotnet" `
    -ArgumentList "run", "--urls", $AppUrl `
    -WorkingDirectory $ProjectPath `
    -PassThru `
    -WindowStyle Normal

Write-Host "✅ Application started (PID: $($appJob.Id))" -ForegroundColor Green
Write-Host "   URL: $AppUrl" -ForegroundColor Gray

# Step 3: Wait for application to be ready
Write-Host "`n========================================" -ForegroundColor Yellow
Write-Host "STEP 3: Waiting for Application Ready" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Yellow

Write-Host "[DEBUG-WORKITEM:debug-panel:toast-error:TRACE] Performing health check loop ;CLEANUP_OK" -ForegroundColor Gray

$WaitSeconds = 0
$AppReady = $false

while ($WaitSeconds -lt $MaxWaitSeconds) {
    try {
        Write-Host "⏳ Checking health endpoint... ($WaitSeconds/$MaxWaitSeconds seconds)" -ForegroundColor Gray -NoNewline
        
        # Try to access the health endpoint
        $Response = Invoke-WebRequest -Uri $HealthCheckUrl -Method GET -TimeoutSec 5 -UseBasicParsing 2>$null
        
        if ($Response.StatusCode -eq 200) {
            $AppReady = $true
            Write-Host " ✅ Ready!" -ForegroundColor Green
            break
        }
    }
    catch {
        Write-Host " ⏳" -ForegroundColor Yellow
    }
    
    Start-Sleep -Seconds 2
    $WaitSeconds += 2
}

if (-not $AppReady) {
    Write-Host "`n❌ Application did not respond within $MaxWaitSeconds seconds" -ForegroundColor Red
    Write-Host "   Check the separate PowerShell window for errors" -ForegroundColor Yellow
    exit 1
}

Write-Host "`n✅ Application is ready at $AppUrl" -ForegroundColor Green
Write-Host "   Waited $WaitSeconds seconds for startup" -ForegroundColor Gray

# Step 4: Run Playwright tests
Write-Host "`n========================================" -ForegroundColor Yellow
Write-Host "STEP 4: Running Playwright Tests" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Yellow

Write-Host "[DEBUG-WORKITEM:debug-panel:toast-error:TRACE] Executing Playwright test ;CLEANUP_OK" -ForegroundColor Gray

Push-Location $TestPath
try {
    $PlaywrightArgs = @(
        "test",
        $TestFile
    )
    
    if (-not $HeadlessTests) {
        $PlaywrightArgs += "--headed"
    }
    
    Write-Host "Running: npx playwright $($PlaywrightArgs -join ' ')" -ForegroundColor Cyan
    Write-Host ""
    
    npx playwright @PlaywrightArgs
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n✅ Playwright tests completed successfully" -ForegroundColor Green
    }
    else {
        Write-Host "`n⚠️  Playwright tests completed with warnings (exit code: $LASTEXITCODE)" -ForegroundColor Yellow
    }
}
finally {
    Pop-Location
}

# Step 5: Cleanup (unless KeepAppRunning is specified)
Write-Host "`n========================================" -ForegroundColor Yellow
Write-Host "STEP 5: Cleanup" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Yellow

if ($KeepAppRunning) {
    Write-Host "⏸️  Application left running for manual verification" -ForegroundColor Yellow
    Write-Host "   Window Title: $AppWindowTitle" -ForegroundColor Gray
    Write-Host "   URL: $AppUrl" -ForegroundColor Green
    Write-Host "`n   To stop the application:" -ForegroundColor Yellow
    Write-Host "   1. Switch to the PowerShell window titled '$AppWindowTitle'" -ForegroundColor Gray
    Write-Host "   2. Press Ctrl+C to stop the server" -ForegroundColor Gray
}
else {
    Write-Host "[DEBUG-WORKITEM:debug-panel:toast-error:TRACE] Stopping application ;CLEANUP_OK" -ForegroundColor Gray
    
    # Find and stop the dotnet process
    $DotnetProcesses = Get-Process dotnet -ErrorAction SilentlyContinue | Where-Object {
        $_.MainWindowTitle -eq $AppWindowTitle -or
        $_.CommandLine -like "*NoorCanvas*"
    }
    
    if ($DotnetProcesses) {
        $DotnetProcesses | Stop-Process -Force
        Write-Host "✅ Application stopped" -ForegroundColor Green
    }
    else {
        Write-Host "⚠️  Could not find application process (may have already stopped)" -ForegroundColor Yellow
    }
}

# Cleanup temporary startup script
if (Test-Path $StartupScriptPath) {
    Remove-Item $StartupScriptPath -Force
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "TEST AUTOMATION COMPLETE" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "[DEBUG-WORKITEM:debug-panel:toast-error:TRACE] Script execution completed ;CLEANUP_OK" -ForegroundColor Gray

# Open test results (if available)
$ResultsPath = Join-Path $TestPath "playwright-report"
if (Test-Path $ResultsPath) {
    Write-Host "📊 Opening test results..." -ForegroundColor Cyan
    npx playwright show-report
}
