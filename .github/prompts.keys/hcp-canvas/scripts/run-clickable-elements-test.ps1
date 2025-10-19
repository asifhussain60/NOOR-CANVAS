# ==============================================================================
# Clickable Elements Sanitization Test Runner
# ==============================================================================
# This script orchestrates the execution of Playwright tests for validating
# that all clickable elements (share buttons, delete buttons, onclick handlers)
# are properly removed before broadcasting content to participants.
#
# Usage:
#   .\run-clickable-elements-test.ps1              # Run tests and stop app
#   .\run-clickable-elements-test.ps1 -KeepAppRunning  # Keep app running after
# ==============================================================================

param(
    [switch]$KeepAppRunning
)

# Configuration
$APP_DIR = "D:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas"
$TEST_DIR = "D:\PROJECTS\NOOR CANVAS\.github\prompts.keys\hcp-canvas\tests"
$TEST_FILE = "clickable-elements-sanitization.spec.ts"
$APP_URL = "http://localhost:9090"
$MAX_WAIT_SECONDS = 30

# Step 1: Start the application
Write-Host "[START] Step 1: Starting NoorCanvas application..." -ForegroundColor Cyan
Write-Host "   Working directory: $APP_DIR" -ForegroundColor Gray

# Start the app in a new window
$appProcess = Start-Process -FilePath "dotnet" -ArgumentList "run" -WorkingDirectory $APP_DIR -PassThru -WindowStyle Normal

Write-Host "   [OK] Application started (Process ID: $($appProcess.Id))" -ForegroundColor Green
Write-Host ""

# Step 2: Wait for application to be ready
Write-Host "[WAIT] Step 2: Waiting for application to be ready..." -ForegroundColor Yellow
Write-Host "   Checking $APP_URL..." -ForegroundColor Gray

$ready = $false
$attempts = 0

while ($attempts -lt $MAX_WAIT_SECONDS -and -not $ready) {
    $attempts++
    Start-Sleep -Seconds 1
    
    try {
        $response = Invoke-WebRequest -Uri $APP_URL -TimeoutSec 2 -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            $ready = $true
            Write-Host "   [OK] Application is ready! (after $attempts seconds)" -ForegroundColor Green
            Write-Host ""
        }
    } catch {
        if ($attempts % 2 -eq 0) {
            Write-Host "   [WAIT] Still waiting... ($attempts/$MAX_WAIT_SECONDS seconds)" -ForegroundColor Gray
        }
    }
}

if (-not $ready) {
    Write-Host "   [ERROR] Application failed to start after $MAX_WAIT_SECONDS seconds" -ForegroundColor Red
    Write-Host ""
    Stop-Process -Id $appProcess.Id -Force -ErrorAction SilentlyContinue
    exit 1
}

# Step 3: Run Playwright tests
Write-Host "[TEST] Step 3: Running Playwright tests..." -ForegroundColor Yellow
Write-Host "   Test file: $TEST_FILE" -ForegroundColor Gray
Write-Host "   Test directory: $TEST_DIR" -ForegroundColor Gray
Write-Host ""

# Set environment variables for the test
$env:HOST_TOKEN = "PQ9N5YWW"
$env:USER_TOKEN = "KJAHA99L"
$env:SESSION_ID = "212"

# Run the test
Set-Location $TEST_DIR
$testOutput = npx playwright test $TEST_FILE 2>&1
$testExitCode = $LASTEXITCODE

# Display test output
Write-Host $testOutput

# Step 4: Report results
Write-Host ""
if ($testExitCode -eq 0) {
    Write-Host "[SUCCESS] All tests passed!" -ForegroundColor Green
} else {
    Write-Host "[FAILED] Tests failed with exit code: $testExitCode" -ForegroundColor Red
}
Write-Host ""

# Step 5: Cleanup
if ($KeepAppRunning) {
    Write-Host "[KEEP] Application will continue running (Process ID: $($appProcess.Id))" -ForegroundColor Cyan
    Write-Host "   To stop manually, run: Stop-Process -Id $($appProcess.Id)" -ForegroundColor Gray
} else {
    Write-Host "[STOP] Stopping application process..." -ForegroundColor Yellow
    Stop-Process -Id $appProcess.Id -Force -ErrorAction SilentlyContinue
    Write-Host "   [OK] Application stopped" -ForegroundColor Green
}

Write-Host ""
Write-Host "==============================================================================`n"

# Exit with the test exit code
exit $testExitCode
