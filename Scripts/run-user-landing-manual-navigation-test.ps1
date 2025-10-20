<#
.SYNOPSIS
    Orchestration script for User Landing Manual Navigation test with Percy visual regression

.DESCRIPTION
    Launches NoorCanvas app, runs Playwright test with Percy, stops app
    
    Test Coverage:
    - Registration completion shows success panel
    - No automatic navigation after registration
    - Manual join button displayed
    - Console log monitoring for JavaScript errors
    - Percy visual regression of registration complete panel

.PARAMETER Headed
    Run test in headed mode (show browser)

.PARAMETER KeepAppRunning
    Keep app running after test for manual inspection

.EXAMPLE
    .\run-user-landing-manual-navigation-test.ps1 -Headed
#>

param(
    [switch]$Headed,
    [switch]$KeepAppRunning
)

$ErrorActionPreference = "Stop"

# Paths
$projectRoot = "D:\PROJECTS\NOOR CANVAS"
$appPath = "$projectRoot\SPA\NoorCanvas"
$testFile = "$projectRoot\Tests\UI\user-landing-manual-navigation.spec.ts"

Write-Host "[ORCHESTRATOR] User Landing Manual Navigation Test" -ForegroundColor Cyan
Write-Host "[ORCHESTRATOR] ============================================" -ForegroundColor Cyan

# Step 1: Verify test file exists
if (-not (Test-Path $testFile)) {
    Write-Error "[ORCHESTRATOR] Test file not found: $testFile"
    exit 1
}
Write-Host "[ORCHESTRATOR] Test file found: $testFile" -ForegroundColor Green

# Step 2: Start NoorCanvas app
Write-Host "[ORCHESTRATOR] Starting NoorCanvas app..." -ForegroundColor Yellow
Push-Location $appPath

$appJob = Start-Job -ScriptBlock {
    param($path)
    Set-Location $path
    dotnet run
} -ArgumentList $appPath

Write-Host "[ORCHESTRATOR] App started (Job ID: $($appJob.Id))" -ForegroundColor Green
Write-Host "[ORCHESTRATOR] Waiting 15 seconds for app startup..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# Step 3: Run Playwright test
Pop-Location
Push-Location "$projectRoot\Tests\UI"

Write-Host "[ORCHESTRATOR] Running Playwright test..." -ForegroundColor Yellow

try {
    if ($Headed) {
        Write-Host "[ORCHESTRATOR] Running in HEADED mode" -ForegroundColor Cyan
        & npx playwright test user-landing-manual-navigation.spec.ts --headed
    } else {
        & npx playwright test user-landing-manual-navigation.spec.ts
    }
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[ORCHESTRATOR] Test PASSED" -ForegroundColor Green
    } else {
        Write-Host "[ORCHESTRATOR] Test FAILED (Exit Code: $LASTEXITCODE)" -ForegroundColor Red
    }
} catch {
    Write-Host "[ORCHESTRATOR] Test execution error: $_" -ForegroundColor Red
} finally {
    Pop-Location
}

# Step 4: Stop app (unless KeepAppRunning flag set)
if ($KeepAppRunning) {
    Write-Host "[ORCHESTRATOR] WARNING: App kept running (Job ID: $($appJob.Id)) - Stop manually with: Stop-Job $($appJob.Id); Remove-Job $($appJob.Id)" -ForegroundColor Yellow
} else {
    Write-Host "[ORCHESTRATOR] Stopping app..." -ForegroundColor Yellow
    Stop-Job $appJob -ErrorAction SilentlyContinue
    Remove-Job $appJob -ErrorAction SilentlyContinue
    Write-Host "[ORCHESTRATOR] App stopped" -ForegroundColor Green
}

Write-Host "[ORCHESTRATOR] Test execution complete" -ForegroundColor Cyan
