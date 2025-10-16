# [TRACE:hcp-annotate:test-orchestration] Orchestration script for annotation toolbar injection test ;CLEANUP_OK
# Purpose: Launch NoorCanvas app in SEPARATE PowerShell window, run Playwright test, cleanup
# Test: hcp-annotation-toolbar-injection.spec.ts
# Pattern: orchestration-script-template.md

param(
    [switch]$KeepAppRunning,
    [switch]$Headed
)

$ErrorActionPreference = "Stop"

Write-Host "`nHCP Annotation Toolbar Injection Test Orchestrator" -ForegroundColor Cyan
Write-Host "[TRACE:hcp-annotate:orchestration] Starting test orchestration ;CLEANUP_OK" -ForegroundColor Gray

# Configuration
$workspaceRoot = "D:\PROJECTS\NOOR CANVAS"
$appPath = "$workspaceRoot\SPA\NoorCanvas"
$testPath = "$workspaceRoot"
$appUrl = "https://localhost:9091"
$maxHealthCheckRetries = 30
$healthCheckDelaySec = 2

# =============================================================================
# STEP 1: KILL EXISTING PROCESSES
# =============================================================================
Write-Host "`n[1/5] Checking for existing NoorCanvas processes..." -ForegroundColor Yellow

$existingProcesses = Get-Process -Name "NoorCanvas" -ErrorAction SilentlyContinue
if ($existingProcesses) {
    Write-Host "   Found $($existingProcesses.Count) process(es), terminating..." -ForegroundColor Yellow
    $existingProcesses | Stop-Process -Force
    Start-Sleep -Seconds 2
    Write-Host "   Processes terminated" -ForegroundColor Green
} else {
    Write-Host "   No existing processes" -ForegroundColor Green
}

# =============================================================================
# STEP 2: LAUNCH APP IN SEPARATE POWERSHELL WINDOW
# =============================================================================
Write-Host "`n[2/5] Launching NoorCanvas in separate PowerShell window..." -ForegroundColor Yellow

# Create startup script with environment variable
$startupScript = @"
Write-Host '' -ForegroundColor Cyan
Write-Host 'NOOR Canvas - Development Mode' -ForegroundColor Cyan
Write-Host '' -ForegroundColor Cyan
Write-Host ''
Write-Host ' Setting ASPNETCORE_ENVIRONMENT = Development' -ForegroundColor Yellow
`$env:ASPNETCORE_ENVIRONMENT = 'Development'
Write-Host " Environment variable set: `$env:ASPNETCORE_ENVIRONMENT" -ForegroundColor Green
Write-Host ''
Write-Host ' Starting NoorCanvas application...' -ForegroundColor Cyan
Write-Host ''
Set-Location '$appPath'
dotnet run
"@

$startupScriptPath = "$env:TEMP\noorcanvas-hcp-annotate-startup.ps1"
$startupScript | Out-File -FilePath $startupScriptPath -Encoding UTF8 -Force

# Launch in separate window (NOT background, VISIBLE window)
$appProcess = Start-Process powershell.exe `
    -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-File", $startupScriptPath `
    -PassThru `
    -WindowStyle Normal

Write-Host "   App launched (PID: $($appProcess.Id))" -ForegroundColor Green
Write-Host "   Startup script: $startupScriptPath" -ForegroundColor Gray

# =============================================================================
# STEP 3: HEALTH CHECK WITH RETRY LOGIC
# =============================================================================
Write-Host "`n[3/5] Waiting for app to be ready..." -ForegroundColor Yellow

# PowerShell 5.1 SSL certificate bypass
if (-not ([System.Management.Automation.PSTypeName]'TrustAllCertsPolicy').Type) {
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
}
[System.Net.ServicePointManager]::CertificatePolicy = New-Object TrustAllCertsPolicy
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12

$appReady = $false
$attemptCount = 0

while (-not $appReady -and $attemptCount -lt $maxHealthCheckRetries) {
    $attemptCount++
    Write-Host "   Health check $attemptCount/$maxHealthCheckRetries..." -ForegroundColor Gray
    
    try {
        $response = Invoke-WebRequest -Uri $appUrl -Method GET -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            $appReady = $true
            Write-Host "   App is ready! (HTTP $($response.StatusCode))" -ForegroundColor Green
        }
    } catch {
        if ($attemptCount -lt $maxHealthCheckRetries) {
            Write-Host "   Not ready, waiting $healthCheckDelaySec seconds..." -ForegroundColor Gray
            Start-Sleep -Seconds $healthCheckDelaySec
        }
    }
}

if (-not $appReady) {
    Write-Host "`n   App failed to start within timeout" -ForegroundColor Red
    Write-Host "   Check the separate PowerShell window for errors" -ForegroundColor Yellow
    
    if (-not $KeepAppRunning) {
        Write-Host "   Cleaning up process..." -ForegroundColor Yellow
        Stop-Process -Id $appProcess.Id -Force -ErrorAction SilentlyContinue
    }
    
    exit 1
}

# =============================================================================
# STEP 4: RUN PLAYWRIGHT TESTS
# =============================================================================
Write-Host "`n[4/5] Running Playwright tests..." -ForegroundColor Yellow

$testArgs = @("playwright", "test", "Workspaces/TEMP/hcp-annotation-toolbar-injection.spec.ts")
if ($Headed) {
    $testArgs += "--headed"
}
$testArgs += "--reporter=list"

Write-Host "   Command: npx $($testArgs -join ' ')" -ForegroundColor Gray

Set-Location $testPath
& npx @testArgs

$testExitCode = $LASTEXITCODE

if ($testExitCode -eq 0) {
    Write-Host "`n   Tests PASSED" -ForegroundColor Green
} else {
    Write-Host "`n   Tests FAILED (exit code: $testExitCode)" -ForegroundColor Red
}

# =============================================================================
# STEP 5: CLEANUP
# =============================================================================
Write-Host "`n[5/5] Cleanup..." -ForegroundColor Yellow

if ($KeepAppRunning) {
    Write-Host "   Keeping app running (PID: $($appProcess.Id))" -ForegroundColor Yellow
    Write-Host "   To stop manually: Stop-Process -Id $($appProcess.Id)" -ForegroundColor Cyan
} else {
    Write-Host "   Stopping app..." -ForegroundColor Yellow
    try {
        Stop-Process -Id $appProcess.Id -Force -ErrorAction SilentlyContinue
        Write-Host "   App stopped" -ForegroundColor Green
    } catch {
        Write-Host "   Warning: Could not stop process" -ForegroundColor Yellow
    }
}

# Remove temp startup script
if (Test-Path $startupScriptPath) {
    Remove-Item $startupScriptPath -Force -ErrorAction SilentlyContinue
}

Write-Host "`n[TRACE:hcp-annotate:orchestration] Test orchestration complete ;CLEANUP_OK" -ForegroundColor Cyan

exit $testExitCode
    Write-Host "To stop manually, run: Stop-Process -Id $($appProcess.Id)" -ForegroundColor Cyan
} else {
    Write-Host "`n[4/4] Stopping application..." -ForegroundColor Yellow
    try {
        Stop-Process -Id $appProcess.Id -Force -ErrorAction SilentlyContinue
        Write-Host "[TRACE:hcp-annotate:orchestration] App stopped ;CLEANUP_OK" -ForegroundColor Green
    } catch {
        Write-Host "[TRACE:hcp-annotate:orchestration] Warning: Could not stop app process ;CLEANUP_OK" -ForegroundColor Yellow
    }
}

Write-Host "`n[TRACE:hcp-annotate:orchestration] Test orchestration complete ;CLEANUP_OK" -ForegroundColor Cyan
exit $testExitCode
