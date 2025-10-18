# Share Transcript Navigation Test Orchestration Script
# Purpose: Test ShareTranscript button navigation from HostControlPanel to TranscriptCanvas
# Includes: App lifecycle management, health checks, Percy visual regression, console log tracking

Write-Host "=== Share Transcript Navigation Test ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Kill any existing NoorCanvas processes
Write-Host "Step 1: Cleaning up existing processes..." -ForegroundColor Yellow
Get-Process -Name "NoorCanvas" -ErrorAction SilentlyContinue | Stop-Process -Force
Get-Process -Name "dotnet" -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*NoorCanvas*" } | Stop-Process -Force
Start-Sleep -Seconds 2

# Step 2: Launch app in separate elevated PowerShell window
Write-Host "Step 2: Launching NoorCanvas app in separate window..." -ForegroundColor Yellow
$appProcess = Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "Set-Location 'D:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas'; `
     `$env:ASPNETCORE_ENVIRONMENT = 'Development'; `
     Write-Host 'ASPNETCORE_ENVIRONMENT = Development' -ForegroundColor Green; `
     Write-Host 'Starting NoorCanvas...' -ForegroundColor Cyan; `
     dotnet run"
) -PassThru

# Step 3: Health check with retry logic (extended for Norton antivirus scanning)
Write-Host "Step 3: Waiting for app to start (health check)..." -ForegroundColor Yellow
Write-Host "Note: Norton antivirus may cause startup delays" -ForegroundColor Gray
$maxRetries = 60  # Increased from 30 to 60 seconds for Norton delays
$retryCount = 0
$appReady = $false

while (-not $appReady -and $retryCount -lt $maxRetries) {
    try {
        $response = Invoke-WebRequest -Uri "https://localhost:9091" -SkipCertificateCheck -TimeoutSec 3 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            $appReady = $true
            Write-Host ""
            Write-Host "App is ready (responded with 200 OK after $retryCount seconds)" -ForegroundColor Green
        }
    } catch {
        $retryCount++
        Write-Host "." -NoNewline -ForegroundColor Gray
        Start-Sleep -Seconds 1
    }
}

Write-Host ""

if (-not $appReady) {
    Write-Host "App failed to start within timeout (60 seconds)" -ForegroundColor Red
    Write-Host "Please check the app window for errors" -ForegroundColor Yellow
    Write-Host "Note: Norton or other antivirus software may require additional startup time" -ForegroundColor Gray
    
    # Cleanup and exit
    Get-Process -Name "NoorCanvas" -ErrorAction SilentlyContinue | Stop-Process -Force
    exit 1
}

# Step 4: Run Playwright test with Percy
Write-Host "Step 4: Running Playwright test with Percy visual regression..." -ForegroundColor Yellow
Write-Host ""

Set-Location "D:\PROJECTS\NOOR CANVAS"

# Check if Percy token is available
if (-not $env:PERCY_TOKEN) {
    Write-Host "Warning: PERCY_TOKEN not set. Visual snapshots will be skipped." -ForegroundColor Yellow
    Write-Host "To enable Percy: Run setup-percy.ps1 or set PERCY_TOKEN environment variable" -ForegroundColor Gray
    Write-Host ""
}

# Run test with detailed output
$testFile = "Workspaces/TEMP/share-transcript-navigation.spec.ts"

if ($env:PERCY_TOKEN) {
    npx percy exec -- npx playwright test $testFile --headed --reporter=list
} else {
    npx playwright test $testFile --headed --reporter=list
}

$testExitCode = $LASTEXITCODE

# Step 5: Display test results
Write-Host ""
Write-Host "Step 5: Test Results" -ForegroundColor Yellow
Write-Host "===================" -ForegroundColor Cyan

if ($testExitCode -eq 0) {
    Write-Host "All tests passed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Percy Snapshots (if Percy enabled):" -ForegroundColor Cyan
    Write-Host "  1. Host Control Panel - Initial State" -ForegroundColor Gray
    Write-Host "  2. Host Control Panel - Before Share Transcript Click" -ForegroundColor Gray
    Write-Host "  3. TranscriptCanvas - Loaded Successfully" -ForegroundColor Gray
    Write-Host "  4. Host Control Panel - Share Transcript Disabled" -ForegroundColor Gray
    Write-Host "  5. Host Control Panel - Share Transcript Error State" -ForegroundColor Gray
} else {
    Write-Host "Tests failed with exit code: $testExitCode" -ForegroundColor Red
    Write-Host "Check console logs above for errors" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Console log tracking was enabled during test execution" -ForegroundColor Cyan
Write-Host "Check test output above for any JavaScript errors" -ForegroundColor Gray

# Step 6: Cleanup
Write-Host ""
Write-Host "Step 6: Cleaning up..." -ForegroundColor Yellow

# Stop the app process if it's still running
if ($appProcess -and !$appProcess.HasExited) {
    Write-Host "Stopping app process..." -ForegroundColor Gray
    Stop-Process -Id $appProcess.Id -Force -ErrorAction SilentlyContinue
}

# Kill any remaining NoorCanvas processes
Get-Process -Name "NoorCanvas" -ErrorAction SilentlyContinue | Stop-Process -Force
Get-Process -Name "dotnet" -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*NoorCanvas*" } | Stop-Process -Force

Write-Host "Cleanup complete" -ForegroundColor Green
Write-Host ""
Write-Host "=== Test Orchestration Complete ===" -ForegroundColor Cyan

exit $testExitCode
