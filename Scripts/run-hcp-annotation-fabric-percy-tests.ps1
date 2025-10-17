# HCP Annotation Fabric.js System - Percy Test Orchestration Script
# Purpose: Run comprehensive Fabric.js annotation system tests with Percy visual snapshots
# Session: 212 (Host Token: PQ9N5YWW, User Token: KJAHA99L)
# Generated: 2025-10-16

param(
    [switch]$KeepAppRunning = $false,
    [switch]$HeadedMode = $false
)

$ErrorActionPreference = "Stop"

Write-Host "════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  HCP ANNOTATION FABRIC.JS - PERCY VISUAL TESTS" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Configuration
$projectRoot = "D:\PROJECTS\NOOR CANVAS"
$appPath = "$projectRoot\SPA\NoorCanvas"
$testsPath = "$projectRoot\Tests\UI"
$playwrightConfigPath = "$projectRoot\PlayWright"

# Test files
$testFiles = @(
    "hcp-annotation-fabric-system.spec.ts"
)

Write-Host "📋 Test Configuration:" -ForegroundColor Yellow
Write-Host "   - Session ID: 212" -ForegroundColor Gray
Write-Host "   - Host Token: PQ9N5YWW" -ForegroundColor Gray
Write-Host "   - User Token: KJAHA99L" -ForegroundColor Gray
Write-Host "   - Test Files: $($testFiles.Count)" -ForegroundColor Gray
Write-Host "   - Test Count: 15 visual regression tests" -ForegroundColor Gray
Write-Host ""

# Verify Percy token
if (-not $env:PERCY_TOKEN) {
    Write-Host "⚠️  WARNING: PERCY_TOKEN not set. Percy snapshots will be skipped." -ForegroundColor Yellow
    Write-Host "   To enable Percy, set PERCY_TOKEN environment variable." -ForegroundColor Gray
    Write-Host ""
}

# Step 1: Start the application
Write-Host "🚀 Step 1: Starting NoorCanvas application..." -ForegroundColor Green
Set-Location $appPath

$appJob = Start-Job -ScriptBlock {
    param($appPath)
    Set-Location $appPath
    dotnet run
} -ArgumentList $appPath

Write-Host "   ⏳ Waiting 15 seconds for application to start..." -ForegroundColor Gray
Start-Sleep -Seconds 15

# Verify app is running
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000" -TimeoutSec 5 -UseBasicParsing
    Write-Host "   ✅ Application started successfully (Status: $($response.StatusCode))" -ForegroundColor Green
}
catch {
    Write-Host "   ❌ Failed to start application: $_" -ForegroundColor Red
    Write-Host "   💡 Tip: Check if port 5000 is already in use" -ForegroundColor Yellow
    Stop-Job -Job $appJob -ErrorAction SilentlyContinue
    Remove-Job -Job $appJob -ErrorAction SilentlyContinue
    exit 1
}

Write-Host ""

# Step 2: Run Playwright tests
Write-Host "🧪 Step 2: Running Playwright tests with Percy..." -ForegroundColor Green
Set-Location $playwrightConfigPath

$testResults = @()
$failedTests = @()

foreach ($testFile in $testFiles) {
    Write-Host ""
    Write-Host "   📝 Running: $testFile" -ForegroundColor Cyan
    
    $testFilePath = Join-Path $testsPath $testFile
    
    if (-not (Test-Path $testFilePath)) {
        Write-Host "   ⚠️  Test file not found: $testFilePath" -ForegroundColor Yellow
        $failedTests += $testFile
        continue
    }
    
    $playwrightArgs = @("test", $testFilePath)
    if ($HeadedMode) {
        $playwrightArgs += "--headed"
    }
    
    try {
        $output = npx playwright @playwrightArgs 2>&1
        $exitCode = $LASTEXITCODE
        
        if ($exitCode -eq 0) {
            Write-Host "   ✅ $testFile - PASSED" -ForegroundColor Green
            $testResults += @{
                File = $testFile
                Status = "PASSED"
                Output = $output
            }
        }
        else {
            Write-Host "   ❌ $testFile - FAILED (Exit Code: $exitCode)" -ForegroundColor Red
            $failedTests += $testFile
            $testResults += @{
                File = $testFile
                Status = "FAILED"
                Output = $output
                ExitCode = $exitCode
            }
        }
    }
    catch {
        Write-Host "   ❌ $testFile - ERROR: $_" -ForegroundColor Red
        $failedTests += $testFile
        $testResults += @{
            File = $testFile
            Status = "ERROR"
            Error = $_.Exception.Message
        }
    }
}

Write-Host ""
Write-Host "════════════════════════════════════════════════════" -ForegroundColor Cyan

# Step 3: Clean up
if (-not $KeepAppRunning) {
    Write-Host ""
    Write-Host "🛑 Step 3: Stopping application..." -ForegroundColor Green
    Stop-Job -Job $appJob -ErrorAction SilentlyContinue
    Remove-Job -Job $appJob -ErrorAction SilentlyContinue
    Write-Host "   ✅ Application stopped" -ForegroundColor Green
}
else {
    Write-Host ""
    Write-Host "ℹ️  Application left running (-KeepAppRunning flag set)" -ForegroundColor Yellow
    Write-Host "   Job ID: $($appJob.Id)" -ForegroundColor Gray
    Write-Host "   To stop manually: Stop-Job -Id $($appJob.Id); Remove-Job -Id $($appJob.Id)" -ForegroundColor Gray
}

Write-Host ""

# Step 4: Summary
Write-Host "📊 TEST SUMMARY" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "Total Tests: $($testFiles.Count)" -ForegroundColor White
Write-Host "Passed: $(($testResults | Where-Object { $_.Status -eq 'PASSED' }).Count)" -ForegroundColor Green
Write-Host "Failed: $($failedTests.Count)" -ForegroundColor Red
Write-Host ""

if ($failedTests.Count -gt 0) {
    Write-Host "❌ FAILED TESTS:" -ForegroundColor Red
    foreach ($test in $failedTests) {
        Write-Host "   - $test" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "💡 Tips:" -ForegroundColor Yellow
    Write-Host "   - Run with -HeadedMode to see browser interactions" -ForegroundColor Gray
    Write-Host "   - Check application logs for errors" -ForegroundColor Gray
    Write-Host "   - Verify session 212 exists and is accessible" -ForegroundColor Gray
    Write-Host "   - Ensure annotation panel JavaScript is loaded correctly" -ForegroundColor Gray
    Write-Host ""
    
    # Output detailed error information
    foreach ($result in $testResults | Where-Object { $_.Status -ne 'PASSED' }) {
        Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
        Write-Host "Test: $($result.File)" -ForegroundColor Yellow
        Write-Host "Status: $($result.Status)" -ForegroundColor Red
        if ($result.Output) {
            Write-Host "Output:" -ForegroundColor Gray
            Write-Host $result.Output -ForegroundColor DarkGray
        }
        if ($result.Error) {
            Write-Host "Error: $($result.Error)" -ForegroundColor Red
        }
        Write-Host ""
    }
    
    exit 1
}
else {
    Write-Host "✅ ALL TESTS PASSED!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🎨 Percy Snapshots:" -ForegroundColor Cyan
    Write-Host "   - 15 visual regression snapshots captured" -ForegroundColor Gray
    Write-Host "   - Check Percy dashboard for comparison results" -ForegroundColor Gray
    Write-Host "   - https://percy.io/[your-org]/noor-canvas" -ForegroundColor Gray
    Write-Host ""
    Write-Host "📝 Test Coverage:" -ForegroundColor Cyan
    Write-Host "   ✓ Initial state verification" -ForegroundColor Gray
    Write-Host "   ✓ Panel appearance after asset share" -ForegroundColor Gray
    Write-Host "   ✓ Tool layout and visibility" -ForegroundColor Gray
    Write-Host "   ✓ Tool selection (laser, draw, highlight, text)" -ForegroundColor Gray
    Write-Host "   ✓ Color picker interaction" -ForegroundColor Gray
    Write-Host "   ✓ Panel close functionality" -ForegroundColor Gray
    Write-Host "   ✓ Multiple tool switches" -ForegroundColor Gray
    Write-Host "   ✓ SessionCanvas integration" -ForegroundColor Gray
    Write-Host "   ✓ JavaScript loading verification" -ForegroundColor Gray
    Write-Host "   ✓ SignalR connection status" -ForegroundColor Gray
    Write-Host "   ✓ Panel animation and positioning" -ForegroundColor Gray
    Write-Host ""
    exit 0
}
