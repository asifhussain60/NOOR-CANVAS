#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Run asset detection diagnostic tests for Session 212

.DESCRIPTION
    Stops any running NoorCanvas app instances, runs the diagnostic test suite,
    and displays results with detailed output.

.PARAMETER KeepAppStopped
    If specified, the app will remain stopped after tests complete.
    Otherwise, a message will prompt to restart manually.

.PARAMETER Filter
    Optional test filter. Defaults to "AssetDetectionDiagnosticTests"

.EXAMPLE
    .\Scripts\run-asset-detection-diagnostic-tests.ps1

.EXAMPLE
    .\Scripts\run-asset-detection-diagnostic-tests.ps1 -Filter "Phase3_MarkAssetLocations"
#>

param(
    [switch]$KeepAppStopped,
    [string]$Filter = "AssetDetectionDiagnosticTests"
)

$ErrorActionPreference = "Stop"

Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Asset Detection Diagnostic Tests - Session 212" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Step 1: Stop any running NoorCanvas instances
Write-Host "[1/4] Checking for running NoorCanvas instances..." -ForegroundColor Yellow

$noorCanvasProcesses = Get-Process -Name "NoorCanvas" -ErrorAction SilentlyContinue

if ($noorCanvasProcesses) {
    Write-Host "      Found $($noorCanvasProcesses.Count) running instance(s). Stopping..." -ForegroundColor Yellow
    
    foreach ($proc in $noorCanvasProcesses) {
        Write-Host "      → Stopping process $($proc.Id)..." -ForegroundColor Gray
        Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
    }
    
    Start-Sleep -Seconds 2
    
    # Verify processes stopped
    $remainingProcesses = Get-Process -Name "NoorCanvas" -ErrorAction SilentlyContinue
    if ($remainingProcesses) {
        Write-Host "      ⚠️  Warning: Some processes still running" -ForegroundColor Red
        Write-Host "      Please manually stop: $($remainingProcesses.Id -join ', ')" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "      ✅ All NoorCanvas instances stopped" -ForegroundColor Green
} else {
    Write-Host "      ✅ No running instances found" -ForegroundColor Green
}

Write-Host ""

# Step 2: Verify fixture file exists
Write-Host "[2/4] Verifying test fixtures..." -ForegroundColor Yellow

$fixturePath = "Tests\Fixtures\session-212-transcript.html"
if (Test-Path $fixturePath) {
    $fixtureSize = (Get-Item $fixturePath).Length
    Write-Host "      ✅ Fixture found: $fixturePath ($fixtureSize bytes)" -ForegroundColor Green
} else {
    Write-Host "      ❌ Fixture not found: $fixturePath" -ForegroundColor Red
    Write-Host "      Cannot proceed without test fixture!" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 3: Build test project
Write-Host "[3/4] Building test project..." -ForegroundColor Yellow

Push-Location "Tests\Unit"
try {
    $buildOutput = dotnet build --nologo 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "      ✅ Build successful" -ForegroundColor Green
    } else {
        Write-Host "      ❌ Build failed!" -ForegroundColor Red
        Write-Host "      Build output:" -ForegroundColor Red
        $buildOutput | Select-Object -Last 20 | ForEach-Object { Write-Host "        $_" -ForegroundColor Gray }
        Pop-Location
        exit 1
    }
} catch {
    Write-Host "      ❌ Build error: $_" -ForegroundColor Red
    Pop-Location
    exit 1
} finally {
    Pop-Location
}

Write-Host ""

# Step 4: Run diagnostic tests
Write-Host "[4/4] Running diagnostic tests..." -ForegroundColor Yellow
Write-Host "      Filter: $Filter" -ForegroundColor Gray
Write-Host ""

Push-Location "Tests\Unit"
try {
    # Run tests with detailed output
    dotnet test --no-build --nologo --filter $Filter --verbosity normal
    
    $testExitCode = $LASTEXITCODE
    
    Write-Host ""
    if ($testExitCode -eq 0) {
        Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Green
        Write-Host "  ✅ ALL TESTS PASSED" -ForegroundColor Green
        Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Green
    } else {
        Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Red
        Write-Host "  ❌ TESTS FAILED - Review output above for failure details" -ForegroundColor Red
        Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Red
    }
    
} finally {
    Pop-Location
}

Write-Host ""

# Provide guidance
if ($KeepAppStopped) {
    Write-Host "ℹ️  App remains stopped (as requested)" -ForegroundColor Cyan
} else {
    Write-Host "ℹ️  To restart the app, run: ncb" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "📊 For detailed diagnostic information:" -ForegroundColor Cyan
Write-Host "   - Check Debug output in Visual Studio Output window" -ForegroundColor Gray
Write-Host "   - Review test assertions for failure points" -ForegroundColor Gray
Write-Host "   - See: Docs\ASSET-DETECTION-DIAGNOSTIC-TESTS.md" -ForegroundColor Gray
Write-Host ""

exit $testExitCode
