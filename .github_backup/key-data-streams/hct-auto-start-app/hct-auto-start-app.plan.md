# HCT Auto-Start App Plan

**Key**: `hct-auto-start-app`  
**Created**: 2025-10-26  
**Status**: Ready for Implementation  
**Version**: 1.1 (simplified output)

## Overview

Enhance the `hct` (Host Canvas Tool) to automatically start the NoorCanvas application before generating tokens, eliminating the manual step of running the app separately. Output simplified to show only host token/URL (participant access removed).

## User Request

> Run the noorcanvas application before running the host provisioner to give the tokens
> Remove participant token/URL display - host-focused tool only

## Assumptions Validated

- @workspace: `Scripts/hct.ps1` exists and generates tokens via HostProvisioner
- @workspace: `Workspaces/Global/hct.ps1` is the global wrapper
- @workspace: NoorCanvas app runs via `dotnet run` in `SPA/NoorCanvas` directory
- @workspace: App listens on `https://localhost:9091` (Development) or production URL
- @codebase: HostProvisioner requires database connection (app doesn't need to be running for DB access)
- Clarification: App startup is optional convenience, not strictly required for token generation
- App startup time: ~10-15 seconds typical

## Scope

### In Scope
- Auto-detect if NoorCanvas app is running
- Start app in background if not running
- Wait for app readiness with health check
- Clean up background process after token generation
- Port conflict detection and helpful error messages
- Progress indicator during startup
- Log file capture for debugging
- Configurable startup timeout
- `-KeepAppRunning` switch to leave app running

### Out of Scope
- IIS deployment scenarios (uses different startup mechanism)
- Production environment auto-start (only Development)
- App crash recovery or restart logic
- Multiple simultaneous app instances

## Implementation Phases

### Phase 1: App Detection and Health Check

**Objective**: Detect if app is running and implement health check endpoint polling

**Tasks**:
1. Create `Test-NoorCanvasRunning` function:
   - Check if process exists: `Get-Process -Name "dotnet" | Where-Object {$_.MainWindowTitle -like "*NoorCanvas*"}`
   - Alternative: Test HTTPS connection to `https://localhost:9091`
   - Return: $true if running, $false otherwise

2. Create `Wait-AppReady` function with health check:
   - Poll endpoint: `https://localhost:9091` (simple connection test)
   - Or check for app log output: "Now listening on: https://localhost:9091"
   - Max attempts: Configurable (default 30 attempts × 1 second = 30 seconds)
   - Progress indicator: "Starting app... 5/30 seconds"
   - Return: $true if ready, $false if timeout

3. Port conflict detection:
   - Use `Test-NetConnection -ComputerName localhost -Port 9091`
   - If port occupied but app not responding correctly, show error
   - Suggest: "Port 9091 in use by another process. Stop it or use different port."

**Files Modified**:
- `Scripts/hct.ps1` - Add detection functions

**Enhancement Integration**:
- ✅ A. Health check endpoint verification
- ✅ B. Port conflict detection

**Exit Criteria**:
- Can detect running app reliably
- Health check polls successfully
- Port conflicts identified clearly

---

### Phase 2: Background App Startup

**Objective**: Start NoorCanvas app in background process with logging

**Tasks**:
1. Create `Start-NoorCanvasApp` function:
   - Set working directory: `SPA/NoorCanvas`
   - Set environment: `$env:ASPNETCORE_ENVIRONMENT = $Environment`
   - Start background job:
     ```powershell
     $job = Start-Job -ScriptBlock {
       Set-Location "D:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas"
       $env:ASPNETCORE_ENVIRONMENT = $using:Environment
       dotnet run 2>&1 | Tee-Object -FilePath $using:LogFile
     }
     ```
   - Store job info: Return job object

2. Log file capture:
   - Create log file: `.github/key-data-streams/hct-auto-start-app/logs/app-startup-{timestamp}.log`
   - Capture stdout/stderr via `Tee-Object`
   - Show log file path to user

3. Progress indicator during startup:
   - Display: "🚀 Starting NoorCanvas app... 5/30 seconds"
   - Update every second
   - Show spinner or dots animation

4. Startup timeout configuration:
   - Add `-StartupTimeout` parameter (default: 30 seconds)
   - If timeout exceeded, show error and log file location
   - Kill background job on timeout

**Files Modified**:
- `Scripts/hct.ps1` - Add startup function
- `Workspaces/Global/hct.ps1` - Add `-StartupTimeout` parameter

**Enhancement Integration**:
- ✅ C. Progress indicator during startup
- ✅ D. Log file capture
- ✅ E. Startup timeout configuration

**Exit Criteria**:
- App starts successfully in background
- Logs captured to file
- Progress indicator updates correctly
- Timeout handling works

---

### Phase 3: Main Logic Integration

**Objective**: Integrate auto-start logic into main hct.ps1 workflow

**Tasks**:
1. Modify main hct.ps1 execution flow:
   ```powershell
   # Before invoking HostProvisioner
   $appWasRunning = Test-NoorCanvasRunning
   $appJob = $null
   
   IF ($Environment -eq "Development" -and -not $appWasRunning) {
     Write-Host "🔍 NoorCanvas app not detected, starting..." -ForegroundColor Yellow
     
     # Check port conflict
     IF (Test-PortConflict -Port 9091) {
       Write-Host "❌ Port 9091 already in use" -ForegroundColor Red
       EXIT 1
     }
     
     # Start app
     $appJob = Start-NoorCanvasApp -Environment $Environment -LogFile $logFile
     
     # Wait for readiness
     $ready = Wait-AppReady -MaxWaitSeconds $StartupTimeout
     IF (-not $ready) {
       Write-Host "❌ App failed to start within $StartupTimeout seconds" -ForegroundColor Red
       Write-Host "Check logs: $logFile" -ForegroundColor Yellow
       Stop-Job $appJob
       EXIT 1
     }
     
     Write-Host "✅ App ready!" -ForegroundColor Green
   } ELSE {
     Write-Host "✅ App already running" -ForegroundColor Green
   }
   
   # Existing HostProvisioner invocation...
   
   # Cleanup
   IF ($appJob -and -not $KeepAppRunning) {
     Write-Host "🛑 Stopping app..." -ForegroundColor Yellow
     Stop-Job $appJob -PassThru | Remove-Job
   }
   ```

2. Add parameters to global wrapper:
   - `-KeepAppRunning` switch
   - `-StartupTimeout` int (default 30)
   - Pass through to main script

3. Environment-specific behavior:
   - Only auto-start in Development (not Production)
   - Production: Skip auto-start, assume app is running or not needed

**Files Modified**:
- `Scripts/hct.ps1` - Main logic integration
- `Workspaces/Global/hct.ps1` - Parameter additions

**Exit Criteria**:
- Auto-start only happens when needed (Dev + not running)
- Cleanup works correctly
- `-KeepAppRunning` flag works
- Production environment skips auto-start

---

### Phase 4: Error Handling and Edge Cases

**Objective**: Handle edge cases and provide helpful error messages

**Tasks**:
1. Ctrl+C interruption handling:
   - Trap `[Console]::TreatControlCAsInput` or use try/finally
   - Ensure background job is killed on interruption
   - Display: "⚠️ Interrupted. Cleaning up background process..."

2. App crash detection:
   - After startup, periodically check if job is still running
   - If job exited unexpectedly, show error and log location

3. Multiple hct instances:
   - Warn if another hct process detected
   - Suggest: "Another hct process may be running. Check task manager."

4. Helpful error messages:
   - Port conflict: "Port 9091 in use. Stop other apps: `Get-Process -Id (Get-NetTCPConnection -LocalPort 9091).OwningProcess`"
   - App crash: "App crashed during startup. Check logs: {logFile}"
   - Timeout: "App didn't start in {timeout}s. Increase timeout with -StartupTimeout or check logs."

**Files Modified**:
- `Scripts/hct.ps1` - Error handling

**Exit Criteria**:
- Ctrl+C cleans up properly
- Error messages are actionable
- Edge cases handled gracefully

---

### Phase 5: Documentation and Testing

**Objective**: Document new features and create test scenarios

**Tasks**:
1. Update `Scripts/hct.README.md`:
   - Document auto-start behavior
   - Explain `-KeepAppRunning` flag
   - Explain `-StartupTimeout` parameter
   - Add troubleshooting section

2. Update `Scripts/NCDEPLOY-QUICK-REFERENCE.md`:
   - Add note about automatic app startup
   - Show examples with new parameters

3. Update work log:
   - Document all enhancements implemented
   - Include usage examples

4. Manual testing checklist:
   - [ ] App not running → auto-starts successfully
   - [ ] App already running → skips auto-start
   - [ ] `-KeepAppRunning` leaves app running
   - [ ] Default behavior stops app after token generation
   - [ ] Ctrl+C interruption cleans up
   - [ ] Port conflict detected and reported
   - [ ] Timeout handling works
   - [ ] Log files created correctly
   - [ ] Progress indicator displays
   - [ ] Production environment skips auto-start

**Files Modified**:
- `Scripts/hct.README.md`
- `Scripts/NCDEPLOY-QUICK-REFERENCE.md`
- `.github/key-data-streams/hct-auto-start-app/work-log.md`

**Exit Criteria**:
- Documentation complete
- All manual tests pass
- Examples work correctly

---

## File Modifications Summary

### New Files
- `.github/key-data-streams/hct-auto-start-app/hct-auto-start-app.plan.md` - This plan
- `.github/key-data-streams/hct-auto-start-app/work-log.md` - Execution log
- `.github/key-data-streams/hct-auto-start-app/logs/` - Log directory for app startup logs

### Modified Files
- `Scripts/hct.ps1` - Core auto-start logic (all phases)
- `Workspaces/Global/hct.ps1` - Parameter additions
- `Scripts/hct.README.md` - Documentation updates
- `Scripts/NCDEPLOY-QUICK-REFERENCE.md` - Quick reference updates

## Enhancement Integration Details

All enhancements have been integrated into appropriate phases:

**Phase 1** integrates:
- ✅ A. Health check endpoint verification - `Wait-AppReady` function
- ✅ B. Port conflict detection - `Test-PortConflict` check

**Phase 2** integrates:
- ✅ C. Progress indicator - "Starting app... N/30 seconds" display
- ✅ D. Log file capture - Tee-Object to log file
- ✅ E. Startup timeout configuration - `-StartupTimeout` parameter

## Testing Strategy

### Manual Test Cases

**Test 1: Fresh Start (App Not Running)**
```powershell
# Ensure app is not running
Get-Process dotnet | Where-Object {$_.MainWindowTitle -like "*NoorCanvas*"} | Stop-Process

# Run hct
hct 212

# Expected:
# - "🔍 NoorCanvas app not detected, starting..."
# - Progress: "Starting app... 1/30 seconds" ... "30/30 seconds"
# - "✅ App ready!"
# - Tokens generated
# - "🛑 Stopping app..."
```

**Test 2: App Already Running**
```powershell
# Start app manually
cd SPA/NoorCanvas
dotnet run &

# Run hct
hct 212

# Expected:
# - "✅ App already running"
# - Tokens generated
# - App keeps running (not stopped)
```

**Test 3: Keep App Running**
```powershell
hct 212 -KeepAppRunning

# Expected:
# - App starts
# - Tokens generated
# - App keeps running after completion
```

**Test 4: Port Conflict**
```powershell
# Start dummy service on port 9091
# (simulate port conflict)

hct 212

# Expected:
# - "❌ Port 9091 already in use"
# - Helpful error message with process ID
# - Exit with error
```

**Test 5: Ctrl+C Interruption**
```powershell
hct 212
# Press Ctrl+C during "Starting app..." phase

# Expected:
# - "⚠️ Interrupted. Cleaning up background process..."
# - Background job terminated
# - Graceful exit
```

**Test 6: Custom Timeout**
```powershell
hct 212 -StartupTimeout 60

# Expected:
# - Waits up to 60 seconds for app startup
# - Progress indicator reflects 60 second max
```

**Test 7: Production Environment**
```powershell
hct 215 -Environment Production

# Expected:
# - Skips auto-start (Production environment)
# - Proceeds directly to token generation
```

## Risk Assessment

### Potential Issues

1. **Background job cleanup failure**
   - Mitigation: Use try/finally blocks, always cleanup on exit
   - Fallback: User can manually kill dotnet processes

2. **Port detection false positives**
   - Mitigation: Check both port and app response
   - Fallback: `-SkipAutoStart` parameter (future enhancement)

3. **Log file growth**
   - Mitigation: Logs stored in temporary directory with timestamps
   - Fallback: User can manually delete old logs

4. **Startup timeout too short/long**
   - Mitigation: Configurable via `-StartupTimeout`
   - Default: 30 seconds (sufficient for most cases)

## Success Criteria

- ✅ User runs `hct 212` without manually starting app first
- ✅ App auto-starts in Development environment
- ✅ Health check confirms app readiness
- ✅ Progress indicator shows startup status
- ✅ Log files capture startup output
- ✅ Port conflicts detected and reported
- ✅ Background process cleaned up after token generation
- ✅ `-KeepAppRunning` flag works as expected
- ✅ Ctrl+C interruption handled gracefully
- ✅ Documentation reflects new behavior
- ✅ All manual tests pass

## Future Enhancements (Out of Scope)

- App restart on crash during token generation
- Multiple app instance management
- IIS-based auto-start
- Auto-start in Production environment
- Performance monitoring during startup
- Parallel token generation for multiple sessions
