# Issue-12: NC -Test Command Incorrect Port 3000 Integration

**Category:** Bug  
**Priority:** High  
**Status:** COMPLETED ✅  
**Created:** September 11, 2025  
**Resolved:** September 11, 2025

## **Problem Description**

The `nc -Test` command is incorrectly trying to serve the testing suite on port 3000 as a separate static HTTP server, but this approach was already resolved in Issue-7. The testing suite is properly integrated into the NOOR Canvas web server and should be accessed via the `/testing` route.

## **Error Messages**

```
Test suite is not working http://localhost:3000/
Testing suite loading issues and background job failures
```

## **Root Cause Analysis**

1. **Outdated Implementation**: `nc.ps1` script still contains old port 3000 logic from before Issue-7 resolution
2. **Integration Ignored**: Script doesn't use the existing `/testing` route available in NOOR Canvas web server
3. **Complexity**: Unnecessary dual-server architecture when single server integration already works
4. **Background Jobs**: PowerShell background job management failing to maintain separate HTTP servers

## **Impact Assessment**

- **High**: Blocks testing workflow completely
- **User Experience**: `nc -Test` command fails to provide working testing environment
- **Development**: Developers cannot use integrated testing suite via command line

## **Reproduction Steps**

1. Run `nc -Test` command
2. Command reports starting test suite on port 3000
3. Port 3000 doesn't respond or servers fail to start properly
4. Testing suite should be available via main application instead

## **Expected Behavior**

Based on Issue-7 resolution:

- Testing suite should be accessed via `http://localhost:9090/testing` (or 9091 for HTTPS)
- No separate HTTP server on port 3000 needed
- `nc -Test` should open both main app and integrated testing suite
- All functionality should work without CORS issues

## **Current Working Solution (Manual)**

1. Run `nc` (or `nc -Build`) to start NOOR Canvas application
2. Navigate to `http://localhost:9090/testing` manually
3. Testing suite works perfectly with all API integration

## **Resolution Framework**

### **Solution Options**

1. **Update nc.ps1 Script**: Remove port 3000 logic, use integrated testing route
2. **Simplify Command**: `nc -Test` should just start app + open testing URL
3. **Browser Integration**: Open both `localhost:9090` and `localhost:9090/testing`

### **Implementation Plan**

1. Modify `nc.ps1` to remove all port 3000 and separate server logic
2. Update `-Test` mode to:
   - Start NOOR Canvas application normally (port 9090/9091)
   - Open browser to main application URL
   - Open second browser tab to `/testing` route
3. Remove Python/NPX/Node.js HTTP server fallback code
4. Update help documentation to reflect correct URLs

### **Acceptance Criteria**

- [x] `nc -Test` starts only the NOOR Canvas application (no port 3000)
- [x] Browser opens to both `localhost:9090` and `localhost:9090/testing`
- [x] Testing suite fully functional via integrated route
- [x] No background job failures or PowerShell errors
- [x] Command completes successfully without hanging

## **RESOLUTION COMPLETED ✅**

**Date:** September 11, 2025  
**Status:** VERIFIED WORKING

**Final Implementation:**

1. **Removed Port 3000 Logic**: Eliminated all separate HTTP server code for port 3000
2. **Integrated Testing Route**: `nc -Test` now uses the existing `/testing` route in NOOR Canvas web server
3. **Simplified Architecture**: Single server approach - no dual server complexity
4. **Browser Integration**: Opens both main app (`localhost:9090`) and testing suite (`localhost:9090/testing`)
5. **Updated Documentation**: Help text now correctly shows integrated testing approach

**Key Changes Made:**

- **Modified `nc.ps1`**: Replaced complex dual-server test mode with simple integrated approach
- **Fixed Help Text**: Updated to show correct URLs (no mention of port 3000)
- **Leveraged Existing Solution**: Used the working integration from Issue-7 resolution
- **Eliminated Background Job Issues**: No more PowerShell job management for separate servers

**Result:** `nc -Test` command now works correctly using the integrated testing suite approach that was already successfully implemented and tested.

## **Reference Issues**

- **Issue-7**: Testing Suite CORS/API Errors (COMPLETED) - Shows correct integration approach
- **Files to update**: `Workspaces/Global/nc.ps1`
- **Existing integration**: `/testing` route in `SPA/NoorCanvas/Program.cs`
- **Working files**: `SPA/NoorCanvas/wwwroot/testing/index.html`

## **Implementation Notes**

- Testing suite is already properly integrated and working
- Issue is only with the `nc -Test` command implementation
- Current manual approach (start app, navigate to /testing) works perfectly
- Need to align command behavior with existing successful integration

## **Dependencies**

- NOOR Canvas application with `/testing` route (already implemented ✅)
- HostProvisionerController API (already working ✅)
- Static file serving for wwwroot/testing/ (already configured ✅)

## **Notes**

- This is a regression from the working Issue-7 solution
- Command should leverage existing integration instead of creating new complexity
- Simple fix: update nc.ps1 to use integrated route instead of separate server
