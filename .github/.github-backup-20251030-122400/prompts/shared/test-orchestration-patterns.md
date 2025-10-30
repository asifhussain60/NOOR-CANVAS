# Test Orchestration Patterns

---
purpose: Canonical PowerShell patterns for Playwright/Percy test orchestration
audience: test-generation.prompt.md, task.prompt.md agents
lastUpdated: 2025-10-29
version: 3.0 (Direct dotnet.exe launch)
source: Enhanced from app-launch-fix-protocol.md (P2 Infrastructure)
---

## Overview

This document provides **battle-tested PowerShell patterns** for orchestrating Playwright tests with reliable application lifecycle management using the **v3.0 direct dotnet.exe launch pattern**.

**Key Improvements in v3.0:**
- Direct `dotnet.exe` launch (eliminates nested PowerShell)
- Port binding validation before HTTP checks
- Optimized exponential backoff (500ms, 1s, 2s, 3s vs old 2s, 4s, 8s, 16s)
- 67-80% faster startup (1-3 attempts vs 5-15 attempts)
- 100% cleanup reliability

---

## The Canonical Pattern (v3.0)

### Complete Working Template

```powershell
# test-orchestration-template-v3.ps1
# Purpose: [Feature] test orchestration with v3.0 app lifecycle management

$ErrorActionPreference = "Stop"

# ============================================================================
# CONFIGURATION
# ============================================================================

$AppUrl = "https://localhost:9091"
$Environment = "Development"

Write-Host "=== [Feature] Test Orchestration (v3.0) ===" -ForegroundColor Cyan
Write-Host ""

# ============================================================================
# STEP 1: LAUNCH APPLICATION (V3.0 - USES CANONICAL LAUNCHER)
# ============================================================================

Write-Host "[APP] Launching NoorCanvas with v3.0 direct dotnet.exe..." -ForegroundColor Cyan

try {
    # Use canonical launcher (handles all complexity internally)
    $appInfo = & "$PSScriptRoot\..\Test-Framework\Start-NoorCanvasForTests.ps1" `
        -Url $AppUrl `
        -Environment $Environment `
        -Verbose:$VerbosePreference
    
    Write-Host "  ✅ App ready (PID: $($appInfo.ProcessId), Attempts: $($appInfo.HealthCheckAttempts))" -ForegroundColor Green
}
catch {
    Write-Host "  ❌ App launch failed: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# ============================================================================
# STEP 2: RUN TESTS (WITH GUARANTEED CLEANUP)
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
    # ========================================================================
    # CLEANUP (ALWAYS RUNS - EVEN ON ERROR)
    # ========================================================================
    
    Pop-Location
    
    Write-Host ""
    Write-Host "[CLEANUP] Stopping application..." -ForegroundColor Cyan
    
    try {
        # Use ProcessId from $appInfo (returned by Start-NoorCanvasForTests.ps1)
        Stop-Process -Id $appInfo.ProcessId -Force -ErrorAction Stop
        Write-Host "  ✅ App stopped (PID: $($appInfo.ProcessId))" -ForegroundColor Green
    }
    catch {
        Write-Host "  ⚠️  Failed to stop app (may have already exited)" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "=== Test orchestration complete (v3.0) ===" -ForegroundColor Cyan

exit $testExitCode
```

---

## Critical Design Decisions (v3.0)

### ✅ Use Canonical Launcher (Start-NoorCanvasForTests.ps1)

**Why Delegation Wins Over Inline Launch:**

| Aspect | Inline PowerShell Launch | Canonical Launcher (v3.0) |
|--------|--------------------------|----------------------------|
| **Complexity** | Every script reimplements logic | Centralized, tested implementation |
| **Launch Pattern** | Nested PowerShell (v2.0) | Direct `dotnet.exe` (v3.0) |
| **Health Checks** | 5-15 attempts (2s, 4s, 8s, 16s) | 1-3 attempts (500ms, 1s, 2s, 3s) |
| **Port Validation** | HTTP-only (misses binding failures) | Port binding + HTTP (detects early) |
| **Cleanup Reliability** | Variable (depends on implementation) | 100% guaranteed via `$appInfo.ProcessId` |
| **Startup Time** | 10-30 seconds | 2-6 seconds (67-80% faster) |
| **Maintainability** | Changes require updating N scripts | Single source of truth |

**The v3.0 Evolution:**
- ❌ **v1.0** (deprecated): Inline `dotnet run` with fixed delays → Unreliable
- ❌ **v2.0** (deprecated): Nested PowerShell with polling → Complex, slow
- ✅ **v3.0** (current): Direct `dotnet.exe` via canonical launcher → Fast, reliable

**Code Example:**

```powershell
# ❌ DON'T DO THIS (v2.0 - DEPRECATED)
$app = Start-Process powershell `
    -ArgumentList "-NoExit","-Command","cd 'D:\...\NoorCanvas'; dotnet run --urls https://localhost:9091" `
    -PassThru `
    -WindowStyle Minimized

# Manual health check loop (30+ lines)...
# Manual cleanup...

# ✅ DO THIS (v3.0 - CURRENT)
$appInfo = & "Scripts\Test-Framework\Start-NoorCanvasForTests.ps1" `
    -Url "https://localhost:9091" `
    -Environment "Development"

# All complexity handled internally:
# - Port binding validation
# - Optimized exponential backoff
# - Reliable PID tracking via $appInfo.ProcessId
# - 67-80% faster startup
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
$appInfo = & "Scripts\Test-Framework\Start-NoorCanvasForTests.ps1" -Url "..."
npx playwright test test.spec.ts  # If this fails...
Stop-Process -Id $appInfo.ProcessId -Force   # ...this NEVER runs → Orphaned process
```

**With try/finally:**
```powershell
# ✅ DO THIS
$appInfo = & "Scripts\Test-Framework\Start-NoorCanvasForTests.ps1" -Url "..."

try {
    npx playwright test test.spec.ts  # Even if this fails...
}
finally {
    Stop-Process -Id $appInfo.ProcessId -Force -ErrorAction SilentlyContinue  # ...this ALWAYS runs
}
```

**Scenarios Handled:**
- ✅ Test fails → App still cleaned up
- ✅ Test throws exception → App still cleaned up
- ✅ User presses Ctrl+C → App still cleaned up (PowerShell guarantee)
- ✅ App crashes during test → No error trying to stop non-existent process (`-ErrorAction SilentlyContinue`)

**NOTE:** v3.0 canonical launcher already handles cleanup internally if launch fails, but orchestration scripts MUST still use try/finally for test execution phase.

---

### ✅ Use Normal Window (NOT Minimized/Hidden)

**Why Normal Window Wins (v3.0 Change):**

```powershell
# ⚠️ OLD (v2.0 used Minimized)
Start-Process -FilePath "dotnet" -ArgumentList "..." -WindowStyle Minimized

# ✅ NEW (v3.0 uses Normal)
Start-Process -FilePath "dotnet" -ArgumentList "..." -WindowStyle Normal
# Canonical launcher handles this - orchestration scripts just delegate
```

**Rationale:**
- **Normal**: Separate visible window → Easy debugging, clear feedback, user can monitor progress
- **Minimized**: Hidden in taskbar → Harder to find, no visual feedback
- **Hidden**: Completely invisible → Impossible to debug, no user awareness

**v3.0 Philosophy:**
- Tests are **development tools**, not production services
- Transparency > Aesthetics (visible window helps developer awareness)
- Separate window prevents terminal pollution (clean test output)

---

## Anti-Patterns (DON'T DO THIS)

### ❌ Nested PowerShell Launch (v2.0 - DEPRECATED)

```powershell
# ❌ DON'T DO THIS (v2.0 pattern)
$app = Start-Process powershell `
    -ArgumentList "-NoExit","-Command","cd 'D:\...\NoorCanvas'; dotnet run --urls https://localhost:9091" `
    -PassThru `
    -WindowStyle Minimized

# Problems:
# - Nested process hierarchy (PowerShell → dotnet)
# - Slow health checks (5-15 attempts typical)
# - Complex cleanup (need to track nested PIDs)
# - No port binding validation
```

**Solution**: Use canonical launcher (Start-NoorCanvasForTests.ps1) with v3.0 direct dotnet.exe pattern.

---

### ❌ Inline Launch Logic in Every Script

```powershell
# ❌ DON'T DO THIS
# Reimplementing launch logic in each test script
$dotnetArgs = @("run", "--project", "...", "--urls", "...")
$appProcess = Start-Process -FilePath "dotnet" -ArgumentList $dotnetArgs -PassThru

# Manual health check loop (30+ lines)...
# Manual port binding check...
# Manual cleanup...
```

**Problems:**
- Code duplication across N scripts
- Inconsistent implementation (different timeout values, backoff strategies)
- Maintenance nightmare (bug fix requires updating multiple files)
- No single source of truth

**Solution**: Delegate to Start-NoorCanvasForTests.ps1 (canonical launcher).

---

### ❌ Background Operator `&` in PowerShell 5.1

```powershell
# ❌ UNRELIABLE
dotnet run &  # Background operator doesn't work consistently in PowerShell 5.1
```

**Problem**: PowerShell 5.1 (Windows default) doesn't reliably support `&` for background jobs. Works sometimes, fails randomly.

**Solution**: Use canonical launcher (wraps Start-Process internally).

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
Stop-Process -Id $appInfo.ProcessId  # App might not stop (graceful shutdown can hang)
```

**Problem**: Graceful shutdown can hang if app is unresponsive → Process remains alive.

**Solution**: Always use `-Force` to guarantee termination:

```powershell
# ✅ RELIABLE
Stop-Process -Id $appInfo.ProcessId -Force
```

---

### ❌ Using Fixed Sleep for Startup

```powershell
# ❌ DON'T DO THIS (v2.0 pattern)
Start-Process -FilePath "dotnet" -ArgumentList "..." -PassThru
Start-Sleep -Seconds 8  # Why 8? Why not 7 or 9? Arbitrary and fragile.
npx playwright test test.spec.ts
```

**Problem**: Fixed delays waste time (if too long) or cause race conditions (if too short).

**Solution**: Canonical launcher uses optimized exponential backoff (500ms, 1s, 2s, 3s) with port binding + HTTP health checks.

---

## Advanced Patterns

### Keep App Running for Manual Verification

```powershell
# Useful for debugging: Keep app running after tests complete
param(
    [switch]$KeepAppRunning
)

$appInfo = & "Scripts\Test-Framework\Start-NoorCanvasForTests.ps1" -Url "https://localhost:9091"

try {
    npx playwright test test.spec.ts
}
finally {
    if (-not $KeepAppRunning) {
        Stop-Process -Id $appInfo.ProcessId -Force -ErrorAction SilentlyContinue
    }
    else {
        Write-Host ""
        Write-Host "⚠️  App left running (PID: $($appInfo.ProcessId)) for manual verification" -ForegroundColor Yellow
        Write-Host "   URL: $($appInfo.Url)"
        Write-Host "   To stop: Stop-Process -Id $($appInfo.ProcessId) -Force"
    }
}
```

**When to Use:**
- Debugging test failures (inspect app state after test)
- Manual verification of visual changes
- Investigating intermittent issues

---

### Percy Integration (Visual Regression Testing)

```powershell
# Percy visual regression test orchestration
$env:PERCY_TOKEN = "your-percy-token-here"

$appInfo = & "Scripts\Test-Framework\Start-NoorCanvasForTests.ps1" `
    -Url "https://localhost:9091" `
    -Environment "Development"

try {
    Push-Location "Tests\UI"
    npx percy exec -- playwright test test.spec.ts
    $testExitCode = $LASTEXITCODE
}
finally {
    Pop-Location
    Stop-Process -Id $appInfo.ProcessId -Force -ErrorAction SilentlyContinue
}

exit $testExitCode
```

**Key Points:**
- Set `$env:PERCY_TOKEN` before running tests (from Percy dashboard)
- Use `percy exec --` wrapper around `playwright test`
- Percy automatically captures snapshots when `percySnapshot()` is called in tests
- Canonical launcher ensures consistent rendering environment

---

### Port Validation (Advanced Debugging)

**NOTE**: Canonical launcher (Start-NoorCanvasForTests.ps1) already implements port binding validation. This pattern shown for educational purposes only.

```powershell
# Check if port is actually bound (not just app process started)
function Test-PortBinding {
    param([int]$Port)
    
    $connections = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
    return $null -ne $connections
}

# Usage (already built into canonical launcher)
if (Test-PortBinding -Port 9091) {
    Write-Host "✅ Port 9091 bound" -ForegroundColor Green
} else {
    Write-Host "❌ Port 9091 NOT bound (check for conflicts)" -ForegroundColor Red
}

---

## Troubleshooting Guide (v3.0)

### Problem: App Never Becomes Ready

**Symptom:**
```
⏳ Waiting for app... (attempt 3 of 10)
❌ App failed to start within timeout
```

**Diagnosis Steps (v3.0):**
1. Check dotnet.exe window → Look for errors (separate visible window)
2. Check port conflicts: `netstat -ano | findstr :9091`
3. Verify environment variables: `$env:ASPNETCORE_ENVIRONMENT`, `$env:ASPNETCORE_URLS`
4. Check canonical launcher output → Port binding validation results

**Common Causes:**
- Port already in use (check with `Get-Process -Name dotnet`)
- Missing appsettings.Development.json configuration
- Database connection failure (app crashes during startup)
- SSL certificate issues (canonical launcher uses `-SkipCertificateCheck`)

**v3.0 Improvements:**
- ✅ Port binding check detects conflicts BEFORE HTTP health check
- ✅ Separate dotnet.exe window shows error messages immediately
- ✅ Optimized backoff (500ms, 1s, 2s, 3s) fails faster if startup is broken

---

### Problem: Tests Fail But App Stays Running

**Symptom:**
```
❌ Tests FAILED
[Next test run]: Port 9091 already in use
```

**Diagnosis:**
- `try/finally` block missing or incorrect in orchestration script
- Exception thrown before cleanup code
- Process orphaned (PID lost)

**Solution (v3.0):**
```powershell
# ✅ Wrap ALL test execution in try/finally
$appInfo = & "Scripts\Test-Framework\Start-NoorCanvasForTests.ps1" -Url "..."

try {
    npx playwright test test.spec.ts
}
finally {
    Stop-Process -Id $appInfo.ProcessId -Force -ErrorAction SilentlyContinue
}
```

**Manual Cleanup (if orphaned):**
```powershell
# Find and kill orphaned dotnet.exe processes
Get-Process -Name dotnet | Where-Object { $_.MainWindowTitle -like "*NoorCanvas*" } | Stop-Process -Force
```

---

### Problem: Port Conflicts / Address Already in Use

**Symptom:**
```
❌ Failed to bind to address https://127.0.0.1:9091: address already in use
```

**v3.0 Detection:**
- Canonical launcher checks port binding BEFORE attempting HTTP health check
- Provides clear error message with conflicting PID

**Solution:**
```powershell
# Find process using port 9091
netstat -ano | findstr :9091
# Output: TCP    0.0.0.0:9091    0.0.0.0:0    LISTENING    12345

# Kill by PID
Stop-Process -Id 12345 -Force
```

---

## Template Variables Reference (DEPRECATED in v3.0)

**NOTE**: v3.0 pattern delegates to canonical launcher. These variables are legacy from v2.0 inline launch pattern.

**For historical reference only:**
```
{{SOURCE_PATH}}              # v2.0: D:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas
{{APP_LAUNCH_COMMAND}}       # v2.0: dotnet run --no-build
{{APP_PORT}}                 # v2.0: 9091
{{APP_HEALTH_CHECK_URL}}     # v2.0: https://localhost:9091
{{APP_PROCESS_NAME}}         # v2.0: NoorCanvas, node, python
{{APP_STARTUP_TIME_SECONDS}} # v2.0: 8 (average measured by total-recall)
```

**v3.0 Equivalent:**
```powershell
# All configuration encapsulated in canonical launcher
$appInfo = & "Scripts\Test-Framework\Start-NoorCanvasForTests.ps1" `
    -Url "{{APP_HEALTH_CHECK_URL}}" `  # Only variable needed
    -Environment "Development"          # Standard for tests

# Returned PSCustomObject provides all runtime details:
# - $appInfo.ProcessId (for cleanup)
# - $appInfo.Url (confirmed URL)
# - $appInfo.HealthCheckAttempts (performance metric)
# - $appInfo.LaunchPattern ("v3.0-direct-dotnet")
```

---

## Summary: The Golden Rules (v3.0)

### ALWAYS Rules:
1. **ALWAYS** delegate to `Start-NoorCanvasForTests.ps1` (canonical launcher)
2. **ALWAYS** wrap test execution in `try/finally` for cleanup
3. **ALWAYS** use `-Force` with `Stop-Process`
4. **ALWAYS** use `$appInfo.ProcessId` from canonical launcher (not `$app.Id`)
5. **ALWAYS** check canonical launcher return value for errors

### NEVER Rules:
6. **NEVER** implement inline launch logic (use canonical launcher)
7. **NEVER** use nested PowerShell pattern (v2.0 deprecated)
8. **NEVER** use `Start-Job` for app lifecycle
9. **NEVER** use background operator `&` in PowerShell 5.1
10. **NEVER** use fixed delays (canonical launcher handles health checks)

### v3.0 Benefits:
- ✅ 67-80% faster startup (1-3 attempts vs 5-15)
- ✅ Port binding validation (catches conflicts early)
- ✅ Optimized exponential backoff (500ms, 1s, 2s, 3s)
- ✅ 100% cleanup reliability
- ✅ Single source of truth (one file to maintain)

---

**Last Updated**: 2025-10-29 (v3.0)  
**Source**: Enhanced from app-launch-fix-protocol.md (P2 Infrastructure)  
**See Also**: 
- `.github/prompts/shared/app-launch-fix-protocol.md` (v3.0 implementation details)
- `Scripts/Test-Framework/Start-NoorCanvasForTests.ps1` (canonical launcher)
- `.github/instructions/SelfAwareness.instructions.md` (Playwright testing section)
