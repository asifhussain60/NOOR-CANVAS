#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Run Canvas Rendering Verification Tests (No Percy Required)

.DESCRIPTION
    Executes Playwright tests to verify canvas rendering structure and styling.
    Does not require Percy token - runs standard Playwright tests.
#>

param(
    [switch]$HeadedMode
)

$ErrorActionPreference = "Stop"
$ProjectRoot = "D:\PROJECTS\NOOR CANVAS"
$TestFile = ".github\prompts.keys\transcript-canvas\tests\canvas-rendering-check.spec.ts"

Write-Host "[INFO] Canvas Rendering Verification Tests" -ForegroundColor Cyan
Write-Host ""

Set-Location $ProjectRoot

if (-not (Test-Path $TestFile)) {
    Write-Host "[ERROR] Test file not found: $TestFile" -ForegroundColor Red
    exit 1
}

# Launch app
Write-Host "[STEP] Launching application..." -ForegroundColor Yellow
$AppProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'D:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas'; `$env:ASPNETCORE_URLS='https://localhost:9091'; dotnet run" -WindowStyle Normal -PassThru
Write-Host "[OK] App launched (PID: $($AppProcess.Id))" -ForegroundColor Green

Write-Host "[STEP] Waiting for startup..." -ForegroundColor Yellow
Start-Sleep -Seconds 20

# Run tests
Write-Host "[STEP] Running tests..." -ForegroundColor Yellow
Write-Host ""

$playwrightArgs = @(
    "test",
    $TestFile,
    "--config=config/testing/playwright.config.cjs",
    "--reporter=list"
)

if ($HeadedMode) {
    $playwrightArgs += "--headed"
}

& npx playwright $playwrightArgs

$testResult = $LASTEXITCODE

# Cleanup
Write-Host ""
Write-Host "[STEP] Cleaning up..." -ForegroundColor Yellow
$portProcess = netstat -ano | findstr ":9091" | findstr "LISTENING"
if ($portProcess -match '\s+(\d+)$') {
    $processId = $matches[1]
    Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
    Write-Host "[OK] Killed app process (PID: $processId)" -ForegroundColor Green
}

Write-Host ""
if ($testResult -eq 0) {
    Write-Host "[PASS] All tests passed!" -ForegroundColor Green
} else {
    Write-Host "[FAIL] Some tests failed" -ForegroundColor Red
}

exit $testResult
