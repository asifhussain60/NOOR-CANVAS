# Issue-8: Testing Route AmbiguousMatchException

**Created:** September 11, 2025  
**Priority:** High  
**Category:** Bug  
**Status:** In Progress

## **Problem Description**

The `/testing` endpoint is throwing an AmbiguousMatchException indicating that multiple route handlers are matching the same URL pattern. This prevents the testing suite from loading properly.

**Error Details:**

- Exception: `AmbiguousMatchException: The request matched multiple endpoints. Matches: HTTP GET /testing HTTP GET /testing/ / Host`
- URL: `http://localhost:9090/testing`
- Impact: Testing suite completely inaccessible

## **Root Cause Analysis**

Multiple route mappings are conflicting:

1. Static file routing for `/testing/` directory
2. Explicit `MapGet("/testing")` route handler
3. Possible fallback routing conflicts

## **Impact Assessment**

- **Severity**: High - Blocks all testing functionality
- **User Experience**: Testing suite completely broken
- **Development Impact**: Cannot perform comprehensive testing

## **Reproduction Steps**

1. Start NOOR Canvas application (`ncrun -Test`)
2. Navigate to `http://localhost:9090/testing`
3. Observe AmbiguousMatchException error page

## **Expected Behavior**

- `/testing` should serve the testing suite HTML file without conflicts
- No routing ambiguity should exist

## **Resolution Framework**

### **Solution Options**

1. **Remove Duplicate Routes**: Eliminate redundant route mappings
2. **Use Static File Middleware**: Rely on static file serving for `/testing/` directory
3. **Consolidate Routing**: Use single route handler approach

### **Implementation Plan**

1. Review `Program.cs` for conflicting route mappings
2. Remove duplicate `/testing` and `/testing/` route handlers
3. Configure proper static file serving or single explicit route
4. Test routing resolution

### **Acceptance Criteria**

- [ ] `/testing` loads without AmbiguousMatchException
- [ ] Testing suite displays properly
- [ ] No routing conflicts in application logs
- [ ] `ncrun -Test` works end-to-end

## **Dependencies**

- Program.cs route configuration
- Static file middleware setup
- Testing suite HTML file location

## **Notes**

- This issue was introduced when adding explicit route mapping for `/testing`
- Need to choose between static file serving vs. explicit route handling
- Consider Route priorities and ordering
