##
## Visual Regression Test Runner for Toast & Canvas Height Issues
## Created: 2025-10-14
## Purpose: Automated test execution with proper app startup in isolated PowerShell window
##

[CmdletBinding()]
param(
    [switch]$SkipAppStart,
    [switch]$HeadedMode,
    [switch]$PercyEnabled
)

$ErrorActionPreference = "Stop"
$workspaceRoot = "D:\PROJECTS\NOOR CANVAS"
$appPath = "$workspaceRoot\SPA\NoorCanvas"
$testFile = "$workspaceRoot\Workspaces\TEMP\toast-canvas-height-visual.spec.ts"

Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Visual Regression Test Runner - Toast & Canvas Height Issues" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

## Step 1: Verify test file exists
if (-not (Test-Path $testFile)) {
    Write-Error "Test file not found: $testFile"
    exit 1
}
Write-Host "✅ Test file verified: toast-canvas-height-visual.spec.ts" -ForegroundColor Green

## Step 2: Start application in separate elevated PowerShell window (if not skipped)
$appProcess = $null
if (-not $SkipAppStart) {
    Write-Host ""
    Write-Host "🚀 Starting NoorCanvas application in separate PowerShell window..." -ForegroundColor Yellow
    Write-Host "   Path: $appPath" -ForegroundColor Gray
    Write-Host "   URL: https://localhost:9091" -ForegroundColor Gray
    Write-Host ""
    
    # Start app in new elevated PowerShell window
    $startInfo = New-Object System.Diagnostics.ProcessStartInfo
    $startInfo.FileName = "powershell.exe"
    $startInfo.Arguments = "-NoProfile -ExecutionPolicy Bypass -Command `"cd '$appPath'; dotnet run`""
    $startInfo.Verb = "RunAs"  # Request elevation
    $startInfo.WindowStyle = "Normal"  # Keep window visible
    
    try {
        $appProcess = [System.Diagnostics.Process]::Start($startInfo)
        Write-Host "✅ Application started in separate PowerShell window (PID: $($appProcess.Id))" -ForegroundColor Green
        Write-Host "   Waiting 20 seconds for application startup..." -ForegroundColor Gray
        Start-Sleep -Seconds 20
        
        # Verify app is responding
        try {
            $response = Invoke-WebRequest -Uri "https://localhost:9091" -SkipCertificateCheck -UseBasicParsing -TimeoutSec 10
            Write-Host "✅ Application is responding (Status: $($response.StatusCode))" -ForegroundColor Green
        } catch {
            Write-Warning "Application may not be fully ready yet. Waiting additional 10 seconds..."
            Start-Sleep -Seconds 10
        }
    } catch {
        Write-Error "Failed to start application: $_"
        exit 1
    }
} else {
    Write-Host "⏭️  Skipping application startup (--SkipAppStart flag set)" -ForegroundColor Yellow
    Write-Host "   Assuming application is already running at https://localhost:9091" -ForegroundColor Gray
}

## Step 3: Run Playwright visual regression tests
Write-Host ""
Write-Host "🧪 Running Playwright visual regression tests..." -ForegroundColor Yellow
Write-Host ""

$playwrightArgs = @("test", $testFile)

if ($HeadedMode) {
    $playwrightArgs += "--headed"
    Write-Host "   Mode: HEADED (browser visible)" -ForegroundColor Cyan
} else {
    Write-Host "   Mode: HEADLESS (browser hidden)" -ForegroundColor Cyan
}

if ($PercyEnabled) {
    Write-Host "   Percy: ENABLED (visual snapshots captured)" -ForegroundColor Cyan
    $env:PERCY_TOKEN = $env:PERCY_TOKEN  # Use existing token
    $playwrightCommand = "npx percy exec -- npx playwright"
} else {
    Write-Host "   Percy: DISABLED (functional tests only)" -ForegroundColor Cyan
    $playwrightCommand = "npx playwright"
}

Write-Host ""
Write-Host "Executing: $playwrightCommand $($playwrightArgs -join ' ')" -ForegroundColor Gray
Write-Host ""

Push-Location $workspaceRoot
try {
    if ($PercyEnabled) {
        $fullCommand = "npx percy exec -- npx playwright $($playwrightArgs -join ' ')"
    } else {
        $fullCommand = "npx playwright $($playwrightArgs -join ' ')"
    }
    
    # Execute using Invoke-Expression for proper command parsing
    $testOutput = Invoke-Expression $fullCommand 2>&1
    $testExitCode = $LASTEXITCODE
    
    Write-Host $testOutput
    Write-Host ""
    
    if ($testExitCode -eq 0) {
        Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Green
        Write-Host "  ✅ ALL TESTS PASSED" -ForegroundColor Green
        Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Green
    } else {
        Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Red
        Write-Host "  ❌ TESTS FAILED (Exit Code: $testExitCode)" -ForegroundColor Red
        Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Red
        Write-Host ""
        Write-Host "This is EXPECTED on first run as tests document existing issues." -ForegroundColor Yellow
        Write-Host "After fixes are applied, re-run tests to verify resolution." -ForegroundColor Yellow
    }
} finally {
    Pop-Location
}

## Step 4: Cleanup - Stop application if we started it
if ($appProcess -and -not $appProcess.HasExited) {
    Write-Host ""
    Write-Host "🛑 Stopping application..." -ForegroundColor Yellow
    try {
        # Find and kill dotnet process running on port 9091
        $dotnetProcesses = Get-NetTCPConnection -LocalPort 9091 -ErrorAction SilentlyContinue | 
                          Select-Object -ExpandProperty OwningProcess | 
                          Get-Process -ErrorAction SilentlyContinue
        
        if ($dotnetProcesses) {
            $dotnetProcesses | Stop-Process -Force
            Write-Host "✅ Application stopped" -ForegroundColor Green
        }
    } catch {
        Write-Warning "Could not cleanly stop application: $_"
        Write-Host "   You may need to manually close the PowerShell window running the app" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Test Execution Complete" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "Summary:" -ForegroundColor White
Write-Host "  Test File: $testFile" -ForegroundColor Gray
Write-Host "  Exit Code: $testExitCode" -ForegroundColor Gray
Write-Host ""

exit $testExitCode
