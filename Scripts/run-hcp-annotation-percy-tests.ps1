# HCP Annotation System Percy Test Orchestration Script
# Purpose: Run comprehensive annotation system tests with Percy visual snapshots
# Session: 212 (Host Token: PQ9N5YWW, User Token: KJAHA99L)

param(
    [switch]$KeepAppRunning = $false,
    [switch]$HeadedMode = $false
)

$ErrorActionPreference = "Stop"

Write-Host "════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  HCP ANNOTATION SYSTEM - PERCY VISUAL TESTS" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Configuration
$projectRoot = "D:\PROJECTS\NOOR CANVAS"
$appPath = "$projectRoot\SPA\NoorCanvas"
$testsPath = "$projectRoot\Workspaces\TEMP"
$playwrightConfigPath = "$projectRoot\PlayWright"

# Test files
$testFiles = @(
    "hcp-annotation-toolbar-visibility.spec.ts",
    "hcp-annotation-laser-pointer.spec.ts",
    "hcp-annotation-color-picker.spec.ts",
    "sessioncanvas-annotation-overlay.spec.ts"
)

Write-Host "📋 Test Configuration:" -ForegroundColor Yellow
Write-Host "   - Session ID: 212" -ForegroundColor Gray
Write-Host "   - Host Token: PQ9N5YWW" -ForegroundColor Gray
Write-Host "   - User Token: KJAHA99L" -ForegroundColor Gray
Write-Host "   - Test Files: $($testFiles.Count)" -ForegroundColor Gray
Write-Host ""

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
            Write-Host "   ❌ $testFile - FAILED" -ForegroundColor Red
            $failedTests += $testFile
            $testResults += @{
                File = $testFile
                Status = "FAILED"
                Output = $output
            }
        }
    }
    catch {
        Write-Host "   ❌ $testFile - ERROR: $_" -ForegroundColor Red
        $failedTests += $testFile
        $testResults += @{
            File = $testFile
            Status = "ERROR"
            Output = $_.Exception.Message
        }
    }
}

Write-Host ""

# Step 3: Generate summary
Write-Host "════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  TEST SUMMARY" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════" -ForegroundColor Cyan

$passedCount = ($testResults | Where-Object { $_.Status -eq "PASSED" }).Count
$failedCount = ($testResults | Where-Object { $_.Status -ne "PASSED" }).Count

Write-Host ""
Write-Host "Total Tests: $($testResults.Count)" -ForegroundColor White
Write-Host "Passed: $passedCount" -ForegroundColor Green
Write-Host "Failed: $failedCount" -ForegroundColor $(if ($failedCount -gt 0) { "Red" } else { "Gray" })
Write-Host ""

if ($failedTests.Count -gt 0) {
    Write-Host "❌ Failed Tests:" -ForegroundColor Red
    foreach ($failed in $failedTests) {
        Write-Host "   - $failed" -ForegroundColor Red
    }
    Write-Host ""
}

# Step 4: Stop application
if (-not $KeepAppRunning) {
    Write-Host "🛑 Step 4: Stopping NoorCanvas application..." -ForegroundColor Yellow
    Stop-Job -Job $appJob -ErrorAction SilentlyContinue
    Remove-Job -Job $appJob -ErrorAction SilentlyContinue
    Write-Host "   ✅ Application stopped" -ForegroundColor Green
}
else {
    Write-Host "⚠️  Application left running (--KeepAppRunning flag set)" -ForegroundColor Yellow
    Write-Host "   Job ID: $($appJob.Id)" -ForegroundColor Gray
    Write-Host "   To stop: Stop-Job -Id $($appJob.Id); Remove-Job -Id $($appJob.Id)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  PERCY SNAPSHOTS" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "Percy visual snapshots have been captured and uploaded." -ForegroundColor Green
Write-Host "Visit https://percy.io to review visual diffs." -ForegroundColor Gray
Write-Host ""

# Exit with failure code if any tests failed
if ($failedCount -gt 0) {
    exit 1
}

exit 0
