<#
.SYNOPSIS
    Orchestrated test runner for HCP FAB Button verification
    
.DESCRIPTION
    Launches NoorCanvas app, waits for health check, runs Playwright tests,
    and performs cleanup. Follows test orchestration protocol.
    
.PARAMETER KeepAppRunning
    If specified, keeps the app running after tests complete (for manual verification)
    
.PARAMETER TestPattern
    Test pattern to run (default: hcp-fab-button-verification.spec.ts)
    
.PARAMETER Headed
    Run tests in headed mode (visible browser)
    
.EXAMPLE
    .\run-hcp-fab-button-tests.ps1
    Run tests with app auto-launch and cleanup
    
.EXAMPLE
    .\run-hcp-fab-button-tests.ps1 -Headed -KeepAppRunning
    Run tests in visible browser and keep app running for manual verification
    
Key: hcp-fab-button
Related: Tests/UI/hcp-fab-button-verification.spec.ts
#>

param(
    [switch]$KeepAppRunning,
    [string]$TestPattern = "hcp-fab-button-verification.spec.ts",
    [switch]$Headed
)

$ErrorActionPreference = "Stop"
$appProcess = $null
$appUrl = "https://localhost:9091"
$testPath = "Tests/UI/$TestPattern"

Write-Host "🚀 HCP FAB Button Test Orchestrator" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Gray
Write-Host "Test Pattern: $TestPattern" -ForegroundColor Yellow
Write-Host "App URL: $appUrl" -ForegroundColor Yellow
Write-Host "Keep App Running: $KeepAppRunning" -ForegroundColor Yellow
Write-Host "Headed Mode: $Headed" -ForegroundColor Yellow
Write-Host "=" * 60 -ForegroundColor Gray

try {
    # Step 1: Kill existing app processes
    Write-Host "`n📍 Step 1: Cleaning up existing processes..." -ForegroundColor Cyan
    $existingProcesses = Get-Process -Name "NoorCanvas" -ErrorAction SilentlyContinue
    if ($existingProcesses) {
        Write-Host "   Found $($existingProcesses.Count) existing NoorCanvas process(es)" -ForegroundColor Yellow
        $existingProcesses | Stop-Process -Force
        Start-Sleep -Seconds 2
        Write-Host "   ✅ Existing processes terminated" -ForegroundColor Green
    } else {
        Write-Host "   ✅ No existing processes found" -ForegroundColor Green
    }

    # Step 2: Launch app in new window
    Write-Host "`n📍 Step 2: Launching NoorCanvas app..." -ForegroundColor Cyan
    $appPath = "SPA\NoorCanvas"
    
    Write-Host "   Starting app in new window..." -ForegroundColor Yellow
    $appProcess = Start-Process -FilePath "dotnet" `
                                -ArgumentList "run" `
                                -WorkingDirectory $appPath `
                                -WindowStyle Normal `
                                -PassThru

    if ($appProcess) {
        Write-Host "   ✅ App launched (PID: $($appProcess.Id))" -ForegroundColor Green
    } else {
        throw "Failed to launch app"
    }

    # Step 3: Health check - wait for app to respond
    Write-Host "`n📍 Step 3: Waiting for app to be ready..." -ForegroundColor Cyan
    $maxAttempts = 30
    $attempt = 0
    $appReady = $false

    # Skip SSL certificate validation for localhost health check
    if (-not ([System.Management.Automation.PSTypeName]'ServerCertificateValidationCallback').Type) {
        $certCallback = @"
            using System;
            using System.Net;
            using System.Net.Security;
            using System.Security.Cryptography.X509Certificates;
            public class ServerCertificateValidationCallback {
                public static void Ignore() {
                    ServicePointManager.ServerCertificateValidationCallback = 
                        delegate (
                            Object obj, 
                            X509Certificate certificate, 
                            X509Chain chain, 
                            SslPolicyErrors errors
                        ) {
                            return true;
                        };
                }
            }
"@
        Add-Type $certCallback
    }
    [ServerCertificateValidationCallback]::Ignore()

    while (-not $appReady -and $attempt -lt $maxAttempts) {
        $attempt++
        Write-Host "   Attempt $attempt/$maxAttempts..." -ForegroundColor Gray
        
        try {
            $response = Invoke-WebRequest -Uri $appUrl -Method GET -TimeoutSec 2 -UseBasicParsing -ErrorAction SilentlyContinue
            if ($response.StatusCode -eq 200) {
                $appReady = $true
                Write-Host "   ✅ App is ready! (HTTP 200)" -ForegroundColor Green
            }
        } catch {
            Start-Sleep -Seconds 2
        }
    }

    if (-not $appReady) {
        throw "App failed to start after $maxAttempts attempts"
    }

    # Additional wait for full initialization
    Write-Host "   Waiting additional 5 seconds for full initialization..." -ForegroundColor Gray
    Start-Sleep -Seconds 5

    # Step 4: Run Playwright tests
    Write-Host "`n📍 Step 4: Running Playwright tests..." -ForegroundColor Cyan
    Write-Host "   Test: $testPath" -ForegroundColor Yellow
    
    $testArgs = @("playwright", "test", $testPath, "--reporter=list")
    if ($Headed) {
        $testArgs += "--headed"
    }

    Write-Host "   Command: npx $($testArgs -join ' ')" -ForegroundColor Gray
    
    $testResult = & npx @testArgs
    $testExitCode = $LASTEXITCODE

    Write-Host ""
    if ($testExitCode -eq 0) {
        Write-Host "   ✅ Tests passed!" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Tests failed (exit code: $testExitCode)" -ForegroundColor Red
    }

    # Step 5: Cleanup or keep running
    if ($KeepAppRunning) {
        Write-Host "`n📍 Step 5: Keeping app running for manual verification..." -ForegroundColor Cyan
        Write-Host "   App URL: $appUrl" -ForegroundColor Yellow
        Write-Host "   PID: $($appProcess.Id)" -ForegroundColor Yellow
        Write-Host "   Press Ctrl+C to stop the app when done" -ForegroundColor Yellow
        
        # Wait indefinitely
        Wait-Process -Id $appProcess.Id
    } else {
        Write-Host "`n📍 Step 5: Cleaning up..." -ForegroundColor Cyan
        if ($appProcess -and -not $appProcess.HasExited) {
            Write-Host "   Stopping app (PID: $($appProcess.Id))..." -ForegroundColor Yellow
            $appProcess | Stop-Process -Force
            Start-Sleep -Seconds 2
            Write-Host "   ✅ App stopped" -ForegroundColor Green
        }
    }

    # Final summary
    Write-Host "`n" + ("=" * 60) -ForegroundColor Gray
    Write-Host "🎉 Test Orchestration Complete" -ForegroundColor Cyan
    Write-Host "=" * 60 -ForegroundColor Gray
    Write-Host "Test Result: $(if ($testExitCode -eq 0) { '✅ PASSED' } else { '❌ FAILED' })" -ForegroundColor $(if ($testExitCode -eq 0) { 'Green' } else { 'Red' })
    Write-Host "App Status: $(if ($KeepAppRunning) { '🟢 Running' } else { '⚫ Stopped' })" -ForegroundColor Yellow
    
    exit $testExitCode

} catch {
    Write-Host "`n❌ ERROR: $_" -ForegroundColor Red
    Write-Host $_.ScriptStackTrace -ForegroundColor Gray
    
    # Emergency cleanup
    if ($appProcess -and -not $appProcess.HasExited) {
        Write-Host "`nEmergency cleanup: Stopping app..." -ForegroundColor Yellow
        $appProcess | Stop-Process -Force
    }
    
    exit 1
}
