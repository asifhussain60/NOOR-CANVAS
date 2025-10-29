#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Run portrait orientation blocking tests with app orchestration
.DESCRIPTION
    Starts the NoorCanvas app, runs Playwright tests for portrait orientation blocking,
    captures Percy snapshots, checks browser console logs, then stops the app
.PARAMETER KeepAppRunning
    If specified, keeps the app running after tests complete for manual verification
.PARAMETER HeadedMode
    If specified, runs tests in headed mode (visible browser)
#>

param(
    [switch]$KeepAppRunning,
    [switch]$HeadedMode
)

$ErrorActionPreference = "Stop"
$WorkspaceRoot = "D:\PROJECTS\NOOR CANVAS"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Portrait Orientation Blocking Tests" -ForegroundColor Cyan
Write-Host "  $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Start the NoorCanvas app with direct dotnet.exe (v3.0 pattern)
Write-Host "Step 1: Starting NoorCanvas application..." -ForegroundColor Yellow
$AppProcess = Start-Process -FilePath "dotnet" `
    -ArgumentList "run", "--urls", "https://localhost:9091" `
    -WorkingDirectory "D:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas" `
    -PassThru `
    -WindowStyle Normal
Write-Host "App started (PID: $($AppProcess.Id))" -ForegroundColor Green
Write-Host "Waiting 15 seconds for app to initialize..." -ForegroundColor Gray
Start-Sleep -Seconds 15

try {
    # Step 2: Verify app is running
    Write-Host ""
    Write-Host "Step 2: Verifying app is accessible..." -ForegroundColor Yellow
    try {
        # Use .NET WebClient for compatibility with older PowerShell
        [System.Net.ServicePointManager]::ServerCertificateValidationCallback = {$true}
        $webClient = New-Object System.Net.WebClient
        $null = $webClient.DownloadString("https://localhost:9091")
        Write-Host "App is accessible" -ForegroundColor Green
    }
    catch {
        Write-Host "App verification failed: $($_.Exception.Message)" -ForegroundColor Red
        throw "App is not accessible. Tests cannot proceed."
    }
    finally {
        [System.Net.ServicePointManager]::ServerCertificateValidationCallback = $null
    }

    # Step 3: Run Playwright tests
    Write-Host ""
    Write-Host "Step 3: Running Playwright portrait orientation tests..." -ForegroundColor Yellow
    
    $testArgs = @(
        "test",
        "Tests/UI/canvas-portrait-orientation-blocking.spec.ts"
    )
    
    if ($HeadedMode) {
        $testArgs += "--headed"
    }
    
    Write-Host "Command: npx playwright $($testArgs -join ' ')" -ForegroundColor Gray
    
    Set-Location $WorkspaceRoot
    $testExitCode = 0
    
    try {
        npx playwright @testArgs
        if ($LASTEXITCODE -ne 0) {
            $testExitCode = $LASTEXITCODE
            Write-Host "Some tests failed (exit code: $testExitCode)" -ForegroundColor Yellow
        }
        else {
            Write-Host "All tests passed" -ForegroundColor Green
        }
    }
    catch {
        Write-Host "Test execution error: $($_.Exception.Message)" -ForegroundColor Red
        $testExitCode = 1
    }

    # Step 4: Results summary
    Write-Host ""
    Write-Host "Test Results Summary" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Cyan
    
    if ($testExitCode -eq 0) {
        Write-Host "ALL TESTS PASSED" -ForegroundColor Green
    }
    else {
        Write-Host "SOME TESTS FAILED (Exit Code: $testExitCode)" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "Test Artifacts:" -ForegroundColor Cyan
    Write-Host "  - Playwright Report: Run 'npx playwright show-report' to view" -ForegroundColor Gray
    Write-Host "  - Test Results: test-results/ directory" -ForegroundColor Gray
    Write-Host "  - Screenshots: test-results/**/screenshots/" -ForegroundColor Gray
    Write-Host ""
    
    # Step 5: Cleanup
    if ($KeepAppRunning) {
        Write-Host ""
        Write-Host "App will remain running for manual verification" -ForegroundColor Cyan
        Write-Host "  URL: https://localhost:9091" -ForegroundColor Gray
        Write-Host "  App PID: $($AppProcess.Id)" -ForegroundColor Gray
        Write-Host "  To stop: Stop-Process -Id $($AppProcess.Id)" -ForegroundColor Gray
        Write-Host ""
    }
    else {
        Write-Host ""
        Write-Host "Stopping NoorCanvas app..." -ForegroundColor Yellow
        Stop-Process -Id $AppProcess.Id -Force -ErrorAction SilentlyContinue
        Write-Host "App stopped" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  Test Run Complete" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    
    exit $testExitCode
}
catch {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "  ERROR: Test execution failed" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    
    # Cleanup on error
    Write-Host "Stopping app..." -ForegroundColor Yellow
    Stop-Process -Id $AppProcess.Id -Force -ErrorAction SilentlyContinue
    Write-Host "App stopped" -ForegroundColor Green
    
    exit 1
}
