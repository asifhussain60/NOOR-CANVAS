# Test Orchestration Patterns

---
purpose: Canonical PowerShell patterns for Playwright/Percy test orchestration
audience: test-generation.prompt.md, task.prompt.md agents
lastUpdated: 2025-10-29
source: Proven direct dotnet.exe launch pattern (commit 9448e8cd), hcptcanvas test resolution
---

## Overview

This document provides **battle-tested PowerShell patterns** for orchestrating Playwright tests with reliable application lifecycle management. These patterns use **direct `dotnet.exe` process launch** for fastest startup and most reliable health checks.

**CRITICAL UPDATE (2025-10-29)**: Previous nested PowerShell approach deprecated. Direct `dotnet.exe` launch is now the ONLY approved pattern.

---

## 🚨 BREAKING CHANGE: Direct dotnet.exe Launch (v3.0)

**Effective Date**: 2025-10-29  
**Commit**: 9448e8cd  
**Severity**: HIGH - All existing test scripts must be updated

### What Changed

**DEPRECATED (v2.0 - DO NOT USE):**
```powershell
# ❌ Nested PowerShell approach (SLOW, UNRELIABLE)
$app = Start-Process powershell `
    -ArgumentList "-NoExit","-Command","cd '$AppPath'; dotnet run" `
    -PassThru `
    -WindowStyle Minimized
```

**NEW MANDATORY (v3.0):**
```powershell
# ✅ Direct dotnet.exe launch (FAST, RELIABLE)
$app = Start-Process -FilePath "dotnet" `
    -ArgumentList "run", "--urls", "https://localhost:9091" `
    -WorkingDirectory "D:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas" `
    -PassThru `
    -WindowStyle Normal
```

### Why This Change

**Production Evidence (Baseline Test Results):**
- **Nested PowerShell**: App ready at attempt 5/15 but not detected → 10+ second delay
- **Direct dotnet.exe**: App ready at attempt 1-3 → 2-3 second delay ⚡

**Root Cause**: Nested shell creates process hierarchy where health checks fire before inner `dotnet run` completes initialization.

**Impact**:
- ✅ **3-5x faster** test execution
- ✅ **Reliable** health check detection
- ✅ **Accurate** PID tracking for cleanup
- ✅ **Simpler** process management (no nested shells)

### Migration Guide for Existing Scripts

**Find All Affected Files:**
```powershell
grep -r "Start-Process powershell.*dotnet run" Scripts/
```

**Replace Pattern:**
```powershell
# OLD
$app = Start-Process powershell -ArgumentList "-NoExit","-Command","cd '$AppPath'; dotnet run" -PassThru -WindowStyle Minimized

# NEW  
$app = Start-Process -FilePath "dotnet" -ArgumentList "run", "--urls", "$AppUrl" -WorkingDirectory $AppPath -PassThru -WindowStyle Normal
```

**Files Requiring Update** (as of 2025-10-29):
- `Scripts/run-*.ps1` (18+ orchestration scripts)
- All scripts using `Start-Process powershell.*dotnet run` pattern
- See grep results above for complete list

---

## The Canonical Pattern

### Complete Working Template

```powershell
# test-orchestration-template.ps1
# Purpose: [Feature] test orchestration with app lifecycle management

$ErrorActionPreference = "Stop"

# ============================================================================
# CONFIGURATION
# ============================================================================

$AppPath = "{{SOURCE_PATH}}"
$AppPort = {{APP_PORT}}
$AppUrl = "{{APP_HEALTH_CHECK_URL}}"
$MaxHealthCheckAttempts = 30
$HealthCheckIntervalSeconds = 1

Write-Host "=== [Feature] Test Orchestration ===" -ForegroundColor Cyan
Write-Host ""

# ============================================================================
# STEP 1: CLEANUP EXISTING PROCESSES
# ============================================================================

Write-Host "[CLEANUP] Killing existing {{APP_PROCESS_NAME}} processes..." -ForegroundColor Yellow

Get-Process -Name "{{APP_PROCESS_NAME}}" -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

Write-Host "  ✅ Cleanup complete" -ForegroundColor Green
Write-Host ""

# ============================================================================
# STEP 2: LAUNCH APPLICATION (DIRECT dotnet.exe - MANDATORY)
# ============================================================================

Write-Host "[APP] Launching {{APP_PROCESS_NAME}}..." -ForegroundColor Cyan

# CRITICAL: Launch dotnet.exe DIRECTLY (not via nested PowerShell)
# Proven pattern from commit 9448e8cd - eliminates health check delays
$app = Start-Process -FilePath "dotnet" `
    -ArgumentList "run", "--urls", "{{APP_URL}}" `
    -WorkingDirectory "{{SOURCE_PATH}}" `
    -PassThru `
    -WindowStyle Normal

# Set environment variables (optional, if needed)
# $env:ASPNETCORE_ENVIRONMENT = "Development"
# $env:ASPNETCORE_URLS = "{{APP_URL}}"

Write-Host "  ✅ App launched (PID: $($app.Id))" -ForegroundColor Green
Write-Host ""

# ============================================================================
# STEP 3: HEALTH CHECK (POLLING, NOT FIXED DELAY)
# ============================================================================

Write-Host "[HEALTH] Waiting for app to be ready..." -ForegroundColor Yellow

$attempt = 0
$appReady = $false

while (-not $appReady -and $attempt -lt $MaxHealthCheckAttempts) {
    try {
        $response = Invoke-WebRequest -Uri $AppUrl -SkipCertificateCheck -TimeoutSec 2 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            $appReady = $true
            Write-Host "  ✅ App ready after $attempt seconds" -ForegroundColor Green
        }
    }
    catch {
        $attempt++
        if ($attempt -lt $MaxHealthCheckAttempts) {
            Write-Host "  ⏳ Waiting... ($attempt/$MaxHealthCheckAttempts)" -ForegroundColor Gray
            Start-Sleep -Seconds $HealthCheckIntervalSeconds
        }
    }
}

if (-not $appReady) {
    Write-Host "  ❌ App failed to start within timeout" -ForegroundColor Red
    Stop-Process -Id $app.Id -Force -ErrorAction SilentlyContinue
    exit 1
}

Write-Host ""

# ============================================================================
# STEP 4: RUN TESTS
# ============================================================================

Write-Host "[TEST] Running Playwright tests..." -ForegroundColor Cyan

$testExitCode = 0

try {
    Push-Location "Tests\UI"
    
    npx playwright test [test-file].spec.ts --headed --reporter=list
    $testExitCode = $LASTEXITCODE
    
    if ($testExitCode -eq 0) {
        Write-Host "  ✅ Tests PASSED" -ForegroundColor Green
    }
    else {
        Write-Host "  ❌ Tests FAILED (exit code: $testExitCode)" -ForegroundColor Red
    }
}
catch {
    Write-Host "  ❌ Test execution error: $_" -ForegroundColor Red
    $testExitCode = 1
}
finally {
    Pop-Location
}

Write-Host ""

# ============================================================================
# STEP 5: CLEANUP (ALWAYS RUNS)
# ============================================================================

Write-Host "[CLEANUP] Stopping application..." -ForegroundColor Cyan

try {
    Stop-Process -Id $app.Id -Force -ErrorAction Stop
    Write-Host "  ✅ App stopped" -ForegroundColor Green
}
catch {
    Write-Host "  ⚠️  Failed to stop app (may have already exited)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Test orchestration complete ===" -ForegroundColor Cyan

exit $testExitCode
```

---

## Critical Design Decisions

### ✅ Use Start-Process -PassThru (NOT Start-Job)

**Why Start-Process -PassThru Wins:**

| Aspect | Start-Job | Start-Process -PassThru |
|--------|-----------|-------------------------|
| **Process Isolation** | Background thread (same session) | Separate window/process (full isolation) |
| **Output Handling** | Captured (can cause hang) | Separate console (no interference) |
| **Process ID** | Job ID (indirect, unpredictable) | Direct PID via `$app.Id` |
| **Cleanup Reliability** | Must find job by name (`Job1`, `Job2`) | Direct `Stop-Process -Id $app.Id` |
| **Debugging** | Output hidden (need `Receive-Job`) | Window can be restored/inspected |
| **Exit Code** | Via `Receive-Job` (complex) | N/A (test handles it) |
| **Complexity** | High (job management overhead) | Low (standard process management) |

**The Lesson from hcptcanvas:**
- ❌ `Start-Job` with `-Name` parameter → Job names unpredictable (`Job1`, `Job2`, etc.)
- ❌ Output redirection (`| Out-Null`) → Process hung waiting for pipe
- ❌ `Stop-Job -Name Job1` → Couldn't find correct job → Orphaned processes
- ✅ `Start-Process -PassThru` → Captured exact PID → Reliable cleanup

**Code Example:**

```powershell
# ❌ DON'T DO THIS
$app = Start-Job -ScriptBlock { 
    cd 'D:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas'
    dotnet run 
} | Out-Null  # HANGS HERE
Stop-Job -Name Job1  # UNRELIABLE

# ✅ DO THIS
$app = Start-Process powershell `
    -ArgumentList "-NoExit","-Command","cd 'D:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas'; dotnet run" `
    -PassThru `
    -WindowStyle Minimized

Stop-Process -Id $app.Id -Force  # RELIABLE
```

---

### ✅ Use Health Check Polling (NOT Fixed Delays)

**Why Polling Beats Fixed Delays:**

**Fixed Delay Problems:**
```powershell
# ❌ DON'T DO THIS
Start-Sleep -Seconds 15  # Too short? Test fails. Too long? Wastes time.
```

- **Too short**: App not ready → Test fails → False negative
- **Too long**: Wastes time on every run → Slower CI/CD
- **No feedback**: Silent waiting → User doesn't know what's happening
- **No failure detection**: If app crashes during delay → Test proceeds anyway

**Polling Solution:**
```powershell
# ✅ DO THIS
$maxAttempts = 30
$attempt = 0
$appReady = $false

while (-not $appReady -and $attempt -lt $maxAttempts) {
    try {
        $response = Invoke-WebRequest -Uri "https://localhost:9091" -SkipCertificateCheck -TimeoutSec 2
        if ($response.StatusCode -eq 200) {
            $appReady = $true
        }
    }
    catch {
        $attempt++
        Write-Host "  ⏳ Waiting... ($attempt/$maxAttempts)" -ForegroundColor Gray
        Start-Sleep -Seconds 1
    }
}

if (-not $appReady) {
    Write-Host "  ❌ App failed to start" -ForegroundColor Red
    Stop-Process -Id $app.Id -Force
    exit 1
}
```

**Benefits:**
- ✅ **Adaptive**: Starts as soon as app is ready (not after fixed delay)
- ✅ **Feedback**: User sees progress (`Waiting... 5/30`)
- ✅ **Failure detection**: Exits if app never becomes ready
- ✅ **Optimal speed**: No wasted time

---

### ✅ Use try/finally for Cleanup (ALWAYS)

**Why try/finally is Mandatory:**

**Without try/finally:**
```powershell
# ❌ DON'T DO THIS
$app = Start-Process powershell -ArgumentList "..." -PassThru
npx playwright test test.spec.ts  # If this fails...
Stop-Process -Id $app.Id -Force   # ...this NEVER runs → Orphaned process
```

**With try/finally:**
```powershell
# ✅ DO THIS
$app = Start-Process powershell -ArgumentList "..." -PassThru

try {
    npx playwright test test.spec.ts  # Even if this fails...
}
finally {
    Stop-Process -Id $app.Id -Force -ErrorAction SilentlyContinue  # ...this ALWAYS runs
}
```

**Scenarios Handled:**
- ✅ Test fails → App still cleaned up
- ✅ Test throws exception → App still cleaned up
- ✅ User presses Ctrl+C → App still cleaned up (PowerShell guarantee)
- ✅ App crashes during test → No error trying to stop non-existent process (`-ErrorAction SilentlyContinue`)

---

### ✅ Use -WindowStyle Minimized (NOT Hidden)

**Why Minimized Beats Hidden:**

```powershell
# ❌ DON'T DO THIS
Start-Process powershell -ArgumentList "..." -WindowStyle Hidden
# Problem: Can't debug if something goes wrong

# ✅ DO THIS
Start-Process powershell -ArgumentList "..." -WindowStyle Minimized
# Benefit: Can restore window to see output if needed
```

**Rationale:**
- **Minimized**: Window exists but not intrusive → Can restore for debugging
- **Hidden**: Window invisible → No way to see output or diagnose issues
- **Normal**: Window visible → Clutters desktop during test runs

**Debugging Workflow:**
1. Test fails unexpectedly
2. Find minimized PowerShell window in taskbar
3. Restore window → See full `dotnet run` output
4. Identify issue (missing config, port conflict, etc.)

---

## Anti-Patterns (DON'T DO THIS)

### ❌ Nested PowerShell Launch (DEPRECATED as of 2025-10-29)

```powershell
# ❌ DEPRECATED - DO NOT USE
$app = Start-Process powershell `
    -ArgumentList "-NoExit","-Command","cd '$AppPath'; dotnet run" `
    -PassThru `
    -WindowStyle Minimized
```

**Problem**: Creates nested process hierarchy (powershell → powershell → dotnet) causing health check delays.

**Evidence**: Production testing showed app ready at attempt 5/15 (10+ seconds) but should be 1-3 attempts (2-3 seconds).

**Solution**: Use direct `dotnet.exe` launch (see v3.0 pattern above).

**Migration Required**: All existing scripts using this pattern must be updated.

---

### ❌ Background Operator `&` in PowerShell 5.1

```powershell
# ❌ UNRELIABLE
dotnet run &  # Background operator doesn't work consistently in PowerShell 5.1
```

**Problem**: PowerShell 5.1 (Windows default) doesn't reliably support `&` for background jobs. Works sometimes, fails randomly.

**Solution**: Use `Start-Process -PassThru` instead.

---

### ❌ Direct npx playwright test (No Orchestration)

```powershell
# ❌ DON'T DO THIS
npx playwright test test.spec.ts
```

**Problems:**
- No app launched → Test fails (connection refused)
- Assumes app is already running → Fragile (who started it? is it right version?)
- No cleanup → Orphaned processes after test

**Solution**: Always use orchestration script with full lifecycle management.

---

### ❌ Manual App Startup Before Tests

```powershell
# ❌ DON'T DO THIS
dotnet run  # Manually in separate terminal
# Then in another terminal:
npx playwright test test.spec.ts
```

**Problems:**
- **Manual step**: Humans forget → Test fails mysteriously
- **Wrong environment**: Might not have `ASPNETCORE_ENVIRONMENT=Development` set
- **Port conflicts**: Previous instance still running → New instance fails to start
- **No automation**: Can't run in CI/CD

**Solution**: Orchestration script handles everything automatically.

---

### ❌ Forgetting -Force on Stop-Process

```powershell
# ❌ UNRELIABLE
Stop-Process -Id $app.Id  # App might not stop (graceful shutdown can hang)
```

**Problem**: Graceful shutdown can hang if app is unresponsive → Process remains alive.

**Solution**: Always use `-Force` to guarantee termination:

```powershell
# ✅ RELIABLE
Stop-Process -Id $app.Id -Force
```

---

### ❌ Using Fixed Sleep for Startup

```powershell
# ❌ DON'T DO THIS
Start-Process powershell -ArgumentList "..." -PassThru
Start-Sleep -Seconds 8  # Why 8? Why not 7 or 9? Arbitrary and fragile.
npx playwright test test.spec.ts
```

**See "Use Health Check Polling" section above for why this fails.**

---

## Advanced Patterns

### Port Polling Alternative (More Robust)

Instead of HTTP health check, poll the port directly:

```powershell
# Alternative: Poll port instead of HTTP endpoint
$maxAttempts = 30
$attempt = 0
$portReady = $false

while (-not $portReady -and $attempt -lt $maxAttempts) {
    $connection = Test-NetConnection -ComputerName localhost -Port 9091 -InformationLevel Quiet -WarningAction SilentlyContinue
    
    if ($connection) {
        $portReady = $true
        Write-Host "  ✅ Port 9091 is listening" -ForegroundColor Green
    }
    else {
        $attempt++
        Start-Sleep -Seconds 1
    }
}
```

**When to Use:**
- App has no root URL health endpoint
- App returns 404 or redirect on root URL (not 200 OK)
- Simpler check (just port listening, not full HTTP request)

**Tradeoff:**
- ✅ Simpler (no SSL certificate issues)
- ❌ Less precise (port listening doesn't guarantee app is fully ready)

---

### Percy Integration

```powershell
# Percy visual regression test orchestration
$env:PERCY_TOKEN = "your-percy-token-here"

try {
    npx percy exec -- playwright test test.spec.ts
    $testExitCode = $LASTEXITCODE
}
finally {
    Stop-Process -Id $app.Id -Force -ErrorAction SilentlyContinue
}
```

**Key Points:**
- Set `$env:PERCY_TOKEN` before running tests
- Use `percy exec --` wrapper around `playwright test`
- Percy automatically captures snapshots when `percySnapshot()` is called in tests

---

### Keep App Running for Manual Verification

```powershell
# Add -KeepAppRunning parameter for debugging
param(
    [switch]$KeepAppRunning
)

# ... run tests ...

if ($KeepAppRunning) {
    Write-Host "[CLEANUP] Keeping app running for manual verification" -ForegroundColor Yellow
    Write-Host "  App URL: https://localhost:9091" -ForegroundColor Cyan
    Write-Host "  PID: $($app.Id)" -ForegroundColor Cyan
    Write-Host "  To stop: Stop-Process -Id $($app.Id)" -ForegroundColor Gray
}
else {
    Stop-Process -Id $app.Id -Force -ErrorAction SilentlyContinue
}
```

**Use Case:**
- Test fails unexpectedly
- Want to inspect app state after test
- Need to manually reproduce test scenario

**Usage:**
```powershell
.\run-feature-test.ps1 -KeepAppRunning
```

---

## Troubleshooting Guide

### Problem: App Never Becomes Ready

**Symptom:**
```
⏳ Waiting... (30/30)
❌ App failed to start within timeout
```

**Diagnosis Steps:**
1. Restore minimized PowerShell window → Check for errors
2. Check port conflicts: `netstat -ano | findstr :9091`
3. Verify environment variables are set correctly
4. Check project path is correct

**Common Causes:**
- Port already in use (previous run didn't clean up)
- Missing appsettings.json or configuration file
- Database connection failure (app won't start)
- SSL certificate issues

---

### Problem: Tests Fail But App Stays Running

**Symptom:**
```
❌ Tests FAILED
[Next test run]: Port 9091 already in use
```

**Diagnosis:**
- `try/finally` block missing or incorrect
- Exception thrown before cleanup code

**Solution:**
```powershell
# ✅ Wrap ALL test execution in try/finally
try {
    npx playwright test test.spec.ts
}
finally {
    Stop-Process -Id $app.Id -Force -ErrorAction SilentlyContinue
}
```

---

### Problem: Can't Stop Process (Access Denied)

**Symptom:**
```powershell
Stop-Process: Access is denied
```

**Cause:** Process started with elevated privileges (Run as Administrator)

**Solution:**
```powershell
# Option 1: Run orchestration script as Administrator
# Option 2: Don't use -Verb RunAs when starting app
Start-Process powershell -ArgumentList "..." -PassThru  # No -Verb RunAs
```

---

## Template Variables Reference

These variables should be populated by `total-recall.prompt.md` and defined in `port-instructions.prompt.md`:

```
{{SOURCE_PATH}}              # Example: D:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas
{{APP_LAUNCH_COMMAND}}       # Example: dotnet run --no-build
{{APP_PORT}}                 # Example: 9091
{{APP_HEALTH_CHECK_URL}}     # Example: https://localhost:9091
{{APP_PROCESS_NAME}}         # Example: NoorCanvas, node, python
{{APP_STARTUP_TIME_SECONDS}} # Example: 8 (average measured by total-recall)
```

---

## Summary: The Golden Rules

1. **ALWAYS** use `Start-Process -PassThru -WindowStyle Minimized`
2. **ALWAYS** use health check polling (NEVER fixed delays)
3. **ALWAYS** wrap test execution in `try/finally` for cleanup
4. **ALWAYS** use `-Force` with `Stop-Process`
5. **NEVER** use `Start-Job` for app lifecycle
6. **NEVER** use background operator `&` in PowerShell 5.1
7. **NEVER** use `-WindowStyle Hidden` (use `Minimized` for debugging)
8. **NEVER** forget to kill existing processes before starting new one

---

**Last Updated**: 2025-10-18  
**Source**: Lessons learned from hcptcanvas Playwright test resolution  
**See Also**: `.github/key-data-streams/hcp-tcanvas/PLAYWRIGHT-TEST-RESOLUTION.md`
