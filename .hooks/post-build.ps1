#!/usr/bin/env pwsh
# NOOR Canvas Post-Build Test Hook - Simple Version

param(
    [string]$Configuration = "Debug",
    [switch]$SkipTests,
    [switch]$Verbose
)

$WorkspaceRoot = "D:\PROJECTS\NOOR CANVAS"
$TestProject = "$WorkspaceRoot\Tests\NoorCanvas.Core.Tests"

Write-Host ""
Write-Host "▶ NOOR Canvas Post-Build Hook" -ForegroundColor Yellow

# Announce available global commands for developer convenience
Write-Host "NOOR Canvas global commands loaded: nc, nct, ncdoc, iiskill" -ForegroundColor Cyan

if ($SkipTests) {
    Write-Host "⏭️ Tests skipped (SkipTests flag set)" -ForegroundColor Yellow
    exit 0
}

Write-Host "🔨 Running tests automatically after build" -ForegroundColor Cyan

Set-Location $TestProject

Write-Host ""
Write-Host "▶ Running automated test suite" -ForegroundColor Yellow

$testArgs = @(
    "test"
    "--configuration", $Configuration
    "--logger", "console;verbosity=minimal"
    "--nologo"
)

if ($Verbose) {
    $testArgs += "--verbosity", "normal"
}

Write-Host "Executing tests for $Configuration build..." -ForegroundColor Yellow
$testResult = & dotnet @testArgs 2>&1
$testExitCode = $LASTEXITCODE

Write-Host ""
if ($testExitCode -eq 0) {
    Write-Host "✅ All automated tests passed!" -ForegroundColor Green
    if ($Verbose) {
        Write-Host $testResult -ForegroundColor Green
    }
} else {
    Write-Host "⚠️ Some tests failed in automated run:" -ForegroundColor Red
    Write-Host $testResult -ForegroundColor Red
    Write-Host ""
    Write-Host "ℹ️ Build succeeded but tests failed - check test output above" -ForegroundColor Yellow
}

Set-Location $WorkspaceRoot
exit 0
