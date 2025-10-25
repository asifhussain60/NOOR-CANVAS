# Playwright Test Resolution Documentation

**Date**: 2025-10-18  
**Key**: hcptcanvas  
**Issue**: PowerShell orchestration failures when running Playwright tests with app startup

---

## Problem Statement

Initial attempts to run Playwright tests for H2 share button functionality failed due to PowerShell command complexity and process management issues:

### Failed Approaches

**Attempt 1: Start-Job with complex piping**
```powershell
$app = Start-Job -ScriptBlock { 
    cd 'D:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas'; 
    dotnet run 
} | Out-Null; 
Start-Sleep -Seconds 15; 
cd 'D:\PROJECTS\NOOR CANVAS\Tests\UI'; 
npx playwright test test-section-share-buttons.spec.ts --headed; 
Stop-Job -Name Job1 -ErrorAction SilentlyContinue
```

**Issues**:
- Job name unpredictable (`Job1`, `Job2`, etc.)
- Output redirection caused process to hang
- `Stop-Job` couldn't reliably target the correct job
- App process remained orphaned after test completion

**Attempt 2: Direct dotnet run with inline chaining**
```powershell
cd "D:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas"; 
dotnet run --no-build & 
Start-Sleep -Seconds 8; 
cd "D:\PROJECTS\NOOR CANVAS\Tests\UI"; 
npx playwright test test-section-share-buttons.spec.ts --headed
```

**Issues**:
- Background operator `&` not reliable in PowerShell 5.1
- No process handle captured for cleanup
- App remained running after test, blocking subsequent runs

---

## Working Solution: Start-Process with -PassThru

### Final Working Command

```powershell
$app = Start-Process powershell `
    -ArgumentList "-NoExit","-Command","cd 'D:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas'; dotnet run --no-build" `
    -PassThru `
    -WindowStyle Minimized; 
Start-Sleep -Seconds 8; 
cd "D:\PROJECTS\NOOR CANVAS\Tests\UI"; 
npx playwright test test-section-share-buttons.spec.ts --headed --reporter=list; 
Stop-Process -Id $app.Id -Force
```

### Why This Works

**Key Components**:

1. **`Start-Process powershell`**  
   - Spawns a **new PowerShell window** (not a background job)
   - Gives complete isolation from parent process
   - Window remains open for debugging if needed

2. **`-ArgumentList` with proper escaping**  
   - `-NoExit`: Keeps window open (prevents premature termination)
   - `-Command`: Executes the dotnet run command
   - Single quotes around path prevent whitespace issues

3. **`-PassThru` flag**  
   - **CRITICAL**: Returns the `System.Diagnostics.Process` object
   - Captures process ID in `$app.Id` variable
   - Enables reliable cleanup via `Stop-Process -Id`

4. **`-WindowStyle Minimized`**  
   - Starts app in background (not intrusive)
   - Still allows inspection if needed (restore window)

5. **`Start-Sleep -Seconds 8`**  
   - Gives app time to fully start and listen on port
   - 8 seconds proven sufficient for NoorCanvas startup
   - Alternative: Poll port with `Test-NetConnection` (more robust)

6. **`Stop-Process -Id $app.Id -Force`**  
   - Reliably kills the **exact process** started
   - `-Force` ensures termination even if app is unresponsive
   - No orphaned processes left behind

---

## Comparison: Job vs Start-Process

| Aspect | Start-Job | Start-Process -PassThru |
|--------|-----------|-------------------------|
| **Process Isolation** | Background thread | Separate window/process |
| **Output Handling** | Captured (can cause hang) | Separate console (no interference) |
| **Process ID** | Job ID (indirect) | Direct PID via $app.Id |
| **Cleanup Reliability** | Must find job by name | Direct Stop-Process -Id |
| **Debugging** | Output hidden | Window can be restored |
| **Exit Code** | Via Receive-Job | N/A (test handles it) |
| **Complexity** | High (job management) | Low (standard process) |

---

## Implementation in Scripts

### Example: run-session-212-test.ps1

```powershell
# run-session-212-test.ps1
# Automated test orchestration for Session 212 H2 share buttons

$ErrorActionPreference = "Stop"

Write-Host "Starting NoorCanvas app in background..." -ForegroundColor Cyan

# Start app with Start-Process (returns process object)
$app = Start-Process powershell `
    -ArgumentList "-NoExit","-Command","cd 'D:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas'; dotnet run --no-build" `
    -PassThru `
    -WindowStyle Minimized

Write-Host "App started (PID: $($app.Id)). Waiting 8 seconds for startup..." -ForegroundColor Yellow
Start-Sleep -Seconds 8

Write-Host "Running Playwright test..." -ForegroundColor Cyan
cd "D:\PROJECTS\NOOR CANVAS\Tests\UI"
npx playwright test test-section-share-buttons.spec.ts --headed --reporter=list

Write-Host "Stopping app (PID: $($app.Id))..." -ForegroundColor Cyan
Stop-Process -Id $app.Id -Force

Write-Host "Test complete!" -ForegroundColor Green
```

---

## Lessons Learned

### DO ✅
- Use `Start-Process -PassThru` for capturing process handles
- Use `-WindowStyle Minimized` for background execution with debugging capability
- Use `-Force` with `Stop-Process` to guarantee cleanup
- Use `--no-build` to speed up app startup (build separately)
- Use specific `--reporter=list` for concise Playwright output

### DON'T ❌
- Don't use `Start-Job` for interactive apps (output redirection issues)
- Don't rely on job names (`Job1`, `Job2`) - they're unpredictable
- Don't use background operator `&` in PowerShell 5.1 (unreliable)
- Don't forget cleanup - always `Stop-Process` in finally block
- Don't assume process cleanup happens automatically

### Improvement Opportunities
- Add port polling instead of fixed 8s sleep:
  ```powershell
  $timeout = 30
  $elapsed = 0
  while (-not (Test-NetConnection localhost -Port 9091 -InformationLevel Quiet) -and $elapsed -lt $timeout) {
      Start-Sleep -Seconds 1
      $elapsed++
  }
  ```
- Add error handling for app startup failures
- Use try/finally to guarantee cleanup even on test failure:
  ```powershell
  try {
      $app = Start-Process ...
      Start-Sleep -Seconds 8
      npx playwright test ...
  } finally {
      if ($app) { Stop-Process -Id $app.Id -Force -ErrorAction SilentlyContinue }
  }
  ```

---

## Related Files

- **Test Script**: `.github/prompts.keys/hcp-tcanvas/run-session-212-test.ps1`
- **Test Spec**: `Tests/UI/test-section-share-buttons.spec.ts`
- **Chat History**: `Workspaces/Data/CopilotChats.txt` (lines 1572-1650)

---

## Status

✅ **RESOLVED** - Playwright tests now run reliably with proper process management  
✅ **VERIFIED** - Session 212 test successfully detects 6 H2 elements and injects 6 buttons  
✅ **REUSABLE** - Pattern documented for future test orchestration scripts
