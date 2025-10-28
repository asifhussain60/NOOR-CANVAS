<#
.SYNOPSIS
    Launches NOOR Canvas and runs FAB Share Button visual regression tests with Percy.

.DESCRIPTION
    This script validates the FAB (Floating Action Button) share button redesign:
    1. Builds the application (optional)
    2. Launches application in dedicated PowerShell window
    3. Waits for application to be ready (health check)
    4. Runs Playwright + Percy tests with headed browser
    5. Captures visual snapshots at multiple viewport sizes
    6. Validates FAB button styling and positioning
    7. Checks for JavaScript errors in browser console
    8. Cleans up application process after tests complete
    
    Visual regression tests cover:
    - FAB buttons are 40px circular, positioned top-right
    - Subtle blue background with low opacity (rgba(59, 130, 246, 0.1))
    - Different icons: 📤 for assets, 📄 for sections
    - No legacy golden/red buttons (200px wide)
    - Wrapper containers have position:relative
    - Hover states (opacity increase, scale transform)
    - Click handlers have correct data attributes
    
.PARAMETER SkipBuild
    Skip building the application before launching (use if already built).

.PARAMETER KeepAppRunning
    Keep application running after tests complete (for manual debugging).

.PARAMETER HeadlessTests
    Run Playwright tests in headless mode (default is headed for visual verification).

.PARAMETER AllowNoPercy
    Allow tests to run without Percy (will still do Playwright validation).

.EXAMPLE
    .\run-fab-share-button-percy-tests.ps1
    
    Builds and launches app, runs all FAB share button Percy tests in headed mode.

.EXAMPLE
    .\run-fab-share-button-percy-tests.ps1 -SkipBuild
    
    Skips build, launches app from existing binaries.

.EXAMPLE
    .\run-fab-share-button-percy-tests.ps1 -KeepAppRunning
    
    Keeps application running after tests for manual verification.

.NOTES
    Author: GitHub Copilot
    Date: 2025-10-27
    Version: 1.0.0
    
    TRACE: [REDESIGN:share-buttons:fab] Percy orchestration script for FAB visual regression ;CLEANUP_OK
    
    Requirements:
    - Percy CLI configured (PERCY_TOKEN environment variable)
    - Playwright installed (npx playwright install)
    - .NET 8.0 SDK
    - NOOR Canvas application at SPA/NoorCanvas
    - Session PQ9N5YWW (Session 212) exists in database
    
.LINK
    Test File: PlayWright/Tests/fab-share-button-visual-regression.spec.ts
    Route: https://localhost:9091/host/control-panel/PQ9N5YWW
#>

[CmdletBinding()]
param(
    [switch]$SkipBuild,
    [switch]$KeepAppRunning,
    [switch]$HeadlessTests,
    [switch]$AllowNoPercy
)

$ErrorActionPreference = "Stop"
$VerbosePreference = "Continue"

# ============================================================================
# CONFIGURATION
# ============================================================================

$ProjectRoot = "D:\PROJECTS\NOOR CANVAS"
$AppProjectPath = Join-Path $ProjectRoot "SPA\NoorCanvas"
$AppCsprojPath = Join-Path $AppProjectPath "NoorCanvas.csproj"
$PlaywrightRoot = Join-Path $ProjectRoot "PlayWright"
$TestFile = "Tests/fab-share-button-visual-regression.spec.ts"
$AppUrl = "https://localhost:9091"
$HealthCheckUrl = "$AppUrl/health"
$ControlPanelUrl = "$AppUrl/host/control-panel/PQ9N5YWW"

# Track process IDs for cleanup
$script:AppProcessId = $null
$script:AppJobId = $null

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

function Write-Banner {
    param([string]$Message, [string]$Color = "Cyan")
    
    Write-Host ""
    Write-Host "================================================================" -ForegroundColor $Color
    Write-Host "   $Message" -ForegroundColor $Color
    Write-Host "================================================================" -ForegroundColor $Color
    Write-Host ""
}

function Write-Step {
    param([string]$Message)
    Write-Host "[STEP] $Message" -ForegroundColor Yellow
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Cyan
}

function Write-ErrorMsg {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

function Test-PercyConfiguration {
    $percyToken = $env:PERCY_TOKEN
    
    if ([string]::IsNullOrEmpty($percyToken)) {
        Write-Host ""
        Write-Host "   ⚠️  Percy is NOT configured" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "   Visual regression testing requires Percy CLI." -ForegroundColor White
        Write-Host "   Options:" -ForegroundColor White
        Write-Host "   1. Run: .\setup-percy.ps1" -ForegroundColor White
        Write-Host "   2. Set PERCY_TOKEN environment variable" -ForegroundColor White
        Write-Host "   3. Or re-run with -AllowNoPercy to skip Percy" -ForegroundColor White
        Write-Host ""
        
        if (-not $AllowNoPercy) {
            throw "Percy not configured. Use -AllowNoPercy to proceed without Percy."
        }
        
        Write-Info "Proceeding without Percy (Playwright tests only)"
        return $false
    }
    
    Write-Success "Percy is configured (token found)"
    return $true
}

function Invoke-BuildApplication {
    if ($SkipBuild) {
        Write-Info "Skipping build (using existing binaries)"
        return
    }
    
    Write-Step "Building NOOR Canvas application..."
    
    Push-Location $AppProjectPath
    try {
        $buildOutput = dotnet build --configuration Debug 2>&1
        
        if ($LASTEXITCODE -ne 0) {
            Write-ErrorMsg "Build failed with exit code $LASTEXITCODE"
            Write-Host $buildOutput
            throw "Build failed"
        }
        
        Write-Success "Build completed successfully"
    }
    finally {
        Pop-Location
    }
}

function Start-Application {
    Write-Step "Launching NOOR Canvas application..."
    
    # Kill any existing instances
    Get-Process -Name "NoorCanvas" -ErrorAction SilentlyContinue | Stop-Process -Force
    Start-Sleep -Seconds 2
    
    # Start application in background job
    $appJob = Start-Job -ScriptBlock {
        param($ProjectPath)
        Set-Location $ProjectPath
        dotnet run --no-build --configuration Debug
    } -ArgumentList $AppProjectPath
    
    $script:AppJobId = $appJob.Id
    Write-Info "Application started (Job ID: $($appJob.Id))"
    
    # Wait for app to be ready
    Write-Step "Waiting for application to be ready..."
    
    $maxAttempts = 30
    $attempt = 0
    $isReady = $false
    
    while ($attempt -lt $maxAttempts -and -not $isReady) {
        $attempt++
        Start-Sleep -Seconds 2
        
        try {
            $response = Invoke-WebRequest -Uri $HealthCheckUrl -UseBasicParsing -TimeoutSec 5 -SkipCertificateCheck
            if ($response.StatusCode -eq 200) {
                $isReady = $true
                Write-Success "Application is ready (responded to health check)"
            }
        }
        catch {
            Write-Host "." -NoNewline
        }
    }
    
    Write-Host ""
    
    if (-not $isReady) {
        throw "Application failed to start after $maxAttempts attempts"
    }
    
    # Additional wait for SignalR/JavaScript initialization
    Write-Info "Waiting additional 3 seconds for full initialization..."
    Start-Sleep -Seconds 3
}

function Invoke-PlaywrightPercyTests {
    param(
        [bool]$HasPercy,
        [bool]$Headed
    )
    
    Write-Step "Running Playwright + Percy visual regression tests..."
    
    Push-Location $PlaywrightRoot
    try {
        $headedArg = if ($Headed) { "--headed" } else { "" }
        
        if ($HasPercy) {
            Write-Info "Running with Percy visual snapshots..."
            npx percy exec -- npx playwright test $TestFile $headedArg --reporter=list
        }
        else {
            Write-Info "Running Playwright tests only (no Percy)..."
            npx playwright test $TestFile $headedArg --reporter=list
        }
        
        if ($LASTEXITCODE -ne 0) {
            Write-ErrorMsg "Tests failed with exit code $LASTEXITCODE"
            return $LASTEXITCODE
        }
        
        Write-Success "All tests passed!"
        return 0
    }
    finally {
        Pop-Location
    }
}

function Stop-Application {
    param([bool]$KeepRunning)
    
    if ($KeepRunning) {
        Write-Info "Keeping application running (as requested)"
        Write-Host ""
        Write-Host "   Application is still running at: $AppUrl" -ForegroundColor Cyan
        Write-Host "   Control Panel URL: $ControlPanelUrl" -ForegroundColor Cyan
        Write-Host "   Press Ctrl+C to stop" -ForegroundColor Yellow
        Write-Host ""
        return
    }
    
    Write-Step "Stopping application..."
    
    if ($script:AppJobId) {
        Stop-Job -Id $script:AppJobId -ErrorAction SilentlyContinue
        Remove-Job -Id $script:AppJobId -Force -ErrorAction SilentlyContinue
    }
    
    Get-Process -Name "NoorCanvas" -ErrorAction SilentlyContinue | Stop-Process -Force
    
    Write-Success "Application stopped"
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================

try {
    Write-Banner "NOOR Canvas - FAB Share Button Visual Regression Tests" "Cyan"
    
    Write-Host "   Test Route: $ControlPanelUrl" -ForegroundColor White
    Write-Host "   Session: PQ9N5YWW (Session 212)" -ForegroundColor White
    Write-Host "   Test File: $TestFile" -ForegroundColor White
    Write-Host ""
    
    # Step 1: Check Percy configuration
    Write-Step "Checking Percy configuration..."
    $hasPercy = Test-PercyConfiguration
    
    # Step 2: Build application
    Invoke-BuildApplication
    
    # Step 3: Start application
    Start-Application
    
    # Step 4: Run Playwright + Percy tests
    $headed = -not $HeadlessTests
    $testExitCode = Invoke-PlaywrightPercyTests -HasPercy $hasPercy -Headed $headed
    
    # Step 5: Display results
    Write-Banner "Test Execution Complete" "Green"
    
    if ($testExitCode -eq 0) {
        Write-Success "✅ All FAB share button visual regression tests PASSED"
        Write-Host ""
        Write-Host "   Validated:" -ForegroundColor Cyan
        Write-Host "   - FAB buttons are 40px circular" -ForegroundColor White
        Write-Host "   - Positioned at top-right of containers" -ForegroundColor White
        Write-Host "   - Subtle blue background (rgba(59, 130, 246, 0.1))" -ForegroundColor White
        Write-Host "   - Different icons (📤 assets, 📄 sections)" -ForegroundColor White
        Write-Host "   - No legacy golden/red buttons" -ForegroundColor White
        Write-Host "   - Hover states working correctly" -ForegroundColor White
        Write-Host "   - Click handlers have required attributes" -ForegroundColor White
        Write-Host "   - No JavaScript errors in browser console" -ForegroundColor White
        Write-Host ""
        
        if ($hasPercy) {
            Write-Host "   Percy snapshots captured at:" -ForegroundColor Cyan
            Write-Host "   - Desktop: 1280px" -ForegroundColor White
            Write-Host "   - Tablet: 768px" -ForegroundColor White
            Write-Host "   - Mobile: 375px" -ForegroundColor White
            Write-Host ""
        }
    }
    else {
        Write-ErrorMsg "❌ Some tests FAILED (exit code: $testExitCode)"
    }
    
    exit $testExitCode
}
catch {
    Write-ErrorMsg "Script execution failed: $($_.Exception.Message)"
    Write-Host $_.ScriptStackTrace -ForegroundColor DarkGray
    exit 1
}
finally {
    Stop-Application -KeepRunning:$KeepAppRunning
}
