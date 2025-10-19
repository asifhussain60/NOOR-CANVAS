<#
.SYNOPSIS
    Orchestration script for transcript section share sanitization test

.DESCRIPTION
    Launches the Noor Canvas app, waits for it to be ready, runs the Playwright test
    with Percy visual regression, and optionally keeps the app running for debugging.

.PARAMETER KeepAppRunning
    If specified, the app will continue running after tests complete (useful for manual verification)

.PARAMETER Headed
    If specified, runs Playwright tests in headed mode (visible browser windows)

.EXAMPLE
    .\run-transcript-share-sanitization-test.ps1
    Runs the test in headless mode and stops the app when done

.EXAMPLE
    .\run-transcript-share-sanitization-test.ps1 -KeepAppRunning -Headed
    Runs the test in headed mode and keeps the app running for debugging
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory=$false)]
    [switch]$KeepAppRunning,

    [Parameter(Mandatory=$false)]
    [switch]$Headed
)

$ErrorActionPreference = "Stop"
$workspaceRoot = "D:\PROJECTS\NOOR CANVAS"
$appPath = Join-Path $workspaceRoot "SPA\NoorCanvas"
$testPath = Join-Path $workspaceRoot ".github\prompts.keys\hcp-canvas\tests\transcript-section-share-sanitization.spec.ts"

Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Transcript Section Share Sanitization Test" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Step 1: Start the app in a background job
Write-Host "🚀 Step 1: Starting Noor Canvas application..." -ForegroundColor Yellow
Push-Location $appPath

try {
    $appJob = Start-Job -ScriptBlock {
        param($appPath)
        Set-Location $appPath
        dotnet run
    } -ArgumentList $appPath

    Write-Host "   App started in background job (ID: $($appJob.Id))" -ForegroundColor Green

    # Step 2: Wait for app to be ready
    Write-Host ""
    Write-Host "⏳ Step 2: Waiting for application to be ready..." -ForegroundColor Yellow
    $maxWaitSeconds = 30
    $waitedSeconds = 0
    $appReady = $false

    while ($waitedSeconds -lt $maxWaitSeconds) {
        Start-Sleep -Seconds 2
        $waitedSeconds += 2

        try {
            $response = Invoke-WebRequest -Uri "https://localhost:9091" -UseBasicParsing -SkipCertificateCheck -TimeoutSec 2 -ErrorAction SilentlyContinue
            if ($response.StatusCode -eq 200) {
                $appReady = $true
                Write-Host "   ✅ Application ready at https://localhost:9091" -ForegroundColor Green
                break
            }
        } catch {
            Write-Host "   ⏳ Still waiting... ($waitedSeconds/$maxWaitSeconds seconds)" -ForegroundColor Gray
        }
    }

    if (-not $appReady) {
        Write-Host "   ❌ Application failed to start within $maxWaitSeconds seconds" -ForegroundColor Red
        throw "Application startup timeout"
    }

    # Step 3: Run Playwright test with Percy
    Write-Host ""
    Write-Host "🧪 Step 3: Running Playwright test with Percy visual regression..." -ForegroundColor Yellow
    Pop-Location
    Push-Location $workspaceRoot

    $playwrightArgs = @("test", $testPath, "--project=chromium")
    if ($Headed) {
        $playwrightArgs += "--headed"
        Write-Host "   Running in headed mode (browser visible)" -ForegroundColor Cyan
    } else {
        Write-Host "   Running in headless mode" -ForegroundColor Cyan
    }

    Write-Host ""
    Write-Host "   Executing: npx playwright $($playwrightArgs -join ' ')" -ForegroundColor Gray
    Write-Host ""

    & npx playwright $playwrightArgs

    $testExitCode = $LASTEXITCODE

    if ($testExitCode -eq 0) {
        Write-Host ""
        Write-Host "✅ Test completed successfully!" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "❌ Test failed with exit code: $testExitCode" -ForegroundColor Red
    }

    # Step 4: Handle app cleanup
    Write-Host ""
    if ($KeepAppRunning) {
        Write-Host "🔄 Step 4: App is still running (as requested)" -ForegroundColor Yellow
        Write-Host "   Job ID: $($appJob.Id)" -ForegroundColor Cyan
        Write-Host "   To stop: Stop-Job -Id $($appJob.Id); Remove-Job -Id $($appJob.Id)" -ForegroundColor Cyan
        Write-Host "   URL: https://localhost:9091" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Press Enter to stop the app and exit..." -ForegroundColor Yellow
        Read-Host
    }

    Write-Host "🛑 Step 4: Stopping application..." -ForegroundColor Yellow
    Stop-Job -Id $appJob.Id -ErrorAction SilentlyContinue
    Remove-Job -Id $appJob.Id -ErrorAction SilentlyContinue
    Write-Host "   ✅ Application stopped" -ForegroundColor Green

    Write-Host ""
    Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "  Test execution complete" -ForegroundColor Cyan
    Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Cyan

    exit $testExitCode

} catch {
    Write-Host ""
    Write-Host "❌ Error occurred: $_" -ForegroundColor Red
    
    # Cleanup on error
    if ($appJob) {
        Write-Host "🛑 Stopping application job..." -ForegroundColor Yellow
        Stop-Job -Id $appJob.Id -ErrorAction SilentlyContinue
        Remove-Job -Id $appJob.Id -ErrorAction SilentlyContinue
    }

    Pop-Location
    exit 1
} finally {
    Pop-Location
}
