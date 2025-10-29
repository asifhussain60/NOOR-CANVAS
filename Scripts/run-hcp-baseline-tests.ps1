#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Run HostControlPanel baseline refactoring tests with application management
.DESCRIPTION
    [WORKITEM:hcp-cleanup] Phase 1 baseline test runner
    - Starts NoorCanvas application in background
    - Waits for app to be ready
    - Runs Playwright baseline tests
    - Cleans up application process
.PARAMETER KeepAppRunning
    If specified, doesn't stop the app after tests complete
#>

param(
    [switch]$KeepAppRunning
)

$ErrorActionPreference = "Stop"

Write-Host "🧪 [hcp-cleanup] Phase 1: Running HostControlPanel Baseline Tests" -ForegroundColor Cyan
Write-Host ""

# Configuration
$appPath = "D:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas"
$testPath = "Tests/UI/hcp-refactor-baseline.spec.ts"
$appUrl = "https://localhost:9091"
$appJob = $null

try {
    # Step 1: Start the application in background
    Write-Host "📦 Starting NoorCanvas application..." -ForegroundColor Yellow
    $appJob = Start-Job -ScriptBlock {
        param($path)
        Set-Location $path
        dotnet run
    } -ArgumentList $appPath

    # Step 2: Wait for application to be ready
    Write-Host "⏳ Waiting for application to start (checking $appUrl)..." -ForegroundColor Yellow
    $maxAttempts = 30
    $attempt = 0
    $ready = $false

    while ($attempt -lt $maxAttempts -and -not $ready) {
        $attempt++
        Start-Sleep -Seconds 2
        
        try {
            # Suppress error output for connection attempts
            $response = Invoke-WebRequest -Uri $appUrl -Method Head -SkipCertificateCheck -TimeoutSec 2 -ErrorAction SilentlyContinue
            if ($response.StatusCode -eq 200) {
                $ready = $true
                Write-Host "✅ Application is ready!" -ForegroundColor Green
            }
        } catch {
            Write-Host "." -NoNewline -ForegroundColor Gray
        }
    }

    if (-not $ready) {
        Write-Host ""
        Write-Host "❌ Application failed to start within timeout period" -ForegroundColor Red
        
        # Show job output for debugging
        Write-Host ""
        Write-Host "📋 Application Job Output:" -ForegroundColor Yellow
        Receive-Job -Job $appJob
        
        throw "Application startup timeout"
    }

    Write-Host ""
    Write-Host "🧪 Running Playwright baseline tests..." -ForegroundColor Cyan
    Write-Host ""

    # Step 3: Run Playwright tests
    npm test $testPath

    $testExitCode = $LASTEXITCODE

    Write-Host ""
    if ($testExitCode -eq 0) {
        Write-Host "✅ All baseline tests PASSED!" -ForegroundColor Green
        Write-Host "🎉 Ready to proceed with refactoring Phase 2" -ForegroundColor Cyan
    } else {
        Write-Host "❌ Some baseline tests FAILED (exit code: $testExitCode)" -ForegroundColor Red
        Write-Host "⚠️  Review test output above before proceeding with refactoring" -ForegroundColor Yellow
    }

} catch {
    Write-Host ""
    Write-Host "❌ Error: $_" -ForegroundColor Red
    exit 1
} finally {
    # Step 4: Cleanup
    if ($appJob -and -not $KeepAppRunning) {
        Write-Host ""
        Write-Host "🧹 Stopping application..." -ForegroundColor Yellow
        Stop-Job -Job $appJob -ErrorAction SilentlyContinue
        Remove-Job -Job $appJob -ErrorAction SilentlyContinue
        Write-Host "✅ Application stopped" -ForegroundColor Green
    } elseif ($appJob -and $KeepAppRunning) {
        Write-Host ""
        Write-Host "⏸️  Application is still running (Job ID: $($appJob.Id))" -ForegroundColor Yellow
        Write-Host "   Stop manually with: Stop-Job -Id $($appJob.Id); Remove-Job -Id $($appJob.Id)" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "📊 Test run complete" -ForegroundColor Cyan
