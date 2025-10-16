# Orchestration Script Template

## Purpose
**MANDATORY PATTERN** for all Playwright test orchestration scripts. This ensures proper application startup, environment isolation, and cleanup.

---

## Why This Pattern Is Required

### Problems with Direct Execution
❌ **Never do this:**
```powershell
# WRONG: Background process without isolation
Start-Process -FilePath "dotnet" -ArgumentList "run" -WorkingDirectory "$appPath" -PassThru

# WRONG: Start-Job (wrong isolation model)
Start-Job -ScriptBlock { cd "$appPath"; dotnet run }

# WRONG: Direct terminal execution
cd "$appPath"; dotnet run
```

**These approaches fail because:**
- Missing `ASPNETCORE_ENVIRONMENT=Development` (app runs in Production mode)
- No visible window (can't see app startup logs)
- Wrong process isolation (environment variables don't propagate)
- No health check retry logic (tests start before app is ready)
- Difficult cleanup (processes can't be reliably tracked)

### Correct Pattern: Separate PowerShell Window
✅ **Always do this:**
```powershell
# 1. Create startup script file with environment variables
$startupScript = @"
Write-Host 'Setting ASPNETCORE_ENVIRONMENT = Development' -ForegroundColor Yellow
`$env:ASPNETCORE_ENVIRONMENT = 'Development'
Write-Host 'Starting NoorCanvas application...' -ForegroundColor Cyan
Set-Location '$appPath'
dotnet run
"@

$startupScriptPath = "$env:TEMP\noorcanvas-startup.ps1"
$startupScript | Out-File -FilePath $startupScriptPath -Encoding UTF8 -Force

# 2. Launch in separate visible PowerShell window
$appProcess = Start-Process powershell.exe `
    -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-File", $startupScriptPath `
    -PassThru `
    -WindowStyle Normal
```

**This approach succeeds because:**
- ✅ Environment variables set correctly in script context
- ✅ Visible window shows startup logs (debugging aid)
- ✅ Proper process isolation
- ✅ Process ID available for cleanup
- ✅ `-NoExit` keeps window open for manual inspection (optional with `-KeepAppRunning`)

---

## Complete Template

```powershell
# {Feature} Test Orchestrator
# Purpose: Launch NoorCanvas, run Playwright tests, cleanup
# Test: {test-spec-file}.spec.ts
# Key: {key-name}

param(
    [switch]$KeepAppRunning,
    [switch]$Headed
)

$ErrorActionPreference = "Stop"

Write-Host "`n{Feature} Test Orchestrator" -ForegroundColor Cyan
Write-Host "[TRACE:{key}:orchestration] Starting test orchestration ;CLEANUP_OK" -ForegroundColor Gray

# Configuration
$workspaceRoot = "D:\PROJECTS\NOOR CANVAS"
$appPath = "$workspaceRoot\SPA\NoorCanvas"
$testPath = "$workspaceRoot\Tests\UI"  # OR "Workspaces\TEMP" for temporary tests
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

$startupScriptPath = "$env:TEMP\noorcanvas-{key}-startup.ps1"
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

$testArgs = @("playwright", "test", "{test-spec-file}.spec.ts")
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

Write-Host "`n[TRACE:{key}:orchestration] Test orchestration complete ;CLEANUP_OK" -ForegroundColor Cyan

exit $testExitCode
```

---

## Key Components Explained

### 1. Startup Script Creation
```powershell
$startupScript = @"
`$env:ASPNETCORE_ENVIRONMENT = 'Development'
Set-Location '$appPath'
dotnet run
"@
```
- **Why here-string (@"..."):** Preserves multi-line formatting, allows variable interpolation
- **Why temp file:** PowerShell needs a physical file to execute with `-File` parameter
- **Why `Set-Location`:** Ensures dotnet runs in correct directory

### 2. Separate Window Launch
```powershell
Start-Process powershell.exe `
    -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-File", $startupScriptPath `
    -PassThru `
    -WindowStyle Normal
```
- **`-NoExit`:** Keeps window open after script completes (shows errors)
- **`-ExecutionPolicy Bypass`:** Allows unsigned script execution
- **`-PassThru`:** Returns process object for PID tracking
- **`-WindowStyle Normal`:** Visible window (NOT Minimized/Hidden)

### 3. Health Check Retry
```powershell
while (-not $appReady -and $attemptCount -lt $maxHealthCheckRetries) {
    Invoke-WebRequest -Uri $appUrl -TimeoutSec 5
}
```
- **Why retry loop:** App startup takes 10-15 seconds
- **Why `Invoke-WebRequest`:** Simple HTTP health check
- **Why SSL bypass:** Development certificate not trusted

### 4. Process Cleanup
```powershell
Stop-Process -Id $appProcess.Id -Force
```
- **Why by PID:** Ensures exact process is killed
- **Why `-Force`:** Immediate termination without prompts

---

## Common Mistakes to Avoid

### ❌ Mistake 1: Using `Start-Job`
```powershell
# WRONG
Start-Job -ScriptBlock { dotnet run }
```
**Problem:** Jobs run in isolated runspace, can't set environment variables properly

### ❌ Mistake 2: Background Process
```powershell
# WRONG
Start-Process -FilePath "dotnet" -ArgumentList "run" -PassThru
```
**Problem:** No window, no environment variable control, difficult to debug

### ❌ Mistake 3: Inline PowerShell Command
```powershell
# WRONG
Start-Process powershell -ArgumentList "-Command", "cd '$appPath'; dotnet run"
```
**Problem:** Complex escaping, environment variables don't persist

### ❌ Mistake 4: No Health Check
```powershell
# WRONG
Start-Process ...
Start-Sleep -Seconds 10  # Fixed delay
npx playwright test
```
**Problem:** Race condition - tests start before app is ready

---

## Reference Implementations

**Production Examples:**
- `Scripts/run-debug-panel-e2e-visual-test.ps1` - Complete pattern with Percy integration
- `Scripts/run-hcp-annotation-percy-tests.ps1` - Multi-test orchestration
- `Scripts/run-mobile-view-tests.ps1` - Mobile viewport testing

**Key Features to Study:**
- Startup script creation
- Separate window launch
- Health check retry logic
- Process cleanup
- Error handling

---

## Enforcement

**This pattern is MANDATORY for:**
- ✅ All Playwright test orchestration scripts
- ✅ All Percy visual regression tests
- ✅ Any automated testing requiring app startup

**Violations will result in:**
- ❌ Tests failing due to missing environment configuration
- ❌ Race conditions (tests start before app ready)
- ❌ Orphaned processes (no cleanup)
- ❌ Difficult debugging (no visible logs)

**Task Agent Requirement:**
When generating orchestration scripts in Step 6.1, the agent **MUST** follow this template exactly. Deviations require explicit user approval with documented justification.
