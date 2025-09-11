# Issue-12: NC Test Suite Port 3000 Configuration Error

**Category:** Bug  
**Priority:** High  
**Status:** Not Started  
**Created:** September 11, 2025  

## **Problem Description**
The `nc -Test` command is incorrectly configured to serve the testing suite on port 3000 as a separate static file server, despite Issue-7 already resolving this by integrating the testing suite into the NOOR Canvas web server at `/testing/` route.

## **Current Incorrect Behavior**
1. `nc -Test` attempts to start a separate HTTP server on port 3000 for testing suite
2. Testing suite opens via `http://localhost:3000` instead of integrated `/testing/` route
3. Background job management for port 3000 server is failing
4. Port 3000 server jobs terminate before services fully start
5. User requested to use port 9091 for testing suite (HTTPS mode)

## **Expected Correct Behavior (Based on Issue-7 Resolution)**
1. `nc -Test` should only start the NOOR Canvas application (port 9090/9091)
2. Testing suite should be accessed via `http://localhost:9090/testing/` or `https://localhost:9091/testing/`
3. No separate port 3000 static file server required
4. Testing suite fully integrated with NOOR Canvas web server (same origin, no CORS issues)

## **Root Cause Analysis**
- **nc.ps1 Script Outdated**: The script wasn't updated after Issue-7 resolution
- **Documentation Mismatch**: Help text still references port 3000 static server
- **Background Job Issues**: Complex job management for dual servers causing failures
- **Architectural Regression**: Reverted back to separate server model instead of integrated solution

## **Impact Assessment**
- **High**: Test suite completely non-functional for users
- **Developer Experience**: Confusion about correct testing suite URL
- **Previous Work**: Negates the successful Issue-7 integration work
- **Port Conflicts**: Unnecessary complexity with multiple server management

## **Reproduction Steps**
1. Run `nc -Test` command
2. Observe attempt to start service on port 3000
3. Testing suite fails to respond on `http://localhost:3000/`
4. Background jobs fail to persist HTTP servers
5. User cannot access functional testing suite

## **Evidence from Thread History**
- User confirmed test suite should use port 9091 (HTTPS mode)
- Issue-7 was successfully resolved by serving via NOOR Canvas web server
- Previous working solution eliminated CORS issues and static file server complexity
- Current nc.ps1 script contains outdated port 3000 references

## **Resolution Framework**

### **Implementation Plan**
1. **Update nc.ps1 Help Text**: Change documentation to reflect integrated testing suite
2. **Remove Port 3000 Logic**: Eliminate separate static file server startup code
3. **Update Browser Opening**: Change from `localhost:3000` to `localhost:9091/testing/`
4. **Simplify Test Mode**: Only start NOOR Canvas application, not dual servers
5. **Verify Integration**: Ensure `/testing/` route is properly configured in application

### **Required Changes in nc.ps1**
- Line 39: Update help text from "Tests: http://localhost:3000" to "Tests: https://localhost:9091/testing/"
- Lines 130-180: Remove all port 3000 static server startup logic
- Line 195: Change browser opening from "http://localhost:3000" to testing route URL
- Lines 150-170: Remove testJob background job creation
- Update status reporting to reflect single integrated server

### **Acceptance Criteria**
- [ ] `nc -Test` starts only NOOR Canvas application on port 9091 (HTTPS)
- [ ] Testing suite accessible via `https://localhost:9091/testing/`
- [ ] No attempt to start separate port 3000 server
- [ ] Browser opens both main app and testing suite URLs correctly
- [ ] Background job management simplified (single application server)
- [ ] Help text accurately reflects integrated testing suite architecture

## **Dependencies**
- NOOR Canvas application must have `/testing/` route configured (from Issue-7)
- Static file serving must be properly configured for testing suite files
- No regression in Issue-7 resolution (testing suite integration)

## **Reference Issues**
- **Issue-7**: Testing Suite CORS/API Errors (COMPLETED) - Established integrated solution
- **Thread Context**: User explicitly requested port 9091 for test suite

## **Implementation Priority**
**High** - Blocks testing workflow and negates previous successful integration work

## **Notes**
- This represents a regression from the successful Issue-7 resolution
- Solution should align with existing integrated architecture, not separate server model
- User preference for HTTPS port 9091 should be respected in implementation
