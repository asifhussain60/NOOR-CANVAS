# Percy Visual Regression Test - TranscriptCanvas Share Button Overflow Fix
# Executes Playwright + Percy visual regression test for hcp-canvas Iteration 3
# Tests TranscriptCanvas Share button injection overflow fix

param(
    [Parameter(Mandatory = $false)]
    [switch]$KeepAppRunning = $false
)

$ErrorActionPreference = "Stop"

# Configuration
$WorkspaceRoot = "D:\PROJECTS\NOOR CANVAS"
$AppProjectPath = "$WorkspaceRoot\SPA\NoorCanvas"
$TestPath = "$WorkspaceRoot\.github\prompts.keys\hcp-canvas\tests\transcript-share-overflow-visual.spec.ts"
$PlaywrightTestsDir = "$WorkspaceRoot\PlayWright\tests"
$TempTestName = "transcript-share-overflow-visual.temp.spec.ts"
$TempTestPath = Join-Path $PlaywrightTestsDir $TempTestName
${RelativeTempTest} = "tests/transcript-share-overflow-visual.temp.spec.ts"
$AppUrl = "https://localhost:9091"

# Colors for output
function Write-Step {
    param([string]$Message)
    Write-Host "`n[STEP] $Message" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Failure {
    param([string]$Message)
    Write-Host "[FAILURE] $Message" -ForegroundColor Red
}

function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Gray
}

# Verify test file exists
Write-Step "Verifying test file..."
if (-not (Test-Path $TestPath)) {
    Write-Failure "Test file not found: $TestPath"
    exit 1
}
Write-Success "Test file found"

# Verify Percy token
Write-Step "Checking Percy configuration..."
$UsePercy = $false
if (-not [string]::IsNullOrWhiteSpace($env:PERCY_TOKEN)) {
    $UsePercy = $true
    Write-Success "Percy token configured - will upload to dashboard"
} else {
    Write-Info "PERCY_TOKEN not set - will run Playwright without Percy upload"
}

# Start application in background
Write-Step "Starting NoorCanvas application..."
$AppJob = Start-Job -ScriptBlock {
    param($ProjectPath)
    Set-Location $ProjectPath
    dotnet run
} -ArgumentList $AppProjectPath

Write-Info "Application starting (Job ID: $($AppJob.Id))..."

# Wait for application to be ready
Write-Step "Waiting for application to be ready..."
$MaxRetries = 30
$RetryCount = 0
$AppReady = $false
$ResolvedUrl = $null

while ($RetryCount -lt $MaxRetries) {
    try {
        # Try HTTPS
        $Response = Invoke-WebRequest -Uri $AppUrl -Method Head -TimeoutSec 2 -ErrorAction SilentlyContinue
    if ($Response -and $Response.StatusCode -in 200,301,302) { $AppReady = $true; $ResolvedUrl = $AppUrl; break }
    } catch {}
    if (-not $AppReady) {
        try {
            # Fallback to HTTP 9090
            $HttpUrl = ($AppUrl -replace 'https://','http://') -replace ':9091',':9090'
            $Response2 = Invoke-WebRequest -Uri $HttpUrl -Method Head -TimeoutSec 2 -ErrorAction SilentlyContinue
            if ($Response2 -and $Response2.StatusCode -in 200,301,302) { $AppReady = $true; $ResolvedUrl = $HttpUrl; break }
        } catch {}
    }
    $RetryCount++
    Start-Sleep -Seconds 2
    Write-Host "." -NoNewline
}

Write-Host ""

if (-not $AppReady) {
    Write-Failure "Application failed to start within timeout"
    Stop-Job -Job $AppJob
    Remove-Job -Job $AppJob
    exit 1
}

if (-not $ResolvedUrl) { $ResolvedUrl = $AppUrl }
Write-Success "Application is ready at $ResolvedUrl"

try {
    # Run Percy tests
    Write-Step "Running Percy visual regression tests..."
    Write-Info "Test: transcript-share-overflow-visual.spec.ts"
    Write-Info "Viewports: Desktop, Tablet, Mobile"
    
    Set-Location "$WorkspaceRoot\PlayWright"

    # Copy test into PlayWright/tests so Playwright can discover it
    if (Test-Path $TempTestPath) { Remove-Item $TempTestPath -Force }
    Copy-Item $TestPath $TempTestPath -Force

    # Provide base URL and token env vars for the test
    $env:CANVAS_BASE_URL = $ResolvedUrl
    $env:CANVAS_USER_TOKEN = 'KJAHA99L'

    if ($UsePercy) {
        $Command = "npx percy exec -- npx playwright test `"$RelativeTempTest`" --headed"
    } else {
        $env:PERCY = 'false'
        $Command = "npx playwright test `"$RelativeTempTest`" --headed"
    }
    Write-Info "Command: $Command"
    Invoke-Expression $Command
    
    $TestExit = $LASTEXITCODE

    # Cleanup temp test
    if (Test-Path $TempTestPath) { Remove-Item $TempTestPath -Force }

    if ($TestExit -eq 0) {
        Write-Success "Percy tests passed!"
        Write-Info 'Check Percy dashboard: https://percy.io'
    }
    else {
        Write-Failure "Percy tests failed (exit code: $TestExit)"
        exit 1
    }
}
catch {
    Write-Failure "Test execution failed: $_"
    exit 1
}
finally {
    # Stop application (unless -KeepAppRunning specified)
    if (-not $KeepAppRunning) {
        Write-Step "Stopping NoorCanvas application..."
        Stop-Job -Job $AppJob
        Remove-Job -Job $AppJob
        Write-Success "Application stopped"
    }
    else {
        Write-Info "Application still running (Job ID: $($AppJob.Id))"
        Write-Info "Stop manually: Stop-Job -Id $($AppJob.Id); Remove-Job -Id $($AppJob.Id)"
    }
}

Write-Host ""
Write-Success "Test orchestration completed successfully!"
Write-Info 'Review Percy snapshots: https://percy.io'
