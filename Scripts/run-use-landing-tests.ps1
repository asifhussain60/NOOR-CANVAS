#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Run UserLanding textbox JavaScript error tests with app orchestration
.DESCRIPTION
    Starts the NoorCanvas app, runs Playwright tests for UserLanding textbox JavaScript errors,
    captures Percy snapshots, monitors browser console logs, then stops the app
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
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "  UserLanding Textbox JS Error Tests (use-landing)" -ForegroundColor Cyan
Write-Host "  $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
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
        Write-Host "App is accessible at https://localhost:9091" -ForegroundColor Green
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
    Write-Host "Step 3: Running Playwright UserLanding textbox tests..." -ForegroundColor Yellow
    
    $testArgs = @(
        "test",
        "Tests/UI/issue-use-landing-textbox-js-errors.spec.ts"
    )
    
    if ($HeadedMode) {
        $testArgs += "--headed"
    }
    
    Write-Host "Command: npx playwright $($testArgs -join ' ')" -ForegroundColor Gray
    Write-Host "Test file: Tests/UI/issue-use-landing-textbox-js-errors.spec.ts" -ForegroundColor Gray
    Write-Host ""
    
    Set-Location $WorkspaceRoot
    $testExitCode = 0
    
    try {
        npx playwright @testArgs
        if ($LASTEXITCODE -ne 0) {
            $testExitCode = $LASTEXITCODE
            Write-Host ""
            Write-Host "⚠️  Some tests failed (exit code: $testExitCode)" -ForegroundColor Yellow
        }
        else {
            Write-Host ""
            Write-Host "✅ All tests passed - No JavaScript errors detected" -ForegroundColor Green
        }
    }
    catch {
        Write-Host "Test execution error: $($_.Exception.Message)" -ForegroundColor Red
        $testExitCode = 1
    }

    # Step 4: Test results summary
    Write-Host ""
    Write-Host "Step 4: Test Results Summary" -ForegroundColor Yellow
    Write-Host "----------------------------" -ForegroundColor Gray
    
    if ($testExitCode -eq 0) {
        Write-Host "Status: PASSED ✅" -ForegroundColor Green
        Write-Host "All textbox inputs work without JavaScript errors" -ForegroundColor Green
        Write-Host "Browser console logs clean during typing" -ForegroundColor Green
    }
    else {
        Write-Host "Status: FAILED ❌" -ForegroundColor Red
        Write-Host "Review test output above for JavaScript error details" -ForegroundColor Yellow
    }

    Write-Host ""
    Write-Host "Test Coverage:" -ForegroundColor Cyan
    Write-Host "  - Token input typing (character-by-character)" -ForegroundColor Gray
    Write-Host "  - Registration form inputs (name, email)" -ForegroundColor Gray
    Write-Host "  - Error state rendering" -ForegroundColor Gray
    Write-Host "  - Clear error on focus" -ForegroundColor Gray
    Write-Host "  - Rapid typing stress test" -ForegroundColor Gray
    Write-Host "  - Percy visual regression snapshots" -ForegroundColor Gray
    Write-Host "  - Browser console error monitoring" -ForegroundColor Gray
}
finally {
    # Step 5: Cleanup
    Write-Host ""
    Write-Host "Step 5: Cleanup" -ForegroundColor Yellow
    
    if ($KeepAppRunning) {
        Write-Host "App is still running (PID: $($AppProcess.Id))" -ForegroundColor Cyan
        Write-Host "Navigate to: https://localhost:9091/user/landing" -ForegroundColor Cyan
        Write-Host "Press Ctrl+C in the app window to stop it" -ForegroundColor Cyan
    }
    else {
        Write-Host "Stopping application (PID: $($AppProcess.Id))..." -ForegroundColor Gray
        try {
            Stop-Process -Id $AppProcess.Id -Force -ErrorAction SilentlyContinue
            
            # Also kill any child dotnet processes
            Get-Process -Name "dotnet" -ErrorAction SilentlyContinue | Where-Object {
                $_.StartTime -and $_.StartTime -gt $AppProcess.StartTime.AddSeconds(-5)
            } | Stop-Process -Force -ErrorAction SilentlyContinue
            
            Write-Host "App stopped successfully" -ForegroundColor Green
        }
        catch {
            Write-Host "Warning: Could not stop app process: $($_.Exception.Message)" -ForegroundColor Yellow
        }
    }
}

Write-Host ""
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "  Test execution complete" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

# Exit with test exit code
exit $testExitCode
