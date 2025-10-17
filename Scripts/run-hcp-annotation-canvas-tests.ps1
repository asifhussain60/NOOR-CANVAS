<#
.SYNOPSIS
    Run HCP Annotation Canvas Overlay E2E Tests
.DESCRIPTION
    Orchestrates end-to-end testing of the annotation canvas overlay system:
    1. Starts NoorCanvas application in background
    2. Waits for application readiness
    3. Executes Playwright tests
    4. Optionally keeps application running for manual verification
.PARAMETER KeepAppRunning
    If specified, keeps the application running after tests complete
.EXAMPLE
    .\run-hcp-annotation-canvas-tests.ps1
.EXAMPLE
    .\run-hcp-annotation-canvas-tests.ps1 -KeepAppRunning
#>

param(
    [switch]$KeepAppRunning
)

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path $PSScriptRoot -Parent
$appPath = Join-Path $projectRoot "SPA\NoorCanvas"
$testsPath = Join-Path $projectRoot "Tests\UI"
$appUrl = "http://localhost:5000"

Write-Host "[run-hcp-annotation-canvas-tests] Starting annotation canvas overlay tests..." -ForegroundColor Cyan

# Step 1: Start NoorCanvas application
Write-Host "[run-hcp-annotation-canvas-tests] Starting NoorCanvas application..." -ForegroundColor Yellow
Push-Location $appPath

$appJob = Start-Job -ScriptBlock {
    param($appPath)
    Set-Location $appPath
    dotnet run
} -ArgumentList $appPath

Pop-Location

# Step 2: Wait for application to be ready
Write-Host "[run-hcp-annotation-canvas-tests] Waiting for application to be ready..." -ForegroundColor Yellow
$maxWaitSeconds = 60
$waited = 0
$isReady = $false

while ($waited -lt $maxWaitSeconds) {
    try {
        $response = Invoke-WebRequest -Uri $appUrl -Method Head -TimeoutSec 2 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            $isReady = $true
            break
        }
    }
    catch {
        # Application not ready yet
    }
    Start-Sleep -Seconds 2
    $waited += 2
    Write-Host "." -NoNewline
}

Write-Host ""

if (-not $isReady) {
    Write-Host "[run-hcp-annotation-canvas-tests] ERROR: Application did not become ready within ${maxWaitSeconds}s" -ForegroundColor Red
    Stop-Job -Job $appJob -ErrorAction SilentlyContinue
    Remove-Job -Job $appJob -ErrorAction SilentlyContinue
    exit 1
}

Write-Host "[run-hcp-annotation-canvas-tests] Application ready at $appUrl" -ForegroundColor Green

# Step 3: Run Playwright tests
Write-Host "[run-hcp-annotation-canvas-tests] Running Playwright tests..." -ForegroundColor Yellow
Push-Location $testsPath

try {
    npx playwright test hcp-annotation-canvas-overlay-e2e.spec.ts --headed
    $testExitCode = $LASTEXITCODE
}
catch {
    Write-Host "[run-hcp-annotation-canvas-tests] ERROR: Test execution failed: $_" -ForegroundColor Red
    $testExitCode = 1
}

Pop-Location

# Step 4: Cleanup or keep running
if ($KeepAppRunning) {
    Write-Host "[run-hcp-annotation-canvas-tests] Application kept running for manual verification" -ForegroundColor Cyan
    Write-Host "[run-hcp-annotation-canvas-tests] Access at: $appUrl" -ForegroundColor Cyan
    Write-Host "[run-hcp-annotation-canvas-tests] Press Ctrl+C to stop the application" -ForegroundColor Cyan
    
    # Keep script running so job stays alive
    try {
        while ($true) {
            Start-Sleep -Seconds 1
        }
    }
    finally {
        Stop-Job -Job $appJob -ErrorAction SilentlyContinue
        Remove-Job -Job $appJob -ErrorAction SilentlyContinue
    }
}
else {
    Write-Host "[run-hcp-annotation-canvas-tests] Stopping application..." -ForegroundColor Yellow
    Stop-Job -Job $appJob -ErrorAction SilentlyContinue
    Remove-Job -Job $appJob -ErrorAction SilentlyContinue
    Write-Host "[run-hcp-annotation-canvas-tests] Application stopped" -ForegroundColor Green
}

if ($testExitCode -eq 0) {
    Write-Host "[run-hcp-annotation-canvas-tests] ✅ All tests passed!" -ForegroundColor Green
}
else {
    Write-Host "[run-hcp-annotation-canvas-tests] ❌ Tests failed with exit code: $testExitCode" -ForegroundColor Red
}

exit $testExitCode
