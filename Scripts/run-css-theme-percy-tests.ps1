# CSS Theme Consistency Percy Visual Regression Tests
# [DEBUG-WORKITEM:css:theme-consistency] Automated visual validation
#
# This script:
# 1. Ensures NoorCanvas app is running on https://localhost:9091
# 2. Runs Percy visual regression tests for CSS theme consistency
# 3. Captures screenshots of HostControlPanel, SessionCanvas, and TranscriptCanvas
# 4. Validates that all three views render Islamic content at consistent 90% width
#
# Prerequisites:
# - PERCY_TOKEN environment variable must be set
# - Percy CLI and @percy/playwright must be installed (npm install)
# - NoorCanvas app must be buildable and runnable

param(
    [switch]$KeepAppRunning = $false,
    [switch]$SkipBuild = $false,
    [string]$PercyToken = $env:PERCY_TOKEN
)

# Configuration
$WorkspaceRoot = "D:\PROJECTS\NOOR CANVAS"
$AppProjectPath = "$WorkspaceRoot\SPA\NoorCanvas"
$TestFilePath = "$WorkspaceRoot\Tests\UI\css-theme-consistency-percy.spec.ts"
$AppUrl = "https://localhost:9091"
$MaxWaitTime = 60 # seconds

# Color output functions
function Write-Info { param($Message) Write-Host "[INFO] $Message" -ForegroundColor Cyan }
function Write-Success { param($Message) Write-Host "[SUCCESS] $Message" -ForegroundColor Green }
function Write-Error-Custom { param($Message) Write-Host "[ERROR] $Message" -ForegroundColor Red }
function Write-Warning-Custom { param($Message) Write-Host "[WARNING] $Message" -ForegroundColor Yellow }

# Validate Percy token
if ([string]::IsNullOrEmpty($PercyToken)) {
    Write-Warning-Custom "PERCY_TOKEN environment variable not set"
    Write-Warning-Custom "Percy snapshots will not be uploaded to Percy.io"
    Write-Warning-Custom "Tests will run locally without visual comparison"
    Write-Host ""
    $continue = Read-Host "Continue without Percy? (y/n)"
    if ($continue -ne 'y') {
        Write-Info "Exiting. Set PERCY_TOKEN and try again"
        exit 0
    }
}

Write-Info "=== CSS Theme Consistency Percy Tests ==="
Write-Info "Workspace: $WorkspaceRoot"
Write-Info "Test File: $TestFilePath"
Write-Info "App URL: $AppUrl"
Write-Host ""

# Check if app is already running
Write-Info "Checking if NoorCanvas app is already running..."
try {
    $response = Invoke-WebRequest -Uri $AppUrl -Method Head -SkipCertificateCheck -TimeoutSec 5 -ErrorAction SilentlyContinue
    $appAlreadyRunning = $true
    Write-Success "App is already running at $AppUrl"
} catch {
    $appAlreadyRunning = $false
    Write-Info "App is not running, will start it"
}

$appProcess = $null

if (-not $appAlreadyRunning) {
    # Build app (unless skipped)
    if (-not $SkipBuild) {
        Write-Info "Building NoorCanvas app..."
        Push-Location $AppProjectPath
        try {
            $buildOutput = dotnet build 2>&1
            if ($LASTEXITCODE -ne 0) {
                Write-Error-Custom "Build failed"
                Write-Host $buildOutput
                Pop-Location
                exit 1
            }
            Write-Success "Build completed"
        } finally {
            Pop-Location
        }
    } else {
        Write-Info "Skipping build (--SkipBuild specified)"
    }

    # Start app in background
    Write-Info "Starting NoorCanvas app in background..."
    Push-Location $AppProjectPath
    try {
        $appProcess = Start-Process -FilePath "dotnet" -ArgumentList "run" -PassThru -WindowStyle Minimized
        Write-Success "App process started (PID: $($appProcess.Id))"
    } finally {
        Pop-Location
    }

    # Wait for app to be ready
    Write-Info "Waiting for app to be ready (max $MaxWaitTime seconds)..."
    $waited = 0
    $appReady = $false
    while ($waited -lt $MaxWaitTime) {
        Start-Sleep -Seconds 2
        $waited += 2
        try {
            $response = Invoke-WebRequest -Uri $AppUrl -Method Head -SkipCertificateCheck -TimeoutSec 3 -ErrorAction SilentlyContinue
            $appReady = $true
            Write-Success "App is ready at $AppUrl (waited $waited seconds)"
            break
        } catch {
            Write-Host "." -NoNewline
        }
    }

    Write-Host "" # New line after dots

    if (-not $appReady) {
        Write-Error-Custom "App did not become ready within $MaxWaitTime seconds"
        if ($appProcess) {
            Write-Info "Stopping app process..."
            Stop-Process -Id $appProcess.Id -Force
        }
        exit 1
    }

    # Additional wait for app to stabilize
    Write-Info "Waiting 5 seconds for app to stabilize..."
    Start-Sleep -Seconds 5
}

# Run Percy tests
Write-Info "Running CSS Theme Consistency Percy tests..."
Write-Host ""

Push-Location $WorkspaceRoot
try {
    if ([string]::IsNullOrEmpty($PercyToken)) {
        # Run without Percy
        Write-Info "Running tests locally (without Percy snapshots)..."
        npx playwright test $TestFilePath --headed
    } else {
        # Run with Percy
        Write-Info "Running tests with Percy visual snapshots..."
        $env:PERCY_TOKEN = $PercyToken
        npx percy exec -- npx playwright test $TestFilePath --headed
    }
    
    $testExitCode = $LASTEXITCODE
    Write-Host ""
    
    if ($testExitCode -eq 0) {
        Write-Success "All tests passed!"
    } else {
        Write-Error-Custom "Tests failed with exit code $testExitCode"
    }
} finally {
    Pop-Location
}

# Cleanup
if ($appProcess -and -not $KeepAppRunning -and -not $appAlreadyRunning) {
    Write-Info "Stopping NoorCanvas app..."
    try {
        Stop-Process -Id $appProcess.Id -Force
        Write-Success "App stopped"
    } catch {
        Write-Warning-Custom "Failed to stop app process (PID: $($appProcess.Id))"
    }
} elseif ($appProcess -and $KeepAppRunning) {
    Write-Info "Keeping app running (--KeepAppRunning specified)"
    Write-Info "App PID: $($appProcess.Id)"
    Write-Info "App URL: $AppUrl"
}

Write-Host ""
Write-Info "=== CSS Theme Consistency Percy Tests Complete ==="

exit $testExitCode
