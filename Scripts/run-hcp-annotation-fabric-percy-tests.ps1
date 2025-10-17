# HCP Annotation Fabric.js System - Percy Test Orchestration Script
# Purpose: Run comprehensive Fabric.js annotation system tests with Percy visual snapshots
# Session: 212 (Host Token: PQ9N5YWW, User Token: KJAHA99L)
# Key: hcp-annotate

param(
    [switch]$KeepAppRunning,
    [switch]$Headed
)

$ErrorActionPreference = "Stop"

Write-Host "`nHCP Annotation Fabric.js Test Orchestrator" -ForegroundColor Cyan
Write-Host "[TRACE:hcp-annotate:orchestration] Starting test orchestration ;CLEANUP_OK" -ForegroundColor Gray

# Configuration
$workspaceRoot = "D:\PROJECTS\NOOR CANVAS"
$appPath = "$workspaceRoot\SPA\NoorCanvas"
$testPath = "$workspaceRoot\Tests\UI"
$appUrl = "https://localhost:9091"
$maxHealthCheckRetries = 30
$healthCheckDelaySec = 2

# Test files
$testFiles = @(
    "hcp-annotation-fabric-system.spec.ts"
)

Write-Host "`n[*] Test Configuration:" -ForegroundColor Yellow
Write-Host "   - Session ID: 212" -ForegroundColor Gray
Write-Host "   - Host Token: PQ9N5YWW" -ForegroundColor Gray
Write-Host "   - User Token: KJAHA99L" -ForegroundColor Gray
Write-Host "   - Test Files: $($testFiles.Count)" -ForegroundColor Gray
Write-Host "   - Test Count: 15 visual regression tests" -ForegroundColor Gray

# Verify Percy token
if (-not $env:PERCY_TOKEN) {
    Write-Host "`n[!] WARNING: PERCY_TOKEN not set. Percy snapshots will be skipped." -ForegroundColor Yellow
    Write-Host "   To enable Percy, set PERCY_TOKEN environment variable." -ForegroundColor Gray
}

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
Write-Host '====================================================' -ForegroundColor Cyan
Write-Host '  NOOR Canvas - Development Mode' -ForegroundColor Cyan
Write-Host '====================================================' -ForegroundColor Cyan
Write-Host ''
Write-Host '[*] Setting ASPNETCORE_ENVIRONMENT = Development' -ForegroundColor Yellow
`$env:ASPNETCORE_ENVIRONMENT = 'Development'
Write-Host "[+] Environment variable set: `$env:ASPNETCORE_ENVIRONMENT" -ForegroundColor Green
Write-Host ''
Write-Host '[*] Starting NoorCanvas application...' -ForegroundColor Cyan
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
    Write-Host "`n   [X] App failed to start within timeout" -ForegroundColor Red
    Write-Host "   [!] Check the separate PowerShell window for errors" -ForegroundColor Yellow
    
    if (-not $KeepAppRunning) {
        Write-Host "   Cleaning up process..." -ForegroundColor Yellow
        Stop-Process -Id $appProcess.Id -Force -ErrorAction SilentlyContinue
    }
    
    exit 1
}

# =============================================================================
# STEP 4: VALIDATE TEST SYNTAX (LINT CHECK)
# =============================================================================
Write-Host "`n[4/6] Validating test syntax..." -ForegroundColor Yellow

foreach ($testFile in $testFiles) {
    $testFilePath = Join-Path $testPath $testFile
    
    Write-Host "   [>] Validating: $testFile" -ForegroundColor Gray
    
    # Run lint validation script
    & "$workspaceRoot\Scripts\validate-test-syntax.ps1" -TestFile $testFilePath
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "`n   [X] STOPPING: Test file has syntax errors" -ForegroundColor Red
        Write-Host "   Fix syntax errors in $testFile before running tests" -ForegroundColor Yellow
        
        if (-not $KeepAppRunning) {
            Write-Host "   Stopping app..." -ForegroundColor Yellow
            Stop-Process -Id $appProcess.Id -Force -ErrorAction SilentlyContinue
        }
        
        # Remove temp startup script
        if (Test-Path $startupScriptPath) {
            Remove-Item $startupScriptPath -Force -ErrorAction SilentlyContinue
        }
        
        exit 1
    }
    
    Write-Host "   [+] $testFile syntax validated" -ForegroundColor Green
}

# =============================================================================
# STEP 5: RUN PLAYWRIGHT TESTS
# =============================================================================
Write-Host "`n[5/6] Running Playwright tests..." -ForegroundColor Yellow

# Set BASE_URL environment variable for Playwright
$env:BASE_URL = $appUrl
Write-Host "   BASE_URL set to: $env:BASE_URL" -ForegroundColor Gray

Set-Location $testPath

$testResults = @()
$failedTests = @()

foreach ($testFile in $testFiles) {
    Write-Host "`n   [>] Running: $testFile" -ForegroundColor Cyan
    
    $testFilePath = Join-Path $testPath $testFile
    
    if (-not (Test-Path $testFilePath)) {
        Write-Host "   [!] Test file not found: $testFilePath" -ForegroundColor Yellow
        $failedTests += $testFile
        
        # STOP ON FAILURE: Test file not found
        Write-Host "`n   [X] STOPPING: Test file not found" -ForegroundColor Red
        Write-Host "   Fix the test file path and try again" -ForegroundColor Yellow
        
        if (-not $KeepAppRunning) {
            Stop-Process -Id $appProcess.Id -Force -ErrorAction SilentlyContinue
        }
        
        exit 1
    }
    
    $testArgs = @("playwright", "test", $testFile)
    if ($Headed) {
        $testArgs += "--headed"
    }
    $testArgs += "--reporter=list"
    
    Write-Host "   Command: npx $($testArgs -join ' ')" -ForegroundColor Gray
    Write-Host "   BASE_URL: $env:BASE_URL" -ForegroundColor Gray
    
    & npx @testArgs
    
    $testExitCode = $LASTEXITCODE
    
    if ($testExitCode -eq 0) {
        Write-Host "   [+] $testFile - PASSED" -ForegroundColor Green
        $testResults += @{
            File = $testFile
            Status = "PASSED"
        }
    }
    else {
        Write-Host "   [X] $testFile - FAILED (Exit Code: $testExitCode)" -ForegroundColor Red
        $failedTests += $testFile
        $testResults += @{
            File = $testFile
            Status = "FAILED"
            ExitCode = $testExitCode
        }
        
        # STOP ON FAILURE: Test execution failed
        Write-Host "`n   [X] STOPPING: Test failed" -ForegroundColor Red
        Write-Host "   Fix the failing test before running subsequent tests" -ForegroundColor Yellow
        Write-Host "   Check browser console logs and trace output above" -ForegroundColor Yellow
        
        if (-not $KeepAppRunning) {
            Write-Host "`n   Stopping app..." -ForegroundColor Yellow
            Stop-Process -Id $appProcess.Id -Force -ErrorAction SilentlyContinue
        } else {
            Write-Host "`n   App still running (PID: $($appProcess.Id))" -ForegroundColor Yellow
            Write-Host "   To stop: Stop-Process -Id $($appProcess.Id)" -ForegroundColor Cyan
        }
        
        # Remove temp startup script
        if (Test-Path $startupScriptPath) {
            Remove-Item $startupScriptPath -Force -ErrorAction SilentlyContinue
        }
        
        exit 1
    }
}

# =============================================================================
# STEP 6: CLEANUP
# =============================================================================
Write-Host "`n[6/6] Cleanup..." -ForegroundColor Yellow

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

# =============================================================================
# SUMMARY
# =============================================================================
Write-Host "`n====================================================" -ForegroundColor Cyan
Write-Host "  TEST SUMMARY" -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "Total Tests: $($testFiles.Count)" -ForegroundColor White
Write-Host "Passed: $(($testResults | Where-Object { $_.Status -eq 'PASSED' }).Count)" -ForegroundColor Green
Write-Host "Failed: $($failedTests.Count)" -ForegroundColor Red
Write-Host ""

if ($failedTests.Count -gt 0) {
    Write-Host "[X] FAILED TESTS:" -ForegroundColor Red
    foreach ($test in $failedTests) {
        Write-Host "   - $test" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "[!] Tips:" -ForegroundColor Yellow
    Write-Host "   - Run with -Headed to see browser interactions" -ForegroundColor Gray
    Write-Host "   - Check the separate PowerShell window for app logs" -ForegroundColor Gray
    Write-Host "   - Verify session 212 exists and is accessible" -ForegroundColor Gray
    Write-Host "   - Ensure annotation panel JavaScript is loaded correctly" -ForegroundColor Gray
    
    Write-Host "`n[TRACE:hcp-annotate:orchestration] Test orchestration complete with failures ;CLEANUP_OK" -ForegroundColor Red
    exit 1
}
else {
    Write-Host "[+] ALL TESTS PASSED!" -ForegroundColor Green
    Write-Host ""
    Write-Host "[*] Test Coverage:" -ForegroundColor Cyan
    Write-Host "   [+] Initial state verification" -ForegroundColor Gray
    Write-Host "   [+] Panel appearance after asset share" -ForegroundColor Gray
    Write-Host "   [+] Tool layout and visibility" -ForegroundColor Gray
    Write-Host "   [+] Tool selection (laser, draw, highlight, text)" -ForegroundColor Gray
    Write-Host "   [+] Color picker interaction" -ForegroundColor Gray
    Write-Host "   [+] Panel close functionality" -ForegroundColor Gray
    Write-Host "   [+] Multiple tool switches" -ForegroundColor Gray
    Write-Host "   [+] SessionCanvas integration" -ForegroundColor Gray
    Write-Host "   [+] JavaScript loading verification" -ForegroundColor Gray
    Write-Host "   [+] SignalR connection status" -ForegroundColor Gray
    Write-Host "   [+] Panel animation and positioning" -ForegroundColor Gray
    
    Write-Host "`n[TRACE:hcp-annotate:orchestration] Test orchestration complete successfully ;CLEANUP_OK" -ForegroundColor Cyan
    exit 0
}
