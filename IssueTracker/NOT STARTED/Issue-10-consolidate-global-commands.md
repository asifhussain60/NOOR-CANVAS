# Issue-10: Consolidate Global Commands - Remove nsrun/ncrun, Update nc

**Created:** September 11, 2025  
**Priority:** High  
**Category:** Enhancement  
**Status:** Not Started  

## **Problem Description**

The current global command structure has redundant and confusing commands (nsrun, ncrun) that need to be consolidated. The `nc` command should be the single, streamlined interface for running NOOR Canvas with proper testing integration.

**Current Issues:**
- Multiple overlapping commands (nsrun, ncrun, nc)
- Inconsistent command behavior and parameter handling
- Complex command structure confusing for users
- `nc -test` should serve both Testing Suite AND NOOR Canvas application

## **Requirements**

### **Commands to Remove:**
1. **nsrun**: Remove completely from global scripts and aliases
2. **ncrun**: Remove completely from global scripts and aliases

### **Updated nc Command Specifications:**
1. **Basic Usage**: `nc` - Start NOOR Canvas on localhost:9090
2. **Test Mode**: `nc -test` - Start NOOR Canvas + serve Testing Suite with browser launch
3. **Parameters**: Maintain essential parameters only (-Build, -NoBrowser, -Https, -Test)
4. **Simplicity**: One command, clear behavior, no confusion

## **Implementation Plan**

### **Phase 1: Remove Legacy Commands**
1. Delete `nsrun.ps1` from `Workspaces/Global/`
2. Delete `ncrun.ps1` from `Workspaces/Global/`
3. Remove any batch file wrappers for nsrun/ncrun
4. Clean up any references in other scripts

### **Phase 2: Update nc Command**
1. Modify `nc.ps1` to handle all functionality
2. Implement `nc -test` to serve both Testing Suite and NOOR Canvas
3. Ensure proper browser launching for test mode
4. Maintain backward compatibility for essential parameters

### **Phase 3: Testing and Verification**
1. Test `nc` command from various directories
2. Verify `nc -test` launches both applications correctly
3. Confirm all legacy commands are removed
4. Update documentation if needed

## **Expected Behavior**

### **nc Command:**
```powershell
# Basic application start
nc                          # Start NOOR Canvas on localhost:9090

# Test mode - dual application serving
nc -test                    # Start NOOR Canvas + Testing Suite with browser

# Build and run
nc -Build                   # Clean build then start

# HTTPS mode
nc -Https                   # Start on https://localhost:9091

# No browser launch
nc -NoBrowser               # Start without opening browser
```

### **nc -test Behavior:**
1. Start NOOR Canvas application on localhost:9090
2. Ensure Testing Suite is accessible at localhost:9090/testing
3. Open browser to Testing Suite (localhost:9090/testing) 
4. Testing Suite should have links to main application
5. Both applications should be fully functional simultaneously

## **Files to Modify/Remove**

### **Files to Delete:**
- `Workspaces/Global/nsrun.ps1`
- `Workspaces/Global/ncrun.ps1` 
- Any related batch files (nsrun.bat, ncrun.bat, etc.)

### **Files to Update:**
- `Workspaces/Global/nc.ps1` - Main command implementation
- Any profile scripts that reference nsrun/ncrun

## **Success Criteria**
- ✅ nsrun and ncrun commands completely removed
- ✅ nc command works from any directory
- ✅ nc -test serves both Testing Suite and NOOR Canvas
- ✅ Browser launches to Testing Suite in test mode
- ✅ All functionality consolidated into single nc command
- ✅ No broken references or dead commands

---

**Resolution Type:** Code Cleanup + Enhancement  
**Verification Method:** Command Testing  
**Priority Justification:** Streamlines development workflow, reduces confusion  
**Impact:** Improved developer experience, cleaner command structure
