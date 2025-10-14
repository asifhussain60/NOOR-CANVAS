# Run Debug Panel Automated Diagnostics
# 
# Purpose: Execute comprehensive debug panel diagnostic tests with proper app startup
# 
# Features:
# - Starts app in separate elevated PowerShell window with ASPNETCORE_ENVIRONMENT set
# - Waits for app to be ready
# - Runs Playwright diagnostic tests in HEADED mode
# - Captures comprehensive diagnostic logs
# - Automatic cleanup
# 
# Usage:
#   .\Scripts\run-debug-panel-diagnostics.ps1
#   .\Scripts\run-debug-panel-diagnostics.ps1 -KeepAppRunning
#   .\Scripts\run-debug-panel-diagnostics.ps1 -HeadlessMode
# 
# Parameters:
#   -KeepAppRunning: Don't kill app after tests (for manual verification)
#   -HeadlessMode: Run tests in headless mode (default: headed)
# 
# Created: 2025-10-14
# Key: debug-panel

param(
    [switch]$KeepAppRunning,
    [switch]$HeadlessMode
)

$ErrorActionPreference = "Stop"

Write-Host "[DEBUG-WORKITEM:debug-panel:script:TRACE] Starting debug panel diagnostic test orchestration ;CLEANUP_OK" -ForegroundColor Cyan

# Step 1: Verify workspace
$workspaceRoot = "D:\PROJECTS\NOOR CANVAS"
$appPath = "$workspaceRoot\SPA\NoorCanvas"
$testPath = "$workspaceRoot\Tests\UI"

if (!(Test-Path $appPath)) {
    Write-Error "App path not found: $appPath"
    exit 1
}

if (!(Test-Path $testPath)) {
    Write-Error "Test path not found: $testPath"
    exit 1
}

Write-Host "[DEBUG-WORKITEM:debug-panel:script:TRACE] Workspace verified ;CLEANUP_OK" -ForegroundColor Green

# Step 2: Kill any existing NoorCanvas processes
Write-Host "[DEBUG-WORKITEM:debug-panel:script:TRACE] Killing existing NoorCanvas processes ;CLEANUP_OK" -ForegroundColor Yellow
Get-Process -Name "NoorCanvas" -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

# Step 3: Start app in SEPARATE PowerShell window with ASPNETCORE_ENVIRONMENT set
Write-Host "[DEBUG-WORKITEM:debug-panel:script:TRACE] Starting app in separate window with Development environment ;CLEANUP_OK" -ForegroundColor Cyan

$startAppScript = @"
Set-Location '$appPath'
`$env:ASPNETCORE_ENVIRONMENT = 'Development'
Write-Host 'ASPNETCORE_ENVIRONMENT set to: Development' -ForegroundColor Green
Write-Host 'Starting NoorCanvas...' -ForegroundColor Cyan
dotnet run
"@

$startAppScriptPath = "$env:TEMP\start-noorcanvas-debug.ps1"
$startAppScript | Out-File -FilePath $startAppScriptPath -Encoding UTF8 -Force

# Launch in new window (requires elevation for proper environment handling)
Start-Process powershell.exe -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-File", $startAppScriptPath

Write-Host "[DEBUG-WORKITEM:debug-panel:script:TRACE] Waiting 20 seconds for app startup... ;CLEANUP_OK" -ForegroundColor Yellow
Start-Sleep -Seconds 20

# Step 4: Verify app is running
Write-Host "[DEBUG-WORKITEM:debug-panel:script:TRACE] Verifying app is accessible ;CLEANUP_OK" -ForegroundColor Cyan

# PowerShell 5.1 compatible SSL certificate bypass
add-type @"
    using System.Net;
    using System.Security.Cryptography.X509Certificates;
    public class TrustAllCertsPolicy : ICertificatePolicy {
        public bool CheckValidationResult(
            ServicePoint srvPoint, X509Certificate certificate,
            WebRequest request, int certificateProblem) {
            return true;
        }
    }
"@
[System.Net.ServicePointManager]::CertificatePolicy = New-Object TrustAllCertsPolicy
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12

try {
    $response = Invoke-WebRequest -Uri "https://localhost:9091" -Method GET -TimeoutSec 10 -UseBasicParsing
    Write-Host "[DEBUG-WORKITEM:debug-panel:script:TRACE] ✅ App is running (HTTP $($response.StatusCode)) ;CLEANUP_OK" -ForegroundColor Green
} catch {
    Write-Error "App is not accessible at https://localhost:9091. Error: $_"
    exit 1
}

# Step 5: Run Playwright diagnostic tests
Write-Host "[DEBUG-WORKITEM:debug-panel:script:TRACE] Running Playwright diagnostic tests ;CLEANUP_OK" -ForegroundColor Cyan

Set-Location $testPath

$playwrightArgs = @(
    "test",
    "debug-panel-automated-diagnostics.spec.ts",
    "--reporter=list"
)

if (!$HeadlessMode) {
    $playwrightArgs += "--headed"
    Write-Host "[DEBUG-WORKITEM:debug-panel:script:TRACE] Running in HEADED mode (visible browser) ;CLEANUP_OK" -ForegroundColor Yellow
} else {
    Write-Host "[DEBUG-WORKITEM:debug-panel:script:TRACE] Running in HEADLESS mode ;CLEANUP_OK" -ForegroundColor Yellow
}

Write-Host "[DEBUG-WORKITEM:debug-panel:script:TRACE] Executing: npx playwright $($playwrightArgs -join ' ') ;CLEANUP_OK" -ForegroundColor Cyan

npx playwright @playwrightArgs

$testExitCode = $LASTEXITCODE

# Step 6: Display test results
if ($testExitCode -eq 0) {
    Write-Host "`n[DEBUG-WORKITEM:debug-panel:script:TRACE] ✅ ALL TESTS PASSED ;CLEANUP_OK" -ForegroundColor Green
} else {
    Write-Host "`n[DEBUG-WORKITEM:debug-panel:script:TRACE] ❌ TESTS FAILED (Exit Code: $testExitCode) ;CLEANUP_OK" -ForegroundColor Red
}

# Step 7: Display diagnostic artifacts
Write-Host "`n[DEBUG-WORKITEM:debug-panel:script:TRACE] Diagnostic Artifacts: ;CLEANUP_OK" -ForegroundColor Cyan

$artifactPath = "$workspaceRoot\Workspaces\TEMP"
$diagnosticFiles = @(
    "debug-panel-hostlanding-diagnostics.json",
    "debug-panel-hostlanding-expanded.png",
    "debug-panel-userlanding-expanded.png",
    "debug-panel-sessioncanvas-expanded.png",
    "debug-panel-hostcontrolpanel-expanded.png"
)

foreach ($file in $diagnosticFiles) {
    $fullPath = Join-Path $artifactPath $file
    if (Test-Path $fullPath) {
        Write-Host "  ✅ $file" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  $file (not created)" -ForegroundColor Yellow
    }
}

# Step 8: Cleanup (optional)
if (!$KeepAppRunning) {
    Write-Host "`n[DEBUG-WORKITEM:debug-panel:script:TRACE] Killing NoorCanvas app ;CLEANUP_OK" -ForegroundColor Yellow
    Get-Process -Name "NoorCanvas" -ErrorAction SilentlyContinue | Stop-Process -Force
    Write-Host "[DEBUG-WORKITEM:debug-panel:script:TRACE] App stopped ;CLEANUP_OK" -ForegroundColor Green
} else {
    Write-Host "`n[DEBUG-WORKITEM:debug-panel:script:TRACE] App still running (KeepAppRunning flag set) ;CLEANUP_OK" -ForegroundColor Yellow
    Write-Host "  To stop manually: Get-Process -Name 'NoorCanvas' | Stop-Process -Force" -ForegroundColor Cyan
}

# Step 9: Summary
Write-Host "`n═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "Debug Panel Diagnostic Test Summary" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "Test Exit Code: $testExitCode" -ForegroundColor $(if ($testExitCode -eq 0) { "Green" } else { "Red" })
Write-Host "Diagnostic Files: $artifactPath" -ForegroundColor Cyan
Write-Host "App Status: $(if ($KeepAppRunning) { 'Running' } else { 'Stopped' })" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════════`n" -ForegroundColor Cyan

exit $testExitCode
