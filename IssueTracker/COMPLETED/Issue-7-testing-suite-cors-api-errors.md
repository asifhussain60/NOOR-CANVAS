# Issue-7: Testing Suite CORS/API Errors

**Category:** Bug  
**Priority:** High  
**Status:** Not Started  
**Created:** September 11, 2025  

## **Problem Description**
The MANUAL-TESTING-SUITE.html file cannot generate host tokens because:
1. HTML file opens with `file://` protocol instead of being served through web server
2. CORS policy blocks API calls from `file://` to `http://localhost:9090/9091`
3. JavaScript error occurs when `event.target` is undefined in token generation function

## **Error Messages**
```
Access to fetch at 'file:///D:/api/hostprovisioner/generate' from origin 'null' has been blocked by CORS policy
TypeError: Cannot read properties of undefined (reading 'target')
```

## **Root Cause Analysis**
1. **CORS Issue**: Browser security prevents `file://` origins from making requests to HTTP servers
2. **Incorrect API URL**: The fetch is trying `file:///D:/api/...` instead of `http://localhost:9090/api/...`
3. **Event Handler Bug**: `event.target` is undefined when called programmatically vs. user click

## **Impact Assessment**
- **High**: Blocks testing workflow completely
- **User Experience**: Cannot generate host tokens for authentication testing
- **Testing**: Manual testing suite unusable for host authentication scenarios

## **Reproduction Steps**
1. Run `ncrun -Test` command
2. Testing suite opens as static HTML file (`file://` protocol)
3. Click "Generate New Token" button
4. Observe CORS errors and JavaScript errors in console

## **Expected Behavior**
- Testing suite should be served through NOOR Canvas web server
- Host token generation should work via proper API calls
- No CORS or JavaScript errors should occur

## **Resolution Framework**

### **Solution Options**
1. **Serve via Web Server**: Move testing suite to `/wwwroot/` and serve through NOOR Canvas
2. **Fix API URLs**: Use absolute URLs pointing to running server (localhost:9090/9091)
3. **Fix Event Handler**: Prevent undefined `event.target` errors

### **Implementation Plan**
1. Move MANUAL-TESTING-SUITE.html to `/wwwroot/testing/` directory
2. Fix JavaScript API URLs to use proper server endpoints
3. Update `ncrun -Test` to open testing suite via web server URL
4. Fix event handler to handle programmatic calls

### **Acceptance Criteria**
- [x] Testing suite loads via `http://localhost:9090/testing/` URL
- [x] Host token generation works without CORS errors
- [x] No JavaScript errors in browser console
- [x] `ncrun -Test` opens both app and testing suite correctly

## **RESOLUTION COMPLETED ✅**
**Date:** September 11, 2025  
**Status:** VERIFIED WORKING

**Final Implementation:**
1. Added explicit route mapping in `Program.cs` for `/testing` endpoint
2. Testing suite now properly served via ASP.NET Core web server
3. All API calls work without CORS restrictions (same origin)
4. `ncrun -Test` successfully launches both application and testing suite
5. Host token generation functional via `/api/hostprovisioner/generate`

**Result:** Issue completely resolved - testing suite fully integrated with NOOR Canvas web server

## **Dependencies**
- NOOR Canvas application must be running on localhost:9090/9091
- HostProvisionerController API must be functional
- Static file serving must be configured for `/testing/` path

## **Notes**
- Similar issues resolved in COMPLETED folder may provide guidance
- Testing suite should maintain all existing functionality after fix
- Consider making testing suite a proper Blazor component in future phases
