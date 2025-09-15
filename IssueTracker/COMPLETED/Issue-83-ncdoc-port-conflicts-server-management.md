# Issue-83: NCDOC Port Conflicts and Server Management Enhancement

## Issue Summary
The `ncdoc` command currently uses port 9093, which conflicts with reserved port ranges for NOOR Canvas (909*) and Beautiful Islam (808*). Additionally, the command lacks intelligent server management - it doesn't detect existing servers and attempts to start new instances, causing port conflicts.

## Problem Details

### **Current Issues:**
1. **Port Conflict**: Uses port 9093 (909* range reserved for NOOR Canvas)
2. **No Server Detection**: Starts new server instances without checking if one already exists
3. **Missing Force Option**: No way to forcibly restart/kill existing servers
4. **Resource Waste**: Multiple DocFX server processes running simultaneously

### **Current Behavior:**
```powershell
PS> ncdoc
Starting documentation server on port 9093...
Documentation server launched (PID 8444). URL: http://localhost:9093

PS> ncdoc  # Run again
Starting documentation server on port 9093...
# Creates second server instance or fails with port conflict
```

## Requirements & Acceptance Criteria

### **1. Port Range Change**
- ✅ **Change port from 9093 to different range** (avoid 808* and 909*)  
- ✅ **Suggested port: 8050** (documentation server, outside reserved ranges)
- ✅ **Update all references** (URLs, PID files, help text)

### **2. Server Detection & Reuse**
- ✅ **Detect existing server** before attempting to start new one
- ✅ **Reuse existing server** if already running on target port
- ✅ **Display existing server info** (PID, URL, status)
- ✅ **Skip startup process** when server already available

### **3. Force Restart Capability**  
- ✅ **Add -Force parameter** to ncdoc command
- ✅ **Kill existing servers** when -Force is used
- ✅ **Clean up PID files** and process tracking
- ✅ **Start fresh server** after cleanup

### **4. Enhanced Server Management**
- ✅ **Improved status checking** for running processes
- ✅ **Better error handling** for port conflicts
- ✅ **Process cleanup validation** to ensure clean starts
- ✅ **Updated help documentation** reflecting new options

## Technical Implementation Plan

### **Phase 1: Port Change (Priority 1)**
```powershell
# Change default port from 9093 to 8050
$Port = 8050  # Default value in ncdoc.ps1
$docUrl = "http://localhost:$Port"
```

### **Phase 2: Server Detection Logic**
```powershell
# Check if server already running on target port
$serverRunning = Test-NetConnection -ComputerName localhost -Port $Port -InformationLevel Quiet
if ($serverRunning) {
    Write-Host "Documentation server already running on port $Port" -ForegroundColor Green
    Write-Host "URL: http://localhost:$Port" -ForegroundColor Cyan
    return
}
```

### **Phase 3: Force Restart Implementation**
```powershell
if ($Force) {
    # Kill existing DocFX servers
    Get-Process | Where-Object { $_.ProcessName -match "docfx|python" -and $_.CommandLine -match "serve|http.server" } | Stop-Process -Force
    # Clean PID files
    Remove-Item $pidFile -ErrorAction SilentlyContinue
    Write-Host "Existing servers stopped. Starting fresh server..." -ForegroundColor Yellow
}
```

### **Phase 4: Enhanced Help & Usage**
```powershell
Write-Host "USAGE:"
Write-Host "  ncdoc               # Serve documentation (reuse if running)"
Write-Host "  ncdoc -Force        # Kill existing servers and start fresh"
Write-Host "  ncdoc -Build        # Rebuild documentation first"
Write-Host "  ncdoc -Stop         # Stop documentation server"
Write-Host "  ncdoc -Port <port>  # Serve on alternative port"
```

## Testing Plan

### **Test Cases:**
1. **Port Change**: Verify server starts on port 8050 instead of 9093
2. **Server Reuse**: Run ncdoc twice, second should detect and reuse first
3. **Force Restart**: ncdoc -Force should kill existing and start fresh
4. **Port Conflicts**: Test behavior when port 8050 is occupied by other process
5. **Multiple Instances**: Ensure only one DocFX server per port

### **Validation Commands:**
```powershell
# Test server detection
ncdoc
ncdoc  # Should reuse existing

# Test force restart
ncdoc -Force  # Should kill and restart

# Test port checking
netstat -an | findstr :8050  # Verify port usage
```

## Risk Assessment

### **Low Risk:**
- Port change is straightforward configuration update
- Server detection uses standard PowerShell networking cmdlets
- PID file management already implemented

### **Mitigation Strategies:**
- Test thoroughly on development environment first
- Provide clear error messages for port conflicts
- Maintain backward compatibility with existing options
- Document new behavior in workspace instructions

## Timeline
- **Estimated Duration:** 2-3 hours
- **Priority:** Medium (Development workflow improvement)
- **Dependencies:** None - standalone ncdoc.ps1 enhancement

## Related Issues
- **Issue-58:** NCDOC Python Dependency Fix (Foundation for this enhancement)
- **Port Reservation Policy:** Workspace instructions section 2 (808*/909* reserved)

---
**Status:** ⚡ IN PROGRESS  
**Assignee:** GitHub Copilot  
**Created:** September 15, 2025  
**Last Updated:** September 15, 2025
