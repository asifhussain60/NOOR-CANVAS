# Test Registry: HCT Auto-Start App

**Key**: `hct-auto-start-app`  
**Created**: 2025-10-26

---

## Manual Test Scenarios

### Test 1: Fresh Start (App Not Running)

**Objective**: Verify auto-start behavior when app is not running

**Preconditions**:
- NoorCanvas app is NOT running
- Development environment configured

**Steps**:
```powershell
# 1. Ensure app is not running
Get-Process dotnet | Where-Object {$_.MainWindowTitle -like "*NoorCanvas*"} | Stop-Process -ErrorAction SilentlyContinue

# 2. Run hct
hct 212
```

**Expected Results**:
- [ ] Message: "🔍 NoorCanvas app not detected, starting..."
- [ ] Progress indicator: "Starting app... 1/30 seconds" ... "30/30 seconds"
- [ ] Message: "✅ App ready!"
- [ ] Host and User tokens generated successfully
- [ ] Message: "🛑 Stopping app..."
- [ ] App process terminated after token generation

**Status**: Not Executed  
**Notes**: 

---

### Test 2: App Already Running

**Objective**: Verify skipping auto-start when app is already running

**Preconditions**:
- NoorCanvas app IS running on `https://localhost:9091`

**Steps**:
```powershell
# 1. Start app manually
cd SPA/NoorCanvas
Start-Job -ScriptBlock { dotnet run }

# 2. Wait for app to be ready (check in browser)
# 3. Run hct
hct 212
```

**Expected Results**:
- [ ] Message: "✅ App already running"
- [ ] No "Starting app..." message
- [ ] Tokens generated successfully
- [ ] App continues running after token generation (not stopped by hct)

**Status**: Not Executed  
**Notes**: 

---

### Test 3: Keep App Running

**Objective**: Verify `-KeepAppRunning` flag leaves app running

**Preconditions**:
- NoorCanvas app is NOT running
- Development environment configured

**Steps**:
```powershell
hct 212 -KeepAppRunning
```

**Expected Results**:
- [ ] App starts automatically
- [ ] Tokens generated successfully
- [ ] NO "🛑 Stopping app..." message
- [ ] App continues running after hct completes
- [ ] Can verify with: `Get-Process dotnet | Where-Object {$_.MainWindowTitle -like "*NoorCanvas*"}`

**Status**: Not Executed  
**Notes**: 

---

### Test 4: Port Conflict

**Objective**: Verify port conflict detection and error handling

**Preconditions**:
- Another process occupies port 9091 (not NoorCanvas)

**Steps**:
```powershell
# 1. Start dummy service on port 9091
# Example: python -m http.server 9091 --bind localhost
# Or: netcat -l 9091

# 2. Run hct
hct 212
```

**Expected Results**:
- [ ] Message: "❌ Port 9091 already in use"
- [ ] Helpful error message with process ID or suggestion to stop conflicting process
- [ ] hct exits with error code
- [ ] No token generation attempted

**Status**: Not Executed  
**Notes**: 

---

### Test 5: Ctrl+C Interruption

**Objective**: Verify graceful cleanup on user interruption

**Preconditions**:
- NoorCanvas app is NOT running

**Steps**:
```powershell
# 1. Run hct
hct 212

# 2. During "Starting app..." phase, press Ctrl+C
```

**Expected Results**:
- [ ] Message: "⚠️ Interrupted. Cleaning up background process..."
- [ ] Background job terminated (no orphaned dotnet processes)
- [ ] hct exits gracefully
- [ ] Verify: `Get-Job` shows no running jobs

**Status**: Not Executed  
**Notes**: 

---

### Test 6: Custom Timeout

**Objective**: Verify configurable startup timeout

**Preconditions**:
- NoorCanvas app is NOT running
- App startup may take longer than default 30 seconds

**Steps**:
```powershell
hct 212 -StartupTimeout 60
```

**Expected Results**:
- [ ] Progress indicator reflects 60 second maximum
- [ ] App waits up to 60 seconds for readiness
- [ ] If app starts within 60s, tokens generated successfully
- [ ] If app exceeds 60s, timeout error displayed

**Status**: Not Executed  
**Notes**: 

---

### Test 7: Production Environment

**Objective**: Verify auto-start is skipped in Production environment

**Preconditions**:
- Production environment configured (`-Environment Production`)

**Steps**:
```powershell
hct 215 -Environment Production
```

**Expected Results**:
- [ ] NO "Starting app..." message
- [ ] Skips auto-start logic entirely
- [ ] Proceeds directly to token generation
- [ ] Assumes app is running or not needed for Production

**Status**: Not Executed  
**Notes**: 

---

## Enhancement-Specific Tests

### Enhancement A: Health Check Endpoint Verification

**Test**: Verify health check polling works correctly

**Steps**:
1. Start app manually with intentional delay (modify code to delay startup)
2. Run `hct 212`
3. Observe health check polling

**Expected**:
- [ ] Polls endpoint every 1 second
- [ ] Detects when app becomes ready
- [ ] Proceeds with token generation

**Status**: Not Executed

---

### Enhancement B: Port Conflict Detection

**Test**: Verify accurate port conflict detection

**Steps**:
1. Occupy port 9091 with non-NoorCanvas process
2. Run `hct 212`

**Expected**:
- [ ] Detects port conflict
- [ ] Shows process ID of conflicting process
- [ ] Suggests resolution command

**Status**: Not Executed

---

### Enhancement C: Progress Indicator

**Test**: Verify progress indicator displays correctly

**Steps**:
1. Run `hct 212` with fresh app start
2. Observe console output during startup

**Expected**:
- [ ] Progress indicator updates every second
- [ ] Shows format: "Starting app... N/30 seconds"
- [ ] Clears or finalizes when app ready

**Status**: Not Executed

---

### Enhancement D: Log File Capture

**Test**: Verify log files are created and contain startup output

**Steps**:
1. Run `hct 212` with fresh app start
2. Check log file location shown in output

**Expected**:
- [ ] Log file created in `.github/key-data-streams/hct-auto-start-app/logs/`
- [ ] Filename contains timestamp
- [ ] Contains app startup output (stdout/stderr)
- [ ] User can review logs after completion

**Status**: Not Executed

---

### Enhancement E: Configurable Timeout

**Test**: Verify timeout parameter works correctly

**Steps**:
1. Run `hct 212 -StartupTimeout 10` (short timeout)
2. Run `hct 212 -StartupTimeout 60` (long timeout)

**Expected**:
- [ ] Short timeout triggers timeout error if app takes longer
- [ ] Long timeout waits appropriately
- [ ] Progress indicator reflects configured timeout

**Status**: Not Executed

---

## Regression Tests

### Regression 1: Basic hct functionality unchanged

**Test**: Verify existing hct behavior still works

**Steps**:
```powershell
# With app already running
hct 212
```

**Expected**:
- [ ] Tokens generated as before
- [ ] No breaking changes to existing workflow

**Status**: Not Executed

---

### Regression 2: Global command wrapper works

**Test**: Verify global `hct` command still functions

**Steps**:
```powershell
cd ~  # Change to any directory
hct 212
```

**Expected**:
- [ ] Global command invokes main script correctly
- [ ] All parameters passed through

**Status**: Not Executed

---

## Edge Case Tests

### Edge Case 1: App crashes during startup

**Test**: Handle app crash gracefully

**Steps**:
1. Modify app to crash on startup (invalid config, etc.)
2. Run `hct 212`

**Expected**:
- [ ] Detects app crash
- [ ] Shows error with log file location
- [ ] Exits cleanly

**Status**: Not Executed

---

### Edge Case 2: Multiple hct instances

**Test**: Warn about concurrent hct processes

**Steps**:
1. Run `hct 212 -KeepAppRunning` in one terminal
2. Run `hct 213` in another terminal before first completes

**Expected**:
- [ ] Warning about another hct process
- [ ] Suggestion to check task manager or wait

**Status**: Not Executed

---

## Test Summary

**Total Tests**: 15 (7 manual scenarios + 5 enhancement tests + 2 regression + 1 edge case)  
**Passed**: 0  
**Failed**: 0  
**Not Executed**: 15  
**Blocked**: 0

---

## Test Execution Checklist

Run tests in this order:

1. ✅ Unit tests (if any created)
2. ⬜ Enhancement-specific tests (A-E)
3. ⬜ Manual test scenarios (1-7)
4. ⬜ Regression tests
5. ⬜ Edge case tests
6. ⬜ Final smoke test (basic hct 212 flow)

---

## Notes

- All tests require Development environment with KSESSIONS_DEV database
- Tests assume default port 9091 for NoorCanvas app
- Log files should be reviewed for each test execution
- Edge cases may require code modifications to simulate failure scenarios
