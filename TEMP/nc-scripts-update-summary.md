# NC Scripts Update Summary
**Date:** October 14, 2025  
**Purpose:** Ensure all build scripts always rebuild and replace noorcanvas.exe with latest code

---

## Changes Made

### 1. **nc.ps1** - NOOR Canvas Launch Script
**Previous Behavior:**
- Used `dotnet run --no-build` (assumed code was already built)
- Could run stale code if build wasn't performed first

**New Behavior:**
- Always runs `dotnet clean` and `dotnet build --configuration Release` before launch
- Uses `dotnet run --configuration Release --no-build` with fresh executable
- Ensures latest code changes are always running

**Key Changes:**
```powershell
# Old:
dotnet run --no-build --urls "$httpsUrl;$httpUrl"

# New:
dotnet build --configuration Release --verbosity minimal
dotnet run --configuration Release --no-build --urls "$httpsUrl;$httpUrl"
```

---

### 2. **ncb.ps1** - NOOR Canvas Build Script
**Previous Behavior:**
- Only ran `dotnet build` without cleaning
- Could have build artifacts from previous builds

**New Behavior:**
- Runs `dotnet clean --configuration Release` first
- Then runs `dotnet build --configuration Release`
- Ensures completely fresh executable every time
- Displays "Fresh executable ready" confirmation

**Key Changes:**
```powershell
# Added clean step before build:
dotnet clean --configuration Release --verbosity quiet
dotnet build --configuration Release --verbosity minimal
```

---

### 3. **nct.ps1** - NOOR Canvas Token Generator
**Previous Behavior:**
- Called `ncb` but didn't ensure ports were fully cleaned
- Could have port conflicts

**New Behavior:**
- Enhanced port cleanup (9090/9091) before calling ncb
- Added detailed process cleanup for both ports
- Displays "Launching NOOR Canvas Build (ncb) with fresh build..." message
- Calls updated ncb which now does clean + build

**Key Changes:**
```powershell
# Added port-based process cleanup:
$portsToKill = @(9090, 9091)
foreach ($port in $portsToKill) {
    # Kill processes using these ports
}

# Updated launch message:
Write-Host "Launching NOOR Canvas Build (ncb) with fresh build..." -ForegroundColor Green
```

---

## Workflow After Update

### Using `nc` (Quick Launch):
1. Kills all existing NoorCanvas/dotnet/IIS processes
2. Clears ports 9090/9091
3. **BUILDS fresh Release executable**
4. Runs application with Kestrel
5. **Guarantees latest code is running**

### Using `ncb` (Build + Launch):
1. Kills all existing processes
2. Clears ports 9090/9091
3. **CLEANS previous build artifacts**
4. **BUILDS completely fresh Release executable**
5. Calls `nc` to launch (which won't rebuild since ncb already did)
6. **Guarantees latest code is running**

### Using `nct [sessionId]` (Token + Launch):
1. Generates host/user tokens for session
2. Displays URLs
3. Waits for keypress
4. Kills all existing processes
5. **CLEARS ports 9090/9091 thoroughly**
6. Calls `ncb` which does clean + build
7. **Guarantees latest code is running**

---

## Benefits

✅ **Always Fresh Code**: Every script now ensures latest code changes are compiled  
✅ **Clean Build**: `ncb` removes old artifacts before building  
✅ **No Stale Executables**: `nc` builds before running  
✅ **Port Cleanup**: Enhanced port cleanup in `nct`  
✅ **Consistent Behavior**: All scripts follow same pattern  
✅ **Developer Confidence**: No more "why isn't my change showing up?"  

---

## Testing Recommendations

1. Make a code change in HostControlPanel.razor
2. Run `nc` - verify change appears
3. Make another change
4. Run `ncb` - verify change appears
5. Make another change
6. Run `nct 212` - verify change appears

All three scripts should now consistently show latest code changes!

---

## Related Work

**Previous Issue Resolved:**
- Removed blue "Sharing..." and green "Share Complete" toast notifications
- Changed files: `HostControlPanel.razor` (Lines 3680 and 3710)
- Visual feedback now only through button states (SHARE → SHARING... → ✓ SHARED)

**Build Scripts Updated:**
- `Workspaces/Global/nc.ps1` - Added build step
- `Workspaces/Global/ncb.ps1` - Added clean step
- `Workspaces/Global/nct.ps1` - Enhanced port cleanup
