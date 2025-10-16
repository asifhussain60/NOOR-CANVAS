#Requires -Version 5.1
<#
.SYNOPSIS
    Run mobile view tests for SessionWaiting, UserLanding, and SessionCanvas

.DESCRIPTION
    Orchestrates mobile responsive testing with automatic app lifecycle management.
    Supports both functional (Playwright) and visual regression (Percy) test modes.

.PARAMETER TestType
    Type of test to run: 'functional', 'visual', or 'both' (default: both)

.PARAMETER Percy
    Run visual regression tests with Percy (requires PERCY_TOKEN)

.PARAMETER Headed
    Run tests in headed mode (visible browser)

.PARAMETER KeepAppRunning
    Keep the app running after tests complete (for manual verification)

.EXAMPLE
    .\run-mobile-view-tests.ps1
    Run both functional and visual tests (headless)

.EXAMPLE
    .\run-mobile-view-tests.ps1 -Headed
    Run tests with visible browser

.EXAMPLE
    .\run-mobile-view-tests.ps1 -Percy
    Run visual regression tests with Percy

.EXAMPLE
    .\run-mobile-view-tests.ps1 -TestType functional -Headed
    Run only functional tests with visible browser
#>

[CmdletBinding()]
param(
    [Parameter()]
    [ValidateSet('functional', 'visual', 'both')]
    [string]$TestType = 'both',

    [Parameter()]
    [switch]$Percy,

    [Parameter()]
    [switch]$Headed,

    [Parameter()]
    [switch]$KeepAppRunning
)

$ErrorActionPreference = "Stop"

# ============================================================================
# CONFIGURATION
# ============================================================================

$script:APP_DIR = "D:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas"
$script:APP_URL = "https://localhost:9091"
$script:TEST_FUNCTIONAL = "Workspaces/TEMP/mobile-views-responsive.spec.ts"
$script:TEST_VISUAL = "Workspaces/TEMP/mobile-views-visual.spec.ts"
$script:PLAYWRIGHT_CONFIG = "config/testing/playwright.config.cjs"
$script:APP_PROCESS = $null
$script:STARTUP_WAIT_SECONDS = 15
$script:MAX_STARTUP_ATTEMPTS = 3

# ============================================================================
# FUNCTIONS
# ============================================================================

function Write-Header {
    param([string]$Message)
    Write-Host ""
    Write-Host "============================================================================" -ForegroundColor Cyan
    Write-Host " $Message" -ForegroundColor Cyan
    Write-Host "============================================================================" -ForegroundColor Cyan
    Write-Host ""
}

function Write-Step {
    param([string]$Message)
    Write-Host "[STEP] $Message" -ForegroundColor Green
}

function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Yellow
}

function Write-Error-Custom {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

function Start-NoorCanvasApp {
    Write-Step "Starting NoorCanvas application..."
    
    Push-Location $script:APP_DIR
    try {
        # Start app in background
        $script:APP_PROCESS = Start-Process -FilePath "dotnet" -ArgumentList "run" -PassThru -WindowStyle Minimized
        
        Write-Info "App started (PID: $($script:APP_PROCESS.Id))"
        Write-Info "Waiting $script:STARTUP_WAIT_SECONDS seconds for app to initialize..."
        
        Start-Sleep -Seconds $script:STARTUP_WAIT_SECONDS
        
        # Verify app is responding
        $attempt = 1
        $maxAttempts = $script:MAX_STARTUP_ATTEMPTS
        $appReady = $false
        
        while ($attempt -le $maxAttempts -and -not $appReady) {
            try {
                Write-Info "Checking app health (attempt $attempt/$maxAttempts)..."
                $response = Invoke-WebRequest -Uri $script:APP_URL -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
                if ($response.StatusCode -eq 200) {
                    $appReady = $true
                    Write-Step "App is ready and responding!"
                }
            }
            catch {
                Write-Info "App not ready yet, waiting 5 more seconds..."
                Start-Sleep -Seconds 5
                $attempt++
            }
        }
        
        if (-not $appReady) {
            throw "App failed to start after $maxAttempts attempts"
        }
    }
    finally {
        Pop-Location
    }
}

function Stop-NoorCanvasApp {
    Write-Step "Stopping NoorCanvas application..."
    
    if ($script:APP_PROCESS -and -not $script:APP_PROCESS.HasExited) {
        Stop-Process -Id $script:APP_PROCESS.Id -Force -ErrorAction SilentlyContinue
        Write-Info "App stopped (PID: $($script:APP_PROCESS.Id))"
    }
    else {
        Write-Info "App process already terminated"
    }
}

function Test-PercyToken {
    if (-not $env:PERCY_TOKEN) {
        Write-Error-Custom "PERCY_TOKEN environment variable not set"
        Write-Info "Visual regression tests require Percy configuration"
        Write-Info "Set PERCY_TOKEN or run without -Percy flag"
        return $false
    }
    return $true
}

function Invoke-FunctionalTests {
    Write-Header "Running Functional Tests (Device Emulation)"
    
    $headedArg = if ($Headed) { "--headed" } else { "" }
    
    $cmd = "npx playwright test $script:TEST_FUNCTIONAL --config=$script:PLAYWRIGHT_CONFIG $headedArg"
    Write-Info "Executing: $cmd"
    
    Invoke-Expression $cmd
    
    if ($LASTEXITCODE -ne 0) {
        throw "Functional tests failed with exit code $LASTEXITCODE"
    }
    
    Write-Step "Functional tests completed successfully!"
}

function Invoke-VisualTests {
    Write-Header "Running Visual Regression Tests (Percy)"
    
    if (-not (Test-PercyToken)) {
        throw "Percy token not configured"
    }
    
    $headedArg = if ($Headed) { "--headed" } else { "" }
    
    $cmd = "percy exec -- npx playwright test $script:TEST_VISUAL --config=$script:PLAYWRIGHT_CONFIG $headedArg"
    Write-Info "Executing: $cmd"
    
    Invoke-Expression $cmd
    
    if ($LASTEXITCODE -ne 0) {
        throw "Visual tests failed with exit code $LASTEXITCODE"
    }
    
    Write-Step "Visual regression tests completed successfully!"
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================

try {
    Write-Header "Mobile View Tests - SessionWaiting, UserLanding, SessionCanvas"
    
    Write-Info "Test Type: $TestType"
    Write-Info "Percy Mode: $($Percy.IsPresent)"
    Write-Info "Headed Mode: $($Headed.IsPresent)"
    Write-Info "Keep App Running: $($KeepAppRunning.IsPresent)"
    
    # Start the app
    Start-NoorCanvasApp
    
    # Run tests based on configuration
    if ($Percy -or $TestType -eq 'visual' -or $TestType -eq 'both') {
        if ($TestType -eq 'visual' -or $TestType -eq 'both') {
            Invoke-VisualTests
        }
    }
    
    if ($TestType -eq 'functional' -or $TestType -eq 'both') {
        if (-not $Percy -or $TestType -eq 'both') {
            Invoke-FunctionalTests
        }
    }
    
    # If Percy flag is set but TestType is not specified, run visual tests
    if ($Percy -and $TestType -eq 'both') {
        # Already ran visual tests above
    }
    elseif ($Percy) {
        Invoke-VisualTests
    }
    
    Write-Header "✅ All Tests Completed Successfully!"
    
    if ($KeepAppRunning) {
        Write-Info "App is still running at $script:APP_URL"
        Write-Info "Press Ctrl+C to stop the app"
        Wait-Event # Keep script running
    }
}
catch {
    Write-Error-Custom $_.Exception.Message
    Write-Host $_.ScriptStackTrace -ForegroundColor Red
    exit 1
}
finally {
    if (-not $KeepAppRunning) {
        Stop-NoorCanvasApp
    }
}
