# Issue 52: Host Controller SessionToken Validation Error

## Issue Details
- **Title**: Host Controller returning HTTP 400 validation error instead of control panel
- **Date Created**: September 13, 2025
- **Priority**: High (🔴)
- **Category**: Bug (🐛)
- **Status**: Not Started

## Problem Description
When accessing the host controller endpoints (likely `/api/host/dashboard`), instead of showing the host control panel, the system returns a JSON validation error:

```json
{
  "type":"https://tools.ietf.org/html/rfc9110#section-15.5.1",
  "title":"One or more validation errors occurred.",
  "status":400,
  "errors":{
    "sessionToken":["The sessionToken field is required."]
  },
  "traceId":"00-2a87859649787d69de3902561d6756e9-4e0771761c047434-00"
}
```

## Root Cause Analysis
- The error suggests that an endpoint is expecting a `sessionToken` parameter but it's not being provided
- This could be due to:
  1. Wrong HTTP method (GET vs POST)
  2. Missing route configuration for dashboard view
  3. Endpoint requiring authentication that's not being handled
  4. Model binding expecting sessionToken in request body/query

## Impact Assessment
- **User Experience**: Users cannot access host control panel
- **Functionality**: Blocks host session management workflow
- **Severity**: Prevents core host functionality from working

## Reproduction Steps
1. Start NOOR Canvas application
2. Navigate to host controller endpoint (e.g., `/api/host/dashboard`)
3. Observe HTTP 400 validation error instead of control panel UI

## Expected Behavior
- Host control panel should load with UI for managing sessions
- No validation errors for basic dashboard access

## Investigation Required
1. Review HostController endpoints and their HTTP methods
2. Check if dashboard endpoint should return a view vs JSON
3. Verify routing configuration for host control panel
4. Examine model binding requirements

## Resolution Framework
- [ ] Identify the specific endpoint causing the error
- [ ] Determine if endpoint should accept GET requests without sessionToken
- [ ] Fix routing or model binding as needed
- [ ] Add proper error handling for missing parameters
- [ ] Test host control panel accessibility

## Acceptance Criteria
- [ ] Host control panel loads without validation errors
- [ ] Appropriate endpoints handle GET requests properly
- [ ] Error messages are user-friendly for actual validation failures
- [ ] Host session management workflow is functional

## Related Issues
- May be related to authentication/authorization implementation
- Could be connected to route configuration issues
