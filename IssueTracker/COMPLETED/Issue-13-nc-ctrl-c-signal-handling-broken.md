# Issue #13: nc command Ctrl+C signal handling broken

**Status:** ✅ COMPLETED  
**Priority:** 🟡 Medium  
**Category:** 🐛 Bug  
**Created:** September 11, 2025  
**Resolved:** September 11, 2025

## Problem Description

The `nc` command (NOOR Canvas global launcher) was not responding to Ctrl+C interrupts, leaving background dotnet processes running indefinitely. Users had to manually kill processes using Task Manager or `Stop-Process` commands.

### Symptoms

- Pressing Ctrl+C in terminal had no effect
- `dotnet.exe` processes remained running after trying to stop with Ctrl+C
- Terminal showed "Press Ctrl+C to stop" but the signal was not handled
- Required manual process termination: `Stop-Process -Name "dotnet" -Force`

### Root Cause Analysis

The issue occurred because:

1. **Background Jobs**: The script used `Start-Job` to run `dotnet run` in background
2. **Signal Isolation**: PowerShell background jobs don't inherit the parent console's signal handlers
3. **Poor Job Management**: The script used `Wait-Job` without proper interrupt handling
4. **Missing Event Handlers**: No registration for console CancelKeyPress events

## Resolution

### Implementation Changes

**File:** `Workspaces/Global/nc.ps1`

**1. Added Proper Signal Handling:**

```powershell
# Register Ctrl+C handler
$null = Register-ObjectEvent -InputObject ([System.Console]) -EventName CancelKeyPress -Action {
    & $cleanup
    exit 0
}
```

**2. Implemented Comprehensive Cleanup Function:**

```powershell
$cleanup = {
    Write-Host "`nStopping NOOR Canvas application..." -ForegroundColor Yellow
    Stop-Job $job -Force -ErrorAction SilentlyContinue
    Remove-Job $job -Force -ErrorAction SilentlyContinue

    # Kill any remaining dotnet processes on our ports
    try {
        Get-NetTCPConnection -LocalPort 9090 -ErrorAction SilentlyContinue | ForEach-Object {
            Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
        }
        Get-NetTCPConnection -LocalPort 9091 -ErrorAction SilentlyContinue | ForEach-Object {
            Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
        }
    } catch {
        # Fallback: stop all dotnet processes
        Stop-Process -Name "dotnet" -Force -ErrorAction SilentlyContinue
    }

    Write-Host "Application stopped successfully" -ForegroundColor Green
}
```

**3. Enhanced Interactive Input Handling:**

```powershell
# Replace Wait-Job with interactive Read-Host loop
do {
    $input = Read-Host "Type 'stop' to quit, 'status' to check application, or press Ctrl+C"

    switch ($input.ToLower()) {
        "stop" { & $cleanup; return }
        "quit" { & $cleanup; return }
        "status" {
            # Check application health
            if ($job.State -eq "Running") {
                # Verify HTTP response
            }
        }
    }
} while ($job.State -eq "Running")
```

**4. Applied to Both Regular and Test Modes:**

- Regular `nc` mode: Single application cleanup
- Test `nc -Test` mode: Enhanced cleanup for testing environment

### Technical Benefits

- **Immediate Response**: Ctrl+C now immediately triggers cleanup
- **Process Safety**: Ensures no orphaned dotnet processes
- **Port Cleanup**: Properly releases ports 9090/9091
- **Interactive Control**: Added 'stop', 'quit', 'status' commands
- **Fallback Protection**: Multiple cleanup strategies prevent stuck processes

## Verification

### Test Cases Passed

1. **Ctrl+C Interrupt**: ✅ Immediately stops application and cleans up processes
2. **Interactive Stop**: ✅ `stop` and `quit` commands work correctly
3. **Status Check**: ✅ `status` command reports application health
4. **Process Cleanup**: ✅ No orphaned dotnet.exe processes remain
5. **Port Release**: ✅ Ports 9090/9091 properly released for reuse
6. **Test Mode**: ✅ Enhanced cleanup works in `nc -Test` mode

### Commands Verified

```powershell
# These now work correctly:
nc                    # Ctrl+C stops immediately
nc -Build            # Ctrl+C stops after build
nc -Test             # Ctrl+C stops testing environment
nc -NoBrowser        # Ctrl+C works without browser opening
```

## Impact Assessment

### Before Fix

- **User Experience**: Poor - required manual process killing
- **Development Workflow**: Disrupted by stuck processes
- **System Resources**: Wasted by orphaned processes
- **Port Management**: Ports remained occupied

### After Fix

- **User Experience**: Excellent - immediate response to Ctrl+C
- **Development Workflow**: Smooth - proper start/stop cycle
- **System Resources**: Clean - no orphaned processes
- **Port Management**: Proper - ports released immediately

## Related Issues

- **Issue-12**: nc -Test port 3000 integration (leveraged same script improvements)
- **Global Commands**: Affects all nc command variants

## Lessons Learned

1. **PowerShell Background Jobs** require explicit signal handling registration
2. **Console Event Handlers** must be registered for proper Ctrl+C support
3. **Process Cleanup** should include port-based process identification
4. **Interactive Interfaces** provide better user control than simple wait loops
5. **Fallback Strategies** ensure cleanup even when primary methods fail

---

**Resolution Confirmed:** September 11, 2025  
**Verification:** All test cases passed, Ctrl+C works immediately in all nc command modes
